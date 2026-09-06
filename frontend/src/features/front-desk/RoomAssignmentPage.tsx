import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function RoomAssignmentPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedRes, setSelectedRes] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [filter, setFilter] = useState('confirmed');

  useEffect(() => {
    api.get('/reservations').then(r => {
      setReservations(r.data.data || r.data.reservations || []);
    });
  }, []);

  const getSuggestions = async (resId: string) => {
    setSelectedRes(resId);
    setLoading(true);
    try {
      const r = await api.get(`/reservations/${resId}/suggest-room`);
      setSuggestions(r.data.data);
    } catch { setSuggestions(null); }
    setLoading(false);
  };

  const assignRoom = async (roomId: string, isUpgrade: boolean, score: number, reasons: string[]) => {
    setAssigning(true);
    try {
      await api.post('/reservations/assign-room', {
        reservation_id: selectedRes,
        room_id: roomId,
        is_upgrade: isUpgrade,
        score,
        reasons: reasons.join(', '),
      });
      setSuggestions(null);
      setSelectedRes('');
    } catch {}
    setAssigning(false);
  };

  const filtered = reservations.filter(r =>
    r.status === filter || filter === 'all'
  );

  const weights = suggestions?.weights || {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Intelligent Room Assignment</h1>
        <p className="text-gray-500">AI-powered room suggestions with weighted scoring</p>
      </div>

      {/* Weighting Rules */}
      {suggestions?.weights && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white">
          <h3 className="font-semibold mb-3">⚖️ Assignment Weights</h3>
          <div className="grid grid-cols-6 gap-3">
            {Object.entries(weights).map(([key, val]: [string, any]) => (
              <div key={key} className="text-center">
                <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                  <div className="bg-white rounded-full h-2" style={{ width: `${val * 100}%` }} />
                </div>
                <p className="text-xs text-indigo-200">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm font-bold">{(val * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Reservations */}
        <div className="col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Reservations</h3>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['confirmed', 'tentative', 'all'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    filter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.map((res: any) => (
              <div key={res.id}
                onClick={() => getSuggestions(res.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedRes === res.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'hover:border-gray-300'
                }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{res.guest_name || res.guest_id || res.id}</p>
                    <p className="text-xs text-gray-500">
                      {res.id} • Room {res.room_id || '—'} • {res.nights || '?'} nights
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    res.status === 'checked_in' || res.status === 'in_house' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{res.status}</span>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-gray-500">
                  <span>{res.arrival_date ? new Date(res.arrival_date).toLocaleDateString() : '—'}</span>
                  <span>→</span>
                  <span>{res.departure_date ? new Date(res.departure_date).toLocaleDateString() : '—'}</span>
                  {res.is_vip ? <span className="text-amber-600 font-medium">⭐ VIP</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Suggestions */}
        <div className="col-span-7">
          {loading ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-gray-500">Analyzing room availability and preferences...</p>
            </div>
          ) : !suggestions ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-gray-400 text-lg mb-2">← Select a reservation</p>
              <p className="text-gray-300 text-sm">AI will suggest the best rooms based on weighted scoring</p>
            </div>
          ) : suggestions.candidates.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-red-500">No rooms available for this reservation type</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                {suggestions.candidates.length} Room Suggestions (sorted by score)
              </h3>
              {suggestions.candidates
                .sort((a: any, b: any) => b.score - a.score)
                .map((c: any) => (
                <div key={c.room_id} className={`bg-white rounded-xl border p-4 ${
                  c.is_upgrade ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-green-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">#{c.room_number}</p>
                        <p className="text-xs text-gray-500">Floor {c.floor}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.room_type}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            c.hk_status === 'clean' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>HK: {c.hk_status}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            c.is_upgrade ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>{c.is_upgrade ? '⬆ Upgrade' : 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${
                          c.score >= 85 ? 'text-green-600' : c.score >= 70 ? 'text-blue-600' : 'text-yellow-600'
                        }`}>{c.score.toFixed(1)}</p>
                        <p className="text-xs text-gray-400">score</p>
                      </div>
                      <button onClick={() => assignRoom(c.room_id, c.is_upgrade, c.score, c.reasons)}
                        disabled={assigning}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          c.is_upgrade
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50`}>
                        {c.is_upgrade ? '⬆ Assign Upgrade' : '✅ Assign Room'}
                      </button>
                    </div>
                  </div>
                  {c.reasons && c.reasons.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {c.reasons.map((reason: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{reason}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
