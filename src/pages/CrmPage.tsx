import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { guests, loyaltyTiers } from "../data/demo";
import { fmtDate, initials, naira, num } from "../lib/utils";
import { Crown, Star } from "lucide-react";

const FEEDBACK = [
  { guest: "Adaeze Okonkwo", channel: "In-stay QR", score: 9, comment: "Jollof at Palm Restaurant deserves an award.", tag: "F&B", status: "resolved" },
  { guest: "Yusuf Bello", channel: "Post-stay email", score: 6, comment: "Slow checkout on Sunday morning — one cashier only.", tag: "Front Desk", status: "case_open" },
  { guest: "Fatima Abubakar", channel: "Reception card", score: 10, comment: "Housekeeping team is exceptional. Room 005 spotless.", tag: "Housekeeping", status: "resolved" },
  { guest: "Tunde Fashola", channel: "WhatsApp", score: 7, comment: "Poolside bar ran out of Chapman by 6pm.", tag: "F&B", status: "case_open" },
];

const SEGMENTS = [
  { name: "Corporate — Lagos Tech", basis: "RFM · 6 stays / 12 mo", size: 38, trend: "+12%" },
  { name: "Government — NPA & NNPC", basis: "Stay behavior · quarterly", size: 24, trend: "+5%" },
  { name: "Wedding & Social", basis: "Event linkage (M-EVT)", size: 17, trend: "+31%" },
  { name: "OTA Repeat Upgraders", basis: "Source = Booking.com, 2+ stays", size: 21, trend: "+8%" },
];

const TIER_BADGE: Record<string, string> = {
  MEMBER: "border-stone-400/40 bg-stone-500/10 text-stone-300",
  SILVER: "border-slate-300/40 bg-slate-400/10 text-slate-200",
  GOLD: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  PLATINUM: "border-sky-300/40 bg-sky-400/10 text-sky-200",
  VIP: "border-rose-300/40 bg-rose-400/10 text-rose-200",
};

export default function CrmPage() {
  const { reservations } = usePlatform();
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);

  const stayCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reservations) map.set(r.guestId, (map.get(r.guestId) ?? 0) + 1);
    return map;
  }, [reservations]);

  const spendByGuest = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reservations) map.set(r.guestId, (map.get(r.guestId) ?? 0) + r.totalEstimate);
    return map;
  }, [reservations]);

  const tierFor = (guestId: string) => {
    const spend = spendByGuest.get(guestId) ?? 0;
    const points = Math.round(spend / 100);
    const tier = [...loyaltyTiers].reverse().find((t) => points >= t.minPoints) ?? loyaltyTiers[0];
    return { tier, points };
  };

  const selected = selectedGuest ? guests.find((g) => g.id === selectedGuest) : null;
  const selectedStays = reservations.filter((r) => r.guestId === selectedGuest);

  return (
    <div className="space-y-6">
      <PageHeader title="Guest Experience & CRM" subtitle="Guest 360 · loyalty · segments · feedback — one identity across every module" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Guest Profiles" value={String(guests.length)} sub="unified identities" />
        <StatCard label="Repeat Guests" value={String([...stayCount.values()].filter((c) => c > 1).length)} sub="2+ stays on record" accent="emerald" />
        <StatCard label="NPS (rolling)" value="61" sub="from last 40 responses" accent="gold" />
        <StatCard label="Open Cases" value={String(FEEDBACK.filter((f) => f.status === "case_open").length)} sub="service recovery" accent="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Guest Directory" subtitle="Click a guest for the 360° profile" />
          <Table head={["Guest", "Company", "Stays", "Lifetime value", "Tier"]}>
            {guests.map((g) => {
              const { tier, points } = tierFor(g.id);
              const stays = stayCount.get(g.id) ?? 0;
              return (
                <tr key={g.id} onClick={() => setSelectedGuest(g.id)} className={`cursor-pointer hover:bg-brand-800/30 ${selectedGuest === g.id ? "bg-brand-800/40" : ""}`}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700/70 text-xs font-semibold text-brand-50">{initials(g.firstName, g.lastName)}</span>
                      <div>
                        <p className="font-medium text-brand-50">{g.firstName} {g.lastName}</p>
                        <p className="text-xs text-brand-200/50">{g.phone}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>{g.company}</Td>
                  <Td>{stays}</Td>
                  <Td>{naira(spendByGuest.get(g.id) ?? 0, true)}</Td>
                  <Td>
                    <Badge className={TIER_BADGE[tier.code]}>
                      <Crown size={10} /> {tier.name}
                    </Badge>
                    <span className="ml-1.5 text-[11px] text-brand-200/50">{num(points)} pts</span>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <Card className="animate-fade-up">
              <CardHeader
                title={`${selected.firstName} ${selected.lastName}`}
                subtitle="Guest 360 — identity owned by M-CRM"
                action={
                  <button onClick={() => setSelectedGuest(null)} className="text-xs text-brand-200/60 hover:text-brand-50">
                    Close
                  </button>
                }
              />
              <div className="space-y-3 p-5 text-sm">
                <div className="flex items-center justify-between"><span className="text-brand-200/60">Company</span><span className="text-brand-50">{selected.company}</span></div>
                <div className="flex items-center justify-between"><span className="text-brand-200/60">Email</span><span className="text-brand-50">{selected.email || "—"}</span></div>
                <div className="flex items-center justify-between"><span className="text-brand-200/60">Phone</span><span className="text-brand-50">{selected.phone}</span></div>
                <div className="flex items-center justify-between"><span className="text-brand-200/60">Nationality</span><span className="text-brand-50">{selected.nationality}</span></div>
                <div className="border-t border-brand-800/70 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-200/50">Stay history</p>
                  {selectedStays.length === 0 ? (
                    <p className="text-xs text-brand-200/40">No stays yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedStays.map((r) => (
                        <li key={r.id} className="flex items-center justify-between text-xs">
                          <span className="text-brand-100/80">{fmtDate(r.arrivalDate)} · {r.source}</span>
                          <span className="text-brand-200/60">{naira(r.totalEstimate, true)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Loyalty Program" subtitle="Tiers & earning rules" />
            <ul className="divide-y divide-brand-800/40">
              {loyaltyTiers.map((t) => (
                <li key={t.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <Badge className={TIER_BADGE[t.code]}><Star size={10} /> {t.name}</Badge>
                    <span className="text-xs text-brand-200/60">{num(t.minPoints)}+ pts</span>
                  </div>
                  <p className="mt-1 text-xs text-brand-200/50">{t.benefits}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Campaign Segments" subtitle="RFM & stay-behavior — consent-gated outreach" />
          <Table head={["Segment", "Basis", "Size", "Trend"]}>
            {SEGMENTS.map((s) => (
              <tr key={s.name} className="hover:bg-brand-800/30">
                <Td className="font-medium text-brand-50">{s.name}</Td>
                <Td className="text-xs">{s.basis}</Td>
                <Td>{s.size}</Td>
                <Td><span className="text-emerald-300">{s.trend}</span></Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card>
          <CardHeader title="Feedback & Reputation" subtitle="Multi-channel capture → case workflow" />
          <ul className="divide-y divide-brand-800/40">
            {FEEDBACK.map((f, i) => (
              <li key={i} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-brand-50">{f.guest}</p>
                  <span className={`flex items-center gap-1 text-sm ${f.score >= 8 ? "text-emerald-300" : f.score >= 6 ? "text-gold-400" : "text-rose-300"}`}>
                    <Star size={12} /> {f.score}/10
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-brand-100/80">“{f.comment}”</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge className="border-brand-700 bg-brand-900 text-brand-100">{f.tag}</Badge>
                  <span className="text-[11px] text-brand-200/50">via {f.channel}</span>
                  <Badge className={f.status === "resolved" ? "ml-auto border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-amber-400/40 bg-amber-500/10 text-amber-200"}>
                    {f.status === "resolved" ? "resolved" : "case open"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
