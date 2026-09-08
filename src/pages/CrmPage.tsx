import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { guests, loyaltyTiers } from "../data/demo";
import { initials, naira, num, cn } from "../lib/utils";
import type { ServiceRecoveryTicket } from "../types";
import CreateSurveyModal from "../components/CreateSurveyModal";
import ServiceRecoveryModal from "../components/ServiceRecoveryModal";
import {
  Crown,
  HeartHandshake,
  Plus,
  Smile,
  UserCheck,
  Users,
} from "lucide-react";

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
  const { reservations, guestSurveys, recoveryTickets } = usePlatform();
  const [activeTab, setActiveTab] = useState<"directory" | "sentiment" | "recovery" | "loyalty">("sentiment");
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);

  // Modals
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [selectedRecoveryTicket, setSelectedRecoveryTicket] = useState<ServiceRecoveryTicket | null>(null);

  // Filters for survey feed
  const [surveyFilter, setSurveyFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");

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

  // Sentiment Analytics Calculations
  const promoters = guestSurveys.filter((s) => s.overallScore >= 9).length;
  const passives = guestSurveys.filter((s) => s.overallScore === 7 || s.overallScore === 8).length;
  const detractors = guestSurveys.filter((s) => s.overallScore <= 6).length;
  const totalSurveys = guestSurveys.length || 1;

  const npsScore = Math.round(((promoters - detractors) / totalSurveys) * 100);
  const avgCsat = (
    guestSurveys.reduce((a, s) => a + s.overallScore, 0) / totalSurveys
  ).toFixed(1);

  // Department scores
  const avgCleanliness = (
    guestSurveys.reduce((a, s) => a + s.categories.cleanliness, 0) / totalSurveys
  ).toFixed(1);
  const avgDining = (
    guestSurveys.reduce((a, s) => a + s.categories.dining, 0) / totalSurveys
  ).toFixed(1);
  const avgFrontDesk = (
    guestSurveys.reduce((a, s) => a + s.categories.frontDesk, 0) / totalSurveys
  ).toFixed(1);
  const avgComfort = (
    guestSurveys.reduce((a, s) => a + s.categories.comfort, 0) / totalSurveys
  ).toFixed(1);

  const filteredSurveys = guestSurveys.filter((s) => {
    if (surveyFilter === "all") return true;
    return s.sentiment === surveyFilter;
  });

  const openRecoveryTickets = recoveryTickets.filter((t) => t.status !== "resolved");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Experience & CRM"
        subtitle="M-CRM · Guest 360 profiles, post-stay sentiment analytics, automated service recovery, and loyalty"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setIsSurveyModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors shadow-md"
            >
              <Plus size={14} /> Log Guest Survey
            </button>
          </div>
        }
      />

      {/* Top High-level KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Net Promoter Score (NPS)"
          value={`+${npsScore}`}
          change={`${promoters} Promoters · ${detractors} Detractors`}
          trend={npsScore >= 50 ? "up" : "neutral"}
        />
        <StatCard
          label="Average CSAT Rating"
          value={`${avgCsat} / 10`}
          change="Across all post-stay reviews"
          trend="up"
        />
        <StatCard
          label="Open Service Recovery"
          value={String(openRecoveryTickets.length)}
          change={openRecoveryTickets.length > 0 ? "Automated tickets pending" : "All issues resolved"}
          trend={openRecoveryTickets.length > 0 ? "down" : "up"}
        />
        <StatCard
          label="Unified Guest Profiles"
          value={String(guests.length)}
          change="Identities linked across modules"
          trend="neutral"
        />
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-brand-800">
        <button
          onClick={() => setActiveTab("sentiment")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "sentiment"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Smile size={16} /> Guest Sentiment & Surveys ({guestSurveys.length})
        </button>

        <button
          onClick={() => setActiveTab("recovery")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "recovery"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <HeartHandshake size={16} /> Service Recovery & Follow-ups ({recoveryTickets.length})
        </button>

        <button
          onClick={() => setActiveTab("directory")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "directory"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Users size={16} /> Guest Directory (360°)
        </button>

        <button
          onClick={() => setActiveTab("loyalty")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "loyalty"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Crown size={16} /> Loyalty & Segments
        </button>
      </div>

      {/* TAB 1: Guest Sentiment Analytics View */}
      {activeTab === "sentiment" && (
        <div className="space-y-6">
          {/* Department Breakdown Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-4">
              <span className="text-[11px] uppercase text-brand-200/50">Cleanliness & Housekeeping</span>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
                {avgCleanliness} / 5.0
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-brand-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(parseFloat(avgCleanliness) / 5) * 100}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-4">
              <span className="text-[11px] uppercase text-brand-200/50">Front Desk & Concierge</span>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
                {avgFrontDesk} / 5.0
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-brand-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(parseFloat(avgFrontDesk) / 5) * 100}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-4">
              <span className="text-[11px] uppercase text-brand-200/50">Food, Beverage & Dining</span>
              <p className="mt-1 font-mono text-xl font-bold text-amber-400">
                {avgDining} / 5.0
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-brand-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(parseFloat(avgDining) / 5) * 100}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-4">
              <span className="text-[11px] uppercase text-brand-200/50">Room Comfort & HVAC</span>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
                {avgComfort} / 5.0
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-brand-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(parseFloat(avgComfort) / 5) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Survey Feed Section */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-800 p-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-brand-50">
                  Verified Post-Stay Surveys & Guest Feedback Feed
                </h3>
                <p className="text-xs text-brand-200/60">
                  Digital QR, checkout tablet, email, and WhatsApp survey responses
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSurveyFilter("all")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs transition-colors",
                    surveyFilter === "all" ? "bg-brand-700 text-brand-50" : "text-brand-200/60 hover:text-brand-100"
                  )}
                >
                  All ({guestSurveys.length})
                </button>
                <button
                  onClick={() => setSurveyFilter("positive")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs transition-colors",
                    surveyFilter === "positive" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-brand-200/60 hover:text-brand-100"
                  )}
                >
                  Promoters ({promoters})
                </button>
                <button
                  onClick={() => setSurveyFilter("neutral")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs transition-colors",
                    surveyFilter === "neutral" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-brand-200/60 hover:text-brand-100"
                  )}
                >
                  Passives ({passives})
                </button>
                <button
                  onClick={() => setSurveyFilter("negative")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs transition-colors",
                    surveyFilter === "negative" ? "bg-rose-500/20 text-rose-300 font-semibold" : "text-brand-200/60 hover:text-brand-100"
                  )}
                >
                  Detractors ({detractors})
                </button>
              </div>
            </div>

            <div className="divide-y divide-brand-800/60">
              {filteredSurveys.map((survey) => (
                <div key={survey.id} className="p-5 transition-colors hover:bg-brand-900/30">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-bold",
                          survey.overallScore >= 9
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : survey.overallScore >= 7
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        )}
                      >
                        {survey.overallScore}
                      </span>
                      <div>
                        <h4 className="font-semibold text-sm text-brand-50">
                          {survey.guestName}
                        </h4>
                        <p className="text-xs text-brand-200/60">
                          Room {survey.roomNumber} · Departed: {survey.checkoutDate} · Channel: {survey.channel.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                          survey.sentiment === "positive"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : survey.sentiment === "neutral"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-rose-500/20 text-rose-300"
                        )}
                      >
                        {survey.sentiment}
                      </span>
                      {survey.serviceRecoveryTicketId && (
                        <button
                          onClick={() => {
                            const tick = recoveryTickets.find((t) => t.id === survey.serviceRecoveryTicketId);
                            if (tick) setSelectedRecoveryTicket(tick);
                          }}
                          className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-500/30"
                        >
                          <HeartHandshake size={12} /> View Recovery Ticket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="mt-3 text-xs text-brand-100/90 leading-relaxed">
                    "{survey.comment}"
                  </p>

                  {/* Category Ratings & Highlights */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-brand-800/40">
                    <div className="flex items-center gap-3 text-brand-200/60 text-[11px]">
                      <span>Cleanliness: <strong>{survey.categories.cleanliness}★</strong></span>
                      <span>Dining: <strong>{survey.categories.dining}★</strong></span>
                      <span>Front Desk: <strong>{survey.categories.frontDesk}★</strong></span>
                      <span>Comfort: <strong>{survey.categories.comfort}★</strong></span>
                    </div>

                    {survey.highlightTags && (
                      <div className="flex items-center gap-1.5">
                        {survey.highlightTags.map((tag, i) => (
                          <span
                            key={i}
                            className="rounded bg-brand-800 px-2 py-0.5 text-[10px] text-brand-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Service Recovery & Follow-up Cases */}
      {activeTab === "recovery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-200/70">
              Automated service recovery tickets created whenever a guest submits a satisfaction rating ≤ 6
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recoveryTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col justify-between rounded-xl border border-brand-800/80 bg-brand-950/60 p-5 transition-colors hover:border-brand-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gold-400 font-bold">{ticket.id}</span>
                        <h4 className="font-semibold text-sm text-brand-50">{ticket.guestName}</h4>
                      </div>
                      <p className="text-xs text-brand-200/60 mt-0.5">
                        Room {ticket.roomNumber} · Dept: {ticket.department}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                        ticket.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : ticket.status === "open"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      )}
                    >
                      {ticket.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg border border-brand-800/60 bg-brand-900/40 p-3 text-xs">
                    <span className="font-semibold text-rose-300 block mb-1">Issue Reported:</span>
                    <p className="text-brand-100">{ticket.issueSummary}</p>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-brand-200/70">
                    <p>
                      <span className="text-brand-200/40">Assigned Manager:</span>{" "}
                      <span className="text-brand-100">{ticket.assignedManager}</span>
                    </p>
                    {ticket.compensationOffered && (
                      <p>
                        <span className="text-brand-200/40">Goodwill Compensation:</span>{" "}
                        <span className="text-emerald-300">{ticket.compensationOffered}</span>
                      </p>
                    )}
                    {ticket.resolutionNotes && (
                      <p className="mt-2 text-brand-200/90 italic">
                        "{ticket.resolutionNotes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-800/60 flex items-center justify-between">
                  <span className="text-xs text-brand-200/50">Logged: {ticket.createdAt}</span>
                  <button
                    onClick={() => setSelectedRecoveryTicket(ticket)}
                    className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors"
                  >
                    <UserCheck size={13} /> Manage Recovery
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Guest 360 Directory */}
      {activeTab === "directory" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Guest Directory" subtitle="Click a guest for their 360° cross-module profile" />
            <Table head={["Guest", "Company", "Stays", "Lifetime value", "Tier"]}>
              {guests.map((g) => {
                const { tier, points } = tierFor(g.id);
                const stays = stayCount.get(g.id) ?? 0;
                return (
                  <tr
                    key={g.id}
                    onClick={() => setSelectedGuest(g.id)}
                    className={`cursor-pointer hover:bg-brand-800/30 ${selectedGuest === g.id ? "bg-brand-800/40" : ""}`}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700/70 text-xs font-semibold text-brand-50">
                          {initials(g.firstName, g.lastName)}
                        </span>
                        <div>
                          <p className="font-medium text-brand-50">
                            {g.firstName} {g.lastName}
                          </p>
                          <p className="text-xs text-brand-200/50">{g.phone}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{g.company || "Individual"}</Td>
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

          {/* Right Guest Detail */}
          <div className="space-y-4">
            {selected ? (
              <Card title={`${selected.firstName} ${selected.lastName}`} subtitle={selected.email || selected.phone}>
                <div className="p-4 space-y-3 text-xs text-brand-200/80">
                  <div className="rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                    <p className="text-[11px] text-brand-200/50 uppercase font-semibold">Total Revenue Contributed</p>
                    <p className="font-mono text-lg font-bold text-emerald-400">
                      {naira(spendByGuest.get(selected.id) ?? 0)}
                    </p>
                    <p className="text-[11px] text-brand-200/60 mt-1">
                      Stays on record: {stayCount.get(selected.id) ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                    <p className="text-[11px] text-brand-200/50 uppercase font-semibold">Preferences & Traces</p>
                    <p className="mt-1 text-xs text-brand-100">
                      High floor preferred, sparkling water on arrival, hypoallergenic pillows.
                    </p>
                  </div>

                  <div className="rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                    <p className="text-[11px] text-brand-200/50 uppercase font-semibold">
                      Stay History ({selectedStays.length})
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {selectedStays.map((st) => (
                        <div key={st.id} className="flex items-center justify-between text-[11px] border-b border-brand-800/40 pb-1">
                          <span className="font-mono text-gold-400">{st.confirmationCode}</span>
                          <span className="text-brand-200/70">{st.arrivalDate} – {st.departureDate}</span>
                          <span className="capitalize text-emerald-400">{st.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card title="Guest 360° Details" subtitle="Select a guest to view history">
                <div className="p-8 text-center text-xs text-brand-200/50">
                  Click any guest record from the directory table to view historical stays, total lifetime revenue, and sentiment scores.
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Loyalty & Campaign Segments */}
      {activeTab === "loyalty" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Targeted Campaign Segments" subtitle="RFM behavior and corporate group segmentation">
            <div className="divide-y divide-brand-800/60">
              {SEGMENTS.map((seg, i) => (
                <div key={i} className="flex items-center justify-between p-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-brand-50">{seg.name}</h4>
                    <p className="text-brand-200/60">{seg.basis}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-brand-50">{seg.size} profiles</span>
                    <span className="block text-[11px] text-emerald-400">{seg.trend} growth</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Infinity Club Loyalty Tiers" subtitle="Spend-to-points accrual and VIP benefits">
            <div className="divide-y divide-brand-800/60">
              {loyaltyTiers.map((t) => (
                <div key={t.code} className="flex items-center justify-between p-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className={TIER_BADGE[t.code]}>
                      <Crown size={11} /> {t.name}
                    </Badge>
                    <span className="text-brand-200/60">Min: {num(t.minPoints)} points</span>
                  </div>
                  <span className="font-mono text-gold-400 font-semibold">{t.discountPercent}% Discount</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      {isSurveyModalOpen && (
        <CreateSurveyModal
          isOpen={isSurveyModalOpen}
          onClose={() => setIsSurveyModalOpen(false)}
        />
      )}

      {selectedRecoveryTicket && (
        <ServiceRecoveryModal
          isOpen={!!selectedRecoveryTicket}
          onClose={() => setSelectedRecoveryTicket(null)}
          ticket={selectedRecoveryTicket}
        />
      )}
    </div>
  );
}
