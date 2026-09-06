import { Card, CardHeader, Badge, Table, Td, StatCard, EmptyState } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { paymentMethods, posOrders, folios } from "../data/demo";
import { usePlatform } from "../store/platform";
import { naira } from "../lib/utils";
import { Banknote, CheckCircle2, Clock, Landmark, Wallet } from "lucide-react";

const METHOD_ICON: Record<string, string> = {
  cash: "💵",
  card: "💳",
  transfer: "🏦",
  online: "🌐",
  mobile: "📱",
  credit: "🏨",
  complimentary: "🎁",
};

const METHOD_CHIP: Record<string, string> = {
  cash: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  card: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  transfer: "border-brand-400/40 bg-brand-500/15 text-brand-100",
  online: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  mobile: "border-violet-400/40 bg-violet-500/15 text-violet-200",
  credit: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  complimentary: "border-stone-400/40 bg-stone-500/15 text-stone-300",
};

export default function PaymentsPage() {
  const { orders, folioLines } = usePlatform();

  const posPaid = posOrders.filter((o) => o.paymentStatus === "paid");
  const posPending = posOrders.filter((o) => o.paymentStatus === "pending");
  const settledTotal = posPaid.reduce((a, o) => a + o.total, 0);
  const pendingTotal = posPending.reduce((a, o) => a + o.total, 0);
  const guestLedger = folios.reduce((a, f) => a + Math.abs(Math.min(f.balance, 0)), 0);
  const paymentsReceived = folioLines.filter((l) => l.type === "credit").reduce((a, l) => a + Math.abs(l.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions & Settlement"
        subtitle="M-PRA · payment methods, gateway settlement, city & guest ledger"
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-sm font-semibold text-brand-950 transition-colors hover:from-gold-400 hover:to-gold-500">
            <Landmark size={14} /> Run settlement batch
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Settled today" value={naira(settledTotal, true)} sub={`${posPaid.length} POS orders`} accent="emerald" />
        <StatCard label="Awaiting settlement" value={naira(pendingTotal, true)} sub={`${posPending.length} open orders`} accent="gold" />
        <StatCard label="Guest ledger due" value={naira(guestLedger, true)} sub="in-house folio balances" />
        <StatCard label="Payments received" value={naira(paymentsReceived, true)} sub="front desk collections" accent="sky" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Payment Methods" subtitle="Configured tender types at this property" />
          <ul className="divide-y divide-brand-800/50">
            {paymentMethods.map((m) => (
              <li key={m.code} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg">{METHOD_ICON[m.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-50">{m.name}</p>
                  <p className="text-[11px] text-brand-200/50">{m.code} · {m.type}</p>
                </div>
                {m.isActive ? (
                  <Badge className="border-emerald-400/40 bg-emerald-500/15 text-emerald-200">
                    <CheckCircle2 size={11} /> Active
                  </Badge>
                ) : (
                  <Badge className="border-stone-400/40 bg-stone-500/15 text-stone-300">Disabled</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Gateway Status" subtitle="Nigerian payment processors connected to M-PRA" />
          <Table head={["Gateway", "Type", "Status", "Settlement"]}>
            <tr className="hover:bg-brand-800/30">
              <Td><span className="font-medium text-brand-50">Paystack</span></Td>
              <Td>Online / cards</Td>
              <Td><Badge className={METHOD_CHIP.online}>Healthy</Badge></Td>
              <Td>T+1 · GTBank</Td>
            </tr>
            <tr className="hover:bg-brand-800/30">
              <Td><span className="font-medium text-brand-50">Flutterwave</span></Td>
              <Td>Online / USSD</Td>
              <Td><Badge className={METHOD_CHIP.online}>Healthy</Badge></Td>
              <Td>T+1 · GTBank</Td>
            </tr>
            <tr className="hover:bg-brand-800/30">
              <Td><span className="font-medium text-brand-50">Moniepoint</span></Td>
              <Td>POS terminals</Td>
              <Td><Badge className={METHOD_CHIP.card}>Healthy</Badge></Td>
              <Td>T+0 · Wema</Td>
            </tr>
            <tr className="hover:bg-brand-800/30">
              <Td><span className="font-medium text-brand-50">OPay</span></Td>
              <Td>Mobile money</Td>
              <Td><Badge className={METHOD_CHIP.mobile}>Healthy</Badge></Td>
              <Td>T+1 · OPay wallet</Td>
            </tr>
          </Table>
          <p className="border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
            Card data never touches INFINEON storage — gateway tokens only (PCI-DSS SAQ-A posture).
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Transaction Ledger" subtitle="POS orders with payment state — folio postings flow through front desk" />
        {orders.length === 0 ? (
          <EmptyState title="No transactions yet" hint="Close a POS order to see it here." />
        ) : (
          <Table head={["Order", "Outlet", "Amount", "State", ""]}>
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-brand-800/30">
                <Td><span className="font-mono text-xs text-gold-300">{o.orderNumber}</span></Td>
                <Td>{o.outletId.replace("outlet-", "")}</Td>
                <Td>{naira(o.total)}</Td>
                <Td>
                  {o.paymentStatus === "paid" ? (
                    <Badge className="border-emerald-400/40 bg-emerald-500/15 text-emerald-200"><CheckCircle2 size={11} /> Settled</Badge>
                  ) : (
                    <Badge className="border-amber-400/40 bg-amber-500/15 text-amber-200"><Clock size={11} /> Pending</Badge>
                  )}
                </Td>
                <Td>
                  {o.paymentStatus === "pending" ? (
                    <button className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-100 hover:border-gold-500/50 hover:text-gold-300">
                      Capture
                    </button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </Table>
        )}
        <p className="flex items-center gap-2 border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
          <Banknote size={13} /> Night audit totals all settled tenders into the cashier shift before the GL rollup.
        </p>
      </Card>

      <div className="flex items-center gap-2 text-xs text-brand-200/40">
        <Wallet size={13} /> M-PRA submodule · settlement runs are reversible with an audit-linked reversal entry.
      </div>
    </div>
  );
}
