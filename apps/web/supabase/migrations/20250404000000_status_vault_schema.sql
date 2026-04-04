-- StatusVault Database Schema
-- Teams table (must be created before monitors)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- Monitors table
CREATE TABLE IF NOT EXISTS monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('http', 'https', 'tcp', 'ping')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('up', 'down', 'paused', 'pending')),
    interval INTEGER NOT NULL DEFAULT 60, -- seconds
    timeout INTEGER NOT NULL DEFAULT 30, -- seconds
    expected_status INTEGER, -- for HTTP monitors
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    last_checked_at TIMESTAMPTZ,
    last_response_time INTEGER, -- ms
    uptime_24h DECIMAL(5,2) DEFAULT 100.00,
    uptime_7d DECIMAL(5,2) DEFAULT 100.00,
    uptime_30d DECIMAL(5,2) DEFAULT 100.00,
    ssl_expiry_date TIMESTAMPTZ,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    notification_channels JSONB DEFAULT '[]'::jsonb
);

-- Health checks table
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('up', 'down')),
    response_time INTEGER NOT NULL, -- ms
    status_code INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error TEXT,
    location TEXT NOT NULL DEFAULT 'default'
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    root_cause TEXT,
    affected_monitors UUID[] DEFAULT '{}'::uuid[]
);

-- Incident updates table
CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('down', 'up', 'ssl_expiring', 'performance')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ
);

-- Status pages table
CREATE TABLE IF NOT EXISTS status_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    custom_domain TEXT,
    selected_monitors UUID[] DEFAULT '{}'::uuid[],
    incident_history_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification channels table
CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'slack', 'webhook', 'sms')),
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monitors_user_id ON monitors(user_id);
CREATE INDEX IF NOT EXISTS idx_monitors_team_id ON monitors(team_id);
CREATE INDEX IF NOT EXISTS idx_monitors_status ON monitors(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_monitor_id ON health_checks(monitor_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp);
CREATE INDEX IF NOT EXISTS idx_incidents_monitor_id ON incidents(monitor_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_alerts_monitor_id ON alerts(monitor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_status_pages_team_id ON status_pages(team_id);
CREATE INDEX IF NOT EXISTS idx_status_pages_slug ON status_pages(slug);

-- Row Level Security policies
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

-- Monitors policies
CREATE POLICY "Users can view own monitors" ON monitors
    FOR SELECT USING (user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create own monitors" ON monitors
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own monitors" ON monitors
    FOR UPDATE USING (user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Users can delete own monitors" ON monitors
    FOR DELETE USING (user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Health checks policies
CREATE POLICY "Users can view health checks for their monitors" ON health_checks
    FOR SELECT USING (monitor_id IN (
        SELECT id FROM monitors WHERE user_id = auth.uid() OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
    ));

-- Incidents policies
CREATE POLICY "Users can view incidents for their monitors" ON incidents
    FOR SELECT USING (monitor_id IN (
        SELECT id FROM monitors WHERE user_id = auth.uid() OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can create incidents for their monitors" ON incidents
    FOR INSERT WITH CHECK (monitor_id IN (
        SELECT id FROM monitors WHERE user_id = auth.uid() OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    ));

CREATE POLICY "Users can update incidents for their monitors" ON incidents
    FOR UPDATE USING (monitor_id IN (
        SELECT id FROM monitors WHERE user_id = auth.uid() OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    ));

-- Alerts policies
CREATE POLICY "Users can view alerts for their monitors" ON alerts
    FOR SELECT USING (monitor_id IN (
        SELECT id FROM monitors WHERE user_id = auth.uid() OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can update their alerts" ON alerts
    FOR UPDATE USING (monitor_id IN (
        SELECT id FROM monitors WHERE user_id = auth.uid() OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    ));

-- Teams policies
CREATE POLICY "Users can view their teams" ON teams
    FOR SELECT USING (id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ) OR owner_id = auth.uid());

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Only owners can update teams" ON teams
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Only owners can delete teams" ON teams
    FOR DELETE USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ) OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Owners and admins can add team members" ON team_members
    FOR INSERT WITH CHECK (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Owners and admins can remove team members" ON team_members
    FOR DELETE USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- Status pages policies
CREATE POLICY "Users can view their status pages" ON status_pages
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ) OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Team members can create status pages" ON status_pages
    FOR INSERT WITH CHECK (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Team members can update status pages" ON status_pages
    FOR UPDATE USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE POLICY "Team members can delete status pages" ON status_pages
    FOR DELETE USING (team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));
