import { Card, CardHeader, Badge, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { eventBookings, venues } from "../data/demo";
import { fmtDate, naira, num } from "../lib/utils";

const STATUS_BADGE: Record<string, string> = {
  inquiry: "border-stone-400/40 bg-stone-500/10 text-stone-300",
  tentative: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  confirmed: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  completed: "border-sky-400/40 bg-sky-500/10 text-sky-200",
  cancelled: "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

export default function EventsPage() {
  const confirmed = eventBookings.filter((e) => e.status === "confirmed");
  const pipeline = eventBookings.filter((e) => e.status === "tentative" || e.status === "inquiry");
  const confirmedRevenue = confirmed.reduce((a, e) => a + e.totalAmount, 0);
  const pipelineRevenue = pipeline.reduce((a, e) => a + e.totalAmount, 0);
  const sorted = [...eventBookings].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return (
    <div className="space-y-6">
      <PageHeader title="Events & Conference" subtitle="Function diary · BEO pipeline · venue logistics — catering posts to M-FNB & M-FIN" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Confirmed Events" value={String(confirmed.length)} sub="September diary" accent="emerald" />
        <StatCard label="Confirmed Revenue" value={naira(confirmedRevenue, true)} sub="banquet & conference" accent="gold" />
        <StatCard label="Pipeline" value={String(pipeline.length)} sub={`${naira(pipelineRevenue, true)} tentative`} accent="sky" />
        <StatCard label="Catering Covers" value={num(sorted.reduce((a, e) => a + (e.status === "confirmed" ? e.guestCount : 0), 0))} sub="guaranteed counts T-72h" />
      </div>

      <Card>
        <CardHeader title="Function Diary — September 2026" subtitle="Chronological diary with conflict-free venue assignment" />
        <ol className="relative space-y-4 px-5 py-5">
          <span className="absolute left-[26px] top-6 bottom-6 w-px bg-brand-800/80" aria-hidden="true" />
          {sorted.map((e) => {
            const venue = venues.find((v) => v.id === e.venueId);
            return (
              <li key={e.id} className="relative flex gap-4">
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-600 bg-brand-950 text-[11px] font-semibold text-gold-400">
                  {e.eventDate.slice(8)}
                </div>
                <div className="flex-1 rounded-lg border border-brand-800/70 bg-brand-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-brand-50">{e.name}</p>
                      <p className="text-xs text-brand-200/60">
                        {venue?.name} · {e.startTime}–{e.endTime} · {num(e.guestCount)} guests
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gold-400">{naira(e.totalAmount, true)}</span>
                      <Badge className={STATUS_BADGE[e.status]}>{e.status}</Badge>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-brand-200/50">
                    {e.eventType} · {e.clientName} · package: {e.packageName}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Venue Capacity" subtitle="Spaces, layouts & turnover" />
          <ul className="divide-y divide-brand-800/40">
            {venues.map((v) => {
              const booked = sorted.some((e) => e.venueId === v.id && e.status === "confirmed");
              return (
                <li key={v.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-brand-50">{v.name}</p>
                    <p className="text-xs text-brand-200/50">up to {num(v.capacity)} guests · {naira(v.hourlyRate, true)}/day</p>
                  </div>
                  <Badge className={v.status === "available" ? (booked ? "border-gold-500/40 bg-gold-500/10 text-gold-300" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200") : "border-rose-400/40 bg-rose-500/10 text-rose-200"}>
                    {v.status === "available" ? (booked ? "booked in diary" : "available") : "maintenance"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader title="BEO Pipeline" subtitle="Banquet event orders — versioned contracts" />
          <ul className="divide-y divide-brand-800/40">
            {sorted.filter((e) => e.status === "tentative" || e.status === "inquiry").map((e) => (
              <li key={e.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-brand-50">{e.name}</p>
                  <Badge className={STATUS_BADGE[e.status]}>{e.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-brand-200/50">
                  {fmtDate(e.eventDate)} · {e.clientName} · {naira(e.totalAmount, true)} — deposit & attrition tracking active
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
            Catering production sheets & kitchen requisitions are issued at guarantee deadline (72h before event).
          </div>
        </Card>
      </div>
    </div>
  );
}
