import { useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { AccountsPayableInvoice } from "../../types";
import {
  CheckCircle,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

export function AccountsPayableView() {
  const { accountsPayableInvoices, approveApInvoice, payApInvoice } = usePlatform();
  const [filter, setFilter] = useState<"all" | "pending_3way" | "approved" | "scheduled" | "paid">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<AccountsPayableInvoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [voucherNumber, setVoucherNumber] = useState("");

  const filteredInvoices =
    filter === "all"
      ? accountsPayableInvoices
      : accountsPayableInvoices.filter((i) => i.status === filter);

  const totalPayables = accountsPayableInvoices
    .filter((i) => i.status !== "paid")
    .reduce((acc, i) => acc + i.netPayable, 0);

  const totalApproved = accountsPayableInvoices
    .filter((i) => i.status === "approved" || i.status === "scheduled")
    .reduce((acc, i) => acc + i.netPayable, 0);

  const pending3WayCount = accountsPayableInvoices.filter((i) => i.status === "pending_3way").length;

  const handleOpenPay = (inv: AccountsPayableInvoice) => {
    setSelectedInvoice(inv);
    setVoucherNumber(`PV-2026-${Math.floor(100 + Math.random() * 900)}`);
    setShowPayModal(true);
  };

  const handleExecutePayment = () => {
    if (!selectedInvoice) return;
    payApInvoice(selectedInvoice.id, voucherNumber);
    setShowPayModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* AP Header KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total AP Net Payable"
          value={naira(totalPayables, true)}
          sub="Unsettled vendor obligations"
          accent="gold"
        />
        <StatCard
          label="Approved for Payment"
          value={naira(totalApproved, true)}
          sub="Ready for batch treasury run"
          accent="emerald"
        />
        <StatCard
          label="3-Way Match Pending"
          value={String(pending3WayCount)}
          sub="PO / GRN discrepancy hold"
          accent={pending3WayCount > 0 ? "rose" : "sky"}
        />
        <StatCard
          label="WHT Withheld (YTD)"
          value={naira(5485000, true)}
          sub="Accrued to FIRS remittance"
          accent="sky"
        />
      </div>

      {/* Filter and Workflow Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Status Filter:
          </span>
          {(["all", "pending_3way", "approved", "scheduled", "paid"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === key
                  ? "bg-brand-500/30 text-gold-300 border border-gold-400/40"
                  : "text-brand-200/70 hover:bg-brand-800/50"
              }`}
            >
              {key.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-300/80">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            3-Way Matched: PO = GRN = Invoice
          </span>
        </div>
      </div>

      {/* AP Invoices Table */}
      <Card>
        <CardHeader
          title="Vendor Invoices & 3-Way Match Register"
          subtitle="Hospitality procurement reconciliation: Purchase Order + Goods Received Note + Vendor Bill"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice & Vendor</th>
                <th className="px-4 py-3 font-medium">3-Way Match References</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 text-right font-medium">Gross & VAT</th>
                <th className="px-4 py-3 text-right font-medium">WHT Deduction</th>
                <th className="px-4 py-3 text-right font-medium">Net Payable</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800/30">
              {filteredInvoices.map((inv) => {
                const isApproved = inv.status === "approved";
                const isPaid = inv.status === "paid";
                const isScheduled = inv.status === "scheduled";
                const isPending = inv.status === "pending_3way";

                return (
                  <tr key={inv.id} className="hover:bg-brand-800/20">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-mono text-xs font-semibold text-gold-300">
                          {inv.invoiceNumber}
                        </span>
                        <p className="font-medium text-brand-100 text-sm">{inv.vendorName}</p>
                        <span className="text-[11px] text-brand-300/60">{inv.category}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-brand-300/60">PO:</span>
                          <span className="font-mono text-brand-200">{inv.poNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-brand-300/60">GRN:</span>
                          <span className="font-mono text-brand-200">{inv.grnNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {inv.threeWayMatched ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                              <CheckCircle size={11} /> Matched
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                              <AlertTriangle size={11} /> Discrepancy Found
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-brand-200">{inv.dueDate}</span>
                      <p className="text-[10px] text-brand-300/60">Inv: {inv.invoiceDate}</p>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono">
                      <div className="text-brand-100 font-medium">{naira(inv.grossAmount)}</div>
                      <div className="text-[10px] text-brand-300/60">
                        +7.5% VAT: {naira(inv.vatAmount)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono">
                      <span className="text-amber-300 font-medium">
                        -{naira(inv.whtAmount)}
                      </span>
                      <p className="text-[10px] text-brand-300/60">
                        {(inv.whtRate * 100).toFixed(0)}% WHT
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono">
                      <span className="text-sm font-bold text-emerald-400">
                        {naira(inv.netPayable)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {isPaid ? (
                        <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]">
                          Paid ({inv.paymentVoucherRef})
                        </Badge>
                      ) : isScheduled ? (
                        <Badge className="border-sky-400/40 bg-sky-500/10 text-sky-300 text-[10px]">
                          Scheduled ({inv.paymentBatchId})
                        </Badge>
                      ) : isApproved ? (
                        <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]">
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="border-amber-400/40 bg-amber-500/10 text-amber-300 text-[10px]">
                          Pending 3-Way
                        </Badge>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <button
                            onClick={() => approveApInvoice(inv.id)}
                            className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/30 transition"
                          >
                            Resolve &amp; Approve
                          </button>
                        )}
                        {(isApproved || isScheduled) && (
                          <button
                            onClick={() => handleOpenPay(inv)}
                            className="rounded-lg bg-gold-500/20 border border-gold-400/50 px-2.5 py-1 text-[11px] font-semibold text-gold-200 hover:bg-gold-500/30 transition flex items-center gap-1"
                          >
                            <CreditCard size={12} />
                            Pay Voucher
                          </button>
                        )}
                        {isPaid && (
                          <span className="text-[11px] text-brand-300/60 font-mono">
                            {inv.paymentVoucherRef}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pay Voucher Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Generate Treasury Payment Voucher
            </h3>
            <p className="text-xs text-brand-200/70">
              Disburse net payable to {selectedInvoice.vendorName}
            </p>

            <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-brand-200/70">
                <span>Invoice Number:</span>
                <span className="font-mono text-brand-50">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-brand-200/70">
                <span>Gross Payable:</span>
                <span className="font-mono text-brand-50">{naira(selectedInvoice.grossAmount)}</span>
              </div>
              <div className="flex justify-between text-brand-200/70">
                <span>WHT Deducted at Source:</span>
                <span className="font-mono text-amber-300">-{naira(selectedInvoice.whtAmount)}</span>
              </div>
              <div className="flex justify-between text-brand-50 font-bold border-t border-brand-800 pt-2 text-sm">
                <span>Net Transfer Amount:</span>
                <span className="font-mono text-emerald-400">{naira(selectedInvoice.netPayable)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Payment Voucher Reference (PV #)
              </label>
              <input
                type="text"
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow"
              >
                Execute Bank Transfer &amp; Post PV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
