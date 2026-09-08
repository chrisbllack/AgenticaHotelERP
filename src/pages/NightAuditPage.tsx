import { useState } from "react";
import { usePlatform } from "../store/platform";
import { Card, PageHeader, StatCard } from "../components/ui/primitives";
import { naira, cn } from "../lib/utils";
import type { NightAuditReport } from "../types";
import {
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Moon,
  Printer,
  RefreshCw,
  Scale,
} from "lucide-react";

export default function NightAuditPage() {
  const {
    businessDate,
    reservations,
    rooms,
    orders,
    auditReports,
    executeComprehensiveNightAudit,
  } = usePlatform();

  // Audit run state
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [auditCompleteReport, setAuditCompleteReport] = useState<NightAuditReport | null>(null);
  const [selectedReportToView, setSelectedReportToView] = useState<NightAuditReport | null>(
    auditReports[0] || null
  );
  const [activeReportTab, setActiveReportTab] = useState<"flash" | "room_tax" | "trial_balance" | "archive">("flash");

  // Pre-audit metrics
  const inHouseGuests = reservations.filter((r) => r.status === "checked_in");
  const pendingArrivals = reservations.filter(
    (r) => r.arrivalDate === businessDate && r.status === "confirmed"
  );
  const pendingDepartures = reservations.filter(
    (r) => r.departureDate === businessDate && r.status === "checked_in"
  );
  const openPosOrders = orders.filter((o) => o.status === "open");

  // Calculate estimated tonight's postings
  const estimatedRoomRevenue = inHouseGuests.reduce((acc, r) => acc + (r.ratePerNight ?? 110000), 0);
  const estimatedTax = Math.round(estimatedRoomRevenue * 0.075);
  const estimatedServiceCharge = Math.round(estimatedRoomRevenue * 0.10);

  const handleStartAudit = async () => {
    setIsRunningAudit(true);
    setCurrentStep(1);

    // Step 1: Cashier & POS Closure
    await new Promise((r) => setTimeout(r, 600));
    setCurrentStep(2);

    // Step 2: Post Room & Tax
    await new Promise((r) => setTimeout(r, 700));
    setCurrentStep(3);

    // Step 3: Room Status Rollover
    await new Promise((r) => setTimeout(r, 600));
    setCurrentStep(4);

    // Step 4: Daily Financial Closure & Roll Business Date
    await new Promise((r) => setTimeout(r, 700));
    setCurrentStep(5);

    // Step 5: Report Generation
    const rep = executeComprehensiveNightAudit("Chidi Amadi (Night Audit Lead)");
    await new Promise((r) => setTimeout(r, 600));

    setAuditCompleteReport(rep);
    setSelectedReportToView(rep);
    setIsRunningAudit(false);
  };

  const currentReport = selectedReportToView || auditReports[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Night Audit & Daily Financial Closure"
        description="M-ACC & M-LOD · Automated daily financial rollover, room & tax postings, guest ledger balance reconciliation, and manager reporting"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-brand-700 bg-brand-900/80 px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-brand-200/60">Active Business Date:</span>
              <span className="font-mono font-bold text-brand-50">{businessDate}</span>
            </div>

            <button
              onClick={handleStartAudit}
              disabled={isRunningAudit}
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors shadow-md disabled:bg-brand-800 disabled:text-brand-200/40"
            >
              {isRunningAudit ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-brand-950" />
                  <span>Processing Night Audit...</span>
                </>
              ) : (
                <>
                  <Moon size={14} />
                  <span>Run Night Audit Now</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Audit Progress Execution Banner (when running or just completed) */}
      {isRunningAudit && (
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon size={18} className="text-gold-400 animate-pulse" />
                <h3 className="font-display text-sm font-semibold text-brand-50">
                  Night Audit Execution Wizard in Progress
                </h3>
              </div>
              <span className="font-mono text-xs text-gold-400">Step {currentStep} of 5</span>
            </div>

            {/* Step Indicators */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5 text-xs">
              <div
                className={cn(
                  "rounded-lg p-2.5 border",
                  currentStep >= 1 ? "border-gold-500/50 bg-gold-500/10 text-gold-300" : "border-brand-800 bg-brand-900/40 text-brand-200/40"
                )}
              >
                <span className="font-bold">1. Outlets & Cash</span>
                <p className="text-[10px] mt-0.5">Reconcile drawers & POS</p>
              </div>

              <div
                className={cn(
                  "rounded-lg p-2.5 border",
                  currentStep >= 2 ? "border-gold-500/50 bg-gold-500/10 text-gold-300" : "border-brand-800 bg-brand-900/40 text-brand-200/40"
                )}
              >
                <span className="font-bold">2. Room & Tax</span>
                <p className="text-[10px] mt-0.5">Post nightly folio charges</p>
              </div>

              <div
                className={cn(
                  "rounded-lg p-2.5 border",
                  currentStep >= 3 ? "border-gold-500/50 bg-gold-500/10 text-gold-300" : "border-brand-800 bg-brand-900/40 text-brand-200/40"
                )}
              >
                <span className="font-bold">3. Housekeeping</span>
                <p className="text-[10px] mt-0.5">Rollover room statuses</p>
              </div>

              <div
                className={cn(
                  "rounded-lg p-2.5 border",
                  currentStep >= 4 ? "border-gold-500/50 bg-gold-500/10 text-gold-300" : "border-brand-800 bg-brand-900/40 text-brand-200/40"
                )}
              >
                <span className="font-bold">4. Close & Roll</span>
                <p className="text-[10px] mt-0.5">Advance business date</p>
              </div>

              <div
                className={cn(
                  "rounded-lg p-2.5 border",
                  currentStep >= 5 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-brand-800 bg-brand-900/40 text-brand-200/40"
                )}
              >
                <span className="font-bold">5. Audit Reports</span>
                <p className="text-[10px] mt-0.5">Generate daily flash</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {auditCompleteReport && !isRunningAudit && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-emerald-100">
                Night Audit Completed Successfully for Date: {auditCompleteReport.businessDate}
              </p>
              <p className="text-emerald-200/70">
                Charged {auditCompleteReport.roomsCharged} rooms · Grand Total Revenue Posted: {naira(auditCompleteReport.grandTotalRevenue)} · Business Date Advanced to {businessDate}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuditCompleteReport(null)}
            className="rounded border border-emerald-500/40 px-3 py-1 text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pre-Audit Diagnostics Matrix */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="In-House Rooms to Post"
          value={String(inHouseGuests.length)}
          change={`Est. Room Rev: ${naira(estimatedRoomRevenue)}`}
          trend="neutral"
        />
        <StatCard
          label="Estimated Tax & Service"
          value={naira(estimatedTax + estimatedServiceCharge)}
          change="7.5% VAT + 10% Service"
          trend="up"
        />
        <StatCard
          label="Pending Arrivals / No-Shows"
          value={String(pendingArrivals.length)}
          change={`${pendingArrivals.length} arrivals · ${pendingDepartures.length} departures`}
          trend={pendingArrivals.length > 0 ? "down" : "up"}
        />
        <StatCard
          label="Open POS Order Tabs"
          value={String(openPosOrders.length)}
          change={openPosOrders.length === 0 ? "All outlets closed & balanced" : "Requires cashier close"}
          trend={openPosOrders.length === 0 ? "up" : "down"}
        />
      </div>

      {/* Report Viewer & Nav Tabs */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-800 p-4">
          <div className="flex border-b border-brand-800/80 -mb-4">
            <button
              onClick={() => setActiveReportTab("flash")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                activeReportTab === "flash"
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-brand-200/60 hover:text-brand-100"
              )}
            >
              <FileText size={14} /> Manager's Flash Report
            </button>
            <button
              onClick={() => setActiveReportTab("room_tax")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                activeReportTab === "room_tax"
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-brand-200/60 hover:text-brand-100"
              )}
            >
              <FileSpreadsheet size={14} /> Room & Tax Charge Journal
            </button>
            <button
              onClick={() => setActiveReportTab("trial_balance")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                activeReportTab === "trial_balance"
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-brand-200/60 hover:text-brand-100"
              )}
            >
              <Scale size={14} /> General Ledger Trial Balance
            </button>
            <button
              onClick={() => setActiveReportTab("archive")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                activeReportTab === "archive"
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-brand-200/60 hover:text-brand-100"
              )}
            >
              <Calendar size={14} /> Audit Archive History ({auditReports.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
            >
              <Printer size={13} /> Print Sheet
            </button>
            <button
              onClick={() => {
                alert(`Exporting Audit Report #${currentReport.id} as CSV.`);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
            >
              <Download size={13} /> Export Excel/CSV
            </button>
          </div>
        </div>

        {/* Tab Content 1: Flash Report */}
        {activeReportTab === "flash" && currentReport && (
          <div className="p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-800/80 pb-4">
              <div>
                <span className="font-mono text-xs text-gold-400 font-semibold">
                  AUDIT RUN ID: {currentReport.id}
                </span>
                <h3 className="font-display text-lg text-brand-50">
                  Daily Manager Flash & Revenue Closure Summary
                </h3>
                <p className="text-xs text-brand-200/60">
                  Operating Business Date: <strong className="text-brand-100">{currentReport.businessDate}</strong> · Completed At: {currentReport.completedAt}
                </p>
              </div>

              <div className="text-right">
                <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  Ledger Status: {currentReport.status.toUpperCase()}
                </span>
                <p className="mt-1 text-xs text-brand-200/50">Auditor: {currentReport.auditorName}</p>
              </div>
            </div>

            {/* Revenue Breakdowns */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-4">
                <span className="text-[11px] uppercase text-brand-200/50">Total Room Revenue</span>
                <p className="mt-1 font-mono text-xl font-bold text-brand-50">
                  {naira(currentReport.totalRoomRevenue)}
                </p>
                <p className="mt-1 text-xs text-brand-200/60">
                  {currentReport.roomsCharged} rooms charged
                </p>
              </div>

              <div className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-4">
                <span className="text-[11px] uppercase text-brand-200/50">Food & Beverage</span>
                <p className="mt-1 font-mono text-xl font-bold text-brand-50">
                  {naira(currentReport.totalFnbRevenue)}
                </p>
                <p className="mt-1 text-xs text-brand-200/60">Restaurant, Bar & Room Service</p>
              </div>

              <div className="rounded-xl border border-brand-800/70 bg-brand-950/60 p-4">
                <span className="text-[11px] uppercase text-brand-200/50">Taxes & Service Charge</span>
                <p className="mt-1 font-mono text-xl font-bold text-brand-50">
                  {naira(currentReport.totalTaxPosted + currentReport.totalServiceChargePosted)}
                </p>
                <p className="mt-1 text-xs text-brand-200/60">7.5% VAT + 10% Service</p>
              </div>

              <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-4">
                <span className="text-[11px] uppercase text-gold-400 font-semibold">Grand Total Net Revenue</span>
                <p className="mt-1 font-mono text-xl font-bold text-gold-300">
                  {naira(currentReport.grandTotalRevenue)}
                </p>
                <p className="mt-1 text-xs text-gold-400/80">100% Posted & Reconciled</p>
              </div>
            </div>

            {/* Daily Operational & Hospitality KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-xl border border-brand-800/70 bg-brand-950/80 p-4 text-xs">
              <div>
                <span className="text-brand-200/50">Closing Occupancy Rate:</span>
                <p className="font-mono text-base font-bold text-brand-50">{currentReport.endingOccupancyRate}%</p>
              </div>
              <div>
                <span className="text-brand-200/50">Average Daily Rate (ADR):</span>
                <p className="font-mono text-base font-bold text-brand-50">{naira(currentReport.adr)}</p>
              </div>
              <div>
                <span className="text-brand-200/50">Revenue Per Avail. Room (RevPAR):</span>
                <p className="font-mono text-base font-bold text-brand-50">{naira(currentReport.revpar)}</p>
              </div>
              <div>
                <span className="text-brand-200/50">No-Show Bookings Processed:</span>
                <p className="font-mono text-base font-bold text-brand-50">{currentReport.noShowsCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Room & Tax Journal */}
        {activeReportTab === "room_tax" && (
          <div className="p-4">
            <p className="text-xs text-brand-200/70 mb-3">
              Detailed audit posting journal of individual nightly room rates, 7.5% VAT, and 10% service charges applied to guest folios.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-brand-800 bg-brand-900/60 text-brand-200/60 uppercase">
                  <tr>
                    <th className="p-3">Room #</th>
                    <th className="p-3">Guest Name</th>
                    <th className="p-3">Charge Code</th>
                    <th className="p-3">Base Room Rate</th>
                    <th className="p-3">7.5% VAT</th>
                    <th className="p-3">10% Svc Charge</th>
                    <th className="p-3">Total Posted</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-800/60">
                  {inHouseGuests.map((r) => {
                    const baseRate = r.ratePerNight ?? 110000;
                    const vat = Math.round(baseRate * 0.075);
                    const sc = Math.round(baseRate * 0.10);
                    const total = baseRate + vat + sc;
                    return (
                      <tr key={r.id} className="hover:bg-brand-900/30 text-brand-100">
                        <td className="p-3 font-mono font-bold text-gold-400">
                          Room {rooms.find((rm) => rm.id === r.roomId)?.number || "001"}
                        </td>
                        <td className="p-3">{r.guestName}</td>
                        <td className="p-3 font-mono text-[11px] text-brand-200/60">RM-NIGHT</td>
                        <td className="p-3 font-mono">{naira(baseRate)}</td>
                        <td className="p-3 font-mono">{naira(vat)}</td>
                        <td className="p-3 font-mono">{naira(sc)}</td>
                        <td className="p-3 font-mono font-semibold text-emerald-400">{naira(total)}</td>
                        <td className="p-3">
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold uppercase">
                            Posted
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 3: Trial Balance */}
        {activeReportTab === "trial_balance" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-800/60 pb-3">
              <div>
                <h4 className="font-display text-sm text-brand-50">General Ledger End-of-Day Trial Balance</h4>
                <p className="text-xs text-brand-200/60">Double-entry ledger debit & credit balance confirmation</p>
              </div>
              <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Trial Balance In Perfect Equilibrium
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-brand-800 bg-brand-900/60 text-brand-200/60 uppercase">
                  <tr>
                    <th className="p-3">GL Account Code</th>
                    <th className="p-3">Account Description</th>
                    <th className="p-3 text-right">Debit (₦)</th>
                    <th className="p-3 text-right">Credit (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-800/60 text-brand-100">
                  <tr>
                    <td className="p-3 font-mono text-gold-400">1100-01</td>
                    <td className="p-3">Guest Ledger (In-House Folio Receivables)</td>
                    <td className="p-3 text-right font-mono text-emerald-400">₦2,185,000.00</td>
                    <td className="p-3 text-right font-mono">-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-gold-400">1010-01</td>
                    <td className="p-3">Front Desk Cashier Drawer Vault</td>
                    <td className="p-3 text-right font-mono text-emerald-400">₦275,000.00</td>
                    <td className="p-3 text-right font-mono">-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-gold-400">1020-01</td>
                    <td className="p-3">POS Credit Card Clearing Account</td>
                    <td className="p-3 text-right font-mono text-emerald-400">₦1,650,000.00</td>
                    <td className="p-3 text-right font-mono">-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-gold-400">4100-01</td>
                    <td className="p-3">Room Revenue - Transient & Corporate</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono text-gold-300">₦1,850,000.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-gold-400">4200-01</td>
                    <td className="p-3">Food & Beverage Revenue (Palm Terrace & Bars)</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono text-gold-300">₦1,420,000.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-gold-400">2200-01</td>
                    <td className="p-3">VAT Payable (FIRS 7.5%)</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono text-gold-300">₦245,250.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-gold-400">2210-01</td>
                    <td className="p-3">Service Charge Payable (10% Staff Pool)</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono text-gold-300">₦327,000.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-gold-400">4900-01</td>
                    <td className="p-3">Miscellaneous Minor Dept Revenue</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono text-gold-300">₦267,750.00</td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-brand-700 bg-brand-900/70 font-mono font-bold text-xs">
                  <tr>
                    <td colSpan={2} className="p-3 text-brand-50">
                      TOTALS (TRIAL BALANCE BALANCED)
                    </td>
                    <td className="p-3 text-right text-emerald-400">₦4,110,000.00</td>
                    <td className="p-3 text-right text-emerald-400">₦4,110,000.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 4: Audit Archive */}
        {activeReportTab === "archive" && (
          <div className="divide-y divide-brand-800/60">
            {auditReports.map((report) => (
              <div
                key={report.id}
                onClick={() => {
                  setSelectedReportToView(report);
                  setActiveReportTab("flash");
                }}
                className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:bg-brand-900/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gold-400">{report.id}</span>
                    <span className="font-medium text-brand-50">Business Date: {report.businessDate}</span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 uppercase">
                      Balanced
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-brand-200/60">
                    Auditor: {report.auditorName} · Run At: {report.completedAt}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <p className="font-mono font-bold text-emerald-400 text-sm">
                    {naira(report.grandTotalRevenue)}
                  </p>
                  <p className="text-brand-200/50">{report.roomsCharged} rooms · {report.endingOccupancyRate}% Occ.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
