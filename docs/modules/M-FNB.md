# M-FNB — Food & Beverage

**Main Module Code:** M-FNB · **Tier:** ● Core · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P012 (POS, KOT/KDS, bar), P013 (recipe costing linkage), P021 (waiter handhelds & KDS hardware).

## Purpose
Run every outlet — restaurant, bar, pool, room service — with fast, offline-first
point of sale, kitchen production, menu engineering, beverage control, and
seamless posting of charges to guest folios or invoices.

## Submodules

### `fnb/outlets-tables` — ● Core
| Feature Set | Features |
|---|---|
| Outlet Management | Multi-outlet config (restaurant, bar, pool, room service) · service periods (breakfast/lunch/dinner) · shifts · covers & turn-time targets |
| Table Management | Table map per outlet · merges & splits · table reservations · waitlist · floor plans |

### `fnb/menu-engineering` — ● Core
| Feature Set | Features |
|---|---|
| Menu Design | Categories & items per outlet/period · modifiers, combos & set menus · allergy & dietary tags |
| Pricing | Price tiers (dine-in/room service/inclusive) · happy-hour & daypart pricing · tax profile per item |
| Engineering | Recipe links to M-INV BOMs · popularity vs margin matrix (stars/plowhorses/puzzles/dogs) · menu versioning |

### `fnb/pos` — ● Core
| Feature Set | Features |
|---|---|
| Order Lifecycle | New order → courses → voids/returns with reasons · order types (dine-in, takeaway, room service, delivery) |
| Billing | Split/merge bills · covers-based or item-based splits · discounts & comps with approval · service charge rules |
| Folio & Payment | Post to room folio (M-LOD) · direct payment via M-PRC · mixed payments · offline-first with local queue |
| Compliance | Fiscal printer hooks · X-report & Z-report (shift close with cash-up variance) |

### `fnb/kot-kds` — ● Core
| Feature Set | Features |
|---|---|
| KOT Routing | Route items to kitchen/bar/station printers · modifier routing · recall & reprint |
| KDS | Kitchen display screens per station · item timing (blue/red) · bump rails · production-load warnings |

### `fnb/bar-cellar` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Beverage Control | Beverage lists & bin numbers · measured-pour variance vs sales · open/close bottle tracking |
| Cellar | Vintage & bin tracking · cellar condition notes · depletion reports |

### `fnb/minibar` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Consumption | Scanned or select-post consumption · auto-charge to folio · price list per room type |
| Restock | Restock lists per floor · posting reconciliation at checkout-window close |

## Events Published
`order.created|closed|voided` · `kot.fired` · `menu.updated` · `shift.closed`

## Consumed Contracts
M-INV stock decrement & recipe BOMs · M-FIN revenue & cash postings ·
M-LOD folio charge contract · M-PRC direct payments ·
M-HDW printers/KDS/scanners · M-PLT approval workflow (voids, discounts).

## Key Non-Functional Targets
Order creation < 1 s · KOT fire/print < 500 ms · full POS functionality offline ·
Z-report close < 30 s for a 1,000-cover day.
