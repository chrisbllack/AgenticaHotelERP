import { useState } from "react";
import { Card, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { CityLedgerInvoice } from "../../types";
import {
  FileText,
  Plus,
  Send,
  DollarSign,
  Phone,
  Mail,
} from "lucide-react";

export function CityLedgerView() {
  const { cityLedgerAccounts, recordCityLedgerPayment, createCityLedgerInvoice } = usePlatform();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    cityLedgerAccounts[0]?.id || ""
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CityLedgerInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvGuest, setNewInvGuest] = useState("");
  const [newInvFolio, setNewInvFolio] = useState("");
  const [newInvAmount, setNewInvAmount] = useState(0);

  const selectedAccount =
    cityLedgerAccounts.find((a) => a.id === selectedAccountId) || cityLedgerAccounts[0];

  // Aggregated Aging
  const totalArBalance = cityLedgerAccounts.reduce((acc, a) => acc + a.currentBalance, 0);
  const totalCurrent = cityLedgerAccounts.reduce((acc, a) => acc + a.aging.current, 0);
  const total31to60 = cityLedgerAccounts.reduce((acc, a) => acc + a.aging.days31to60, 0);
  const total61to90 = cityLedgerAccounts.reduce((acc, a) => acc + a.aging.days61to90, 0);
  const totalOver90 = cityLedgerAccounts.reduce((acc, a) => acc + a.aging.over90, 0);

  const handleOpenPayment = (inv: CityLedgerInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.netPayable);
    setShowPaymentModal(true);
  };

  const handleExecutePayment = () => {
    if (!selectedAccount || !selectedInvoice) return;
    recordCityLedgerPayment(selectedAccount.id, selectedInvoice.id, paymentAmount);
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !newInvGuest || newInvAmount <= 0) return;
    const wht = Math.round(newInvAmount * 0.05); // 5% WHT
    createCityLedgerInvoice(selectedAccount.id, {
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      guestName: newInvGuest,
      folioNumber: newInvFolio || `FOL-${Math.floor(8000 + Math.random() * 1000)}`,
      amount: newInvAmount,
      whtAmount: wht,
      status: "invoiced",
    });
    setShowNewInvoiceModal(false);
    setNewInvGuest("");
    setNewInvFolio("");
    setNewInvAmount(0);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Aging Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total City Ledger AR"
          value={naira(totalArBalance, true)}
          sub={`${cityLedgerAccounts.length} Corporate Accounts`}
          accent="gold"
        />
        <StatCard
          label="Current (0-30 Days)"
          value={naira(totalCurrent, true)}
          sub="Healthy terms"
          accent="emerald"
        />
        <StatCard
          label="31 - 60 Days"
          value={naira(total31to60, true)}
          sub="Follow-up notice sent"
          accent="sky"
        />
        <StatCard
          label="61 - 90 Days"
          value={naira(total61to90, true)}
          sub="Escalation active"
          accent="gold"
        />
        <StatCard
          label="Over 90 Days (Delinquent)"
          value={naira(totalOver90, true)}
          sub="Credit lock applied"
          accent="rose"
        />
      </div>

      {/* Main Two-Column Layout: Account Directory & Account Detail */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Account Directory */}
        <Card className="lg:col-span-4 p-0">
          <div className="border-b border-brand-800/80 bg-brand-900/60 p-4">
            <h3 className="font-display font-semibold text-brand-50">Direct Billing Directory</h3>
            <p className="text-xs text-brand-200/60">Select corporate account to view ledger</p>
          </div>
          <div className="divide-y divide-brand-800/40">
            {cityLedgerAccounts.map((acc) => {
              const isSelected = acc.id === selectedAccount?.id;
              const creditUsagePct = Math.min(
                100,
                Math.round((acc.currentBalance / acc.creditLimit) * 100)
              );

              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`w-full text-left p-4 transition ${
                    isSelected
                      ? "bg-brand-800/60 border-l-4 border-l-gold-400"
                      : "hover:bg-brand-800/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gold-300">{acc.accountNumber}</span>
                        {acc.status === "on_hold" && (
                          <Badge className="border-rose-400/40 bg-rose-500/10 text-rose-300 text-[10px]">
                            Credit Hold
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-brand-50 mt-0.5">{acc.companyName}</h4>
                      <p className="text-xs text-brand-200/60">{acc.contactPerson}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold text-brand-100">
                        {naira(acc.currentBalance)}
                      </span>
                      <p className="text-[11px] text-brand-300/60">
                        Limit: {naira(acc.creditLimit, true)}
                      </p>
                    </div>
                  </div>

                  {/* Credit Utilization Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-brand-200/60 mb-1">
                      <span>Credit Used</span>
                      <span>{creditUsagePct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-brand-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          creditUsagePct > 80
                            ? "bg-rose-400"
                            : creditUsagePct > 50
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{ width: `${creditUsagePct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right Column: Selected Account Statement & Folio Invoices */}
        {selectedAccount && (
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4 p-5 border-b border-brand-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gold-300 font-semibold">
                      {selectedAccount.accountNumber}
                    </span>
                    <Badge
                      className={
                        selectedAccount.status === "active"
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-400/40 bg-rose-500/10 text-rose-300"
                      }
                    >
                      {selectedAccount.status === "active" ? "Direct Billing Active" : "Account On Hold"}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-display font-bold text-brand-50 mt-1">
                    {selectedAccount.companyName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-brand-200/70">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-brand-400" />
                      {selectedAccount.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-brand-400" />
                      {selectedAccount.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewInvoiceModal(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-gold-500/20 border border-gold-400/50 px-3 py-1.5 text-xs font-semibold text-gold-200 hover:bg-gold-500/30 transition"
                  >
                    <Plus size={14} />
                    Direct Bill Folio
                  </button>
                  <button
                    onClick={() =>
                      alert(`Statement of Account for ${selectedAccount.companyName} generated for email dispatch.`)
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-800/40 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-700/40 transition"
                  >
                    <Send size={13} />
                    Send Statement
                  </button>
                </div>
              </div>

              {/* Aging Breakdown for Selected Account */}
              <div className="grid grid-cols-4 divide-x divide-brand-800/60 border-b border-brand-800/80 bg-brand-950/40 p-4 text-center text-xs">
                <div>
                  <span className="text-brand-300/70">Current (0-30d)</span>
                  <p className="font-mono text-sm font-semibold text-emerald-300 mt-0.5">
                    {naira(selectedAccount.aging.current)}
                  </p>
                </div>
                <div>
                  <span className="text-brand-300/70">31-60 Days</span>
                  <p className="font-mono text-sm font-semibold text-amber-300 mt-0.5">
                    {naira(selectedAccount.aging.days31to60)}
                  </p>
                </div>
                <div>
                  <span className="text-brand-300/70">61-90 Days</span>
                  <p className="font-mono text-sm font-semibold text-orange-300 mt-0.5">
                    {naira(selectedAccount.aging.days61to90)}
                  </p>
                </div>
                <div>
                  <span className="text-brand-300/70">&gt;90 Days</span>
                  <p className="font-mono text-sm font-semibold text-rose-300 mt-0.5">
                    {naira(selectedAccount.aging.over90)}
                  </p>
                </div>
              </div>

              {/* Invoices List */}
              <div className="p-5">
                <h4 className="text-sm font-semibold text-brand-50 mb-3 flex items-center justify-between">
                  <span>Invoices & Folio Transfers</span>
                  <span className="text-xs text-brand-200/60">
                    {selectedAccount.invoices.length} invoices on file
                  </span>
                </h4>

                <div className="space-y-3">
                  {selectedAccount.invoices.map((inv) => {
                    const isSettled = inv.status === "settled";
                    const isOverdue = inv.status === "overdue";

                    return (
                      <div
                        key={inv.id}
                        className="rounded-xl border border-brand-800/70 bg-brand-900/40 p-4 transition hover:border-brand-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800/80 text-brand-300">
                              <FileText size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-gold-300">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="text-xs text-brand-200/60">
                                  ({inv.folioNumber})
                                </span>
                                {isSettled ? (
                                  <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]">
                                    Settled
                                  </Badge>
                                ) : isOverdue ? (
                                  <Badge className="border-rose-400/40 bg-rose-500/10 text-rose-300 text-[10px]">
                                    {inv.daysOverdue} Days Overdue
                                  </Badge>
                                ) : (
                                  <Badge className="border-sky-400/40 bg-sky-500/10 text-sky-300 text-[10px]">
                                    Outstanding
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-brand-100 font-medium mt-0.5">
                                {inv.guestName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[11px] text-brand-300/70">
                                Net after 5% WHT
                              </span>
                              <p className="font-mono text-sm font-bold text-brand-50">
                                {naira(inv.netPayable)}
                              </p>
                              <p className="text-[10px] text-brand-300/50">
                                Gross: {naira(inv.amount)} · WHT: -{naira(inv.whtAmount || 0)}
                              </p>
                            </div>

                            {!isSettled && (
                              <button
                                onClick={() => handleOpenPayment(inv)}
                                className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-1.5"
                              >
                                <DollarSign size={13} />
                                Settle
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-brand-800/40 pt-2 text-[11px] text-brand-300/60">
                          <span>Issued: {inv.issueDate}</span>
                          <span>Due: {inv.dueDate}</span>
                          {inv.settledAt && (
                            <span className="text-emerald-300">Paid: {inv.settledAt}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Settle Payment Modal */}
      {showPaymentModal && selectedInvoice && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl">
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Record Direct Billing Payment
            </h3>
            <p className="text-xs text-brand-200/70 mt-1">
              {selectedAccount.companyName} · {selectedInvoice.invoiceNumber}
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-3 text-xs space-y-1">
                <div className="flex justify-between text-brand-200/70">
                  <span>Gross Folio Amount:</span>
                  <span className="font-mono text-brand-50">{naira(selectedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between text-brand-200/70">
                  <span>Withholding Tax (5% WHT):</span>
                  <span className="font-mono text-amber-300">
                    -{naira(selectedInvoice.whtAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-brand-50 pt-1 border-t border-brand-800">
                  <span>Net Remittance Expected:</span>
                  <span className="font-mono text-emerald-400">
                    {naira(selectedInvoice.netPayable)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">
                  Amount Received (₦)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayment}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Direct Bill Invoice Modal */}
      {showNewInvoiceModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateInvoice}
            className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Direct Bill Folio to {selectedAccount.companyName}
            </h3>
            <p className="text-xs text-brand-200/70">
              Transfer guest check-out folio to corporate account ledger
            </p>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Guest / Delegation Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Dr. Babatunde & Offshore Crew"
                value={newInvGuest}
                onChange={(e) => setNewInvGuest(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Folio Reference #
              </label>
              <input
                type="text"
                placeholder="e.g. FOL-8995"
                value={newInvFolio}
                onChange={(e) => setNewInvFolio(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Folio Balance to Bill (₦)
              </label>
              <input
                required
                type="number"
                min="1"
                placeholder="e.g. 3500000"
                value={newInvAmount || ""}
                onChange={(e) => setNewInvAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
              <p className="text-[11px] text-brand-300/60 mt-1">
                5% WHT will automatically be calculated (₦{Math.round(newInvAmount * 0.05).toLocaleString()})
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(false)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 shadow"
              >
                Post to City Ledger
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
