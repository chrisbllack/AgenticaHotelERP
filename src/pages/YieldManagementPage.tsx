import { useState } from "react";
import { usePlatform } from "../store/platform";
import { Card, PageHeader, StatCard } from "../components/ui/primitives";
import { naira, cn } from "../lib/utils";
import type { DynamicRateRecommendation } from "../types";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Flame,
  LineChart,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function YieldManagementPage() {
  const {
    rateRecommendations,
    yieldRules,
    applyRateRecommendation,
    toggleYieldRule,
    addYieldRule,
    businessDate,
  } = usePlatform();

  const [activeSubTab, setActiveSubTab] = useState<"recommendations" | "pace" | "compset" | "rules">("recommendations");
  const [optimizing, setOptimizing] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Filter or selection
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCondition, setNewRuleCondition] = useState("occupancy_above");
  const [newRuleThreshold, setNewRuleThreshold] = useState(85);
  const [newRuleAdjustment, setNewRuleAdjustment] = useState(15);

  const handleApplyRate = (rec: DynamicRateRecommendation) => {
    applyRateRecommendation(rec.roomTypeId, rec.recommendedRate);
    setSuccessToast(`Successfully updated BAR rate for ${rec.roomTypeName} to ${naira(rec.recommendedRate)}`);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleApplyAll = () => {
    rateRecommendations.forEach((rec) => {
      applyRateRecommendation(rec.roomTypeId, rec.recommendedRate);
    });
    setSuccessToast("All AI & Rule-based yield rate adjustments pushed to Central Reservation System & OTAs.");
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleRunOptimization = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      setSuccessToast("Market demand algorithms refreshed. 4 updated dynamic rate plans generated.");
      setTimeout(() => setSuccessToast(""), 4000);
    }, 800);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    addYieldRule({
      name: newRuleName.trim(),
      conditionType: newRuleCondition as any,
      thresholdValue: newRuleThreshold,
      actionAdjustmentPercent: newRuleAdjustment,
      isActive: true,
      description: `Automatically adjust rates by ${newRuleAdjustment > 0 ? "+" : ""}${newRuleAdjustment}% when condition is met.`,
    });
    setIsCreateRuleOpen(false);
    setNewRuleName("");
  };

  // Pace data
  const forwardPaceDays = [
    { date: "09-08 Fri", occ: 82, pickup24h: 6, compDemand: "high", adr: 125000 },
    { date: "09-09 Sat", occ: 94, pickup24h: 9, compDemand: "extreme", adr: 145000 },
    { date: "09-10 Sun", occ: 68, pickup24h: 3, compDemand: "moderate", adr: 110000 },
    { date: "09-11 Mon", occ: 74, pickup24h: 5, compDemand: "high", adr: 120000 },
    { date: "09-12 Tue", occ: 88, pickup24h: 8, compDemand: "extreme", adr: 138000 },
    { date: "09-13 Wed", occ: 91, pickup24h: 7, compDemand: "extreme", adr: 140000 },
    { date: "09-14 Thu", occ: 79, pickup24h: 4, compDemand: "moderate", adr: 122000 },
  ];

  // Competitor Set
  const compSet = [
    { name: "INFINEON Lagos (Our Hotel)", standard: 110000, deluxe: 145000, suite: 240000, occ: "86%", index: 1.08 },
    { name: "Eko Hotel & Suites (VI)", standard: 125000, deluxe: 160000, suite: 280000, occ: "91%", index: 1.15 },
    { name: "Radisson Blu Anchorage (VI)", standard: 115000, deluxe: 150000, suite: 260000, occ: "88%", index: 1.10 },
    { name: "The Wheatbaker (Ikoyi)", standard: 135000, deluxe: 175000, suite: 310000, occ: "92%", index: 1.22 },
    { name: "Lagos Continental", standard: 105000, deluxe: 138000, suite: 230000, occ: "79%", index: 0.98 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yield & Revenue Management"
        description={`M-DST & REV · Dynamic pricing engine, forward occupancy pace, and algorithmic rate optimization · Business Date: ${businessDate}`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunOptimization}
              disabled={optimizing}
              className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs font-semibold text-brand-50 hover:bg-brand-800 transition-colors"
            >
              <RefreshCw size={14} className={cn(optimizing && "animate-spin text-gold-400")} />
              {optimizing ? "Analyzing Market..." : "Refresh Yield Models"}
            </button>
            <button
              onClick={handleApplyAll}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors shadow-md"
            >
              <Sparkles size={14} /> Apply All Dynamic Rates
            </button>
          </div>
        }
      />

      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projected 7-Day Occupancy"
          value="82.3%"
          change="+6.4% pace pickup vs last week"
          trend="up"
        />
        <StatCard
          label="Current RevPAR"
          value="₦114,800"
          change="Target: ₦98,000 (+17.1%)"
          trend="up"
        />
        <StatCard
          label="Market Compression"
          value="Extreme"
          change="NIES Energy Summit (Sept 9-13)"
          trend="up"
        />
        <StatCard
          label="Potential Yield Upside"
          value="+₦2,450,000"
          change="From recommended rate surge"
          trend="up"
        />
      </div>

      {/* Sub Navigation */}
      <div className="flex border-b border-brand-800">
        <button
          onClick={() => setActiveSubTab("recommendations")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeSubTab === "recommendations"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Sparkles size={16} /> Dynamic Rate Recommendations ({rateRecommendations.length})
        </button>
        <button
          onClick={() => setActiveSubTab("pace")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeSubTab === "pace"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <LineChart size={16} /> Forward Occupancy Pace & Pick-up
        </button>
        <button
          onClick={() => setActiveSubTab("compset")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeSubTab === "compset"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Building2 size={16} /> CompSet Benchmark & Parity
        </button>
        <button
          onClick={() => setActiveSubTab("rules")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeSubTab === "rules"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Sliders size={16} /> Automated Yield Rules ({yieldRules.length})
        </button>
      </div>

      {/* Tab 1: Dynamic Rate Recommendations */}
      {activeSubTab === "recommendations" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {rateRecommendations.map((rec) => {
              const diff = rec.recommendedRate - rec.currentBaseRate;
              const isIncrease = diff >= 0;

              return (
                <div
                  key={rec.id}
                  className="flex flex-col justify-between rounded-xl border border-brand-800/80 bg-brand-950/60 p-5 transition-colors hover:border-brand-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display text-base font-semibold text-brand-50">
                          {rec.roomTypeName}
                        </h4>
                        <p className="text-xs text-brand-200/60">
                          Target Date: <span className="font-mono text-brand-100">{rec.targetDate}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-brand-900 px-2.5 py-1 text-xs text-brand-200">
                        <Flame size={13} className="text-amber-400" />
                        <span>Confidence: {rec.confidenceScore}%</span>
                      </div>
                    </div>

                    {/* Rate Comparison Card */}
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-brand-800/60 bg-brand-900/40 p-3">
                      <div>
                        <span className="text-[11px] text-brand-200/50 uppercase">Current Base Rate</span>
                        <p className="font-mono text-base font-semibold text-brand-200">
                          {naira(rec.currentBaseRate)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] text-brand-200/50 uppercase">AI Recommended BAR</span>
                        <div className="flex items-baseline gap-2">
                          <p className="font-mono text-base font-bold text-emerald-400">
                            {naira(rec.recommendedRate)}
                          </p>
                          <span
                            className={cn(
                              "flex items-center text-xs font-semibold",
                              isIncrease ? "text-emerald-400" : "text-rose-400"
                            )}
                          >
                            {isIncrease ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {rec.percentageAdjustment > 0 ? `+${rec.percentageAdjustment}` : rec.percentageAdjustment}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rationale & Market Indicators */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      <p className="text-brand-200/80">
                        <strong className="text-brand-50">Demand Driver:</strong> {rec.rationale}
                      </p>
                      <div className="flex items-center gap-4 text-brand-200/60 text-[11px]">
                        <span>Projected RevPAR Gain: <strong className="text-emerald-300">+{naira(rec.projectedRevparGain)}</strong></span>
                        <span>CompSet Average: <strong>{naira(rec.competitorAvgRate)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-800/60 flex items-center justify-between">
                    {rec.applied ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 size={15} /> Rate Plan Active on Engine & Channels
                      </span>
                    ) : (
                      <span className="text-xs text-brand-200/50">Recommendation Pending</span>
                    )}

                    <button
                      onClick={() => handleApplyRate(rec)}
                      disabled={rec.applied}
                      className={cn(
                        "rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
                        rec.applied
                          ? "bg-brand-800 text-brand-200/40 cursor-not-allowed"
                          : "bg-gold-500 text-brand-950 hover:bg-gold-400 shadow"
                      )}
                    >
                      {rec.applied ? "Applied" : "Apply Rate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Forward Occupancy Pace & Pick-up */}
      {activeSubTab === "pace" && (
        <div className="space-y-4">
          <Card title="7-Day Forward Booking Pace & Velocity" subtitle="Daily reservations pickup, compression factors, and demand spikes">
            <div className="overflow-x-auto p-4">
              <div className="grid grid-cols-7 gap-3 min-w-[700px]">
                {forwardPaceDays.map((day, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-brand-800/70 bg-brand-950/60 p-3 text-center"
                  >
                    <div>
                      <span className="font-mono text-xs text-brand-200/70">{day.date}</span>
                      <div className="mt-2 text-2xl font-bold font-display text-brand-50">
                        {day.occ}%
                      </div>

                      {/* Bar indicator */}
                      <div className="mt-2 h-2 w-full rounded-full bg-brand-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            day.occ >= 90
                              ? "bg-rose-500"
                              : day.occ >= 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                          style={{ width: `${day.occ}%` }}
                        />
                      </div>

                      <div className="mt-3 text-xs text-brand-200/70 space-y-1">
                        <p className="flex items-center justify-center gap-1 text-emerald-400 font-medium">
                          <TrendingUp size={12} /> +{day.pickup24h} in 24h
                        </p>
                        <p className="text-[11px] text-brand-200/50">ADR: {naira(day.adr)}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-brand-800/60">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[9px] font-bold uppercase",
                          day.compDemand === "extreme"
                            ? "bg-rose-500/20 text-rose-300"
                            : day.compDemand === "high"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-brand-700 text-brand-200"
                        )}
                      >
                        {day.compDemand} demand
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Market Compression Events */}
          <Card title="Upcoming Market Compression Events" subtitle="City-wide conferences and festivals driving compression in Victoria Island & Ikoyi">
            <div className="divide-y divide-brand-800/60">
              <div className="flex items-center justify-between p-4 text-xs">
                <div>
                  <h4 className="font-semibold text-brand-50">Nigeria International Energy Summit (NIES)</h4>
                  <p className="text-brand-200/60">Sep 9 – Sep 13 · Eko Convention Centre · 4,500+ delegates</p>
                </div>
                <div className="text-right">
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300 font-semibold">
                    Extreme Compression (1.25x Surge)
                  </span>
                  <p className="text-[11px] text-brand-200/50 mt-1">Recommended MLOS: 2 Nights</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 text-xs">
                <div>
                  <h4 className="font-semibold text-brand-50">Lagos Techstars & FinTech Congress</h4>
                  <p className="text-brand-200/60">Sep 18 – Sep 20 · Landmark Centre · 2,800+ attendees</p>
                </div>
                <div className="text-right">
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 font-semibold">
                    High Compression (1.15x Surge)
                  </span>
                  <p className="text-[11px] text-brand-200/50 mt-1">Recommended MLOS: 1 Night</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: CompSet Benchmark & Parity */}
      {activeSubTab === "compset" && (
        <Card title="Competitive Set Rate Benchmark & Market Index" subtitle="Live rate intelligence across Victoria Island and Ikoyi peer properties">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-800 bg-brand-900/60 text-brand-200/60 uppercase">
                <tr>
                  <th className="p-3">Property</th>
                  <th className="p-3">Standard BAR</th>
                  <th className="p-3">Deluxe Oceanview</th>
                  <th className="p-3">Executive Suite</th>
                  <th className="p-3">Reported Occ.</th>
                  <th className="p-3">Revenue Gen. Index (RGI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-800/60">
                {compSet.map((hotel, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "transition-colors",
                      i === 0 ? "bg-gold-500/10 font-medium text-brand-50" : "hover:bg-brand-900/30 text-brand-100"
                    )}
                  >
                    <td className="p-3">
                      {hotel.name}
                      {i === 0 && <span className="ml-2 text-[10px] text-gold-400 font-bold">(Our Property)</span>}
                    </td>
                    <td className="p-3 font-mono">{naira(hotel.standard)}</td>
                    <td className="p-3 font-mono">{naira(hotel.deluxe)}</td>
                    <td className="p-3 font-mono">{naira(hotel.suite)}</td>
                    <td className="p-3 font-mono">{hotel.occ}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 font-mono font-bold",
                          hotel.index >= 1.0 ? "bg-emerald-500/20 text-emerald-300" : "bg-brand-800 text-brand-200"
                        )}
                      >
                        {hotel.index.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Automated Yield Rules */}
      {activeSubTab === "rules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-200/70">
              Autonomous triggers that adjust rates when booking pace or occupancy criteria are reached
            </p>
            <button
              onClick={() => setIsCreateRuleOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors"
            >
              <Plus size={14} /> Add Yield Rule
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {yieldRules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col justify-between rounded-xl border border-brand-800/80 bg-brand-950/60 p-4 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-sm font-semibold text-brand-50">
                      {rule.name}
                    </h4>
                    <button
                      onClick={() => toggleYieldRule(rule.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        rule.isActive ? "bg-emerald-500" : "bg-brand-700"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          rule.isActive ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-brand-200/70">{rule.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-800/60 flex items-center justify-between text-xs">
                  <span className="text-brand-200/50">Adjustment Action:</span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      rule.actionAdjustmentPercent > 0 ? "text-emerald-400" : "text-amber-400"
                    )}
                  >
                    {rule.actionAdjustmentPercent > 0 ? `+${rule.actionAdjustmentPercent}%` : `${rule.actionAdjustmentPercent}%`} BAR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Yield Rule */}
      {isCreateRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
            <h3 className="font-display text-lg text-brand-50">Create Automated Yield Rule</h3>
            <p className="text-xs text-brand-200/60">Configure automatic rate surge or filler triggers</p>

            <form onSubmit={handleAddRule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-200/70">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Leisure Compression Surge"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-200/70">Trigger Condition</label>
                <select
                  value={newRuleCondition}
                  onChange={(e) => setNewRuleCondition(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
                >
                  <option value="occupancy_above">When Occupancy exceeds threshold (%)</option>
                  <option value="occupancy_below">When Occupancy drops below threshold (%)</option>
                  <option value="lead_time_days">When Booking Lead Time is within (Days)</option>
                  <option value="compset_undercut">When CompSet increases rates by (%)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-200/70">Threshold Value</label>
                  <input
                    type="number"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-200/70">Rate Adjustment (%)</label>
                  <input
                    type="number"
                    value={newRuleAdjustment}
                    onChange={(e) => setNewRuleAdjustment(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-800">
                <button
                  type="button"
                  onClick={() => setIsCreateRuleOpen(false)}
                  className="rounded-lg border border-brand-700 px-4 py-2 text-xs text-brand-200 hover:bg-brand-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400"
                >
                  Save Yield Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
