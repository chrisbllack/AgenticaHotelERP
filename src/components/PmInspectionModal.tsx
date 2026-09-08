import { useState } from "react";
import { usePlatform } from "../store/platform";
import type { PreventativeMaintenanceSchedule } from "../types";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Gauge,
  HardHat,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";

interface PmInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: PreventativeMaintenanceSchedule;
}

export default function PmInspectionModal({
  isOpen,
  onClose,
  schedule,
}: PmInspectionModalProps) {
  const { logPmInspection } = usePlatform();

  const [technicianName, setTechnicianName] = useState("Engr. Emeka Okonkwo (Chief Engineer)");
  const [inspectedTarget, setInspectedTarget] = useState(schedule.targetLocations[0] || "Room 101");
  const [result, setResult] = useState<"passed" | "passed_minor_issues" | "failed_repair_needed">("passed");
  const [notes, setNotes] = useState("");

  // Checklist items completion state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    schedule.checklist.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
  );

  // Measured readings state
  const [readings, setReadings] = useState<Record<string, string>>({
    "r-1": "8.5°C",
    "r-2": "4.2 bar",
    "r-3": "13.8 VDC",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedReadings = Object.entries(readings).map(([key, val]) => {
      const match = schedule.checklist.find((c) => c.id === key);
      return {
        label: match?.task || "Measurement",
        target: match?.expectedReading || "Nominal",
        actual: val,
      };
    });

    logPmInspection({
      scheduleId: schedule.id,
      scheduleTitle: schedule.title,
      equipmentType: schedule.equipmentType,
      inspectedTarget,
      technicianName,
      result,
      measuredReadings: formattedReadings,
      findingsAndRepairs: notes || (result === "passed" ? "All inspection parameters within operating tolerance." : "Defect observed, corrective repair initiated."),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-brand-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <HardHat size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg text-brand-50">
                  Log PM Inspection · {schedule.scheduleCode}
                </h2>
                <p className="text-xs text-brand-200/60">{schedule.title}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-800 hover:text-brand-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-brand-800/60 bg-brand-900/30 p-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">
                Technician / Inspector
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">
                Inspected Room / Unit / Location
              </label>
              <select
                value={inspectedTarget}
                onChange={(e) => setInspectedTarget(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              >
                {schedule.targetLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist & Physical Readings */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-50">
              <Gauge size={14} className="text-gold-400" />
              Standard Equipment Checklist & Diagnostic Readings
            </h3>
            <div className="mt-3 space-y-2.5">
              {schedule.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-800/60 bg-brand-950/60 p-2.5 text-xs"
                >
                  <label className="flex items-center gap-2 text-brand-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={(e) =>
                        setCheckedItems({ ...checkedItems, [item.id]: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-brand-700 bg-brand-900 text-emerald-500"
                    />
                    <span>{item.task}</span>
                  </label>

                  {item.expectedReading && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-brand-200/50">
                        Target: {item.expectedReading}
                      </span>
                      <input
                        type="text"
                        placeholder="Measured"
                        value={readings[item.id] || ""}
                        onChange={(e) =>
                          setReadings({ ...readings, [item.id]: e.target.value })
                        }
                        className="w-24 rounded border border-brand-700 bg-brand-900 px-2 py-0.5 text-right font-mono text-xs text-emerald-400"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inspection Outcome */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-4 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-200/80">
              Final Inspection Outcome
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setResult("passed")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-colors",
                  result === "passed"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-brand-800 bg-brand-950 text-brand-200 hover:border-brand-700"
                )}
              >
                <CheckCircle2 size={14} /> 100% Passed
              </button>
              <button
                type="button"
                onClick={() => setResult("passed_minor_issues")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-colors",
                  result === "passed_minor_issues"
                    ? "border-amber-500 bg-amber-500/20 text-amber-300"
                    : "border-brand-800 bg-brand-950 text-brand-200 hover:border-brand-700"
                )}
              >
                <Clock size={14} /> Passed w/ Minor Note
              </button>
              <button
                type="button"
                onClick={() => setResult("failed_repair_needed")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-colors",
                  result === "failed_repair_needed"
                    ? "border-rose-500 bg-rose-500/20 text-rose-300"
                    : "border-brand-800 bg-brand-950 text-brand-200 hover:border-brand-700"
                )}
              >
                <AlertTriangle size={14} /> Failed / Needs Repair
              </button>
            </div>

            {result === "failed_repair_needed" && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                <p className="font-semibold">⚠️ Corrective Work Order Trigger</p>
                <p className="mt-1 text-[11px] text-rose-200/80">
                  Submitting this failed inspection will automatically spawn an urgent Work Order in the engineering queue for {inspectedTarget}.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs text-brand-200/70">
                Engineering Observations / Corrective Actions:
              </label>
              <textarea
                rows={2}
                placeholder="Detail any filter cleanings, refrigerant top-ups, battery replacements, or defective parts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-950 p-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-brand-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-700 px-4 py-2 text-xs text-brand-200 hover:bg-brand-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <FileCheck2 size={14} /> Save Inspection & Update Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
