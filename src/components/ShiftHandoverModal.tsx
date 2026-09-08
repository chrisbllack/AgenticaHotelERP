import { useState } from "react";
import { usePlatform } from "../store/platform";
import { naira, cn } from "../lib/utils";
import type { ShiftHandoverRecord, ShiftHandoverTask, ShiftGuestNote } from "../types";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  FileCheck2,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRecord?: ShiftHandoverRecord;
}

export default function ShiftHandoverModal({ isOpen, onClose, existingRecord }: ShiftHandoverModalProps) {
  const { businessDate, createShiftHandover, acknowledgeShiftHandover } = usePlatform();

  // Mode: creating or reviewing/acknowledging
  const isReview = !!existingRecord;

  // Form State
  const [shiftType, setShiftType] = useState<"morning_am" | "evening_pm" | "night_graveyard">(
    existingRecord?.shiftType || "evening_pm"
  );
  const [departingStaff, setDepartingStaff] = useState(
    existingRecord?.departingStaffName || "Blessing Effiong (Receptionist)"
  );
  const [incomingStaff, setIncomingStaff] = useState(
    existingRecord?.incomingStaffName || "Chidi Amadi (Night Supervisor)"
  );

  // Cash Drawer Denominations
  const [n1000, setN1000] = useState<number>(existingRecord?.denominations.n1000 ?? 200);
  const [n500, setN500] = useState<number>(existingRecord?.denominations.n500 ?? 40);
  const [n200, setN200] = useState<number>(existingRecord?.denominations.n200 ?? 20);
  const [n100, setN100] = useState<number>(existingRecord?.denominations.n100 ?? 10);
  const [n50, setN50] = useState<number>(existingRecord?.denominations.n50 ?? 0);

  const [openingFloat] = useState<number>(existingRecord?.openingFloat ?? 50000);
  const [expectedCashDrop, setExpectedCashDrop] = useState<number>(existingRecord?.expectedCashDrop ?? 225000);
  const [cardSettled, setCardSettled] = useState<boolean>(existingRecord?.posCardBatchesSettled ?? true);
  const [cardPayments, setCardPayments] = useState<number>(existingRecord?.totalCardPayments ?? 1650000);
  const [varianceReason, setVarianceReason] = useState(existingRecord?.varianceExplanation || "");

  // Calculated physical cash
  const countedCash = n1000 * 1000 + n500 * 500 + n200 * 200 + n100 * 100 + n50 * 50;
  const cashVariance = countedCash - expectedCashDrop;

  // Tasks
  const [tasks, setTasks] = useState<ShiftHandoverTask[]>(
    existingRecord?.tasks || [
      {
        id: "t-1",
        description: "Verify VIP Chief Adeyemi arrival late flight (Suite 050)",
        category: "vip_arrival",
        status: "pending",
        priority: "urgent",
        dueTime: "23:30",
      },
      {
        id: "t-2",
        description: "Audit physical key card drawer before Night Audit run",
        category: "key_audit",
        status: "pending",
        priority: "high",
        dueTime: "01:30",
      },
      {
        id: "t-3",
        description: "Wake-up call for Room 004 (Mr. Ibrahim) at 05:30 AM",
        category: "wakeup_call",
        status: "pending",
        priority: "high",
        dueTime: "05:30",
      },
    ]
  );

  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskCat, setNewTaskCat] = useState<ShiftHandoverTask["category"]>("vip_arrival");
  const [newTaskPriority, setNewTaskPriority] = useState<ShiftHandoverTask["priority"]>("normal");
  const [newTaskTime, setNewTaskTime] = useState("");

  // Guest Notes
  const [guestNotes, setGuestNotes] = useState<ShiftGuestNote[]>(
    existingRecord?.guestNotes || [
      {
        id: "gn-1",
        guestName: "Alhaji Garba Shehu",
        roomNumber: "049",
        note: "Allergic to feather pillows. Synthetic foam pillows installed by housekeeping.",
        severity: "info",
      },
      {
        id: "gn-2",
        guestName: "Dr. Nnamdi Azikiwe Jr.",
        roomNumber: "002",
        note: "Complimentary late checkout granted until 14:00 by GM.",
        severity: "attention",
        actionRequired: "Extend key card validity during night audit.",
      },
    ]
  );

  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestRoom, setNewGuestRoom] = useState("");
  const [newGuestNote, setNewGuestNote] = useState("");
  const [newGuestSeverity, setNewGuestSeverity] = useState<ShiftGuestNote["severity"]>("info");

  // Summary & Security PIN
  const [summaryNotes, setSummaryNotes] = useState(
    existingRecord?.handoverSummaryNotes || "Evening shift completed. All guest folios reconciled with no billing anomalies."
  );
  const [departingPin, setDepartingPin] = useState("");
  const [incomingPin, setIncomingPin] = useState("");
  const [pinError, setPinError] = useState("");

  if (!isOpen) return null;

  const handleAddTask = () => {
    if (!newTaskDesc.trim()) return;
    const task: ShiftHandoverTask = {
      id: `t-${Date.now()}`,
      description: newTaskDesc.trim(),
      category: newTaskCat,
      status: "pending",
      priority: newTaskPriority,
      dueTime: newTaskTime || undefined,
    };
    setTasks([...tasks, task]);
    setNewTaskDesc("");
    setNewTaskTime("");
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t
      )
    );
  };

  const handleAddGuestNote = () => {
    if (!newGuestNote.trim() || !newGuestName.trim()) return;
    const note: ShiftGuestNote = {
      id: `gn-${Date.now()}`,
      guestName: newGuestName.trim(),
      roomNumber: newGuestRoom.trim() || "Lobby",
      note: newGuestNote.trim(),
      severity: newGuestSeverity,
    };
    setGuestNotes([...guestNotes, note]);
    setNewGuestName("");
    setNewGuestRoom("");
    setNewGuestNote("");
  };

  const handleDeleteGuestNote = (id: string) => {
    setGuestNotes(guestNotes.filter((g) => g.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!isReview) {
      if (departingPin.length < 4) {
        setPinError("Departing staff must enter a 4-digit security authorization PIN.");
        return;
      }

      createShiftHandover({
        shiftType,
        shiftDate: businessDate,
        departingStaffName: departingStaff,
        incomingStaffName: incomingStaff,
        openingFloat,
        expectedCashDrop,
        countedCashTotal: countedCash,
        cashVariance,
        varianceExplanation: varianceReason,
        denominations: { n1000, n500, n200, n100, n50 },
        posCardBatchesSettled: cardSettled,
        totalCardPayments: cardPayments,
        tasks,
        guestNotes,
        departingStaffPinVerified: true,
        incomingStaffPinVerified: false,
        handoverSummaryNotes: summaryNotes,
      });
      onClose();
    } else if (existingRecord) {
      if (incomingPin.length < 4) {
        setPinError("Incoming staff must enter their 4-digit verification PIN to take custody.");
        return;
      }
      acknowledgeShiftHandover(existingRecord.id, incomingStaff);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-brand-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
                <ShieldCheck size={18} />
              </span>
              <h2 className="font-display text-xl text-brand-50">
                {isReview ? `Shift Handover Audit #${existingRecord.handoverNumber}` : "Front Office Shift Handover Protocol"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-brand-200/60">
              M-LOD & Cashiering · Secure digital shift transfer with dual custody reconciliation & incident handover
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-800 hover:text-brand-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Shift Details */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-brand-800/60 bg-brand-900/30 p-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Shift Period</label>
              <select
                disabled={isReview}
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-sm text-brand-50 focus:border-gold-500 focus:outline-none"
              >
                <option value="morning_am">Morning AM (06:00 - 14:00)</option>
                <option value="evening_pm">Evening PM (14:00 - 22:00)</option>
                <option value="night_graveyard">Night Audit (22:00 - 06:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Departing Team Member</label>
              <input
                type="text"
                disabled={isReview}
                value={departingStaff}
                onChange={(e) => setDepartingStaff(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-sm text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Incoming Custodian</label>
              <input
                type="text"
                value={incomingStaff}
                onChange={(e) => setIncomingStaff(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-sm text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 1: Cash Drawer & Denomination Reconciliation */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-4">
            <div className="flex items-center justify-between border-b border-brand-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Banknote size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-50">
                  Cash Drawer Count & Float Reconciliation
                </h3>
              </div>
              <span className="text-xs text-brand-200/50">Base Currency: NGN (₦)</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Physical Denomination Tally */}
              <div className="space-y-2 rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                <p className="text-xs font-semibold text-brand-200/80">Physical Note Count Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-300">₦1,000 notes:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={isReview}
                      value={n1000}
                      onChange={(e) => setN1000(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 rounded border border-brand-700 bg-brand-900 px-2 py-1 text-right text-brand-50"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-300">₦500 notes:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={isReview}
                      value={n500}
                      onChange={(e) => setN500(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 rounded border border-brand-700 bg-brand-900 px-2 py-1 text-right text-brand-50"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-300">₦200 notes:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={isReview}
                      value={n200}
                      onChange={(e) => setN200(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 rounded border border-brand-700 bg-brand-900 px-2 py-1 text-right text-brand-50"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-300">₦100 notes:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={isReview}
                      value={n100}
                      onChange={(e) => setN100(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 rounded border border-brand-700 bg-brand-900 px-2 py-1 text-right text-brand-50"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-2">
                    <span className="text-brand-300">₦50 notes / Coins:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={isReview}
                      value={n50}
                      onChange={(e) => setN50(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 rounded border border-brand-700 bg-brand-900 px-2 py-1 text-right text-brand-50"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-brand-800/60 pt-2 text-xs font-semibold">
                  <span className="text-brand-200">Total Counted Physical Cash:</span>
                  <span className="font-mono text-sm text-emerald-400">{naira(countedCash)}</span>
                </div>
              </div>

              {/* Float & Variance Audit */}
              <div className="space-y-3 rounded-lg border border-brand-800/60 bg-brand-950/60 p-3">
                <p className="text-xs font-semibold text-brand-200/80">Float & Expected Cash Drop</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-brand-200/60">Standard Opening Float (Bank):</span>
                    <span className="font-mono text-brand-50">{naira(openingFloat)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-200/60">Expected Net Cash Collected:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={isReview}
                      value={expectedCashDrop}
                      onChange={(e) => setExpectedCashDrop(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-28 rounded border border-brand-700 bg-brand-900 px-2 py-0.5 text-right font-mono text-xs text-brand-50"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-brand-800/60 pt-1.5">
                    <span className="font-semibold text-brand-200">Reconciliation Variance:</span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 font-mono text-xs font-bold",
                        cashVariance === 0
                          ? "bg-emerald-500/20 text-emerald-300"
                          : cashVariance > 0
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      )}
                    >
                      {cashVariance === 0 ? "₦0.00 (Balanced)" : `${cashVariance > 0 ? "+" : ""}${naira(cashVariance)}`}
                    </span>
                  </div>
                </div>

                {cashVariance !== 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-400">
                      Variance Explanation (Required for Audit):
                    </label>
                    <input
                      type="text"
                      disabled={isReview}
                      placeholder="e.g. ₦1,000 cash advance voucher logged for guest taxi"
                      value={varianceReason}
                      onChange={(e) => setVarianceReason(e.target.value)}
                      className="mt-1 w-full rounded border border-amber-500/40 bg-brand-900 px-2 py-1 text-xs text-brand-50"
                    />
                  </div>
                )}

                {/* POS Card Settlement */}
                <div className="flex items-center justify-between border-t border-brand-800/60 pt-2 text-xs">
                  <label className="flex items-center gap-2 text-brand-100">
                    <input
                      type="checkbox"
                      disabled={isReview}
                      checked={cardSettled}
                      onChange={(e) => setCardSettled(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-700 bg-brand-900 text-gold-500"
                    />
                    POS Card Terminals Batch Settled
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-brand-200/50 uppercase">Card Vol:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={isReview}
                      value={cardPayments}
                      onChange={(e) => setCardPayments(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 rounded border border-brand-700 bg-brand-900 px-2 py-0.5 text-right font-mono text-xs text-brand-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Shift Handover Tasks */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-4">
            <div className="flex items-center justify-between border-b border-brand-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gold-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-50">
                  Duty & Operational Task Checklist
                </h3>
              </div>
              <span className="text-xs text-brand-200/50">
                {tasks.filter((t) => t.status === "completed").length} of {tasks.length} done
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-brand-800/60 bg-brand-950/60 p-2.5 text-xs text-brand-100"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleTaskStatus(task.id)}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                        task.status === "completed"
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                          : "border-brand-600 bg-brand-900 text-transparent hover:border-brand-500"
                      )}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                    <span
                      className={cn(
                        task.status === "completed" ? "line-through text-brand-200/40" : "text-brand-50"
                      )}
                    >
                      {task.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.dueTime && (
                      <span className="flex items-center gap-1 rounded bg-brand-800/60 px-1.5 py-0.5 text-[11px] text-brand-200/70">
                        <Clock size={10} /> {task.dueTime}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        task.priority === "urgent"
                          ? "bg-rose-500/20 text-rose-300"
                          : task.priority === "high"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-brand-700/50 text-brand-200"
                      )}
                    >
                      {task.priority}
                    </span>
                    {!isReview && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-brand-400 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isReview && (
              <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-brand-800/40">
                <input
                  type="text"
                  placeholder="New task (e.g. Wake-up call, luggage retrieval, late arrival)"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="flex-1 rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-50 placeholder:text-brand-200/40 focus:outline-none"
                />
                <select
                  value={newTaskCat}
                  onChange={(e) => setNewTaskCat(e.target.value as any)}
                  className="rounded-lg border border-brand-700 bg-brand-900 px-2 py-1.5 text-xs text-brand-50 focus:outline-none"
                >
                  <option value="vip_arrival">VIP Arrival</option>
                  <option value="checkout">Checkout</option>
                  <option value="wakeup_call">Wake-up Call</option>
                  <option value="key_audit">Key Audit</option>
                  <option value="luggage">Luggage</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="rounded-lg border border-brand-700 bg-brand-900 px-2 py-1.5 text-xs text-brand-50 focus:outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="rounded-lg border border-brand-700 bg-brand-900 px-2 py-1.5 text-xs text-brand-50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-brand-50 hover:bg-brand-600"
                >
                  <Plus size={13} /> Add Task
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Critical Guest Notes & Incident Log */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-4">
            <div className="flex items-center justify-between border-b border-brand-800/60 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-50">
                  Critical Guest Notes & Incidents
                </h3>
              </div>
              <span className="text-xs text-brand-200/50">{guestNotes.length} notes logged</span>
            </div>

            <div className="mt-3 space-y-2">
              {guestNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "rounded-lg border p-3 text-xs",
                    note.severity === "urgent"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                      : note.severity === "attention"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                      : "border-brand-800/60 bg-brand-950/60 text-brand-100"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-50">
                      {note.guestName} · Room {note.roomNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          note.severity === "urgent"
                            ? "bg-rose-500/30 text-rose-300"
                            : note.severity === "attention"
                            ? "bg-amber-500/30 text-amber-300"
                            : "bg-brand-700/50 text-brand-300"
                        )}
                      >
                        {note.severity}
                      </span>
                      {!isReview && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGuestNote(note.id)}
                          className="text-brand-400 hover:text-rose-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs">{note.note}</p>
                  {note.actionRequired && (
                    <p className="mt-1 font-mono text-[11px] text-amber-300">
                      ⚡ Action: {note.actionRequired}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!isReview && (
              <div className="mt-3 grid grid-cols-1 gap-2 pt-2 border-t border-brand-800/40 sm:grid-cols-4">
                <input
                  type="text"
                  placeholder="Guest Name"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-50 placeholder:text-brand-200/40 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Room #"
                  value={newGuestRoom}
                  onChange={(e) => setNewGuestRoom(e.target.value)}
                  className="rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-50 placeholder:text-brand-200/40 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Critical observation, VIP preference, or incident"
                  value={newGuestNote}
                  onChange={(e) => setNewGuestNote(e.target.value)}
                  className="rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-50 placeholder:text-brand-200/40 focus:outline-none"
                />
                <div className="flex gap-2">
                  <select
                    value={newGuestSeverity}
                    onChange={(e) => setNewGuestSeverity(e.target.value as any)}
                    className="flex-1 rounded-lg border border-brand-700 bg-brand-900 px-2 py-1.5 text-xs text-brand-50 focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="attention">Attention</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddGuestNote}
                    className="flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-brand-50 hover:bg-brand-600"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Handover Summary & PIN Authorization */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-200/80">
              Shift Summary & General Observations
            </label>
            <textarea
              disabled={isReview}
              rows={2}
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-brand-700 bg-brand-950 p-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
            />

            {/* Dual Security PIN Signatures */}
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-brand-800/60 bg-brand-950/80 p-3 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-200">
                  <Lock size={13} className="text-gold-400" /> Departing Staff Authorization
                </div>
                <p className="mt-0.5 text-[11px] text-brand-200/50">
                  {departingStaff} (Releasing Custody)
                </p>
                {!isReview ? (
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={departingPin}
                    onChange={(e) => setDepartingPin(e.target.value)}
                    className="mt-2 w-full rounded border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs font-mono text-brand-50 tracking-widest"
                  />
                ) : (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={14} /> PIN Verified & Digitally Signed
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-200">
                  <Lock size={13} className="text-emerald-400" /> Incoming Staff Acknowledgment
                </div>
                <p className="mt-0.5 text-[11px] text-brand-200/50">
                  {incomingStaff} (Assuming Cash & Shift Custody)
                </p>
                {isReview ? (
                  existingRecord.status === "acknowledged" ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 size={14} /> Acknowledged by {existingRecord.incomingStaffName}
                    </div>
                  ) : (
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN to Acknowledge"
                      value={incomingPin}
                      onChange={(e) => setIncomingPin(e.target.value)}
                      className="mt-2 w-full rounded border border-emerald-500/40 bg-brand-900 px-3 py-1.5 text-xs font-mono text-brand-50 tracking-widest"
                    />
                  )
                ) : (
                  <p className="mt-2 text-xs italic text-brand-200/40">
                    Will be verified upon handover receipt by incoming staff.
                  </p>
                )}
              </div>
            </div>

            {pinError && (
              <p className="mt-2 text-xs font-medium text-rose-400">{pinError}</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-brand-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-700 px-4 py-2 text-xs text-brand-200 hover:bg-brand-800"
            >
              Close
            </button>
            {!isReview ? (
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors"
              >
                <FileCheck2 size={14} /> Submit & Authorize Handover
              </button>
            ) : existingRecord?.status !== "acknowledged" ? (
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                <UserCheck size={14} /> Acknowledge & Take Custody
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
