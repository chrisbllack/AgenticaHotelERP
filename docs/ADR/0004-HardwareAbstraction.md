# ADR-0004: Hardware Abstraction

## Status: Accepted

## Context

Hotels use diverse hardware (door locks, printers, IPTV, biometrics) from multiple vendors. Business logic must not depend on specific vendor SDKs.

## Decision

All hardware is accessed through a vendor-neutral abstraction layer under `internal/domain/hardware/`. Each vendor implements a common interface (Driver contract: Connect, Disconnect, Encode, Cancel, Status, Health, Diagnostics). Business domains reference the interface, never the concrete driver.

## Consequences

- Vendors can be swapped without changing business logic
- New vendors added by implementing the interface only
- Simulators available for development/testing
- Diagnostics and health checks are standardized
