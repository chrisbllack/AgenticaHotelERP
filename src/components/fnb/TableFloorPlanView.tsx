import { useState } from "react";
import { Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { RestaurantTable } from "../../types";
import {
  Users,
} from "lucide-react";

export function TableFloorPlanView() {
  const { restaurantTables, updateTableStatus } = usePlatform();
  const [selectedOutlet, setSelectedOutlet] = useState<string>("Saffron All-Day Dining");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  const outletTables = restaurantTables.filter((t) => t.outletName === selectedOutlet);
  const sections = Array.from(new Set(outletTables.map((t) => t.section)));

  const filteredTables =
    selectedSection === "all"
      ? outletTables
      : outletTables.filter((t) => t.section === selectedSection);

  const vacantCount = outletTables.filter((t) => t.status === "vacant").length;
  const occupiedCount = outletTables.filter((t) => t.status === "occupied").length;
  const reservedCount = outletTables.filter((t) => t.status === "reserved").length;
  const dirtyCount = outletTables.filter((t) => t.status === "dirty").length;
  const totalFloorRevenue = outletTables.reduce((acc, t) => acc + (t.currentOrderTotal || 0), 0);

  const getStatusBadge = (status: RestaurantTable["status"]) => {
    switch (status) {
      case "vacant":
        return <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300">Vacant</Badge>;
      case "occupied":
        return <Badge className="border-rose-400/40 bg-rose-500/10 text-rose-300">Occupied</Badge>;
      case "reserved":
        return <Badge className="border-sky-400/40 bg-sky-500/10 text-sky-300">Reserved</Badge>;
      case "billing":
        return <Badge className="border-amber-400/40 bg-amber-500/10 text-amber-300">Bill Printed</Badge>;
      case "dirty":
        return <Badge className="border-purple-400/40 bg-purple-500/10 text-purple-300">Needs Bus/Sanitize</Badge>;
    }
  };

  const getTableBorderColor = (status: RestaurantTable["status"]) => {
    switch (status) {
      case "vacant":
        return "border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/10";
      case "occupied":
        return "border-rose-500/50 hover:border-rose-400 bg-rose-950/20";
      case "reserved":
        return "border-sky-500/50 hover:border-sky-400 bg-sky-950/15";
      case "billing":
        return "border-amber-500/50 hover:border-amber-400 bg-amber-950/20";
      case "dirty":
        return "border-purple-500/50 hover:border-purple-400 bg-purple-950/15";
    }
  };

  return (
    <div className="space-y-6">
      {/* Floor Overview Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Floor Turnover"
          value={`${occupiedCount} / ${outletTables.length}`}
          sub={`${Math.round((occupiedCount / (outletTables.length || 1)) * 100)}% Occupancy`}
          accent="gold"
        />
        <StatCard label="Vacant & Ready" value={String(vacantCount)} sub="Immediate seating" accent="emerald" />
        <StatCard label="Reserved Tables" value={String(reservedCount)} sub="Upcoming arrivals" accent="sky" />
        <StatCard label="Dirty / Turnover" value={String(dirtyCount)} sub="Busboy alert" accent="purple" />
        <StatCard
          label="Active Floor Tabs"
          value={naira(totalFloorRevenue, true)}
          sub="Unbilled table balance"
          accent="amber"
        />
      </div>

      {/* Outlet & Section Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["Saffron All-Day Dining", "Sky Lounge & Grill", "Lagoon Bar"] as const).map((name) => (
            <button
              key={name}
              onClick={() => {
                setSelectedOutlet(name);
                setSelectedSection("all");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedOutlet === name
                  ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                  : "text-brand-200/70 hover:bg-brand-800/40"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-300/60">Section:</span>
          <button
            onClick={() => setSelectedSection("all")}
            className={`rounded px-2.5 py-1 text-xs transition ${
              selectedSection === "all"
                ? "bg-brand-700 text-brand-50 font-medium"
                : "text-brand-300 hover:text-brand-100"
            }`}
          >
            All Areas
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`rounded px-2.5 py-1 text-xs transition ${
                selectedSection === sec
                  ? "bg-brand-700 text-brand-50 font-medium"
                  : "text-brand-300 hover:text-brand-100"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredTables.map((tbl) => {
          return (
            <div
              key={tbl.id}
              onClick={() => setSelectedTable(tbl)}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 ${getTableBorderColor(
                tbl.status
              )}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-base font-bold font-mono text-brand-50">{tbl.tableNumber}</span>
                <span className="flex items-center gap-1 text-[11px] text-brand-300">
                  <Users size={12} />
                  {tbl.capacity}p
                </span>
              </div>

              <p className="text-[11px] text-brand-300/70 mt-1">{tbl.section}</p>

              <div className="mt-3">
                {getStatusBadge(tbl.status)}
              </div>

              {tbl.status === "occupied" && (
                <div className="mt-3 border-t border-brand-800/60 pt-2 space-y-1">
                  <div className="flex justify-between text-[11px] text-brand-200">
                    <span>Server:</span>
                    <span className="font-medium text-brand-100">{tbl.serverName}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-brand-200">
                    <span>Tab:</span>
                    <span className="font-mono font-bold text-gold-300">{naira(tbl.currentOrderTotal || 0)}</span>
                  </div>
                </div>
              )}

              {tbl.status === "reserved" && (
                <div className="mt-3 border-t border-brand-800/60 pt-2 text-[11px] text-sky-300">
                  <span>Reserved at 19:30</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Action Detail Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <div>
                <span className="font-mono text-xs text-gold-300">Table Management</span>
                <h3 className="text-xl font-display font-bold text-brand-50">
                  {selectedTable.tableNumber} · {selectedTable.outletName}
                </h3>
              </div>
              {getStatusBadge(selectedTable.status)}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-brand-200/70">
                <span>Section &amp; Seating:</span>
                <span className="text-brand-100 font-medium">
                  {selectedTable.section} · {selectedTable.capacity} Seats
                </span>
              </div>
              <div className="flex justify-between text-brand-200/70">
                <span>Assigned Server:</span>
                <span className="text-brand-100 font-medium">
                  {selectedTable.serverName || "Unassigned"}
                </span>
              </div>
              {selectedTable.currentOrderTotal !== undefined && (
                <div className="flex justify-between text-brand-200/70">
                  <span>Open KOT Tab Total:</span>
                  <span className="font-mono font-bold text-gold-300 text-sm">
                    {naira(selectedTable.currentOrderTotal)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-brand-800 pt-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-300 mb-2">
                Update Table Operational Status:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["vacant", "occupied", "reserved", "billing", "dirty"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      updateTableStatus(selectedTable.id, st);
                      setSelectedTable({ ...selectedTable, status: st });
                    }}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition ${
                      selectedTable.status === st
                        ? "border-gold-400 bg-gold-500/20 text-gold-200 font-bold"
                        : "border-brand-800 bg-brand-950/60 text-brand-300 hover:bg-brand-800"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedTable(null)}
                className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-brand-50 hover:bg-brand-600 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
