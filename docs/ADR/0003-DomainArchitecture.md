# ADR-0003: Domain Architecture

## Status: Accepted

## Context

Enterprise platforms with 15+ business domains need clear boundaries to prevent tangled dependencies and enable independent development.

## Decision

Organize business logic under `internal/domain/{domain}/`. Each domain has: model.go, repository.go (interface), service.go (business logic), handler.go (HTTP). Domains communicate via interfaces and an in-process event bus — never via direct database queries across domain boundaries.

## Consequences

- Clear separation of concerns
- Domains can be developed and tested independently
- Event bus enables loose coupling
- Repository interfaces enable testability
- Shared kernel (internal/shared/) for cross-cutting concerns only
