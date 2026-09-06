import { useState } from 'react';

export default function RecipesPage() {
  const [tab, setTab] = useState<'recipes' | 'costing' | 'wastage'>('recipes');


  // Demo recipe data
  const recipes = [
    { name: 'Jollof Rice & Chicken', selling: 3500, cost: 1200, margin: 65.7, unitsSold: 245, profit: 563500 },
    { name: 'Grilled Tilapia', selling: 4500, cost: 1800, margin: 60.0, unitsSold: 180, profit: 486000 },
    { name: 'Egusi Soup & Pounded Yam', selling: 2800, cost: 950, margin: 66.1, unitsSold: 156, profit: 288600 },
    { name: 'Pepper Soup (Goat)', selling: 2500, cost: 1100, margin: 56.0, unitsSold: 120, profit: 168000 },
    { name: 'Steak & Fries', selling: 8000, cost: 3200, margin: 60.0, unitsSold: 95, profit: 456000 },
    { name: 'Chapman Cocktail', selling: 1500, cost: 350, margin: 76.7, unitsSold: 320, profit: 368000 },
    { name: 'Suya Platter', selling: 2500, cost: 800, margin: 68.0, unitsSold: 200, profit: 340000 },
    { name: 'Full English Breakfast', selling: 5500, cost: 2100, margin: 61.8, unitsSold: 110, profit: 374000 },
  ];

  const totalRevenue = recipes.reduce((s, r) => s + r.selling * r.unitsSold, 0);
  const totalCost = recipes.reduce((s, r) => s + r.cost * r.unitsSold, 0);
  const avgMargin = ((totalRevenue - totalCost) / totalRevenue * 100);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Recipes & Menu Costing</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Menu Revenue</p>
          <p className="text-2xl font-bold text-blue-600">₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Food Cost</p>
          <p className="text-2xl font-bold text-orange-600">₦{totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Gross Profit</p>
          <p className="text-2xl font-bold text-green-600">₦{(totalRevenue - totalCost).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Average Margin</p>
          <p className="text-2xl font-bold text-purple-600">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        {(['recipes', 'costing', 'wastage'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium capitalize ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t === 'recipes' ? 'Recipe Management' : t === 'costing' ? 'Costing Report' : 'Wastage Impact'}
          </button>
        ))}
      </div>

      {tab === 'recipes' && (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menu Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recipe Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Margin</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipes.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-right font-mono">₦{r.selling.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-orange-600">₦{r.cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      r.margin > 65 ? 'bg-green-100 text-green-700' : r.margin > 55 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{r.margin.toFixed(1)}%</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{r.unitsSold}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-green-700">₦{r.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'costing' && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="font-semibold mb-4">Food Cost Analysis</h3>
          <div className="space-y-3">
            {recipes.sort((a, b) => a.margin - b.margin).map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-48 text-sm font-medium truncate">{r.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className={`h-full rounded-full flex items-center px-2 text-xs text-white font-medium ${
                    r.margin > 65 ? 'bg-green-500' : r.margin > 55 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} style={{ width: `${r.margin}%` }}>
                    {r.margin.toFixed(1)}%
                  </div>
                </div>
                <span className="w-20 text-right text-sm font-mono">₦{r.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'wastage' && (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-500">Wastage impact on food cost will appear here once wastage records are tracked.</p>
        </div>
      )}
    </div>
  );
}
