// M-LOD booking website — integrated, Convex-backed hotel booking flow.
// Route /book · SearchBar (dates/guests) + live availability from backend.

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { CalendarDays, ChevronRight, Loader2, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { BookingShell } from "./BookingShell";
import { BOOKING_ENABLED, fmtKobo, useEnsureSeeded } from "../../lib/booking-client";
import { todayISO } from "../../lib/utils";

function SearchBar({
  checkIn, checkOut, adults, busy,
  onCheckIn, onCheckOut, onAdults, onSearch,
}: {
  checkIn: string; checkOut: string; adults: number; busy: boolean;
  onCheckIn: (v: string) => void; onCheckOut: (v: string) => void;
  onAdults: (v: number) => void; onSearch: () => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-700/70 bg-brand-900/70 p-4 shadow-panel backdrop-blur">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-brand-200/60"><CalendarDays size={12} /> Check-in</span>
          <input
            type="date"
            min={todayISO}
            value={checkIn}
            onChange={(e) => onCheckIn(e.target.value)}
            className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60 [color-scheme:dark]"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-brand-200/60"><CalendarDays size={12} /> Check-out</span>
          <input
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(e) => onCheckOut(e.target.value)}
            className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60 [color-scheme:dark]"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-brand-200/60"><Users size={12} /> Guests</span>
          <select
            value={adults}
            onChange={(e) => onAdults(Number(e.target.value))}
            className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </label>
        <button
          onClick={onSearch}
          disabled={busy}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2.5 text-sm font-semibold text-brand-950 transition hover:from-gold-400 hover:to-gold-500 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : null} Check availability
        </button>
      </div>
    </div>
  );
}

export default function BookPage() {
  const [params] = useSearchParams();

  const [checkIn, setCheckIn] = useState(params.get("checkIn") ?? todayISO);
  const [checkOut, setCheckOut] = useState(params.get("checkOut") ?? addDays(params.get("checkIn") ?? todayISO, 2));
  const [adults, setAdults] = useState(Number(params.get("adults") ?? 2));
  const [submitted, setSubmitted] = useState({ checkIn, checkOut, adults });
  const [error, setError] = useState<string | null>(null);

  const { ready } = useEnsureSeeded(BOOKING_ENABLED);

  const availability = useQuery(
    api.booking.publicAvailability,
    BOOKING_ENABLED && ready && validRange(submitted.checkIn, submitted.checkOut)
      ? { checkIn: submitted.checkIn, checkOut: submitted.checkOut }
      : "skip",
  );

  const rows = useMemo(() => availability ?? [], [availability]);
  const nights = nightsBetween(submitted.checkIn, submitted.checkOut);

  const search = () => {
    setError(null);
    if (!validRange(checkIn, checkOut)) {
      setError("Check-out must be after check-in.");
      return;
    }
    setSubmitted({ checkIn, checkOut, adults });
  };

  return (
    <BookingShell>
      {/* Compact hero with embedded search */}
      <section className="relative overflow-hidden border-b border-brand-800/60">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 py-14">
          <h1 className="font-display text-3xl sm:text-4xl">
            Book your stay at <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">Grand Palm</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-brand-100/70">
            Live availability from the hotel's inventory — what you see is what the front desk sees.
          </p>
          <div className="mt-8">
            <SearchBar
              checkIn={checkIn} checkOut={checkOut} adults={adults}
              busy={availability === undefined && !!ready}
              onCheckIn={setCheckIn} onCheckOut={setCheckOut} onAdults={setAdults}
              onSearch={search}
            />
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          </div>
        </div>
      </section>

      {/* Availability results */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl">Available rooms</h2>
            <p className="mt-1 text-sm text-brand-200/60">
              {nights} night{nights === 1 ? "" : "s"} · {submitted.adults} guest{submitted.adults > 1 ? "s" : ""}
              {nights > 0 && rows.length > 0 ? ` · taxes & charges calculated at checkout` : ""}
            </p>
          </div>
        </div>

        {!BOOKING_ENABLED ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Live booking is connecting to the property database… If this message persists, the Convex deployment URL is not configured.
          </div>
        ) : !ready || availability === undefined ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl border border-brand-800/70 bg-brand-900/40" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-brand-800/70 bg-brand-900/40 p-8 text-center text-sm text-brand-200/60">
            No room types configured for this property yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((r) => {
              const soldOut = r.available < 1;
              const fitsGuests = r.maxOccupancy >= submitted.adults;
              return (
                <div
                  key={r.roomTypeId}
                  className="grid gap-4 rounded-xl border border-brand-800/70 bg-brand-900/40 p-5 shadow-panel transition-colors hover:border-brand-600 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg">{r.name}</h3>
                      <span className="rounded-full border border-brand-700 bg-brand-950/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-200/70">
                        {r.bedType} · {r.maxOccupancy} guests
                      </span>
                      {r.available <= 2 && !soldOut ? (
                        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                          Only {r.available} left
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm text-brand-100/70">{r.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.amenities.slice(0, 6).map((a) => (
                        <span key={a} className="rounded-full bg-brand-800/50 px-2 py-0.5 text-[11px] text-brand-100/70">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between gap-3 border-t border-brand-800/60 pt-4 sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <div className="text-right">
                      <p className="font-display text-2xl text-gold-400">{fmtKobo(r.rateKobo)}</p>
                      <p className="text-[11px] text-brand-200/50">per night{nights > 1 && !soldOut ? ` · ${fmtKobo(r.rateKobo * nights, true)} total` : ""}</p>
                    </div>
                    {soldOut ? (
                      <span className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200">Sold out</span>
                    ) : !fitsGuests ? (
                      <span className="rounded-lg border border-brand-800 bg-brand-950/60 px-4 py-2.5 text-xs text-brand-200/50">Sleeps {r.maxOccupancy}</span>
                    ) : (
                      <Link
                        to={`/book/guests?checkIn=${submitted.checkIn}&checkOut=${submitted.checkOut}&adults=${submitted.adults}&roomType=${r.code}`}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2.5 text-sm font-semibold text-brand-950 transition hover:from-gold-400 hover:to-gold-500"
                      >
                        Reserve <ChevronRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </BookingShell>
  );
}

// ── date utils (local) ───────────────────────────────────────────────────
function addDays(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

function nightsBetween(a: string, b: string): number {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
  return Math.max(0, Math.round((tb - ta) / 86_400_000));
}

function validRange(a: string, b: string): boolean {
  return nightsBetween(a, b) > 0;
}
