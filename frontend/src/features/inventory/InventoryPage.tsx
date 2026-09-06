import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function InventoryPage() {
  const [tab, setTab] = useState<'products' | 'stock' | 'suppliers' | 'orders'>('products');
  const [search, setSearch] = useState('');

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get('/inventory/products', { params: { search, per_page: 50 } });
      return res.data;
    },
  });

  const { data: stock } = useQuery({
    queryKey: ['stock'],
    queryFn: async () => {
      const res = await api.get('/inventory/stock');
      return res.data.data;
    },
    enabled: tab === 'stock',
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/inventory/suppliers');
      return res.data.data;
    },
    enabled: tab === 'suppliers',
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/inventory/purchase-orders');
      return res.data.data;
    },
    enabled: tab === 'orders',
  });

  const products = productsData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500 mt-1">Products, stock levels, and purchasing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['products', 'stock', 'suppliers', 'orders'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sell Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reorder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingProducts ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No products found</td></tr>
                ) : (
                  products.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.category || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.unit_of_measure}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">₦{p.cost_price?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">₦{p.selling_price?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{p.reorder_level}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Stock Tab */}
      {tab === 'stock' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Store</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!stock || stock.length === 0) ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No stock records</td></tr>
              ) : (
                stock.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.product_name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{s.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.store_name}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{s.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.batch_number || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credit Limit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!suppliers || suppliers.length === 0) ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No suppliers</td></tr>
              ) : (
                suppliers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.code}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.contact_person || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">₦{s.credit_limit?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">PO Number</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!purchaseOrders || purchaseOrders.length === 0) ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No purchase orders</td></tr>
              ) : (
                purchaseOrders.map((po: any) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{po.po_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{po.supplier_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{po.order_date}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">₦{po.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        po.status === 'received' ? 'bg-green-100 text-green-700' :
                        po.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
