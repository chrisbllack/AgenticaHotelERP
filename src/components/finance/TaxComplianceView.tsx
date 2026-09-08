import { useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import { Send } from "lucide-react";

export function TaxComplianceView() {
  const { taxSchedules, remitTaxSchedule, businessDate } = usePlatform();
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);
  const [filingRefInput, setFilingRefInput] = useState<string>("");

  const totalTaxPayable = taxSchedules.reduce((acc, t) => acc + t.taxPayable, 0);
  const totalCollected = taxSchedules.reduce((acc, t) => acc + t.collectedToDate, 0);
  const totalRemitted = taxSchedules
    .filter((t) => t.status === "remitted")
    .reduce((acc, t) => acc + t.taxPayable, 0);

  const handleOpenRemit = (id: string, code: string) => {
    setSelectedTaxId(id);
    const dateStamp = businessDate ? businessDate.replace(/-/g, "") : "20260908";
    setFilingRefInput(`${code}-${dateStamp}-REM`);
  };

  const handleConfirmRemit = () => {
    if (!selectedTaxId || !filingRefInput) return;
    remitTaxSchedule(selectedTaxId, filingRefInput);
    setSelectedTaxId(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Monthly Tax Accrual"
          value={naira(totalTaxPayable, true)}
          sub="VAT, Tourism, WHT, PAYE"
          accent="gold"
        />
        <StatCard
          label="Collected at Cashier/Folio"
          value={naira(totalCollected, true)}
          sub="100% collection rate"
          accent="emerald"
        />
        <StatCard
          label="Remitted to Authorities"
          value={naira(totalRemitted, true)}
          sub="FIRS & LIRS treasury receipts"
          accent="sky"
        />
        <StatCard
          label="Pending Remittance"
          value={naira(totalTaxPayable - totalRemitted, true)}
          sub="Due by 21st of month"
          accent="amber"
        />
      </div>

      <Card>
        <CardHeader
          title="Hospitality Statutory Tax Schedules"
          subtitle="Strict adherence to Nigerian Federal Inland Revenue Service (FIRS) and Lagos State Internal Revenue Service (LIRS) guidelines"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
              <tr>
                <th className="px-5 py-3 font-medium">Tax Description & Authority</th>
                <th className="px-4 py-3 font-medium">Reporting Period</th>
                <th className="px-4 py-3 text-right font-medium">Taxable Base (₦)</th>
                <th className="px-4 py-3 text-right font-medium">Tax Payable</th>
                <th className="px-4 py-3 font-medium">Filing Deadline</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Filing Reference / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800/30">
              {taxSchedules.map((tax) => {
                const isRemitted = tax.status === "remitted";
                return (
                  <tr key={tax.id} className="hover:bg-brand-800/20">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-semibold text-brand-50 text-sm">{tax.taxType}</span>
                        <p className="text-[11px] text-brand-300/60">
                          {tax.taxType.includes("Tourism")
                            ? "LIRS Hotel Consumption & Tourism Tax Law"
                            : tax.taxType.includes("VAT")
                            ? "FIRS Value Added Tax (VAT) Act"
                            : tax.taxType.includes("WHT")
                            ? "FIRS Withholding Tax Deduction"
                            : "Personal Income Tax Act (PAYE)"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-brand-200">{tax.period}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-brand-200">
                      {naira(tax.taxableBase)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                      {naira(tax.taxPayable)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-brand-100 font-medium">{tax.dueDate}</span>
                      <p className="text-[10px] text-amber-300/80">Statutory 21st Rule</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {isRemitted ? (
                        <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]">
                          Remitted &amp; Filed
                        </Badge>
                      ) : (
                        <Badge className="border-amber-400/40 bg-amber-500/10 text-amber-300 text-[10px]">
                          Reconciled (Pending E-payment)
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isRemitted ? (
                        <span className="font-mono text-[11px] text-brand-300/70">
                          {tax.filingRef}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenRemit(tax.id, tax.taxType.slice(0, 3).toUpperCase())}
                          className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-1.5 ml-auto"
                        >
                          <Send size={12} />
                          File &amp; Remit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Remit Tax Modal */}
      {selectedTaxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Confirm Statutory Tax Remittance
            </h3>
            <p className="text-xs text-brand-200/70">
              Generate Remita / TaxPro Max e-filing reference for FIRS or LIRS e-portal
            </p>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                E-Filing / Treasury Receipt Reference
              </label>
              <input
                type="text"
                value={filingRefInput}
                onChange={(e) => setFilingRefInput(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none font-mono"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTaxId(null)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemit}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow"
              >
                Confirm Remittance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
