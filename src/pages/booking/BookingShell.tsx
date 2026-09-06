import { Link, NavLink } from "react-router-dom";
import { type ReactNode } from "react";
import { Building2, Phone, ShieldCheck } from "lucide-react";

const NAV_LINKS = [
  { to: "/book", label: "Book a Stay" },
  { to: "/booking/lookup", label: "Manage Booking" },
  { to: "/auth?returnTo=%2Fdashboard", label: "Staff Console" },
];

export function BookingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-950 text-brand-50">
      <header className="sticky top-0 z-30 border-b border-brand-800/60 bg-brand-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 font-display text-lg text-gold-400 ring-1 ring-gold-500/40">I</div>
            <div className="leading-tight">
              <p className="font-display text-sm">INFINEON</p>
              <p className="text-[10px] uppercase tracking-widest text-gold-500/80">Grand Palm · Lagos</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive && !l.to.includes("auth")
                      ? "bg-brand-800/60 text-brand-50"
                      : "text-brand-100/75 hover:bg-brand-900/60 hover:text-brand-50"
                  }`
                }
              >
                {l.label}
              </NavLink>
              ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-brand-800/60 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-display text-sm"><Building2 size={15} className="text-gold-400" /> Grand Palm Hotel Lagos</p>
            <p className="mt-2 text-xs leading-relaxed text-brand-200/50">
              14 Palm Springs Avenue, Victoria Island, Lagos, Nigeria.
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm text-brand-100/80"><Phone size={14} className="text-gold-400" /> Reservations</p>
            <p className="mt-2 text-xs text-brand-200/50">+234-1-700-INFINEON · reservations@grandpalmlagos.com</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm text-brand-100/80"><ShieldCheck size={14} className="text-gold-400" /> Secure payments</p>
            <p className="mt-2 text-xs text-brand-200/50">Card, transfer & USSD via our PCI-aware checkout. Pay-at-desk also available.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
