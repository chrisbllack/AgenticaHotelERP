import { useMemo } from "react";
import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { departments, employees } from "../data/demo";
import { naira, num, initials } from "../lib/utils";

const LEAVE_ROWS: Array<{ employeeId: string; type: string; days: string; status: "approved" | "pending" | "rejected" }> = [
  { employeeId: "emp-EMP-002", type: "Annual Leave", days: "Sep 14 – Sep 21 (7d)", status: "approved" },
  { employeeId: "emp-EMP-005", type: "Casual Leave", days: "Sep 09 (1d)", status: "pending" },
  { employeeId: "emp-EMP-008", type: "Sick Leave", days: "Sep 02 – Sep 03 (2d)", status: "approved" },
  { employeeId: "emp-EMP-010", type: "Annual Leave", days: "Oct 01 – Oct 14 (10d)", status: "pending" },
  { employeeId: "emp-EMP-006", type: "Maternity", days: "From Nov 01 (90d)", status: "approved" },
];

const ATTENDANCE = [
  { label: "Clocked in today", value: "13 / 15", hint: "2 pending shift start" },
  { label: "Late arrivals (>15m)", value: "1", hint: "EMP-005 · Front Office" },
  { label: "Overtime hours (week)", value: "18.5h", hint: "Engineering 12h, Kitchen 6.5h" },
  { label: "Biometric punches", value: "94%", hint: "ZKTeco device back online" },
];

export default function HrPage() {
  const payrollTotal = useMemo(() => employees.reduce((a, e) => a + e.salary, 0), []);
  const byDept = useMemo(
    () =>
      departments
        .map((d) => ({ dept: d, count: employees.filter((e) => e.departmentId === d.id).length, cost: employees.filter((e) => e.departmentId === d.id).reduce((a, e) => a + e.salary, 0) }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count),
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Workforce" subtitle="Employees · attendance · leave · payroll — demand-driven scheduling roadmap P015" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Headcount" value={String(employees.length)} sub={`${departments.length} departments`} />
        <StatCard label="Monthly Payroll" value={naira(payrollTotal, true)} sub="gross, before deductions" accent="gold" />
        <StatCard label="On Leave (wk)" value={String(LEAVE_ROWS.filter((l) => l.status === "approved").length)} sub="approved absences" accent="sky" />
        <StatCard label="Leave Requests" value={String(LEAVE_ROWS.filter((l) => l.status === "pending").length)} sub="awaiting approval" accent="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Employee Register" subtitle="Active staff by department" />
          <Table head={["Employee", "Dept", "Position", "Monthly Salary"]}>
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-brand-800/30">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700/70 text-xs font-semibold text-brand-50">
                      {initials(e.firstName, e.lastName)}
                    </span>
                    <div>
                      <p className="font-medium text-brand-50">{e.firstName} {e.lastName}</p>
                      <p className="text-xs text-brand-200/50">{e.employeeNumber}</p>
                    </div>
                  </div>
                </Td>
                <Td>{departments.find((d) => d.id === e.departmentId)?.name}</Td>
                <Td>{e.position}</Td>
                <Td>{naira(e.salary)}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Attendance Today" subtitle="Biometric & shift adherence" />
            <ul className="divide-y divide-brand-800/40">
              {ATTENDANCE.map((a) => (
                <li key={a.label} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-brand-100/90">{a.label}</p>
                    <p className="text-sm font-semibold text-brand-50">{a.value}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-brand-200/50">{a.hint}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Department Mix" subtitle="Headcount & cost concentration" />
            <ul className="divide-y divide-brand-800/40">
              {byDept.map(({ dept, count, cost }) => (
                <li key={dept.id} className="px-5 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-100/90">{dept.name}</span>
                    <span className="text-brand-200/70">{count} · {naira(cost, true)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-950">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-500" style={{ width: `${(count / employees.length) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Leave Board" subtitle="Requests & balances with workflow status" />
          <Table head={["Employee", "Type", "Period", "Status"]}>
            {LEAVE_ROWS.map((l, i) => {
              const e = employees.find((x) => x.id === l.employeeId);
              return (
                <tr key={i} className="hover:bg-brand-800/30">
                  <Td>{e?.firstName} {e?.lastName}</Td>
                  <Td>{l.type}</Td>
                  <Td>{l.days}</Td>
                  <Td>
                    <Badge className={l.status === "approved" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : l.status === "pending" ? "border-amber-400/40 bg-amber-500/10 text-amber-200" : "border-rose-400/40 bg-rose-500/10 text-rose-200"}>
                      {l.status}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>
        <Card>
          <CardHeader title="Payroll Run — September 2026" subtitle="Preview → approve → pay lifecycle" />
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-200/70">Gross payroll</span>
              <span className="text-brand-50">{naira(payrollTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-200/70">Statutory deductions (est. 12%)</span>
              <span className="text-rose-300">-{naira(payrollTotal * 0.12)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-200/70">Net pay</span>
              <span className="font-display text-lg text-gold-400">{naira(payrollTotal * 0.88)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-brand-800/70 pt-3 text-sm">
              <span className="text-brand-200/70">Staff count</span>
              <span className="text-brand-50">{num(employees.length)} employees</span>
            </div>
            <div className="rounded-lg border border-brand-800/70 bg-brand-950/50 px-3 py-2.5 text-xs text-brand-200/60">
              Lifecycle status: <span className="text-gold-300">preview</span> → approve → pay · GL posting to
              M-FIN on approval · bank file in country format adapter
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
