# AI Coding Agent Instructions — INFINEON Enterprise Platform

## Identity

You are building INFINEON Enterprise Platform (Project TITAN) for InfinityPlus Solutions & Services Ltd.

## Core Rules

1. **Inspect the repository** before modifying it
2. **Preserve existing architecture** unless a correctness, security, or scalability issue requires change
3. **Do not invent files or dependencies** unnecessarily
4. **Implement complete vertical slices** — not disconnected snippets
5. **Run tests after changes** — `go test ./...` and frontend lint
6. **Never place secrets in code**
7. **Never couple business logic to vendor SDKs** — use adapters/contracts
8. **Keep controllers thin** — business logic in domain services/actions
9. **Use database transactions** for multi-record operations
10. **Use exact decimal arithmetic** for money (PostgreSQL NUMERIC)

## Tech Stack (Non-Negotiable)

- Backend: Go 1.22+, chi, pgx, sqlc
- Frontend: React 18, TypeScript, Vite, shadcn/ui, Tailwind
- Mobile: Flutter 3.x, Dart
- Database: PostgreSQL 16
- Auth: Custom JWT (Ed25519)
- Testing: Go test, Playwright
- Quality: golangci-lint, gofmt, eslint, prettier

## File Organization

- `internal/domain/{domain}/` — Each domain has model.go, repository.go, service.go, handler.go
- `internal/server/middleware/` — HTTP middleware
- `internal/database/` — sqlc queries, models, migrations
- `frontend/src/features/{feature}/` — Feature-organized React components

## Naming Conventions

- Go: camelCase for variables, PascalCase for exported, snake_case for SQL
- TypeScript: camelCase for variables, PascalCase for types/components
- Database: snake_case for tables and columns
- API endpoints: kebab-case (`/api/v1/reservation-status`)

## Quality Gates

Every feature must include:
- Implementation
- Database migration (coordinated dependency order)
- Validation
- Authorization
- API endpoint (where applicable)
- UI (where applicable)
- Tests
- Documentation
