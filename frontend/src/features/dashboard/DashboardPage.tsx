import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface DashboardData {
  arrivals: number;
  departures: number;
  in_house: number;
  available_rooms: number;
  occupied_rooms: number;
  vip_arrivals: number;
  outstanding_balance: number;
  room_status_breakdown: { status: string; count: number }[];
}

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ['front-desk-dashboard'],
    queryFn: async () => {
      const res = await api.get('/front-desk/dashboard');
      return res.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = [
    {
      label: 'Arrivals Today',
      value: dashboard?.arrivals ?? 0,
      icon: '✈️',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Departures Today',
      value: dashboard?.departures ?? 0,
      icon: '🏠',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'In-House Guests',
      value: dashboard?.in_house ?? 0,
      icon: '👤',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Available Rooms',
      value: dashboard?.available_rooms ?? 0,
      icon: '🛏️',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Occupied Rooms',
      value: dashboard?.occupied_rooms ?? 0,
      icon: '🔒',
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'VIP Arrivals',
      value: dashboard?.vip_arrivals ?? 0,
      icon: '⭐',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  const totalRooms = (dashboard?.available_rooms ?? 0) + (dashboard?.occupied_rooms ?? 0);
  const occupancyRate = totalRooms > 0 ? Math.round(((dashboard?.occupied_rooms ?? 0) / totalRooms) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time hotel operations overview</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.textColor}`}>
                  {isLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Occupancy & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Occupancy Rate</h3>
          <div className="flex items-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="35" fill="none" stroke="#3B82F6" strokeWidth="8"
                  strokeDasharray={`${occupancyRate * 2.2} 220`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{occupancyRate}%</span>
              </div>
            </div>
            <div className="ml-6">
              <p className="text-sm text-gray-500">Total Rooms: {totalRooms}</p>
              <p className="text-sm text-gray-500">Occupied: {dashboard?.occupied_rooms ?? 0}</p>
              <p className="text-sm text-gray-500">Available: {dashboard?.available_rooms ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Outstanding Balance</h3>
          <p className="text-3xl font-bold text-red-600">
            ₦{(dashboard?.outstanding_balance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-2">Across all open folios</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a href="/reservations" className="block w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
              ➕ New Reservation
            </a>
            <a href="/guests" className="block w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors">
              👤 Register Guest
            </a>
            <a href="/front-desk" className="block w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors">
              🏨 Front Desk
            </a>
            <a href="/pos" className="block w-full text-left px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors">
              🍽️ POS Terminal
            </a>
          </div>
        </div>
      </div>

      {/* Room Status Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Room Status Overview</h3>
        {dashboard?.room_status_breakdown && dashboard.room_status_breakdown.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {dashboard.room_status_breakdown.map((item) => (
              <div key={item.status} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-xs text-gray-500 capitalize">{item.status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Vacant Clean', count: 0, color: 'bg-green-100 text-green-700' },
              { label: 'Vacant Dirty', count: 0, color: 'bg-red-100 text-red-700' },
              { label: 'Occupied', count: 0, color: 'bg-blue-100 text-blue-700' },
              { label: 'Inspected', count: 0, color: 'bg-purple-100 text-purple-700' },
              { label: 'Out of Order', count: 0, color: 'bg-gray-100 text-gray-700' },
              { label: 'Reserved', count: 0, color: 'bg-amber-100 text-amber-700' },
            ].map((item) => (
              <div key={item.label} className={`text-center p-3 rounded-lg ${item.color}`}>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
