import { useState } from "react";
import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { cashierShifts, glAccounts, journalEntries } from "../data/demo";
import { usePlatform } from "../store/platform";
import { naira } from "../lib/utils";
import { BookOpen, Landmark, Scale, Wallet, FileSpreadsheet, Building2, Receipt, ShieldCheck, TrendingUp } from "lucide-react";
import { USALIStatementsView } from "../components/finance/USALIStatementsView";
import { CityLedgerView } from "../components/finance/CityLedgerView";
import { AccountsPayableView } from "../components/finance/AccountsPayableView";
import { TaxComplianceView } from "../components/finance/TaxComplianceView";
import { CashFlowView } from "../components/finance/CashFlowView";

const CLASS_ORDER = ["asset", "liability", "equity", "revenue", "expense"] as const;
const CLASS_LABEL: Record<string, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expenses",
};

export default function FinancePage() {
  const { folios } = usePlatform();
  const [tab, setTab] = useState<"usali" | "city_ledger" | "ap" | "tax" | "cash_flow" | "coa" | "journal" | "cash">("usali");

  const guestLedger = folios.reduce((a, f) => a + Math.max(-f.balance, 0), 0);
  const depositsHeld = folios.reduce((a, f) => a + Math.max(f.balance, 0), 0);
  const revenueAccounts = glAccounts.filter((a) => a.accountClass === "revenue");
  const expenseAccounts = glAccounts.filter((a) => a.accountClass === "expense");

  const tabs: Array<["usali" | "city_ledger" | "ap" | "tax" | "cash_flow" | "coa" | "journal" | "cash", string, any]> = [
    ["usali", "USALI Statements", FileSpreadsheet],
    ["cash_flow", "Cash Flow Forecast (30D)", TrendingUp],
    ["city_ledger", "City Ledger (AR)", Building2],
    ["ap", "Accounts Payable (3-Way)", Receipt],
    ["tax", "Tax Compliance (VAT/WHT)", ShieldCheck],
    ["coa", "Chart of Accounts", BookOpen],
    ["journal", "Journal Entries", Scale],
    ["cash", "Cash & Banking", Wallet],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Accounting"
        subtitle="USALI 11th Edition · 30-Day Liquidity Projections · City Ledger AR · 3-Way AP Matching · Statutory Tax Compliance"
      />

      <div className="flex flex-wrap gap-2 border-b border-brand-800/80 pb-3">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              tab === key
                ? "border-gold-400/50 bg-brand-500/20 font-semibold text-gold-200 shadow-sm"
                : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600 hover:text-brand-50"
            }`}
          >
            <Icon size={15} className={tab === key ? "text-gold-300" : "text-brand-300"} />
            {label}
          </button>
        ))}
      </div>

      {tab === "usali" && <USALIStatementsView />}
      {tab === "cash_flow" && <CashFlowView />}
      {tab === "city_ledger" && <CityLedgerView />}
      {tab === "ap" && <AccountsPayableView />}
      {tab === "tax" && <TaxComplianceView />}

      {tab === "coa" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Guest Ledger" value={naira(guestLedger, true)} sub="open folio balances" accent="gold" />
            <StatCard label="Deposits Held" value={naira(depositsHeld, true)} sub="advance deposits" accent="emerald" />
            <StatCard label="Cash on Hand" value={naira(cashierShifts.find((c) => c.status === "open")?.openingFloat ?? 0, true)} sub="PM cashier bank" />
            <StatCard label="Journals (Sep)" value={String(journalEntries.length)} sub={`${journalEntries.filter((j) => j.status === "posted").length} posted`} accent="sky" />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {CLASS_ORDER.map((cls) => (
              <Card key={cls} className="lg:col-span-1">
                <CardHeader title={CLASS_LABEL[cls]} subtitle={`${glAccounts.filter((a) => a.accountClass === cls).length} accounts`} />
                <ul className="divide-y divide-brand-800/40">
                  {glAccounts
                    .filter((a) => a.accountClass === cls)
                    .map((a) => (
                      <li key={a.id} className="px-4 py-2.5">
                        <p className="text-sm text-brand-50">{a.accountName}</p>
                        <p className="font-mono text-[11px] text-brand-200/50">{a.accountCode}</p>
                      </li>
                    ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Revenue Accounts (GL)" subtitle="Posted via fin.posting contract from M-LOD · M-FNB · M-EVT" />
              <ul className="divide-y divide-brand-800/40">
                {revenueAccounts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span className="text-brand-100/90">{a.accountName}</span>
                    <span className="font-mono text-xs text-brand-200/50">{a.accountCode}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardHeader title="Expense Accounts (GL)" subtitle={`${expenseAccounts.length} operating & cost accounts`} />
              <ul className="divide-y divide-brand-800/40">
                {expenseAccounts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span className="text-brand-100/90">{a.accountName}</span>
                    <span className="font-mono text-xs text-brand-200/50">{a.accountCode}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {tab === "journal" && (
        <Card>
          <CardHeader title="Journal Entries" subtitle="Double-entry batches — balanced batches only" />
          <Table head={["Entry #", "Date", "Description", "Status"]}>
            {journalEntries.map((j) => (
              <tr key={j.id} className="hover:bg-brand-800/30">
                <Td><span className="font-mono text-xs text-gold-300">{j.entryNumber}</span></Td>
                <Td>{j.entryDate}</Td>
                <Td>{j.description}</Td>
                <Td>
                  <Badge className={j.status === "posted" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-stone-400/40 bg-stone-500/10 text-stone-300"}>
                    {j.status}
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === "cash" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Cashier Shifts" subtitle="Front office cash banks" />
            <Table head={["Shift", "Float", "Sales", "Refunds", "Status"]}>
              {cashierShifts.map((c) => (
                <tr key={c.id} className="hover:bg-brand-800/30">
                  <Td className="font-medium text-brand-50">{c.shiftNumber}</Td>
                  <Td>{naira(c.openingFloat)}</Td>
                  <Td>{naira(c.totalSales)}</Td>
                  <Td>{naira(c.totalRefunds)}</Td>
                  <Td>
                    <Badge className={c.status === "open" ? "border-amber-400/40 bg-amber-500/10 text-amber-200" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"}>
                      {c.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </Table>
            <div className="flex items-center gap-2 border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
              <Wallet size={13} /> Cash-up variance posts to GL at Z-report close
            </div>
          </Card>
          <Card>
            <CardHeader title="Bank Accounts" subtitle="Manual & statement-based reconciliation" />
            <ul className="divide-y divide-brand-800/40">
              <li className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Landmark size={16} className="text-brand-300" />
                  <div>
                    <p className="text-sm font-medium text-brand-50">GTBank — Current</p>
                    <p className="text-xs text-brand-200/50">0123456789 · reconciled to 2026-09-04</p>
                  </div>
                </div>
                <span className="text-sm text-brand-50">₦18,420,500</span>
              </li>
              <li className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Landmark size={16} className="text-brand-300" />
                  <div>
                    <p className="text-sm font-medium text-brand-50">Access Bank — Collection</p>
                    <p className="text-xs text-brand-200/50">9876543210 · 2 unreconciled lines</p>
                  </div>
                </div>
                <span className="text-sm text-brand-50">₦6,115,000</span>
              </li>
              <li className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-brand-300" />
                  <div>
                    <p className="text-sm font-medium text-brand-50">Petty Cash — Housekeeping</p>
                    <p className="text-xs text-brand-200/50">Float ₦50,000 · replenish at ₦10k</p>
                  </div>
                </div>
                <span className="text-sm text-brand-50">₦32,750</span>
              </li>
            </ul>
            <div className="flex items-center gap-2 border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
              <Scale size={13} /> Multi-currency revaluation runs with period close
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

