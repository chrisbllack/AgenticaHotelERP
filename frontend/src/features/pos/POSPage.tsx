import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function POSPage() {
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [_activeTab, setActiveTab] = useState<'tables' | 'order'>('tables');

  const { data: outlets } = useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      const res = await api.get('/pos/outlets');
      return res.data.data;
    },
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', selectedOutlet],
    queryFn: async () => {
      const res = await api.get('/pos/tables', { params: { outlet_id: selectedOutlet } });
      return res.data.data;
    },
    enabled: !!selectedOutlet,
  });

  const { data: categories } = useQuery({
    queryKey: ['menu-categories', selectedOutlet],
    queryFn: async () => {
      const res = await api.get('/pos/menu/categories', { params: { outlet_id: selectedOutlet } });
      return res.data.data;
    },
    enabled: !!selectedOutlet,
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const { data: menuItems } = useQuery({
    queryKey: ['menu-items', selectedCategory],
    queryFn: async () => {
      const res = await api.get('/pos/menu/items', { params: { category_id: selectedCategory } });
      return res.data.data;
    },
    enabled: !!selectedCategory,
  });

  const [cart, setCart] = useState<{ item: any; quantity: number }[]>([]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const total = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4">
      {/* Left: Tables / Menu */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Outlet Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <h2 className="font-bold text-gray-900">🍽️ POS Terminal</h2>
          <select
            value={selectedOutlet}
            onChange={(e) => { setSelectedOutlet(e.target.value); setSelectedTable(''); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select Outlet...</option>
            {(outlets || []).map((o: any) => (
              <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
            ))}
          </select>
        </div>

        {selectedOutlet && (
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Tables View */}
            <div className="w-1/3 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Tables</h3>
              <div className="grid grid-cols-3 gap-2">
                {(tables || []).map((table: any) => (
                  <button
                    key={table.id}
                    onClick={() => { setSelectedTable(table.id); setActiveTab('order'); }}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      table.status === 'available'
                        ? 'border-green-300 bg-green-50 hover:border-green-500'
                        : table.status === 'occupied'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    } ${selectedTable === table.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <p className="font-bold text-sm">{table.number}</p>
                    <p className="text-xs text-gray-500">{table.capacity} seats</p>
                    <p className={`text-xs font-medium ${table.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                      {table.status}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Browser */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto">
              <div className="flex gap-2 mb-4 flex-wrap">
                {(categories || []).map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {(menuItems || []).map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-left transition-all"
                  >
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">₦{item.price.toFixed(2)}</p>
                    {!item.is_available && (
                      <span className="text-xs text-red-500">Unavailable</span>
                    )}
                  </button>
                ))}
              </div>
              {!selectedCategory && (
                <div className="text-center text-gray-400 py-8">Select a category to view items</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Current Order</h3>
          {selectedTable && (
            <p className="text-sm text-gray-500">
              Table: {tables?.find((t: any) => t.id === selectedTable)?.number || '—'}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No items added yet</p>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{c.item.name}</p>
                  <p className="text-xs text-gray-500">₦{c.item.price.toFixed(2)} × {c.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">₦{(c.item.price * c.quantity).toFixed(2)}</span>
                  <button
                    onClick={() => setCart(cart.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₦{total.toFixed(2)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl transition-colors"
          >
            💳 Take Payment
          </button>
          <button
            disabled={cart.length === 0}
            className="w-full bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 font-medium py-2 rounded-xl transition-colors text-sm"
          >
            🏨 Post to Room
          </button>
        </div>
      </div>
    </div>
  );
}
