-- ============================================================
-- 0009_finance.up.sql — Finance & Accounting Module
-- ============================================================

-- ============================================================
-- CHART OF ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS account_classes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(10) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code    VARCHAR(20) NOT NULL,
    account_name    VARCHAR(200) NOT NULL,
    account_class   UUID NOT NULL REFERENCES account_classes(id),
    parent_id       UUID REFERENCES chart_of_accounts(id),
    account_type    VARCHAR(30) NOT NULL DEFAULT 'detail', -- header, detail, group
    normal_balance   VARCHAR(6) NOT NULL DEFAULT 'debit', -- debit, credit
    currency_code   VARCHAR(3) DEFAULT 'USD',
    is_active       BOOLEAN DEFAULT TRUE,
    is_system       BOOLEAN DEFAULT FALSE,
    description     TEXT,
    cost_center_id  UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number    VARCHAR(30) NOT NULL,
    entry_date      DATE NOT NULL,
    business_date   DATE NOT NULL,
    description     TEXT NOT NULL,
    reference_type  VARCHAR(30), -- reservation, pos, purchase, manual
    reference_id    UUID,
    total_debit     DECIMAL(15,4) NOT NULL DEFAULT 0,
    total_credit    DECIMAL(15,4) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, posted, voided
    posted_by       UUID REFERENCES users(id),
    posted_at       TIMESTAMPTZ,
    voided_by       UUID REFERENCES users(id),
    voided_at       TIMESTAMPTZ,
    void_reason     TEXT,
    property_id     UUID NOT NULL REFERENCES properties(id),
    currency_code   VARCHAR(3) DEFAULT 'USD',
    exchange_rate   DECIMAL(10,6) DEFAULT 1.0,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry   UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_number     INTEGER NOT NULL,
    account_id      UUID NOT NULL REFERENCES chart_of_accounts(id),
    description     TEXT,
    debit_amount    DECIMAL(15,4) DEFAULT 0,
    credit_amount   DECIMAL(15,4) DEFAULT 0,
    currency_code   VARCHAR(3) DEFAULT 'USD',
    exchange_rate   DECIMAL(10,6) DEFAULT 1.0,
    cost_center_id  UUID,
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);

CREATE TABLE IF NOT EXISTS account_balances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES chart_of_accounts(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    period_year     INTEGER NOT NULL,
    period_month    INTEGER NOT NULL,
    opening_debit   DECIMAL(15,4) DEFAULT 0,
    opening_credit  DECIMAL(15,4) DEFAULT 0,
    period_debit    DECIMAL(15,4) DEFAULT 0,
    period_credit   DECIMAL(15,4) DEFAULT 0,
    closing_debit   DECIMAL(15,4) DEFAULT 0,
    closing_credit  DECIMAL(15,4) DEFAULT 0,
    currency_code   VARCHAR(3) DEFAULT 'USD',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, property_id, period_year, period_month)
);

-- ============================================================
-- ACCOUNTS RECEIVABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ar_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number  VARCHAR(30) NOT NULL,
    guest_id        UUID REFERENCES guests(id),
    company_id      UUID REFERENCES companies(id),
    reservation_id  UUID REFERENCES reservations(id),
    folio_id        UUID REFERENCES folios(id),
    invoice_date    DATE NOT NULL,
    due_date        DATE NOT NULL,
    subtotal        DECIMAL(15,4) NOT NULL DEFAULT 0,
    tax_amount      DECIMAL(15,4) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,4) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(15,4) NOT NULL DEFAULT 0,
    paid_amount     DECIMAL(15,4) NOT NULL DEFAULT 0,
    balance         DECIMAL(15,4) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, sent, partially_paid, paid, overdue, voided
    currency_code   VARCHAR(3) DEFAULT 'USD',
    payment_terms   VARCHAR(50), -- net_30, net_60, due_on_receipt
    notes           TEXT,
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ar_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number  VARCHAR(30) NOT NULL,
    invoice_id      UUID NOT NULL REFERENCES ar_invoices(id),
    payment_date    DATE NOT NULL,
    amount          DECIMAL(15,4) NOT NULL,
    payment_method  VARCHAR(30) NOT NULL, -- cash, card, bank_transfer, mobile, cheque
    reference_number VARCHAR(100),
    bank_account    VARCHAR(200),
    notes           TEXT,
    property_id     UUID NOT NULL REFERENCES properties(id),
    received_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_payments_invoice ON ar_payments(invoice_id);

-- ============================================================
-- ACCOUNTS PAYABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ap_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number  VARCHAR(30) NOT NULL,
    supplier_id     UUID NOT NULL REFERENCES suppliers(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    goods_receipt_id UUID REFERENCES goods_receipts(id),
    invoice_date    DATE NOT NULL,
    due_date        DATE NOT NULL,
    subtotal        DECIMAL(15,4) NOT NULL DEFAULT 0,
    tax_amount      DECIMAL(15,4) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,4) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(15,4) NOT NULL DEFAULT 0,
    paid_amount     DECIMAL(15,4) NOT NULL DEFAULT 0,
    balance         DECIMAL(15,4) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, approved, partially_paid, paid, overdue, voided
    currency_code   VARCHAR(3) DEFAULT 'USD',
    payment_terms   VARCHAR(50),
    notes           TEXT,
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ap_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number  VARCHAR(30) NOT NULL,
    invoice_id      UUID NOT NULL REFERENCES ap_invoices(id),
    payment_date    DATE NOT NULL,
    amount          DECIMAL(15,4) NOT NULL,
    payment_method  VARCHAR(30) NOT NULL,
    reference_number VARCHAR(100),
    bank_account    VARCHAR(200),
    notes           TEXT,
    property_id     UUID NOT NULL REFERENCES properties(id),
    approved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ap_payments_invoice ON ap_payments(invoice_id);

-- ============================================================
-- BANK ACCOUNTS & RECONCILIATION
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name    VARCHAR(200) NOT NULL,
    bank_name       VARCHAR(200) NOT NULL,
    account_number  VARCHAR(50) NOT NULL,
    sort_code       VARCHAR(20),
    swift_code      VARCHAR(20),
    iban            VARCHAR(50),
    currency_code   VARCHAR(3) DEFAULT 'USD',
    gl_account_id   UUID REFERENCES chart_of_accounts(id),
    opening_balance DECIMAL(15,4) DEFAULT 0,
    current_balance DECIMAL(15,4) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    description     TEXT NOT NULL,
    debit_amount    DECIMAL(15,4) DEFAULT 0,
    credit_amount   DECIMAL(15,4) DEFAULT 0,
    balance         DECIMAL(15,4),
    reference_number VARCHAR(100),
    reconciled      BOOLEAN DEFAULT FALSE,
    reconciled_at   TIMESTAMPTZ,
    journal_entry_id UUID REFERENCES journal_entries(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);

-- ============================================================
-- BUDGETS
-- ============================================================

CREATE TABLE IF NOT EXISTS budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_name     VARCHAR(200) NOT NULL,
    account_id      UUID NOT NULL REFERENCES chart_of_accounts(id),
    department_id   UUID REFERENCES departments(id),
    period_year     INTEGER NOT NULL,
    period_month    INTEGER NOT NULL,
    budget_amount   DECIMAL(15,4) NOT NULL DEFAULT 0,
    actual_amount   DECIMAL(15,4) NOT NULL DEFAULT 0,
    variance        DECIMAL(15,4) GENERATED ALWAYS AS (budget_amount - actual_amount) STORED,
    variance_pct    DECIMAL(8,4) GENERATED ALWAYS AS (
        CASE WHEN budget_amount != 0 THEN ((budget_amount - actual_amount) / budget_amount * 100) ELSE 0 END
    ) STORED,
    currency_code   VARCHAR(3) DEFAULT 'USD',
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, department_id, period_year, period_month, property_id)
);

-- ============================================================
-- FIXED ASSETS
-- ============================================================

CREATE TABLE IF NOT EXISTS fixed_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code      VARCHAR(30) NOT NULL,
    asset_name      VARCHAR(200) NOT NULL,
    category        VARCHAR(100) NOT NULL,
    description     TEXT,
    location        VARCHAR(200),
    department_id   UUID REFERENCES departments(id),
    purchase_date   DATE NOT NULL,
    purchase_cost   DECIMAL(15,4) NOT NULL,
    useful_life_years INTEGER NOT NULL DEFAULT 5,
    depreciation_method VARCHAR(30) DEFAULT 'straight_line', -- straight_line, declining_balance
    salvage_value   DECIMAL(15,4) DEFAULT 0,
    accumulated_depreciation DECIMAL(15,4) DEFAULT 0,
    current_value   DECIMAL(15,4) NOT NULL,
    status          VARCHAR(20) DEFAULT 'active', -- active, disposed, written_off
    disposed_date   DATE,
    disposed_value  DECIMAL(15,4),
    gl_account_id   UUID REFERENCES chart_of_accounts(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASHIERING / PETTY CASH
-- ============================================================

CREATE TABLE IF NOT EXISTS petty_cash (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number  VARCHAR(30) NOT NULL,
    transaction_date DATE NOT NULL,
    description     TEXT NOT NULL,
    amount          DECIMAL(15,4) NOT NULL,
    type            VARCHAR(10) NOT NULL, -- in, out
    category        VARCHAR(50), -- fuel, supplies, transport, refreshment, other
    reference       VARCHAR(100),
    approved_by     UUID REFERENCES users(id),
    received_by     UUID REFERENCES users(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_date ON petty_cash(transaction_date);
