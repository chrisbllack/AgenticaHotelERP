import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { auditLog, journalEntries, rooms } from "../data/demo";
import { usePlatform } from "../store/platform";
import { naira, fmtDateTime } from "../lib/utils";
import { Download, FileSpreadsheet, ScrollText } from "lucide-react";

const REPORTS = [
  ["Daily Revenue Report", "Rooms, F&B and other-operated revenue by business date"],
  ["Night Audit Trail", "Automated rollup log with exceptions and reversals"],
  ["Occupancy Forecast", "30-day on-the-books vs same-time last month"],
  ["F&B Item Sales Mix", "Menu item velocity, contribution and waste"],
  ["Stock Valuation", "Store-by-store inventory value at cost"],
  ["Accounts Receivable Aging", "City ledger balances by 30/60/90 buckets"],
  ["Payroll Summary", "Department payroll cost with variance to budget"],
  ["Channel Production", "Reservations and revenue by distribution source"],
];

export default function ReportsPage() {
  const { reservations, orders } = usePlatform();
  const roomRevenue = reservations
    .filter((r) => r.status === "checked_in")
    .reduce((a, r) => a + r.totalEstimate / Math.max(r.nights, 1), 0);
  const fnbRevenue = orders.reduce((a, o) => a + o.total, 0);
  const posted = journalEntries.filter((j) => j.status === "posted");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Audit"
        subtitle="M-BUS · operational reporting and the immutable platform audit trail"
        actions={
          <button className="flex items-center gap-2 rounded-lg border border-brand-700 px-4 py-2 text-sm text-brand-100 transition-colors hover:border-brand-500">
            <Download size={14} /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Room revenue run-rate" value={naira(roomRevenue, true)} sub="per business day" accent="gold" />
        <StatCard label="F&B revenue (session)" value={naira(fnbRevenue, true)} sub={`${orders.length} POS orders`} accent="emerald" />
        <StatCard label="GL journals" value={`${posted.length}/${journalEntries.length}`} sub="posted / total" />
        <StatCard label="Audit events" value={String(auditLog.length)} sub="last 24 hours" accent="sky" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Standard Report Library" subtitle="Every report is exportable and scheduleable" />
          <ul className="divide-y divide-brand-800/50">
            {REPORTS.map(([name, desc]) => (
              <li key={name} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-800/30">
                <FileSpreadsheet size={15} className="flex-none text-gold-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-50">{name}</p>
                  <p className="text-[11px] text-brand-200/50">{desc}</p>
                </div>
                <button className="ml-auto flex-none rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-100 hover:border-gold-500/50 hover:text-gold-300">
                  Run
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Journal Entries" subtitle="Night audit and manual postings — posting status live" />
          <Table head={["Entry", "Date", "Description", "Status"]}>
            {journalEntries.map((j) => (
              <tr key={j.id} className="hover:bg-brand-800/30">
                <Td><span className="font-mono text-xs text-gold-300">{j.entryNumber}</span></Td>
                <Td>{j.entryDate}</Td>
                <Td className="max-w-[240px] truncate text-xs">{j.description}</Td>
                <Td>
                  <Badge
                    className={
                      j.status === "posted"
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                        : "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    }
                  >
                    {j.status}
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Card>
        <CardHeader title="Platform Audit Trail" subtitle="Immutable action log — who did what, where and when" />
        <Table head={["When", "User", "Module", "Action", "Entity"]}>
          {auditLog.map((l) => (
            <tr key={l.id} className="hover:bg-brand-800/30">
              <Td>{fmtDateTime(l.createdAt)}</Td>
              <Td>{l.userName}</Td>
              <Td><span className="font-mono text-xs text-brand-100/70">{l.module}</span></Td>
              <Td><span className="text-xs text-gold-300">{l.action}</span></Td>
              <Td><span className="font-mono text-xs text-brand-200/60">{l.entityId}</span></Td>
            </tr>
          ))}
        </Table>
        <p className="flex items-center gap-2 border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
          <ScrollText size={13} /> Audit entries are append-only and retained 7 years — aligned with the compliance baseline.
        </p>
      </Card>

      <div className="text-xs text-brand-200/40">
        Room rack state: {rooms.length} rooms tracked · reporting dataset mirrors migrations 0001–0014.
      </div>
    </div>
  );
}
