import { useState, useMemo } from "react";
import { Card, CardHeader, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { DailyCashFlowEntry, CashFlowScenario } from "../../types";
import {
  TrendingUp,
  AlertTriangle,
  Sliders,
  Building2,
  Receipt,
  Calendar,
  Layers,
  X,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";

const MIN_RESERVE_BUFFER = 15000000; // ₦15,000,000 Safety reserve threshold

export function CashFlowView() {
  const { getCashFlowForecast, reservations, cityLedgerAccounts, accountsPayableInvoices } = usePlatform();

  // Scenario Simulator State
  const [occupancyAdjustmentPct, setOccupancyAdjustmentPct] = useState<number>(0);
  const [arCollectionDelayDays, setArCollectionDelayDays] = useState<number>(0);
  const [capexFreeze, setCapexFreeze] = useState<boolean>(false);

  // Filter & Inspection State
  const [filterType, setFilterType] = useState<"all" | "surplus" | "deficit" | "breach">("all");
  const [selectedDay, setSelectedDay] = useState<DailyCashFlowEntry | null>(null);
  const [chartView, setChartView] = useState<"trend" | "composition">("trend");

  const scenario: CashFlowScenario = useMemo(
    () => ({
      occupancyAdjustmentPct,
      arCollectionDelayDays,
      capexFreeze,
    }),
    [occupancyAdjustmentPct, arCollectionDelayDays, capexFreeze]
  );

  const forecastData = useMemo(() => {
    return getCashFlowForecast(scenario);
  }, [getCashFlowForecast, scenario]);

  // Aggregate Metrics over 30 Days
  const totalInflow = useMemo(() => forecastData.reduce((acc, d) => acc + d.inflows.totalInflow, 0), [forecastData]);
  const totalOutflow = useMemo(() => forecastData.reduce((acc, d) => acc + d.outflows.totalOutflow, 0), [forecastData]);
  const netCashFlow = totalInflow - totalOutflow;
  const openingBalance = forecastData.length > 0 ? forecastData[0].openingBalance : 42500000;
  const endingBalance = forecastData.length > 0 ? forecastData[forecastData.length - 1].closingBalance : openingBalance;
  const lowestBalance = useMemo(() => Math.min(...forecastData.map((d) => d.closingBalance)), [forecastData]);
  const breachDaysCount = useMemo(() => forecastData.filter((d) => d.isMinReserveBreached).length, [forecastData]);

  // Filtered days for table
  const filteredDays = useMemo(() => {
    return forecastData.filter((d) => {
      if (filterType === "surplus") return d.netCashFlow > 0;
      if (filterType === "deficit") return d.netCashFlow < 0;
      if (filterType === "breach") return d.isMinReserveBreached || d.closingBalance < MIN_RESERVE_BUFFER * 1.2;
      return true;
    });
  }, [forecastData, filterType]);

  // Format chart data
  const chartData = useMemo(() => {
    return forecastData.map((d) => ({
      day: `D${d.dayNumber}`,
      date: d.date.slice(5),
      fullDate: d.date,
      dayName: d.dayName,
      closingBalance: d.closingBalance,
      netCashFlow: d.netCashFlow,
      totalInflow: d.inflows.totalInflow,
      totalOutflow: d.outflows.totalOutflow,
      roomsInflow: d.inflows.roomRevenueSettlements + d.inflows.roomAdvanceDeposits,
      arInflow: d.inflows.cityLedgerCollections,
      fnbInflow: d.inflows.fnbAndOutletsRevenue,
      payrollOutflow: d.outflows.payrollAndWages,
      vendorApOutflow: d.outflows.vendorAccountsPayable,
      utilitiesTaxesOutflow: d.outflows.utilitiesAndDiesel + d.outflows.statutoryTaxes,
      capexOutflow: d.outflows.loanServiceAndCapex,
      minReserve: MIN_RESERVE_BUFFER,
    }));
  }, [forecastData]);

  const resetScenario = () => {
    setOccupancyAdjustmentPct(0);
    setArCollectionDelayDays(0);
    setCapexFreeze(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Live Sync Banner */}
      <div className="rounded-xl border border-brand-800/80 bg-gradient-to-r from-brand-950/80 via-brand-900/60 to-brand-950/80 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                Live 30-Day Liquidity Intelligence
              </span>
            </div>
            <h2 className="text-xl font-bold text-brand-50 mt-1">Cash Flow Projection &amp; Working Capital Forecast</h2>
            <p className="text-sm text-brand-200/70 mt-1 max-w-3xl">
              Dynamically modeling next 30 days liquidity by synchronizing{" "}
              <strong className="text-brand-100">{reservations.length} guest reservations</strong>,{" "}
              <strong className="text-brand-100">{cityLedgerAccounts.length} corporate AR accounts</strong>,{" "}
              <strong className="text-brand-100">{accountsPayableInvoices.length} supplier AP obligations</strong>, and mid-month payroll disbursements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setChartView(chartView === "trend" ? "composition" : "trend")}
              className="flex items-center gap-2 rounded-lg border border-brand-700/80 bg-brand-800/50 px-3 py-2 text-xs font-medium text-brand-100 hover:bg-brand-700/60 transition"
            >
              <Layers size={14} className="text-gold-300" />
              {chartView === "trend" ? "Show Flow Composition" : "Show Balance Trajectory"}
            </button>
            <button
              onClick={resetScenario}
              className="flex items-center gap-1.5 rounded-lg border border-brand-700/80 bg-brand-900/60 px-3 py-2 text-xs font-medium text-brand-300 hover:text-brand-100 hover:bg-brand-800/60 transition"
              title="Reset stress scenario to baseline"
            >
              <RefreshCw size={13} />
              Reset Scenario
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Opening Liquidity"
          value={naira(openingBalance, true)}
          sub="Treasury + Cash in bank"
          accent="stone"
        />
        <StatCard
          label="Forecasted Inflows"
          value={naira(totalInflow, true)}
          sub="30d revenue + AR collections"
          accent="emerald"
        />
        <StatCard
          label="Forecasted Outflows"
          value={naira(totalOutflow, true)}
          sub="AP, payroll, taxes, capex"
          accent="rose"
        />
        <StatCard
          label="Net Cash Flow"
          value={`${netCashFlow >= 0 ? "+" : ""}${naira(netCashFlow, true)}`}
          sub={netCashFlow >= 0 ? "Net operating surplus" : "Net working capital draw"}
          accent={netCashFlow >= 0 ? "emerald" : "rose"}
        />
        <StatCard
          label="Projected Day 30"
          value={naira(endingBalance, true)}
          sub={`Low point: ${naira(lowestBalance, true)}`}
          accent={endingBalance >= MIN_RESERVE_BUFFER ? "gold" : "rose"}
        />
        <div className={`rounded-xl border p-4 ${
          breachDaysCount > 0
            ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
            : lowestBalance < MIN_RESERVE_BUFFER * 1.25
            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-brand-200/80">Safety Reserve</span>
            {breachDaysCount > 0 ? (
              <AlertTriangle size={16} className="text-rose-400" />
            ) : (
              <ShieldCheckIcon />
            )}
          </div>
          <div className="text-lg font-bold mt-1 text-brand-50">
            {breachDaysCount > 0 ? `${breachDaysCount} Days At Risk` : "Buffer Secured"}
          </div>
          <p className="text-[11px] text-brand-200/70 mt-0.5">
            Min buffer: {naira(MIN_RESERVE_BUFFER, true)}
          </p>
        </div>
      </div>

      {/* Scenario Stress-Testing Controls */}
      <Card>
        <CardHeader
          title="Stress-Testing &amp; Scenario Simulator"
          subtitle="Adjust occupancy velocity, accounts receivable collection lags, and capital expenditure policies to forecast liquidity resilience"
        />
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: Occupancy Adjustment */}
          <div className="space-y-2 rounded-lg border border-brand-800/60 bg-brand-950/40 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-100 flex items-center gap-1.5">
                <Building2 size={14} className="text-gold-400" />
                Occupancy Adjustment
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                occupancyAdjustmentPct > 0
                  ? "bg-emerald-500/20 text-emerald-300"
                  : occupancyAdjustmentPct < 0
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-brand-800/40 text-brand-200"
              }`}>
                {occupancyAdjustmentPct > 0 ? `+${occupancyAdjustmentPct}%` : `${occupancyAdjustmentPct}%`}
              </span>
            </div>
            <input
              type="range"
              min={-30}
              max={30}
              step={5}
              value={occupancyAdjustmentPct}
              onChange={(e) => setOccupancyAdjustmentPct(Number(e.target.value))}
              className="w-full h-1.5 bg-brand-800 rounded-lg appearance-none cursor-pointer accent-gold-400"
            />
            <div className="flex justify-between text-[11px] text-brand-400 font-mono">
              <span>-30% (Low season shock)</span>
              <span>Baseline (0%)</span>
              <span>+30% (Peak surge)</span>
            </div>
          </div>

          {/* Slider 2: AR Collection Delay */}
          <div className="space-y-2 rounded-lg border border-brand-800/60 bg-brand-950/40 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-100 flex items-center gap-1.5">
                <Receipt size={14} className="text-sky-400" />
                City Ledger AR Delay
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                arCollectionDelayDays > 0 ? "bg-amber-500/20 text-amber-300" : "bg-brand-800/40 text-brand-200"
              }`}>
                {arCollectionDelayDays === 0 ? "On-Time" : `+${arCollectionDelayDays} days`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={arCollectionDelayDays}
              onChange={(e) => setArCollectionDelayDays(Number(e.target.value))}
              className="w-full h-1.5 bg-brand-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[11px] text-brand-400 font-mono">
              <span>Standard (Day 7/14/21)</span>
              <span>+15d Delay</span>
              <span>+30d Stress</span>
            </div>
          </div>

          {/* Toggle: CapEx Freeze */}
          <div className="space-y-2 rounded-lg border border-brand-800/60 bg-brand-950/40 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-100 flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-400" />
                CapEx &amp; Major Upgrades Freeze
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                capexFreeze ? "bg-emerald-500/20 text-emerald-300" : "bg-brand-800/40 text-brand-300"
              }`}>
                {capexFreeze ? "FROZEN" : "ACTIVE"}
              </span>
            </div>
            <p className="text-[12px] text-brand-200/70">
              Freezes discretionary capital expenditure (₦6.5M chiller overhaul &amp; carpet retrofit) to conserve liquidity buffer.
            </p>
            <button
              onClick={() => setCapexFreeze(!capexFreeze)}
              className={`w-full py-1.5 text-xs font-medium rounded-lg border transition ${
                capexFreeze
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                  : "border-brand-700 bg-brand-900/60 text-brand-200 hover:bg-brand-800"
              }`}
            >
              {capexFreeze ? "Resume Planned CapEx" : "Activate Emergency CapEx Freeze"}
            </button>
          </div>
        </div>
      </Card>

      {/* Primary Chart Section */}
      <Card>
        <div className="p-5 border-b border-brand-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-brand-50 flex items-center gap-2">
              {chartView === "trend" ? (
                <>
                  <TrendingUp size={16} className="text-gold-400" />
                  30-Day Liquidity Trajectory vs. Minimum Safety Buffer (₦15.0M)
                </>
              ) : (
                <>
                  <Layers size={16} className="text-sky-400" />
                  Daily Cash Inflow vs. Outflow Composition Breakdown
                </>
              )}
            </h3>
            <p className="text-xs text-brand-200/60 mt-0.5">
              {chartView === "trend"
                ? "Closing daily bank & treasury liquidity projected from Day 1 to Day 30"
                : "Stacked breakdown of operating revenue, corporate AR receipts, payroll, AP batches, and taxes"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-brand-950 border border-brand-800 font-mono text-brand-200">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-400 inline-block" /> Closing Balance
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-brand-950 border border-brand-800 font-mono text-brand-200">
              <span className="w-2.5 h-0.5 bg-rose-500 inline-block" /> Min Safety Buffer
            </span>
          </div>
        </div>

        <div className="p-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "trend" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#8f9bb3"
                  fontSize={11}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  stroke="#8f9bb3"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₦${(val / 1000000).toFixed(1)}M`}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-brand-700 bg-brand-950/95 p-3 text-xs shadow-xl backdrop-blur-md">
                          <p className="font-semibold text-brand-50 mb-1">
                            Day {data.day.slice(1)} · {data.fullDate} ({data.dayName})
                          </p>
                          <div className="space-y-1 font-mono">
                            <div className="flex justify-between gap-4">
                              <span className="text-brand-300">Closing Balance:</span>
                              <span className="font-bold text-gold-300">{naira(data.closingBalance)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-emerald-400">Total Inflow:</span>
                              <span className="text-emerald-300">+{naira(data.totalInflow)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-rose-400">Total Outflow:</span>
                              <span className="text-rose-300">-{naira(data.totalOutflow)}</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-brand-800">
                              <span className="text-brand-200">Net Day Shift:</span>
                              <span className={data.netCashFlow >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {data.netCashFlow >= 0 ? "+" : ""}{naira(data.netCashFlow)}
                              </span>
                            </div>
                            {data.closingBalance < MIN_RESERVE_BUFFER && (
                              <p className="text-rose-400 font-sans font-medium text-[11px] pt-1">
                                ⚠ Minimum reserve buffer breached!
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={MIN_RESERVE_BUFFER}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: "Min Buffer: ₦15M",
                    fill: "#f87171",
                    fontSize: 10,
                    position: "insideBottomRight",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="closingBalance"
                  stroke="#d4af37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#liquidityGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" vertical={false} />
                <XAxis dataKey="day" stroke="#8f9bb3" fontSize={11} interval={2} />
                <YAxis
                  stroke="#8f9bb3"
                  fontSize={11}
                  tickFormatter={(val) => `₦${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: any) => naira(Number(val))}
                  contentStyle={{ backgroundColor: "#0e131f", borderColor: "#2d3748", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="roomsInflow" name="Rooms Revenue" stackId="inflows" fill="#10b981" />
                <Bar dataKey="arInflow" name="City Ledger AR" stackId="inflows" fill="#06b6d4" />
                <Bar dataKey="fnbInflow" name="F&B Outlets" stackId="inflows" fill="#8b5cf6" />
                <Bar dataKey="payrollOutflow" name="Payroll" stackId="outflows" fill="#f43f5e" />
                <Bar dataKey="vendorApOutflow" name="Vendor AP" stackId="outflows" fill="#f59e0b" />
                <Bar dataKey="utilitiesTaxesOutflow" name="Utilities & Tax" stackId="outflows" fill="#ec4899" />
                <Bar dataKey="capexOutflow" name="Debt & CapEx" stackId="outflows" fill="#64748b" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Daily Breakdown Table & Filter Controls */}
      <Card>
        <div className="p-5 border-b border-brand-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-brand-50 flex items-center gap-2">
              <Calendar size={16} className="text-gold-400" />
              Day-by-Day 30-Day Liquidity Schedule
            </h3>
            <p className="text-xs text-brand-200/60 mt-0.5">
              Detailed breakdown of daily openings, settled receipts, accounts receivable cycles, vendor drafts, and ending liquidity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "All 30 Days"],
                ["surplus", "Surplus Days (+Net)"],
                ["deficit", "Deficit Days (-Net)"],
                ["breach", "Low Reserve Days (<₦18M)"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filterType === key
                    ? "bg-gold-400/20 text-gold-200 border border-gold-400/50"
                    : "bg-brand-900/40 text-brand-200/70 border border-brand-800/60 hover:text-brand-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-brand-100">
            <thead className="bg-brand-950/60 border-b border-brand-800/80 text-brand-300 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Day / Date</th>
                <th className="px-4 py-3">Opening Cash</th>
                <th className="px-4 py-3 text-emerald-300">Total Inflow</th>
                <th className="px-4 py-3 text-rose-300">Total Outflow</th>
                <th className="px-4 py-3">Net Cash Flow</th>
                <th className="px-4 py-3">Closing Cash</th>
                <th className="px-4 py-3">Reserve Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800/40 font-mono">
              {filteredDays.map((d) => {
                const isWarning = d.closingBalance < MIN_RESERVE_BUFFER * 1.25;
                const isBreached = d.isMinReserveBreached;

                return (
                  <tr
                    key={d.date}
                    className={`hover:bg-brand-800/30 transition ${
                      isBreached ? "bg-rose-950/20" : isWarning ? "bg-amber-950/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-50">Day {d.dayNumber}</span>
                        <span className="text-[11px] text-brand-400">({d.dayName.slice(0, 3)})</span>
                      </div>
                      <div className="text-[11px] text-brand-400 font-mono">{d.date}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-200">{naira(d.openingBalance, true)}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">
                      +{naira(d.inflows.totalInflow, true)}
                    </td>
                    <td className="px-4 py-3 text-rose-400 font-semibold">
                      -{naira(d.outflows.totalOutflow, true)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          d.netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {d.netCashFlow >= 0 ? (
                          <ArrowUpRight size={13} />
                        ) : (
                          <ArrowDownRight size={13} />
                        )}
                        {naira(d.netCashFlow, true)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-50">{naira(d.closingBalance, true)}</td>
                    <td className="px-4 py-3 font-sans">
                      {isBreached ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-300 border border-rose-500/40">
                          <AlertTriangle size={11} />
                          Breach (&lt;₦15M)
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/40">
                          Low Buffer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/40">
                          Comfortable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedDay(d)}
                        className="rounded bg-brand-800/60 px-2.5 py-1 text-xs font-medium text-brand-200 hover:bg-brand-700 hover:text-brand-50 transition border border-brand-700/60"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Day Inspector Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  Day {selectedDay.dayNumber} Cash Flow Audit
                </span>
                <h3 className="text-lg font-bold text-brand-50 mt-0.5">
                  {selectedDay.date} · {selectedDay.dayName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-900 hover:text-brand-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-sans">
              {/* Balances Card */}
              <div className="grid grid-cols-3 gap-3 rounded-lg border border-brand-800 bg-brand-900/40 p-3 font-mono">
                <div>
                  <span className="text-brand-400 text-[11px]">Opening Cash</span>
                  <p className="font-bold text-brand-100 text-sm mt-0.5">{naira(selectedDay.openingBalance)}</p>
                </div>
                <div>
                  <span className="text-brand-400 text-[11px]">Net Change</span>
                  <p
                    className={`font-bold text-sm mt-0.5 ${
                      selectedDay.netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selectedDay.netCashFlow >= 0 ? "+" : ""}
                    {naira(selectedDay.netCashFlow)}
                  </p>
                </div>
                <div>
                  <span className="text-brand-400 text-[11px]">Closing Cash</span>
                  <p className="font-bold text-gold-300 text-sm mt-0.5">{naira(selectedDay.closingBalance)}</p>
                </div>
              </div>

              {/* Inflow Items */}
              <div>
                <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <ArrowUpRight size={14} />
                  Cash Inflow Sources (+{naira(selectedDay.inflows.totalInflow)})
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">Room Settlements &amp; Folio Checkouts:</span>
                    <span className="font-semibold text-brand-100">{naira(selectedDay.inflows.roomRevenueSettlements)}</span>
                  </div>
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">Advance Room Booking Deposits:</span>
                    <span className="font-semibold text-brand-100">{naira(selectedDay.inflows.roomAdvanceDeposits)}</span>
                  </div>
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">City Ledger Corporate AR Collections:</span>
                    <span className="font-semibold text-cyan-300">{naira(selectedDay.inflows.cityLedgerCollections)}</span>
                  </div>
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">F&amp;B Outlets, Banquets, &amp; Bars POS:</span>
                    <span className="font-semibold text-brand-100">{naira(selectedDay.inflows.fnbAndOutletsRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Outflow Items */}
              <div>
                <h4 className="font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                  <ArrowDownRight size={14} />
                  Cash Outflow Obligations (-{naira(selectedDay.outflows.totalOutflow)})
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">Payroll &amp; Staff Wage Distributions:</span>
                    <span className="font-semibold text-brand-100">{naira(selectedDay.outflows.payrollAndWages)}</span>
                  </div>
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">Vendor Accounts Payable (Food/Bev/Parts):</span>
                    <span className="font-semibold text-amber-300">{naira(selectedDay.outflows.vendorAccountsPayable)}</span>
                  </div>
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">Power Grid Utilities &amp; Generator Diesel:</span>
                    <span className="font-semibold text-brand-100">{naira(selectedDay.outflows.utilitiesAndDiesel)}</span>
                  </div>
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">Statutory Tax Filings (VAT / WHT / PAYE):</span>
                    <span className="font-semibold text-brand-100">{naira(selectedDay.outflows.statutoryTaxes)}</span>
                  </div>
                  <div className="flex justify-between rounded bg-brand-900/30 p-2">
                    <span className="text-brand-300">Facility CapEx &amp; Bank Debt Service:</span>
                    <span className="font-semibold text-brand-100">{naira(selectedDay.outflows.loanServiceAndCapex)}</span>
                  </div>
                </div>
              </div>

              {selectedDay.notes && (
                <div className="rounded border border-brand-800/80 bg-brand-900/40 p-2.5 text-brand-300 italic text-[11px]">
                  Schedule Note: {selectedDay.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg bg-brand-800 px-4 py-2 text-xs font-semibold text-brand-50 hover:bg-brand-700 transition"
              >
                Close Day Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldCheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
