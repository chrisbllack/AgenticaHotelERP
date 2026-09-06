import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

interface AccountClass {
  id: string;
  code: string;
  name: string;
  is_system: boolean;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_class: string;
  account_class_name: string;
  account_type: string;
  normal_balance: string;
  is_active: boolean;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  business_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  lines?: JournalLine[];
}

interface JournalLine {
  id: string;
  line_number: number;
  account_id: string;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
}

interface ARInvoice {
  id: string;
  invoice_number: string;
  guest_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
}

interface APInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
}

interface PLLine {
  account_code: string;
  account_name: string;
  amount: number;
}

interface PLReport {
  revenue: PLLine[];
  cost_of_sales: PLLine[];
  expenses: PLLine[];
  total_revenue: number;
  total_cost_of_sales: number;
  gross_profit: number;
  total_expenses: number;
  net_income: number;
}

type Tab = 'accounts' | 'journal' | 'ar' | 'ap' | 'budgets' | 'pnl';

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountClasses, setAccountClasses] = useState<AccountClass[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [arInvoices, setArInvoices] = useState<ARInvoice[]>([]);
  const [apInvoices, setApInvoices] = useState<APInvoice[]>([]);
  const [plReport, setPlReport] = useState<PLReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [accountForm, setAccountForm] = useState({ account_code: '', account_name: '', account_class: '', description: '', normal_balance: 'debit', account_type: 'detail' });
  const [journalForm, setJournalForm] = useState({ entry_date: new Date().toISOString().split('T')[0], business_date: new Date().toISOString().split('T')[0], description: '', lines: [
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
  ]});

  useEffect(() => {
    loadTabData();
  }, [tab]);

  async function loadTabData() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('infineon_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' };
      
      switch (tab) {
        case 'accounts': {
          const [acRes, accRes] = await Promise.all([
            fetch(`${API_BASE}/finance/accounts/classes`, { headers }),
            fetch(`${API_BASE}/finance/accounts`, { headers })
          ]);
          if (acRes.ok) { const d = await acRes.json(); setAccountClasses(d.data || []); }
          if (accRes.ok) { const d = await accRes.json(); setAccounts(d.data || []); }
          break;
        }
        case 'journal': {
          const res = await fetch(`${API_BASE}/finance/journal`, { headers });
          if (res.ok) { const d = await res.json(); setJournalEntries(d.data || []); }
          break;
        }
        case 'ar': {
          const res = await fetch(`${API_BASE}/finance/ar`, { headers });
          if (res.ok) { const d = await res.json(); setArInvoices(d.data || []); }
          break;
        }
        case 'ap': {
          const res = await fetch(`${API_BASE}/finance/ap`, { headers });
          if (res.ok) { const d = await res.json(); setApInvoices(d.data || []); }
          break;
        }
        case 'pnl': {
          const res = await fetch(`${API_BASE}/finance/profit-loss`, { headers });
          if (res.ok) { const d = await res.json(); setPlReport(d.data); }
          break;
        }
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('infineon_token');
      const res = await fetch(`${API_BASE}/finance/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' },
        body: JSON.stringify(accountForm)
      });
      if (res.ok) {
        setShowAccountForm(false);
        setAccountForm({ account_code: '', account_name: '', account_class: '', description: '', normal_balance: 'debit', account_type: 'detail' });
        loadTabData();
      }
    } catch { setError('Failed to create account'); }
  }

  async function createJournalEntry(e: React.FormEvent) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('infineon_token');
      const res = await fetch(`${API_BASE}/finance/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' },
        body: JSON.stringify(journalForm)
      });
      if (res.ok) {
        setShowJournalForm(false);
        loadTabData();
      }
    } catch { setError('Failed to create journal entry'); }
  }

  async function postJournalEntry(id: string) {
    if (!confirm('Post this journal entry?')) return;
    const token = localStorage.getItem('infineon_token');
    await fetch(`${API_BASE}/finance/journal/${id}/post`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' }
    });
    loadTabData();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'accounts', label: 'Chart of Accounts' },
    { key: 'journal', label: 'Journal Entries' },
    { key: 'ar', label: 'Accounts Receivable' },
    { key: 'ap', label: 'Accounts Payable' },
    { key: 'budgets', label: 'Budgets' },
    { key: 'pnl', label: 'Profit & Loss' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Accounting</h1>
          <p className="text-sm text-gray-500">Chart of Accounts, General Ledger, Receivables, Payables</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Chart of Accounts */}
          {tab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowAccountForm(!showAccountForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                  + New Account
                </button>
              </div>

              {showAccountForm && (
                <form onSubmit={createAccount} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">New Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Code</label>
                      <input type="text" value={accountForm.account_code} onChange={e => setAccountForm({ ...accountForm, account_code: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 1000" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                      <input type="text" value={accountForm.account_name} onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Class</label>
                      <select value={accountForm.account_class} onChange={e => setAccountForm({ ...accountForm, account_class: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                        <option value="">Select class...</option>
                        {accountClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Normal Balance</label>
                      <select value={accountForm.normal_balance} onChange={e => setAccountForm({ ...accountForm, normal_balance: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input type="text" value={accountForm.description} onChange={e => setAccountForm({ ...accountForm, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create Account</button>
                    <button type="button" onClick={() => setShowAccountForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {accounts.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{a.account_code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{a.account_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.account_class_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{a.normal_balance}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {a.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {accounts.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">No accounts configured. Click "New Account" to get started.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Journal Entries */}
          {tab === 'journal' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowJournalForm(!showJournalForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                  + New Journal Entry
                </button>
              </div>

              {showJournalForm && (
                <form onSubmit={createJournalEntry} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">New Journal Entry</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entry Date</label>
                      <input type="date" value={journalForm.entry_date} onChange={e => setJournalForm({ ...journalForm, entry_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Date</label>
                      <input type="date" value={journalForm.business_date} onChange={e => setJournalForm({ ...journalForm, business_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input type="text" value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Journal Lines</h4>
                    <div className="space-y-2">
                      {journalForm.lines.map((line, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 items-end">
                          <select value={line.account_id} onChange={e => {
                            const newLines = [...journalForm.lines];
                            newLines[i].account_id = e.target.value;
                            setJournalForm({ ...journalForm, lines: newLines });
                          }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Account...</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
                          </select>
                          <input type="text" placeholder="Description" value={line.description} onChange={e => {
                            const newLines = [...journalForm.lines];
                            newLines[i].description = e.target.value;
                            setJournalForm({ ...journalForm, lines: newLines });
                          }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                          <input type="number" step="0.01" placeholder="Debit" value={line.debit_amount || ''} onChange={e => {
                            const newLines = [...journalForm.lines];
                            newLines[i].debit_amount = parseFloat(e.target.value) || 0;
                            setJournalForm({ ...journalForm, lines: newLines });
                          }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                          <input type="number" step="0.01" placeholder="Credit" value={line.credit_amount || ''} onChange={e => {
                            const newLines = [...journalForm.lines];
                            newLines[i].credit_amount = parseFloat(e.target.value) || 0;
                            setJournalForm({ ...journalForm, lines: newLines });
                          }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setJournalForm({ ...journalForm, lines: [...journalForm.lines, { account_id: '', description: '', debit_amount: 0, credit_amount: 0 }] })}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800">+ Add Line</button>
                  </div>

                  <div className="flex space-x-3">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create Entry</button>
                    <button type="button" onClick={() => setShowJournalForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {journalEntries.map(je => (
                      <tr key={je.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{je.entry_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{je.entry_date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{je.description}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-mono">₦{je.total_debit.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-mono">₦{je.total_credit.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            je.status === 'posted' ? 'bg-green-100 text-green-800' :
                            je.status === 'voided' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{je.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {je.status === 'draft' && (
                            <button onClick={() => postJournalEntry(je.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium">Post</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {journalEntries.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">No journal entries yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Accounts Receivable */}
          {tab === 'ar' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Accounts Receivable</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {arInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{inv.guest_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.invoice_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.due_date}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">₦{inv.total_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">₦{inv.paid_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-red-600">₦{inv.balance.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                  {arInvoices.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">No AR invoices.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Accounts Payable */}
          {tab === 'ap' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Accounts Payable</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {apInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{inv.supplier_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.invoice_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.due_date}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">₦{inv.total_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">₦{inv.paid_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-orange-600">₦{inv.balance.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                  {apInvoices.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">No AP invoices.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Budgets placeholder */}
          {tab === 'budgets' && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Management</h3>
              <p className="text-gray-500 text-sm">Create budgets by department and account, then track budget vs actual variance.</p>
            </div>
          )}

          {/* P&L Report */}
          {tab === 'pnl' && plReport && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-6">Profit & Loss Statement</h3>
                
                {/* Revenue */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Revenue</h4>
                  {plReport.revenue.map((r, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-sm">
                      <span className="text-gray-700">{r.account_code} - {r.account_name}</span>
                      <span className="font-mono text-gray-900">₦{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t border-gray-200 font-semibold text-sm">
                    <span className="text-gray-900">Total Revenue</span>
                    <span className="font-mono text-green-700">₦{plReport.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Cost of Sales */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Cost of Sales</h4>
                  {plReport.cost_of_sales.map((c, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-sm">
                      <span className="text-gray-700">{c.account_code} - {c.account_name}</span>
                      <span className="font-mono text-gray-900">₦{c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t border-gray-200 font-semibold text-sm">
                    <span className="text-gray-900">Total Cost of Sales</span>
                    <span className="font-mono text-red-700">₦{plReport.total_cost_of_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between py-3 border-t-2 border-gray-300 font-bold">
                  <span className="text-gray-900">Gross Profit</span>
                  <span className="font-mono text-gray-900">₦{plReport.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Expenses */}
                <div className="mt-6 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Operating Expenses</h4>
                  {plReport.expenses.map((e, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-sm">
                      <span className="text-gray-700">{e.account_code} - {e.account_name}</span>
                      <span className="font-mono text-gray-900">₦{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t border-gray-200 font-semibold text-sm">
                    <span className="text-gray-900">Total Expenses</span>
                    <span className="font-mono text-red-700">₦{plReport.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className={`flex justify-between py-4 border-t-2 font-bold text-lg ${plReport.net_income >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                  <span className="text-gray-900">Net Income</span>
                  <span className={`font-mono ${plReport.net_income >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${plReport.net_income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
