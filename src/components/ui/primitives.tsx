import type { ReactNode } from "react";
import { cn, naira } from "../../lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-brand-800/80 bg-brand-900/40 shadow-panel backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-brand-800/70 px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-brand-50">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-brand-200/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-brand-50">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-brand-200/70">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = "brand" }: { label: string; value: string; sub?: string; accent?: "brand" | "gold" | "rose" | "sky" | "emerald" }) {
  const accents: Record<string, string> = {
    brand: "text-brand-100",
    gold: "text-gold-400",
    rose: "text-rose-300",
    sky: "text-sky-300",
    emerald: "text-emerald-300",
  };
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-brand-200/60">{label}</p>
      <p className={cn("mt-1 font-display text-2xl", accents[accent])}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-brand-200/50">{sub}</p> : null}
    </Card>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-800/70">
            {head.map((h) => (
              <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-brand-200/60">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-800/50">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3 align-middle text-brand-50/90", className)}>{children}</td>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      <p className="text-sm font-medium text-brand-100">{title}</p>
      {hint ? <p className="text-xs text-brand-200/50">{hint}</p> : null}
    </div>
  );
}

export function MoneyCell({ value }: { value: number }) {
  return <span className={value < 0 ? "text-gold-400" : "text-brand-50/90"}>{naira(value)}</span>;
}
