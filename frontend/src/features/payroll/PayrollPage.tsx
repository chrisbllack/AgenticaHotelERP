import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

const NGN = (n: number) => `₦${n.toLocaleString()}`;

interface PayrollRun {
  id: string; run_number: string; period_start: string; period_end: string;
  total_gross: number; total_deductions: number; total_net: number;
  status: string; created_at: string;
}

interface PayrollLine {
  employee_id: string; employee_name: string; employee_number: string; department: string;
  basic_salary: number; housing_allowance: number; transport_allowance: number;
  meal_allowance: number; other_allowance: number; bonus: number; gross_pay: number;
  income_tax: number; pension_employee: number; pension_employer: number; nhf: number;
  health_insurance: number; loan_deduction: number; total_deductions: number;
  net_pay: number; tax_band: string;
}

interface PayslipData {
  id: string; employee_name: string; employee_number: string; department: string;
  position: string; pay_period: string; payment_date: string; company_name: string;
  currency: string; basic_salary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  employer_contributions: { name: string; amount: number }[];
  gross_pay: number; total_allowances: number; total_deductions: number; net_pay: number;
  bank_name: string; bank_account: string;
}

interface PayrollReport {
  report_type: string; pay_period: string; total_gross: number; total_net: number;
  department_breakdown: { department: string; employee_count: number; gross_pay: number; paye: number; pension: number; nhf: number; net_pay: number }[];
  paye_schedule: { employee_number: string; name: string; gross_pay: number; paye: number; tax_band: string }[];
  pension_schedule: { employee_number: string; name: string; employee_contribution: number; employer_contribution: number; total_remittance: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', calculated: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', paid: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function PayrollPage() {
  const [tab, setTab] = useState<string>('Setup');
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [report, setReport] = useState<PayrollReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ housing_pct: 20, transport_pct: 10, meal_pct: 5 });

  const fetchRuns = useCallback(async () => {
    try {
      const res = await api.get('/hr/payroll/');
      setRuns(res.data?.data || []);
    } catch {}
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/hr/payroll/config');
      const d = res.data?.data;
      if (d) setConfig({ housing_pct: d.HousingPct || 20, transport_pct: d.TransportPct || 10, meal_pct: d.MealPct || 5 });
    } catch {}
  }, []);

  const runPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.post('/hr/payroll/run', {
        pay_period_start: '2026-09-01', pay_period_end: '2026-09-30', payment_date: '2026-09-30',
      });
      setLines(res.data?.data?.lines || []);
      fetchRuns();
      setTab('Review');
    } catch {}
    setLoading(false);
  };

  const approvePayroll = async (runId: string) => {
    try {
      await api.post(`/hr/payroll/${runId}/approve`);
      fetchRuns();
      if (selectedRun?.id === runId) setSelectedRun({ ...selectedRun, status: 'approved' });
    } catch {}
  };

  const processPayment = async (runId: string) => {
    try {
      await api.post(`/hr/payroll/${runId}/pay`);
      fetchRuns();
      if (selectedRun?.id === runId) setSelectedRun({ ...selectedRun, status: 'paid' });
    } catch {}
  };

  const loadPayslips = async (runId: string) => {
    try {
      const res = await api.get(`/hr/payroll/${runId}/payslips`);
      setPayslips(res.data?.data?.payslips || []);
    } catch {}
  };

  const loadReport = async (runId: string) => {
    try {
      const res = await api.get(`/hr/payroll/${runId}/report`);
      setReport(res.data?.data);
    } catch {}
  };

  const selectRun = async (run: PayrollRun) => {
    setSelectedRun(run);
    await Promise.all([loadPayslips(run.id), loadReport(run.id)]);
    setTab('Review');
  };

  useEffect(() => { fetchRuns(); fetchConfig(); }, [fetchRuns, fetchConfig]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">💰 Payroll Management</h1>
          <p className="text-gray-500 text-sm">Grand Palm Hotel Lagos — Employee Payroll & PAYE Compliance</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            📊 {runs.length} Payroll Runs
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {['Setup', 'Run Payroll', 'Review', 'Payslips', 'Reports', 'Bank Export', 'History'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}>{t}</button>
        ))}
      </div>

      {/* ═══ SETUP TAB (Easy 6-Step Flow) ═══ */}
      {tab === 'Setup' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <h2 className="text-lg font-bold mb-2">🚀 Easy Payroll Setup</h2>
            <p className="text-sm text-gray-600 mb-6">Follow these 6 simple steps to run your first payroll</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '01', icon: '👥', title: 'Employee Setup', desc: 'Add employee records with salary, allowances, deductions, department, role and bank details.', color: 'blue' },
                { step: '02', icon: '📅', title: 'Track Attendance', desc: 'Record attendance and leave for the month. Unpaid leave auto-deducted from salary.', color: 'green' },
                { step: '03', icon: '⚙️', title: 'Run Payroll', desc: 'Click Run Payroll. Gross pay, PAYE, pension, NHF and net pay calculated automatically.', color: 'purple' },
                { step: '04', icon: '📄', title: 'Generate Payslips', desc: 'Payslips generated for every employee showing gross, deductions and net pay.', color: 'yellow' },
                { step: '05', icon: '🏦', title: 'Bank Payment', desc: 'Export salary payment file for your bank or pay directly from the platform.', color: 'cyan' },
                { step: '06', icon: '📊', title: 'Payroll Reports', desc: 'Full payroll summary, PAYE schedule, pension schedule and cost-per-department reports.', color: 'orange' },
              ].map(s => (
                <div key={s.step} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-${s.color}-100 text-${s.color}-600 flex items-center justify-center font-bold text-sm`}>
                      {s.step}
                    </div>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Allowance Configuration */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-sm mb-4">⚙️ Payroll Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Housing Allowance (% of salary)</label>
                <input type="number" value={config.housing_pct} onChange={e => setConfig({ ...config, housing_pct: +e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Transport Allowance (% of salary)</label>
                <input type="number" value={config.transport_pct} onChange={e => setConfig({ ...config, transport_pct: +e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Meal Allowance (% of salary)</label>
                <input type="number" value={config.meal_pct} onChange={e => setConfig({ ...config, meal_pct: +e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-sm text-gray-600">Default: Housing 20% + Transport 10% + Meal 5% = <strong>35% of base salary</strong></div>
            </div>
          </div>

          {/* Tax Band Reference */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-sm mb-4">🇳🇬 Nigeria PAYE Tax Bands (2024/2025)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-gray-500 text-xs">
                  <th className="pb-2">Annual Income (₦)</th><th className="pb-2">Tax Rate</th><th className="pb-2">Description</th>
                </tr></thead>
                <tbody className="text-xs">
                  <tr className="border-b"><td className="py-2">Up to ₦300,000</td><td className="font-bold text-green-600">7%</td><td>First ₦300K</td></tr>
                  <tr className="border-b"><td className="py-2">₦300,001 – ₦600,000</td><td className="font-bold text-yellow-600">11%</td><td>Next ₦300K</td></tr>
                  <tr className="border-b"><td className="py-2">₦600,001 – ₦1,100,000</td><td className="font-bold text-orange-600">15%</td><td>Next ₦500K</td></tr>
                  <tr className="border-b"><td className="py-2">₦1,100,001 – ₦1,600,000</td><td className="font-bold text-red-400">19%</td><td>Next ₦500K</td></tr>
                  <tr className="border-b"><td className="py-2">₦1,600,001 – ₦3,200,000</td><td className="font-bold text-red-500">21%</td><td>Next ₦1.6M</td></tr>
                  <tr><td className="py-2">Above ₦3,200,000</td><td className="font-bold text-red-700">24%</td><td>Top rate</td></tr>
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 mt-2">* Personal relief of ₦200,000/year applied automatically</p>
            </div>
          </div>

          {/* Contributions Reference */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-sm mb-4">🏦 Pension & NHF Contributions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="font-bold text-blue-700 mb-1">Pension (PenCom)</div>
                <div>Employee: <strong>8%</strong> of gross (min ₦3,000/mo)</div>
                <div>Employer: <strong>10%</strong> of gross</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="font-bold text-green-700 mb-1">NHF</div>
                <div>Employee: <strong>2.5%</strong> of basic salary</div>
                <div>Deducted monthly, remitted to NHF Board</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="font-bold text-purple-700 mb-1">NHIS</div>
                <div>Employee: <strong>1.75%</strong> of basic</div>
                <div>Health insurance contribution</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RUN PAYROLL TAB ═══ */}
      {tab === 'Run Payroll' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border p-8 text-center">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-xl font-bold mb-2">Run September 2026 Payroll</h2>
            <p className="text-gray-500 text-sm mb-6">
              This will calculate PAYE, Pension, NHF, allowances and net pay for all 15 active employees.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>Pay Period:</div><div className="font-medium">01 Sep – 30 Sep 2026</div>
                <div>Payment Date:</div><div className="font-medium">30 Sep 2026</div>
                <div>Country:</div><div className="font-medium">Nigeria 🇳🇬</div>
                <div>Currency:</div><div className="font-medium">NGN (₦)</div>
                <div>Allowances:</div><div className="font-medium">Housing 20% + Transport 10% + Meal 5%</div>
                <div>Tax System:</div><div className="font-medium">PAYE (6 bands, ₦200K relief)</div>
              </div>
            </div>

            <button onClick={runPayroll} disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? '⏳ Calculating...' : '🚀 Run Payroll Now'}
            </button>
            <p className="text-[10px] text-gray-400 mt-3">Calculates automatically: Gross → PAYE → Pension → NHF → NHIS → Net Pay</p>
          </div>
        </div>
      )}

      {/* ═══ REVIEW TAB ═══ */}
      {tab === 'Review' && (
        <div className="space-y-4">
          {lines.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{NGN(lines.reduce((s, l) => s + l.gross_pay, 0))}</div>
                  <div className="text-[10px] text-gray-500">Total Gross</div>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{NGN(lines.reduce((s, l) => s + l.income_tax, 0))}</div>
                  <div className="text-[10px] text-gray-500">Total PAYE</div>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <div className="text-xl font-bold text-orange-600">{NGN(lines.reduce((s, l) => s + l.pension_employee, 0))}</div>
                  <div className="text-[10px] text-gray-500">Total Pension</div>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <div className="text-xl font-bold text-yellow-600">{NGN(lines.reduce((s, l) => s + l.nhf, 0))}</div>
                  <div className="text-[10px] text-gray-500">Total NHF</div>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{NGN(lines.reduce((s, l) => s + l.net_pay, 0))}</div>
                  <div className="text-[10px] text-gray-500">Total Net Pay</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 border-b text-left">
                      <th className="p-3">Employee</th><th className="p-3">Basic Salary</th>
                      <th className="p-3">Allowances</th><th className="p-3">Bonus</th>
                      <th className="p-3">Gross Pay</th><th className="p-3">PAYE</th>
                      <th className="p-3">Pension</th><th className="p-3">NHF</th>
                      <th className="p-3">NHIS</th><th className="p-3">Total Ded.</th>
                      <th className="p-3">Net Pay</th><th className="p-3">Tax Band</th>
                    </tr></thead>
                    <tbody>
                      {lines.map(l => (
                        <tr key={l.employee_id} className="border-b hover:bg-gray-50">
                          <td className="p-3"><div className="font-medium">{l.employee_name}</div><div className="text-gray-400">{l.employee_number}</div></td>
                          <td className="p-3">{NGN(l.basic_salary)}</td>
                          <td className="p-3">{NGN(l.housing_allowance + l.transport_allowance + l.meal_allowance)}</td>
                          <td className="p-3">{l.bonus > 0 ? NGN(l.bonus) : '—'}</td>
                          <td className="p-3 font-bold">{NGN(l.gross_pay)}</td>
                          <td className="p-3 text-red-600">-{NGN(l.income_tax)}</td>
                          <td className="p-3 text-orange-600">-{NGN(l.pension_employee)}</td>
                          <td className="p-3 text-yellow-600">-{NGN(l.nhf)}</td>
                          <td className="p-3 text-gray-600">-{NGN(l.health_insurance)}</td>
                          <td className="p-3 font-medium text-red-600">-{NGN(l.total_deductions)}</td>
                          <td className="p-3 font-bold text-green-600">{NGN(l.net_pay)}</td>
                          <td className="p-3"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{l.tax_band}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : selectedRun ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-bold mb-2">{selectedRun.run_number}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedRun.period_start} to {selectedRun.period_end} • {selectedRun.status}
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div><div className="text-lg font-bold">{NGN(selectedRun.total_gross)}</div><div className="text-xs text-gray-400">Gross</div></div>
                <div><div className="text-lg font-bold text-red-600">{NGN(selectedRun.total_deductions)}</div><div className="text-xs text-gray-400">Deductions</div></div>
                <div><div className="text-lg font-bold text-green-600">{NGN(selectedRun.total_net)}</div><div className="text-xs text-gray-400">Net Pay</div></div>
              </div>
              <div className="flex gap-2 justify-center">
                {selectedRun.status === 'calculated' && (
                  <button onClick={() => approvePayroll(selectedRun.id)} className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">✅ Approve</button>
                )}
                {selectedRun.status === 'approved' && (
                  <button onClick={() => processPayment(selectedRun.id)} className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">💳 Process Payment</button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-2">👈</div>
              <div>Select a payroll run from History, or run a new payroll</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PAYSLIPS TAB ═══ */}
      {tab === 'Payslips' && (
        <div className="space-y-4">
          {selectedPayslip ? (
            <div className="bg-white rounded-2xl border p-8 max-w-2xl mx-auto">
              <button onClick={() => setSelectedPayslip(null)} className="text-blue-600 text-sm mb-4 hover:underline">← Back to list</button>
              <div className="text-center mb-6 border-b pb-4">
                <h2 className="text-lg font-bold">{selectedPayslip.company_name}</h2>
                <p className="text-sm text-gray-500">Payslip</p>
                <p className="text-xs text-gray-400 mt-1">Pay Period: {selectedPayslip.pay_period}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Employee:</span> <strong>{selectedPayslip.employee_name}</strong></div>
                <div><span className="text-gray-500">Number:</span> {selectedPayslip.employee_number}</div>
                <div><span className="text-gray-500">Department:</span> {selectedPayslip.department}</div>
                <div><span className="text-gray-500">Position:</span> {selectedPayslip.position}</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="text-sm font-bold mb-2">💰 Earnings</div>
                <div className="flex justify-between text-sm py-1"><span>Basic Salary</span><span className="font-medium">{NGN(selectedPayslip.basic_salary)}</span></div>
                {selectedPayslip.allowances.map((a, i) => (
                  <div key={i} className="flex justify-between text-sm py-1"><span>{a.name}</span><span>{NGN(a.amount)}</span></div>
                ))}
                <div className="flex justify-between text-sm py-1 border-t mt-1 pt-2"><span className="font-bold">Gross Pay</span><span className="font-bold">{NGN(selectedPayslip.gross_pay)}</span></div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 mb-4">
                <div className="text-sm font-bold mb-2">📉 Deductions</div>
                {selectedPayslip.deductions.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-1"><span>{d.name}</span><span className="text-red-600">-{NGN(d.amount)}</span></div>
                ))}
                <div className="flex justify-between text-sm py-1 border-t mt-1 pt-2"><span className="font-bold">Total Deductions</span><span className="font-bold text-red-600">-{NGN(selectedPayslip.total_deductions)}</span></div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-lg"><span className="font-bold">Net Pay</span><span className="font-bold text-green-700">{NGN(selectedPayslip.net_pay)}</span></div>
              </div>

              <div className="text-xs text-gray-400 text-center">
                Bank: {selectedPayslip.bank_name || 'N/A'} • Account: {selectedPayslip.bank_account || 'N/A'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {payslips.map(p => (
                <div key={p.id} onClick={() => setSelectedPayslip(p)}
                  className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm">{p.employee_name}</div>
                    <span className="text-[10px] text-gray-400">{p.employee_number}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{p.department}</div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Gross:</span><span>{NGN(p.gross_pay)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Deductions:</span><span className="text-red-600">-{NGN(p.total_deductions)}</span></div>
                  <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t"><span>Net Pay:</span><span className="text-green-600">{NGN(p.net_pay)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ REPORTS TAB ═══ */}
      {tab === 'Reports' && report && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xl font-bold text-blue-600">{NGN(report.total_gross)}</div>
              <div className="text-[10px] text-gray-500">Total Gross</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xl font-bold text-red-600">{NGN(report.department_breakdown?.[0]?.paye || 0)}</div>
              <div className="text-[10px] text-gray-500">Total PAYE</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xl font-bold text-orange-600">{NGN(report.department_breakdown?.[0]?.pension || 0)}</div>
              <div className="text-[10px] text-gray-500">Total Pension</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xl font-bold text-green-600">{NGN(report.total_net)}</div>
              <div className="text-[10px] text-gray-500">Total Net Pay</div>
            </div>
          </div>

          {/* PAYE Schedule */}
          {report.paye_schedule && report.paye_schedule.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-bold text-sm mb-3">🧾 PAYE Schedule (FIRS/LIRS)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-left text-gray-500">
                    <th className="p-2">S/N</th><th className="p-2">Employee</th>
                    <th className="p-2">Annual Gross</th><th className="p-2">Monthly PAYE</th><th className="p-2">Band</th>
                  </tr></thead>
                  <tbody>
                    {report.paye_schedule.filter(p => p.name).map((p, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 font-medium">{p.name} ({p.employee_number})</td>
                        <td className="p-2">{NGN(p.gross_pay)}</td>
                        <td className="p-2 font-bold text-red-600">{NGN(p.paye)}</td>
                        <td className="p-2"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{p.tax_band}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pension Schedule */}
          {report.pension_schedule && report.pension_schedule.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-bold text-sm mb-3">🏦 Pension Remittance Schedule (PenCom)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-left text-gray-500">
                    <th className="p-2">S/N</th><th className="p-2">Employee</th>
                    <th className="p-2">Employee (8%)</th><th className="p-2">Employer (10%)</th><th className="p-2">Total Remittance</th>
                  </tr></thead>
                  <tbody>
                    {report.pension_schedule.filter(p => p.name).map((p, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 font-medium">{p.name} ({p.employee_number})</td>
                        <td className="p-2">{NGN(p.employee_contribution)}</td>
                        <td className="p-2">{NGN(p.employer_contribution)}</td>
                        <td className="p-2 font-bold text-orange-600">{NGN(p.total_remittance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BANK EXPORT TAB ═══ */}
      {tab === 'Bank Export' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border p-8 text-center">
            <div className="text-5xl mb-4">🏦</div>
            <h2 className="text-xl font-bold mb-2">Bank Payment File Export</h2>
            <p className="text-sm text-gray-500 mb-6">Export salary payment file in NIP/NEFT CSV format for your bank</p>
            {selectedRun ? (
              <div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-left">
                  <div className="flex justify-between"><span>Run:</span><strong>{selectedRun.run_number}</strong></div>
                  <div className="flex justify-between"><span>Period:</span>{selectedRun.period_start} to {selectedRun.period_end}</div>
                  <div className="flex justify-between"><span>Net Pay:</span><strong className="text-green-600">{NGN(selectedRun.total_net)}</strong></div>
                </div>
                <a href={`http://127.0.0.1:8080/api/v1/hr/payroll/${selectedRun.id}/export`}
                   className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">
                  📥 Download Bank Payment File (CSV)
                </a>
              </div>
            ) : (
              <p className="text-gray-400">Select a payroll run from History first</p>
            )}
          </div>
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === 'History' && (
        <div className="space-y-3">
          {runs.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-2">📋</div>
              <div>No payroll runs yet. Run your first payroll!</div>
            </div>
          ) : runs.map(run => (
            <div key={run.id} onClick={() => selectRun(run)}
              className="bg-white rounded-xl border p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-sm">
                  {run.run_number.slice(-4)}
                </div>
                <div>
                  <div className="font-bold text-sm">{run.run_number}</div>
                  <div className="text-xs text-gray-500">{run.period_start} to {run.period_end}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="font-bold">{NGN(run.total_net)}</div>
                  <div className="text-xs text-gray-400">net pay</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[run.status] || 'bg-gray-100'}`}>
                  {run.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
