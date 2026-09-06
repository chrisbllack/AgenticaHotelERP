import { useState } from 'react';

export default function ProcurementPage() {
  const [tab, setTab] = useState<'grn' | 'matching' | 'stock_count' | 'wastage'>('grn');


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Procurement & Stock Control</h1>

      <div className="flex gap-4 mb-6 border-b">
        {([
          { key: 'grn', label: 'Goods Receiving' },
          { key: 'matching', label: 'Three-Way Match' },
          { key: 'stock_count', label: 'Stock Count' },
          { key: 'wastage', label: 'Wastage' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-medium capitalize ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'grn' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">Record goods received against purchase orders</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ New GRN</button>
          </div>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-gray-500">No goods receipts yet. Click "New GRN" to record received goods.</p>
          </div>
        </div>
      )}

      {tab === 'matching' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Match Purchase Order + Goods Received Note + Supplier Invoice</p>
          <div className="bg-white rounded-lg p-6">
            <h3 className="font-semibold mb-4">Three-Way Matching</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="PO-2026-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GRN Number</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="GRN-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Amount</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0.00" />
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Run Match</button>
          </div>
        </div>
      )}

      {tab === 'stock_count' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">Physical stock count vs system quantity</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ Start Stock Count</button>
          </div>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-500">No stock counts in progress. Start a new count to compare physical vs system quantities.</p>
          </div>
        </div>
      )}

      {tab === 'wastage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">Track food and inventory wastage</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ Record Wastage</button>
          </div>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-4xl mb-4">🗑️</p>
            <p className="text-gray-500">No wastage recorded. Track expired, damaged, or spoiled items.</p>
            <div className="flex gap-2 justify-center mt-4">
              {['Expired', 'Damaged', 'Spoiled', 'Burnt', 'Preparation', 'Breakage'].map(reason => (
                <span key={reason} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{reason}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
