import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

interface GuestProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality: string;
  total_stays: number;
  total_spent: number;
  loyalty_tier: string;
  loyalty_points: number;
  marketing_consent: boolean;
}

interface FeedbackItem {
  id: number;
  guest_name: string;
  overall_rating: number;
  comments: string;
  would_recommend: boolean;
  created_at: string;
}

export default function CRMPage() {
  const [tab, setTab] = useState<'guests' | 'loyalty' | 'feedback' | 'events'>('guests');
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('infineon_token') || '';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [gRes, fRes] = await Promise.all([
        fetch(`${API_BASE}/crm/guests?q=${search}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/crm/feedback`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const gData = await gRes.json();
      const fData = await fRes.json();
      setGuests(gData.data || []);
      setFeedback(fData.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const searchGuests = async () => {
    if (!search) { fetchData(); return; }
    try {
      const res = await fetch(`${API_BASE}/crm/guests?q=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGuests(data.data || []);
    } catch (err) { console.error(err); }
  };

  const loyaltyTiers = [
    { name: 'Member', min: 0, color: 'bg-gray-100', textColor: 'text-gray-700', discount: '0%', benefits: 'Welcome drink, Late checkout' },
    { name: 'Silver', min: 500, color: 'bg-gray-200', textColor: 'text-gray-800', discount: '5%', benefits: '10% F&B, Priority check-in' },
    { name: 'Gold', min: 1500, color: 'bg-yellow-100', textColor: 'text-yellow-700', discount: '10%', benefits: '15% F&B, Free breakfast, Free parking' },
    { name: 'Platinum', min: 5000, color: 'bg-purple-100', textColor: 'text-purple-700', discount: '15%', benefits: '20% F&B, Free spa, Suite upgrade' },
    { name: 'VIP', min: 10000, color: 'bg-pink-100', textColor: 'text-pink-700', discount: '20%', benefits: 'All + Private dining, Butler, Airport transfer' },
  ];

  const tierColor = (tier: string) => {
    const t = loyaltyTiers.find(t => t.name.toLowerCase() === tier);
    return t ? `${t.color} ${t.textColor}` : 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">CRM & Guest Profiles</h1>

      <div className="flex gap-4 mb-6 border-b">
        {(['guests', 'loyalty', 'feedback', 'events'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium capitalize ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t === 'guests' ? 'Guest Profiles' : t === 'loyalty' ? 'Loyalty Program' : t}
          </button>
        ))}
      </div>

      {tab === 'guests' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchGuests()}
              placeholder="Search by name, email, phone..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            <button onClick={searchGuests} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Search</button>
          </div>

          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stays</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loyalty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {guests.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No guests found. Search to find guest profiles.</td></tr>
                ) : guests.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {g.first_name?.[0]}{g.last_name?.[0]}
                        </div>
                        <span className="font-medium">{g.first_name} {g.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{g.email || '—'}</div>
                      <div>{g.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{g.total_stays}</td>
                    <td className="px-4 py-3 text-sm font-medium">₦{g.total_spent.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${tierColor(g.loyalty_tier)}`}>
                        {g.loyalty_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium">{g.loyalty_points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'loyalty' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Loyalty tiers are automatically assigned based on points earned from stays.</p>
          <div className="space-y-4">
            {loyaltyTiers.map(tier => (
              <div key={tier.name} className={`rounded-xl p-6 ${tier.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-bold ${tier.textColor}`}>{tier.name}</h3>
                    <p className="text-sm text-gray-600">{tier.min.toLocaleString()}+ points • {tier.discount} discount</p>
                  </div>
                  <span className="text-3xl">{tier.name === 'VIP' ? '👑' : tier.name === 'Platinum' ? '💎' : tier.name === 'Gold' ? '🥇' : tier.name === 'Silver' ? '🥈' : '⭐'}</span>
                </div>
                <p className="text-sm mt-2 text-gray-700">{tier.benefits}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500">No feedback submitted yet.</p>
            </div>
          ) : feedback.map(f => (
            <div key={f.id} className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{f.guest_name}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={s <= f.overall_rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">{f.comments || 'No comments'}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs ${f.would_recommend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {f.would_recommend ? '👍 Recommends' : '👎 Would not recommend'}
                </span>
                <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">Manage events, banquets, and conferences</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ New Event</button>
          </div>
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">No upcoming events. Create one to get started.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { name: 'Grand Ballroom', cap: 500, rate: '₦1M/day' },
                { name: 'Royal Hall', cap: 200, rate: '₦500K/day' },
                { name: 'Boardroom A', cap: 20, rate: '₦200K/day' },
                { name: 'Garden Pavilion', cap: 100, rate: '₦350K/day' },
              ].map(v => (
                <div key={v.name} className="border border-gray-200 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-sm">{v.name}</h4>
                  <p className="text-xs text-gray-500">{v.cap} capacity</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">{v.rate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
