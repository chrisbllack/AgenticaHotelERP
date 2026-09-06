// M-LOD booking website — post-booking confirmation & management view.

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { BadgeCheck, CalendarX2, Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { BookingShell } from "./BookingShell";
import { BOOKING_ENABLED, fmtKobo, useEnsureSeeded } from "../../lib/booking-client";

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  pending: { label: "Awaiting confirmation", tone: "border-amber-400/40 bg-amber-500/10 text-amber-200" },
  confirmed: { label: "Confirmed", tone: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" },
  checked_in: { label: "Checked in", tone: "border-sky-400/40 bg-sky-500/10 text-sky-200" },
  checked_out: { label: "Completed", tone: "border-brand-400/40 bg-brand-500/10 text-brand-100" },
  cancelled: { label: "Cancelled", tone: "border-rose-400/40 bg-rose-500/10 text-rose-200" },
  no_show: { label: "No-show", tone: "border-rose-400/40 bg-rose-500/10 text-rose-200" },
};

export default function ConfirmationPage() {
  const [params] = useSearchParams();
  const code = params.get("code") ?? "";
  const { ready } = useEnsureSeeded(BOOKING_ENABLED);

  const booking = useQuery(
    api.booking.getPublicBooking,
    BOOKING_ENABLED && ready && code ? { code } : "skip",
  );

  const cancelBooking = useMutation(api.booking.cancelBooking);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!code) {
    return (
      <BookingShell>
        <Missing />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <section className="mx-auto max-w-2xl px-5 py-14">
        {!BOOKING_ENABLED || !ready || booking === undefined ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm text-brand-200/60">
            <Loader2 size={18} className="animate-spin" /> Loading your booking…
          </div>
        ) : booking === null ? (
          <div className="rounded-2xl border border-brand-800/70 bg-brand-900/40 p-10 text-center shadow-panel">
            <h1 className="font-display text-2xl">Booking not found</h1>
            <p className="mt-2 text-sm text-brand-200/60">
              We couldn't find a booking with code <span className="font-mono text-gold-300">{code}</span>.
            </p>
            <Link to="/book" className="mt-6 inline-block rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-950 hover:bg-gold-400">
              Start a new booking
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40">
                <BadgeCheck size={30} className="text-emerald-300" />
              </div>
              <h1 className="mt-5 font-display text-3xl">Thank you, {booking.guestName.split(" ")[0] || "guest"}!</h1>
              <p className="mt-2 text-sm text-brand-100/70">
                Your booking is {STATUS_COPY[booking.status]?.label.toLowerCase() ?? booking.status}.
                A confirmation has been recorded for <span className="text-brand-50">{booking.guestEmail}</span>.
              </p>
              <p className="mt-4 inline-block rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 font-mono text-lg text-gold-300">
                {booking.code}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-brand-800/70 bg-brand-900/40 p-6 shadow-panel">
              <h2 className="font-display text-lg">Stay summary</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Item k="Room" v={booking.roomTypeName} />
                <Item k="Rate plan" v={booking.ratePlanName ?? "Standard"} />
                <Item k="Check-in" v={booking.checkInDate} />
                <Item k="Check-out" v={booking.checkOutDate} />
                <Item k="Nights" v={String(booking.nights)} />
                <Item k="Guests" v={`${booking.adults} adult${booking.adults > 1 ? "s" : ""}${booking.children ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}`} />
                <Item k="Room" v={booking.roomNumber ? `Assigned: ${booking.roomNumber}` : "Assigned at check-in"} />
                <Item k="Total" v={fmtKobo(booking.totalKobo)} />
              </dl>
              <div className="mt-5 flex items-center justify-between border-t border-brand-800/70 pt-4">
                <div>
                  <p className="text-xs text-brand-200/60">Payment</p>
                  <p className="mt-0.5 text-sm font-medium capitalize text-brand-50">
                    {booking.paymentStatus} · {fmtKobo(booking.paidKobo)} paid
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COPY[booking.status]?.tone ?? ""}`}>
                  {STATUS_COPY[booking.status]?.label ?? booking.status}
                </span>
              </div>
            </div>

            {error ? <p className="mt-4 text-center text-sm text-rose-300">{error}</p> : null}

            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <Link to="/book" className="text-sm text-brand-200/70 transition hover:text-gold-300">
                ← Book another stay
              </Link>
              {booking.status === "pending" || booking.status === "confirmed" ? (
                <button
                  onClick={async () => {
                    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
                    setCancelling(true);
                    setError(null);
                    try {
                      await cancelBooking({ code });
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not cancel the booking.");
                    } finally {
                      setCancelling(false);
                    }
                  }}
                  disabled={cancelling}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : <CalendarX2 size={14} />}
                  Cancel booking
                </button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </BookingShell>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-brand-200/60">{k}</dt>
      <dd className="mt-0.5 text-sm font-medium text-brand-50">{v}</dd>
    </div>
  );
}

function Missing() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="font-display text-2xl">No booking code</h1>
      <p className="mt-2 text-sm text-brand-200/60">Use the lookup form to find your stay, or start a new booking.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/book" className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-950 hover:bg-gold-400">New booking</Link>
        <Link to="/booking/lookup" className="rounded-lg border border-brand-700 px-5 py-2.5 text-sm text-brand-100 hover:border-brand-500">Find my booking</Link>
      </div>
    </div>
  );
}
