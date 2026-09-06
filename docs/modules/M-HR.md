# M-HR — Workforce

**Main Module Code:** M-HR · **Tier:** ● Core · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P015 (employees, attendance, leave, payroll), P020 (labor forecasting), P021 (mobile clocking).

## Purpose
Manage the people who deliver the service: employee records and org structure,
time and attendance with biometric capture, statutory-compliant payroll, and
demand-driven staff scheduling that aligns labor cost with forecast occupancy
and covers.

## Submodules

### `hr/core` — ● Core
| Feature Set | Features |
|---|---|
| Employee Master | Employee records & photos · org chart, positions & grades · contracts (type, term, probation) |
| Documents & Lifecycle | Document vault with expiry alerts · onboarding/offboarding checklists · transfers & promotions with history |
| Self-Service | Employee portal: profile, payslips, leave balance & requests · manager approvals inbox |

### `hr/time-attendance` — ● Core
| Feature Set | Features |
|---|---|
| Time Capture | Clock-in/out (mobile, terminal, biometric via M-HDW) · job/department transfer punches · rounding rules |
| Attendance Control | Shift adherence & lateness · overtime rules & pre-approval · absence codes & documentation |
| Leave | Leave types & accrual policies · carry-forward caps · leave workflow with delegation · leave calendar & blackout windows |

### `hr/payroll` — ● Core
| Feature Set | Features |
|---|---|
| Pay Structures | Salary & wage structures · allowances & deductions (statutory + voluntary) · proration rules |
| Payroll Runs | Preview → approve → pay lifecycle · off-cycle payments · statutory tables (PAYE/pension/NHF…) per country · variance report vs prior run |
| Output & Posting | Payslips (portal + PDF) · bank file generation (country format adapters) · GL posting to M-FIN · year-to-date & statutory reports |

### `hr/scheduling` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Demand Planning | Labor demand from occupancy (M-LOD) & covers (M-FNB) forecasts · labor standards per position/shift |
| Rostering | Schedule templates · roster vs availability vs leave · open-shift claiming · swap requests with approval |
| Cost Control | Labor cost vs budget (per department, per daypart) · overtime early-warning · productivity (covers per labor hour) |

## Events Published
`employee.hired|updated|exited` · `attendance.anomaly` ·
`leave.requested|approved|rejected` · `payroll.previewed|approved|paid`

## Consumed Contracts
M-HDW biometric & terminal devices · M-FIN payroll GL posting & payment files ·
M-LOD/M-FNB demand forecasts (read-only facts) · M-PLT workflow, notifications,
audit.

## Key Non-Functional Targets
Payroll run preview for 300 staff < 60 s · biometric punch sync < 5 s ·
payslip portal access offline (last 12 runs cached) · statutory table updates
without code release (config-driven).
