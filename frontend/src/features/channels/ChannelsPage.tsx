import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

// ═══════════════════════════════════════════════════════════════
// CHANNEL MANAGER — Production-grade OTA integration dashboard
// ═══════════════════════════════════════════════════════════════

interface Channel {
  id: string;
  property_id: string;
  name: string;
  code: string;
  enabled: boolean;
  status: string;
  commission: number;
  markup: number;
  markup_type: string;
  min_stay: number;
  max_stay: number;
  hotel_id: string;
  last_sync_at: string | null;
  last_sync_status: string;
  total_bookings: number;
  total_revenue: number;
}

interface ChannelPerformance {
  name: string;
  code: string;
  total_bookings: number;
  total_revenue: number;
  avg_rate: number;
  commission_pct: number;
  total_commission: number;
  net_revenue: number;
  revenue_share_pct: number;
}

interface SyncLogEntry {
  id: string;
  channel_id: string;
  channel_name: string;
  direction: string;
  type: string;
  status: string;
  items_count: number;
  error_count: number;
  duration_ms: number;
  error_msg: string;
  created_at: string;
}

interface ChannelBooking {
  channel_code: string;
  ota_reservation_id: string;
  guest_name: string;
  guest_email: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  rate_per_night: number;
  total_amount: number;
  commission: number;
  net_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  number_of_guests: number;
}

interface DashboardData {
  summary: {
    total_channels: number;
    connected_channels: number;
    enabled_channels: number;
    total_revenue: number;
  };
  channels: Channel[];
  performance: {
    channels: ChannelPerformance[];
    total_revenue: number;
    period: string;
  };
}

const OTA_LOGOS: Record<string, string> = {
  bkng: '🔵',
  expe: '🟠',
  airb: '🔴',
  agda: '🟡',
  jumia: '🟢',
  hotels_ng: '🟣',
  wakanow: '🟤',
  direct: '⚪',
};

const OTA_COLORS: Record<string, string> = {
  bkng: 'from-blue-600 to-blue-800',
  expe: 'from-orange-500 to-orange-700',
  airb: 'from-rose-500 to-rose-700',
  agda: 'from-yellow-500 to-yellow-700',
  jumia: 'from-green-500 to-green-700',
  hotels_ng: 'from-purple-500 to-purple-700',
  wakanow: 'from-amber-600 to-amber-800',
  direct: 'from-gray-500 to-gray-700',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  try {
    return new Date(dateStr).toLocaleString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function ChannelsPage() {
  const [tab, setTab] = useState<'dashboard' | 'channels' | 'sync' | 'bookings' | 'logs'>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [channelBookings, setChannelBookings] = useState<ChannelBooking[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedBookingChannel, setSelectedBookingChannel] = useState<string>('');
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showSyncResult, setShowSyncResult] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/channels/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
    setLoading(false);
  };

  const fetchSyncLogs = async (channelId: string) => {
    setSelectedChannel(channelId);
    try {
      const res = await api.get(`/channels/sync-log?channel_id=${channelId}`);
      setSyncLogs(res.data?.logs || []);
    } catch (err) {
      console.error('Failed to fetch sync logs:', err);
    }
  };

  const fetchChannelBookings = async (channelId: string) => {
    setSelectedBookingChannel(channelId);
    try {
      const res = await api.get(`/channels/bookings?channel_id=${channelId}`);
      setChannelBookings(res.data?.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const syncRates = async () => {
    setSyncing('rates');
    try {
      const res = await api.post('/channels/sync-rates');
      setSyncResult(res.data);
      setShowSyncResult(true);
      setTimeout(() => setShowSyncResult(false), 5000);
      fetchDashboard();
    } catch (err) {
      console.error('Rate sync failed:', err);
    }
    setSyncing(null);
  };

  const syncAvailability = async () => {
    setSyncing('availability');
    try {
      const res = await api.post('/channels/sync-availability');
      setSyncResult(res.data);
      setShowSyncResult(true);
      setTimeout(() => setShowSyncResult(false), 5000);
      fetchDashboard();
    } catch (err) {
      console.error('Availability sync failed:', err);
    }
    setSyncing(null);
  };

  const pullBookings = async () => {
    setSyncing('bookings');
    try {
      const res = await api.post('/channels/pull-bookings');
      setSyncResult(res.data);
      setShowSyncResult(true);
      setTimeout(() => setShowSyncResult(false), 5000);
      fetchDashboard();
    } catch (err) {
      console.error('Booking pull failed:', err);
    }
    setSyncing(null);
  };

  const channels = dashboard?.channels || [];
  const performance = dashboard?.performance?.channels || [];
  const totalRevenue = dashboard?.performance?.total_revenue || 0;
  const summary = dashboard?.summary;

  // ── Sync Result Toast ──
  const SyncToast = () => {
    if (!showSyncResult || !syncResult) return null;
    return (
      <div className="fixed top-4 right-4 z-50 bg-white border-l-4 border-green-500 rounded-lg shadow-xl p-4 max-w-sm animate-slide-in">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{syncResult.success ? '✅' : '⚠️'}</span>
          <div>
            <p className="font-semibold text-sm">{syncResult.message || 'Sync complete'}</p>
            <p className="text-xs text-gray-500">
              {syncResult.synced_items || 0} synced • {syncResult.failed_items || 0} failed
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SyncToast />

      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Channel Manager</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage OTA connections, sync rates & availability, track bookings
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={syncRates}
              disabled={syncing !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {syncing === 'rates' ? <span className="animate-spin">⏳</span> : '💰'}
              Sync Rates
            </button>
            <button
              onClick={syncAvailability}
              disabled={syncing !== null}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {syncing === 'availability' ? <span className="animate-spin">⏳</span> : '📦'}
              Sync Availability
            </button>
            <button
              onClick={pullBookings}
              disabled={syncing !== null}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {syncing === 'bookings' ? <span className="animate-spin">⏳</span> : '📥'}
              Pull Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-0">
          {[
            { key: 'dashboard', label: '📊 Overview', icon: '' },
            { key: 'channels', label: '🔗 Channels', icon: '' },
            { key: 'sync', label: '📡 Sync History', icon: '' },
            { key: 'bookings', label: '📋 OTA Bookings', icon: '' },
            { key: 'logs', label: '⚙️ Room Mappings', icon: '' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as any);
                if (t.key === 'dashboard') fetchDashboard();
              }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Dashboard Overview                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <p className="text-sm text-gray-500">Total Channels</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summary?.total_channels || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {summary?.connected_channels || 0} connected
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <p className="text-sm text-gray-500">Active Channels</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{summary?.enabled_channels || 0}</p>
                <p className="text-xs text-gray-400 mt-1">syncing rates & inventory</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <p className="text-sm text-gray-500">Total Revenue (OTA)</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-1">all time from OTA bookings</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <p className="text-sm text-gray-500">Total Commission</p>
                <p className="text-3xl font-bold text-red-500 mt-1">
                  {formatCurrency(
                    performance.reduce((sum, p) => sum + p.total_commission, 0)
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">paid to OTA channels</p>
              </div>
            </div>

            {/* Channel Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Channel Performance</h2>
                <p className="text-sm text-gray-500">Revenue and commission breakdown by OTA</p>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission %</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Share %</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {performance.map((perf) => (
                    <tr key={perf.code} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{OTA_LOGOS[perf.code] || '📡'}</span>
                          <span className="font-medium">{perf.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-sm">{perf.commission_pct}%</td>
                      <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(perf.total_revenue)}</td>
                      <td className="px-6 py-3 text-right text-sm text-red-500">{formatCurrency(perf.total_commission)}</td>
                      <td className="px-6 py-3 text-right text-sm text-emerald-600 font-medium">{formatCurrency(perf.net_revenue)}</td>
                      <td className="px-6 py-3 text-right text-sm">{perf.revenue_share_pct}%</td>
                      <td className="px-6 py-3">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.max(perf.revenue_share_pct, 1)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {performance.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No performance data yet. Sync rates and pull bookings to generate data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Channel Cards                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {tab === 'channels' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition hover:shadow-md ${
                  ch.enabled ? 'border-green-200' : 'border-gray-200 opacity-75'
                }`}
              >
                {/* Channel Header */}
                <div className={`bg-gradient-to-r ${OTA_COLORS[ch.code] || 'from-gray-500 to-gray-700'} px-5 py-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{OTA_LOGOS[ch.code] || '📡'}</span>
                      <div>
                        <h3 className="font-bold text-lg">{ch.name}</h3>
                        <p className="text-white/70 text-xs">{ch.hotel_id}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ch.status === 'connected' ? 'bg-white/20 text-white' :
                      ch.status === 'syncing' ? 'bg-yellow-400/30 text-yellow-100' :
                      'bg-white/10 text-white/50'
                    }`}>
                      {ch.status === 'connected' ? '● Connected' :
                       ch.status === 'syncing' ? '⟳ Syncing' :
                       '○ Disconnected'}
                    </div>
                  </div>
                </div>

                {/* Channel Body */}
                <div className="px-5 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Commission</p>
                      <p className="font-semibold">{ch.commission}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Markup</p>
                      <p className="font-semibold">{ch.markup}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bookings</p>
                      <p className="font-semibold">{ch.total_bookings}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Revenue</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(ch.total_revenue)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-400">
                      Last sync: {formatDate(ch.last_sync_at)}
                      {ch.last_sync_status && (
                        <span className={`ml-2 ${
                          ch.last_sync_status === 'success' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          ({ch.last_sync_status})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Channel Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t flex justify-between items-center">
                  <span className={`text-xs font-medium ${ch.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {ch.enabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTab('sync');
                        fetchSyncLogs(ch.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Sync Log
                    </button>
                    <button
                      onClick={() => {
                        setTab('bookings');
                        fetchChannelBookings(ch.id);
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800"
                    >
                      Bookings
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Sync History                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {tab === 'sync' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {channels.filter(ch => ch.enabled).map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => fetchSyncLogs(ch.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    selectedChannel === ch.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {OTA_LOGOS[ch.code]} {ch.name}
                </button>
              ))}
            </div>

            {selectedChannel ? (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Errors</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {syncLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{formatDate(log.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.direction === 'push'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {log.direction === 'push' ? '↑ Push' : '↓ Pull'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">{log.type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.status === 'success' ? 'bg-green-100 text-green-700' :
                            log.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{log.items_count}</td>
                        <td className="px-4 py-3 text-right text-sm text-red-500">{log.error_count}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-400">{log.duration_ms}ms</td>
                      </tr>
                    ))}
                    {syncLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No sync history yet. Run a sync to see logs here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📡</p>
                <p>Select a channel to view its sync history</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: OTA Bookings                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {channels.filter(ch => ch.enabled).map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => fetchChannelBookings(ch.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    selectedBookingChannel === ch.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {OTA_LOGOS[ch.code]} {ch.name}
                </button>
              ))}
            </div>

            {selectedBookingChannel ? (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OTA Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nights</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {channelBookings.map((bk, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-blue-600">{bk.ota_reservation_id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{bk.guest_name}</td>
                        <td className="px-4 py-3 text-sm">{bk.room_type_id}</td>
                        <td className="px-4 py-3 text-sm">{bk.check_in}</td>
                        <td className="px-4 py-3 text-sm">{bk.check_out}</td>
                        <td className="px-4 py-3 text-right text-sm">{bk.nights}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(bk.total_amount)}</td>
                        <td className="px-4 py-3 text-right text-sm text-red-500">{formatCurrency(bk.commission)}</td>
                        <td className="px-4 py-3 text-right text-sm text-emerald-600">{formatCurrency(bk.net_amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            bk.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            bk.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {bk.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {channelBookings.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                          No bookings imported from this channel yet. Click "Pull Bookings" to import.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p>Select a channel to view imported bookings</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Room Mappings                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {tab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">PMS ↔ OTA Room Type Mappings</h2>
            <p className="text-sm text-gray-500 mb-6">
              These mappings control how your room types appear on each OTA channel.
              Rates and availability are automatically mapped when syncing.
            </p>
            <div className="space-y-4">
              {channels.filter(ch => ch.enabled).map((ch) => (
                <div key={ch.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{OTA_LOGOS[ch.code]}</span>
                    <h3 className="font-semibold">{ch.name}</h3>
                    <span className="text-xs text-gray-400">({ch.hotel_id})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 text-xs">Standard Room</p>
                      <p className="font-mono text-xs">PMS: rt-standard → OTA: {ch.code.toUpperCase()}-STD</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 text-xs">Deluxe Room</p>
                      <p className="font-mono text-xs">PMS: rt-deluxe → OTA: {ch.code.toUpperCase()}-DLX</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 text-xs">Executive Suite</p>
                      <p className="font-mono text-xs">PMS: rt-executive → OTA: {ch.code.toUpperCase()}-EXS</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 text-xs">Presidential Suite</p>
                      <p className="font-mono text-xs">PMS: rt-presidential → OTA: {ch.code.toUpperCase()}-PRS</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
