-- 0002 Identity: Users, Roles, Permissions, Sessions

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMPTZ,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100),
    property_id UUID,
    department_id UUID,
    employee_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    profile_photo VARCHAR(255),
    phone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    guard_name VARCHAR(255) NOT NULL DEFAULT 'web',
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    guard_name VARCHAR(255) NOT NULL DEFAULT 'web',
    module VARCHAR(50) NOT NULL,
    screen VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    data_scope VARCHAR(50) DEFAULT 'own',
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_screen ON permissions(screen);

CREATE TABLE role_has_permissions (
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (permission_id, role_id)
);

CREATE TABLE model_has_roles (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id UUID NOT NULL,
    PRIMARY KEY (role_id, model_type, model_id)
);

CREATE INDEX idx_model_has_roles_model ON model_has_roles(model_type, model_id);

CREATE TABLE model_has_permissions (
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id UUID NOT NULL,
    PRIMARY KEY (permission_id, model_type, model_id)
);

CREATE TABLE password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ
);

CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

CREATE TABLE personal_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
('system_administrator', 'Full system access'),
('general_manager', 'Hotel general manager'),
('front_office_manager', 'Front office department head'),
('receptionist', 'Front desk operations'),
('cashier', 'Payment processing'),
('restaurant_manager', 'Restaurant operations head'),
('waiter', 'Restaurant service staff'),
('storekeeper', 'Inventory and stores'),
('procurement_officer', 'Purchasing department'),
('accountant', 'Accounting operations'),
('finance_manager', 'Finance department head'),
('housekeeping_supervisor', 'Housekeeping department head'),
('maintenance_engineer', 'Maintenance and engineering'),
('hr_manager', 'Human resources'),
('security_officer', 'Security department');
