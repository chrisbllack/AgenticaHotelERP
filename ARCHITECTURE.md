# Architecture — INFINEON Enterprise Platform

## System Overview

INFINEON is a single-binary Go application with an embedded React frontend, backed by PostgreSQL. The design prioritizes:

1. **On-Premises First** — All core operations run locally without internet
2. **Single Binary** — Go compiles to one executable with embedded UI, migrations, and seed data
3. **Domain-Driven Design** — Business logic organized by domain under `internal/domain/`
4. **Event-Driven** — In-process event bus for domain communication
5. **API-First** — RESTful API with versioning at `/api/v1/`

## Deployment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **On-Premise** | Local binary + local PostgreSQL | Primary target (Africa) |
| **Cloud** | Same binary on cloud server with RLS | SaaS deployment |
| **Hybrid** | Local primary + cloud sync | Best of both |

## Request Lifecycle

```
Request → CorrelationID → TenantResolution → Auth → Permission
→ LicenseValidation → ActivityLogging → DomainAction → EventPublish
→ APIResponse
```

## Module Map (ADR-0006)

Business capability is grouped into **13 main modules** (product/licensing
boundaries) carrying 62 submodules (code boundaries in
`internal/domain/{submodule}/`). Platform capabilities sit beside them.

```
                    ┌────────────────────────────────────────────┐
                    │         M-PLT  Platform Core               │
                    │ Identity · Org · Config · Workflow · Audit │
                    └────────────────────────────────────────────┘
                                       ▲ consumed by all
┌────────┐  events  ┌────────┐   API  ┌────────┐
│ M-DST  │────────▶│ M-LOD  │◀───────│ M-EVT  │
└───┬────┘         └───┬────┘        └───┬────┘
    │                  │ charges         │ catering/banquet
    ▼                  ▼                 ▼
┌────────┐         ┌────────┐         ┌────────┐
│ M-CRM  │         │ M-FNB  │         │ M-INV  │
└────────┘         └───┬────┘         └───┬────┘
                       │ posts            │ goods receipt/AP
                       ▼                  ▼
                    ┌────────────────────────────┐
                    │  M-FIN ◀── M-PRC  M-HR     │
                    └────────────────────────────┘
                                       │ facts to
                                       ▼
                    ┌────────────────────────────┐
                    │  M-BUS · M-HDW · M-MOB     │
                    └────────────────────────────┘
```

**Dependency rule (ADR-0006):** modules depend on Platform Core, on platform
capabilities, and on other main modules only through published service
contracts and versioned domain events — never through their tables. All money
posts through M-FIN. Full catalog: [docs/modules/MODULES.md](docs/modules/MODULES.md).

## Key Design Decisions

See [docs/ADR/](docs/ADR/) for Architecture Decision Records.

- [ADR-0001](docs/ADR/0001-OnPremiseFirst.md) — On-Premises First
- [ADR-0002](docs/ADR/0002-SingleGoBinary.md) — Single Go Binary
- [ADR-0003](docs/ADR/0003-DomainArchitecture.md) — Domain Architecture
- [ADR-0004](docs/ADR/0004-HardwareAbstraction.md) — Hardware Abstraction
- [ADR-0005](docs/ADR/0005-AnalyticsArchitecture.md) — Analytics Architecture
- [ADR-0006](docs/ADR/0006-ModuleHierarchy.md) — Platform Module Hierarchy & Main-Module Grouping

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.22+, chi router, pgx driver, sqlc |
| Frontend | React 18, TypeScript, Vite, shadcn/ui, Tailwind |
| Mobile | Flutter 3.x, Dart |
| Database | PostgreSQL 16 |
| Caching | In-process (go-cache) |
| Search | PostgreSQL FTS |
| Auth | Custom JWT (Ed25519) |
| Testing | Go test, Playwright |
| Quality | golangci-lint, gofmt |

## Repository Structure

```
├── cmd/infineon/          # CLI entry point
├── internal/
│   ├── config/            # Configuration
│   ├── server/            # HTTP server, middleware, handlers
│   │   ├── middleware/     # Auth, tenant, audit, correlation
│   │   └── handler/       # Route handlers
│   ├── domain/            # Business logic (by domain)
│   ├── database/          # sqlc queries, migrations (embedded)
│   ├── auth/              # JWT, password, RBAC
│   ├── events/            # In-process event bus
│   ├── cache/             # In-process caching
│   ├── storage/           # File storage
│   ├── email/             # SMTP email
│   ├── workers/           # Background goroutines
│   └── licensing/         # License verification, self-update
├── frontend/              # React + TypeScript + Vite
├── mobile/                # Flutter
├── migrations/            # SQL migrations (embedded)
├── seeds/                 # Seed data (embedded)
├── docs/
│   ├── modules/           # Main-module specs (M-LOD…M-SEC) + MODULES.md catalog
│   └── ADR/               # Architecture Decision Records
├── .github/workflows/     # CI/CD
└── infrastructure/        # Docker, deployment configs
```
