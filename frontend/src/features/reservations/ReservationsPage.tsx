import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import type { Reservation } from '../../lib/types';

export default function ReservationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['reservations', search, statusFilter, page],
    queryFn: async () => {
      const params: any = { page, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/reservations', { params });
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/reservations/${id}/cancel`, { reason: 'Cancelled by user' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const reservations: Reservation[] = reservationsData?.data || [];
  const pagination = reservationsData?.meta?.pagination;

  const statusColors: Record<string, string> = {
    inquiry: 'bg-gray-100 text-gray-700',
    tentative: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    checked_in: 'bg-green-100 text-green-700',
    in_house: 'bg-green-100 text-green-700',
    checked_out: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 mt-1">Manage all reservations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ New Reservation'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && <ReservationForm onClose={() => setShowForm(false)} />}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by guest name or confirmation #..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="in_house">In House</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Confirmation</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Guest</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Room Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dates</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : reservations.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No reservations found</td></tr>
            ) : (
              reservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-bold text-blue-600">{res.confirmation_number}</span>
                    {res.is_vip && <span className="ml-1">⭐</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{res.guest_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{res.room_type_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {res.arrival_date} → {res.departure_date}
                    <br />
                    <span className="text-xs text-gray-400">{res.nights} nights</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[res.status] || 'bg-gray-100 text-gray-600'}`}>
                      {res.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    ${res.total_estimated?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {res.status === 'confirmed' && (
                        <Link to={`/check-in/${res.id}`}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 font-medium">
                          Check In
                        </Link>
                      )}
                      {(res.status === 'checked_in' || res.status === 'in_house') && (
                        <>
                          <Link to={`/check-out/${res.id}`}
                            className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-200 font-medium">
                            Check Out
                          </Link>
                        </>
                      )}
                      {['confirmed', 'tentative'].includes(res.status) && (
                        <button
                          onClick={() => { if (confirm('Cancel this reservation?')) cancelMutation.mutate(res.id); }}
                          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 font-medium">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.last_page}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReservationForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    guest_id: '', rate_plan_id: '', room_type_id: '',
    arrival_date: '', departure_date: '', adults: 1, children: 0,
    source: 'direct', special_requests: '',
  });

  const { data: guests } = useQuery({
    queryKey: ['guests-list'],
    queryFn: async () => {
      const res = await api.get('/guests?per_page=100');
      return res.data.data;
    },
  });

  const { data: roomTypes } = useQuery({
    queryKey: ['room-types-list'],
    queryFn: async () => {
      const res = await api.get('/room-types');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/reservations', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      onClose();
    },
    onError: (error: any) => {
      alert(`Failed: ${error?.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">New Reservation</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guest *</label>
          <select required value={form.guest_id} onChange={(e) => setForm({...form, guest_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Select guest...</option>
            {(guests || []).map((g: any) => (
              <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
          <select required value={form.room_type_id} onChange={(e) => setForm({...form, room_type_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Select room type...</option>
            {(roomTypes || []).map((rt: any) => (
              <option key={rt.id} value={rt.id}>{rt.name} (${rt.base_rate}/night)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select value={form.source} onChange={(e) => setForm({...form, source: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            {['direct', 'website', 'walk_in', 'telephone', 'email', 'corporate', 'travel_agent', 'ota'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date *</label>
          <input type="date" required value={form.arrival_date}
            onChange={(e) => setForm({...form, arrival_date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date *</label>
          <input type="date" required value={form.departure_date}
            onChange={(e) => setForm({...form, departure_date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
            <input type="number" min="1" value={form.adults}
              onChange={(e) => setForm({...form, adults: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
            <input type="number" min="0" value={form.children}
              onChange={(e) => setForm({...form, children: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
          <input type="text" value={form.special_requests}
            onChange={(e) => setForm({...form, special_requests: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., late check-in, extra pillows..." />
        </div>
        <div className="md:col-span-3 flex gap-3 justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMutation.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Reservation'}
          </button>
        </div>
      </form>
    </div>
  );
}
