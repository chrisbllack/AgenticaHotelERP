# ADR-0002: Single Go Binary

## Status: Accepted

## Context

Distributed on-premise deployments require trivial installation. Laravel/PHP requires Nginx, PHP-FPM, Composer, Node.js — too many moving parts.

## Decision

Go compiles to a single binary. Using `//go:embed`, the React frontend, SQL migrations, and seed data are embedded in the binary. Running the app requires only PostgreSQL on the host.

## Consequences

- One file deployment: `./infineon serve`
- Zero runtime dependencies beyond PostgreSQL
- Embedded frontend served directly (no Nginx needed)
- Embedded migrations run automatically on startup
- Binary self-update capability for OTA updates
- Immune to environment-induced breaking changes
