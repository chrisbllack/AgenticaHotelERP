import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

interface DashboardData {
  today_arrivals: number;
  today_departures: number;
  in_house_guests: number;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  outstanding_balance: number;
  today_room_revenue: number;
  today_pos_sales: number;
  today_total_revenue: number;
  month_room_revenue: number;
  month_pos_sales: number;
  month_total_revenue: number;
  month_adr: number;
  month_revpar: number;
  dirty_rooms: number;
  clean_rooms: number;
  out_of_order_rooms: number;
  pending_maintenance: number;
  recent_reservations: RecentReservation[];
  top_room_types: RoomTypeStat[];
  revenue_by_source: SourceStat[];
}

interface RecentReservation {
  confirmation_no: string;
  guest_name: string;
  room_type: string;
  arrival_date: string;
  status: string;
  total_amount: number;
}

interface RoomTypeStat {
  room_type: string;
  rooms_sold: number;
  revenue: number;
  average_rate: number;
}

interface SourceStat {
  source: string;
  room_nights: number;
  revenue: number;
}

interface OccupancyRow {
  date: string;
  available: number;
  occupied: number;
  occupancy_pct: number;
  arrivals: number;
  departures: number;
}

interface RoomRevenueRow {
  room_type: string;
  rooms_sold: number;
  room_nights: number;
  revenue: number;
  net_revenue: number;
  average_rate: number;
  tax_amount: number;
}

interface POSSalesRow {
  outlet: string;
  order_count: number;
  total_sales: number;
  avg_check: number;
  discounts: number;
  net_sales: number;
}

interface InventorySummaryRow {
  category: string;
  product_count: number;
  stock_value: number;
  low_stock_items: number;
  expiring_soon: number;
}

type ReportTab = 'dashboard' | 'occupancy' | 'room-revenue' | 'pos-sales' | 'inventory';

export default function ReportsPage() {
  const [reportTab, setReportTab] = useState<ReportTab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyRow[]>([]);
  const [roomRevenue, setRoomRevenue] = useState<RoomRevenueRow[]>([]);
  const [posSales, setPosSales] = useState<POSSalesRow[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  useEffect(() => { loadReportData(); }, [reportTab]);

  async function loadReportData() {
    setLoading(true);
    const token = localStorage.getItem('infineon_token');
    const headers = { 'Authorization': `Bearer ${token}`, 'X-Property-ID': localStorage.getItem('infineon_property_id') || '' };
    
    try {
      switch (reportTab) {
        case 'dashboard': {
          const res = await fetch(`${API_BASE}/reports/dashboard`, { headers });
          if (res.ok) { const d = await res.json(); setDashboard(d.data); }
          break;
        }
        case 'occupancy': {
          const res = await fetch(`${API_BASE}/reports/occupancy?from=${monthStart}&to=${today}`, { headers });
          if (res.ok) { const d = await res.json(); setOccupancy(d.data || []); }
          break;
        }
        case 'room-revenue': {
          const res = await fetch(`${API_BASE}/reports/room-revenue?from=${monthStart}&to=${today}`, { headers });
          if (res.ok) { const d = await res.json(); setRoomRevenue(d.data || []); }
          break;
        }
        case 'pos-sales': {
          const res = await fetch(`${API_BASE}/reports/pos-sales?from=${today}&to=${today}`, { headers });
          if (res.ok) { const d = await res.json(); setPosSales(d.data || []); }
          break;
        }
        case 'inventory': {
          const res = await fetch(`${API_BASE}/reports/inventory`, { headers });
          if (res.ok) { const d = await res.json(); setInventorySummary(d.data || []); }
          break;
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-800', checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800',
      tentative: 'bg-yellow-100 text-yellow-800',
    };
    return map[s] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Executive dashboard, occupancy, revenue, and operational reports</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {([
            { key: 'dashboard' as ReportTab, label: '📊 Executive Dashboard' },
            { key: 'occupancy' as ReportTab, label: '🏨 Occupancy Report' },
            { key: 'room-revenue' as ReportTab, label: '💰 Room Revenue' },
            { key: 'pos-sales' as ReportTab, label: '🍽️ POS Sales' },
            { key: 'inventory' as ReportTab, label: '📦 Inventory Summary' },
          ]).map(t => (
            <button key={t.key} onClick={() => setReportTab(t.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                reportTab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Executive Dashboard */}
          {reportTab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <KPICard label="Occupancy" value={`${dashboard.occupancy_rate.toFixed(1)}%`} sub={`${dashboard.occupied_rooms}/${dashboard.total_rooms} rooms`} color="blue" />
                <KPICard label="In-House" value={dashboard.in_house_guests.toString()} sub="guests" color="green" />
                <KPICard label="Today Revenue" value={`₦${dashboard.today_total_revenue.toLocaleString()}`} sub={`Rooms: ₦${dashboard.today_room_revenue.toLocaleString()}`} color="purple" />
                <KPICard label="ADR" value={`₦${dashboard.month_adr.toFixed(2)}`} sub="avg daily rate" color="indigo" />
                <KPICard label="RevPAR" value={`₦${dashboard.month_revpar.toFixed(2)}`} sub="revenue per room" color="teal" />
                <KPICard label="Outstanding" value={`₦${dashboard.outstanding_balance.toLocaleString()}`} sub="balances due" color="orange" />
              </div>

              {/* Operational Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <OperationalCard label="Arrivals Today" value={dashboard.today_arrivals} icon="✈️" />
                <OperationalCard label="Departures Today" value={dashboard.today_departures} icon="🚶" />
                <OperationalCard label="Dirty Rooms" value={dashboard.dirty_rooms} icon="🧹" warning={dashboard.dirty_rooms > 10} />
                <OperationalCard label="Out of Order" value={dashboard.out_of_order_rooms} icon="🔧" warning={dashboard.out_of_order_rooms > 0} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Breakdown */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
                  <div className="space-y-3">
                    <RevenueBar label="Room Revenue" value={dashboard.month_room_revenue} max={dashboard.month_total_revenue} color="bg-blue-500" />
                    <RevenueBar label="POS Sales" value={dashboard.month_pos_sales} max={dashboard.month_total_revenue} color="bg-green-500" />
                    <div className="pt-3 border-t border-gray-200 flex justify-between font-semibold text-sm">
                      <span>Total</span>
                      <span className="font-mono">₦{dashboard.month_total_revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Revenue by Source */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Revenue by Source</h3>
                  {dashboard.revenue_by_source.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.revenue_by_source.map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'teal'][i % 5]}-500`}></div>
                            <span className="text-sm text-gray-700">{s.source}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono font-medium">₦{s.revenue.toLocaleString()}</span>
                            <span className="text-xs text-gray-500 ml-2">({s.room_nights} nights)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No revenue data yet.</p>
                  )}
                </div>
              </div>

              {/* Top Room Types */}
              {dashboard.top_room_types.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Room Types</h3>
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                        <th className="pb-2">Room Type</th>
                        <th className="pb-2 text-right">Sold</th>
                        <th className="pb-2 text-right">Revenue</th>
                        <th className="pb-2 text-right">Avg Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dashboard.top_room_types.map((rt, i) => (
                        <tr key={i}>
                          <td className="py-2 text-sm font-medium text-gray-900">{rt.room_type}</td>
                          <td className="py-2 text-sm text-right">{rt.rooms_sold}</td>
                          <td className="py-2 text-sm text-right font-mono">₦{rt.revenue.toLocaleString()}</td>
                          <td className="py-2 text-sm text-right font-mono">₦{rt.average_rate.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recent Reservations */}
              {dashboard.recent_reservations.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Reservations</h3>
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                        <th className="pb-2">Confirmation</th>
                        <th className="pb-2">Guest</th>
                        <th className="pb-2">Room Type</th>
                        <th className="pb-2">Arrival</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dashboard.recent_reservations.map((rr, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 text-sm font-mono text-gray-900">{rr.confirmation_no}</td>
                          <td className="py-2 text-sm font-medium text-gray-900">{rr.guest_name}</td>
                          <td className="py-2 text-sm text-gray-600">{rr.room_type}</td>
                          <td className="py-2 text-sm text-gray-600">{rr.arrival_date}</td>
                          <td className="py-2"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(rr.status)}`}>{rr.status}</span></td>
                          <td className="py-2 text-sm text-right font-mono">₦{rr.total_amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Occupancy Report */}
          {reportTab === 'occupancy' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Occupied</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Occupancy %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Arrivals</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Departures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {occupancy.map(o => (
                    <tr key={o.date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{o.date}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{o.available}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{o.occupied}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(o.occupancy_pct, 100)}%` }}></div>
                          </div>
                          <span className="font-mono text-sm">{o.occupancy_pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-green-600">{o.arrivals}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-red-600">{o.departures}</td>
                    </tr>
                  ))}
                  {occupancy.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">No occupancy data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Room Revenue */}
          {reportTab === 'room-revenue' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Room Nights</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roomRevenue.map(r => (
                    <tr key={r.room_type} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.room_type}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{r.rooms_sold}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{r.room_nights}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">₦{r.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">₦{r.average_rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-red-600">₦{r.tax_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-green-700">₦{r.net_revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                  {roomRevenue.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">No room revenue data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* POS Sales */}
          {reportTab === 'pos-sales' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Check</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discounts</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posSales.map(p => (
                    <tr key={p.outlet} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.outlet}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{p.order_count}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">₦{p.total_sales.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">₦{p.avg_check.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-orange-600">₦{p.discounts.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-green-700">₦{p.net_sales.toLocaleString()}</td>
                    </tr>
                  ))}
                  {posSales.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">No POS sales data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Inventory Summary */}
          {reportTab === 'inventory' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expiring Soon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventorySummary.map(s => (
                    <tr key={s.category} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.category}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{s.product_count}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">₦{s.stock_value.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {s.low_stock_items > 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{s.low_stock_items} items</span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {s.expiring_soon > 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{s.expiring_soon} items</span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                  {inventorySummary.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">No inventory data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    orange: 'from-orange-500 to-orange-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.blue} rounded-xl p-4 text-white`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-70 mt-1">{sub}</p>
    </div>
  );
}

function OperationalCard({ label, value, icon, warning }: { label: string; value: number; icon: string; warning?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${warning ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function RevenueBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-mono text-gray-900">₦{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
