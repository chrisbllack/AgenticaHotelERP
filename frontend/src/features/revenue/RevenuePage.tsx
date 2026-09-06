import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface ForecastDay {
  date: string;
  booked: number;
  forecast_occ: number;
  expected_revenue: number;
}

interface PricingRecommend {
  room_type: string;
  current_rate: number;
  recommended_rate: number;
  priority: string;
  reason: string;
}

interface RatePlan {
  name: string;
  reservations: number;
  revenue: number;
  adr: number;
}

interface ADRbyRoomType {
  name: string;
  adr: number;
  rooms_sold: number;
}

interface RevenueData {
  today_occupancy: number;
  today_adr: number;
  today_revpar: number;
  today_room_revenue: number;
  mtd_occupancy: number;
  mtd_adr: number;
  mtd_revpar: number;
  mtd_revenue: number;
  ytd_occupancy: number;
  ytd_adr: number;
  ytd_revpar: number;
  ytd_revenue: number;
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  forecast_7day: ForecastDay[];
  pricing_recommendations: PricingRecommend[];
  top_rate_plans: RatePlan[];
  top_channels: any[];
  adr_by_room_type: ADRbyRoomType[];
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'mtd' | 'ytd'>('today');

  useEffect(() => {
    setLoading(true);
    api.get('/revenue/dashboard')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">Failed to load revenue data</div>;
  }

  const currentOcc = (period === 'today' ? data.today_occupancy : period === 'mtd' ? data.mtd_occupancy : data.ytd_occupancy) || 0;
  const currentADR = (period === 'today' ? data.today_adr : period === 'mtd' ? data.mtd_adr : data.ytd_adr) || 0;
  const currentRevPAR = (period === 'today' ? data.today_revpar : period === 'mtd' ? data.mtd_revpar : data.ytd_revpar) || 0;
  const currentRevenue = (period === 'today' ? data.today_room_revenue : period === 'mtd' ? data.mtd_revenue : data.ytd_revenue) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
          <p className="text-sm text-gray-500">ADR, RevPAR, Occupancy & Dynamic Pricing Intelligence</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'mtd', 'ytd'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'mtd' ? 'Month to Date' : 'Year to Date'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-sm opacity-80">Occupancy Rate</p>
          <p className="text-3xl font-bold">{currentOcc.toFixed(1)}%</p>
          <p className="text-xs opacity-60 mt-1">{data.occupied_rooms}/{data.total_rooms} rooms</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-sm opacity-80">Average Daily Rate</p>
          <p className="text-3xl font-bold">₦{currentADR.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-1">per occupied room</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-sm opacity-80">RevPAR</p>
          <p className="text-3xl font-bold">₦{currentRevPAR.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-1">revenue per available room</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white shadow-lg">
          <p className="text-sm opacity-80">Room Revenue</p>
          <p className="text-3xl font-bold">₦{currentRevenue.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-1">{period === 'today' ? 'today' : period === 'mtd' ? 'this month' : 'this year'}</p>
        </div>
      </div>

      {/* Period Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Performance Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Metric</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Today</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">MTD</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">YTD</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium">Occupancy</td>
                <td className="py-3 px-4 text-right">{data.today_occupancy.toFixed(1)}%</td>
                <td className="py-3 px-4 text-right">{data.mtd_occupancy.toFixed(1)}%</td>
                <td className="py-3 px-4 text-right">{data.ytd_occupancy.toFixed(1)}%</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium">ADR</td>
                <td className="py-3 px-4 text-right">₦{data.today_adr.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">₦{data.mtd_adr.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">₦{data.ytd_adr.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium">RevPAR</td>
                <td className="py-3 px-4 text-right">₦{data.today_revpar.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">₦{data.mtd_revpar.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">₦{data.ytd_revpar.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Revenue</td>
                <td className="py-3 px-4 text-right font-semibold">₦{data.today_room_revenue.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-semibold">₦{data.mtd_revenue.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-semibold">₦{data.ytd_revenue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Forecast */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📈 7-Day Occupancy Forecast</h3>
          <div className="space-y-3">
            {(data.forecast_7day || []).map((day, i) => {
              const occ = day.forecast_occ || 0;
              return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-medium w-20 text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occ > 80 ? 'bg-red-500' : occ > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(occ, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold w-12 text-right">{occ.toFixed(0)}%</span>
                <span className="text-xs text-gray-400 w-20 text-right">₦{(day.expected_revenue || 0).toLocaleString()}</span>
              </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Recommendations (Opera Yield Management) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">💡 Dynamic Pricing Recommendations</h3>
          <div className="space-y-3">
            {              (!data.pricing_recommendations || data.pricing_recommendations.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-4">No pricing recommendations available</p>
            ) : (
              data.pricing_recommendations.map((rec, i) => (                  <div key={i} className={`p-3 rounded-lg border ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{rec.room_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {rec.priority} priority
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-gray-500">Current: ₦{rec.current_rate.toLocaleString()}</span>
                    <span>→</span>
                    <span className="font-semibold text-blue-700">₦{rec.recommended_rate.toLocaleString()}</span>
                    <span className={`text-xs ${rec.recommended_rate > rec.current_rate ? 'text-green-600' : 'text-red-600'}`}>
                      ({rec.recommended_rate > rec.current_rate ? '+' : ''}{((rec.recommended_rate - rec.current_rate) / rec.current_rate * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADR by Room Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">🏨 ADR by Room Type</h3>
          <div className="space-y-3">
            {data.adr_by_room_type.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No room type data</p>
            ) : (
              data.adr_by_room_type.map((rt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32">{rt.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((rt.adr / (data.today_adr * 2 || 1)) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-sm font-semibold w-24 text-right">₦{rt.adr.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 w-16 text-right">{rt.rooms_sold} sold</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Rate Plans */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">⭐ Top Performing Rate Plans</h3>
          <div className="space-y-3">
            {data.top_rate_plans.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No rate plan data</p>
            ) : (
              data.top_rate_plans.map((rp, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{rp.name}</span>
                    <p className="text-xs text-gray-500">{rp.reservations} reservations</p>
                  </div>
                  <span className="font-semibold text-emerald-600">₦{rp.revenue.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
