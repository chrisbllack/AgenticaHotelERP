# M-INV — Supply Chain

**Main Module Code:** M-INV · **Tier:** ● Core · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P013 (inventory, procurement, receiving, transfers), P014 (AP linkage), P022 (cost reports).

## Purpose
Control everything the hotel buys, stores, and consumes: multi-store inventory,
requisition-to-pay procurement, recipe-level costing that ties F&B sales to
consumption, and the asset/CAPEX register that keeps the property's physical
plant visible.

## Submodules

### `inv/inventory` — ● Core
| Feature Set | Features |
|---|---|
| Stock Control | Multi-store & multi-bin stock · batch/lot & expiry tracking · stock counts (full/cycle/blind) with variance workflow |
| Movements | Transfers between stores · requisitions by department · adjustments with approval · negative-stock guard |
| Planning | Reorder levels & EOQ hints · consumption analytics · expiry & slow-mover alerts |

### `inv/procurement` — ● Core
| Feature Set | Features |
|---|---|
| Requisition → PO | Department requisitions · approval workflow (M-PLT) · RFQ to multiple suppliers · quote comparison matrix |
| Purchase Orders | PO generation & versioning · partial receipts · goods receipt with QC · 3-way match (PO/GRN/invoice) |
| Suppliers | Supplier master & categories · contracts & price lists · supplier scorecards (OTD, quality) · blacklist rules |

### `inv/recipe-costing` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| BOM & Recipes | Recipe BOMs per menu item (M-FNB) · yield % & shrinkage · prep items & sub-recipes |
| Cost Control | Theoretical vs actual consumption (variance by outlet) · menu margin alerts · period-end stock-based COGS posting to M-FIN |

### `inv/assets-capex` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Asset Register | Physical asset catalog & locations · condition & warranty tracking · handoff of capitalized items to M-FIN fixed assets |
| CAPEX | CAPEX requests & approval workflow · project cost tracking · asset disposal flow with M-FIN write-off |

## Events Published
`stock.low|movement|adjusted` · `po.created|approved|received` ·
`requisition.approved` · `asset.registered|disposed` · `cost.variance_detected`

## Consumed Contracts
M-FIN AP invoice & payment posting · M-FNB menu/recipe linkage & depletion ·
M-LOD maintenance parts · M-EVT event requisitions · M-PLT approval workflow.

## Key Non-Functional Targets
Stock movement posting < 1 s · 3-way match exception report per property per
period · theoretical vs actual variance report weekly · full offline stock operations.
