import { useState } from "react";
import { Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import type { KitchenTicket } from "../../types";
import {
  Flame,
  Snowflake,
  Cake,
  Wine,
  Clock,
  CheckCircle,
  Play,
  Check,
} from "lucide-react";

export function KitchenDisplayView() {
  const { kitchenTickets, updateKotStatus } = usePlatform();
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stations: Array<{ id: KitchenTicket["station"]; name: string; icon: any }> = [
    { id: "hot_kitchen", name: "Hot Line / Grill", icon: Flame },
    { id: "cold_larder", name: "Pantry / Cold Larder", icon: Snowflake },
    { id: "pastry", name: "Pastry & Bakery", icon: Cake },
    { id: "bar", name: "Bar / Beverage", icon: Wine },
  ];

  const filteredTickets = kitchenTickets.filter((t) => {
    const matchStation = stationFilter === "all" || t.station === stationFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchStation && matchStatus;
  });

  const activeCount = kitchenTickets.filter((t) => t.status === "fired" || t.status === "preparing").length;
  const readyCount = kitchenTickets.filter((t) => t.status === "ready").length;

  const getStationIcon = (station: KitchenTicket["station"]) => {
    switch (station) {
      case "hot_kitchen":
        return <Flame size={16} className="text-rose-400" />;
      case "cold_larder":
        return <Snowflake size={16} className="text-sky-400" />;
      case "pastry":
        return <Cake size={16} className="text-purple-400" />;
      case "bar":
        return <Wine size={16} className="text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KDS Station KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Kitchen Tickets"
          value={String(activeCount)}
          sub="Orders on the line"
          accent="gold"
        />
        <StatCard
          label="Pass Ready (Expediter)"
          value={String(readyCount)}
          sub="Awaiting runner pickup"
          accent="emerald"
        />
        <StatCard
          label="Avg Prep Velocity"
          value="14.2 min"
          sub="Target: 18 min SLA"
          accent="sky"
        />
        <StatCard
          label="Priority Expedited"
          value={String(kitchenTickets.filter((t) => t.priority === "rush").length)}
          sub="VIP & Suite guests"
          accent="rose"
        />
      </div>

      {/* Station Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStationFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              stationFilter === "all"
                ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                : "text-brand-200/70 hover:bg-brand-800/40"
            }`}
          >
            All Kitchen Stations
          </button>
          {stations.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setStationFilter(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                stationFilter === id
                  ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                  : "text-brand-200/70 hover:bg-brand-800/40"
              }`}
            >
              <Icon size={14} />
              {name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-300/60">Status:</span>
          {(["all", "fired", "preparing", "ready", "served"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded px-2.5 py-1 text-xs capitalize transition ${
                statusFilter === st
                  ? "bg-brand-700 text-brand-50 font-medium"
                  : "text-brand-300 hover:text-brand-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards Grid (KDS Rail) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTickets.map((t) => {
          const isRush = t.priority === "rush";
          const isFired = t.status === "fired";
          const isPreparing = t.status === "preparing";
          const isReady = t.status === "ready";
          const isServed = t.status === "served";

          return (
            <div
              key={t.id}
              className={`flex flex-col rounded-xl border p-4 shadow-lg transition ${
                isReady
                  ? "border-emerald-500/60 bg-emerald-950/15 ring-1 ring-emerald-400/30"
                  : isRush
                  ? "border-rose-500/60 bg-rose-950/20 ring-1 ring-rose-400/30"
                  : "border-brand-800/80 bg-brand-900/60"
              }`}
            >
              {/* Ticket Header */}
              <div className="flex items-start justify-between border-b border-brand-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800">
                    {getStationIcon(t.station)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gold-300">{t.ticketNumber}</span>
                      {isRush && (
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300 animate-pulse">
                          RUSH VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-brand-100 mt-0.5">
                      {t.outletName} · Table {t.tableNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-brand-300">
                    <Clock size={12} />
                    {t.firedAt}
                  </div>
                  <span className="text-[10px] text-brand-300/60">Server: {t.serverName}</span>
                </div>
              </div>

              {/* Ticket Items */}
              <div className="flex-1 py-3 space-y-2.5">
                {t.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between rounded-lg bg-brand-950/40 p-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-800 font-mono text-xs font-bold text-gold-400">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-brand-50">{item.itemName}</span>
                      </div>
                      {item.specialInstructions && (
                        <p className="text-[11px] font-medium text-amber-300 mt-1 pl-7">
                          ⚠ {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <span className="rounded bg-brand-800/80 px-2 py-0.5 font-mono text-[10px] text-brand-200/70 capitalize">
                      {item.course}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status & Action Buttons */}
              <div className="mt-2 border-t border-brand-800/60 pt-3 flex items-center justify-between">
                <Badge
                  className={
                    isServed
                      ? "border-brand-700 bg-brand-800 text-brand-300"
                      : isReady
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                      : isPreparing
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                      : "border-sky-400/40 bg-sky-500/10 text-sky-300"
                  }
                >
                  {t.status.toUpperCase()}
                </Badge>

                <div className="flex items-center gap-2">
                  {isFired && (
                    <button
                      onClick={() => updateKotStatus(t.id, "preparing")}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition"
                    >
                      <Play size={12} />
                      Start Prep
                    </button>
                  )}
                  {isPreparing && (
                    <button
                      onClick={() => updateKotStatus(t.id, "ready")}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                    >
                      <Check size={12} />
                      Mark Ready (Pass)
                    </button>
                  )}
                  {isReady && (
                    <button
                      onClick={() => updateKotStatus(t.id, "served")}
                      className="flex items-center gap-1 rounded-lg bg-brand-700 border border-brand-600 px-3 py-1 text-xs font-semibold text-brand-100 hover:bg-brand-600 transition"
                    >
                      <CheckCircle size={12} />
                      Runner Dispatched
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
