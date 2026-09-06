import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, BarChart3, Bell, Building2, Check, CreditCard, Crown, Database,
  Gauge, HandCoins, Lock, Package, Plug, RefreshCcw, ShieldCheck,
  Sparkles, UtensilsCrossed, Users, WifiOff,
} from "lucide-react";

const MODULES: Array<{ code: string; label: string; desc: string; icon: typeof Building2; core?: boolean }> = [
  { code: "M-LOD", label: "Lodging & Guest Ops", desc: "Front desk, room rack, reservations, housekeeping, maintenance", icon: Building2, core: true },
  { code: "M-FNB", label: "Food & Beverage", desc: "POS, KDS, menu engineering, outlets, room service", icon: UtensilsCrossed, core: true },
  { code: "M-INV", label: "Supply Chain", desc: "Stores, stock levels, purchase orders, approval workflow", icon: Package, core: true },
  { code: "M-FIN", label: "Finance", desc: "GL, folios, cashiering, night audit, AP/AR", icon: HandCoins, core: true },
  { code: "M-HR", label: "Workforce", desc: "Employees, departments, payroll, biometric attendance", icon: Users, core: true },
  { code: "M-CRM", label: "Guest Experience", desc: "Profiles, loyalty tiers, preference capture", icon: Crown, core: true },
  { code: "M-EVT", label: "Events & Banqueting", desc: "Function diary, venues, packages, BEOs", icon: BarChart3 },
  { code: "M-DST", label: "Distribution", desc: "Channel manager, OTAs, GDS, rate sync", icon: Plug },
  { code: "M-PRC", label: "Payments", desc: "Methods, settlement, reconciliation, gateways", icon: CreditCard },
  { code: "M-HDW", label: "Devices", desc: "Locks, KDS, printers, IPTV, biometric readers", icon: Activity },
  { code: "M-BUS", label: "Intelligence", desc: "Executive KPIs, reports, audit trail", icon: Gauge },
  { code: "M-PLT", label: "Platform", desc: "Users, roles, settings, licensing", icon: ShieldCheck },
  { code: "M-SEC", label: "Security", desc: "RBAC, sessions, audit, field encryption", icon: Lock },
];

const CAPABILITIES = [
  { icon: WifiOff, title: "Offline-first", desc: "Keep checking guests in when the fiber is down. Local-first writes with durable queueing and conflict-safe sync." },
  { icon: RefreshCcw, title: "Real-time, everywhere", desc: "One check-in updates the room rack, housekeeping board, guest folio and executive KPIs instantly." },
  { icon: Database, title: "Single source of truth", desc: "53-table schema spanning 13 modules — folios post to GL, POS draws from stores, devices report to one health board." },
  { icon: ShieldCheck, title: "Enterprise controls", desc: "Role-based access, full audit trail, approval workflows, PCI-aware payment handling and offline-capable licensing." },
];

const DIFFERENTIATORS = [
  "Night audit with revenue rollup to GL",
  "Walk-in to key-encoded check-in in one flow",
  "Stock issue to kitchen & bar with reorder alerts",
  "Purchase approvals routed to the GM",
  "Loyalty tiers priced into folio discounts",
  "Function diary tied to rooms & venues",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-950 text-brand-50">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-brand-800/60 bg-brand-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 font-display text-lg text-gold-400 ring-1 ring-gold-500/40">I</div>
            <div className="leading-tight">
              <p className="font-display text-sm">INFINEON</p>
              <p className="text-[10px] uppercase tracking-widest text-gold-500/80">Enterprise Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#modules" className="hidden rounded-lg px-3 py-2 text-sm text-brand-100/80 transition-colors hover:text-brand-50 sm:block">Modules</a>
            <a href="#capabilities" className="hidden rounded-lg px-3 py-2 text-sm text-brand-100/80 transition-colors hover:text-brand-50 sm:block">Why INFINEON</a>
            <Link
              to="/book"
              className="hidden rounded-lg border border-gold-500/40 px-3.5 py-2 text-sm font-medium text-gold-300 transition-colors hover:bg-gold-500/10 sm:block"
            >
              Book a stay
            </Link>
            <Link
              to="/auth?returnTo=%2Fdashboard"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-sm font-semibold text-brand-950 transition-colors hover:from-gold-400 hover:to-gold-500"
            >
              Sign in <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute right-[8%] top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
              <Sparkles size={13} /> Hospitality ERP · Lodging · F&B · Finance · Workforce
            </span>
            <h1 className="mt-6 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Run the entire property from{" "}
              <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">one platform</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-brand-100/80 sm:text-lg">
              INFINEON unifies 13 modules — front desk, F&B, finance, workforce, distribution and more —
              into a single, offline-first system built for African luxury hotels and resorts.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/book"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:from-gold-400 hover:to-gold-500"
              >
                Book your stay <ArrowRight size={16} />
              </Link>
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="rounded-xl border border-brand-600/60 px-6 py-3 text-sm font-medium text-brand-50 transition-colors hover:border-brand-400"
              >
                Explore the staff console
              </Link>
            </div>
            <p className="mt-4 text-xs text-brand-200/50">
              Demo property: Grand Palm Hotel Lagos · 50 rooms · demo password <span className="font-mono text-gold-300">demo1234</span>
            </p>
          </div>

          {/* Hero stats */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["13", "main modules"],
              ["62", "submodules"],
              ["50", "demo rooms live"],
              ["100%", "offline-capable"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-brand-800/70 bg-brand-900/40 px-4 py-5 text-center shadow-panel">
                <p className="font-display text-3xl text-gold-400">{v}</p>
                <p className="mt-1 text-xs text-brand-200/60">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="border-t border-brand-800/60 bg-brand-900/30 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500/80">Why INFINEON</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-4xl">Built for the way hospitality actually runs</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-6 shadow-panel transition-colors hover:border-brand-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-gold-400 ring-1 ring-brand-400/30">
                  <c.icon size={19} />
                </div>
                <h3 className="mt-4 font-display text-lg">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-100/70">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500/80">The platform</p>
              <h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-4xl">13 modules. One guest record. One ledger.</h2>
            </div>
            <p className="max-w-sm text-sm text-brand-100/60">
              Every module maps to the ADR-0006 hierarchy — expand any one and it carries its own submodules,
              validation rules and audit surface.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div key={m.code} className="group rounded-xl border border-brand-800/70 bg-brand-900/40 p-5 shadow-panel transition-colors hover:border-gold-500/40">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-200 ring-1 ring-brand-400/25 group-hover:text-gold-400">
                    <m.icon size={17} />
                  </div>
                  {m.core ? <span className="rounded bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gold-400">Core</span> : null}
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-brand-200/40">{m.code}</p>
                <h3 className="mt-1 font-display text-lg">{m.label}</h3>
                <p className="mt-1.5 text-sm text-brand-100/60">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators + CTA */}
      <section className="border-t border-brand-800/60 bg-brand-900/30 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500/80">Ops detail</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">The workflows other systems bolt on, built in</h2>
            <ul className="mt-8 space-y-3">
              {DIFFERENTIATORS.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm text-brand-100/80">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
                    <Check size={12} />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-b from-brand-900/70 to-brand-950 p-8 shadow-panel">
            <h3 className="font-display text-2xl">Step into the demo property</h3>
            <p className="mt-3 text-sm text-brand-100/70">
              Grand Palm Hotel Lagos is live with recovered demo data — 25 reservations, 6 POS orders,
              13 housekeeping tasks and a full GL. Sign in and run a check-in, post a folio charge,
              close a shift, or explore the room rack.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-brand-100/80">
              {["admin@infineon.com — full access", "receptionist@infineon.com — front desk", "housekeeping@infineon.com — room board"].map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-gold-400" /> {s}
                </li>
              ))}
            </ul>
            <Link
              to="/auth?returnTo=%2Fdashboard"
              className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:from-gold-400 hover:to-gold-500"
            >
              Sign in to the dashboard <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-center text-xs text-brand-200/50">
              Password for all demo accounts: <span className="font-mono text-gold-300">demo1234</span>
            </p>
            <p className="mt-4 border-t border-brand-800/60 pt-4 text-center text-sm">
              <Link to="/book" className="text-gold-300 transition-colors hover:text-gold-200">
                Or book a stay at Grand Palm →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-800/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 font-display text-gold-400 ring-1 ring-gold-500/40">I</div>
            <p className="text-sm text-brand-100/60">
              INFINEON Enterprise Platform · InfinityPlus Solutions & Services Ltd.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-brand-200/40">
            <Bell size={12} /> v0.2.0 · 13 modules · 62 submodules · offline-first
          </p>
        </div>
      </footer>
    </div>
  );
}
