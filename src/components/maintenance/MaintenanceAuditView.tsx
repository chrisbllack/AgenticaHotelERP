import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  Badge,
  Table,
  Td,
  StatCard,
  EmptyState,
} from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { MaintenanceAuditRecord, ReplacedPart } from "../../types";
import {
  Wrench,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  X,
  Package,
} from "lucide-react";

let auditCounter = 600;

export function MaintenanceAuditView() {
  const {
    maintenanceAuditRecords,
    addMaintenanceAuditRecord,
    verifyMaintenanceAuditRecord,
    businessDate,
  } = usePlatform();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceAuditRecord | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [recordToSignOff, setRecordToSignOff] = useState<MaintenanceAuditRecord | null>(null);
  const [supervisorNameInput, setSupervisorNameInput] = useState("Chief Engineer Emmanuel Okonkwo");
  const [supervisorNotesInput, setSupervisorNotesInput] = useState("");

  // KPI calculations
  const metrics = useMemo(() => {
    const totalRepairs = maintenanceAuditRecords.length;
    const totalLaborHours = maintenanceAuditRecords.reduce(
      (acc, r) => acc + (r.laborHoursLogged || 0),
      0
    );
    const totalPartsCost = maintenanceAuditRecords.reduce(
      (acc, r) => acc + (r.totalPartsCost || 0),
      0
    );
    const totalPartsReplaced = maintenanceAuditRecords.reduce(
      (acc, r) => acc + (r.partsReplaced?.reduce((pAcc, p) => pAcc + p.quantity, 0) || 0),
      0
    );
    const avgDuration =
      totalRepairs > 0
        ? Math.round(
            maintenanceAuditRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0) /
              totalRepairs
          )
        : 0;
    const verifiedCount = maintenanceAuditRecords.filter(
      (r) => r.status === "verified" || r.supervisorApprovalStatus === "verified_passed"
    ).length;
    const verifiedRate = totalRepairs > 0 ? Math.round((verifiedCount / totalRepairs) * 100) : 0;

    return {
      totalRepairs,
      totalLaborHours,
      totalPartsCost,
      totalPartsReplaced,
      avgDuration,
      verifiedCount,
      verifiedRate,
    };
  }, [maintenanceAuditRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return maintenanceAuditRecords.filter((rec) => {
      const matchesSearch =
        rec.repairTicketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.leadTechnicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || rec.assetCategory === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || rec.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [maintenanceAuditRecords, searchTerm, categoryFilter, statusFilter]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(maintenanceAuditRecords.map((r) => r.assetCategory));
    return Array.from(set);
  }, [maintenanceAuditRecords]);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordToSignOff) return;
    verifyMaintenanceAuditRecord(recordToSignOff.id, supervisorNameInput, supervisorNotesInput);
    setIsSignOffModalOpen(false);
    setRecordToSignOff(null);
    setSupervisorNotesInput("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Audited Repairs"
          value={String(metrics.totalRepairs)}
          change={`${metrics.verifiedRate}% Quality Verified`}
          trend="up"
        />
        <StatCard
          label="Technician Labor Hours"
          value={`${metrics.totalLaborHours} hrs`}
          change={`Avg ${metrics.avgDuration} mins / task`}
          trend="neutral"
        />
        <StatCard
          label="Replaced Parts Value"
          value={naira(metrics.totalPartsCost)}
          change={`${metrics.totalPartsReplaced} components installed`}
          trend="neutral"
        />
        <StatCard
          label="Supervisor Sign-Offs"
          value={`${metrics.verifiedCount} / ${metrics.totalRepairs}`}
          change="Asset accountability active"
          trend="up"
        />
      </div>

      {/* Action and Filter Bar */}
      <Card>
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300/60"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket code, asset name, tag, or technician..."
                className="w-full rounded-lg border border-brand-800 bg-brand-950/80 py-2 pl-9 pr-3 text-xs text-brand-100 placeholder-brand-200/40 focus:border-gold-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-brand-200/70">
              <Filter size={13} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by asset category"
                className="rounded-lg border border-brand-800 bg-brand-950/80 px-2.5 py-1.5 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              >
                <option value="all">All Asset Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by repair status"
                className="rounded-lg border border-brand-800 bg-brand-950/80 px-2.5 py-1.5 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              >
                <option value="all">All Audit Statuses</option>
                <option value="verified">Verified Passed</option>
                <option value="completed">Completed (Pending Verification)</option>
                <option value="rework_required">Rework Required</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 shadow-md transition hover:bg-gold-400"
          >
            <Plus size={14} /> Log Maintenance Repair
          </button>
        </div>
      </Card>

      {/* Audit Trail Records Table */}
      <Card>
        <CardHeader
          title="Maintenance & Repair Historical Audit Trail"
          subtitle="Detailed ledger of asset repairs, technician work logs, components replaced, and time tracking"
        />
        {filteredRecords.length === 0 ? (
          <EmptyState
            title="No Maintenance Audit Records Found"
            description="No repair records match your filter criteria or search keyword."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table
              head={[
                "Ticket & Asset",
                "Category / Location",
                "Technician Involved",
                "Time Taken & Labor",
                "Parts Replaced",
                "Total Cost",
                "Quality Sign-Off",
                "Action",
              ]}
            >
              {filteredRecords.map((rec) => {
                const partsCount = rec.partsReplaced?.length || 0;
                const isVerified =
                  rec.status === "verified" ||
                  rec.supervisorApprovalStatus === "verified_passed";

                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-brand-900/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedRecord(rec)}
                  >
                    {/* Ticket & Asset */}
                    <Td>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-gold-400">
                            {rec.repairTicketCode}
                          </span>
                          <span className="text-[10px] text-brand-200/50">
                            ({rec.assetTag})
                          </span>
                        </div>
                        <p className="font-medium text-brand-50 text-xs mt-0.5">
                          {rec.assetName}
                        </p>
                        <span className="text-[10px] text-brand-200/60">
                          {rec.repairDate}
                        </span>
                      </div>
                    </Td>

                    {/* Category / Location */}
                    <Td>
                      <div>
                        <span className="inline-block rounded border border-brand-700/60 bg-brand-800/40 px-2 py-0.5 text-[10px] font-medium text-brand-200">
                          {rec.assetCategory}
                        </span>
                        <p className="text-[11px] text-brand-200/80 mt-1">
                          📍 {rec.location}
                        </p>
                      </div>
                    </Td>

                    {/* Technician Involved */}
                    <Td>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-700/80 text-[10px] font-bold text-brand-100">
                            {rec.leadTechnicianName.charAt(0)}
                          </span>
                          <span className="font-medium text-brand-100 text-xs">
                            {rec.leadTechnicianName}
                          </span>
                        </div>
                        <span className="text-[10px] text-brand-200/60 ml-6 block">
                          ID: {rec.leadTechnicianId}
                          {rec.assistantTechnicians && rec.assistantTechnicians.length > 0 && (
                            <span className="text-gold-400/80 ml-1">
                              (+{rec.assistantTechnicians.length} assistants)
                            </span>
                          )}
                        </span>
                      </div>
                    </Td>

                    {/* Time Taken */}
                    <Td>
                      <div className="text-xs">
                        <div className="flex items-center gap-1 font-mono font-semibold text-brand-100">
                          <Clock size={12} className="text-cyan-400" />
                          <span>{rec.durationMinutes} mins</span>
                        </div>
                        <p className="text-[11px] text-brand-200/60 mt-0.5">
                          {rec.laborHoursLogged} billed hrs
                        </p>
                      </div>
                    </Td>

                    {/* Parts Replaced */}
                    <Td>
                      <div>
                        {partsCount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-500/30">
                              <Package size={11} /> {partsCount} {partsCount === 1 ? "part" : "parts"}
                            </span>
                            <p className="text-[10px] text-brand-200/60 line-clamp-1 max-w-[140px]">
                              {rec.partsReplaced?.map((p) => p.partName).join(", ")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-brand-200/40 italic">
                            Labor only (no parts)
                          </span>
                        )}
                      </div>
                    </Td>

                    {/* Total Cost */}
                    <Td>
                      <div className="text-xs">
                        <span className="font-mono font-semibold text-emerald-400">
                          {naira(rec.totalCost)}
                        </span>
                        {rec.totalPartsCost > 0 && (
                          <p className="text-[10px] text-brand-200/50">
                            Parts: {naira(rec.totalPartsCost)}
                          </p>
                        )}
                      </div>
                    </Td>

                    {/* Supervisor Sign-Off */}
                    <Td>
                      <div>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                            <ShieldCheck size={11} /> Verified Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                            <AlertTriangle size={11} /> Pending Sign-Off
                          </span>
                        )}
                        {rec.supervisorName && (
                          <p className="text-[10px] text-brand-200/60 mt-0.5">
                            By {rec.supervisorName.split(" ")[0]}
                          </p>
                        )}
                      </div>
                    </Td>

                    {/* Action */}
                    <Td>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="rounded bg-brand-800/80 px-2.5 py-1 text-[11px] text-brand-100 hover:bg-brand-700"
                        >
                          Details
                        </button>
                        {!isVerified && (
                          <button
                            onClick={() => {
                              setRecordToSignOff(rec);
                              setIsSignOffModalOpen(true);
                            }}
                            className="rounded bg-emerald-500/20 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
                          >
                            Sign Off
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          </div>
        )}
      </Card>

      {/* DETAIL MODAL / DRAWER */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-brand-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-gold-400">
                    {selectedRecord.repairTicketCode}
                  </span>
                  <Badge className="border-brand-700 bg-brand-800/50 text-brand-200">
                    {selectedRecord.assetCategory}
                  </Badge>
                  {selectedRecord.status === "verified" ? (
                    <Badge className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
                      <ShieldCheck size={11} /> Verified Quality Passed
                    </Badge>
                  ) : (
                    <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-300">
                      Pending Supervisor Sign-Off
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold text-brand-50 mt-1">
                  {selectedRecord.assetName}
                </h3>
                <p className="text-xs text-brand-200/60">
                  Tag: {selectedRecord.assetTag} · Location: {selectedRecord.location} · Repaired on: {selectedRecord.repairDate}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-brand-300 hover:bg-brand-800 hover:text-brand-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Technician & Accountability Card */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-lg border border-brand-800 bg-brand-900/40 p-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-200/50">
                  Lead Technician
                </span>
                <p className="font-bold text-sm text-brand-50 mt-0.5">
                  {selectedRecord.leadTechnicianName}
                </p>
                <p className="text-xs text-brand-200/60">
                  Staff ID: {selectedRecord.leadTechnicianId}
                </p>
                {selectedRecord.assistantTechnicians && selectedRecord.assistantTechnicians.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] text-brand-200/50 uppercase">Assistants:</span>
                    <p className="text-xs text-brand-200">
                      {selectedRecord.assistantTechnicians.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-200/50">
                  Time Tracking & Labor
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-base font-bold text-cyan-400">
                    {selectedRecord.durationMinutes} mins
                  </span>
                  <span className="text-xs text-brand-200/60">
                    ({selectedRecord.laborHoursLogged} billed hrs)
                  </span>
                </div>
                <p className="text-[11px] text-brand-200/60 mt-1">
                  Start: {selectedRecord.startedAt} <br />
                  Finished: {selectedRecord.completedAt}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-200/50">
                  Total Financial Impact
                </span>
                <p className="font-mono text-base font-bold text-emerald-400 mt-0.5">
                  {naira(selectedRecord.totalCost)}
                </p>
                <p className="text-[11px] text-brand-200/60">
                  Labor: {naira(selectedRecord.totalLaborCost)} <br />
                  Parts: {naira(selectedRecord.totalPartsCost)}
                </p>
              </div>
            </div>

            {/* Problem & Action Taken */}
            <div className="space-y-3">
              <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3">
                <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Reported Problem & Initial Diagnosis
                </span>
                <p className="text-xs text-brand-100 mt-1.5 leading-relaxed">
                  {selectedRecord.problemDescription}
                </p>
                <div className="mt-2 text-[11px] text-rose-200/80">
                  <span className="font-semibold text-rose-300">Root Cause: </span>
                  {selectedRecord.rootCauseAnalysis}
                </div>
              </div>

              <div className="rounded-lg border border-brand-800 bg-brand-900/30 p-3">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Wrench size={13} /> Action Taken & Corrective Work Executed
                </span>
                <p className="text-xs text-brand-100 mt-1.5 leading-relaxed">
                  {selectedRecord.actionTaken}
                </p>
                {selectedRecord.preventionRecommendation && (
                  <div className="mt-2 text-[11px] text-brand-200/80 border-t border-brand-800/60 pt-2">
                    <span className="font-semibold text-gold-400">Preventative Measure: </span>
                    {selectedRecord.preventionRecommendation}
                  </div>
                )}
              </div>
            </div>

            {/* Replaced Parts Ledger */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-200/70 flex items-center gap-1.5">
                  <Package size={14} className="text-amber-400" /> Replaced Parts & Components Ledger
                </h4>
                <span className="text-xs text-brand-200/50">
                  Total Parts: {selectedRecord.partsReplaced?.length || 0}
                </span>
              </div>

              {selectedRecord.partsReplaced && selectedRecord.partsReplaced.length > 0 ? (
                <div className="rounded-lg border border-brand-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-900/80 text-brand-200/70">
                      <tr>
                        <th className="p-2.5">Part Name</th>
                        <th className="p-2.5">Part / SKU #</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Cost</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5">Warranty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-800/60 bg-brand-950/40">
                      {selectedRecord.partsReplaced.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-medium text-brand-50">
                            {p.partName}
                            {p.serialNumber && (
                              <span className="block text-[10px] text-brand-200/40">
                                S/N: {p.serialNumber}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-brand-200/70">{p.partNumber}</td>
                          <td className="p-2.5 text-center font-mono">{p.quantity}</td>
                          <td className="p-2.5 text-right font-mono">{naira(p.unitCost)}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-emerald-400">
                            {naira(p.quantity * p.unitCost)}
                          </td>
                          <td className="p-2.5 text-brand-200/70 text-[11px]">
                            {p.warrantyMonths ? `${p.warrantyMonths} mos` : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-brand-800/60 bg-brand-950/40 p-3 text-center text-xs text-brand-200/50">
                  No replacement parts required for this service call. Work was purely labor/adjustment.
                </div>
              )}
            </div>

            {/* Quality & Supervisor Sign-off Stamp */}
            <div className="rounded-lg border border-gold-500/30 bg-gold-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-gold-400" />
                  <span className="font-semibold text-sm text-gold-300">
                    Quality Inspection & Supervisor Sign-Off
                  </span>
                </div>
                {selectedRecord.supervisorApprovalStatus === "verified_passed" ? (
                  <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                    VERIFIED & APPROVED
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setRecordToSignOff(selectedRecord);
                      setIsSignOffModalOpen(true);
                    }}
                    className="rounded bg-gold-500 px-3 py-1 text-xs font-semibold text-brand-950 hover:bg-gold-400"
                  >
                    Perform Physical Verification
                  </button>
                )}
              </div>

              {selectedRecord.supervisorName && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-brand-200/80 pt-2 border-t border-gold-500/20">
                  <div>
                    <span className="text-brand-200/50 block text-[10px] uppercase">
                      Supervisor / Chief Engineer:
                    </span>
                    <span className="font-semibold text-brand-100">
                      {selectedRecord.supervisorName}
                    </span>
                    <span className="block text-[11px] text-brand-200/60 mt-0.5">
                      Timestamp: {selectedRecord.supervisorSignOffDate || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-brand-200/50 block text-[10px] uppercase">
                      Supervisor Inspection Notes:
                    </span>
                    <p className="italic text-brand-100 mt-0.5">
                      "{selectedRecord.supervisorNotes || "Physical inspection passed. Asset returned to active service."}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-brand-800 px-4 py-2 text-xs font-semibold text-brand-100 hover:bg-brand-700"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPERVISOR SIGN-OFF MODAL */}
      {isSignOffModalOpen && recordToSignOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-gold-400" />
                <h3 className="font-bold text-sm text-brand-50">
                  Supervisor Quality Sign-Off
                </h3>
              </div>
              <button
                onClick={() => setIsSignOffModalOpen(false)}
                className="rounded-lg p-1 text-brand-300 hover:bg-brand-800 hover:text-brand-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-lg border border-brand-800 bg-brand-900/40 p-3 text-xs space-y-1">
              <p className="font-semibold text-brand-100">
                Ticket: {recordToSignOff.repairTicketCode} — {recordToSignOff.assetName}
              </p>
              <p className="text-brand-200/60">
                Technician: {recordToSignOff.leadTechnicianName} ({recordToSignOff.durationMinutes} mins)
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">
                  Supervisor / Chief Engineer Name
                </label>
                <input
                  type="text"
                  required
                  value={supervisorNameInput}
                  onChange={(e) => setSupervisorNameInput(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">
                  Verification &amp; Quality Audit Notes
                </label>
                <textarea
                  rows={3}
                  value={supervisorNotesInput}
                  onChange={(e) => setSupervisorNotesInput(e.target.value)}
                  placeholder="Confirm physical testing, safety clearance, and return to service..."
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 placeholder-brand-200/40 focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-300">
                ✓ By signing off, you verify that replaced components match specifications and work meets hotel engineering safety compliance.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignOffModalOpen(false)}
                  className="rounded-lg bg-brand-800 px-3 py-2 text-xs font-medium text-brand-200 hover:bg-brand-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-emerald-400"
                >
                  Confirm &amp; Stamp Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG REPAIR AUDIT MODAL */}
      {isLogModalOpen && (
        <CreateMaintenanceAuditModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          onSubmit={(newRecord) => {
            addMaintenanceAuditRecord(newRecord);
            setIsLogModalOpen(false);
          }}
          businessDate={businessDate}
        />
      )}
    </div>
  );
}

interface CreateAuditProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<MaintenanceAuditRecord, "id" | "repairTicketCode">) => void;
  businessDate: string;
}

function CreateMaintenanceAuditModal({ isOpen, onClose, onSubmit, businessDate }: CreateAuditProps) {
  const [assetName, setAssetName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [assetCategory, setAssetCategory] = useState("HVAC & Refrigeration");
  const [location, setLocation] = useState("Room 201");
  const [leadTechnicianName, setLeadTechnicianName] = useState("Babajide Balogun");
  const [leadTechnicianId, setLeadTechnicianId] = useState("TECH-ENG-04");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [laborHoursLogged, setLaborHoursLogged] = useState(0.75);
  const [problemDescription, setProblemDescription] = useState("");
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [preventionRecommendation, setPreventionRecommendation] = useState("");
  const [totalLaborCost, setTotalLaborCost] = useState(15000);

  // Dynamic Parts Replaced list
  const [parts, setParts] = useState<ReplacedPart[]>([]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartNumber, setNewPartNumber] = useState("");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartUnitCost, setNewPartUnitCost] = useState(0);

  const handleAddPart = () => {
    if (!newPartName) return;
    const part: ReplacedPart = {
      id: `p-${Date.now()}`,
      partName: newPartName,
      partNumber: newPartNumber || `SKU-${Date.now().toString().slice(-4)}`,
      quantity: Number(newPartQty) || 1,
      unitCost: Number(newPartUnitCost) || 0,
      totalCost: (Number(newPartQty) || 1) * (Number(newPartUnitCost) || 0),
      warrantyMonths: 12,
    };
    setParts((prev) => [...prev, part]);
    setNewPartName("");
    setNewPartNumber("");
    setNewPartQty(1);
    setNewPartUnitCost(0);
  };

  const handleRemovePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
  };

  const totalPartsCost = parts.reduce((acc, p) => acc + p.totalCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = `${businessDate} ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;

    onSubmit({
      assetId: `ast-${Date.now().toString().slice(-4)}`,
      assetName,
      assetTag: assetTag || `EQ-${Date.now().toString().slice(-4)}`,
      assetCategory: assetCategory as any,
      location,
      repairDate: businessDate,
      startedAt: `${businessDate} 10:00`,
      completedAt: now,
      durationMinutes: Number(durationMinutes),
      leadTechnicianId,
      leadTechnicianName,
      problemDescription,
      rootCauseAnalysis: rootCauseAnalysis || "Standard mechanical wear & tear",
      actionTaken,
      partsReplaced: parts,
      laborHoursLogged: Number(laborHoursLogged),
      totalPartsCost,
      totalLaborCost: Number(totalLaborCost),
      totalCost: totalPartsCost + Number(totalLaborCost),
      preventionRecommendation: preventionRecommendation || "Inspect during bi-monthly PM cycle",
      status: "completed",
      supervisorApprovalStatus: "pending",
      safetyProtocolPassed: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-brand-800 pb-3">
          <div className="flex items-center gap-2">
            <Wrench size={18} className="text-gold-400" />
            <h3 className="font-bold text-sm text-brand-50">
              Log Maintenance Repair Audit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-brand-300 hover:bg-brand-800 hover:text-brand-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Asset Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Daikin Inverter VRV Split Unit"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Asset Tag / Serial
              </label>
              <input
                type="text"
                placeholder="e.g. EQ-HVAC-201"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Asset Category
              </label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              >
                <option value="HVAC & Refrigeration">HVAC &amp; Refrigeration</option>
                <option value="Electrical & Power">Electrical &amp; Power</option>
                <option value="Plumbing & Boiler">Plumbing &amp; Boiler</option>
                <option value="Elevators & Lifts">Elevators &amp; Lifts</option>
                <option value="Kitchen Equipment">Kitchen Equipment</option>
                <option value="Access & Locks">Access &amp; Locks</option>
                <option value="Audio-Visual">Audio-Visual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Room 201, Main Kitchen, Plant Room B"
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Technician Name *
              </label>
              <input
                type="text"
                required
                value={leadTechnicianName}
                onChange={(e) => setLeadTechnicianName(e.target.value)}
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Technician Employee ID
              </label>
              <input
                type="text"
                value={leadTechnicianId}
                onChange={(e) => setLeadTechnicianId(e.target.value)}
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Time Taken (Minutes) *
              </label>
              <input
                type="number"
                min="5"
                required
                value={durationMinutes}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setDurationMinutes(m);
                  setLaborHoursLogged(Number((m / 60).toFixed(2)));
                }}
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">
                Labor Cost (NGN)
              </label>
              <input
                type="number"
                min="0"
                value={totalLaborCost}
                onChange={(e) => setTotalLaborCost(Number(e.target.value))}
                className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-200 mb-1">
              Problem Diagnosed *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe symptoms, error codes, and physical faults found..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 placeholder-brand-200/40 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-200 mb-1">
              Corrective Action Taken *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Detail the technical procedure, adjustments, and replacement work done..."
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full rounded-lg border border-brand-800 bg-brand-900/80 px-3 py-2 text-xs text-brand-100 placeholder-brand-200/40 focus:border-gold-500 focus:outline-none"
            />
          </div>

          {/* Parts Replaced Section */}
          <div className="rounded-lg border border-brand-800 bg-brand-900/30 p-3 space-y-3">
            <span className="text-xs font-semibold text-brand-100 flex items-center gap-1.5">
              <Package size={14} className="text-amber-400" /> Replaced Parts &amp; Components Log
            </span>

            {/* Sub-form to add a part */}
            <div className="grid grid-cols-12 gap-2 text-xs">
              <input
                type="text"
                placeholder="Part Name (e.g. 45uF Capacitor)"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="col-span-4 rounded border border-brand-700 bg-brand-950 px-2.5 py-1.5 text-xs text-brand-100"
              />
              <input
                type="text"
                placeholder="Part Number"
                value={newPartNumber}
                onChange={(e) => setNewPartNumber(e.target.value)}
                className="col-span-3 rounded border border-brand-700 bg-brand-950 px-2.5 py-1.5 text-xs text-brand-100"
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={newPartQty}
                onChange={(e) => setNewPartQty(Number(e.target.value))}
                className="col-span-2 rounded border border-brand-700 bg-brand-950 px-2 py-1.5 text-xs text-brand-100"
              />
              <input
                type="number"
                min="0"
                placeholder="Unit Cost"
                value={newPartUnitCost || ""}
                onChange={(e) => setNewPartUnitCost(Number(e.target.value))}
                className="col-span-2 rounded border border-brand-700 bg-brand-950 px-2 py-1.5 text-xs text-brand-100"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="col-span-1 flex items-center justify-center rounded bg-gold-500 text-brand-950 hover:bg-gold-400 font-bold"
              >
                +
              </button>
            </div>

            {/* List of added parts */}
            {parts.length > 0 && (
              <div className="space-y-1.5 border-t border-brand-800/60 pt-2">
                {parts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded bg-brand-950/80 px-2.5 py-1.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-brand-100">{p.partName}</span>
                      <span className="text-brand-200/50 ml-2 font-mono text-[11px]">
                        ({p.quantity}x @ {naira(p.unitCost)})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-semibold">
                        {naira(p.totalCost)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(p.id)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right text-xs font-semibold text-gold-400 pt-1">
                  Total Parts Value: {naira(totalPartsCost)}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-brand-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-brand-800 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gold-500 px-5 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400"
            >
              Submit Repair Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
