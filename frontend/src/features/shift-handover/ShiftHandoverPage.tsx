import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function ShiftHandoverPage() {
  const [activeShift, setActiveShift] = useState<string>('morning');
  const [handoverNotes, setHandoverNotes] = useState('');

  const shifts = [
    { id: 'morning', name: 'Morning Shift', time: '06:00 — 14:00', staff: 'Adaeze O.', status: 'active', cash_counted: 125000, expected_cash: 125000, card_payments: 340000, transfer_payments: 180000 },
    { id: 'afternoon', name: 'Afternoon Shift', time: '14:00 — 22:00', staff: 'Chidi N.', status: 'upcoming', cash_counted: 0, expected_cash: 0, card_payments: 0, transfer_payments: 0 },
    { id: 'night', name: 'Night Shift', time: '22:00 — 06:00', staff: 'Emeka A.', status: 'upcoming', cash_counted: 0, expected_cash: 0, card_payments: 0, transfer_payments: 0 },
  ];

  const currentShift = shifts.find(s => s.id === activeShift) || shifts[0];

  const shiftActivities = [
    { time: '06:15', event: 'Shift opened', user: 'Adaeze O.', type: 'system' },
    { time: '06:30', event: 'Cash float verified: ₦50,000', user: 'Adaeze O.', type: 'cash' },
    { time: '07:45', event: 'Check-in: MTN Group (5 rooms)', user: 'Adaeze O.', type: 'checkin' },
    { time: '09:20', event: 'POS Order #4521 — ₦15,750 (Room 301)', user: 'Adaeze O.', type: 'pos' },
    { time: '10:00', event: 'VIP arrival: Ambassador Bello', user: 'Adaeze O.', type: 'vip' },
    { time: '11:30', event: 'Refund processed: ₦8,500 (Guest complaint)', user: 'Adaeze O.', type: 'refund' },
    { time: '12:15', event: 'Rate override: Room 505 Corporate → ₦35,000', user: 'Adaeze O.', type: 'override' },
    { time: '13:00', event: 'Night audit pre-check initiated', user: 'System', type: 'system' },
  ];

  const outstandingIssues = [
    { issue: 'Room 208 — AC not working, maintenance notified', priority: 'high' },
    { issue: 'Guest in 305 requesting late checkout (approved until 14:00)', priority: 'medium' },
    { issue: 'MTN Group deposit pending — contact Adaeze for follow-up', priority: 'medium' },
    { issue: 'Bar stock: Only 6 bottles of Hennessy left', priority: 'low' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Handover</h1>
          <p className="text-sm text-gray-500">Opera-style shift close, cash reconciliation & handover notes</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          📋 Complete Handover
        </button>
      </div>

      {/* Shift Selector */}
      <div className="grid grid-cols-3 gap-4">
        {shifts.map(shift => (
          <button
            key={shift.id}
            onClick={() => setActiveShift(shift.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeShift === shift.id
                ? 'border-indigo-300 bg-indigo-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{shift.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                shift.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {shift.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">{shift.time}</p>
            <p className="text-xs text-gray-500 mt-1">Staff: {shift.staff}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Reconciliation */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">💵 Cash Reconciliation</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Opening Float</span>
              <span className="font-medium">₦50,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Cash Received</span>
              <span className="font-medium text-green-700">+₦{currentShift.cash_counted.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Card Payments</span>
              <span className="font-medium text-blue-700">₦{currentShift.card_payments.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-600">Transfer Payments</span>
              <span className="font-medium text-purple-700">₦{currentShift.transfer_payments.toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Expected Cash in Drawer</span>
              <span className="font-semibold">₦{(50000 + currentShift.cash_counted).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Actual Cash Counted</span>
              <input type="number" className="w-32 text-right border border-gray-300 rounded px-2 py-1 text-sm" placeholder="0" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <span className="text-sm font-medium text-yellow-700">Variance</span>
              <span className="font-semibold text-yellow-700">₦0.00</span>
            </div>
          </div>
        </div>

        {/* Shift Activity Log */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📋 Shift Activity Log</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {shiftActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0 pt-0.5">{act.time}</span>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  act.type === 'vip' ? 'bg-yellow-400' :
                  act.type === 'refund' ? 'bg-red-400' :
                  act.type === 'override' ? 'bg-orange-400' :
                  act.type === 'checkin' ? 'bg-green-400' :
                  'bg-blue-400'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm">{act.event}</p>
                  <p className="text-xs text-gray-400">{act.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outstanding Issues */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">⚠️ Outstanding Issues for Next Shift</h3>
        <div className="space-y-2">
          {outstandingIssues.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
              item.priority === 'high' ? 'bg-red-50 border border-red-200' :
              item.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                item.priority === 'high' ? 'bg-red-100 text-red-700' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {item.priority}
              </span>
              <span className="text-sm">{item.issue}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Handover Notes</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Add notes for the incoming shift..."
            value={handoverNotes}
            onChange={(e) => setHandoverNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
