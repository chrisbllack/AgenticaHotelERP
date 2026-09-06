// Unit tests for the backend domain core (src/convex/lib.ts):
// money math, date logic, interval algebra, and the availability engine
// that guards the booking site against overbooking.
// Run with: bun test

import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "../convex/_generated/dataModel";
import {
  addDaysISO,
  computeAvailability,
  diffNights,
  mulKobo,
  overlaps,
  parseISODate,
  pctKobo,
  toKobo,
} from "../convex/lib";

// ── builders ─────────────────────────────────────────────────────────────

const PROPERTY = "prop-1" as Id<"properties">;

let rtSeq = 0;
function roomType(overrides: Partial<Doc<"roomTypes">> = {}): Doc<"roomTypes"> {
  rtSeq += 1;
  return {
    _id: `rt-${rtSeq}` as Id<"roomTypes">,
    _creationTime: 0,
    propertyId: PROPERTY,
    code: "STD",
    name: "Standard Room",
    description: "",
    basePriceKobo: 2_500_000,
    maxOccupancy: 2,
    bedType: "King",
    sizeSqm: 28,
    amenities: [],
    ...overrides,
  } as Doc<"roomTypes">;
}

let roomSeq = 0;
function room(overrides: Partial<Doc<"rooms">> = {}): Doc<"rooms"> {
  roomSeq += 1;
  return {
    _id: `room-${roomSeq}` as Id<"rooms">,
    _creationTime: 0,
    propertyId: PROPERTY,
    number: String(roomSeq).padStart(3, "0"),
    roomTypeId: "rt-1" as Id<"roomTypes">,
    floorId: "floor-1" as Id<"floors">,
    status: "vacant_clean",
    hkStatus: "clean",
    ...overrides,
  } as Doc<"rooms">;
}

type ActiveReservation = Pick<Doc<"reservations">, "roomTypeId" | "checkInDate" | "checkOutDate" | "status">;

function reservation(roomTypeId: string, checkIn: string, checkOut: string, status = "confirmed"): ActiveReservation {
  return { roomTypeId: roomTypeId as Id<"roomTypes">, checkInDate: checkIn, checkOutDate: checkOut, status };
}

let blockSeq = 0;
function block(roomTypeId: string, startDate: string, endDate: string, quantity = 1): Doc<"roomBlocks"> {
  blockSeq += 1;
  return {
    _id: `block-${blockSeq}` as Id<"roomBlocks">,
    _creationTime: 0,
    propertyId: PROPERTY,
    roomTypeId: roomTypeId as Id<"roomTypes">,
    startDate,
    endDate,
    quantity,
    reason: "maintenance",
  };
}

let planSeq = 0;
function ratePlan(overrides: Partial<Doc<"ratePlans">> = {}): Doc<"ratePlans"> {
  planSeq += 1;
  return {
    _id: `plan-${planSeq}` as Id<"ratePlans">,
    _creationTime: 0,
    propertyId: PROPERTY,
    roomTypeId: "rt-1" as Id<"roomTypes">,
    code: "STD-BB",
    name: "Standard B&B",
    priceKobo: 2_500_000,
    includesBreakfast: true,
    refundable: true,
    minNights: 1,
    active: true,
    ...overrides,
  } as Doc<"ratePlans">;
}

// ── money math (integer kobo, exact) ─────────────────────────────────────

describe("money helpers", () => {
  test("toKobo converts naira without float drift", () => {
    expect(toKobo(25_000)).toBe(2_500_000);
    expect(toKobo(0.1 + 0.2)).toBe(30); // 0.30000000000000004 → 30 kobo, not 29
    expect(toKobo(18750)).toBe(1_875_000);
  });

  test("mulKobo computes qty × unit exactly", () => {
    expect(mulKobo(3, 2_500_000)).toBe(7_500_000);
    expect(mulKobo(0, 2_500_000)).toBe(0);
    expect(mulKobo(13, 15_000_000)).toBe(195_000_000);
  });

  test("pctKobo rounds to the nearest kobo", () => {
    expect(pctKobo(1_000_000, 0.075)).toBe(75_000);
    expect(pctKobo(2_500_000, 0.2)).toBe(500_000); // 20% deposit
    expect(pctKobo(1, 0.075)).toBe(0); // rounds down, never floats
  });
});

// ── date logic ───────────────────────────────────────────────────────────

describe("date helpers", () => {
  test("parseISODate accepts valid dates", () => {
    expect(parseISODate("2026-09-05")).toBe(Date.parse("2026-09-05T00:00:00Z"));
  });

  test("parseISODate rejects malformed input", () => {
    expect(() => parseISODate("05-09-2026")).toThrow();
    expect(() => parseISODate("2026-13-40")).toThrow();
    expect(() => parseISODate("")).toThrow();
  });

  test("diffNights counts hotel nights (checkout − checkin)", () => {
    expect(diffNights("2026-09-05", "2026-09-06")).toBe(1);
    expect(diffNights("2026-09-05", "2026-09-12")).toBe(7);
    expect(diffNights("2026-09-05", "2026-09-05")).toBe(0);
  });

  test("addDaysISO crosses month boundaries", () => {
    expect(addDaysISO("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-09-05", 0)).toBe("2026-09-05");
  });
});

// ── interval algebra ─────────────────────────────────────────────────────

describe("overlaps (half-open intervals)", () => {
  test("intersecting stays overlap", () => {
    expect(overlaps("2026-09-05", "2026-09-10", "2026-09-08", "2026-09-12")).toBe(true);
    expect(overlaps("2026-09-05", "2026-09-10", "2026-09-01", "2026-09-06")).toBe(true);
    expect(overlaps("2026-09-05", "2026-09-10", "2026-09-01", "2026-09-15")).toBe(true);
  });

  test("back-to-back stays do NOT overlap (checkout day is sellable)", () => {
    expect(overlaps("2026-09-05", "2026-09-10", "2026-09-10", "2026-09-12")).toBe(false);
    expect(overlaps("2026-09-10", "2026-09-12", "2026-09-05", "2026-09-10")).toBe(false);
  });

  test("disjoint stays do not overlap", () => {
    expect(overlaps("2026-09-05", "2026-09-08", "2026-09-20", "2026-09-22")).toBe(false);
  });
});

// ── availability engine (overbooking guard) ──────────────────────────────

describe("computeAvailability", () => {
  const CI = "2026-10-06";
  const CO = "2026-10-08";

  test("all sellable rooms available with no bookings", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id }), room({ roomTypeId: rt._id }), room({ roomTypeId: rt._id })];
    const rows = computeAvailability([rt], rooms, [], [], [], CI, CO);
    expect(rows).toHaveLength(1);
    expect(rows[0].available).toBe(3);
    expect(rows[0].totalRooms).toBe(3);
    expect(rows[0].booked).toBe(0);
    expect(rows[0].blocked).toBe(0);
  });

  test("out-of-order rooms are excluded from sellable inventory", () => {
    const rt = roomType();
    const rooms = [
      room({ roomTypeId: rt._id }),
      room({ roomTypeId: rt._id, status: "out_of_order" }),
    ];
    const rows = computeAvailability([rt], rooms, [], [], [], CI, CO);
    expect(rows[0].totalRooms).toBe(1);
    expect(rows[0].available).toBe(1);
  });

  test("overlapping reservation consumes exactly one unit", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id }), room({ roomTypeId: rt._id })];
    const rows = computeAvailability([rt], rooms, [reservation(rt._id as string, "2026-10-07", "2026-10-09")], [], [], CI, CO);
    expect(rows[0].booked).toBe(1);
    expect(rows[0].available).toBe(1);
  });

  test("back-to-back reservations do not consume inventory", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id })];
    const rows = computeAvailability(
      [rt], rooms,
      [reservation(rt._id as string, "2026-10-04", CI)], // checks out on CI
      [], [], CI, CO,
    );
    expect(rows[0].booked).toBe(0);
    expect(rows[0].available).toBe(1);
  });

  test("cancelled and no-show reservations never consume inventory", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id })];
    const rows = computeAvailability(
      [rt], rooms,
      [
        reservation(rt._id as string, CI, CO, "cancelled"),
        reservation(rt._id as string, CI, CO, "no_show"),
      ],
      [], [], CI, CO,
    );
    expect(rows[0].booked).toBe(0);
    expect(rows[0].available).toBe(1);
  });

  test("pending reservations hold inventory (OTA-style)", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id })];
    const rows = computeAvailability([rt], rooms, [reservation(rt._id as string, CI, CO, "pending")], [], [], CI, CO);
    expect(rows[0].available).toBe(0);
  });

  test("room blocks reduce availability on top of bookings", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id }), room({ roomTypeId: rt._id }), room({ roomTypeId: rt._id })];
    const rows = computeAvailability(
      [rt], rooms,
      [reservation(rt._id as string, CI, CO)],
      [block(rt._id as string, "2026-10-01", "2026-10-07", 1)],
      [], CI, CO,
    );
    expect(rows[0].booked).toBe(1);
    expect(rows[0].blocked).toBe(1);
    expect(rows[0].available).toBe(1);
  });

  test("blocks outside the stay window have no effect", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id })];
    const rows = computeAvailability(
      [rt], rooms, [],
      [block(rt._id as string, "2026-10-08", "2026-10-10", 1)], // starts on CO
      [], CI, CO,
    );
    expect(rows[0].blocked).toBe(0);
    expect(rows[0].available).toBe(1);
  });

  test("availability clamps at zero — never negative", () => {
    const rt = roomType();
    const rooms = [room({ roomTypeId: rt._id })];
    const rows = computeAvailability(
      [rt], rooms,
      [reservation(rt._id as string, CI, CO), reservation(rt._id as string, CI, CO)],
      [block(rt._id as string, CI, CO, 1)],
      [], CI, CO,
    );
    expect(rows[0].available).toBe(0); // over-committed, but never -1
  });

  test("cheapest active rate plan wins pricing", () => {
    const rt = roomType({ basePriceKobo: 2_500_000 });
    const plans = [
      ratePlan({ roomTypeId: rt._id, priceKobo: 2_500_000, code: "STD-BB" }),
      ratePlan({ roomTypeId: rt._id, priceKobo: 2_250_000, code: "STD-RO", includesBreakfast: false }),
      ratePlan({ roomTypeId: rt._id, priceKobo: 3_000_000, code: "STD-XXX", active: false }), // inactive, ignored
    ];
    const rooms = [room({ roomTypeId: rt._id })];
    const rows = computeAvailability([rt], rooms, [], [], plans, CI, CO);
    expect(rows[0].rateKobo).toBe(2_250_000);
  });

  test("falls back to base price when no active plans exist", () => {
    const rt = roomType({ basePriceKobo: 4_000_000 });
    const rooms = [room({ roomTypeId: rt._id })];
    const rows = computeAvailability([rt], rooms, [], [], [], CI, CO);
    expect(rows[0].rateKobo).toBe(4_000_000);
    expect(rows[0].ratePlanId).toBeNull();
  });

  test("room types are returned cheapest-first for the search page", () => {
    const premium = roomType({ code: "PRM", basePriceKobo: 15_000_000 });
    const standard = roomType({ code: "STD", basePriceKobo: 2_500_000 });
    const rows = computeAvailability([premium, standard], [], [], [], [], CI, CO);
    expect(rows.map((r) => r.code)).toEqual(["STD", "PRM"]);
  });
});
