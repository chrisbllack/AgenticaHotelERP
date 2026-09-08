import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { employees } from "../data/demo";
import { cn, TASK_PRIORITY, naira } from "../lib/utils";
import {
  CheckCheck,
  ClipboardCheck,
  Download,
  Mail,
  Package,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserRound,
} from "lucide-react";
import LostAndFoundModal from "../components/LostAndFoundModal";
import BulkExportModal, { type ExportableTask } from "../components/BulkExportModal";
import type { LostAndFoundItem } from "../types";

const STATUS_COLS = [
  { key: "pending", label: "Pending", accent: "border-t-stone-400" },
  { key: "completed", label: "Completed", accent: "border-t-sky-400" },
  { key: "inspected", label: "Inspected", accent: "border-t-emerald-400" },
] as const;

export default function HousekeepingPage() {
  const { tasks, rooms, completeTask, inspectTask, assignTask, lostAndFound, businessDate } =
    usePlatform();

  const [activeTab, setActiveTab] = useState<"tasks" | "lost_found">("tasks");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Lost and Found States
  const [lfStatusFilter, setLfStatusFilter] = useState<string>("all");
  const [lfSearch, setLfSearch] = useState<string>("");
  const [isLfModalOpen, setIsLfModalOpen] = useState(false);
  const [lfModalMode, setLfModalMode] = useState<"log" | "claim" | "dispose">("log");
  const [selectedLfItem, setSelectedLfItem] = useState<LostAndFoundItem | null>(null);

  // Bulk Export State
  const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);

  const filtered = useMemo(
    () => tasks.filter((t) => priorityFilter === "all" || t.priority === priorityFilter),
    [tasks, priorityFilter],
  );

  const roomNumber = (roomId: string) => rooms.find((r) => r.id === roomId)?.number ?? "?";
  const attendants = employees.filter((e) => e.departmentId === "dept-house");

  // Filtered Lost & Found
  const filteredLf = useMemo(() => {
    return lostAndFound.filter((item) => {
      const matchesStatus =
        lfStatusFilter === "all" ||
        (lfStatusFilter === "in_custody" && item.status === "logged") ||
        (lfStatusFilter === "claimed" && (item.status === "claimed" || item.status === "returned")) ||
        (lfStatusFilter === "disposed" && item.status === "disposed");

      const q = lfSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.itemNumber.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.roomNumber && item.roomNumber.toLowerCase().includes(q)) ||
        (item.guestName && item.guestName.toLowerCase().includes(q)) ||
        (item.storageLocker && item.storageLocker.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [lostAndFound, lfStatusFilter, lfSearch]);

  // Prepare tasks for bulk export
  const exportableTasks: ExportableTask[] = useMemo(() => {
    return tasks.map((t) => {
      const r = rooms.find((rm) => rm.id === t.roomId);
      const att = attendants.find((a) => a.id === t.assignedTo);
      return {
        id: t.id,
        roomNumber: r?.number || "N/A",
        taskType: t.taskType,
        priority: t.priority,
        status: t.status,
        assignedTo: att ? `${att.firstName} ${att.lastName}` : "Unassigned",
        dueDate: businessDate,
        details: `Room Status: ${r?.status || "Unknown"}`,
        creditsOrEstimatedHours: r?.cleaningCredits || 2,
      };
    });
  }, [tasks, rooms, attendants, businessDate]);

  const openLogModal = () => {
    setSelectedLfItem(null);
    setLfModalMode("log");
    setIsLfModalOpen(true);
  };

  const openClaimModal = (item: LostAndFoundItem) => {
    setSelectedLfItem(item);
    setLfModalMode("claim");
    setIsLfModalOpen(true);
  };

  const openDisposeModal = (item: LostAndFoundItem) => {
    setSelectedLfItem(item);
    setLfModalMode("dispose");
    setIsLfModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Housekeeping & Custody"
          subtitle="Task board execution, supervisor inspection, and Lost & Found custody ledger"
        />
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBulkExportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-brand-800 bg-brand-900/60 px-3.5 py-2 text-xs font-semibold text-brand-100 hover:border-brand-600 hover:bg-brand-900 shadow-sm transition-all"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Bulk Export Briefing</span>
          </button>
          {activeTab === "lost_found" && (
            <button
              type="button"
              onClick={openLogModal}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-400 shadow-sm transition-all"
            >
              <Plus size={15} />
              <span>Log Found Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex rounded-xl border border-brand-800/80 bg-brand-950/60 p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all",
            activeTab === "tasks"
              ? "bg-brand-800 text-brand-50 shadow-sm"
              : "text-brand-200/70 hover:text-brand-100"
          )}
        >
          <ClipboardCheck size={16} />
          <span>Room Cleaning Tasks ({tasks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lost_found")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all",
            activeTab === "lost_found"
              ? "bg-brand-800 text-brand-50 shadow-sm"
              : "text-brand-200/70 hover:text-brand-100"
          )}
        >
          <Package size={16} />
          <span>Lost & Found Custody ({lostAndFound.length})</span>
          {lostAndFound.filter((i) => i.status === "logged").length > 0 && (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
              {lostAndFound.filter((i) => i.status === "logged").length} in vault
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ROOM CLEANING TASKS */}
      {activeTab === "tasks" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Open Tasks"
              value={String(tasks.filter((t) => t.status === "pending").length)}
              sub="queued for attendants"
              accent="gold"
            />
            <StatCard
              label="Completed"
              value={String(tasks.filter((t) => t.status === "completed").length)}
              sub="awaiting inspection"
            />
            <StatCard
              label="Inspected"
              value={String(tasks.filter((t) => t.status === "inspected").length)}
              sub="rooms released clean"
              accent="emerald"
            />
            <StatCard
              label="Dirty Rooms"
              value={String(rooms.filter((r) => r.housekeepingStatus === "dirty").length)}
              sub="need service today"
              accent="rose"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["all", "normal", "high", "urgent"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={cn(
                    "rounded-lg border px-3.5 py-1.5 text-xs capitalize transition-all",
                    priorityFilter === p
                      ? "border-brand-400/50 bg-brand-500/20 font-semibold text-brand-50"
                      : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600"
                  )}
                >
                  {p === "all" ? "All priorities" : p}
                </button>
              ))}
            </div>
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
                        <div
                          key={t.id}
                          className="rounded-lg border border-brand-800/70 bg-brand-950/50 p-3"
                        >
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
                                    <option key={a.id} value={a.id}>
                                      {a.firstName} {a.lastName}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => completeTask(t.id)}
                                  className="flex items-center gap-1 rounded border border-sky-400/40 bg-sky-500/10 px-2 py-1 text-xs text-sky-200 hover:bg-sky-500/20"
                                >
                                  <CheckCheck size={12} /> Done
                                </button>
                              </>
                            ) : null}
                            {t.status === "completed" ? (
                              <button
                                onClick={() => inspectTask(t.id)}
                                className="flex items-center gap-1 rounded border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                              >
                                <ClipboardCheck size={12} /> Approve & release
                              </button>
                            ) : null}
                            {t.status === "inspected" ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-300">
                                <ClipboardCheck size={12} /> Room released to front desk
                              </span>
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
        </>
      )}

      {/* TAB 2: LOST & FOUND SUB-MODULE */}
      {activeTab === "lost_found" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Lost & Found KPI Bar */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Items in Vault"
              value={String(lostAndFound.filter((i) => i.status === "logged").length)}
              sub="unclaimed / safe storage"
              accent="gold"
            />
            <StatCard
              label="Claimed & Returned"
              value={String(lostAndFound.filter((i) => i.status === "claimed" || i.status === "returned").length)}
              sub="verified guest handovers"
              accent="emerald"
            />
            <StatCard
              label="Disposed Items"
              value={String(lostAndFound.filter((i) => i.status === "disposed").length)}
              sub="90-day retention expired"
            />
            <StatCard
              label="Custody Value (₦)"
              value={naira(
                lostAndFound
                  .filter((i) => i.status === "logged")
                  .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0)
              )}
              sub="secured under lock"
              accent="sky"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Items" },
                { id: "in_custody", label: "In Vault (Logged)" },
                { id: "claimed", label: "Claimed & Returned" },
                { id: "disposed", label: "Disposed" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLfStatusFilter(f.id)}
                  className={cn(
                    "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all",
                    lfStatusFilter === f.id
                      ? "border-sky-500/50 bg-sky-500/20 text-sky-200 font-semibold"
                      : "border-brand-800 bg-brand-900/40 text-brand-200/70 hover:border-brand-700"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-brand-200/40" />
              <input
                type="text"
                value={lfSearch}
                onChange={(e) => setLfSearch(e.target.value)}
                placeholder="Search item, room, locker, guest..."
                className="w-full rounded-lg border border-brand-800 bg-brand-900/50 py-1.5 pl-8 pr-3 text-xs text-brand-100 placeholder-brand-200/40 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Items Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-800 bg-brand-900/50 text-[11px] font-semibold uppercase tracking-wider text-brand-200/70">
                    <th className="py-3 px-4">Ref #</th>
                    <th className="py-3 px-4">Item & Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location Found</th>
                    <th className="py-3 px-4">Found Date / Staff</th>
                    <th className="py-3 px-4">Storage Locker</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-800/60">
                  {filteredLf.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-brand-200/50">
                        No lost and found records match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLf.map((item) => (
                      <tr key={item.id} className="hover:bg-brand-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                          {item.itemNumber}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-brand-100">{item.name}</p>
                          <p className="text-[11px] text-brand-200/60 truncate">{item.description}</p>
                          {item.estimatedValue ? (
                            <span className="text-[10px] text-emerald-400/80 font-mono">
                              Est. Value: {naira(item.estimatedValue)}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="rounded bg-brand-800/80 px-2 py-0.5 text-[10px] font-medium text-brand-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.roomNumber ? (
                            <span className="font-semibold text-brand-100">Room {item.roomNumber}</span>
                          ) : (
                            <span className="text-brand-200/70">{item.locationFound}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-brand-100">{item.foundDate}</p>
                          <p className="text-[10px] text-brand-200/60">{item.foundByStaffName}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-brand-200/80">
                          {item.storageLocker}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.status === "logged" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                              <Package size={11} /> IN VAULT
                            </span>
                          )}
                          {(item.status === "claimed" || item.status === "returned") && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                                <UserCheck size={11} /> CLAIMED / RETURNED
                              </span>
                              {item.emailSentAt && (
                                <div className="flex items-center gap-1 text-[9px] text-sky-300">
                                  <Mail size={10} /> Email Dispatched
                                </div>
                              )}
                            </div>
                          )}
                          {item.status === "disposed" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                              <Trash2 size={11} /> DISPOSED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {item.status === "logged" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openClaimModal(item)}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20 shadow-sm"
                              >
                                <UserCheck size={12} /> Claim & Release
                              </button>
                              <button
                                type="button"
                                onClick={() => openDisposeModal(item)}
                                className="rounded-md border border-brand-800 p-1 text-brand-200/50 hover:border-rose-500/50 hover:text-rose-400"
                                title="Authorize Disposal"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-brand-200/50 text-right">
                              {item.claimedBy ? `To: ${item.claimedBy}` : item.disposalReason ? "Disposed" : "Archived"}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Lost and Found Modal */}
      <LostAndFoundModal
        isOpen={isLfModalOpen}
        onClose={() => setIsLfModalOpen(false)}
        mode={lfModalMode}
        itemToClaim={selectedLfItem}
      />

      {/* Bulk Export Modal */}
      <BulkExportModal
        isOpen={isBulkExportOpen}
        onClose={() => setIsBulkExportOpen(false)}
        title="Housekeeping Shift Task Briefing Export"
        moduleName="Housekeeping"
        businessDate={businessDate}
        tasks={exportableTasks}
      />
    </div>
  );
}

