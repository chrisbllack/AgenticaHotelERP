import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

type Tab = 'property' | 'tax' | 'payments' | 'departments' | 'numbering' | 'system' | 'users' | 'audit' | 'database' | 'info';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'property', label: 'Property', icon: '🏨' },
  { id: 'tax', label: 'Tax Rates', icon: '💰' },
  { id: 'payments', label: 'Payment Methods', icon: '💳' },
  { id: 'departments', label: 'Departments', icon: '🏢' },
  { id: 'numbering', label: 'Numbering', icon: '🔢' },
  { id: 'system', label: 'System Config', icon: '⚙️' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'audit', label: 'Audit Log', icon: '📋' },
  { id: 'database', label: 'Database', icon: '🗄️' },
  { id: 'info', label: 'System Info', icon: 'ℹ️' },
];

const PROPERTY_ID = '00000000-0000-0000-0000-000000000001';

function SettingsPage() {
  const [tab, setTab] = useState<Tab>('property');
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure property, taxes, payments, departments, and system parameters</p>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {tab === 'property' && <PropertyTab />}
        {tab === 'tax' && <TaxRatesTab />}
        {tab === 'payments' && <PaymentMethodsTab />}
        {tab === 'departments' && <DepartmentsTab />}
        {tab === 'numbering' && <NumberingTab />}
        {tab === 'system' && <SystemConfigTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'database' && <DatabaseTab />}
        {tab === 'info' && <SystemInfoTab />}
      </div>
    </div>
  );
}

export default SettingsPage;

// ── Property Tab ───────────────────────────────────────────

function PropertyTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: property } = useQuery({
    queryKey: ['settings', 'property'],
    queryFn: async () => {
      const res = await api.get('/settings/property');
      return res.data.data;
    },
  });

  const [form, setForm] = useState<any>({});

  const handleEdit = () => {
    setForm({ ...property });
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/settings/property`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'property'] });
      setEditing(false);
    },
  });

  if (!property) return <LoadingCard />;

  const fields = [
    { key: 'name', label: 'Hotel Name', type: 'text' },
    { key: 'code', label: 'Property Code', type: 'text', readOnly: true },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'telephone', label: 'Telephone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'currency', label: 'Currency', type: 'select', options: ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'] },
    { key: 'timezone', label: 'Timezone', type: 'select', options: ['Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'UTC'] },
    { key: 'vat_rate', label: 'VAT Rate (%)', type: 'number' },
    { key: 'service_charge_rate', label: 'Service Charge (%)', type: 'number' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900 text-lg">Property Details</h3>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button onClick={handleEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">✏️ Edit</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
              {editing && !f.readOnly ? (
                f.type === 'select' ? (
                  <select value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                )
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-800">
                  {f.key.includes('rate') ? `${property[f.key]}%` : (property[f.key] || '—')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tax Rates Tab ──────────────────────────────────────────

function TaxRatesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', rate: 0, applies_to: 'all', is_compound: false });

  const { data: taxRates } = useQuery({
    queryKey: ['settings', 'tax-rates'],
    queryFn: async () => {
      const res = await api.get('/settings/tax-rates');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/settings/tax-rates', { ...form, type: 'percentage' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'tax-rates'] });
      setShowForm(false);
      setForm({ name: '', code: '', rate: 0, applies_to: 'all', is_compound: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/settings/tax-rates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'tax-rates'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.put(`/settings/tax-rates/${id}`, { is_active, rate: -1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'tax-rates'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Tax Rates & Levies</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {showForm ? '✕ Cancel' : '+ Add Tax Rate'}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Rate %" value={form.rate || ''} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Charges</option>
              <option value="room">Room Only</option>
              <option value="accommodation">Accommodation</option>
              <option value="food">Food & Beverage</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_compound} onChange={(e) => setForm({ ...form, is_compound: e.target.checked })} className="rounded" />
              Compound (applied on top of other taxes)
            </label>
            <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Applies To</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Compound</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(taxRates || []).map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">{t.code || '—'}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">{t.rate}%</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.applies_to}</td>
                <td className="px-4 py-3 text-center">
                  {t.is_compound ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => deleteMutation.mutate(t.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Payment Methods Tab ────────────────────────────────────

function PaymentMethodsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: 'cash', requires_reference: false });

  const { data: methods } = useQuery({
    queryKey: ['settings', 'payment-methods'],
    queryFn: async () => {
      const res = await api.get('/settings/payment-methods');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/settings/payment-methods', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment-methods'] });
      setShowForm(false);
      setForm({ name: '', code: '', type: 'cash', requires_reference: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/settings/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment-methods'] });
    },
  });

  const typeColors: Record<string, string> = {
    cash: 'bg-green-100 text-green-700',
    card: 'bg-blue-100 text-blue-700',
    transfer: 'bg-purple-100 text-purple-700',
    online: 'bg-indigo-100 text-indigo-700',
    mobile: 'bg-orange-100 text-orange-700',
    credit: 'bg-yellow-100 text-yellow-700',
    complimentary: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Payment Methods</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {showForm ? '✕ Cancel' : '+ Add Method'}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Bank Transfer</option>
              <option value="online">Online Payment</option>
              <option value="mobile">Mobile Money</option>
              <option value="credit">Room Credit</option>
              <option value="complimentary">Complimentary</option>
            </select>
            <label className="flex items-center gap-2 px-3 py-2">
              <input type="checkbox" checked={form.requires_reference} onChange={(e) => setForm({ ...form, requires_reference: e.target.checked })} className="rounded" />
              <span className="text-sm">Requires Reference #</span>
            </label>
          </div>
          <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}
            className="mt-3 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(methods || []).map((m: any) => (
          <div key={m.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Code: {m.code || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[m.type] || 'bg-gray-100 text-gray-600'}`}>
                  {m.type}
                </span>
                <button onClick={() => deleteMutation.mutate(m.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️</button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
              <span className={m.is_active ? 'text-green-600' : 'text-red-500'}>
                {m.is_active ? '● Active' : '● Inactive'}
              </span>
              {m.requires_reference && <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">Reference Required</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Departments Tab ────────────────────────────────────────

function DepartmentsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', manager: '', email: '', phone: '' });

  const { data: departments } = useQuery({
    queryKey: ['settings', 'departments'],
    queryFn: async () => {
      const res = await api.get('/settings/departments');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/settings/departments', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] });
      setShowForm(false);
      setForm({ name: '', code: '', manager: '', email: '', phone: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/settings/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Departments</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {showForm ? '✕ Cancel' : '+ Add Department'}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Manager" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}
            className="mt-3 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Manager</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(departments || []).map((d: any, i: number) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{d.code || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.manager || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.email || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => deleteMutation.mutate(d.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Numbering Tab ──────────────────────────────────────────

function NumberingTab() {
  const queryClient = useQueryClient();

  const { data: sequences } = useQuery({
    queryKey: ['settings', 'numbering'],
    queryFn: async () => {
      const res = await api.get('/settings/numbering');
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, next_number }: { id: string; next_number: number }) => {
      await api.put(`/settings/numbering/${id}`, { next_number });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'numbering'] });
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Numbering Sequences</h3>
      <p className="text-sm text-gray-500">Configure auto-numbering for reservations, folios, guests, invoices, etc.</p>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sequence Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prefix</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Next Number</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Padding</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Preview</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(sequences || []).map((s: any) => {
              const preview = `${s.prefix || ''}${String(s.next_number).padStart(s.padding || 6, '0')}`;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-blue-700">{s.prefix || '—'}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">{s.next_number}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{s.padding}</td>
                  <td className="px-4 py-3 text-sm font-mono bg-gray-50 rounded text-gray-700">{preview}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => {
                      const newNum = prompt(`Reset next number for ${s.name}:`, String(s.next_number));
                      if (newNum && parseInt(newNum) > 0) {
                        updateMutation.mutate({ id: s.id, next_number: parseInt(newNum) });
                      }
                    }} className="text-blue-500 hover:text-blue-700 text-sm">✏️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── System Config Tab ──────────────────────────────────────

function SystemConfigTab() {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ['settings', 'system'],
    queryFn: async () => {
      const res = await api.get('/settings/system');
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const settingsArray = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
      await api.put('/settings/system', { settings: settingsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'system'] });
      setEditedValues({});
    },
  });

  const grouped: Record<string, any[]> = {};
  (settings || []).forEach((s: any) => {
    const cat = s.key.startsWith('check_') || s.key.startsWith('early_') || s.key.startsWith('late_') || s.key.startsWith('max_') || s.key.startsWith('default_') || s.key.startsWith('cancel') || s.key.startsWith('no_show')
      ? 'front_desk'
      : s.key.startsWith('currency') || s.key.startsWith('date_') || s.key.startsWith('time_') || s.key.startsWith('fiscal')
        ? 'locale'
        : s.key.startsWith('email') || s.key.startsWith('sms')
          ? 'notifications'
          : s.key.startsWith('pos')
            ? 'pos'
            : s.key.startsWith('backup') || s.key.startsWith('offline')
              ? 'operations'
              : 'system';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  const categoryLabels: Record<string, string> = {
    front_desk: '🏨 Front Desk & Check-in',
    locale: '🌍 Locale & Currency',
    notifications: '📧 Email & SMS',
    pos: '🍽️ POS',
    operations: '🔧 Backup & Offline',
    system: '⚙️ General System',
  };

  const getValue = (s: any) => editedValues[s.key] ?? s.value ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">System Configuration</h3>
        {Object.keys(editedValues).length > 0 && (
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {updateMutation.isPending ? 'Saving...' : `Save ${Object.keys(editedValues).length} Changes`}
          </button>
        )}
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-white rounded-xl border p-5">
          <h4 className="font-medium text-gray-900 mb-4">{categoryLabels[cat] || cat}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s: any) => (
              <div key={s.key}>
                <label className="block text-sm text-gray-600 mb-1 capitalize">
                  {s.key.replace(/_/g, ' ')}
                </label>
                <input
                  value={getValue(s)}
                  onChange={(e) => setEditedValues({ ...editedValues, [s.key]: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                    editedValues[s.key] !== undefined ? 'border-blue-400 bg-blue-50' : 'bg-gray-50'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────

function UsersTab() {
  const { data: users } = useQuery({
    queryKey: ['settings', 'users'],
    queryFn: async () => {
      const res = await api.get('/settings/users');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">User Management</h3>
        <span className="text-sm text-gray-500">{(users || []).length} users</span>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Last Login</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(users || []).map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Audit Tab ──────────────────────────────────────────────

function AuditTab() {
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');

  const { data } = useQuery({
    queryKey: ['settings', 'audit', page, moduleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (moduleFilter) params.append('module', moduleFilter);
      const res = await api.get(`/audit-logs?${params}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Audit Trail</h3>
        <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Modules</option>
          <option value="reservation">Reservation</option>
          <option value="front_desk">Front Desk</option>
          <option value="pos">POS</option>
          <option value="inventory">Inventory</option>
          <option value="finance">Finance</option>
          <option value="auth">Authentication</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Module</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Record ID</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(!data?.data || data.data.length === 0) ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">📋</span>
                No audit logs yet. Audit entries are created automatically for all operations.
              </td></tr>
            ) : (
              data.data.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{log.module}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.auditable_type}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{String(log.auditable_id).substring(0, 8)}...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.meta && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {data.data.length} of {data.meta.total || 0} entries</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50">← Prev</button>
            <span className="px-3 py-1">Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={data.data.length < 50}
              className="px-3 py-1 border rounded-lg disabled:opacity-50">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Database Tab ───────────────────────────────────────────

function DatabaseTab() {
  const { data: stats } = useQuery({
    queryKey: ['settings', 'db-stats'],
    queryFn: async () => {
      const res = await api.get('/settings/db-stats');
      return res.data.data;
    },
  });

  const totalRecords = (stats || []).reduce((sum: number, t: any) => sum + t.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Database Overview</h3>
        <span className="text-sm text-gray-500">{totalRecords.toLocaleString()} total records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(stats || []).map((s: any) => (
          <div key={s.name} className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 capitalize">{s.name.replace(/_/g, ' ')}</p>
              <span className="text-lg font-bold text-gray-900">{s.count.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min((s.count / Math.max(totalRecords, 1)) * 100 * 5, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h4 className="font-medium text-yellow-800">⚠️ Database Management</h4>
        <p className="text-sm text-yellow-700 mt-1">In production mode (PostgreSQL), this section includes backup, restore, and maintenance tools. Currently running in demo mode with SQLite.</p>
        <div className="flex gap-3 mt-3">
          <button disabled className="px-4 py-2 text-sm bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">📦 Backup Database</button>
          <button disabled className="px-4 py-2 text-sm bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">🔄 Restore Backup</button>
          <button disabled className="px-4 py-2 text-sm bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">🧹 Optimize</button>
        </div>
      </div>
    </div>
  );
}

// ── System Info Tab ────────────────────────────────────────

function SystemInfoTab() {
  const { data: info } = useQuery({
    queryKey: ['settings', 'system-info'],
    queryFn: async () => {
      const res = await api.get('/settings/system-info');
      return res.data.data;
    },
  });

  if (!info) return <LoadingCard />;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">System Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <h4 className="font-medium text-gray-900 mb-3">Application</h4>
          <div className="space-y-2">
            <InfoRow label="Product" value="INFINEON Enterprise Platform" />
            <InfoRow label="Version" value={info.version} />
            <InfoRow label="Edition" value={info.edition} />
            <InfoRow label="API Version" value={info.api_version} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h4 className="font-medium text-gray-900 mb-3">Infrastructure</h4>
          <div className="space-y-2">
            <InfoRow label="Deployment Mode" value={info.mode} />
            <InfoRow label="Database" value={info.database} />
            <InfoRow label="Deployment" value={info.deployment} />
            <InfoRow label="Offline Support" value={info.offline_support ? '✅ Enabled' : '❌ Disabled'} />
            <InfoRow label="Multi-Property" value={info.multi_property ? '✅ Enabled' : '❌ Single Property'} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h4 className="font-medium text-gray-900 mb-3">Data Summary</h4>
          <div className="space-y-2">
            <InfoRow label="Total Rooms" value={String(info.rooms)} />
            <InfoRow label="Total Guests" value={String(info.guests)} />
            <InfoRow label="Total Reservations" value={String(info.reservations)} />
            <InfoRow label="Total Employees" value={String(info.employees)} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h4 className="font-medium text-gray-900 mb-3">Features</h4>
          <div className="space-y-1.5 text-sm">
            {[
              'Front Desk & Reservations', 'Revenue Management', 'Group Bookings', 'Sales & Catering',
              'Restaurant POS', 'Kitchen Display System', 'Inventory & Procurement', 'Finance & Accounting',
              'HR & Payroll', 'Housekeeping & Maintenance', 'Loyalty Program', 'Guest Self-Service',
              'Night Audit', 'Channel Manager', 'Hardware Integration', 'AI Assistant',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-medium text-blue-900 mb-2">🏗️ Built for Africa</h4>
        <p className="text-sm text-blue-800">
          INFINEON is designed for on-premise deployment with offline resilience, supporting unstable internet connections.
          The single Go binary + SQLite/PostgreSQL architecture ensures 100% uptime for local operations.
          Remote access is available through Cloudflare Tunnels or VPN when internet is available.
        </p>
      </div>
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────

function LoadingCard() {
  return (
    <div className="bg-white border rounded-xl p-12 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
