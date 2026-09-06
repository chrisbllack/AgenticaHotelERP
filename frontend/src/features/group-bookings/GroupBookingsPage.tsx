import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface GroupBooking {
  id: string;
  group_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company?: string;
  arrival_date: string;
  departure_date: string;
  room_count: number;
  rooms_assigned?: number;
  rate_per_room: number;
  total_estimated: number;
  deposit_amount?: number;
  status: string;
  payment_status?: string;
  notes?: string;
  created_at: string;
}

export default function GroupBookingsPage() {
  const [bookings, setBookings] = useState<GroupBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    api.get('/group-bookings')
      .then(res => setBookings(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'tentative': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'checked_in': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Bookings</h1>
          <p className="text-sm text-gray-500">Opera-style group room blocks, master folio & billing</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + New Group Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Groups</p>
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Rooms Blocked</p>
          <p className="text-2xl font-bold text-blue-600">{bookings.reduce((sum, b) => sum + (b.room_count || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Revenue Pipeline</p>
          <p className="text-2xl font-bold text-purple-600">₦{bookings.reduce((sum, b) => sum + b.total_estimated, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Group Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Dates</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Rooms</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Rate/Night</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Est. Total</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Payment</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No group bookings yet. Click "New Group Booking" to create one.</td></tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{b.group_name}</p>
                      <p className="text-xs text-gray-400">{b.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p>{b.contact_name}</p>
                      <p className="text-xs text-gray-400">{b.contact_email}</p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p>{new Date(b.arrival_date).toLocaleDateString()}</p>
                      <p className="text-gray-400">→ {new Date(b.departure_date).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{b.rooms_assigned || 0}</span>
                      <span className="text-gray-400">/{b.room_count || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-right">₦{(b.rate_per_room || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold">₦{(b.total_estimated || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                        {b.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-2">View</button>
                      <button className="text-green-600 hover:text-green-800 text-xs font-medium">Check-in</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Group Booking Form */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Group Booking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., MTN Corporate Retreat" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Primary contact" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="email@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="+234..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date *</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date *</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rooms to Block *</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Night (₦) *</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (₦)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Special requirements, meeting rooms needed, etc."></textarea>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Create Group Booking</button>
            <button onClick={() => setShowNewForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
