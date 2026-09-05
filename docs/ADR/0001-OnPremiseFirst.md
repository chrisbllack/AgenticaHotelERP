# ADR-0001: On-Premises First

## Status: Accepted

## Context

Hotels in Africa and other target markets have unreliable internet connectivity. A cloud-only PMS would fail during outages, preventing check-ins, POS transactions, and core operations.

## Decision

All core hotel operations must work entirely on-premises without internet connectivity. The Go binary and PostgreSQL database run locally. Cloud is optional and enhances (never replaces) local operations.

## Consequences

- Single binary deployment for trivial installation
- Local PostgreSQL is authoritative for all operations
- Remote access via Cloudflare Tunnels or VPN (not direct port exposure)
- Cloud sync is queued when offline, pushed when online
- License verification works offline with cryptographic grace period
