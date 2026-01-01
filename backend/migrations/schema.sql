
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"

CREATE TYPE organization_type AS ENUM ('clinic', 'pharmacy', 'home_health', 'nursing_home', 'transportation', 'dme');
CREATE TYPE organization_role AS ENUM ('sender', 'receiver', 'both');
CREATE TYPE referral_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type organization_type NOT NULL,
    role organization_role NOT NULL,
    contact_info JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

    CONSTRAINT contact_info_check CHECK (
        contact_info ? 'email' AND 
        contact_info ? 'phone' AND
        jsonb_typeof(contact_info->'email') = 'string' AND
        jsonb_typeof(contact_info->'phone') = 'string'
    )
);

CREATE TABLE coverage_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    state VARCHAR(100),
    county VARCHAR(100),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    receiver_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    patient_name VARCHAR(255) NOT NULL,
    insurance_number VARCHAR(100) NOT NULL,
    status referral_status DEFAULT 'pending' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

    CONSTRAINT no_self_referral CHECK (sender_org_id != receiver_org_id)
);

CREATE INDEX idx_coverage_areas_organization_id ON coverage_areas(organization_id);
CREATE INDEX idx_referrals_sender_org_id ON referrals(sender_org_id);
CREATE INDEX idx_referrals_receiver_org_id ON referrals(receiver_org_id);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_role ON organizations(role);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coverage_areas_updated_at 
    BEFORE UPDATE ON coverage_areas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

