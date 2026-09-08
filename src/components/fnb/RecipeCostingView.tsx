import { useState } from "react";
import { Card, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { RecipeCosting } from "../../types";

export function RecipeCostingView() {
  const { recipeCostings } = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCosting | null>(
    recipeCostings[0] || null
  );

  const categories = Array.from(new Set(recipeCostings.map((r) => r.category)));

  const filteredRecipes =
    selectedCategory === "all"
      ? recipeCostings
      : recipeCostings.filter((r) => r.category === selectedCategory);

  const avgFoodCostPct = Math.round(
    recipeCostings.reduce((acc, r) => acc + r.foodCostPct, 0) / (recipeCostings.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Recipe Costing KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Theoretical Food Cost"
          value={`${avgFoodCostPct}%`}
          sub="Target band: 28% - 32%"
          accent="emerald"
        />
        <StatCard
          label="Standard Recipes"
          value={String(recipeCostings.length)}
          sub="100% yield calibrated"
          accent="gold"
        />
        <StatCard
          label="Menu Engineering Stars"
          value="4 Items"
          sub="High margin + high volume"
          accent="sky"
        />
        <StatCard
          label="Potential Spoilage Alert"
          value="2 Ingredients"
          sub="Atlantic Lobster, Ribeye"
          accent="rose"
        />
      </div>

      {/* Category Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Course Category:
          </span>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedCategory === "all"
                ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                : "text-brand-200/70 hover:bg-brand-800/40"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                  : "text-brand-200/70 hover:bg-brand-800/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe List and Detail Split */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Recipe Directory */}
        <Card className="lg:col-span-5 p-0">
          <div className="border-b border-brand-800/80 bg-brand-900/60 p-4">
            <h3 className="font-display font-semibold text-brand-50">Standard Recipe Portfolio</h3>
            <p className="text-xs text-brand-200/60">Yield, portion size & theoretical cost</p>
          </div>
          <div className="divide-y divide-brand-800/40">
            {filteredRecipes.map((r) => {
              const isSelected = r.id === selectedRecipe?.id;
              const isFavorable = r.foodCostPct <= r.targetFoodCostPct;

              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRecipe(r)}
                  className={`w-full text-left p-4 transition ${
                    isSelected
                      ? "bg-brand-800/60 border-l-4 border-l-gold-400"
                      : "hover:bg-brand-800/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-gold-300">{r.recipeCode}</span>
                      <h4 className="font-medium text-sm text-brand-50 mt-0.5">{r.itemName}</h4>
                      <p className="text-xs text-brand-200/60">
                        {r.category} · Portion: {r.portionSize}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold text-brand-100">
                        {naira(r.sellingPrice)}
                      </span>
                      <div className="mt-1">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            isFavorable
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {r.foodCostPct.toFixed(1)}% Cost
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right: Recipe Breakdown Card */}
        {selectedRecipe && (
          <Card className="lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between border-b border-brand-800/80 p-5">
              <div>
                <span className="font-mono text-xs text-gold-300 font-semibold">
                  {selectedRecipe.recipeCode} · Standard Yield: {selectedRecipe.portionSize}
                </span>
                <h2 className="text-xl font-display font-bold text-brand-50 mt-1">
                  {selectedRecipe.itemName}
                </h2>
                <p className="text-xs text-brand-200/60 mt-1">
                  Target Food Cost: {selectedRecipe.targetFoodCostPct}% · Variance:{" "}
                  <span
                    className={
                      selectedRecipe.foodCostPct <= selectedRecipe.targetFoodCostPct
                        ? "text-emerald-400 font-semibold"
                        : "text-rose-400 font-semibold"
                    }
                  >
                    {(selectedRecipe.foodCostPct - selectedRecipe.targetFoodCostPct).toFixed(1)}%
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-brand-200/60">Selling Price</span>
                <p className="font-display text-2xl font-bold text-gold-300">
                  {naira(selectedRecipe.sellingPrice)}
                </p>
                <p className="text-[11px] font-mono text-emerald-400">
                  Gross Margin: {naira(selectedRecipe.sellingPrice - selectedRecipe.rawCostTotal)}
                </p>
              </div>
            </div>

            {/* Cost Summary Bar */}
            <div className="grid grid-cols-3 divide-x divide-brand-800/60 border-b border-brand-800/80 bg-brand-950/40 p-4 text-center text-xs">
              <div>
                <span className="text-brand-300/70">Raw Ingredients Cost</span>
                <p className="font-mono text-sm font-semibold text-rose-300 mt-0.5">
                  {naira(selectedRecipe.rawCostTotal)}
                </p>
              </div>
              <div>
                <span className="text-brand-300/70">Actual Food Cost %</span>
                <p
                  className={`font-mono text-sm font-bold mt-0.5 ${
                    selectedRecipe.foodCostPct <= selectedRecipe.targetFoodCostPct
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {selectedRecipe.foodCostPct.toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-brand-300/70">Gross Margin %</span>
                <p className="font-mono text-sm font-bold text-emerald-300 mt-0.5">
                  {(100 - selectedRecipe.foodCostPct).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="p-5">
              <h4 className="text-sm font-semibold text-brand-50 mb-3 flex items-center justify-between">
                <span>Bill of Materials (BOM) &amp; Yield Calibration</span>
                <span className="text-xs text-brand-200/60">
                  {selectedRecipe.ingredients.length} raw components
                </span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
                    <tr>
                      <th className="px-4 py-2 font-medium">Ingredient</th>
                      <th className="px-3 py-2 text-right font-medium">Quantity</th>
                      <th className="px-3 py-2 text-right font-medium">Unit Cost</th>
                      <th className="px-3 py-2 text-right font-medium">Yield %</th>
                      <th className="px-4 py-2 text-right font-medium">Line Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-800/30">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <tr key={idx} className="hover:bg-brand-800/20">
                        <td className="px-4 py-2.5 font-medium text-brand-100">{ing.name}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-brand-200">
                          {ing.quantity} {ing.unit}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-brand-200/70">
                          {naira(ing.costPerUnit)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-brand-200/70">
                          {ing.yieldPct}%
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gold-300">
                          {naira(ing.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
