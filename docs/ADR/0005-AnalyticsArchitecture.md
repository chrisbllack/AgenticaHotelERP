# ADR-0005: Analytics Architecture

## Status: Accepted

## Context

Reporting and analytics are core enterprise capabilities, not an afterthought. Hotels need real-time dashboards, KPIs, and drill-down reports.

## Decision

Analytics (IBIP) runs against the same PostgreSQL database using materialized views and denormalized summary tables updated by the night audit worker. No external analytics database for V1 — PostgreSQL FTS handles search. A dedicated analytics store can be introduced when scale warrants it.

## Consequences

- Single database simplifies deployment
- Materialized views updated nightly provide fast dashboard queries
- Summary tables (daily_revenue_summary, daily_occupancy_summary) for KPIs
- PostgreSQL FTS replaces external search engine for V1
- Report engine generates PDF/Excel/CSV server-side
