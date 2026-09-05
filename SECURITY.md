# Security Policy

## Reporting Vulnerabilities

Report security issues to security@infineon.com. Do not open public issues for security vulnerabilities.

## Security Features

- RBAC with granular permissions (module/screen/action/data scope)
- JWT authentication with Ed25519 signing
- Audit logging (immutable)
- Input validation at API and UI layers
- Rate limiting on auth endpoints
- Secrets externalized from source code
- PostgreSQL Row-Level Security for multi-tenancy

## On-Premises Security

- Core operations run entirely offline
- No data leaves the premises unless explicitly configured
- Local database is authoritative
- Cryptographic license verification (offline capable)
