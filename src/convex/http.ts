import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Public HTTP surface (docs/API/openapi.yaml):
 *   GET  /public/availability?checkIn=…&checkOut=…
 *   POST /public/bookings                     (create booking)
 *   GET  /public/booking/:code
 *   POST /payments/initialize                 (start gateway checkout)
 *   POST /payments/verify/:reference          (client polls after Paystack redirect)
 *   POST /paystack/webhook                    (server-to-server payment confirmation)
 */

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function preflight() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

/** Parse a JSON body, mapping parse errors to a 400 response. */
async function readJson(request: Request): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; res: Response }> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return { ok: true, body };
  } catch {
    return { ok: false, res: jsonResponse(400, { error: "Invalid JSON body" }) };
  }
}

const http = httpRouter();

// ── Public availability ──────────────────────────────────────────────────
http.route({
  path: "/public/availability",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const checkIn = url.searchParams.get("checkIn");
    const checkOut = url.searchParams.get("checkOut");
    if (!checkIn || !checkOut) {
      return jsonResponse(400, { error: "checkIn and checkOut are required" });
    }
    try {
      const result = await ctx.runQuery(internal.booking.availabilityForHttp, { checkIn, checkOut });
      return jsonResponse(200, result);
    } catch (err) {
      return jsonResponse(400, { error: err instanceof Error ? err.message : String(err) });
    }
  }),
});

// ── Create booking (booking website) ─────────────────────────────────────
http.route({
  path: "/public/bookings",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const parsed = await readJson(request);
    if (!parsed.ok) return parsed.res;
    try {
      const b = parsed.body;
      const result = await ctx.runMutation(api.booking.createBooking, {
        checkIn: String(b.checkIn ?? ""),
        checkOut: String(b.checkOut ?? ""),
        roomTypeCode: String(b.roomTypeCode ?? ""),
        ratePlanCode: b.ratePlanCode === undefined ? undefined : String(b.ratePlanCode),
        adults: Number(b.adults ?? 1),
        children: Number(b.children ?? 0),
        firstName: String(b.firstName ?? ""),
        lastName: String(b.lastName ?? ""),
        email: String(b.email ?? ""),
        phone: String(b.phone ?? ""),
        country: b.country === undefined ? undefined : String(b.country),
        specialRequests: b.specialRequests === undefined ? undefined : String(b.specialRequests),
      });
      return jsonResponse(201, result);
    } catch (err) {
      return jsonResponse(400, { error: err instanceof Error ? err.message : String(err) });
    }
  }),
});

// ── Booking lookup ───────────────────────────────────────────────────────
http.route({
  pathPrefix: "/public/booking/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const code = new URL(request.url).pathname.split("/").pop();
    if (!code) return jsonResponse(400, { error: "Missing booking code" });
    try {
      const booking = await ctx.runQuery(api.booking.getPublicBooking, { code });
      if (!booking) return jsonResponse(404, { error: "Booking not found" });
      return jsonResponse(200, booking);
    } catch (err) {
      return jsonResponse(500, { error: String(err) });
    }
  }),
});

// ── Payment initialization (gateway or demo fallback) ────────────────────
http.route({
  path: "/payments/initialize",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const parsed = await readJson(request);
    if (!parsed.ok) return parsed.res;
    try {
      const b = parsed.body;
      const result = await ctx.runAction(api.payments.initializePayment, {
        code: String(b.code ?? ""),
        email: String(b.email ?? ""),
        amountKobo: Number(b.amountKobo ?? 0),
      });
      return jsonResponse(200, result);
    } catch (err) {
      return jsonResponse(400, { error: err instanceof Error ? err.message : String(err) });
    }
  }),
});

// ── Payment verification (client polls after gateway redirect) ───────────
http.route({
  pathPrefix: "/payments/verify/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const reference = new URL(request.url).pathname.split("/").pop();
    if (!reference) return jsonResponse(400, { error: "Missing reference" });
    try {
      const result = await ctx.runAction(internal.payments.verifyAndApply, { reference });
      return jsonResponse(200, result);
    } catch (err) {
      return jsonResponse(500, { error: String(err) });
    }
  }),
});

// ── Paystack webhook (server-to-server) ──────────────────────────────────
http.route({
  path: "/paystack/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const body = await request.text();
    try {
      const result = await ctx.runAction(internal.payments.handleWebhook, { signature, rawBody: body });
      return jsonResponse(result.ok ? 200 : 401, result);
    } catch (err) {
      return jsonResponse(500, { ok: false, error: String(err) });
    }
  }),
});

// ── CORS preflight for any public route ──────────────────────────────────
http.route({
  pathPrefix: "/",
  method: "OPTIONS",
  handler: httpAction(async () => preflight()),
});

export default http;
