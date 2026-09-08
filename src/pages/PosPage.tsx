import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform, VAT_RATE } from "../store/platform";
import { outlets, menuCategories } from "../data/demo";
import { cn, naira } from "../lib/utils";
import {
  Plus,
  Receipt,
  Trash2,
  ShoppingBasket,
  UtensilsCrossed,
  Flame,
  ChefHat,
  CalendarDays,
  AlertOctagon,
  CreditCard,
  Scale,
} from "lucide-react";
import { TableFloorPlanView } from "../components/fnb/TableFloorPlanView";
import { KitchenDisplayView } from "../components/fnb/KitchenDisplayView";
import { RecipeCostingView } from "../components/fnb/RecipeCostingView";
import { BanquetEventOrdersView } from "../components/fnb/BanquetEventOrdersView";
import { KitchenWasteLogView } from "../components/fnb/KitchenWasteLogView";
import { KitchenPrepView } from "../components/fnb/KitchenPrepView";

interface CartLine {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function PosPage() {
  const { menuItems, orders, orderLines, createOrder, closeOrder } = usePlatform();
  const [activeTab, setActiveTab] = useState<
    "terminal" | "tables" | "prep" | "kds" | "recipes" | "banquets" | "waste"
  >("terminal");
  const [outletId, setOutletId] = useState(outlets[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const shownItems = useMemo(
    () => menuItems.filter((m) => categoryFilter === "all" || m.categoryId === categoryFilter),
    [menuItems, categoryFilter],
  );

  const subtotal = cart.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
  const tax = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = subtotal + tax;

  const addToCart = (item: (typeof menuItems)[number]) => {
    setCart((prev) => {
      const found = prev.find((l) => l.menuItemId === item.id);
      if (found) return prev.map((l) => (l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: item.price }];
    });
  };

  const removeFromCart = (menuItemId: string) => setCart((prev) => prev.filter((l) => l.menuItemId !== menuItemId));

  const submitOrder = () => {
    if (cart.length === 0) return;
    const created = createOrder(
      outletId,
      cart.map((l) => ({ orderId: "", menuItemId: l.menuItemId, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.quantity * l.unitPrice, status: "completed" as const })),
    );
    setFlash(`Order ${created.orderNumber} fired — KOT routed to kitchen/bar printers.`);
    setCart([]);
  };

  const outletOrders = orders.filter((o) => o.outletId === outletId);
  const revenueToday = orders.filter((o) => o.paymentStatus === "paid").reduce((a, o) => a + o.total, 0);

  const tabs: Array<[typeof activeTab, string, any]> = [
    ["terminal", "POS Register", CreditCard],
    ["prep", "Kitchen Prep & Scaling", Scale],
    ["tables", "Floor & Tables", UtensilsCrossed],
    ["kds", "Kitchen Display (KDS)", Flame],
    ["recipes", "Recipe Costing & Margins", ChefHat],
    ["banquets", "Banquet & Events (BEO)", CalendarDays],
    ["waste", "Waste & Shrinkage", AlertOctagon],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food & Beverage Operations"
        subtitle="Multi-outlet Point of Sale · Kitchen Prep & Occupancy-Driven Recipe Scaling · KOT Station Routing · Floor Layout · Recipe Costing · Banquet Orders (BEO)"
      />

      {/* Sub-module Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-brand-800/80 pb-3">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              activeTab === key
                ? "border-gold-400/50 bg-brand-500/20 font-semibold text-gold-200 shadow-sm"
                : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600 hover:text-brand-50"
            }`}
          >
            <Icon size={15} className={activeTab === key ? "text-gold-300" : "text-brand-300"} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "prep" && <KitchenPrepView />}
      {activeTab === "tables" && <TableFloorPlanView />}
      {activeTab === "kds" && <KitchenDisplayView />}
      {activeTab === "recipes" && <RecipeCostingView />}
      {activeTab === "banquets" && <BanquetEventOrdersView />}
      {activeTab === "waste" && <KitchenWasteLogView />}

      {activeTab === "terminal" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Orders Today" value={String(orders.length)} sub="all outlets" />
            <StatCard label="Revenue (paid)" value={naira(revenueToday, true)} sub="incl. VAT" accent="emerald" />
            <StatCard label="Pending payment" value={String(orders.filter((o) => o.paymentStatus === "pending").length)} sub="room charge / pay later" accent="rose" />
            <StatCard label="Avg. check" value={naira(orders.length ? revenueToday / orders.filter((o) => o.paymentStatus === "paid").length : 0, true)} sub="per paid order" accent="gold" />
          </div>

          <div className="flex flex-wrap gap-2">
            {outlets.map((o) => (
              <button
                key={o.id}
                onClick={() => setOutletId(o.id)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm",
                  outletId === o.id ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50" : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600",
                )}
              >
                {o.name}
                <span className="ml-2 text-[10px] uppercase tracking-wider text-brand-200/50">{o.type.replace("_", " ")}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader
                title="Menu"
                subtitle="Tap an item to add it to the current order"
                action={
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-lg border border-brand-800 bg-brand-950/70 px-2.5 py-1.5 text-xs text-brand-50 outline-none focus:border-brand-500"
                  >
                    <option value="all">All categories</option>
                    {menuCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                }
              />
              <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3">
                {shownItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="group rounded-lg border border-brand-800/70 bg-brand-950/50 p-3 text-left transition-colors hover:border-gold-500/50 hover:bg-brand-900/70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight text-brand-50">{item.name}</p>
                      <Plus size={14} className="mt-0.5 shrink-0 text-brand-300 group-hover:text-gold-400" />
                    </div>
                    <p className="mt-1.5 font-display text-sm text-gold-400">{naira(item.price)}</p>
                    <p className="text-[10px] text-brand-200/40">{item.preparationTime} min · {item.code}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="h-fit lg:sticky lg:top-20">
              <CardHeader title="Current Order" subtitle={outlets.find((o) => o.id === outletId)?.name} />
              <div className="min-h-[120px] space-y-2 px-4 py-3">
                {cart.length === 0 ? (
                  <p className="flex items-center justify-center gap-2 py-8 text-xs text-brand-200/40">
                    <ShoppingBasket size={15} /> Cart is empty — tap menu items
                  </p>
                ) : (
                  cart.map((l) => (
                    <div key={l.menuItemId} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-brand-50">{l.name}</p>
                        <p className="text-[11px] text-brand-200/50">{naira(l.unitPrice)} × {l.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-brand-50">{naira(l.quantity * l.unitPrice)}</span>
                        <button onClick={() => removeFromCart(l.menuItemId)} className="text-brand-200/40 hover:text-rose-300" aria-label="Remove">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-1 border-t border-brand-800/70 px-4 py-3 text-sm">
                <div className="flex justify-between text-brand-200/70"><span>Subtotal</span><span>{naira(subtotal)}</span></div>
                <div className="flex justify-between text-brand-200/70"><span>VAT 7.5%</span><span>{naira(tax)}</span></div>
                <div className="flex justify-between font-display text-lg text-gold-400"><span>Total</span><span>{naira(total)}</span></div>
              </div>
              <div className="border-t border-brand-800/70 p-4">
                <button
                  onClick={submitOrder}
                  disabled={cart.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-brand-400/40 transition-opacity hover:from-brand-400 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Receipt size={15} /> Fire order & print KOT
                </button>
              </div>
            </Card>
          </div>

          {flash ? (
            <div className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-4 py-2.5 text-sm text-gold-200">{flash}</div>
          ) : null}

          <Card>
            <CardHeader title={`Orders — ${outlets.find((o) => o.id === outletId)?.name}`} subtitle="Session history with items" />
            <Table head={["Order", "Items", "Subtotal", "VAT", "Total", "Payment", ""]}>
              {outletOrders.map((o) => {
                const lines = orderLines.filter((l) => l.orderId === o.id);
                return (
                  <tr key={o.id} className="hover:bg-brand-800/30">
                    <Td><span className="font-mono text-xs text-gold-300">{o.orderNumber}</span></Td>
                    <Td>
                      {lines.map((l, i) => {
                        const mi = menuItems.find((m) => m.id === l.menuItemId);
                        return (
                          <span key={i} className="block text-xs text-brand-100/80">
                            {l.quantity}× {mi?.name ?? "Item"}
                          </span>
                        );
                      })}
                    </Td>
                    <Td>{naira(o.subtotal)}</Td>
                    <Td>{naira(o.taxAmount)}</Td>
                    <Td className="font-medium">{naira(o.total)}</Td>
                    <Td>
                      <Badge className={o.paymentStatus === "paid" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-amber-400/40 bg-amber-500/10 text-amber-200"}>
                        {o.paymentStatus}
                      </Badge>
                    </Td>
                    <Td>
                      {o.paymentStatus === "pending" ? (
                        <button onClick={() => closeOrder(o.id)} className="rounded-lg border border-brand-600 px-3 py-1.5 text-xs text-brand-50 hover:bg-brand-800/60">
                          Take payment
                        </button>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}

