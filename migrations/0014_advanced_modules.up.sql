-- Goods Receiving
CREATE TABLE IF NOT EXISTS goods_receipts (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50),
    supplier_id INTEGER REFERENCES suppliers(id),
    invoice_number VARCHAR(100),
    received_by INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    total_items INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grn_items (
    id SERIAL PRIMARY KEY,
    grn_id INTEGER REFERENCES goods_receipts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    ordered_qty DECIMAL(12,2) DEFAULT 0,
    received_qty DECIMAL(12,2) DEFAULT 0,
    accepted_qty DECIMAL(12,2) DEFAULT 0,
    rejected_qty DECIMAL(12,2) DEFAULT 0,
    unit_price DECIMAL(12,2) DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date DATE,
    quality_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Three-Way Matching
CREATE TABLE IF NOT EXISTS three_way_matches (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL,
    grn_number VARCHAR(50),
    invoice_number VARCHAR(100),
    po_amount DECIMAL(12,2) DEFAULT 0,
    grn_amount DECIMAL(12,2) DEFAULT 0,
    invoice_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    discrepancy DECIMAL(12,2) DEFAULT 0,
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe / Menu Costing
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity DECIMAL(12,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(menu_item_id, product_id)
);

-- Wastage Management
CREATE TABLE IF NOT EXISTS wastage (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity DECIMAL(12,2) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    employee_name VARCHAR(200),
    waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wastage_date ON wastage(waste_date, status);

-- Stock Count
CREATE TABLE IF NOT EXISTS stock_counts (
    id SERIAL PRIMARY KEY,
    count_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count_type VARCHAR(20) NOT NULL DEFAULT 'full',
    store_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    total_items INTEGER DEFAULT 0,
    variance_cost DECIMAL(12,2) DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_count_items (
    id SERIAL PRIMARY KEY,
    count_id INTEGER REFERENCES stock_counts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    system_qty DECIMAL(12,2) DEFAULT 0,
    physical_qty DECIMAL(12,2) DEFAULT 0,
    variance DECIMAL(12,2) DEFAULT 0,
    variance_cost DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank Reconciliation
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id SERIAL PRIMARY KEY,
    bank_account_id INTEGER REFERENCES chart_of_accounts(id),
    statement_date DATE NOT NULL,
    statement_balance DECIMAL(12,2) DEFAULT 0,
    system_balance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    matched_items INTEGER DEFAULT 0,
    unmatched_items INTEGER DEFAULT 0,
    property_id INTEGER REFERENCES properties(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fixed Assets
CREATE TABLE IF NOT EXISTS fixed_assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    location VARCHAR(200),
    department VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    depreciation_method VARCHAR(20) DEFAULT 'straight_line',
    useful_life_months INTEGER DEFAULT 60,
    depreciation_per_month DECIMAL(12,2) DEFAULT 0,
    accumulated_depreciation DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON fixed_assets(status, property_id);

-- Expense Management
CREATE TABLE IF NOT EXISTS expense_claims (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    submitted_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    receipt_url TEXT,
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_status ON expense_claims(status, property_id);
