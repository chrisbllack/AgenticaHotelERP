import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function FrontDeskPage() {
  const [tab, setTab] = useState<'overview' | 'rooms' | 'arrivals' | 'departures'>('overview');

  const { data: dashboard } = useQuery({
    queryKey: ['front-desk-dashboard'],
    queryFn: async () => {
      const res = await api.get('/front-desk/dashboard');
      return res.data.data;
    },
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', 'all'],
    queryFn: async () => {
      const res = await api.get('/rooms?per_page=200');
      return res.data.data;
    },
  });

  const { data: arrivalsData } = useQuery({
    queryKey: ['reservations', 'arrivals'],
    queryFn: async () => {
      const res = await api.get('/reservations', { params: { status: 'confirmed' } });
      return res.data.data;
    },
  });

  const { data: inHouseData } = useQuery({
    queryKey: ['reservations', 'in-house'],
    queryFn: async () => {
      const res = await api.get('/reservations', { params: { status: 'checked_in' } });
      return res.data.data;
    },
  });

  const rooms: any[] = roomsData || [];
  const arrivals: any[] = arrivalsData || [];
  const inHouse: any[] = inHouseData || [];

  const statusColors: Record<string, string> = {
    vacant_clean: 'bg-green-100 border-green-300 text-green-800',
    vacant_dirty: 'bg-red-100 border-red-300 text-red-800',
    inspected: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    occupied_clean: 'bg-blue-100 border-blue-300 text-blue-800',
    occupied_dirty: 'bg-orange-100 border-orange-300 text-orange-800',
    reserved: 'bg-purple-100 border-purple-300 text-purple-800',
    out_of_order: 'bg-gray-200 border-gray-400 text-gray-600',
    out_of_service: 'bg-gray-100 border-gray-300 text-gray-500',
    blocked: 'bg-gray-300 border-gray-500 text-gray-700',
    house_use: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    complimentary: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    due_in: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    due_out: 'bg-pink-100 border-pink-300 text-pink-800',
  };

  const statusLabels: Record<string, string> = {
    vacant_clean: 'VC', vacant_dirty: 'VD', inspected: 'INS',
    occupied_clean: 'OC', occupied_dirty: 'OD', reserved: 'RES',
    out_of_order: 'OOO', out_of_service: 'OOS', blocked: 'BLK',
    house_use: 'HU', complimentary: 'COMP', due_in: 'DI', due_out: 'DO',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Front Desk</h1>
          <p className="text-gray-500 mt-1">Room status, arrivals, and departures</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Arrivals', value: dashboard?.arrivals ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Departures', value: dashboard?.departures ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'In-House', value: dashboard?.in_house ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Available', value: dashboard?.available_rooms ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Occupied', value: dashboard?.occupied_rooms ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['overview', 'rooms', 'arrivals', 'departures'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      {tab === 'rooms' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Room Grid</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {rooms.map((room: any) => (
              <div
                key={room.id}
                className={`p-2 rounded-lg border text-center cursor-pointer hover:shadow-md transition-shadow ${statusColors[room.status] || 'bg-gray-100'}`}
                title={`${room.number} - ${room.room_type_name} (${room.status.replace(/_/g, ' ')})`}
              >
                <p className="text-sm font-bold">{room.number}</p>
                <p className="text-[10px] font-medium">{statusLabels[room.status] || room.status}</p>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="col-span-12 text-center text-gray-400 py-8">No rooms configured yet</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${statusColors[status]?.split(' ')[0] || 'bg-gray-100'}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arrivals */}
      {tab === 'arrivals' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Guest</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Room Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Arrival</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nights</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {arrivals.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No arrivals today</td></tr>
              ) : (
                arrivals.map((res: any) => (
                  <tr key={res.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{res.guest_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{res.room_type_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{res.arrival_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{res.nights}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {res.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/check-in/${res.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Check In →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Departures */}
      {tab === 'departures' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Guest</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Room</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Departure</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inHouse.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No departures today</td></tr>
              ) : (
                inHouse.map((res: any) => (
                  <tr key={res.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{res.guest_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{res.room_number || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{res.departure_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₦{res.total_estimated?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Link to={`/check-out/${res.id}`}
                        className="text-sm text-amber-600 hover:text-amber-800 font-medium">
                        Check Out →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Expected Arrivals ({arrivals.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {arrivals.slice(0, 10).map((res: any) => (
                <div key={res.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{res.guest_name}</p>
                    <p className="text-xs text-gray-500">{res.room_type_name} • {res.nights} nights</p>
                  </div>
                  <Link to={`/check-in/${res.id}`}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">
                    Check In
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">In-House Guests ({inHouse.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {inHouse.slice(0, 10).map((res: any) => (
                <div key={res.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{res.guest_name}</p>
                    <p className="text-xs text-gray-500">Room {res.room_number || 'TBA'} • Departs {res.departure_date}</p>
                  </div>
                  <div className="flex gap-2">
                    {res.room_id && (
                      <Link to={`/folio/${res.id}`}
                        className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300">
                        Folio
                      </Link>
                    )}
                    <Link to={`/check-out/${res.id}`}
                      className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full hover:bg-amber-600">
                      Check Out
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
