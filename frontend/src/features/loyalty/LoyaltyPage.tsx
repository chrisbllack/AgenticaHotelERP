import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface LoyaltyTier {
  id: string;
  name: string;
  code: string;
  min_points: number;
  discount_percent: number;
  benefits: string;
  status: string;
}

export default function LoyaltyPage() {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/loyalty/tiers')
      .then(res => setTiers(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tierColors: Record<string, { bg: string; border: string; icon: string }> = {
    'Member': { bg: 'from-gray-400 to-gray-500', border: 'border-gray-200', icon: '🏷️' },
    'Silver': { bg: 'from-gray-300 to-gray-400', border: 'border-gray-300', icon: '🥈' },
    'Gold': { bg: 'from-yellow-400 to-amber-500', border: 'border-yellow-200', icon: '🥇' },
    'Platinum': { bg: 'from-slate-500 to-slate-600', border: 'border-slate-200', icon: '💎' },
    'VIP': { bg: 'from-purple-500 to-indigo-600', border: 'border-purple-200', icon: '👑' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-sm text-gray-500">Guest loyalty tiers, points management & rewards</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Add Member
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium">
            Configure Tiers
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="text-2xl font-bold text-gray-900">156</p>
          <p className="text-xs text-green-600 mt-1">↑ 12 this month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Points</p>
          <p className="text-2xl font-bold text-blue-600">2.4M</p>
          <p className="text-xs text-gray-400 mt-1">across all tiers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Points Redeemed</p>
          <p className="text-2xl font-bold text-purple-600">890K</p>
          <p className="text-xs text-gray-400 mt-1">this month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Repeat Guests</p>
          <p className="text-2xl font-bold text-emerald-600">34%</p>
          <p className="text-xs text-green-600 mt-1">↑ 5% vs last month</p>
        </div>
      </div>

      {/* Tier Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Tiers</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {tiers.map(tier => {
              const colors = tierColors[tier.name] || tierColors['Member'];
              return (
                <div key={tier.id} className={`bg-gradient-to-br ${colors.bg} rounded-xl p-5 text-white shadow-lg`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{colors.icon}</span>
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                  </div>
                  <p className="text-sm opacity-80 mb-1">Min. Points: {tier.min_points.toLocaleString()}</p>
                  <p className="text-sm opacity-80 mb-3">Discount: {tier.discount_percent}%</p>
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-xs font-medium mb-1">Benefits:</p>
                    <p className="text-xs opacity-90">{tier.benefits}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📊 Guest Segmentation</h3>
          <div className="space-y-3">
            {[
              { segment: 'Corporate Travelers', count: 45, revenue: '₦12.5M', color: 'bg-blue-500' },
              { segment: 'Leisure Tourists', count: 38, revenue: '₦8.2M', color: 'bg-green-500' },
              { segment: 'Government Officials', count: 22, revenue: '₦6.1M', color: 'bg-purple-500' },
              { segment: 'Event Delegates', count: 31, revenue: '₦4.8M', color: 'bg-orange-500' },
              { segment: 'OTA Bookings', count: 20, revenue: '₦3.2M', color: 'bg-red-500' },
            ].map((seg, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${seg.color}`}></div>
                <span className="text-sm font-medium flex-1">{seg.segment}</span>
                <span className="text-sm text-gray-500">{seg.count} guests</span>
                <span className="text-sm font-semibold">{seg.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">🎁 Recent Rewards</h3>
          <div className="space-y-3">
            {[
              { guest: 'Amina Hassan', reward: 'Free Night', points: 5000, date: 'Sep 4' },
              { guest: 'Chidi Okonkwo', reward: 'Room Upgrade', points: 2000, date: 'Sep 3' },
              { guest: 'Fatima Bello', reward: 'Spa Treatment', points: 3000, date: 'Sep 2' },
              { guest: 'Emeka Nwosu', reward: 'Late Checkout', points: 1000, date: 'Sep 1' },
              { guest: 'Sarah Johnson', reward: 'Dinner for 2', points: 4000, date: 'Aug 30' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                  {r.guest.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.guest}</p>
                  <p className="text-xs text-gray-400">{r.reward} • {r.date}</p>
                </div>
                <span className="text-sm text-purple-600 font-medium">-{r.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
