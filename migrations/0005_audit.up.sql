-- 0005 Audit: Immutable audit logs, activity logs

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    property_id UUID,
    company_id UUID,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    auditable_type VARCHAR(255) NOT NULL,
    auditable_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    url TEXT,
    method VARCHAR(10),
    ip_address INET,
    user_agent TEXT,
    correlation_id UUID,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

-- Immutability: prevent UPDATE and DELETE on audit logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_property ON audit_logs(property_id);
CREATE INDEX idx_audit_logs_auditable ON audit_logs(auditable_type, auditable_id);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_correlation ON audit_logs(correlation_id);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    property_id UUID,
    description TEXT NOT NULL,
    event VARCHAR(50),
    subject_type VARCHAR(255),
    subject_id UUID,
    properties JSONB,
    batch_uuid UUID,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_activity_logs_subject ON activity_logs(subject_type, subject_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
