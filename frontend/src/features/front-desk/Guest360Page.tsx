import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Guest360Page() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id) return;
    api.get(`/guests/${id}/360`).then(r => {
      setData(r.data.data || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Guest 360 profile...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Guest not found</div>;

  const guest = data.guest || {};
  const summary = data.summary || {};
  const currentStay = data.current_stay || {};
  const stays = data.stay_history || [];
  const preferences = data.preferences || [];
  const requests = data.service_requests || [];
  const interactions = data.interactions || [];

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'history', label: '🏨 Stay History' },
    { id: 'requests', label: '🛎️ Service Requests' },
    { id: 'interactions', label: '💬 Interactions' },
    { id: 'preferences', label: '⭐ Preferences' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">← Back</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{guest.full_name || `${guest.first_name} ${guest.last_name}`}</h1>
          <p className="text-gray-500">{guest.company || 'Individual Guest'} • {guest.nationality || 'Nigerian'}</p>
        </div>
        <div className="text-right">
          {guest.blacklisted && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">⛔ Blacklisted</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.total_stays || 0}</p>
          <p className="text-xs text-blue-600">Total Stays</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.total_nights || 0}</p>
          <p className="text-xs text-green-600">Total Nights</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">₦{(summary.total_spend || 0).toLocaleString()}</p>
          <p className="text-xs text-purple-600">Total Spend</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{summary.loyalty_tier || 'None'}</p>
          <p className="text-xs text-amber-600">Loyalty Tier</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{summary.points_balance || 0}</p>
          <p className="text-xs text-indigo-600">Points Balance</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.open_complaints || 0}</p>
          <p className="text-xs text-red-600">Open Complaints</p>
        </div>
      </div>

      {/* Current Stay */}
      {currentStay.reservation_id && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
          <h3 className="font-semibold mb-2">📍 Current Stay</h3>
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div><span className="text-blue-200">Room:</span> <span className="font-medium">{currentStay.room || '—'}</span></div>
            <div><span className="text-blue-200">Status:</span> <span className="font-medium">{currentStay.status || '—'}</span></div>
            <div><span className="text-blue-200">Arrival:</span> <span className="font-medium">{currentStay.arrival ? new Date(currentStay.arrival).toLocaleDateString() : '—'}</span></div>
            <div><span className="text-blue-200">Departure:</span> <span className="font-medium">{currentStay.departure ? new Date(currentStay.departure).toLocaleDateString() : '—'}</span></div>
            <div><span className="text-blue-200">Reservation:</span> <span className="font-medium">{currentStay.reservation_id || '—'}</span></div>
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{guest.email || '—'}</span></div>
          <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{guest.phone || '—'}</span></div>
          <div><span className="text-gray-500">ID Type:</span> <span className="font-medium">{guest.id_type || '—'}</span></div>
          <div><span className="text-gray-500">ID Number:</span> <span className="font-medium">{guest.id_number || '—'}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Guest Journey Timeline</h3>
          <div className="space-y-3">
            {interactions.length === 0 && <p className="text-gray-400 text-sm">No interactions recorded yet</p>}
            {interactions.map((i: any) => (
              <div key={i.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  i.type === 'complaint' ? 'bg-red-500' : i.type === 'compliment' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{i.subject}</span>
                    <span className="text-xs text-gray-400">{new Date(i.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{i.message}</p>
                  <p className="text-xs text-gray-400 mt-1">By: {i.staff} • via {i.channel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Stay History</h3>
          {stays.length === 0 ? (
            <p className="text-gray-400 text-sm">No previous stays recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Room</th><th className="pb-2">Type</th><th className="pb-2">Arrival</th>
                <th className="pb-2">Departure</th><th className="pb-2">Nights</th><th className="pb-2">Spend</th>
              </tr></thead>
              <tbody>{stays.map((s: any) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{s.room_number}</td><td className="py-2">{s.room_type}</td>
                  <td className="py-2">{s.arrival_date}</td><td className="py-2">{s.departure_date}</td>
                  <td className="py-2">{s.nights}</td><td className="py-2 font-medium">₦{(s.total_spend || 0).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Service Requests</h3>
          {requests.length === 0 ? (
            <p className="text-gray-400 text-sm">No service requests</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.status === 'completed' ? 'bg-green-100 text-green-700' :
                    r.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{r.status}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    r.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>{r.priority}</span>
                  <span className="text-sm font-medium flex-1">{r.description}</span>
                  <span className="text-xs text-gray-400">{r.department}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'interactions' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Guest Interactions</h3>
          {interactions.length === 0 ? (
            <p className="text-gray-400 text-sm">No interactions recorded</p>
          ) : (
            <div className="space-y-3">
              {interactions.map((i: any) => (
                <div key={i.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{i.subject}</span>
                    <span className="text-xs text-gray-400">{new Date(i.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{i.message}</p>
                  <div className="flex gap-2 mt-2 text-xs text-gray-400">
                    <span>By: {i.staff}</span>
                    <span>•</span>
                    <span>Via: {i.channel}</span>
                    <span>•</span>
                    <span className={`font-medium ${
                      i.type === 'complaint' ? 'text-red-600' : i.type === 'compliment' ? 'text-green-600' : 'text-blue-600'
                    }`}>{i.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Guest Preferences</h3>
          {preferences.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No preferences recorded</p>
              <p className="text-xs text-gray-300 mt-1">Preferences are learned from guest stays and feedback</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {preferences.map((p: any, i: number) => (
                <div key={i} className="p-3 bg-amber-50 rounded-lg">
                  <span className="text-xs text-amber-600 font-medium">{p.type}</span>
                  <p className="font-medium text-gray-900">{p.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
