import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

interface Payment {
  id: number;
  payment_reference: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  guest_email: string;
  created_at: string;
}

interface Notification {
  id: number;
  type: string;
  template: string;
  recipient: string;
  status: string;
  sent_at: string;
  created_at: string;
}

interface Approval {
  id: number;
  entity_type: string;
  entity_id: string;
  status: string;
  requested_by: string;
  amount: number;
  comments: string;
  created_at: string;
}

export default function PaymentsPage() {
  const [tab, setTab] = useState<'payments' | 'refunds' | 'approvals' | 'notifications'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const token = localStorage.getItem('infineon_token') || '';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [payRes, appRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/payments/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ ok: false, json: () => ({ data: [] }) })),
        fetch(`${API_BASE}/workflow/approvals`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ ok: false, json: () => ({ data: [] }) })),
        fetch(`${API_BASE}/notifications/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ ok: false, json: () => ({ data: [] }) })),
      ]);
      setPayments((await payRes.json()).data || []);
      setApprovals((await appRes.json()).data || []);
      setNotifications((await notifRes.json()).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const approveAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await fetch(`${API_BASE}/workflow/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approval_id: id, action, comments: '' }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payments & Approvals</h1>

      <div className="flex gap-4 mb-6 border-b">
        {(['payments', 'refunds', 'approvals', 'notifications'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium capitalize ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reference</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No payments recorded</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{p.payment_reference}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">{p.method}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">₦{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700' :
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500">No pending approvals 🎉</p>
            </div>
          ) : approvals.map((a) => (
            <div key={a.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold capitalize">{a.entity_type.replace('_', ' ')}</h3>
                <p className="text-sm text-gray-500">
                  Requested by {a.requested_by} • {new Date(a.created_at).toLocaleString()}
                </p>
                {a.amount > 0 && <p className="text-sm font-medium">₦{a.amount.toLocaleString()}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveAction(a.id, 'reject')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Reject</button>
                <button onClick={() => approveAction(a.id, 'approve')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Recipient</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs capitalize">{n.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{n.recipient}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      n.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{n.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{n.sent_at ? new Date(n.sent_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'refunds' && (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">Refund processing will appear here.</p>
        </div>
      )}
    </div>
  );
}
