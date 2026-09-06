import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { employees } from "../data/demo";
import { cn, TASK_PRIORITY } from "../lib/utils";
import { CheckCheck, ClipboardCheck, UserRound } from "lucide-react";

const STATUS_COLS = [
  { key: "pending", label: "Pending", accent: "border-t-stone-400" },
  { key: "completed", label: "Completed", accent: "border-t-sky-400" },
  { key: "inspected", label: "Inspected", accent: "border-t-emerald-400" },
] as const;

export default function HousekeepingPage() {
  const { tasks, rooms, completeTask, inspectTask, assignTask } = usePlatform();
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filtered = useMemo(
    () => tasks.filter((t) => priorityFilter === "all" || t.priority === priorityFilter),
    [tasks, priorityFilter],
  );

  const roomNumber = (roomId: string) => rooms.find((r) => r.id === roomId)?.number ?? "?";
  const attendants = employees.filter((e) => e.departmentId === "dept-house");

  return (
    <div className="space-y-6">
      <PageHeader title="Housekeeping" subtitle="Task board — assignment, execution, supervisor inspection" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Tasks" value={String(tasks.filter((t) => t.status === "pending").length)} sub="queued for attendants" accent="gold" />
        <StatCard label="Completed" value={String(tasks.filter((t) => t.status === "completed").length)} sub="awaiting inspection" />
        <StatCard label="Inspected" value={String(tasks.filter((t) => t.status === "inspected").length)} sub="rooms released clean" accent="emerald" />
        <StatCard label="Dirty Rooms" value={String(rooms.filter((r) => r.housekeepingStatus === "dirty").length)} sub="need service today" accent="rose" />
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "normal", "high", "urgent"].map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-sm capitalize",
              priorityFilter === p ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50" : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600",
            )}
          >
            {p === "all" ? "All priorities" : p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {STATUS_COLS.map((col) => (
          <Card key={col.key} className={cn("border-t-2", col.accent)}>
            <CardHeader
              title={col.label}
              subtitle={`${filtered.filter((t) => t.status === col.key).length} task(s)`}
            />
            <div className="space-y-2.5 p-4">
              {filtered.filter((t) => t.status === col.key).length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-brand-200/40">Nothing here.</p>
              ) : (
                filtered
                  .filter((t) => t.status === col.key)
                  .map((t) => (
                    <div key={t.id} className="rounded-lg border border-brand-800/70 bg-brand-950/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-brand-50">Room {roomNumber(t.roomId)}</p>
                          <p className="text-xs text-brand-200/60">{t.taskType}</p>
                        </div>
                        <Badge className={TASK_PRIORITY[t.priority]}>{t.priority}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {t.status === "pending" ? (
                          <>
                            <select
                              value={t.assignedTo ?? ""}
                              onChange={(e) => assignTask(t.id, e.target.value)}
                              className="rounded border border-brand-800 bg-brand-950 px-2 py-1 text-xs text-brand-50 outline-none focus:border-brand-500"
                            >
                              <option value="">Assign…</option>
                              {attendants.map((a) => (
                                <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                              ))}
                            </select>
                            <button onClick={() => completeTask(t.id)} className="flex items-center gap-1 rounded border border-sky-400/40 bg-sky-500/10 px-2 py-1 text-xs text-sky-200 hover:bg-sky-500/20">
                              <CheckCheck size={12} /> Done
                            </button>
                          </>
                        ) : null}
                        {t.status === "completed" ? (
                          <button onClick={() => inspectTask(t.id)} className="flex items-center gap-1 rounded border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20">
                            <ClipboardCheck size={12} /> Approve & release
                          </button>
                        ) : null}
                        {t.status === "inspected" ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-300"><ClipboardCheck size={12} /> Room released to front desk</span>
                        ) : null}
                        {t.assignedTo ? (
                          <span className="ml-auto flex items-center gap-1 text-[11px] text-brand-200/60">
                            <UserRound size={11} />
                            {attendants.find((a) => a.id === t.assignedTo)?.firstName ?? "Staff"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
