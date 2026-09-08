import { useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import { initialHospitalityKpis } from "../../data/hospitalityEnterpriseData";
import {
  BedDouble,
  Utensils,
  Sparkles,
  Download,
  Building2,
} from "lucide-react";

export function USALIStatementsView() {
  const { usaliStatements } = usePlatform();
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [period, setPeriod] = useState<"month" | "ytd">("month");

  const filteredStatements =
    selectedDept === "all"
      ? usaliStatements
      : usaliStatements.filter((s) => s.department === selectedDept);

  return (
    <div className="space-y-6">
      {/* Hospitality Core Executive KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="ADR"
          value={naira(initialHospitalityKpis.adr)}
          sub="Avg Daily Room Rate"
          accent="gold"
        />
        <StatCard
          label="RevPAR"
          value={naira(initialHospitalityKpis.revpar)}
          sub="Revenue per Avail Room"
          accent="emerald"
        />
        <StatCard
          label="TrevPAR"
          value={naira(initialHospitalityKpis.trevpar)}
          sub="Total Rev per Avail Room"
          accent="sky"
        />
        <StatCard
          label="Occupancy"
          value={`${initialHospitalityKpis.occupancyPct}%`}
          sub={`${initialHospitalityKpis.roomsSoldMonth} / ${initialHospitalityKpis.availableRoomNights} room nights`}
        />
        <StatCard
          label="GOP Margin"
          value="49.8%"
          sub={naira(initialHospitalityKpis.grossOperatingProfit, true)}
          accent="emerald"
        />
        <StatCard
          label="CPOR"
          value={naira(initialHospitalityKpis.costPerOccupiedRoom)}
          sub="Cost Per Occupied Room"
        />
      </div>

      {/* Filter and Period Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            USALI Dept:
          </span>
          <button
            onClick={() => setSelectedDept("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              selectedDept === "all"
                ? "bg-brand-500/30 text-gold-300 border border-gold-400/40"
                : "text-brand-200/70 hover:bg-brand-800/50"
            }`}
          >
            All Departments
          </button>
          {usaliStatements.map((dept) => (
            <button
              key={dept.department}
              onClick={() => setSelectedDept(dept.department)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedDept === dept.department
                  ? "bg-brand-500/30 text-gold-300 border border-gold-400/40"
                : "text-brand-200/70 hover:bg-brand-800/50"
              }`}
            >
              {dept.department}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-brand-700/60 bg-brand-950/60 p-0.5 text-xs">
            <button
              onClick={() => setPeriod("month")}
              className={`rounded px-2.5 py-1 transition ${
                period === "month"
                  ? "bg-brand-600 text-brand-50 font-medium"
                  : "text-brand-300 hover:text-brand-100"
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setPeriod("ytd")}
              className={`rounded px-2.5 py-1 transition ${
                period === "ytd"
                  ? "bg-brand-600 text-brand-50 font-medium"
                  : "text-brand-300 hover:text-brand-100"
              }`}
            >
              YTD (9 Months)
            </button>
          </div>

          <button
            onClick={() => alert("USALI 11th Edition Financial Report exported to Excel/PDF")}
            className="flex items-center gap-1.5 rounded-lg border border-brand-700/70 bg-brand-800/40 px-3 py-1.5 text-xs text-brand-100 hover:bg-brand-700/40 transition"
          >
            <Download size={13} />
            Export USALI
          </button>
        </div>
      </div>

      {/* Summary Summary Card: GOP & EBITDA Waterfall */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-gold-500/30 bg-gradient-to-br from-brand-900/90 to-brand-950/90">
          <CardHeader
            title="Total Operating Revenue"
            subtitle="Gross hospitality revenue across all profit centers"
          />
          <div className="p-5 pt-0 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gold-300">
                {naira(initialHospitalityKpis.totalRevenue)}
              </span>
              <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
                +6.2% vs Budget
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-brand-200/80">
              <div className="flex justify-between py-1 border-b border-brand-800/50">
                <span>Rooms Department (60.2%)</span>
                <span className="font-mono text-brand-100">{naira(184500000)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-800/50">
                <span>Food & Beverage (33.6%)</span>
                <span className="font-mono text-brand-100">{naira(103000000)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Other Operated (Spa & Business)</span>
                <span className="font-mono text-brand-100">{naira(19000000)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-emerald-500/30 bg-gradient-to-br from-brand-900/90 to-brand-950/90">
          <CardHeader
            title="Gross Operating Profit (GOP)"
            subtitle="After all departmental & undistributed expenses"
          />
          <div className="p-5 pt-0 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400">
                {naira(initialHospitalityKpis.grossOperatingProfit)}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                49.8% GOP Margin
              </span>
            </div>
            <div className="space-y-1 text-xs text-brand-200/80">
              <div className="flex justify-between py-1 border-b border-brand-800/50">
                <span>Total Departmental Profits</span>
                <span className="font-mono text-brand-100">{naira(initialHospitalityKpis.totalDeptProfit)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-800/50">
                <span>Less: Undistributed Expenses (A&G, POM, Util)</span>
                <span className="font-mono text-rose-300">-{naira(initialHospitalityKpis.undistributedExpenses)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Net Departmental Contribution</span>
                <span className="font-mono text-emerald-300">67.5% of Total Rev</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-sky-500/30 bg-gradient-to-br from-brand-900/90 to-brand-950/90">
          <CardHeader
            title="EBITDA & Reserves"
            subtitle="Owner's bottom-line cashflow metrics"
          />
          <div className="p-5 pt-0 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-sky-300">
                {naira(initialHospitalityKpis.ebitda)}
              </span>
              <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
                41.8% EBITDA
              </span>
            </div>
            <div className="space-y-1 text-xs text-brand-200/80">
              <div className="flex justify-between py-1 border-b border-brand-800/50">
                <span>Management Fees (Base 3% + Incentive)</span>
                <span className="font-mono text-brand-100">-{naira(initialHospitalityKpis.managementFee)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-800/50">
                <span>FF&E Reserve (4.0% escrow)</span>
                <span className="font-mono text-brand-100">-{naira(initialHospitalityKpis.ffAndEReserve)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Net Operating Income (NOI)</span>
                <span className="font-mono text-sky-300">{naira(initialHospitalityKpis.ebitda)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Department Statements Table */}
      <div className="space-y-6">
        {filteredStatements.map((stmt) => {
          const isOperated = stmt.grossRevenue > 0;
          return (
            <Card key={stmt.department} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between border-b border-brand-800/80 bg-brand-900/80 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800/80 text-gold-400">
                    {stmt.department === "Rooms" ? (
                      <BedDouble size={18} />
                    ) : stmt.department === "Food & Beverage" ? (
                      <Utensils size={18} />
                    ) : stmt.department === "Other Operated" ? (
                      <Sparkles size={18} />
                    ) : (
                      <Building2 size={18} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-brand-50">{stmt.title}</h3>
                    <p className="text-xs text-brand-200/60">
                      USALI Department Code: {stmt.department.toUpperCase().replace(/\s+/g, "_")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {isOperated && (
                    <div className="text-right">
                      <span className="text-xs text-brand-200/60">Gross Revenue</span>
                      <p className="font-mono text-sm font-semibold text-brand-50">
                        {naira(stmt.grossRevenue)}
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-xs text-brand-200/60">
                      {isOperated ? "Dept Profit" : "Total Allocated Cost"}
                    </span>
                    <p
                      className={`font-mono text-sm font-semibold ${
                        stmt.departmentalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {naira(Math.abs(stmt.departmentalProfit))}
                      {stmt.marginPct !== -100 && (
                        <span className="ml-1.5 text-xs text-brand-200/60">
                          ({stmt.marginPct}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Account Code & Line Description</th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        {period === "month" ? "Month Actual" : "YTD Actual"}
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        {period === "month" ? "Budget" : "YTD Budget"}
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">Variance</th>
                      <th className="px-5 py-2.5 text-right font-medium">% Dept Rev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-800/30">
                    {stmt.lines.map((line) => {
                      const actual = period === "month" ? line.monthActual : line.ytdActual;
                      const budget = period === "month" ? line.monthBudget : line.ytdBudget;
                      const variance = period === "month" ? line.monthVariance : actual - budget;
                      const isExpense = line.code.startsWith("EXP");

                      // For expenses: negative variance (actual > budget) is unfavorable (red)
                      // For revenue: positive variance (actual > budget) is favorable (green)
                      const isFavorable = isExpense ? variance >= 0 : variance >= 0;

                      return (
                        <tr key={line.code} className="hover:bg-brand-800/20">
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-brand-400">
                                {line.code}
                              </span>
                              <span className="text-brand-100">{line.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium text-brand-50">
                            {naira(actual)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-brand-200/60">
                            {naira(budget)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                isFavorable
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-rose-500/10 text-rose-300"
                              }`}
                            >
                              {variance >= 0 ? "+" : ""}
                              {naira(variance)}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono text-brand-200/70">
                            {line.pctRevenue.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
