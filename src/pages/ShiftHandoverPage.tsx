import { useState } from "react";
import { usePlatform } from "../store/platform";
import { Card, PageHeader, StatCard } from "../components/ui/primitives";
import { naira, cn } from "../lib/utils";
import ShiftHandoverModal from "../components/ShiftHandoverModal";
import type { ShiftHandoverRecord } from "../types";
import {
  CheckCircle2,
  Lock,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

export default function ShiftHandoverPage() {
  const { shiftHandovers, businessDate } = usePlatform();
  const [selectedHandover, setSelectedHandover] = useState<ShiftHandoverRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShift, setFilterShift] = useState<string>("all");

  // Metrics
  const todayHandovers = shiftHandovers.filter((h) => h.shiftDate === businessDate);
  const totalCashCounted = shiftHandovers.reduce((acc, h) => acc + h.countedCashTotal, 0);
  const pendingHandovers = shiftHandovers.filter((h) => h.status === "submitted");
  const urgentNotesCount = shiftHandovers.flatMap((h) => h.guestNotes).filter((n) => n.severity === "urgent").length;

  const filteredList = shiftHandovers.filter((h) => {
    const matchesSearch =
      h.handoverNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.departingStaffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.incomingStaffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = filterShift === "all" || h.shiftType === filterShift;
    return matchesSearch && matchesShift;
  });

  const getShiftBadge = (shift: ShiftHandoverRecord["shiftType"]) => {
    switch (shift) {
      case "morning_am":
        return <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs text-sky-300 font-medium">Morning (06:00-14:00)</span>;
      case "evening_pm":
        return <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 font-medium">Evening (14:00-22:00)</span>;
      case "night_graveyard":
        return <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300 font-medium">Night Audit (22:00-06:00)</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Front Office Shift Handover"
        description="M-LOD & Cashiering Protocol · Dual-custody drawer reconciliation, task handoffs, and critical guest notes"
        action={
          <button
            onClick={() => {
              setSelectedHandover(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-xs font-semibold text-brand-950 shadow-md hover:bg-gold-400 transition-colors"
          >
            <Plus size={15} /> Log New Shift Handover
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Handover Records"
          value={String(todayHandovers.length)}
          change={`Business Date: ${businessDate}`}
          trend="neutral"
        />
        <StatCard
          label="Pending Acknowledgment"
          value={String(pendingHandovers.length)}
          change={pendingHandovers.length > 0 ? "Requires incoming staff PIN" : "All handovers signed"}
          trend={pendingHandovers.length > 0 ? "down" : "up"}
        />
        <StatCard
          label="Total Drawer Cash Reconciled"
          value={naira(totalCashCounted)}
          change="Physical currency logged"
          trend="up"
        />
        <StatCard
          label="Urgent Guest Incidents"
          value={String(urgentNotesCount)}
          change="Requiring duty follow-up"
          trend={urgentNotesCount > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Shift Handover List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-800/80 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-gold-400" />
                <h3 className="font-display text-sm font-semibold text-brand-50">
                  Shift Handover Registry & Audit Log
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-brand-400" />
                  <input
                    type="text"
                    placeholder="Search shift or staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-lg border border-brand-700 bg-brand-900 py-1.5 pl-8 pr-3 text-xs text-brand-50 placeholder:text-brand-200/40 focus:outline-none"
                  />
                </div>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="rounded-lg border border-brand-700 bg-brand-900 px-2.5 py-1.5 text-xs text-brand-50 focus:outline-none"
                >
                  <option value="all">All Shifts</option>
                  <option value="morning_am">Morning AM</option>
                  <option value="evening_pm">Evening PM</option>
                  <option value="night_graveyard">Night Graveyard</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-brand-800/50">
              {filteredList.map((handover) => (
                <div
                  key={handover.id}
                  onClick={() => {
                    setSelectedHandover(handover);
                    setIsModalOpen(true);
                  }}
                  className="cursor-pointer p-4 transition-colors hover:bg-brand-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gold-400">
                        {handover.handoverNumber}
                      </span>
                      {getShiftBadge(handover.shiftType)}
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                          handover.status === "acknowledged"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300 animate-pulse"
                        )}
                      >
                        {handover.status === "acknowledged" ? "Acknowledged" : "Pending Acknowledgment"}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-brand-200/60">
                      {handover.submittedAt}
                    </span>
                  </div>

                  {/* Staff details */}
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="flex items-center gap-1.5 text-brand-200/80">
                      <span className="text-brand-200/50">Departing:</span>
                      <span className="font-medium text-brand-100">{handover.departingStaffName}</span>
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-1.5 text-brand-200/80">
                      <span className="text-brand-200/50">Incoming:</span>
                      <span className="font-medium text-brand-100">{handover.incomingStaffName}</span>
                      {handover.status === "acknowledged" ? (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      ) : (
                        <Lock size={12} className="text-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Cash & Variance */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-800/60 bg-brand-950/60 px-3 py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-brand-200/50">Counted Cash: </span>
                        <span className="font-mono font-semibold text-brand-50">
                          {naira(handover.countedCashTotal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-brand-200/50">Variance: </span>
                        <span
                          className={cn(
                            "font-mono font-bold",
                            handover.cashVariance === 0
                              ? "text-emerald-400"
                              : "text-amber-400"
                          )}
                        >
                          {handover.cashVariance === 0 ? "Balanced (₦0.00)" : naira(handover.cashVariance)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-brand-200/60">
                      <span>Tasks: {handover.tasks.filter((t) => t.status === "completed").length}/{handover.tasks.length}</span>
                      <span>Notes: {handover.guestNotes.length}</span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredList.length === 0 && (
                <div className="p-8 text-center text-xs text-brand-200/50">
                  No shift handover records found matching filter.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Active Shift Insights & Protocols */}
        <div className="space-y-4">
          <Card title="Active Shift Protocols" subtitle="Standard Operating Procedures">
            <div className="p-4 space-y-3 text-xs text-brand-200/80">
              <div className="rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                <p className="font-semibold text-brand-50">1. Dual Custody Cash Count</p>
                <p className="mt-1 text-[11px] text-brand-200/60">
                  Both departing and incoming staff must physically count drawer currency notes together. Float of ₦50,000 must remain.
                </p>
              </div>

              <div className="rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                <p className="font-semibold text-brand-50">2. Key Card Safe Count</p>
                <p className="mt-1 text-[11px] text-brand-200/60">
                  Audit physical RFID master cards and blank smart cards in the desk dispenser before authorization.
                </p>
              </div>

              <div className="rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                <p className="font-semibold text-brand-50">3. High-Priority Handover Traces</p>
                <p className="mt-1 text-[11px] text-brand-200/60">
                  VIP requests, late arrivals, airport transfers, and guest medical/dietary notes must be verbally briefed.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Recent Critical Notes" subtitle="High Severity Highlights">
            <div className="divide-y divide-brand-800/60">
              {shiftHandovers
                .flatMap((h) => h.guestNotes)
                .slice(0, 4)
                .map((note) => (
                  <div key={note.id} className="p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-brand-50">
                        {note.guestName} · {note.roomNumber}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                          note.severity === "urgent"
                            ? "bg-rose-500/20 text-rose-300"
                            : note.severity === "attention"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-brand-700/50 text-brand-300"
                        )}
                      >
                        {note.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-brand-200/70">{note.note}</p>
                    {note.actionRequired && (
                      <p className="mt-1 font-mono text-[10px] text-amber-300">
                        ⚡ {note.actionRequired}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ShiftHandoverModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedHandover(null);
          }}
          existingRecord={selectedHandover || undefined}
        />
      )}
    </div>
  );
}
