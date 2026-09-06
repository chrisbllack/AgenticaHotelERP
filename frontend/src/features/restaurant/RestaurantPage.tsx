import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

// ── Types ──
interface RestTable {
  id: string; number: string; section: string; capacity: number;
  status: string; waiter_id?: string; order_id?: string; guests: number;
  occupied_at?: string;
}
interface RestaurantOrder {
  id: string; order_number: string; table_id: string; table_number: string;
  type: string; status: string; priority: string; staff_name: string;
  guest_name: string; subtotal: number; tax_amount: number; total: number;
  notes?: string; created_at: string;
}
interface MenuItem {
  id: string; name: string; category: string; description: string;
  price: number; cost_price: number; margin_pct: number; prep_time_min: number;
  is_available: boolean; tags?: string;
}
interface KDSItem {
  order_id: string; order_number: string; table_number: string; type: string;
  priority: string; item_name: string; quantity: number; notes: string;
  staff_name: string; created_at: string; elapsed_minutes: number; urgency: string;
}
interface Ingredient {
  id: string; name: string; category: string; unit: string;
  current_stock: number; min_stock: number; cost_per_unit: number;
  supplier: string; low_stock: boolean; stock_value: number;
}
interface DeliveryOrder {
  id: string; order_id: string; source: string; customer_name: string;
  customer_phone: string; address: string; total: number;
  delivery_fee: number; rider_name: string; status: string;
  eta_minutes: number; created_at: string;
}
interface RestGuest {
  id: string; name: string; phone: string; email: string; tier: string;
  total_visits: number; total_spend: number; favorite_dish: string;
  dietary_notes: string; last_visit: string; avg_spend: number;
}

const TABS = ['Floor Plan', 'Orders', 'Kitchen Display', 'Menu', 'Ingredients', 'Deliveries', 'Guest CRM', 'Analytics'] as const;
const NGN = (n: number) => `₦${n.toLocaleString()}`;
const statusColor: Record<string, string> = {
  available: 'bg-green-100 text-green-700', occupied: 'bg-red-100 text-red-700',
  reserved: 'bg-yellow-100 text-yellow-700', cleaning: 'bg-blue-100 text-blue-700',
  new: 'bg-blue-100 text-blue-700', preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700', served: 'bg-purple-100 text-purple-700',
  completed: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-orange-100 text-orange-700', assigned: 'bg-blue-100 text-blue-700',
};
const urgencyColor: Record<string, string> = {
  normal: 'border-gray-200', warning: 'border-yellow-400 bg-yellow-50',
  critical: 'border-red-400 bg-red-50 animate-pulse',
};
const tierColor: Record<string, string> = {
  vip: 'bg-purple-100 text-purple-700', gold: 'bg-yellow-100 text-yellow-700',
  silver: 'bg-gray-100 text-gray-600', regular: 'bg-blue-100 text-blue-700',
};

export default function RestaurantPage() {
  const [tab, setTab] = useState<string>('Floor Plan');
  const [tables, setTables] = useState<Record<string, RestTable[]>>({});
  const [tableSummary, setTableSummary] = useState({ total_tables: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 });
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [kdsItems, setKdsItems] = useState<KDSItem[]>([]);
  const [kdsSummary, setKdsSummary] = useState({ pending: 0, preparing: 0, urgent: 0, total: 0 });
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [guests, setGuests] = useState<RestGuest[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [floorPlan, menuRes, ingRes, guestRes, analyticsRes] = await Promise.all([
        api.get('/restaurant/floor-plan').catch(() => ({ data: { data: { sections: {}, total_tables: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 } } })),
        api.get('/restaurant/menu').catch(() => ({ data: { data: [] } })),
        api.get('/restaurant/ingredients').catch(() => ({ data: { data: [] } })),
        api.get('/restaurant/guests').catch(() => ({ data: { data: [] } })),
        api.get('/restaurant/analytics').catch(() => ({ data: { data: null } })),
      ]);
      setTables(floorPlan.data?.data?.sections || {});
      setTableSummary({
        total_tables: floorPlan.data?.data?.total_tables || 0,
        available: floorPlan.data?.data?.available || 0,
        occupied: floorPlan.data?.data?.occupied || 0,
        reserved: floorPlan.data?.data?.reserved || 0,
        cleaning: floorPlan.data?.data?.cleaning || 0,
      });
      setMenu(menuRes.data?.data || []);
      setIngredients(ingRes.data?.data || []);
      setGuests(guestRes.data?.data || []);
      setAnalytics(analyticsRes.data?.data);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const [ordersRes, kdsRes] = await Promise.all([
        api.get('/restaurant/orders').catch(() => ({ data: { data: [] } })),
        api.get('/restaurant/kds').catch(() => ({ data: { data: { items: [], summary: { pending: 0, preparing: 0, urgent: 0, total: 0 } } } })),
      ]);
      setOrders(ordersRes.data?.data || []);
      setKdsItems(kdsRes.data?.data?.items || []);
      setKdsSummary(kdsRes.data?.data?.summary || { pending: 0, preparing: 0, urgent: 0, total: 0 });
    } catch {}
  }, []);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await api.get('/restaurant/deliveries').catch(() => ({ data: { data: [] } }));
      setDeliveries(res.data?.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (tab === 'Orders' || tab === 'Kitchen Display') fetchOrders();
    if (tab === 'Deliveries') fetchDeliveries();
    const interval = setInterval(() => {
      if (tab === 'Kitchen Display') fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [tab, fetchOrders, fetchDeliveries]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.post(`/restaurant/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch {}
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="text-lg text-gray-500">Loading restaurant data...</div></div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🍽️ Restaurant Management</h1>
          <p className="text-gray-500 text-sm">Grand Palm Hotel — Restaurant & Bar Operations</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            🪑 {tableSummary.available} Available
          </div>
          <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            🔴 {tableSummary.occupied} Occupied
          </div>
          <div className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            📅 {tableSummary.reserved} Reserved
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ═══ Floor Plan Tab ═══ */}
      {tab === 'Floor Plan' && (
        <div className="space-y-6">
          {Object.entries(tables).map(([section, sectionTables]) => (
            <div key={section}>
              <h3 className="text-lg font-bold mb-3">{section} ({sectionTables.length} tables)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {sectionTables.map(t => (
                  <div key={t.id} className={`rounded-xl border-2 p-3 text-center transition-all hover:shadow-lg ${
                    t.status === 'occupied' ? 'border-red-300 bg-red-50' :
                    t.status === 'reserved' ? 'border-yellow-300 bg-yellow-50' :
                    t.status === 'cleaning' ? 'border-blue-300 bg-blue-50' :
                    'border-green-300 bg-green-50 hover:border-green-400'
                  }`}>
                    <div className="text-2xl font-bold mb-1">T{t.number}</div>
                    <div className="text-xs text-gray-500 mb-2">{t.capacity} seats • {t.section}</div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor[t.status] || 'bg-gray-100'}`}>
                      {t.status}
                    </span>
                    {t.waiter_id && <div className="text-[10px] text-gray-400 mt-1">👤 {t.waiter_id}</div>}
                    {t.guests > 0 && <div className="text-[10px] text-gray-400">{t.guests} guests</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Orders Tab ═══ */}
      {tab === 'Orders' && (
        <div className="space-y-3">
          <div className="flex gap-2 mb-4">
            {['all', 'new', 'preparing', 'ready', 'served', 'completed'].map(s => (
              <button key={s} onClick={() => {
                if (s === 'all') api.get('/restaurant/orders').then(r => setOrders(r.data?.data || []));
                else api.get(`/restaurant/orders?status=${s}`).then(r => setOrders(r.data?.data || []));
              }} className="px-3 py-1 rounded-lg text-xs font-medium capitalize bg-gray-100 hover:bg-gray-200">{s}</button>
            ))}
          </div>
          {orders.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No orders found</div>
          ) : (
            orders.map(o => (
              <div key={o.id} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                    {o.order_number.slice(-4)}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{o.order_number}</div>
                    <div className="text-xs text-gray-500">
                      Table {o.table_id || 'N/A'} • {o.type} • {o.staff_name}
                    </div>
                    {o.guest_name && <div className="text-xs text-gray-400">Guest: {o.guest_name}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{NGN(o.total)}</div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor[o.status] || 'bg-gray-100'}`}>
                    {o.status}
                  </span>
                </div>
                <div className="flex gap-1 ml-4">
                  {o.status === 'new' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs">🔥 Prep</button>}
                  {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs">✅ Ready</button>}
                  {o.status === 'ready' && <button onClick={() => updateOrderStatus(o.id, 'served')} className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs">🍽️ Served</button>}
                  {o.status === 'served' && <button onClick={() => updateOrderStatus(o.id, 'completed')} className="px-3 py-1 bg-gray-600 text-white rounded-lg text-xs">✓ Done</button>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ Kitchen Display Tab ═══ */}
      {tab === 'Kitchen Display' && (
        <div>
          <div className="flex gap-3 mb-6">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">📋 Pending: {kdsSummary.pending}</div>
            <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium">🔥 Preparing: {kdsSummary.preparing}</div>
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-medium animate-pulse">⚠️ Urgent: {kdsSummary.urgent}</div>
          </div>
          {kdsItems.length === 0 ? (
            <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-xl">
              <div className="text-4xl mb-2">🍳</div>
              <div>No active orders in the kitchen</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kdsItems.map((item, i) => (
                <div key={i} className={`rounded-xl border-2 overflow-hidden ${urgencyColor[item.urgency] || 'border-gray-200'}`}>
                  <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{item.order_number}</span>
                      {item.priority !== 'normal' && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.priority === 'vip' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {item.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-500">T{item.table_number || '?'}</span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{item.item_name}</span>
                      <span className="font-bold">×{item.quantity}</span>
                    </div>
                    {item.notes && <div className="text-xs text-gray-500 italic">📝 {item.notes}</div>}
                    <div className="text-xs text-gray-400 mt-1">👨‍🍳 {item.staff_name}</div>
                  </div>
                  <div className="px-3 pb-3 flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      item.urgency === 'critical' ? 'text-red-600' :
                      item.urgency === 'warning' ? 'text-yellow-600' : 'text-gray-400'
                    }`}>{item.elapsed_minutes}m ago</span>
                    <button onClick={() => updateOrderStatus(item.order_id, 'ready')}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                      ✅ Ready
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Menu Tab ═══ */}
      {tab === 'Menu' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map(item => (
              <div key={item.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">{item.category}</span>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <p className="text-xs text-gray-500 mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm">{NGN(item.price)}</span>
                    <span className="text-[10px] text-gray-400 ml-1">Cost: {NGN(item.cost_price)}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.margin_pct > 60 ? 'bg-green-100 text-green-700' :
                    item.margin_pct > 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{item.margin_pct}% margin</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-2">⏱️ {item.prep_time_min} min prep</div>
                {item.tags && <div className="text-[10px] text-gray-400 mt-1">🏷️ {item.tags}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Ingredients Tab ═══ */}
      {tab === 'Ingredients' && (
        <div>
          {ingredients.some(i => i.low_stock) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-red-700 text-sm mb-2">⚠️ Low Stock Alerts</h4>
              {ingredients.filter(i => i.low_stock).map(i => (
                <div key={i.id} className="text-xs text-red-600">• {i.name}: {i.current_stock} {i.unit} remaining (min: {i.min_stock})</div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ingredients.map(ing => (
              <div key={ing.id} className={`bg-white rounded-xl border p-4 ${ing.low_stock ? 'border-red-300' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm">{ing.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{ing.category}</span>
                  </div>
                  {ing.low_stock && <span className="text-red-500 text-lg">⚠️</span>}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Stock:</span><span className="font-medium">{ing.current_stock} {ing.unit}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Min Level:</span><span>{ing.min_stock} {ing.unit}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Unit Cost:</span><span>{NGN(ing.cost_per_unit)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Stock Value:</span><span className="font-bold">{NGN(ing.stock_value)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Supplier:</span><span>{ing.supplier}</span></div>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full ${ing.low_stock ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min((ing.current_stock / Math.max(ing.min_stock * 2, 1)) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Deliveries Tab ═══ */}
      {tab === 'Deliveries' && (
        <div className="space-y-3">
          {deliveries.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No deliveries</div>
          ) : deliveries.map(d => (
            <div key={d.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-lg">🛵</div>
                <div>
                  <div className="font-bold text-sm">{d.customer_name}</div>
                  <div className="text-xs text-gray-500">{d.address}</div>
                  <div className="text-xs text-gray-400">{d.customer_phone} • Source: {d.source}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{NGN(d.total)}</div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor[d.status] || 'bg-gray-100'}`}>{d.status}</span>
                {d.rider_name && <div className="text-[10px] text-gray-400 mt-1">🏍️ {d.rider_name}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Guest CRM Tab ═══ */}
      {tab === 'Guest CRM' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guests.map(g => (
              <div key={g.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      g.tier === 'vip' ? 'bg-purple-100 text-purple-700' :
                      g.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                      g.tier === 'silver' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>{g.name[0]}</div>
                    <div>
                      <div className="font-bold text-sm">{g.name}</div>
                      <div className="text-xs text-gray-400">{g.phone}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tierColor[g.tier] || 'bg-gray-100'}`}>{g.tier}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Visits:</span><span className="font-medium">{g.total_visits}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Spend:</span><span className="font-bold">{NGN(g.total_spend)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Avg/Visit:</span><span>{NGN(g.avg_spend)}</span></div>
                  {g.favorite_dish && <div className="flex justify-between"><span className="text-gray-500">Fav Dish:</span><span>🍽️ {g.favorite_dish}</span></div>}
                  {g.dietary_notes && <div className="text-gray-400 italic">📋 {g.dietary_notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Analytics Tab ═══ */}
      {tab === 'Analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{NGN(analytics.total_revenue || 0)}</div>
              <div className="text-xs text-gray-500 mt-1">Total Revenue</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.total_orders || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Total Orders</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.completed || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Completed</div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{NGN(analytics.avg_ticket || 0)}</div>
              <div className="text-xs text-gray-500 mt-1">Avg Ticket</div>
            </div>
          </div>

          {analytics.top_dishes?.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-bold text-sm mb-3">🏆 Top Dishes by Revenue</h3>
              <div className="space-y-2">
                {analytics.top_dishes.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{d.name}</span>
                        <span className="text-sm font-bold">{NGN(d.sales)}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(d.sales / (analytics.top_dishes[0]?.sales || 1)) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{d.count} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.insights?.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
              <h3 className="font-bold text-sm mb-2">💡 Smart Insights</h3>
              <ul className="space-y-1">
                {analytics.insights.map((insight: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600">• {insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
