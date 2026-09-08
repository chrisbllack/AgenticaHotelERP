import { useState, useMemo } from "react";
import { Card, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import type {
  KitchenPrepStation,
  PrepItemStatus,
} from "../../types";
import {
  ChefHat,
  Flame,
  UtensilsCrossed,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Calendar,
  Layers,
  Printer,
  X,
} from "lucide-react";

const STATION_LABELS: Record<KitchenPrepStation, string> = {
  hot_line: "Hot Kitchen Line & Sauté",
  cold_pantry: "Garde Manger & Salads",
  butchery: "Butchery & Protein Prep",
  bakery_pastry: "Bakery & Desserts",
  banquet_prep: "Banquet Event Prep",
};

const CHEF_OPTIONS = [
  "Chef Kingsley (Sous Chef)",
  "Chef Amaka (Pastry Chef)",
  "Chef Tunde (Butcher)",
  "Chef Ngozi (Commis I)",
  "Chef Emeka (Sauté Chef)",
  "Chef Ibrahim (Grill Chef)",
];

export function KitchenPrepView() {
  const {
    rooms,
    reservations,
    kitchenPrepItems,
    updatePrepItemStatus,
    assignChefToPrep,
    scalePrepPortions,
    bulkUpdatePrepStatus,
    businessDate,
  } = usePlatform();

  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [selectedShift, setSelectedShift] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Live Occupancy & Demand Metrics Calculation
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const occupancyRate = Math.round((occupiedRooms / (totalRooms || 1)) * 100);
  const inHouseGuests = occupiedRooms * 1.6; // average guests per occupied room ~1.6
  const activeReservationsToday = reservations.filter((r) => r.status === "confirmed" || r.status === "checked_in").length;
  const banquetCoversEstimated = 120; // from BEO active events

  // Filtered prep items
  const filteredItems = useMemo(() => {
    return kitchenPrepItems.filter((item) => {
      const matchStation = selectedStation === "all" || item.station === selectedStation;
      const matchShift = selectedShift === "all" || item.mealPeriod === selectedShift;
      const matchSearch =
        item.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assignedChef.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStation && matchShift && matchSearch;
    });
  }, [kitchenPrepItems, selectedStation, selectedShift, searchQuery]);

  // Aggregate KPI metrics
  const totalPrepItems = kitchenPrepItems.length;
  const completedCount = kitchenPrepItems.filter((i) => i.status === "completed" || i.status === "qc_verified").length;
  const inPrepCount = kitchenPrepItems.filter((i) => i.status === "in_prep").length;
  const pendingCount = kitchenPrepItems.filter((i) => i.status === "pending").length;
  const completionPercentage = totalPrepItems > 0 ? Math.round((completedCount / totalPrepItems) * 100) : 0;

  // Shortage check across all scaled ingredients
  const shortageCount = useMemo(() => {
    let count = 0;
    kitchenPrepItems.forEach((item) => {
      item.ingredients.forEach((ing) => {
        if (ing.stockStatus === "stockout" || ing.stockStatus === "low_stock") {
          count++;
        }
      });
    });
    return count;
  }, [kitchenPrepItems]);

  const handleStatusChange = (id: string, newStatus: PrepItemStatus, dishName: string) => {
    updatePrepItemStatus(id, newStatus);
    setSuccessToast(`Updated ${dishName} status to ${newStatus.replace("_", " ").toUpperCase()}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleQuickScale = (id: string, currentPortions: number, delta: number) => {
    const nextPortions = Math.max(5, currentPortions + delta);
    scalePrepPortions(id, nextPortions);
  };

  const handleBulkStationStatus = (status: PrepItemStatus) => {
    const station = selectedStation === "all" ? undefined : (selectedStation as KitchenPrepStation);
    bulkUpdatePrepStatus(status, station);
    setSuccessToast(
      `Marked all ${selectedStation === "all" ? "kitchen" : STATION_LABELS[station as KitchenPrepStation]} items as ${status.replace("_", " ").toUpperCase()}`
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs text-emerald-200 shadow-md">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Demand Header Banner with Live Occupancy Drivers */}
      <div className="rounded-xl border border-brand-800/80 bg-gradient-to-r from-brand-950/80 via-brand-900/60 to-brand-950/80 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                Live Occupancy-Driven Recipe Scaling
              </span>
            </div>
            <h2 className="text-xl font-bold text-brand-50 mt-1">
              Kitchen Prep &amp; Automated Recipe Scaling Engine
            </h2>
            <p className="text-sm text-brand-200/70 mt-1 max-w-3xl">
              Automatic daily batch scaling calculated from current room occupancy, forecasted restaurant covers, and banquet event guarantees for date:{" "}
              <strong className="text-brand-100 font-mono">{businessDate}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPrintModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-800/60 px-3 py-2 text-xs font-medium text-brand-200 hover:bg-brand-700 hover:text-brand-50 transition"
            >
              <Printer size={14} className="text-gold-300" />
              Print Station Prep Sheets
            </button>
          </div>
        </div>

        {/* Live Drivers Ribbon */}
        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-brand-800/60 sm:grid-cols-4 lg:grid-cols-5 text-xs font-mono">
          <div className="rounded-lg bg-brand-950/60 p-2.5 border border-brand-800/60">
            <span className="text-[11px] text-brand-400 block font-sans">Hotel Occupancy</span>
            <span className="text-base font-bold text-emerald-400">{occupancyRate}%</span>
            <span className="text-[10px] text-brand-400 block">({occupiedRooms}/{totalRooms} Rooms)</span>
          </div>
          <div className="rounded-lg bg-brand-950/60 p-2.5 border border-brand-800/60">
            <span className="text-[11px] text-brand-400 block font-sans">In-House Guests</span>
            <span className="text-base font-bold text-gold-300">~{Math.round(inHouseGuests)} Pax</span>
            <span className="text-[10px] text-brand-400 block">Breakfast multiplier: 1.4x</span>
          </div>
          <div className="rounded-lg bg-brand-950/60 p-2.5 border border-brand-800/60">
            <span className="text-[11px] text-brand-400 block font-sans">Active Bookings</span>
            <span className="text-base font-bold text-sky-400">{activeReservationsToday} Stays</span>
            <span className="text-[10px] text-brand-400 block">Rooms &amp; suites active</span>
          </div>
          <div className="rounded-lg bg-brand-950/60 p-2.5 border border-brand-800/60">
            <span className="text-[11px] text-brand-400 block font-sans">Banquet Covers (BEO)</span>
            <span className="text-base font-bold text-purple-300">{banquetCoversEstimated} Covers</span>
            <span className="text-[10px] text-brand-400 block">Grand Ballroom Evening</span>
          </div>
          <div className="rounded-lg bg-brand-950/60 p-2.5 border border-brand-800/60 col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-[11px] text-brand-400 block font-sans">Shortage Warnings</span>
            <span
              className={`text-base font-bold ${
                shortageCount > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {shortageCount > 0 ? `${shortageCount} Low Items` : "All Stock Par OK"}
            </span>
            <span className="text-[10px] text-brand-400 block">Central store par status</span>
          </div>
        </div>
      </div>

      {/* KPI Progress Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Prep Items"
          value={String(totalPrepItems)}
          sub="Across all kitchen stations"
          accent="stone"
        />
        <StatCard
          label="In Active Prep"
          value={String(inPrepCount)}
          sub="Line chefs currently prepping"
          accent="gold"
        />
        <StatCard
          label="Ready &amp; QC Verified"
          value={String(completedCount)}
          sub={`${completionPercentage}% of shift prep finished`}
          accent="emerald"
        />
        <StatCard
          label="Pending Station Kickoff"
          value={String(pendingCount)}
          sub="Awaiting mise-en-place start"
          accent={pendingCount > 0 ? "amber" : "emerald"}
        />
      </div>

      {/* Station Tabs & Shift Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-800/80 pb-3">
          {/* Stations */}
          <div className="flex flex-wrap gap-1.5">
            {[
              ["all", "All Stations", Layers],
              ["hot_line", "Hot Line & Sauté", Flame],
              ["cold_pantry", "Garde Manger", UtensilsCrossed],
              ["butchery", "Butchery Prep", Scale],
              ["bakery_pastry", "Bakery & Pastry", ChefHat],
              ["banquet_prep", "Banquet Prep", Calendar],
            ].map(([id, label, Icon]: any) => (
              <button
                key={id}
                onClick={() => setSelectedStation(id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition border ${
                  selectedStation === id
                    ? "border-gold-400/50 bg-brand-500/20 text-gold-200 shadow-sm"
                    : "border-brand-800/60 bg-brand-900/40 text-brand-200/70 hover:text-brand-50 hover:border-brand-700"
                }`}
              >
                <Icon size={13} className={selectedStation === id ? "text-gold-300" : "text-brand-400"} />
                {label}
              </button>
            ))}
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStationStatus("in_prep")}
              className="rounded bg-brand-800 px-2.5 py-1.5 text-xs font-medium text-gold-300 hover:bg-brand-700 hover:text-gold-200 transition border border-brand-700/60"
            >
              Start Station Prep
            </button>
            <button
              onClick={() => handleBulkStationStatus("qc_verified")}
              className="rounded bg-emerald-500/20 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition border border-emerald-500/40"
            >
              Mark All QC Ready
            </button>
          </div>
        </div>

        {/* Sub-bar: Shift filter and Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-brand-400">Meal Shift:</span>
            {["all", "breakfast", "lunch", "dinner", "banquet"].map((shift) => (
              <button
                key={shift}
                onClick={() => setSelectedShift(shift)}
                className={`rounded px-2.5 py-1 capitalize transition ${
                  selectedShift === shift
                    ? "bg-brand-800 text-brand-50 font-semibold"
                    : "text-brand-300 hover:text-brand-100"
                }`}
              >
                {shift}
              </button>
            ))}
          </div>

          <div className="w-64">
            <input
              type="text"
              placeholder="Filter by dish, ingredient, chef..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-1.5 text-xs text-brand-100 placeholder-brand-500 focus:border-gold-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Prep Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredItems.map((item) => {
          const hasShortage = item.ingredients.some(
            (ing) => ing.stockStatus === "stockout" || ing.stockStatus === "low_stock"
          );

          return (
            <Card key={item.id} className="border-brand-800/80 bg-brand-900/30">
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-brand-800/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-50 text-base">{item.dishName}</span>
                      <Badge variant="outline">{item.category}</Badge>
                      <span className="rounded bg-brand-950 px-2 py-0.5 text-[10px] font-mono text-brand-300 border border-brand-800">
                        {item.mealPeriod.toUpperCase()}
                      </span>
                      {hasShortage && (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <AlertTriangle size={10} /> Par Alert
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-400 mt-0.5 flex items-center gap-1.5">
                      <UtensilsCrossed size={12} /> Station:{" "}
                      <strong className="text-brand-200">{STATION_LABELS[item.station]}</strong>
                      <span>•</span>
                      <Clock size={12} /> Lead time: {item.leadTimeMinutes} mins
                    </p>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      item.status === "qc_verified"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : item.status === "completed"
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                        : item.status === "in_prep"
                        ? "bg-gold-500/20 text-gold-300 border-gold-500/40"
                        : "bg-stone-500/20 text-stone-300 border-stone-500/40"
                    }`}
                  >
                    {item.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                {/* Portion Scaling Control Section */}
                <div className="rounded-lg border border-brand-800/60 bg-brand-950/50 p-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-brand-400 block font-sans">
                      Standard Batch Yield: <strong className="text-brand-200">{item.baseYieldPortions} portions</strong>
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-brand-100">Forecasted Target:</span>
                      <span className="font-mono text-base font-bold text-gold-300">
                        {item.forecastedPortions} portions
                      </span>
                      <span className="text-xs font-mono text-brand-400">
                        ({item.scalingFactor}x scale)
                      </span>
                    </div>
                  </div>

                  {/* Quick Scale Adjuster Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickScale(item.id, item.forecastedPortions, -5)}
                      className="rounded bg-brand-800 p-1.5 text-brand-300 hover:bg-brand-700 hover:text-brand-50"
                      title="Decrease by 5 portions"
                    >
                      <Minus size={13} />
                    </button>
                    <button
                      onClick={() => handleQuickScale(item.id, item.forecastedPortions, 5)}
                      className="rounded bg-brand-800 p-1.5 text-brand-300 hover:bg-brand-700 hover:text-brand-50"
                      title="Increase by 5 portions"
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => handleQuickScale(item.id, item.forecastedPortions, 20)}
                      className="rounded bg-brand-800 px-2 py-1 text-xs font-mono text-gold-300 hover:bg-brand-700 hover:text-gold-200 border border-brand-700"
                      title="Surge +20 portions for banquet surge"
                    >
                      +20 Surge
                    </button>
                  </div>
                </div>

                {/* Scaled Ingredients Table */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-brand-400 font-semibold px-1">
                    <span>Ingredient Requirements (Scaled)</span>
                    <span>Store Par Status</span>
                  </div>

                  <div className="divide-y divide-brand-800/40 rounded-lg border border-brand-800/60 bg-brand-950/30 overflow-hidden">
                    {item.ingredients.map((ing) => (
                      <div
                        key={ing.ingredientId}
                        className="flex items-center justify-between p-2 text-xs font-mono hover:bg-brand-900/30 transition"
                      >
                        <div>
                          <span className="text-brand-100 font-sans font-medium">{ing.name}</span>
                          <span className="text-[10px] text-brand-400 block font-sans">
                            {ing.inventoryStore} · Par Stock: {ing.currentStockQty} {ing.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gold-300">
                            {ing.scaledQty} {ing.unit}
                          </span>
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold border ${
                              ing.stockStatus === "sufficient"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : ing.stockStatus === "low_stock"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {ing.stockStatus === "sufficient"
                              ? "In Stock"
                              : ing.stockStatus === "low_stock"
                              ? "Low Par"
                              : "Stockout"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Assigned Chef & Station Actions */}
                <div className="pt-2 border-t border-brand-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-400">Assigned:</span>
                    <select
                      value={item.assignedChef}
                      onChange={(e) => assignChefToPrep(item.id, e.target.value)}
                      className="rounded border border-brand-800 bg-brand-950 px-2 py-1 text-xs text-brand-200 focus:border-gold-400 focus:outline-none"
                    >
                      {CHEF_OPTIONS.map((chef) => (
                        <option key={chef} value={chef}>
                          {chef}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Progression buttons */}
                  <div className="flex items-center gap-1.5">
                    {item.status === "pending" && (
                      <button
                        onClick={() => handleStatusChange(item.id, "in_prep", item.dishName)}
                        className="rounded bg-gold-500/20 border border-gold-400/50 px-3 py-1 text-xs font-semibold text-gold-200 hover:bg-gold-500/30 transition"
                      >
                        Start Prepping
                      </button>
                    )}
                    {item.status === "in_prep" && (
                      <button
                        onClick={() => handleStatusChange(item.id, "completed", item.dishName)}
                        className="rounded bg-sky-500/20 border border-sky-400/50 px-3 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/30 transition"
                      >
                        Mark Prepped
                      </button>
                    )}
                    {item.status === "completed" && (
                      <button
                        onClick={() => handleStatusChange(item.id, "qc_verified", item.dishName)}
                        className="rounded bg-emerald-500/20 border border-emerald-400/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Sous Chef QC Pass
                      </button>
                    )}
                    {item.status === "qc_verified" && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Ready for Service
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Print Prep Sheets Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  Kitchen Production &amp; Mise-en-Place Sheet
                </span>
                <h3 className="text-lg font-bold text-brand-50 mt-0.5">
                  Daily Station Prep Dispatch — {businessDate}
                </h3>
              </div>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-900 hover:text-brand-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg border border-brand-800 bg-brand-900/40 p-3 font-mono text-brand-200 flex justify-between">
                <span>Shift: ALL DAY / BREAKFAST / LUNCH / DINNER</span>
                <span>Hotel Occupancy: {occupancyRate}% ({occupiedRooms} rooms)</span>
              </div>

              {filteredItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-brand-800 p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-50 text-sm">
                      {item.dishName} ({item.forecastedPortions} Portions)
                    </span>
                    <span className="font-mono text-gold-300">Station: {STATION_LABELS[item.station]}</span>
                  </div>
                  <div className="text-brand-300">Assigned Chef: {item.assignedChef}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1 border-t border-brand-800/60">
                    {item.ingredients.map((ing) => (
                      <div key={ing.ingredientId} className="bg-brand-950/60 p-1.5 rounded">
                        <span className="text-brand-200 block">{ing.name}</span>
                        <span className="font-bold text-gold-300">{ing.scaledQty} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-brand-800 pt-3">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="rounded-lg bg-brand-900 px-4 py-2 text-xs text-brand-300 hover:bg-brand-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Station prep sheet sent to kitchen thermal slip printer.");
                  setPrintModalOpen(false);
                }}
                className="rounded-lg bg-gold-500/20 border border-gold-400/50 px-4 py-2 text-xs font-semibold text-gold-200 hover:bg-gold-500/30"
              >
                Confirm Print to Kitchen Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
