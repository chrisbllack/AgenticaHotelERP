// M-LOD / M-DST — public booking engine.
// Powers the integrated hotel booking website and feeds the console.
//
// Public surface (unauthenticated, via http.ts):
//   GET  /public/availability
//   GET  /public/booking/:code
//   POST /public/bookings          (create booking)
//
// Console surface (app-authenticated queries):
//   booking.publicAvailability, booking.getPublicBooking, booking.listWebsiteBookings
//   booking.ensureSeeded — call once from the app shell before public flows.

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import {
  NGN, computeAvailability, diffNights, mulKobo, pctKobo, parseISODate, todayPropertyLocal,
} from "./lib";
import type { AvailabilityRow } from "./lib";

const isoDate = v.string();

const ACTIVE_STATUSES = ["pending", "confirmed", "checked_in"];

// ── Same-module data helpers (no internal() self-references) ─────────────

async function loadAvailability(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  checkIn: string,
  checkOut: string,
): Promise<AvailabilityRow[]> {
  const [roomTypes, rooms, reservations, blocks, ratePlans] = await Promise.all([
    ctx.db.query("roomTypes").withIndex("by_property", (q) => q.eq("propertyId", propertyId)).collect(),
    ctx.db.query("rooms").withIndex("by_property", (q) => q.eq("propertyId", propertyId)).collect(),
    ctx.db.query("reservations").withIndex("by_property", (q) => q.eq("propertyId", propertyId)).collect(),
    ctx.db.query("roomBlocks").withIndex("by_property", (q) => q.eq("propertyId", propertyId)).collect(),
    ctx.db.query("ratePlans").withIndex("by_property", (q) => q.eq("propertyId", propertyId)).collect(),
  ]);
  return computeAvailability(roomTypes, rooms, reservations, blocks, ratePlans, checkIn, checkOut);
}

async function primaryProperty(ctx: QueryCtx): Promise<Doc<"properties"> | null> {
  return (await ctx.db.query("properties").withIndex("by_pk", (q) => q.eq("pk", "grand-palm-lagos")).unique()) ?? null;
}

async function reservationByCode(ctx: QueryCtx, propertyId: Id<"properties">, code: string) {
  return ctx.db
    .query("reservations")
    .withIndex("by_property_code", (q) => q.eq("propertyId", propertyId).eq("code", code.trim().toUpperCase()))
    .unique();
}

// ── Public availability ──────────────────────────────────────────────────
export const availabilityInternal = internalQuery({
  args: { propertyId: v.id("properties"), checkIn: isoDate, checkOut: isoDate },
  handler: async (ctx, { propertyId, checkIn, checkOut }): Promise<AvailabilityRow[]> =>
    loadAvailability(ctx, propertyId, checkIn, checkOut),
});

export const publicAvailability = query({
  args: { checkIn: isoDate, checkOut: isoDate },
  handler: async (ctx, { checkIn, checkOut }): Promise<AvailabilityRow[]> => {
    validateStay(checkIn, checkOut);
    const property = await primaryProperty(ctx);
    if (!property) return [];
    return loadAvailability(ctx, property._id, checkIn, checkOut);
  },
});

// ── Booking creation ─────────────────────────────────────────────────────
export interface CreateBookingResult {
  code: string;
  reservationId: Id<"reservations">;
  totalKobo: number;
  depositKobo: number;
  nightlyKobo: number;
  nights: number;
  currency: string;
}

export const createBooking = mutation({
  args: {
    checkIn: isoDate,
    checkOut: isoDate,
    roomTypeCode: v.string(),
    ratePlanCode: v.optional(v.string()),
    adults: v.number(),
    children: v.number(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    country: v.optional(v.string()),
    specialRequests: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateBookingResult> => {
    validateStay(args.checkIn, args.checkOut);
    if (!args.firstName.trim()) throw new ConvexError("First name is required");
    if (!args.lastName.trim()) throw new ConvexError("Last name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) throw new ConvexError("A valid email is required");
    if (!args.phone.trim()) throw new ConvexError("Phone number is required");

    const propertyId: Id<"properties"> = await ctx.runMutation(internal.lib.ensureSeed, {});
    const rows = await loadAvailability(ctx, propertyId, args.checkIn, args.checkOut);
    const row = rows.find((r) => r.code === args.roomTypeCode);
    if (!row) throw new ConvexError(`Unknown room type "${args.roomTypeCode}"`);
    if (row.available < 1) throw new ConvexError("Sorry — that room type just sold out for your dates");
    if (args.adults < 1) throw new ConvexError("At least one adult is required");
    if (args.adults + args.children > row.maxOccupancy) {
      throw new ConvexError(`${row.name} sleeps up to ${row.maxOccupancy} guests`);
    }

    const planDoc = args.ratePlanCode ? await ratePlanByCode(ctx, args.ratePlanCode) : null;
    const ratePlanId: Id<"ratePlans"> | undefined = planDoc ? planDoc._id : row.ratePlanId ?? undefined;
    const plan = ratePlanId ? await ctx.db.get(ratePlanId) : null;
    if (args.ratePlanCode && !plan) throw new ConvexError(`Unknown rate plan "${args.ratePlanCode}"`);
    if (plan && plan.minNights > diffNights(args.checkIn, args.checkOut)) {
      throw new ConvexError(`${plan.name} requires at least ${plan.minNights} nights`);
    }

    const nights = diffNights(args.checkIn, args.checkOut);
    const nightly = plan ? plan.priceKobo : row.rateKobo;
    const totalKobo = mulKobo(nights, nightly);

    // Upsert guest by email
    const email = args.email.trim().toLowerCase();
    let guestId: Id<"guests">;
    const existing = await ctx.db
      .query("guests")
      .withIndex("by_property_email", (q) => q.eq("propertyId", propertyId).eq("email", email))
      .unique();
    if (existing) {
      guestId = existing._id;
      await ctx.db.patch(existing._id, { phone: args.phone, country: args.country ?? existing.country });
    } else {
      guestId = await ctx.db.insert("guests", {
        propertyId,
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        email,
        phone: args.phone.trim(),
        country: args.country,
        vip: false,
        blacklisted: false,
        createdAt: Date.now(),
      });
    }

    const n: number = await ctx.runQuery(internal.lib.nextSeq, { propertyId, key: "reservation" });
    const code = `RSV-${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
    const reservationId: Id<"reservations"> = await ctx.db.insert("reservations", {
      propertyId,
      code,
      guestId,
      roomTypeId: row.roomTypeId,
      ratePlanId,
      status: "pending",
      source: "website",
      checkInDate: args.checkIn,
      checkOutDate: args.checkOut,
      nights,
      adults: args.adults,
      children: args.children,
      roomsCount: 1,
      nightlyRateKobo: nightly,
      totalKobo,
      paidKobo: 0,
      paymentStatus: "unpaid",
      specialRequests: args.specialRequests,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      propertyId,
      actorName: `${args.firstName} ${args.lastName}`.trim() || "website guest",
      action: "reservation.created",
      entity: "reservation",
      entityId: code,
      severity: "info",
      details: { source: "website", roomType: row.code, nights, totalKobo },
      at: Date.now(),
    });

    return {
      code,
      reservationId,
      totalKobo,
      depositKobo: pctKobo(totalKobo, 0.2),
      nightlyKobo: nightly,
      nights,
      currency: NGN,
    };
  },
});

// ── Booking lookup / cancel ──────────────────────────────────────────────
export interface PublicBookingView {
  code: string;
  status: string;
  source: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  roomTypeName: string;
  ratePlanName: string | null;
  roomNumber: string | null;
  nightlyRateKobo: number;
  totalKobo: number;
  paidKobo: number;
  paymentStatus: string;
  guestName: string;
  guestEmail: string;
}

export const getPublicBooking = query({
  args: { code: v.string() },
  handler: async (ctx, { code }): Promise<PublicBookingView | null> => {
    const property = await primaryProperty(ctx);
    if (!property) return null;
    const res = await reservationByCode(ctx, property._id, code);
    if (!res) return null;
    const [guest, roomType, plan, assignment] = await Promise.all([
      ctx.db.get(res.guestId),
      ctx.db.get(res.roomTypeId),
      res.ratePlanId ? ctx.db.get(res.ratePlanId) : Promise.resolve(null),
      ctx.db.query("roomAssignments").withIndex("by_reservation", (q) => q.eq("reservationId", res._id)).unique(),
    ]);
    const room = assignment ? await ctx.db.get(assignment.roomId) : null;
    return {
      code: res.code,
      status: res.status,
      source: res.source,
      checkInDate: res.checkInDate,
      checkOutDate: res.checkOutDate,
      nights: res.nights,
      adults: res.adults,
      children: res.children,
      roomTypeName: roomType?.name ?? "",
      ratePlanName: plan?.name ?? null,
      roomNumber: room?.number ?? null,
      nightlyRateKobo: res.nightlyRateKobo,
      totalKobo: res.totalKobo,
      paidKobo: res.paidKobo,
      paymentStatus: res.paymentStatus,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : "",
      guestEmail: guest?.email ?? "",
    };
  },
});

export const cancelBooking = mutation({
  args: { code: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, { code, reason }): Promise<{ ok: boolean }> => {
    const propertyId: Id<"properties"> = await ctx.runMutation(internal.lib.ensureSeed, {});
    const res = await reservationByCode(ctx, propertyId, code);
    if (!res) throw new ConvexError("Booking not found");
    if (res.status === "cancelled") return { ok: true };
    if (res.status === "checked_in" || res.status === "checked_out") {
      throw new ConvexError("This stay is already in progress — contact the front desk");
    }
    await ctx.db.patch(res._id, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancellationReason: reason ?? "Cancelled by guest on website",
    });
    await ctx.db.insert("auditLogs", {
      propertyId,
      actorName: "website guest",
      action: "reservation.cancelled",
      entity: "reservation",
      entityId: res.code,
      severity: "info",
      details: { source: "website" },
      at: Date.now(),
    });
    return { ok: true };
  },
});

// ── Console: live website bookings ───────────────────────────────────────
export interface WebsiteBookingRow {
  _id: Id<"reservations">;
  code: string;
  status: string;
  guestName: string;
  guestEmail: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalKobo: number;
  paidKobo: number;
  paymentStatus: string;
  createdAt: number;
}

export const listWebsiteBookings = query({
  args: {},
  handler: async (ctx): Promise<WebsiteBookingRow[]> => {
    const property = await primaryProperty(ctx);
    if (!property) return [];
    const rows = await ctx.db
      .query("reservations")
      .withIndex("by_property", (q) => q.eq("propertyId", property._id))
      .order("desc")
      .take(200);
    const site = rows.filter((r) => r.source === "website");
    return Promise.all(
      site.map(async (r): Promise<WebsiteBookingRow> => {
        const [guest, roomType] = await Promise.all([ctx.db.get(r.guestId), ctx.db.get(r.roomTypeId)]);
        return {
          _id: r._id,
          code: r.code,
          status: r.status,
          guestName: guest ? `${guest.firstName} ${guest.lastName}` : "",
          guestEmail: guest?.email ?? "",
          roomTypeName: roomType?.name ?? "",
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
          nights: r.nights,
          totalKobo: r.totalKobo,
          paidKobo: r.paidKobo,
          paymentStatus: r.paymentStatus,
          createdAt: r.createdAt,
        };
      }),
    );
  },
});

/** Explicit seed entry point for the frontend (queries can't seed). */
export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean }> => {
    await ctx.runMutation(internal.lib.ensureSeed, {});
    return { ok: true };
  },
});

/** Internal target for http.ts availability route. */
export const availabilityForHttp = internalQuery({
  args: { checkIn: isoDate, checkOut: isoDate },
  handler: async (ctx, { checkIn, checkOut }): Promise<AvailabilityRow[]> => {
    const property = await primaryProperty(ctx);
    if (!property) return [];
    return loadAvailability(ctx, property._id, checkIn, checkOut);
  },
});

// ── helpers ──────────────────────────────────────────────────────────────
function validateStay(checkIn: string, checkOut: string): void {
  const today = todayPropertyLocal();
  if (parseISODate(checkOut) <= parseISODate(checkIn)) {
    throw new ConvexError("Check-out must be after check-in");
  }
  if (parseISODate(checkIn) < parseISODate(today)) {
    throw new ConvexError("Check-in cannot be in the past");
  }
}

async function ratePlanByCode(ctx: QueryCtx, code: string): Promise<Doc<"ratePlans"> | null> {
  // Rate plans are few; linear scan avoids a schema migration for this lookup.
  const all = await ctx.db.query("ratePlans").collect();
  return all.find((p) => p.code === code) ?? null;
}

export const bookingCounts = query({
  args: {},
  handler: async (ctx): Promise<{ total: number; website: number; active: number; arrivalsToday: number }> => {
    const property = await primaryProperty(ctx);
    if (!property) return { total: 0, website: 0, active: 0, arrivalsToday: 0 };
    const all = await ctx.db.query("reservations").withIndex("by_property", (q) => q.eq("propertyId", property._id)).collect();
    const today = todayPropertyLocal();
    return {
      total: all.length,
      website: all.filter((r) => r.source === "website").length,
      active: all.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
      arrivalsToday: all.filter((r) => r.checkInDate === today && ACTIVE_STATUSES.includes(r.status)).length,
    };
  },
});
