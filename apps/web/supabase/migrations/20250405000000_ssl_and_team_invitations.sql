-- SSL Certificates table for detailed SSL monitoring
CREATE TABLE IF NOT EXISTS ssl_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    issuer TEXT,
    subject TEXT,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    fingerprint TEXT,
    grade TEXT CHECK (grade IN ('A+', 'A', 'B', 'C', 'D', 'F', 'Unknown')),
    days_until_expiry INTEGER,
    is_valid BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(monitor_id)
);

-- Team Invitations table for member invitation flow
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id),
    UNIQUE(team_id, email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_monitor_id ON ssl_certificates(monitor_id);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_valid_to ON ssl_certificates(valid_to);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_grade ON ssl_certificates(grade);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Row Level Security policies for ssl_certificates
ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SSL certificates for their monitors" ON ssl_certificates
    FOR SELECT USING (monitor_id IN (
        SELECT id FROM monitors WHERE user_id = auth.uid()
    ));

-- Row Level Security policies for team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can view invitations" ON team_invitations
    FOR SELECT USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Team owners can create invitations" ON team_invitations
    FOR INSERT WITH CHECK (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Team owners can update invitations" ON team_invitations
    FOR UPDATE USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Team owners can delete invitations" ON team_invitations
    FOR DELETE USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- Allow invited users to view their own invitations by token
CREATE POLICY "Users can view invitations by token" ON team_invitations
    FOR SELECT USING (status = 'pending' AND expires_at > NOW());

-- Allow accepted users to view their accepted invitations
CREATE POLICY "Users can view their accepted invitations" ON team_invitations
    FOR SELECT USING (accepted_by = auth.uid());

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_ssl_certificates_updated_at ON ssl_certificates;
CREATE TRIGGER update_ssl_certificates_updated_at
    BEFORE UPDATE ON ssl_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
