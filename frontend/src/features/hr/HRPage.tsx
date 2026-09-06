import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_name: string;
  position: string;
  employment_date: string;
  employment_type: string;
  status: string;
  salary: number;
  leave_balance: number;
}

interface Attendance {
  id: string;
  employee_id: string;
  employee_name: string;
  attendance_date: string;
  clock_in: string;
  clock_out: string;
  hours_worked: number;
  overtime_hours: number;
  status: string;
  late_minutes: number;
}

interface PayrollRun {
  id: string;
  run_name: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  status: string;
}

type Tab = 'employees' | 'attendance' | 'leave' | 'payroll';

export default function HRPage() {
  const [tab, setTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empForm, setEmpForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', position: '',
    employment_date: new Date().toISOString().split('T')[0], employment_type: 'full_time',
    salary: 0, currency_code: 'NGN'
  });

  useEffect(() => { loadTabData(); }, [tab]);

  async function loadTabData() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('infineon_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' };
      
      switch (tab) {
        case 'employees': {
          const res = await fetch(`${API_BASE}/hr/employees`, { headers });
          if (res.ok) { const d = await res.json(); setEmployees(d.data || []); }
          break;
        }
        case 'attendance': {
          const res = await fetch(`${API_BASE}/hr/attendance`, { headers });
          if (res.ok) { const d = await res.json(); setAttendance(d.data || []); }
          break;
        }
        case 'payroll': {
          const res = await fetch(`${API_BASE}/hr/payroll`, { headers });
          if (res.ok) { const d = await res.json(); setPayrollRuns(d.data || []); }
          break;
        }
      }
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('infineon_token');
    const res = await fetch(`${API_BASE}/hr/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' },
      body: JSON.stringify(empForm)
    });
    if (res.ok) {
      setShowEmployeeForm(false);
      setEmpForm({ first_name: '', last_name: '', email: '', phone: '', position: '', employment_date: new Date().toISOString().split('T')[0], employment_type: 'full_time', salary: 0, currency_code: 'NGN' });
      loadTabData();
    }
  }

  async function createPayrollRun() {
    if (!confirm('Create a new payroll run for the current period?')) return;
    const token = localStorage.getItem('infineon_token');
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const res = await fetch(`${API_BASE}/hr/payroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' },
      body: JSON.stringify({
        run_name: `Payroll ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        pay_period_start: monthStart,
        pay_period_end: monthEnd,
        payment_date: monthEnd
      })
    });
    if (res.ok) loadTabData();
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'employees', label: 'Employees', icon: '👥' },
    { key: 'attendance', label: 'Attendance', icon: '⏰' },
    { key: 'leave', label: 'Leave', icon: '🏖️' },
    { key: 'payroll', label: 'Payroll', icon: '💰' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Human Resources</h1>
        <p className="text-sm text-gray-500">Employees, Attendance, Leave, Payroll</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.icon} {t.label}</button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Employees */}
          {tab === 'employees' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ Add Employee</button>
              </div>

              {showEmployeeForm && (
                <form onSubmit={createEmployee} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">New Employee</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input type="text" value={empForm.first_name} onChange={e => setEmpForm({ ...empForm, first_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input type="text" value={empForm.last_name} onChange={e => setEmpForm({ ...empForm, last_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                      <input type="text" value={empForm.position} onChange={e => setEmpForm({ ...empForm, position: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Date *</label>
                      <input type="date" value={empForm.employment_date} onChange={e => setEmpForm({ ...empForm, employment_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select value={empForm.employment_type} onChange={e => setEmpForm({ ...empForm, employment_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="temporary">Temporary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                      <input type="number" step="0.01" value={empForm.salary || ''} onChange={e => setEmpForm({ ...empForm, salary: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select value={empForm.currency_code} onChange={e => setEmpForm({ ...empForm, currency_code: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="USD">USD</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="GHS">GHS (GH₵)</option>
                        <option value="KES">KES (KSh)</option>
                        <option value="ZAR">ZAR (R)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create Employee</button>
                    <button type="button" onClick={() => setShowEmployeeForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salary</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Bal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{emp.employee_number}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.position}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.department_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">₦{emp.salary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{emp.employment_type.replace('_', ' ')}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            emp.status === 'active' ? 'bg-green-100 text-green-800' :
                            emp.status === 'terminated' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}>{emp.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-center">{emp.leave_balance}</td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">No employees yet. Click "Add Employee" to start.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance */}
          {tab === 'attendance' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Late (min)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendance.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.employee_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.attendance_date}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : '—'}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{a.hours_worked.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-blue-600">{a.overtime_hours > 0 ? a.overtime_hours.toFixed(1) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            a.status === 'present' ? 'bg-green-100 text-green-800' :
                            a.status === 'absent' ? 'bg-red-100 text-red-800' :
                            a.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-orange-600">{a.late_minutes > 0 ? a.late_minutes : '—'}</td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">No attendance records for today.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leave */}
          {tab === 'leave' && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">🏖️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Leave Management</h3>
              <p className="text-gray-500 text-sm">Request and manage employee leave. Leave types: Annual, Sick, Maternity, Paternity, Compassionate.</p>
            </div>
          )}

          {/* Payroll */}
          {tab === 'payroll' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={createPayrollRun}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">+ Run Payroll</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payrollRuns.map(pr => (
                      <tr key={pr.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{pr.run_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pr.pay_period_start} — {pr.pay_period_end}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pr.payment_date}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">₦{pr.total_gross.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-red-600">₦{pr.total_deductions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-green-700">₦{pr.total_net.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            pr.status === 'paid' ? 'bg-green-100 text-green-800' :
                            pr.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{pr.status}</span>
                        </td>
                      </tr>
                    ))}
                    {payrollRuns.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">No payroll runs yet. Click "Run Payroll" to create one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
