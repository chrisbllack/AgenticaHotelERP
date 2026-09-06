import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, StatCard, EmptyState } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { cn, ROOM_STATUS } from "../lib/utils";
import { ClipboardCheck, Wrench, WrenchOff } from "lucide-react";

type Filter = "all" | "open" | "out_of_order";

const TYPE_LABELS: Record<string, string> = {
  Daily: "Daily Cleaning",
  Deep: "Deep Cleaning",
  Checkout: "Checkout Cleaning",
  Maintenance: "Inspection Required",
};

const FILTERS: Array<[Filter, string]> = [
  ["all", "All rooms"],
  ["open", "Needs attention"],
  ["out_of_order", "Out of order"],
];

export default function MaintenancePage() {
  const { rooms, tasks } = usePlatform();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    const relevant = tasks.filter((t) => ["Inspection Required", "Maintenance + Cleaning", "Deep Cleaning"].includes(t.taskType));
    const roomToTask = new Map(relevant.map((t) => [t.roomId, t]));
    return rooms
      .filter((r) => {
        if (filter === "out_of_order") return r.status === "out_of_order" || r.status === "out_of_service";
        if (filter === "open") {
          const ooo = r.status === "out_of_order" || r.status === "out_of_service";
          return ooo || roomToTask.has(r.id);
        }
        return true;
      })
      .map((r) => {
        const t = roomToTask.get(r.id);
        return { room: r, task: t, work: t?.taskType ?? (r.status.startsWith("out_of") ? "Repair required" : "No open work order") };
      });
  }, [rooms, tasks, filter]);

  const oooCount = rooms.filter((r) => r.status === "out_of_order" || r.status === "out_of_service").length;
  const openWork = rows.filter((x) => x.task).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance & Engineering"
        subtitle="M-LOD · out-of-order control, repair work orders and deep-clean coordination"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rooms OOO / OOS" value={String(oooCount)} sub="out of inventory" accent="rose" />
        <StatCard label="Open work orders" value={String(openWork)} sub="linked to housekeeping" accent="gold" />
        <StatCard label="Deep cleans queued" value={String(tasks.filter((t) => t.taskType === "Deep Cleaning" && t.status !== "completed").length)} sub="periodic program" />
        <StatCard label="Sellable inventory" value={String(rooms.length - oooCount)} sub="rooms available to sell" accent="emerald" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm transition-colors",
              filter === key
                ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50"
                : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title="Work Order Board" subtitle="Rooms with engineering involvement, surfaced from the housekeeping board" />
        {rows.length === 0 ? (
          <EmptyState title="Nothing matches this filter" hint="Switch filters to see room state." />
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map(({ room, task, work }) => {
              const meta = ROOM_STATUS[room.status];
              const isOoo = room.status === "out_of_order" || room.status === "out_of_service";
              return (
                <div
                  key={room.id}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    isOoo ? "border-rose-500/40 bg-rose-500/5" : "border-brand-800/70 bg-brand-950/50 hover:border-brand-600",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-xl text-brand-50">Room {room.number}</p>
                    <Badge className={meta.chip}>{meta.short}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-100/80">
                    {isOoo ? <WrenchOff size={12} className="text-rose-300" /> : <Wrench size={12} className="text-gold-400" />}
                    {work}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-brand-800/60 pt-3">
                    <span className="text-[10px] uppercase tracking-wider text-brand-200/40">
                      {task ? task.status.replace("_", " ") : "no open task"}
                    </span>
                    {task ? (
                      <span className="flex items-center gap-1 text-[11px] text-gold-300">
                        <ClipboardCheck size={11} /> tracked
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
          Placing a room out of order automatically blocks channel distribution and flags the executive dashboard.
        </p>
      </Card>

      <div className="text-xs text-brand-200/40">
        Type labels: {Object.values(TYPE_LABELS).join(" · ")}
      </div>
    </div>
  );
}
