// M-LOD booking website — guest details + payment step (route /book/guests).

import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useAction } from "convex/react";
import { AlertCircle, Loader2, Lock, ShieldCheck } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { BookingShell } from "./BookingShell";
import { BOOKING_ENABLED, useEnsureSeeded } from "../../lib/booking-client";

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States", "Other"];

export default function GuestDetailsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const adults = Number(params.get("adults") ?? 2);
  const roomType = params.get("roomType") ?? "";
  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", country: "Nigeria", specialRequests: "",
  });
  const [phase, setPhase] = useState<"form" | "creating" | "paying">("form");
  const [error, setError] = useState<string | null>(null);

  const createBooking = useMutation(api.booking.createBooking);
  const initializePayment = useAction(api.payments.initializePayment);
  useEnsureSeeded(BOOKING_ENABLED);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhase("creating");
    try {
      const booking = await createBooking({
        checkIn,
        checkOut,
        roomTypeCode: roomType,
        adults,
        children: 0,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        country: form.country || undefined,
        specialRequests: form.specialRequests || undefined,
      });
      setPhase("paying");
      const pay = await initializePayment({
        code: booking.code,
        email: form.email,
        amountKobo: booking.depositKobo,
      });
      if (pay.mode === "paystack" && pay.authorizationUrl) {
        window.location.href = pay.authorizationUrl;
        return;
      }
      // Demo mode (pay at front desk) — go straight to confirmation.
      navigate(`/booking/confirmation?code=${encodeURIComponent(booking.code)}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setPhase("form");
    }
  };

  if (!checkIn || !checkOut || !roomType || nights < 1) {
    return (
      <BookingShell>
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <AlertCircle className="mx-auto text-amber-300" size={28} />
          <h1 className="mt-4 font-display text-2xl">Missing booking details</h1>
          <p className="mt-2 text-sm text-brand-200/60">Start again by choosing your dates and room.</p>
          <Link to="/book" className="mt-6 inline-block rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-950 hover:bg-gold-400">
            Back to search
          </Link>
        </div>
      </BookingShell>
    );
  }

  const busy = phase !== "form";

  return (
    <BookingShell>
      <section className="mx-auto grid max-w-4xl gap-8 px-5 py-12 lg:grid-cols-[1fr_340px]">
        {/* Form */}
        <div>
          <h1 className="font-display text-2xl">Guest details</h1>
          <p className="mt-1 text-sm text-brand-200/60">Almost there — tell us who's staying.</p>

          {error ? (
            <div className="mt-5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          ) : null}

          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-brand-200/70">First name *</span>
              <input required value={form.firstName} onChange={set("firstName")}
                className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-brand-200/70">Last name *</span>
              <input required value={form.lastName} onChange={set("lastName")}
                className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-brand-200/70">Email *</span>
              <input required type="email" value={form.email} onChange={set("email")}
                className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-brand-200/70">Phone *</span>
              <input required value={form.phone} onChange={set("phone")} placeholder="+234…"
                className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-brand-200/70">Country</span>
              <select value={form.country} onChange={set("country")}
                className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60">
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-brand-200/70">Special requests</span>
              <textarea rows={3} value={form.specialRequests} onChange={set("specialRequests")}
                placeholder="Airport pickup, high floor, dietary needs…"
                className="w-full resize-none rounded-lg border border-brand-700 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none focus:border-gold-500/60" />
            </label>

            <button
              type="submit" disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3 text-sm font-semibold text-brand-950 transition hover:from-gold-400 hover:to-gold-500 disabled:opacity-60 sm:col-span-2"
            >
              {phase === "creating" ? <><Loader2 size={16} className="animate-spin" /> Creating your booking…</> : phase === "paying" ? <><Loader2 size={16} className="animate-spin" /> Opening secure payment…</> : <><Lock size={15} /> Confirm & pay deposit</>}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-brand-200/50 sm:col-span-2">
              <ShieldCheck size={13} className="text-gold-400" />
              Deposit charged securely. Balance settles at the front desk on arrival.
            </p>
          </form>
        </div>

        {/* Summary rail */}
        <aside className="h-fit rounded-2xl border border-gold-500/25 bg-brand-900/60 p-6 shadow-panel lg:sticky lg:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-500/80">Your stay</p>
          <p className="mt-3 font-display text-lg">{roomTypeLabel(roomType)}</p>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row k="Check-in" v={checkIn} />
            <Row k="Check-out" v={checkOut} />
            <Row k="Nights" v={String(nights)} />
            <Row k="Guests" v={`${adults} adult${adults > 1 ? "s" : ""}`} />
          </dl>
          <div className="mt-5 border-t border-brand-800/70 pt-4 text-sm">
            <Row k="Deposit due now" v="20% at checkout" />
            <Row k="Balance" v="Due at the hotel" />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-brand-200/50">
            Free cancellation until 48 hours before arrival. Payment methods: card, bank transfer, USSD — or pay the full amount at the front desk.
          </p>
        </aside>
      </section>
    </BookingShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-brand-200/60">{k}</dt>
      <dd className="text-right font-medium text-brand-50">{v}</dd>
    </div>
  );
}

function roomTypeLabel(code: string): string {
  const map: Record<string, string> = {
    STD: "Standard Room", DLX: "Deluxe Room", EXE: "Executive Suite", PRM: "Presidential Suite",
  };
  return map[code] ?? code;
}

function nightsBetween(a: string, b: string): number {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
  return Math.max(0, Math.round((tb - ta) / 86_400_000));
}
