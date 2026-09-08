import { useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import {
  Warehouse,
  ArrowRightLeft,
  Search,
} from "lucide-react";

export function MultiStoreInventoryView() {
  const {
    supplyChainStores,
    supplyChainProducts,
    createStoreTransfer,
  } = usePlatform();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Transfer Form State
  const [transferFromStore, setTransferFromStore] = useState("store-central");
  const [transferToStore, setTransferToStore] = useState("store-kitchen");
  const [transferProductId, setTransferProductId] = useState(supplyChainProducts[0]?.id || "");
  const [transferQty, setTransferQty] = useState(5);

  const categories = Array.from(new Set(supplyChainProducts.map((p) => p.category)));

  const filteredProducts = supplyChainProducts.filter((p) => {
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchSearch =
      searchTerm === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalStockValuation = supplyChainProducts.reduce(
    (acc, p) => acc + p.totalStock * p.unitCost,
    0
  );
  const belowParCount = supplyChainProducts.filter((p) => p.totalStock <= p.reorderPoint).length;

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFromStore === transferToStore) {
      alert("Source and Destination stores cannot be identical.");
      return;
    }
    const product = supplyChainProducts.find((p) => p.id === transferProductId);
    if (!product) return;

    createStoreTransfer({
      transferNumber: `TRF-2026-${Math.floor(100 + Math.random() * 900)}`,
      fromStoreId: transferFromStore,
      toStoreId: transferToStore,
      date: new Date().toISOString().slice(0, 10),
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: transferQty,
          unit: product.unit,
        },
      ],
      status: "completed",
      transferredBy: "Inventory Controller",
    });

    setShowTransferModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Store KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Inventory Value"
          value={naira(totalStockValuation, true)}
          sub="Perpetual valuation"
          accent="gold"
        />
        <StatCard
          label="Active Store Locations"
          value={String(supplyChainStores.length)}
          sub="Dry, Cold, Cellar, Linen"
          accent="emerald"
        />
        <StatCard
          label="Items Below Par Level"
          value={String(belowParCount)}
          sub="Automated reorder triggers"
          accent={belowParCount > 0 ? "rose" : "sky"}
        />
        <StatCard
          label="Perpetual Turnover"
          value="12.4 Days"
          sub="Hospitality lean model"
          accent="sky"
        />
      </div>

      {/* Filter and Store Transfer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-brand-400" />
            <input
              type="text"
              placeholder="Search SKU or Item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-brand-800 bg-brand-950/70 pl-8 pr-3 py-1.5 text-xs text-brand-50 focus:border-gold-400 focus:outline-none w-48"
            />
          </div>

          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedCategory === "all"
                ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                : "text-brand-200/70 hover:bg-brand-800/40"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                  : "text-brand-200/70 hover:bg-brand-800/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition"
        >
          <ArrowRightLeft size={14} />
          Internal Store Transfer
        </button>
      </div>

      {/* Store Locations Horizontal Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {supplyChainStores.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-brand-800/70 bg-brand-900/40 p-3.5 space-y-1"
          >
            <div className="flex items-center gap-2">
              <Warehouse size={15} className="text-gold-400" />
              <h4 className="text-xs font-bold text-brand-50 truncate">{s.name}</h4>
            </div>
            <p className="text-[11px] text-brand-300/60 font-mono">{s.code} · {s.type}</p>
            <p className="text-[11px] text-brand-200/80">Custodian: {s.custodian}</p>
          </div>
        ))}
      </div>

      {/* Products Perpetual Stock Table */}
      <Card>
        <CardHeader
          title="Perpetual Stock Register &amp; Par Levels"
          subtitle="Hospitality inventory tracking across Central, Kitchen, Cellar, and Housekeeping Stores"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
              <tr>
                <th className="px-5 py-3 font-medium">SKU &amp; Product Description</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
                <th className="px-4 py-3 text-right font-medium">Par Level</th>
                <th className="px-4 py-3 text-right font-medium">Reorder Pt</th>
                <th className="px-4 py-3 text-right font-medium">Total Stock</th>
                <th className="px-4 py-3 text-right font-medium">Valuation</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800/30">
              {filteredProducts.map((p) => {
                const isLow = p.totalStock <= p.reorderPoint;
                const isOptimal = p.totalStock >= p.parLevel;

                return (
                  <tr key={p.id} className={isLow ? "bg-rose-950/15 hover:bg-rose-950/25" : "hover:bg-brand-800/20"}>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-mono text-xs font-semibold text-gold-300">
                          {p.sku}
                        </span>
                        <p className="font-medium text-brand-100 text-sm mt-0.5">{p.name}</p>
                        <span className="text-[10px] text-brand-300/60">Primary: {p.primarySupplier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-brand-200">{p.category}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-brand-200">
                      {naira(p.unitCost)} / {p.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-brand-200">
                      {p.parLevel} {p.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-amber-300 font-medium">
                      {p.reorderPoint} {p.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                      <span className={isLow ? "text-rose-400" : "text-brand-50"}>
                        {p.totalStock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-gold-300 font-semibold">
                      {naira(p.totalStock * p.unitCost)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isLow ? (
                        <Badge className="border-rose-400/40 bg-rose-500/10 text-rose-300 text-[10px]">
                          Reorder Required
                        </Badge>
                      ) : isOptimal ? (
                        <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]">
                          Optimal Stock
                        </Badge>
                      ) : (
                        <Badge className="border-sky-400/40 bg-sky-500/10 text-sky-300 text-[10px]">
                          Adequate
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Internal Store Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleExecuteTransfer}
            className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Inter-Store Stock Transfer
            </h3>
            <p className="text-xs text-brand-200/70">
              Move inventory between Main Warehouse, Kitchen Stores, and Outlets
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Source Store</label>
                <select
                  value={transferFromStore}
                  onChange={(e) => setTransferFromStore(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                >
                  {supplyChainStores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Destination Store</label>
                <select
                  value={transferToStore}
                  onChange={(e) => setTransferToStore(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                >
                  {supplyChainStores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Product to Move</label>
              <select
                value={transferProductId}
                onChange={(e) => setTransferProductId(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              >
                {supplyChainProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Available: {p.totalStock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Quantity</label>
              <input
                required
                type="number"
                min="1"
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 shadow"
              >
                Execute Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
