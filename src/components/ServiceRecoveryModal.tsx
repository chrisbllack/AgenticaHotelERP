import { useState } from "react";
import { usePlatform } from "../store/platform";
import type { ServiceRecoveryTicket } from "../types";
import { CheckCircle2, HeartHandshake, X } from "lucide-react";
import { cn } from "../lib/utils";

interface ServiceRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ServiceRecoveryTicket;
}

export default function ServiceRecoveryModal({
  isOpen,
  onClose,
  ticket,
}: ServiceRecoveryModalProps) {
  const { updateRecoveryTicket } = usePlatform();

  const [status, setStatus] = useState<ServiceRecoveryTicket["status"]>(ticket.status);
  const [assignedManager, setAssignedManager] = useState(ticket.assignedManager);
  const [compensation, setCompensation] = useState(ticket.compensationOffered || "2,500 Bonus Loyalty Points + Complimentary Breakfast on next visit");
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRecoveryTicket(ticket.id, {
      status,
      assignedManager,
      compensationOffered: compensation,
      resolutionNotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-brand-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              <HeartHandshake size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg text-brand-50">
                Service Recovery Ticket #{ticket.id}
              </h2>
              <p className="text-xs text-brand-200/60">
                Automated guest satisfaction resolution workflow
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-800 hover:text-brand-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Guest & Complaint Overview */}
          <div className="rounded-xl border border-brand-800/70 bg-brand-900/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-brand-50">
                {ticket.guestName} · Room {ticket.roomNumber}
              </span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                  ticket.priority === "urgent" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                )}
              >
                {ticket.priority} priority
              </span>
            </div>

            <div className="text-brand-200/70 flex gap-4">
              <span>Phone: <strong className="text-brand-100">{ticket.guestPhone}</strong></span>
              <span>Dept: <strong className="text-brand-100">{ticket.department}</strong></span>
            </div>

            <div className="mt-2 rounded bg-brand-950/80 p-2.5 border border-brand-800/50">
              <span className="font-semibold text-rose-300 block mb-1">Issue Reported:</span>
              <p className="text-brand-100/90">{ticket.issueSummary}</p>
            </div>
          </div>

          {/* Workflow Status */}
          <div>
            <label className="block text-xs font-semibold text-brand-200/70">Recovery Workflow Stage</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {(["open", "contacted", "compensation_offered", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={cn(
                    "rounded-lg border p-2 text-center text-[11px] font-semibold capitalize transition-colors",
                    status === st
                      ? "border-gold-500 bg-gold-500/20 text-gold-300"
                      : "border-brand-800 bg-brand-900 text-brand-200 hover:border-brand-700"
                  )}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-200/70">Assigned Duty Manager</label>
            <input
              type="text"
              value={assignedManager}
              onChange={(e) => setAssignedManager(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-brand-50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-200/70">
              Compensation & Goodwill Package Offered
            </label>
            <input
              type="text"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              placeholder="e.g. 2,000 Loyalty Points, Dinner voucher, Free airport drop"
              className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-brand-50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-200/70">
              Manager Follow-up Notes & Resolution Outcome
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Record details of conversation with guest, their response, and preventative measures implemented with department head..."
              className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-950 p-2 text-brand-50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-brand-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-700 px-4 py-2 text-brand-200 hover:bg-brand-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <CheckCircle2 size={14} /> Update Ticket Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
