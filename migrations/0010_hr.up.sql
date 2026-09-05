-- ============================================================
-- 0010_hr.up.sql — Human Resources Module
-- ============================================================

-- ============================================================
-- EMPLOYEES
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100),
    email           VARCHAR(200),
    phone           VARCHAR(30),
    date_of_birth   DATE,
    gender          VARCHAR(10),
    marital_status  VARCHAR(20),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    country         VARCHAR(100),
    emergency_contact_name  VARCHAR(200),
    emergency_contact_phone VARCHAR(30),
    department_id   UUID REFERENCES departments(id),
    position        VARCHAR(100) NOT NULL,
    employment_date DATE NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full_time', -- full_time, part_time, contract, temporary
    status          VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated, suspended
    salary          DECIMAL(15,4) DEFAULT 0,
    currency_code   VARCHAR(3) DEFAULT 'USD',
    bank_name       VARCHAR(200),
    bank_account    VARCHAR(50),
    tax_id          VARCHAR(50),
    social_security VARCHAR(50),
    leave_balance   DECIMAL(8,2) DEFAULT 30,
    user_id         UUID REFERENCES users(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- ============================================================
-- ATTENDANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    clock_in        TIMESTAMPTZ,
    clock_out       TIMESTAMPTZ,
    hours_worked    DECIMAL(6,2) GENERATED ALWAYS AS (
        CASE WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600 
        ELSE NULL END
    ) STORED,
    overtime_hours  DECIMAL(6,2) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'present', -- present, absent, late, half_day, on_leave, holiday
    late_minutes    INTEGER DEFAULT 0,
    early_departure INTEGER DEFAULT 0,
    notes           TEXT,
    approved_by     UUID REFERENCES users(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- ============================================================
-- LEAVE TYPES & REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    days_per_year   INTEGER NOT NULL DEFAULT 0,
    is_paid         BOOLEAN DEFAULT TRUE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    days_requested  INTEGER NOT NULL,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);

-- ============================================================
-- PAYROLL
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_name        VARCHAR(100) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end  DATE NOT NULL,
    payment_date    DATE NOT NULL,
    total_gross     DECIMAL(15,4) DEFAULT 0,
    total_deductions DECIMAL(15,4) DEFAULT 0,
    total_net       DECIMAL(15,4) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'draft', -- draft, calculated, approved, paid, closed
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    journal_entry_id UUID REFERENCES journal_entries(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id  UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    basic_salary    DECIMAL(15,4) DEFAULT 0,
    allowances      DECIMAL(15,4) DEFAULT 0,
    overtime_pay    DECIMAL(15,4) DEFAULT 0,
    bonuses         DECIMAL(15,4) DEFAULT 0,
    gross_pay       DECIMAL(15,4) DEFAULT 0,
    income_tax      DECIMAL(15,4) DEFAULT 0,
    pension         DECIMAL(15,4) DEFAULT 0,
    health_insurance DECIMAL(15,4) DEFAULT 0,
    loan_deduction  DECIMAL(15,4) DEFAULT 0,
    other_deductions DECIMAL(15,4) DEFAULT 0,
    total_deductions DECIMAL(15,4) DEFAULT 0,
    net_pay         DECIMAL(15,4) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'draft', -- draft, calculated, paid
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_lines_run ON payroll_lines(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_employee ON payroll_lines(employee_id);

-- ============================================================
-- EXPENSE CLAIMS
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_claims (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number    VARCHAR(30) NOT NULL,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    claim_date      DATE NOT NULL,
    total_amount    DECIMAL(15,4) NOT NULL DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'submitted', -- submitted, approved, rejected, paid
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,
    notes           TEXT,
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id        UUID NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
    expense_date    DATE NOT NULL,
    category        VARCHAR(50) NOT NULL, -- transport, fuel, food, accommodation, supplies, other
    description     TEXT NOT NULL,
    amount          DECIMAL(15,4) NOT NULL,
    receipt_path    VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_items_claim ON expense_items(claim_id);

-- ============================================================
-- PAYROLL ACCOUNTING ENTRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS number_sequences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_name   VARCHAR(50) NOT NULL,
    prefix          VARCHAR(10) DEFAULT '',
    suffix          VARCHAR(10) DEFAULT '',
    next_value      INTEGER NOT NULL DEFAULT 1,
    padding_length  INTEGER DEFAULT 6,
    property_id     UUID REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sequence_name, property_id)
);

-- Seed default leave types
INSERT INTO leave_types (name, days_per_year, is_paid) VALUES
    ('Annual Leave', 30, TRUE),
    ('Sick Leave', 14, TRUE),
    ('Maternity Leave', 90, TRUE),
    ('Paternity Leave', 7, TRUE),
    ('Compassionate Leave', 5, TRUE),
    ('Unpaid Leave', 0, FALSE),
    ('Study Leave', 10, TRUE),
    ('Public Holiday', 0, TRUE);
