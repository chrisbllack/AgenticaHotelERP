import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Venue {
  id: string;
  name: string;
  capacity: number;
  hourly_rate: number;
  daily_rate: number;
  amenities: string;
  status: string;
}

export default function SalesCateringPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'venues' | 'bookings' | 'packages'>('venues');

  useEffect(() => {
    api.get('/events/venues')
      .then(res => setVenues(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales & Catering</h1>
          <p className="text-sm text-gray-500">Event spaces, proposals, contracts, and catering packages</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + New Event Proposal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'venues' as const, label: 'Venues', icon: '🏛️' },
          { key: 'bookings' as const, label: 'Event Bookings', icon: '📅' },
          { key: 'packages' as const, label: 'Packages & Menus', icon: '🍽️' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Venues Tab */}
      {activeTab === 'venues' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : venues.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">No venues configured</div>
          ) : (
            venues.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{v.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {v.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>👥</span>
                    <span>Capacity: <strong>{v.capacity}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>⏰</span>
                    <span>₦{v.hourly_rate.toLocaleString()}/hr | ₦{v.daily_rate.toLocaleString()}/day</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {v.amenities}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                    Book Now
                  </button>
                  <button className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100">
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <input type="text" placeholder="Search events..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>All Status</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium">No event bookings yet</p>
            <p className="text-sm mt-1">Create your first event proposal to get started</p>
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Executive Meeting', price: '₦250,000/day', includes: ['Venue rental', 'Projector & screen', 'Coffee break (AM & PM)', 'Notepads & pens', 'Wi-Fi'], capacity: '20 pax' },
            { name: 'Conference Package', price: '₦500,000/day', includes: ['Full day venue', 'AV equipment', 'Lunch buffet', 'Coffee breaks', 'Flip chart', 'Name badges'], capacity: '100 pax' },
            { name: 'Gala Dinner', price: '₦800,000/event', includes: ['Ballroom rental', '3-course dinner', 'Welcome drinks', 'Live band', 'Décor', 'MC', 'Photography'], capacity: '200 pax' },
            { name: 'Wedding Reception', price: '₦1,500,000/event', includes: ['Full venue décor', '5-course dinner', 'Open bar', 'DJ & MC', 'Bridal suite', 'Cake table', 'Photo booth'], capacity: '300 pax' },
            { name: 'Product Launch', price: '₦600,000/event', includes: ['Venue + AV', 'Stage setup', 'Lighting', 'Media wall', 'Canapés & drinks', 'Press kit area'], capacity: '150 pax' },
            { name: 'Training Workshop', price: '₦180,000/day', includes: ['Training room', 'Projector', 'Stationery', 'Lunch', 'Certificate printing'], capacity: '50 pax' },
          ].map((pkg, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-1">{pkg.name}</h3>
              <p className="text-lg font-bold text-blue-600 mb-3">{pkg.price}</p>
              <p className="text-xs text-gray-400 mb-3">Capacity: {pkg.capacity}</p>
              <ul className="space-y-1">
                {pkg.includes.map((item, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
                Book Package
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
