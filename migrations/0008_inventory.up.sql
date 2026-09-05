-- 0008 Inventory: Products, Stock, Movements, Suppliers, Purchasing, Night Audit

-- Inventory Stores (reuse from 0003 but add if not exists)
CREATE TABLE IF NOT EXISTS inventory_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'store',
    location VARCHAR(255),
    manager_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

-- Inventory Products
CREATE TABLE inventory_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'unit',
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(10,2) NOT NULL DEFAULT 0,
    maximum_stock NUMERIC(10,2),
    minimum_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    supplier_id UUID,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_trackable BOOLEAN NOT NULL DEFAULT TRUE,
    storage_location VARCHAR(100),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, sku)
);

CREATE INDEX idx_inventory_products_property ON inventory_products(property_id);
CREATE INDEX idx_inventory_products_category ON inventory_products(category);
CREATE INDEX idx_inventory_products_sku ON inventory_products(sku);

-- Stock per store per batch
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES inventory_stores(id) ON DELETE CASCADE,
    batch_number VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(product_id, store_id, batch_number)
);

CREATE INDEX idx_inventory_stock_product ON inventory_stock(product_id);
CREATE INDEX idx_inventory_stock_store ON inventory_stock(store_id);

-- Stock Movements
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    from_store_id UUID REFERENCES inventory_stores(id),
    to_store_id UUID REFERENCES inventory_stores(id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    movement_type VARCHAR(50) NOT NULL DEFAULT 'adjustment',
    reference_type VARCHAR(50),
    reference_id UUID,
    reason TEXT,
    batch_number VARCHAR(50),
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_inventory_movements_property ON inventory_movements(property_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(100),
    bank_name VARCHAR(100),
    bank_account VARCHAR(100),
    payment_terms_days SMALLINT DEFAULT 30,
    credit_limit NUMERIC(15,2) DEFAULT 0,
    rating SMALLINT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE suppliers_products (
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES inventory_products(id) ON DELETE CASCADE,
    unit_price NUMERIC(12,2),
    lead_time_days SMALLINT,
    PRIMARY KEY (supplier_id, product_id)
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    po_number VARCHAR(20) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_purchase_orders_property ON purchase_orders(property_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    quantity NUMERIC(10,2) NOT NULL,
    received_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_po_lines_po ON purchase_order_lines(po_id);

-- Goods Received Note
CREATE TABLE goods_received_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    grn_number VARCHAR(20) NOT NULL UNIQUE,
    po_id UUID REFERENCES purchase_orders(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    notes TEXT,
    received_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ
);

CREATE TABLE goods_received_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
    po_line_id UUID REFERENCES purchase_order_lines(id),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,
    created_at TIMESTAMPTZ
);

-- Wastage
CREATE TABLE wastage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    store_id UUID NOT NULL REFERENCES inventory_stores(id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(15,2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ
);

-- Night Audit
CREATE TABLE night_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    business_date DATE NOT NULL,
    total_rooms INT NOT NULL DEFAULT 0,
    occupied_rooms INT NOT NULL DEFAULT 0,
    arrivals INT NOT NULL DEFAULT 0,
    departures INT NOT NULL DEFAULT 0,
    no_shows INT NOT NULL DEFAULT 0,
    cancellations INT NOT NULL DEFAULT 0,
    total_room_charges NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_tax NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_payments NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_pos_sales NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    completed_by UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ,
    UNIQUE(property_id, business_date)
);
