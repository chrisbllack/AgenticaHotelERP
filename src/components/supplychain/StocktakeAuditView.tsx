import { useState } from "react";
import { Card, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { StocktakeAudit } from "../../types";
import { CheckCircle2 } from "lucide-react";

export function StocktakeAuditView() {
  const { stocktakeAudits } = usePlatform();
  const [selectedAudit, setSelectedAudit] = useState<StocktakeAudit | null>(
    stocktakeAudits[0] || null
  );

  const totalVarianceCost = stocktakeAudits.reduce((acc, a) => acc + a.netVarianceCost, 0);

  return (
    <div className="space-y-6">
      {/* Stocktake KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Net Stocktake Variance"
          value={naira(Math.abs(totalVarianceCost), true)}
          sub="Cumulative audit shrinkage"
          accent="rose"
        />
        <StatCard
          label="Audit Accuracy Rate"
          value="98.7%"
          sub="Tolerance limit: ±2%"
          accent="emerald"
        />
        <StatCard
          label="Stores Audited"
          value={`${stocktakeAudits.length} Audits`}
          sub="Monthly cycle count"
          accent="gold"
        />
        <StatCard
          label="Audit Reconciliation"
          value="GL Journal Posted"
          sub="Shrinkage expensed to F&B"
          accent="sky"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <span className="text-xs text-brand-300">
          Cycle counts and monthly blind stocktakes identify shrinkage, recipe yield leakage, and theft across stores.
        </span>
      </div>

      {/* Audits Split View */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Audit Records List */}
        <Card className="lg:col-span-5 p-0">
          <div className="border-b border-brand-800/80 bg-brand-900/60 p-4">
            <h3 className="font-display font-semibold text-brand-50">Stocktake Audit Sessions</h3>
            <p className="text-xs text-brand-200/60">Cycle counts &amp; period-end audits</p>
          </div>
          <div className="divide-y divide-brand-800/40">
            {stocktakeAudits.map((a) => {
              const isSelected = a.id === selectedAudit?.id;
              const hasLoss = a.netVarianceCost < 0;

              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAudit(a)}
                  className={`w-full text-left p-4 transition ${
                    isSelected
                      ? "bg-brand-800/60 border-l-4 border-l-gold-400"
                      : "hover:bg-brand-800/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gold-300 font-semibold">
                          {a.auditNumber}
                        </span>
                        <Badge
                          className={
                            a.status === "reconciled"
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]"
                              : "border-sky-400/40 bg-sky-500/10 text-sky-300 text-[10px]"
                          }
                        >
                          {a.status.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-brand-50 mt-1">{a.storeName}</h4>
                      <p className="text-xs text-brand-200/60">{a.auditedBy} · {a.date}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono text-sm font-semibold ${
                          hasLoss ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {naira(a.netVarianceCost)}
                      </span>
                      <p className="text-[10px] text-brand-300/60 mt-0.5">Net Variance</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right: Variance Breakdown Detail */}
        {selectedAudit && (
          <Card className="lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between border-b border-brand-800/80 p-5">
              <div>
                <span className="font-mono text-xs text-gold-300 font-semibold">
                  {selectedAudit.auditNumber} · Stock Audit
                </span>
                <h2 className="text-xl font-display font-bold text-brand-50 mt-1">
                  {selectedAudit.storeName}
                </h2>
                <p className="text-xs text-brand-200/60 mt-1">
                  Audited by: <span className="text-brand-100">{selectedAudit.auditedBy}</span> on{" "}
                  <span className="font-mono text-brand-200">{selectedAudit.date}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-brand-200/60">Net Variance Impact</span>
                <p
                  className={`font-display text-2xl font-bold ${
                    selectedAudit.netVarianceCost < 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {naira(selectedAudit.netVarianceCost)}
                </p>
                <p className="text-[11px] text-brand-300/60">Status: {selectedAudit.status}</p>
              </div>
            </div>

            {/* Audit Line Items Table */}
            <div className="p-5">
              <h4 className="text-sm font-semibold text-brand-50 mb-3">
                System Book Stock vs. Physical Count Comparison
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
                    <tr>
                      <th className="px-4 py-2 font-medium">Item Description</th>
                      <th className="px-3 py-2 text-right font-medium">System Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Physical Count</th>
                      <th className="px-3 py-2 text-right font-medium">Variance</th>
                      <th className="px-4 py-2 text-right font-medium">Cost Impact</th>
                      <th className="px-4 py-2 font-medium">Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-800/30">
                    {selectedAudit.items.map((item, idx) => {
                      const isNegative = item.variance < 0;

                      return (
                        <tr key={idx} className="hover:bg-brand-800/20">
                          <td className="px-4 py-2.5 font-medium text-brand-100">{item.productName}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-brand-300">
                            {item.systemQuantity} {item.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-brand-100 font-semibold">
                            {item.physicalQuantity} {item.unit}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right font-mono font-bold ${
                              isNegative ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {item.variance > 0 ? `+${item.variance}` : item.variance} {item.unit}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-mono font-semibold ${
                              isNegative ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {naira(item.varianceCost)}
                          </td>
                          <td className="px-4 py-2.5 text-brand-300/70 text-[11px]">{item.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>
                  Physical audit reconciled against General Ledger. Inventory valuation adjusted automatically in
                  USALI Cost of Sales (Line 5100).
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
