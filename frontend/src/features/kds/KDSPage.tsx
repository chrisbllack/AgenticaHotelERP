import { useState } from 'react';

export default function KDSPage() {
  const [station, setStation] = useState('all');

  // Demo orders
  const orders = [
    { id: 1, number: 'ORD-001', table: 'T5', items: [
      { name: 'Jollof Rice & Chicken', qty: 2, station: 'hot_kitchen', status: 'preparing' },
      { name: 'Chapman Cocktail', qty: 2, station: 'bar', status: 'ready' },
    ], time: '14:23', priority: 'normal', status: 'preparing' },
    { id: 2, number: 'ORD-002', table: 'T12', items: [
      { name: 'Grilled Tilapia', qty: 1, station: 'grill', status: 'preparing' },
      { name: 'Fried Plantain', qty: 1, station: 'hot_kitchen', status: 'ready' },
      { name: 'Caesar Salad', qty: 1, station: 'cold_kitchen', status: 'ready' },
    ], time: '14:18', priority: 'vip', status: 'preparing' },
    { id: 3, number: 'ORD-003', table: 'Rm 301', items: [
      { name: 'Full English Breakfast', qty: 1, station: 'hot_kitchen', status: 'preparing' },
      { name: 'Fresh Orange Juice', qty: 1, station: 'bar', status: 'ready' },
    ], time: '14:15', priority: 'normal', status: 'preparing' },
    { id: 4, number: 'ORD-004', table: 'T8', items: [
      { name: 'Suya Platter', qty: 3, station: 'grill', status: 'received' },
      { name: 'Star Lager', qty: 6, station: 'bar', status: 'ready' },
    ], time: '14:30', priority: 'rush', status: 'received' },
  ];

  const filteredOrders = station === 'all' ? orders : orders.filter(o => o.items.some(i => i.station === station));

  const stationColors: Record<string, string> = {
    hot_kitchen: 'bg-red-100 text-red-700',
    cold_kitchen: 'bg-blue-100 text-blue-700',
    grill: 'bg-orange-100 text-orange-700',
    bar: 'bg-purple-100 text-purple-700',
    bakery: 'bg-yellow-100 text-yellow-700',
  };



  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Display System</h1>
          <p className="text-gray-500 text-sm">Live order queue — {filteredOrders.length} active orders</p>
        </div>
        <div className="flex gap-2">
          {['all', 'hot_kitchen', 'cold_kitchen', 'grill', 'bar'].map(s => (
            <button key={s} onClick={() => setStation(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                station === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map(order => {

          const elapsed = Math.abs(new Date().getMinutes() - parseInt(order.time.split(':')[1]));

          return (
            <div key={order.id} className={`bg-white rounded-xl border-2 overflow-hidden ${
              order.priority === 'rush' ? 'border-red-400' : order.priority === 'vip' ? 'border-yellow-400' : 'border-gray-200'
            }`}>
              <div className={`px-4 py-2 flex items-center justify-between ${
                order.priority === 'rush' ? 'bg-red-50' : order.priority === 'vip' ? 'bg-yellow-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{order.number}</span>
                  {order.priority === 'vip' && <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded text-[10px] font-bold">VIP</span>}
                  {order.priority === 'rush' && <span className="px-1.5 py-0.5 bg-red-200 text-red-800 rounded text-[10px] font-bold">RUSH</span>}
                </div>
                <span className="text-xs font-medium text-gray-500">{order.table}</span>
              </div>

              <div className="p-3 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${stationColors[item.station] || 'bg-gray-100'}`}>
                        {item.station.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">×{item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="px-3 pb-3 flex gap-2">
                {order.status === 'received' && (
                  <button className="flex-1 py-2 bg-yellow-500 text-white rounded-lg text-xs font-medium"
                    onClick={() => {}}>
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-medium"
                    onClick={() => {}}>
                    Mark Ready
                  </button>
                )}
                <span className="text-xs text-gray-400 self-center">{elapsed}m ago</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
