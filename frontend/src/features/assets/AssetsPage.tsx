import { useState } from 'react';

export default function AssetsPage() {
  const [tab, setTab] = useState<'assets' | 'expenses' | 'bank_rec'>('assets');


  // Demo fixed assets
  const assets = [
    { code: 'AST-0001', name: 'Generator (500KVA)', category: 'Equipment', purchase: 8500000, dep: 141667, accum: 3400000, current: 5100000, status: 'active' },
    { code: 'AST-0002', name: 'Kitchen Equipment Set', category: 'Equipment', purchase: 4200000, dep: 70000, accum: 1680000, current: 2520000, status: 'active' },
    { code: 'AST-0003', name: 'POS Terminal (x3)', category: 'Technology', purchase: 450000, dep: 7500, accum: 180000, current: 270000, status: 'active' },
    { code: 'AST-0004', name: 'Air Conditioning (50 units)', category: 'Building', purchase: 12000000, dep: 200000, accum: 4800000, current: 7200000, status: 'active' },
    { code: 'AST-0005', name: 'Hotel Furniture Set', category: 'Furniture', purchase: 15000000, dep: 250000, accum: 6000000, current: 9000000, status: 'active' },
    { code: 'AST-0006', name: 'Water Treatment Plant', category: 'Equipment', purchase: 3500000, dep: 58333, accum: 1400000, current: 2100000, status: 'active' },
    { code: 'AST-0007', name: 'Old Reception Desk', category: 'Furniture', purchase: 800000, dep: 0, accum: 800000, current: 0, status: 'fully_depreciated' },
  ];

  const totalAssetValue = assets.reduce((s, a) => s + a.current, 0);
  const totalDepreciation = assets.reduce((s, a) => s + a.accum, 0);

  // Demo expenses
  const expenses = [
    { id: 1, title: 'Generator Fuel', category: 'Utilities', amount: 120000, status: 'approved', submitted: 'Chioma Eze', date: 'Aug 30' },
    { id: 2, title: 'Kitchen Knife Set', category: 'Supplies', amount: 45000, status: 'submitted', submitted: 'Blessing Okoro', date: 'Aug 29' },
    { id: 3, title: 'Internet Bill (Sept)', category: 'Utilities', amount: 85000, status: 'approved', submitted: 'System Admin', date: 'Aug 28' },
    { id: 4, title: 'Staff Training', category: 'HR', amount: 250000, status: 'submitted', submitted: 'Ngozi Eze', date: 'Aug 27' },
    { id: 5, title: 'Pool Chemical', category: 'Maintenance', amount: 35000, status: 'paid', submitted: 'Tunde Adesanya', date: 'Aug 25' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Assets, Expenses & Banking</h1>

      <div className="flex gap-4 mb-6 border-b">
        {([
          { key: 'assets', label: 'Fixed Assets' },
          { key: 'expenses', label: 'Expenses' },
          { key: 'bank_rec', label: 'Bank Reconciliation' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-medium capitalize ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Asset Value</p>
              <p className="text-2xl font-bold text-blue-600">₦{(totalAssetValue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Accumulated Depreciation</p>
              <p className="text-2xl font-bold text-orange-600">₦{(totalDepreciation / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Monthly Depreciation</p>
              <p className="text-2xl font-bold text-red-600">₦{(assets.reduce((s, a) => s + a.dep, 0)).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ Add Asset</button>
          </div>

          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly Dep</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accum Dep</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets.map(a => (
                  <tr key={a.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500">{a.code}</span>
                      <span className="ml-2 font-medium text-sm">{a.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.category}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">₦{(a.purchase / 1000).toLocaleString()}K</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-orange-600">₦{(a.dep / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-red-600">₦{(a.accum / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-medium text-green-700">₦{(a.current / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{a.status.replace(/_/g, ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ New Expense</button>
          </div>
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-sm">{e.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.category}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">₦{e.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.submitted}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{e.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        e.status === 'approved' ? 'bg-green-100 text-green-700' :
                        e.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {e.status === 'submitted' && (
                        <div className="flex gap-1">
                          <button className="px-2 py-1 bg-green-600 text-white rounded text-xs">Approve</button>
                          <button className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'bank_rec' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ New Reconciliation</button>
          </div>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-4xl mb-4">🏦</p>
            <p className="text-gray-500">Bank reconciliation lets you match PMS transactions with bank statements.</p>
            <p className="text-sm text-gray-400 mt-2">Import bank statements and auto-match against journal entries.</p>
          </div>
        </div>
      )}
    </div>
  );
}
