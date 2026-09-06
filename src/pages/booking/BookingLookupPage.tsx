// M-LOD booking website — self-service booking management (route /booking/lookup).

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { BookingShell } from "./BookingShell";

export default function BookingLookupPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) navigate(`/booking/confirmation?code=${encodeURIComponent(clean)}`);
  };

  return (
    <BookingShell>
      <section className="mx-auto max-w-md px-5 py-24">
        <div className="rounded-2xl border border-brand-800/70 bg-brand-900/40 p-8 shadow-panel">
          <h1 className="font-display text-2xl">Manage your booking</h1>
          <p className="mt-2 text-sm text-brand-200/60">
            Enter the confirmation code from your booking (e.g. <span className="font-mono text-gold-300">RSV-2026-000001</span>).
          </p>
          <form onSubmit={submit} className="mt-6">
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="RSV-2026-…"
              className="w-full rounded-lg border border-brand-700 bg-brand-950/70 px-4 py-3 font-mono text-sm uppercase tracking-wide text-brand-50 outline-none focus:border-gold-500/60"
            />
            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-3 text-sm font-semibold text-brand-950 transition hover:from-gold-400 hover:to-gold-500"
            >
              <Search size={15} /> Find booking
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-brand-200/50">
            From here you can review your stay, check payment status, or cancel free of charge up to 48 hours before arrival.
          </p>
        </div>
      </section>
    </BookingShell>
  );
}
