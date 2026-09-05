# INFINEON Enterprise Platform — API Reference

## Base URL

```
On-Premise:  http://localhost:8080/api/v1
Cloud:       https://your-hotel.infineon.com/api/v1
```

## Authentication

All protected endpoints require a JWT Bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /auth/login`.

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (except public) | `Bearer <jwt_token>` |
| `X-Property-ID` | Yes | Property identifier for multi-tenant |
| `Content-Type` | Yes | `application/json` |

## Response Format

All responses follow the standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 150,
      "last_page": 8
    }
  },
  "timestamp": "2026-08-31T10:00:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "VALIDATION_ERROR"
}
```

## Endpoint Groups

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login and receive JWT |
| POST | `/auth/register` | Register new user |

### Rooms & Room Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rooms/` | List all rooms |
| POST | `/rooms/` | Create room |
| GET | `/rooms/{id}` | Get room details |
| PUT | `/rooms/{id}` | Update room |
| DELETE | `/rooms/{id}` | Delete room |
| PUT | `/rooms/{id}/status` | Update room status |
| GET | `/room-types/` | List room types |
| POST | `/room-types/` | Create room type |

### Guests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/guests/` | List guests |
| POST | `/guests/` | Create guest |
| GET | `/guests/{id}` | Get guest |
| PUT | `/guests/{id}` | Update guest |
| GET | `/guests/search` | Search guests |

### Reservations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reservations/` | List reservations |
| POST | `/reservations/` | Create reservation |
| GET | `/reservations/{id}` | Get reservation |
| PUT | `/reservations/{id}` | Update reservation |
| POST | `/reservations/{id}/confirm` | Confirm |
| POST | `/reservations/{id}/cancel` | Cancel |
| POST | `/reservations/{id}/check-in` | Check in |
| POST | `/reservations/{id}/check-out` | Check out |
| POST | `/reservations/{id}/no-show` | Mark no-show |

### Front Desk
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/front-desk/dashboard` | Dashboard KPIs |
| GET | `/availability/check` | Check room availability |

### POS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pos/outlets/` | List outlets |
| POST | `/pos/outlets/` | Create outlet |
| GET | `/pos/tables/` | List tables |
| GET | `/pos/menu/categories` | Menu categories |
| GET | `/pos/menu/items` | Menu items |
| POST | `/pos/orders/` | Create order |
| POST | `/pos/orders/{id}/close` | Close order |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/products/` | List products |
| POST | `/inventory/products/` | Create product |
| GET | `/inventory/stock/` | Stock levels |
| POST | `/inventory/stock/movement` | Record stock movement |
| GET | `/inventory/stores/` | List stores |
| GET | `/inventory/suppliers/` | List suppliers |
| POST | `/inventory/purchase-orders/` | Create PO |

### Finance & Accounting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/finance/accounts/classes` | Account classes |
| GET | `/finance/accounts/` | Chart of accounts |
| POST | `/finance/accounts/` | Create account |
| GET | `/finance/journal/` | Journal entries |
| POST | `/finance/journal/` | Create journal entry |
| POST | `/finance/journal/{id}/post` | Post journal entry |
| GET | `/finance/ar/` | Accounts receivable |
| GET | `/finance/ap/` | Accounts payable |
| GET | `/finance/bank/` | Bank accounts |
| GET | `/finance/profit-loss` | P&L report |

### HR & People
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hr/employees/` | List employees |
| POST | `/hr/employees/` | Create employee |
| GET | `/hr/attendance/` | Attendance records |
| POST | `/hr/attendance/clock-in` | Clock in |
| POST | `/hr/attendance/clock-out` | Clock out |
| GET | `/hr/payroll/` | Payroll runs |
| POST | `/hr/payroll/` | Create payroll run |

### CRM & Guest Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/crm/guests` | CRM guest search |
| GET | `/crm/guests/{id}/profile` | Full guest profile |
| PUT | `/crm/guests/{id}/preferences` | Update preferences |
| GET | `/crm/loyalty/tiers` | Loyalty tiers |
| POST | `/crm/loyalty/award` | Award points |
| GET | `/crm/feedback` | Guest feedback |
| POST | `/crm/feedback` | Submit feedback |

### Channels & Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/channels/` | OTA channels |
| POST | `/channels/{id}/sync` | Sync channel |
| POST | `/booking/search` | Public availability search |
| POST | `/booking/create` | Public booking |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/initiate` | Initiate payment |
| POST | `/payments/webhook/paystack` | Paystack webhook |
| POST | `/payments/refund` | Process refund |

### Hardware Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hardware/devices` | List devices |
| POST | `/hardware/devices` | Register device |
| GET | `/hardware/health` | Device health |
| POST | `/hardware/door-lock/encode` | Encode key card |
| GET | `/hardware/logs` | Device logs |

### Events & Banqueting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events/` | List events |
| POST | `/events/` | Create event |
| PUT | `/events/{id}/status` | Update status |
| GET | `/events/venues` | List venues |

### Notifications & Workflow
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/send` | Send notification |
| GET | `/notifications/` | Notification history |
| GET | `/workflow/approvals` | Pending approvals |
| POST | `/workflow/approvals` | Approve/reject |

### Night Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/night-audit/run` | Run night audit |
| GET | `/night-audit/` | Last audit result |

### Reports & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/dashboard` | Executive dashboard |
| GET | `/reports/occupancy` | Occupancy report |
| GET | `/reports/room-revenue` | Revenue report |
| GET | `/reports/pos-sales` | POS sales report |
| GET | `/reports/inventory` | Inventory summary |

### Admin & System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-logs` | Audit trail |
| GET | `/config/` | System config |
| PUT | `/config/` | Update config |
| POST | `/backups/create` | Create backup |
| GET | `/backups/` | List backups |
| POST | `/backups/restore` | Restore backup |
| GET | `/backups/export` | Export data |

## OpenAPI Specification

Full OpenAPI 3.0 spec is available at `docs/API/openapi.yaml`.
