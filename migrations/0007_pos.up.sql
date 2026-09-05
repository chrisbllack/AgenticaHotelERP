-- 0007 POS: Outlets, Tables, Menu, Orders, Payments

CREATE TABLE pos_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    number VARCHAR(20) NOT NULL,
    capacity SMALLINT NOT NULL DEFAULT 4,
    section VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(outlet_id, number)
);

CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    display_order SMALLINT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(outlet_id, code)
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    preparation_time SMALLINT,
    image VARCHAR(255),
    sort_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE pos_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    table_id UUID REFERENCES pos_tables(id),
    guest_stay_id UUID REFERENCES guest_stays(id),
    order_number VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    waiter_id UUID REFERENCES users(id),
    business_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_pos_orders_property ON pos_orders(property_id);
CREATE INDEX idx_pos_orders_outlet ON pos_orders(outlet_id);
CREATE INDEX idx_pos_orders_status ON pos_orders(status);
CREATE INDEX idx_pos_orders_date ON pos_orders(business_date);

CREATE TABLE pos_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity NUMERIC(8,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount NUMERIC(12,2) NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ordered',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_pos_order_lines_order ON pos_order_lines(order_id);

CREATE TABLE pos_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reference VARCHAR(255),
    created_at TIMESTAMPTZ
);

CREATE INDEX idx_pos_payments_order ON pos_payments(order_id);

CREATE TABLE cashier_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    shift_number VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    opening_float NUMERIC(12,2) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(12,2),
    expected_balance NUMERIC(12,2),
    variance NUMERIC(12,2),
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    notes TEXT,
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);

CREATE INDEX idx_cashier_shifts_user ON cashier_shifts(user_id);
CREATE INDEX idx_cashier_shifts_status ON cashier_shifts(status);
