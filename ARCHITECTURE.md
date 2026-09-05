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

## Domain Map

```
Identity → Organization → Configuration → Audit
    ↓
Hospitality | Restaurant | Inventory | Finance | HR | CRM | Maintenance
    ↓
Analytics | AI | Hardware | Payments | Licensing | Notifications | Workflow
```

## Key Design Decisions

See [docs/ADR/](docs/ADR/) for Architecture Decision Records.

- [ADR-0001](docs/ADR/0001-OnPremiseFirst.md) — On-Premises First
- [ADR-0002](docs/ADR/0002-SingleGoBinary.md) — Single Go Binary
- [ADR-0003](docs/ADR/0003-DomainArchitecture.md) — Domain Architecture
- [ADR-0004](docs/ADR/0004-HardwareAbstraction.md) — Hardware Abstraction
- [ADR-0005](docs/ADR/0005-AnalyticsArchitecture.md) — Analytics Architecture

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
├── docs/                  # Documentation
├── .github/workflows/     # CI/CD
└── infrastructure/        # Docker, deployment configs
```
