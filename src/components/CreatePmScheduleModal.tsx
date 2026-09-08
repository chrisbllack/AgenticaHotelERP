import { useState } from "react";
import { usePlatform } from "../store/platform";
import type { EquipmentType, RecurringFrequency } from "../types";
import { Calendar, HardHat, Plus, Trash2, X } from "lucide-react";

interface CreatePmScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePmScheduleModal({ isOpen, onClose }: CreatePmScheduleModalProps) {
  const { createPmSchedule, businessDate } = usePlatform();

  const [title, setTitle] = useState("");
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("hvac");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [targetLocations, setTargetLocations] = useState("Rooms 001 - 050");
  const [assignedEngineer, setAssignedEngineer] = useState("Engr. Emeka Okonkwo");
  const [estimatedDuration, setEstimatedDuration] = useState(45);
  const [nextDueDate, setNextDueDate] = useState(businessDate || "2026-09-15");

  // Checklist items
  const [checklistItems, setChecklistItems] = useState([
    { id: "c-1", task: "Inspect air filters and chemically clean if restricted", expectedReading: "Airflow > 450 CFM" },
    { id: "c-2", task: "Check refrigerant suction pressure and coil temperature", expectedReading: "65-75 PSI" },
    { id: "c-3", task: "Verify digital thermostat communication and fan speeds", expectedReading: "Accurate ±0.5°C" },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskReading, setNewTaskReading] = useState("");

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!newTaskText.trim()) return;
    setChecklistItems([
      ...checklistItems,
      {
        id: `c-${Date.now()}`,
        task: newTaskText.trim(),
        expectedReading: newTaskReading.trim() || undefined,
      },
    ]);
    setNewTaskText("");
    setNewTaskReading("");
  };

  const handleDeleteItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createPmSchedule({
      title: title.trim(),
      equipmentType,
      frequency,
      targetLocations: targetLocations.split(",").map((s) => s.trim()),
      assignedEngineer,
      estimatedDurationMinutes: estimatedDuration,
      checklist: checklistItems,
      nextDueDate,
      status: "active",
      compliancePercentage: 100,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-brand-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
              <HardHat size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg text-brand-50">Create Preventative Maintenance Schedule</h2>
              <p className="text-xs text-brand-200/60">Set automated recurring inspection tasks for room equipment</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-800 hover:text-brand-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-200/70">Schedule Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly In-Room VRF Air Conditioning Servicing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Equipment Category</label>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              >
                <option value="hvac">HVAC & Climate Control</option>
                <option value="door_lock">RFID Smart Door Locks</option>
                <option value="plumbing">Plumbing & Boilers</option>
                <option value="fire_safety">Fire Safety & Alarms</option>
                <option value="generator">Generators & ATS Power</option>
                <option value="elevator">Elevators & Lifts</option>
                <option value="electrical">Electrical Switchgear</option>
                <option value="tv_av">In-Room TV & Media</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Recurring Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="bi_weekly">Bi-Weekly (14 Days)</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (90 Days)</option>
                <option value="semi_annual">Semi-Annual (180 Days)</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Target Rooms / Zones</label>
              <input
                type="text"
                placeholder="e.g. Room 001 - 050, Executive Suites"
                value={targetLocations}
                onChange={(e) => setTargetLocations(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Lead Engineer / Contractor</label>
              <input
                type="text"
                value={assignedEngineer}
                onChange={(e) => setAssignedEngineer(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Est. Duration (Minutes)</label>
              <input
                type="number"
                min={10}
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 30)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-200/70">First / Next Due Date</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Checklist definition */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-3.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-200/80">
              Inspection Checkpoints & Standard Targets
            </label>
            <div className="mt-2.5 space-y-2">
              {checklistItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-brand-800/60 bg-brand-950/60 p-2 text-xs"
                >
                  <span className="text-brand-100">
                    <span className="font-mono text-gold-400 mr-2">{idx + 1}.</span>
                    {item.task}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.expectedReading && (
                      <span className="font-mono text-[11px] text-emerald-400">
                        {item.expectedReading}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-brand-400 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Checkpoint description (e.g. Inspect condenser coils)"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-1 rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-50 placeholder:text-brand-200/40 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Target Reading (optional)"
                value={newTaskReading}
                onChange={(e) => setNewTaskReading(e.target.value)}
                className="w-40 rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-50 placeholder:text-brand-200/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-brand-50 hover:bg-brand-600"
              >
                <Plus size={13} /> Add
              </button>
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
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors"
            >
              <Calendar size={14} /> Schedule Recurring PM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
