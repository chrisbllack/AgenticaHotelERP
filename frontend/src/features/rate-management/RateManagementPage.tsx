import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface RatePlan {
  id: string;
  name: string;
  code: string;
  base_rate: number;
  min_rate: number;
  max_rate: number;
  rate_type: string;
  is_active: boolean;
  min_stay?: number;
  max_stay?: number;
  advance_days?: number;
}

interface SeasonalRule {
  id: string;
  name: string;
  season: string;
  start_date: string;
  end_date: string;
  adjustment_type: string;
  adjustment_value: number;
  rate_plan: string;
  status: string;
}

interface PricingRule {
  id: string;
  name: string;
  rule_type: string;
  condition: string;
  adjustment: number;
  priority: number;
  status: string;
}

export default function RateManagementPage() {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [seasonalRules, setSeasonalRules] = useState<SeasonalRule[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'seasonal' | 'dynamic' | 'promotions'>('plans');

  useEffect(() => {
    Promise.all([
      api.get('/rates').catch(() => ({ data: { data: [] } })),
      api.get('/revenue/pricing-rules').catch(() => ({ data: { data: [] } })),
    ]).then(([ratesRes, rulesRes]) => {
      setRatePlans(ratesRes.data.data || []);
      setPricingRules(rulesRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const demoSeasonalRules: SeasonalRule[] = [
    { id: '1', name: 'Christmas Peak', season: 'Peak', start_date: '2026-12-15', end_date: '2027-01-05', adjustment_type: 'percentage', adjustment_value: 40, rate_plan: 'All Plans', status: 'active' },
    { id: '2', name: 'Easter Holiday', season: 'High', start_date: '2026-04-02', end_date: '2026-04-07', adjustment_type: 'percentage', adjustment_value: 25, rate_plan: 'All Plans', status: 'active' },
    { id: '3', name: 'Low Season', season: 'Low', start_date: '2026-06-01', end_date: '2026-08-31', adjustment_type: 'percentage', adjustment_value: -15, rate_plan: 'All Plans', status: 'active' },
    { id: '4', name: 'Detty December Lagos', season: 'Peak', start_date: '2026-12-01', end_date: '2026-12-31', adjustment_type: 'percentage', adjustment_value: 50, rate_plan: 'BAR', status: 'active' },
    { id: '5', name: 'Conference Season', season: 'High', start_date: '2026-03-01', end_date: '2026-03-31', adjustment_type: 'fixed', adjustment_value: 5000, rate_plan: 'Corporate', status: 'active' },
    { id: '6', name: 'Rainy Season Discount', season: 'Low', start_date: '2026-07-01', end_date: '2026-09-30', adjustment_type: 'percentage', adjustment_value: -20, rate_plan: 'OTA', status: 'active' },
  ];

  const demoPromotions = [
    { name: 'Early Bird 30%', description: 'Book 30+ days in advance, save 30%', code: 'EARLY30', valid_until: '2026-12-31', uses: 45, status: 'active' },
    { name: 'Long Stay Discount', description: 'Stay 7+ nights, save 15%', code: 'LONGSTAY', valid_until: '2026-12-31', uses: 28, status: 'active' },
    { name: 'Weekend Getaway', description: 'Fri-Sun package with breakfast included', code: 'WEEKEND', valid_until: '2026-12-31', uses: 62, status: 'active' },
    { name: 'Corporate Advance', description: 'Corporate rates with 20% advance payment', code: 'CORP20', valid_until: '2026-06-30', uses: 15, status: 'active' },
    { name: 'Honeymoon Package', description: 'Complimentary upgrade + spa credit + dinner', code: 'LOVE', valid_until: '2026-12-31', uses: 12, status: 'active' },
  ];

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'Peak': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Management</h1>
          <p className="text-sm text-gray-500">Rate plans, seasonal pricing, dynamic pricing & promotions</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + New Rate Plan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'plans' as const, label: 'Rate Plans', icon: '💰' },
          { key: 'seasonal' as const, label: 'Seasonal Pricing', icon: '📅' },
          { key: 'dynamic' as const, label: 'Dynamic Rules', icon: '⚡' },
          { key: 'promotions' as const, label: 'Promotions', icon: '🎁' },
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

      {/* Rate Plans Tab */}
      {activeTab === 'plans' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Plan Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Base Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Min</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Max</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Min Stay</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : ratePlans.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400">No rate plans configured</td></tr>
                ) : (
                  ratePlans.map((plan: any) => (
                    <tr key={plan.id || plan.name} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{plan.name}</td>
                      <td className="py-3 px-4 text-gray-500">{plan.code || plan.name?.split(' ').map((w: string) => w[0]).join('')}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{plan.rate_type || plan.type || 'standard'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">₦{(plan.base_rate || plan.rate || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-500">₦{(plan.min_rate || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-500">₦{(plan.max_rate || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">{plan.min_stay || '—'} nights</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {plan.is_active !== false ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seasonal Pricing Tab */}
      {activeTab === 'seasonal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Seasonal Pricing Calendar</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              + Add Season Rule
            </button>
          </div>

          {/* Season Legend */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div><span className="text-sm">Peak Season</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400"></div><span className="text-sm">High Season</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400"></div><span className="text-sm">Low Season</span></div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rule Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Season</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date Range</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Applies To</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Adjustment</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoSeasonalRules.map(rule => (
                  <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{rule.name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeasonColor(rule.season)}`}>
                        {rule.season}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(rule.start_date).toLocaleDateString()} — {new Date(rule.end_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{rule.rate_plan}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${rule.adjustment_value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {rule.adjustment_value > 0 ? '+' : ''}{rule.adjustment_value}{rule.adjustment_type === 'percentage' ? '%' : '₦'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{rule.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dynamic Pricing Rules Tab */}
      {activeTab === 'dynamic' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Occupancy-Based Dynamic Pricing</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              + Add Rule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Ultra Low Demand', condition: 'Occupancy < 30%', adjustment: '-25%', color: 'bg-blue-50 border-blue-200', description: 'Aggressive discounting to drive bookings' },
              { name: 'Low Demand', condition: 'Occupancy 30-50%', adjustment: '-15%', color: 'bg-green-50 border-green-200', description: 'Moderate discount to stimulate demand' },
              { name: 'Normal Demand', condition: 'Occupancy 50-70%', adjustment: '±0%', color: 'bg-gray-50 border-gray-200', description: 'Standard BAR rate applies' },
              { name: 'High Demand', condition: 'Occupancy 70-85%', adjustment: '+15%', color: 'bg-orange-50 border-orange-200', description: 'Premium pricing as rooms fill up' },
              { name: 'Very High Demand', condition: 'Occupancy 85-95%', adjustment: '+25%', color: 'bg-red-50 border-red-200', description: 'Maximum yield optimization' },
              { name: 'Sold Out Expected', condition: 'Occupancy > 95%', adjustment: '+40%', color: 'bg-red-100 border-red-300', description: 'Final rate push before sellout' },
            ].map((rule, i) => (
              <div key={i} className={`p-4 rounded-xl border ${rule.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{rule.name}</span>
                  <span className={`text-lg font-bold ${rule.adjustment.startsWith('+') ? 'text-red-600' : rule.adjustment.startsWith('-') ? 'text-green-600' : 'text-gray-600'}`}>
                    {rule.adjustment}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{rule.condition}</p>
                <p className="text-xs text-gray-400">{rule.description}</p>
              </div>
            ))}
          </div>

          {/* Competitor Rate Intelligence (Opera/Djubo feature) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">🏪 Competitor Rate Intelligence</h3>
            <p className="text-sm text-gray-500 mb-4">Monitor competitor pricing (requires OTA integration)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Transcorp Hilton', distance: '2.3 km', avg_rate: 85000, trend: 'up', change: '+5%' },
                { name: 'Eko Hotels', distance: '5.1 km', avg_rate: 120000, trend: 'down', change: '-3%' },
                { name: 'Radisson Blu', distance: '3.7 km', avg_rate: 65000, trend: 'stable', change: '0%' },
              ].map((comp, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comp.name}</span>
                    <span className="text-xs text-gray-400">{comp.distance}</span>
                  </div>
                  <p className="text-lg font-bold">₦{comp.avg_rate.toLocaleString()}</p>
                  <p className={`text-xs mt-1 ${comp.trend === 'up' ? 'text-red-500' : comp.trend === 'down' ? 'text-green-500' : 'text-gray-400'}`}>
                    {comp.change} vs last month
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Active Promotions & Packages</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              + Create Promotion
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoPromotions.map((promo, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">🎁</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{promo.status}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{promo.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{promo.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Code: <strong className="text-gray-600">{promo.code}</strong></span>
                  <span>{promo.uses} bookings</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Valid until: {new Date(promo.valid_until).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
