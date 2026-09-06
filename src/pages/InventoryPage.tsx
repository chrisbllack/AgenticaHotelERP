import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { inventoryProducts, stores, suppliers, purchaseOrders, stockLevels } from "../data/demo";
import { naira, num } from "../lib/utils";
import { ArrowRight } from "lucide-react";

const PO_STATUS: Record<string, string> = {
  draft: "border-stone-400/40 bg-stone-500/10 text-stone-300",
  pending_approval: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  approved: "border-sky-400/40 bg-sky-500/10 text-sky-200",
  received: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

export default function InventoryPage() {
  const [tab, setTab] = useState<"stock" | "po" | "suppliers">("stock");

  const totalsByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stockLevels) map.set(s.productId, (map.get(s.productId) ?? 0) + s.quantity);
    return map;
  }, []);

  const lowStock = inventoryProducts.filter((p) => (totalsByProduct.get(p.id) ?? 0) <= p.reorderLevel);
  const stockValue = inventoryProducts.reduce(
    (a, p) => a + (totalsByProduct.get(p.id) ?? 0) * p.costPrice,
    0,
  );

  const tabs: Array<["stock" | "po" | "suppliers", string]> = [
    ["stock", "Stock on Hand"],
    ["po", "Purchase Orders"],
    ["suppliers", "Suppliers"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory & Procurement" subtitle="Multi-store stock, reorder control, procure-to-pay" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="SKUs Tracked" value={String(inventoryProducts.length)} sub={`${stores.length} stores`} />
        <StatCard label="Stock Value" value={naira(stockValue, true)} sub="at last cost" accent="gold" />
        <StatCard label="Below Reorder" value={String(lowStock.length)} sub="requisition suggested" accent="rose" />
        <StatCard label="Open POs" value={String(purchaseOrders.filter((p) => p.status !== "received" && p.status !== "cancelled").length)} sub="in pipeline" accent="sky" />
      </div>

      {lowStock.length > 0 ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          {lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or below reorder level: {lowStock.slice(0, 4).map((p) => p.name).join(", ")}
          {lowStock.length > 4 ? ` +${lowStock.length - 4} more` : ""}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg border px-4 py-2 text-sm ${
              tab === key ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50" : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <Card>
          <CardHeader title="Stock on Hand" subtitle="Quantities per store — highlight = at/below reorder" />
          <Table head={["SKU", "Product", "Category", "Per store", "Total", "Reorder at", "Value"]}>
            {inventoryProducts.map((p) => {
              const perStore = stores
                .map((st) => ({ store: st, qty: stockLevels.find((s) => s.productId === p.id && s.storeId === st.id)?.quantity ?? 0 }))
                .filter((x) => x.qty > 0);
              const totalQty = totalsByProduct.get(p.id) ?? 0;
              const low = totalQty <= p.reorderLevel;
              return (
                <tr key={p.id} className={low ? "bg-rose-500/5" : "hover:bg-brand-800/30"}>
                  <Td><span className="font-mono text-xs text-brand-200/80">{p.sku}</span></Td>
                  <Td className="font-medium text-brand-50">{p.name}</Td>
                  <Td>{p.category}</Td>
                  <Td>
                    <span className="block text-xs text-brand-100/80">
                      {perStore.map((x) => `${x.store.name}: ${num(x.qty)}`).join(" · ") || "—"}
                    </span>
                  </Td>
                  <Td className={low ? "font-semibold text-rose-300" : "font-medium"}>{num(totalQty)} {p.unit}</Td>
                  <Td>{num(p.reorderLevel)}</Td>
                  <Td>{naira(totalQty * p.costPrice, true)}</Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      ) : null}

      {tab === "po" ? (
        <Card>
          <CardHeader title="Purchase Orders" subtitle="Requisition → approval → goods receipt" />
          <Table head={["PO #", "Supplier", "Date", "Value", "Status"]}>
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-brand-800/30">
                <Td><span className="font-mono text-xs text-gold-300">{po.poNumber}</span></Td>
                <Td>{suppliers.find((s) => s.id === po.supplierId)?.name}</Td>
                <Td>{po.orderDate}</Td>
                <Td>{naira(po.total)}</Td>
                <Td><Badge className={PO_STATUS[po.status]}>{po.status.replace("_", " ")}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : null}

      {tab === "suppliers" ? (
        <Card>
          <CardHeader title="Supplier Register" subtitle="Contacts, terms and scorecards feed" />
          <Table head={["Supplier", "Contact", "Phone", "Email", "Terms"]}>
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-brand-800/30">
                <Td className="font-medium text-brand-50">{s.name}</Td>
                <Td>{s.contactPerson}</Td>
                <Td>{s.phone}</Td>
                <Td>{s.email}</Td>
                <Td><Badge className="border-brand-700 bg-brand-900 text-brand-100">{s.paymentTerms}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : null}

      <p className="flex items-center gap-1.5 text-xs text-brand-200/40">
        Recipe costing, variance analysis and theoretical consumption land with M-INV phase P013
        <ArrowRight size={12} />
      </p>
    </div>
  );
}
