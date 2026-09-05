# Contributing to INFINEON

## Development Setup

1. Install Go 1.22+, PostgreSQL 16, Node.js 20+
2. `go mod download`
3. `infineon install`
4. `infineon serve --port 8080`

## Code Standards

- Go: `gofmt`, `golangci-lint` must pass
- TypeScript: `eslint`, `prettier` must pass
- All features require tests, migrations, validation, and documentation

## Pull Requests

1. Create feature branch from `main`
2. Implement complete vertical slice
3. Run tests and linting
4. Update documentation
5. Submit PR with clear description

## Commit Messages

Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
