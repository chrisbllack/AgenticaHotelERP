# M-BUS — Intelligence & AI

**Main Module Code:** M-BUS · **Tier:** ◐ Differentiator · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md),
[ADR-0005](../ADR/0005-AnalyticsArchitecture.md)
**Packages:** P018 (IBIP reporting/dashboards/KPIs), P020 (AI platform), P023 (multi-property consolidation).

## Purpose
Turn operational facts into decisions: real-time dashboards, a 100+ report
catalog, statistical forecasting, AI copilots, and revenue optimization —
running against the same PostgreSQL (materialized views + summary tables), so
analytics remain fully available offline.

## Submodules

### `bus/kpi-dashboards` — ● Core
| Feature Set | Features |
|---|---|
| Executive | Owner/ GM dashboard: occupancy, ADR, RevPAR, TREVPAR, GOP & GOPPAR · forecast vs actual · pick-by-channel & market mix |
| Departmental | Front desk (arrivals, rooms sold, rate variances) · F&B (covers, average check, popularity) · Housekeeping (rooms status, productivity) · Maintenance (WO backlog) |
| Real-Time | Live occupancy & today's revenue · outlet order feed · room status heat map · alert tiles (low stock, failed sync) |

### `bus/reporting` — ● Core
| Feature Set | Features |
|---|---|
| Report Catalog | 100+ operational & financial reports (manager flash, tax, audit trail, night audit recap, channel production…) · saved parameters & scheduling |
| Delivery | PDF/Excel/CSV export · email distribution lists · portal report subscriptions · row-level security by data scope (M-PLT) |
| Authoring | Parameterized SQL-backed report definitions · custom fields · report versioning & favorites |

### `bus/forecasting` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Demand Models | Occupancy & ADR forecast (seasonality, events, pickup) · covers forecast per outlet · no-show probability |
| Financial | Cash-flow projection · payroll & expense budget vs forecast · what-if rate scenarios |

### `bus/ai-assistant` — ○ Premium
| Feature Set | Features |
|---|---|
| NL Analytics | Ask-your-data NL queries with safe SQL generation (read-only, scoped) · auto-charts & narrative summaries |
| Copilots | Front-desk copilot (next-best action, upsell) · manager copilot (anomaly detection, explanations) · audit draft summaries |
| Guardrails | Read-only access, PII masking, citation of source report/tables, cost caps, on-prem model option (no data leaves property) |

### `bus/revenue-opt` — ○ Premium
| Feature Set | Features |
|---|---|
| Rate Optimization | Rate recommendations by segment & channel · displacement analysis (transient vs group vs event) · overbooking tuning |
| Controls | Length-of-stay & discount guardrails · competitor rate capture (where lawful) · channel mix & parity monitoring |

## Events Published
`forecast.updated` · `insight.raised` · `anomaly.detected` · `report.delivered`

## Consumed Contracts
Facts from every module via owned materialized views & summary tables
(`daily_revenue_summary`, `daily_occupancy_summary`, …) · M-PLT scheduling,
security scopes · M-HDW for device telemetry summaries.

## Constraints (ADR-0005)
- Same PostgreSQL database in V1; no external analytics store.
- Views refreshed by night audit worker + intra-day incremental refresh.
- PostgreSQL FTS for search; external engine only when scale warrants.

## Key Non-Functional Targets
Executive dashboard < 5 s · nightly materialized refresh (150 rooms) < 2 min ·
NL query blocks any write path by construction · AI features degrade
gracefully to rules-based suggestions when offline.
