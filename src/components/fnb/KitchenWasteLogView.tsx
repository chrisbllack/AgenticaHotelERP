import { useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { KitchenWasteLog } from "../../types";
import { Plus } from "lucide-react";

export function KitchenWasteLogView() {
  const { kitchenWasteLogs, logKitchenWaste } = usePlatform();
  const [showLogModal, setShowLogModal] = useState(false);
  const [itemInput, setItemInput] = useState("");
  const [qtyInput, setQtyInput] = useState(1);
  const [unitInput, setUnitInput] = useState("kg");
  const [costInput, setCostInput] = useState(15000);
  const [reasonInput, setReasonInput] = useState<KitchenWasteLog["reason"]>("trim_loss");
  const [stationInput, setStationInput] = useState("Butchery Station");

  const totalWasteLoss = kitchenWasteLogs.reduce((acc, w) => acc + w.costLoss, 0);
  const trimLoss = kitchenWasteLogs
    .filter((w) => w.reason === "trim_loss")
    .reduce((acc, w) => acc + w.costLoss, 0);
  const spoilageLoss = kitchenWasteLogs
    .filter((w) => w.reason === "spoilage")
    .reduce((acc, w) => acc + w.costLoss, 0);
  const burntLoss = kitchenWasteLogs
    .filter((w) => w.reason === "burnt" || w.reason === "expired")
    .reduce((acc, w) => acc + w.costLoss, 0);

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemInput) return;
    logKitchenWaste({
      date: new Date().toISOString().slice(0, 10),
      station: stationInput,
      itemName: itemInput,
      quantity: qtyInput,
      unit: unitInput,
      reason: reasonInput,
      costLoss: costInput,
      loggedBy: "Chef de Partie / Sous Chef",
    });
    setShowLogModal(false);
    setItemInput("");
    setCostInput(15000);
  };

  const getReasonBadge = (reason: KitchenWasteLog["reason"]) => {
    switch (reason) {
      case "spoilage":
        return <Badge className="border-rose-400/40 bg-rose-500/10 text-rose-300">Spoilage</Badge>;
      case "trim_loss":
        return <Badge className="border-amber-400/40 bg-amber-500/10 text-amber-300">Butchery Trim</Badge>;
      case "burnt":
        return <Badge className="border-rose-400/40 bg-rose-500/10 text-rose-300">Kitchen Burnt</Badge>;
      case "expired":
        return <Badge className="border-purple-400/40 bg-purple-500/10 text-purple-300">Expired Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Waste Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Food Waste Loss"
          value={naira(totalWasteLoss, true)}
          sub="Tracked variance this month"
          accent="rose"
        />
        <StatCard
          label="Prep & Trim Loss"
          value={naira(trimLoss, true)}
          sub="Butchery yield waste"
          accent="amber"
        />
        <StatCard
          label="Cold Storage Spoilage"
          value={naira(spoilageLoss, true)}
          sub="Chiller threshold failure"
          accent="gold"
        />
        <StatCard
          label="Burnt & Overcooked"
          value={naira(burntLoss, true)}
          sub="Line error scrap"
          accent="purple"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <span className="text-xs text-brand-300">
          Daily waste tracking directly drives Recipe Cost calibration and prevents procurement inflation.
        </span>
        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition"
        >
          <Plus size={14} />
          Log Kitchen Waste Item
        </button>
      </div>

      {/* Waste Register Table */}
      <Card>
        <CardHeader
          title="Culinary Waste & Loss Register"
          subtitle="Real-time kitchen spoilage logs linked to Inventory and Food Cost variances"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
              <tr>
                <th className="px-5 py-3 font-medium">Logged Date & Station</th>
                <th className="px-4 py-3 font-medium">Discarded Item</th>
                <th className="px-4 py-3 text-right font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Classification</th>
                <th className="px-4 py-3 text-right font-medium">Financial Cost Loss</th>
                <th className="px-5 py-3 text-right font-medium">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800/30">
              {kitchenWasteLogs.map((log) => (
                <tr key={log.id} className="hover:bg-brand-800/20">
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="font-medium text-brand-100">{log.station}</span>
                      <p className="font-mono text-[10px] text-brand-300/60">{log.date}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-brand-50">{log.itemName}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-brand-200">
                    {log.quantity} {log.unit}
                  </td>
                  <td className="px-4 py-3.5">{getReasonBadge(log.reason)}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-300">
                    -{naira(log.costLoss)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-brand-300/70">{log.loggedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateLog}
            className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Record Kitchen Waste / Scrap
            </h3>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Item Description</label>
              <input
                required
                type="text"
                placeholder="e.g. Red Snapper Fillets"
                value={itemInput}
                onChange={(e) => setItemInput(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Station</label>
                <select
                  value={stationInput}
                  onChange={(e) => setStationInput(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                >
                  <option value="Butchery Station">Butchery Station</option>
                  <option value="Hot Line / Grill">Hot Line / Grill</option>
                  <option value="Cold Larder">Cold Larder</option>
                  <option value="Pastry & Bakery">Pastry &amp; Bakery</option>
                  <option value="Main Bar">Main Bar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Loss Reason</label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value as any)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                >
                  <option value="trim_loss">Prep / Trim Loss</option>
                  <option value="spoilage">Spoilage / Storage</option>
                  <option value="burnt">Burnt / Order Error</option>
                  <option value="expired">Expired Stock</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Unit</label>
                <input
                  type="text"
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Cost Loss (₦)</label>
                <input
                  type="number"
                  value={costInput}
                  onChange={(e) => setCostInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow"
              >
                Log Loss to Register
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
