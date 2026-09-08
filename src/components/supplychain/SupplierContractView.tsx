import { useState, useMemo } from "react";
import { Card, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type {
  SupplierContract,
  SupplierContractCategory,
  RenewalType,
} from "../../types";
import {
  AlertTriangle,
  Clock,
  Send,
  Plus,
  CheckCircle2,
  Search,
  Award,
  X,
} from "lucide-react";

const CATEGORY_LABELS: Record<SupplierContractCategory, string> = {
  fnb_perishables: "F&B Fresh & Cold-Chain",
  fnb_beverages: "Beverages, Wines & Spirits",
  fnb_dry_goods: "Dry Provisions & Bakery",
  facility_hvac_power: "Facility HVAC & Power",
  facility_fire_life_safety: "Fire, Life Safety & Security",
  housekeeping_linen_chem: "Housekeeping & Linens",
  it_telecom: "IT, Telecom & Keycards",
};

export function SupplierContractView() {
  const {
    supplierContracts,
    addSupplierContract,
    updateSupplierContractStatus,
    sendRenewalNotice,
    recordSlaAudit,
  } = usePlatform();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [auditingContract, setAuditingContract] = useState<SupplierContract | null>(null);
  const [inspectingContract, setInspectingContract] = useState<SupplierContract | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // New Contract Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newCategory, setNewCategory] = useState<SupplierContractCategory>("fnb_perishables");
  const [newAnnualValue, setNewAnnualValue] = useState(25000000);
  const [newPaymentTerms, setNewPaymentTerms] = useState("Net 30 Days after GRN approval");
  const [newStartDate, setNewStartDate] = useState("2026-01-01");
  const [newEndDate, setNewEndDate] = useState("2026-12-31");
  const [newNoticePeriodDays, setNewNoticePeriodDays] = useState(60);
  const [newRenewalType, setNewRenewalType] = useState<RenewalType>("auto_renew_60d");
  const [newDeliverables, setNewDeliverables] = useState("");
  const [newManager, setNewManager] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Audit Form State
  const [auditTimeliness, setAuditTimeliness] = useState<number>(95);
  const [auditFillRate, setAuditFillRate] = useState<number>(98);
  const [auditQuality, setAuditQuality] = useState<number>(99);
  const [auditPenalties, setAuditPenalties] = useState<boolean>(false);

  // Calculate Days Remaining relative to 2026-09-15
  const getDaysRemaining = (endDateStr: string): number => {
    const end = new Date(endDateStr).getTime();
    const current = new Date("2026-09-15").getTime();
    return Math.ceil((end - current) / (1000 * 60 * 60 * 24));
  };

  // KPIs
  const totalValue = useMemo(() => {
    return supplierContracts
      .filter((c) => c.status !== "terminated" && c.status !== "expired")
      .reduce((acc, c) => acc + c.annualValue, 0);
  }, [supplierContracts]);

  const expiringSoonCount = useMemo(() => {
    return supplierContracts.filter((c) => {
      const days = getDaysRemaining(c.endDate);
      return days > 0 && days <= c.noticePeriodDays;
    }).length;
  }, [supplierContracts]);

  const inRenewalCount = useMemo(() => {
    return supplierContracts.filter((c) => c.status === "in_renewal").length;
  }, [supplierContracts]);

  const avgSlaScore = useMemo(() => {
    if (supplierContracts.length === 0) return 0;
    const sum = supplierContracts.reduce((acc, c) => acc + c.sla.overallScore, 0);
    return Math.round(sum / supplierContracts.length);
  }, [supplierContracts]);

  // Filtered List
  const filteredContracts = useMemo(() => {
    return supplierContracts.filter((c) => {
      const matchCat = categoryFilter === "all" || c.category === categoryFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchSearch =
        c.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [supplierContracts, categoryFilter, statusFilter, searchQuery]);

  const handleSendNotice = (contractId: string, supplierName: string) => {
    sendRenewalNotice(contractId);
    setActionSuccessMessage(`Official automated renewal notice dispatched to ${supplierName} key contacts.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleOpenAudit = (contract: SupplierContract) => {
    setAuditingContract(contract);
    setAuditTimeliness(contract.sla.currentTimelinessPct);
    setAuditFillRate(contract.sla.currentFillRatePct);
    setAuditQuality(contract.sla.currentQualityCompliancePct);
    setAuditPenalties(contract.sla.penaltyClausesActive);
  };

  const handleSaveAudit = () => {
    if (!auditingContract) return;
    recordSlaAudit(auditingContract.id, {
      currentTimelinessPct: auditTimeliness,
      currentFillRatePct: auditFillRate,
      currentQualityCompliancePct: auditQuality,
      penaltyClausesActive: auditPenalties,
    });
    setActionSuccessMessage(`SLA Audit recorded for ${auditingContract.supplierName}. Overall score updated.`);
    setAuditingContract(null);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName || !newTitle) return;

    addSupplierContract({
      supplierId: `sup-${Date.now()}`,
      supplierName: newSupplierName,
      category: newCategory,
      title: newTitle,
      annualValue: Number(newAnnualValue),
      paymentTerms: newPaymentTerms,
      startDate: newStartDate,
      endDate: newEndDate,
      noticePeriodDays: Number(newNoticePeriodDays),
      renewalType: newRenewalType,
      status: "active",
      sla: {
        deliveryTimelinessPct: 95,
        currentTimelinessPct: 96,
        fillRatePct: 98,
        currentFillRatePct: 98,
        tempQualityCompliancePct: 99,
        currentQualityCompliancePct: 99,
        overallScore: 97,
        grade: "A+",
        penaltyClausesActive: false,
        lastAuditDate: new Date().toISOString().slice(0, 10),
      },
      keyContacts: {
        accountManager: newManager || "Contract Lead",
        phone: newPhone || "+234 800 123 4567",
        email: newEmail || "vendor@hospitality.com",
      },
      deliverablesSummary: newDeliverables || "Direct procurement supply agreement",
      renewalAlertDays: Number(newNoticePeriodDays),
    });

    setIsCreateModalOpen(false);
    setActionSuccessMessage(`New supplier contract registered for ${newSupplierName}.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast banner */}
      {actionSuccessMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs text-emerald-200 shadow-md">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-xl border border-brand-800/80 bg-gradient-to-r from-brand-950/80 via-brand-900/60 to-brand-950/80 p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                Vendor SLAs &amp; Contract Expiration Governance
              </span>
            </div>
            <h2 className="text-xl font-bold text-brand-50 mt-1">
              Supplier Contract Management &amp; Automated Renewal Alerts
            </h2>
            <p className="text-sm text-brand-200/70 mt-1 max-w-3xl">
              Track SLA compliance, delivery timeliness, fill-rate penalties, and expiration timelines for F&amp;B provisions, facility engineering, and life-safety vendors.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gold-500/20 border border-gold-400/50 px-4 py-2 text-xs font-semibold text-gold-200 hover:bg-gold-500/30 transition shadow-sm"
          >
            <Plus size={15} />
            Register Supplier Contract
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active Contracts Value"
          value={naira(totalValue, true)}
          sub={`${supplierContracts.filter((c) => c.status === "active").length} active agreements`}
          accent="gold"
        />
        <StatCard
          label="Expiring Within Window"
          value={String(expiringSoonCount)}
          sub="Requires negotiation or renewal"
          accent={expiringSoonCount > 0 ? "rose" : "emerald"}
        />
        <StatCard
          label="In Renewal Process"
          value={String(inRenewalCount)}
          sub="Notices dispatched"
          accent="sky"
        />
        <StatCard
          label="Average SLA Performance"
          value={`${avgSlaScore}%`}
          sub="Portfolio composite rating"
          accent={avgSlaScore >= 90 ? "emerald" : "amber"}
        />
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input
                type="text"
                placeholder="Search vendor, title, contract #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-brand-800 bg-brand-950/60 pl-8 pr-3 py-1.5 text-xs text-brand-100 placeholder-brand-500 focus:border-gold-400 focus:outline-none w-56"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-1.5 text-xs text-brand-200 focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All Vendor Categories</option>
              <option value="fnb_perishables">F&amp;B Fresh &amp; Cold-Chain</option>
              <option value="fnb_beverages">Beverages, Wines &amp; Spirits</option>
              <option value="fnb_dry_goods">Dry Provisions &amp; Bakery</option>
              <option value="facility_hvac_power">Facility HVAC &amp; Power</option>
              <option value="facility_fire_life_safety">Fire, Life Safety &amp; Security</option>
              <option value="housekeeping_linen_chem">Housekeeping &amp; Linens</option>
              <option value="it_telecom">IT, Telecom &amp; Keycards</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-1.5 text-xs text-brand-200 focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="in_renewal">In Renewal</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="text-xs text-brand-400">
            Showing <strong className="text-brand-100">{filteredContracts.length}</strong> of{" "}
            {supplierContracts.length} contracts
          </div>
        </div>

        {/* Contract Cards / Table */}
        <div className="divide-y divide-brand-800/40">
          {filteredContracts.map((contract) => {
            const daysLeft = getDaysRemaining(contract.endDate);
            const isExpiringSoon = daysLeft > 0 && daysLeft <= contract.noticePeriodDays;
            const isExpired = daysLeft <= 0;

            return (
              <div
                key={contract.id}
                className="p-5 hover:bg-brand-900/20 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Supplier & Contract Details */}
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gold-300">
                      {contract.contractNumber}
                    </span>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[contract.category] || contract.category}
                    </Badge>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                        contract.status === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : contract.status === "in_renewal"
                          ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                          : contract.status === "expiring_soon"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {contract.status === "in_renewal"
                        ? "In Formal Renewal"
                        : contract.status === "expiring_soon"
                        ? "Expiring Soon"
                        : contract.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-brand-50">{contract.supplierName}</h3>
                  <p className="text-xs text-brand-200/80">{contract.title}</p>
                  <p className="text-[11px] text-brand-400 italic">{contract.deliverablesSummary}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-brand-300 pt-1 font-mono">
                    <span>
                      Value: <strong className="text-brand-100">{naira(contract.annualValue, true)}/yr</strong>
                    </span>
                    <span>•</span>
                    <span>Terms: {contract.paymentTerms}</span>
                    <span>•</span>
                    <span>Contact: {contract.keyContacts.accountManager}</span>
                  </div>
                </div>

                {/* Middle: Expiration & Renewal Tracking */}
                <div className="rounded-lg border border-brand-800/80 bg-brand-950/40 p-3.5 space-y-2 min-w-[240px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-300 flex items-center gap-1">
                      <Clock size={13} className="text-gold-400" /> Expiration:
                    </span>
                    <span className="font-mono font-semibold text-brand-100">{contract.endDate}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-brand-400">Notice Required:</span>
                    <span className="text-[11px] font-mono text-brand-200">{contract.noticePeriodDays} days prior</span>
                  </div>

                  <div className="pt-1">
                    {isExpired ? (
                      <div className="rounded bg-rose-500/20 px-2 py-1 text-center text-xs font-bold text-rose-300 border border-rose-500/40">
                        Contract Expired
                      </div>
                    ) : isExpiringSoon ? (
                      <div className="rounded bg-amber-500/20 px-2 py-1 text-center text-xs font-bold text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1">
                        <AlertTriangle size={13} /> {daysLeft} Days to Expiration!
                      </div>
                    ) : (
                      <div className="rounded bg-brand-900/60 px-2 py-1 text-center text-xs font-medium text-emerald-300 border border-brand-700/60">
                        {daysLeft} Days Remaining (Healthy)
                      </div>
                    )}
                  </div>

                  {contract.lastRenewalNoticeSent && (
                    <p className="text-[10px] text-sky-400 text-center font-mono">
                      ✓ Notice dispatched: {contract.lastRenewalNoticeSent}
                    </p>
                  )}
                </div>

                {/* Right: SLA Scorecard & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 min-w-[200px]">
                  {/* SLA Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-brand-400">SLA Rating</div>
                      <div className="text-base font-bold text-brand-50 font-mono">
                        {contract.sla.overallScore}%
                      </div>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm border shadow-sm ${
                        contract.sla.grade === "A+" || contract.sla.grade === "A"
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                          : contract.sla.grade === "B"
                          ? "border-sky-500/40 bg-sky-500/20 text-sky-200"
                          : "border-amber-500/40 bg-amber-500/20 text-amber-200"
                      }`}
                    >
                      {contract.sla.grade}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSendNotice(contract.id, contract.supplierName)}
                      className="flex items-center gap-1 rounded bg-brand-800 px-2.5 py-1.5 text-xs font-medium text-sky-300 hover:bg-brand-700 hover:text-sky-200 transition border border-brand-700/60"
                      title="Trigger automated notice dispatch via email and SMS"
                    >
                      <Send size={12} />
                      Send Renewal Notice
                    </button>

                    <button
                      onClick={() => handleOpenAudit(contract)}
                      className="flex items-center gap-1 rounded bg-brand-800 px-2.5 py-1.5 text-xs font-medium text-gold-300 hover:bg-brand-700 hover:text-gold-200 transition border border-brand-700/60"
                    >
                      <Award size={12} />
                      SLA Audit
                    </button>

                    <button
                      onClick={() => setInspectingContract(contract)}
                      className="rounded bg-brand-900/60 px-2.5 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-800 hover:text-brand-100 transition border border-brand-800"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* SLA Audit Modal */}
      {auditingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  SLA Compliance Performance Audit
                </span>
                <h3 className="text-base font-bold text-brand-50 mt-0.5">
                  {auditingContract.supplierName}
                </h3>
              </div>
              <button
                onClick={() => setAuditingContract(null)}
                className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-900 hover:text-brand-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-brand-200 mb-1">
                  <span>Delivery Timeliness Compliance:</span>
                  <span className="font-mono text-gold-300">{auditTimeliness}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={100}
                  value={auditTimeliness}
                  onChange={(e) => setAuditTimeliness(Number(e.target.value))}
                  className="w-full h-1.5 bg-brand-800 rounded appearance-none cursor-pointer accent-gold-400"
                />
                <span className="text-[10px] text-brand-400">Target: {auditingContract.sla.deliveryTimelinessPct}%</span>
              </div>

              <div>
                <div className="flex justify-between font-medium text-brand-200 mb-1">
                  <span>PO Line Fill-Rate Accuracy:</span>
                  <span className="font-mono text-emerald-300">{auditFillRate}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={100}
                  value={auditFillRate}
                  onChange={(e) => setAuditFillRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-brand-800 rounded appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="text-[10px] text-brand-400">Target: {auditingContract.sla.fillRatePct}%</span>
              </div>

              <div>
                <div className="flex justify-between font-medium text-brand-200 mb-1">
                  <span>Quality / Cold-Chain Spec Compliance:</span>
                  <span className="font-mono text-sky-300">{auditQuality}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={100}
                  value={auditQuality}
                  onChange={(e) => setAuditQuality(Number(e.target.value))}
                  className="w-full h-1.5 bg-brand-800 rounded appearance-none cursor-pointer accent-sky-400"
                />
                <span className="text-[10px] text-brand-400">Target: {auditingContract.sla.tempQualityCompliancePct}%</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-brand-800">
                <input
                  type="checkbox"
                  id="penaltyCheck"
                  checked={auditPenalties}
                  onChange={(e) => setAuditPenalties(e.target.checked)}
                  className="rounded border-brand-700 bg-brand-900 text-gold-400 focus:ring-0"
                />
                <label htmlFor="penaltyCheck" className="text-brand-300 text-xs cursor-pointer">
                  Enforce Contractual Late Delivery Penalty (2% invoice deduction)
                </label>
              </div>

              {/* Projected Score */}
              <div className="rounded-lg bg-brand-900/60 p-3 flex items-center justify-between font-mono">
                <span className="text-brand-300">Projected Audit Score:</span>
                <span className="font-bold text-sm text-gold-300">
                  {Math.round(auditTimeliness * 0.4 + auditFillRate * 0.35 + auditQuality * 0.25)}%
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setAuditingContract(null)}
                className="rounded-lg bg-brand-900 px-3 py-1.5 text-xs text-brand-300 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAudit}
                className="rounded-lg bg-gold-500/20 border border-gold-400/50 px-4 py-1.5 text-xs font-semibold text-gold-200 hover:bg-gold-500/30"
              >
                Save Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  Procurement Master File
                </span>
                <h3 className="text-base font-bold text-brand-50 mt-0.5">
                  Register Supplier Contract &amp; SLA
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-900 hover:text-brand-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-brand-300 mb-1">Supplier Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagos Prime Poultry &amp; Livestock Ltd"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SupplierContractCategory)}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  >
                    <option value="fnb_perishables">F&amp;B Fresh &amp; Cold-Chain</option>
                    <option value="fnb_beverages">Beverages, Wines &amp; Spirits</option>
                    <option value="fnb_dry_goods">Dry Provisions &amp; Bakery</option>
                    <option value="facility_hvac_power">Facility HVAC &amp; Power</option>
                    <option value="facility_fire_life_safety">Fire, Life Safety &amp; Security</option>
                    <option value="housekeeping_linen_chem">Housekeeping &amp; Linens</option>
                    <option value="it_telecom">IT, Telecom &amp; Keycards</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brand-300 mb-1">Annual Committed Value (₦)</label>
                  <input
                    type="number"
                    required
                    value={newAnnualValue}
                    onChange={(e) => setNewAnnualValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-300 mb-1">Contract Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Fresh Meat, Chilled Poultry &amp; Seafood Par Agreement"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-brand-300 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-300 mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={newNoticePeriodDays}
                    onChange={(e) => setNewNoticePeriodDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-brand-300 mb-1">Renewal Type</label>
                  <select
                    value={newRenewalType}
                    onChange={(e) => setNewRenewalType(e.target.value as RenewalType)}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  >
                    <option value="auto_renew_60d">Auto-Renew (60d Notice)</option>
                    <option value="auto_renew_30d">Auto-Renew (30d Notice)</option>
                    <option value="manual_negotiation">Manual Board Negotiation</option>
                    <option value="tender_required">Tender Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-300 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={newPaymentTerms}
                  onChange={(e) => setNewPaymentTerms(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-brand-300 mb-1">Account Manager</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newManager}
                    onChange={(e) => setNewManager(e.target.value)}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-2.5 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-brand-300 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+234..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-2.5 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-brand-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@..."
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-2.5 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-300 mb-1">Deliverables &amp; Scope Summary</label>
                <textarea
                  rows={2}
                  placeholder="Summary of goods, delivery schedules, dock delivery windows..."
                  value={newDeliverables}
                  onChange={(e) => setNewDeliverables(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/60 px-3 py-2 text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-brand-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg bg-brand-900 px-4 py-2 text-xs text-brand-300 hover:bg-brand-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold-500/20 border border-gold-400/50 px-4 py-2 text-xs font-semibold text-gold-200 hover:bg-gold-500/30"
                >
                  Create Contract Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Detail Inspector Modal */}
      {inspectingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  {inspectingContract.contractNumber}
                </span>
                <h3 className="text-lg font-bold text-brand-50 mt-0.5">
                  {inspectingContract.supplierName}
                </h3>
              </div>
              <button
                onClick={() => setInspectingContract(null)}
                className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-900 hover:text-brand-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-brand-800 bg-brand-900/40 p-3">
                <div>
                  <span className="text-brand-400 text-[11px]">Title</span>
                  <p className="font-semibold text-brand-100">{inspectingContract.title}</p>
                </div>
                <div>
                  <span className="text-brand-400 text-[11px]">Annual Value</span>
                  <p className="font-mono font-bold text-gold-300">{naira(inspectingContract.annualValue)}</p>
                </div>
                <div>
                  <span className="text-brand-400 text-[11px]">Duration</span>
                  <p className="font-mono text-brand-200">{inspectingContract.startDate} to {inspectingContract.endDate}</p>
                </div>
                <div>
                  <span className="text-brand-400 text-[11px]">Renewal Type</span>
                  <p className="text-brand-200">{inspectingContract.renewalType.replace(/_/g, " ")}</p>
                </div>
              </div>

              {/* SLA Details */}
              <div className="rounded-lg border border-brand-800 bg-brand-900/40 p-3 space-y-2">
                <h4 className="font-semibold text-gold-400 flex items-center justify-between">
                  <span>SLA Performance Metrics</span>
                  <span className="font-mono">Grade: {inspectingContract.sla.grade} ({inspectingContract.sla.overallScore}%)</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="rounded bg-brand-950 p-2">
                    <span className="text-brand-400 block">Timeliness</span>
                    <span className="text-emerald-300 font-bold">{inspectingContract.sla.currentTimelinessPct}%</span>
                    <span className="text-brand-400 block text-[10px]">Target: {inspectingContract.sla.deliveryTimelinessPct}%</span>
                  </div>
                  <div className="rounded bg-brand-950 p-2">
                    <span className="text-brand-400 block">Fill Rate</span>
                    <span className="text-emerald-300 font-bold">{inspectingContract.sla.currentFillRatePct}%</span>
                    <span className="text-brand-400 block text-[10px]">Target: {inspectingContract.sla.fillRatePct}%</span>
                  </div>
                  <div className="rounded bg-brand-950 p-2">
                    <span className="text-brand-400 block">Cold-Chain / Quality</span>
                    <span className="text-emerald-300 font-bold">{inspectingContract.sla.currentQualityCompliancePct}%</span>
                    <span className="text-brand-400 block text-[10px]">Target: {inspectingContract.sla.tempQualityCompliancePct}%</span>
                  </div>
                </div>
              </div>

              {/* Key Contacts */}
              <div className="rounded-lg border border-brand-800 bg-brand-900/40 p-3">
                <h4 className="font-semibold text-brand-100 mb-1">Key Vendor Contacts</h4>
                <div className="flex flex-wrap gap-4 text-brand-300">
                  <span>Manager: <strong className="text-brand-100">{inspectingContract.keyContacts.accountManager}</strong></span>
                  <span>Phone: <strong className="text-brand-100">{inspectingContract.keyContacts.phone}</strong></span>
                  <span>Email: <strong className="text-brand-100">{inspectingContract.keyContacts.email}</strong></span>
                </div>
              </div>

              {inspectingContract.notes && (
                <div className="rounded bg-brand-900/60 p-2.5 text-brand-300 text-[11px] italic">
                  Notes: {inspectingContract.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {inspectingContract.status !== "active" && (
                  <button
                    onClick={() => {
                      updateSupplierContractStatus(inspectingContract.id, "active");
                      setInspectingContract({ ...inspectingContract, status: "active" });
                      setActionSuccessMessage(`Contract set to ACTIVE.`);
                      setTimeout(() => setActionSuccessMessage(null), 3000);
                    }}
                    className="rounded bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                  >
                    Activate Contract
                  </button>
                )}
                {inspectingContract.status !== "terminated" && (
                  <button
                    onClick={() => {
                      updateSupplierContractStatus(inspectingContract.id, "terminated");
                      setInspectingContract({ ...inspectingContract, status: "terminated" });
                      setActionSuccessMessage(`Contract marked as TERMINATED.`);
                      setTimeout(() => setActionSuccessMessage(null), 3000);
                    }}
                    className="rounded bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
                  >
                    Terminate Contract
                  </button>
                )}
              </div>
              <button
                onClick={() => setInspectingContract(null)}
                className="rounded-lg bg-brand-800 px-4 py-2 text-xs font-semibold text-brand-50 hover:bg-brand-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
