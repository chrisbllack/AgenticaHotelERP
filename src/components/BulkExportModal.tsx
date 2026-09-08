import { useState, useRef } from "react";
import { Download, FileSpreadsheet, FileText, Printer, X, Check } from "lucide-react";
import { cn } from "../lib/utils";

export interface ExportableTask {
  id: string;
  roomNumber: string;
  taskType: string;
  priority: string;
  status: string;
  assignedTo?: string;
  dueDate?: string;
  details?: string;
  creditsOrEstimatedHours?: string | number;
}

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  moduleName: "Housekeeping" | "Maintenance";
  businessDate: string;
  tasks: ExportableTask[];
}

export default function BulkExportModal({
  isOpen,
  onClose,
  title,
  moduleName,
  businessDate,
  tasks,
}: BulkExportModalProps) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [filterPendingOnly, setFilterPendingOnly] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const filteredTasks = filterPendingOnly
    ? tasks.filter((t) => t.status === "pending" || t.status === "open" || t.status === "overdue" || t.status === "active")
    : tasks;

  const handleDownloadCsv = () => {
    const headers = [
      "Task ID",
      "Room Number",
      "Task / Inspection",
      "Priority",
      "Status",
      "Assigned Attendant / Engineer",
      "Due Date",
      "Credits / Par Hours",
      "Inspection Notes",
    ];

    const rows = filteredTasks.map((t) => [
      `"${t.id}"`,
      `"${t.roomNumber}"`,
      `"${t.taskType.replace(/"/g, '""')}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${(t.assignedTo || "Unassigned").replace(/"/g, '""')}"`,
      `"${t.dueDate || businessDate}"`,
      `"${t.creditsOrEstimatedHours ?? "N/A"}"`,
      `"${(t.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `INFINEON_${moduleName}_Shift_Briefing_${businessDate.replace(/-/g, "")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-brand-800 bg-brand-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-800/80 pb-4">
          <div>
            <h3 className="text-base font-semibold text-brand-50">{title}</h3>
            <p className="text-xs text-brand-200/60">
              Bulk export {moduleName} scheduled work orders & inspection tasks for offline shift briefing ({businessDate})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-200/60 hover:bg-brand-900 hover:text-brand-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-brand-800/60 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all",
                format === "csv"
                  ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                  : "border border-brand-800 text-brand-200/70 hover:bg-brand-900"
              )}
            >
              <FileSpreadsheet size={15} />
              <span>CSV Spreadsheet</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("pdf")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all",
                format === "pdf"
                  ? "border border-sky-500/50 bg-sky-500/20 text-sky-200"
                  : "border border-brand-800 text-brand-200/70 hover:bg-brand-900"
              )}
            >
              <FileText size={15} />
              <span>Printable PDF Briefing Sheet</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-brand-200/80 cursor-pointer">
            <input
              type="checkbox"
              checked={filterPendingOnly}
              onChange={(e) => setFilterPendingOnly(e.target.checked)}
              className="rounded border-brand-700 bg-brand-900 text-gold-500 focus:ring-gold-400"
            />
            <span>Export Pending & Active Only ({filteredTasks.length} tasks)</span>
          </label>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {format === "csv" ? (
            <div className="rounded-lg border border-brand-800/80 bg-brand-900/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-brand-200/80">
                  Ready to compile {filteredTasks.length} task records into RFC-4180 compliant CSV.
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Spreadsheet Par
                </span>
              </div>
              <div className="max-h-60 overflow-x-auto rounded border border-brand-800/60 bg-brand-950 font-mono text-[11px] p-2 text-brand-200/70 space-y-1">
                <p className="text-emerald-400 font-semibold">
                  Task ID,Room Number,Task / Inspection,Priority,Status,Assigned Attendant / Engineer,Due Date
                </p>
                {filteredTasks.slice(0, 5).map((t) => (
                  <p key={t.id} className="truncate">
                    {t.id},{t.roomNumber},{t.taskType},{t.priority},{t.status},{t.assignedTo || "Unassigned"},{t.dueDate || businessDate}
                  </p>
                ))}
                {filteredTasks.length > 5 && (
                  <p className="text-brand-200/40 italic">... and {filteredTasks.length - 5} more rows.</p>
                )}
              </div>
            </div>
          ) : (
            /* Printable PDF Briefing Sheet Preview */
            <div
              ref={printRef}
              className="rounded-lg border border-brand-800/80 bg-white p-6 text-brand-950 shadow-inner"
            >
              {/* Hotel Header */}
              <div className="flex items-start justify-between border-b-2 border-brand-900 pb-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-brand-950">
                    GRAND PALM HOTEL LAGOS
                  </h2>
                  <p className="text-xs text-stone-600 font-medium uppercase tracking-wider">
                    {moduleName.toUpperCase()} DEPARTMENT · DAILY SHIFT BRIEFING & INSPECTION ROSTER
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-brand-900">Date: {businessDate}</p>
                  <p className="text-stone-500">Shift: Morning / Day</p>
                  <p className="text-stone-500 font-mono">Tasks: {filteredTasks.length}</p>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="my-3 grid grid-cols-4 gap-2 border border-stone-200 bg-stone-50 p-2 text-xs">
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Total Scheduled</span>
                  <span className="font-bold text-sm text-stone-900">{filteredTasks.length}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Urgent / High</span>
                  <span className="font-bold text-sm text-rose-700">
                    {filteredTasks.filter((t) => t.priority === "urgent" || t.priority === "high").length}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Supervisor On Duty</span>
                  <span className="font-semibold text-stone-800">Ibrahim Sani</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Briefing Status</span>
                  <span className="font-semibold text-emerald-700">Active Handout</span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs border-collapse border border-stone-300">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 text-[10px] uppercase font-bold">
                    <th className="p-1.5 border-r border-stone-300">Room</th>
                    <th className="p-1.5 border-r border-stone-300">Task / Work Description</th>
                    <th className="p-1.5 border-r border-stone-300">Priority</th>
                    <th className="p-1.5 border-r border-stone-300">Assigned To</th>
                    <th className="p-1.5 border-r border-stone-300">Credits / Par</th>
                    <th className="p-1.5">Sign-off Checklist</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t, idx) => (
                    <tr key={t.id} className={idx % 2 === 0 ? "bg-white" : "bg-stone-50/70"}>
                      <td className="p-1.5 border-t border-r border-stone-300 font-bold font-mono">
                        {t.roomNumber}
                      </td>
                      <td className="p-1.5 border-t border-r border-stone-300 font-medium">
                        {t.taskType}
                        {t.details && <span className="block text-[10px] text-stone-500">{t.details}</span>}
                      </td>
                      <td className="p-1.5 border-t border-r border-stone-300 capitalize font-semibold">
                        <span
                          className={
                            t.priority === "urgent"
                              ? "text-rose-700"
                              : t.priority === "high"
                                ? "text-amber-700"
                                : "text-stone-700"
                          }
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-1.5 border-t border-r border-stone-300">
                        {t.assignedTo || "Unassigned"}
                      </td>
                      <td className="p-1.5 border-t border-r border-stone-300 font-mono text-[10px]">
                        {t.creditsOrEstimatedHours ?? 2}
                      </td>
                      <td className="p-1.5 border-t border-stone-300 text-stone-400 font-mono text-[10px]">
                        [ ] Cleaned &nbsp; [ ] Inspected
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sign-off footer */}
              <div className="mt-4 pt-4 border-t border-stone-300 grid grid-cols-2 gap-6 text-[11px] text-stone-600">
                <div className="border-b border-stone-400 pb-1">
                  <span>Shift Supervisor Signature: _______________________</span>
                </div>
                <div className="border-b border-stone-400 pb-1">
                  <span>Duty Manager Release Sign-off: _______________________</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-brand-800/80 pt-4">
          <span className="text-xs text-brand-200/60 font-mono">
            {filteredTasks.length} task records selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-800 px-3.5 py-1.5 text-xs text-brand-200/80 hover:bg-brand-900"
            >
              Close
            </button>
            {format === "csv" ? (
              <button
                type="button"
                onClick={handleDownloadCsv}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition-all",
                  downloadSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-500 text-brand-950 hover:bg-emerald-400"
                )}
              >
                {downloadSuccess ? (
                  <>
                    <Check size={14} /> Downloaded!
                  </>
                ) : (
                  <>
                    <Download size={14} /> Download CSV (.csv)
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-400 shadow-sm"
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
