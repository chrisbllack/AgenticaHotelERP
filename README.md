# INFINEON Enterprise Platform

**Project TITAN** — Commercial Enterprise Platform  
**Company:** InfinityPlus Solutions & Services Ltd.

## Overview

INFINEON is a modern, enterprise-grade hospitality platform built on-premises first, with optional cloud and hybrid deployment. The first major vertical is **IHES — INFINEON Hospitality Enterprise Suite**, targeting 50–150 room hotels.

## Quick Start

```bash
# Install
curl -sSL https://get.infineon.com | bash

# Or manual
wget https://releases.infineon.com/infineon-linux-amd64 -O /usr/local/bin/infineon
chmod +x /usr/local/bin/infineon
infineon install

# Start
infineon serve --port 8080
```

Access at `http://localhost:8080`

## Architecture

- **Backend:** Go 1.22+ (single binary, embedded UI)
- **Frontend:** React + TypeScript + Vite (embedded in Go binary)
- **Mobile:** Flutter (Android + iOS)
- **Database:** PostgreSQL 16
- **Deployment:** On-Premises First, Cloud Optional, Hybrid Ready

## Product Family

| Suite | Name | Status |
|-------|------|--------|
| IHES | Hospitality Enterprise Suite | V1.0 In Development |
| IRES | Restaurant Enterprise Suite | Planned |
| IFES | Finance Enterprise Suite | Planned |
| IIES | Inventory Enterprise Suite | Planned |
| ICES | CRM Enterprise Suite | Planned |
| IMES | Maintenance Enterprise Suite | Planned |
| IAES | AI Enterprise Suite | Planned |
| IBIP | Business Intelligence Platform | Planned |
| IHF | Hardware Framework | Planned |

## Key Features

- Property Management System (PMS)
- Point of Sale (POS) with multi-outlet support
- Inventory & Procurement
- Double-Entry Accounting
- HR & Payroll
- CRM & Guest Loyalty
- Channel Manager & Online Booking Engine
- Hardware Integration (Door Locks, IPTV, PBX)
- AI Assistant
- Offline-First with Cloud Sync
- Mobile Apps (Android + iOS)

## Documentation

- [Architecture](docs/Architecture/)
- [Database](docs/Database/)
- [API](docs/API/)
- [Deployment](docs/Deployment/)
- [Developer Guide](docs/Developer%20Guide/)
- [User Guide](docs/User%20Guide/)
- [ADR](docs/ADR/)

## License

Proprietary — InfinityPlus Solutions & Services Ltd.
