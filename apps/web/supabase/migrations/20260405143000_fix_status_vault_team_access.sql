DROP POLICY IF EXISTS "Users can view their status pages" ON status_pages;
DROP POLICY IF EXISTS "Owners can create status pages" ON status_pages;
DROP POLICY IF EXISTS "Owners can update status pages" ON status_pages;
DROP POLICY IF EXISTS "Owners can delete status pages" ON status_pages;

CREATE POLICY "Users can view their status pages" ON status_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = status_pages.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = status_pages.team_id
              AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create status pages" ON status_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = status_pages.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = status_pages.team_id
              AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update status pages" ON status_pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = status_pages.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = status_pages.team_id
              AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete status pages" ON status_pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = status_pages.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = status_pages.team_id
              AND team_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their notification channels" ON notification_channels;
DROP POLICY IF EXISTS "Users can create notification channels" ON notification_channels;
DROP POLICY IF EXISTS "Users can update their notification channels" ON notification_channels;
DROP POLICY IF EXISTS "Users can delete their notification channels" ON notification_channels;

CREATE POLICY "Users can view their notification channels" ON notification_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = notification_channels.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = notification_channels.team_id
              AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create notification channels" ON notification_channels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = notification_channels.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = notification_channels.team_id
              AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their notification channels" ON notification_channels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = notification_channels.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = notification_channels.team_id
              AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their notification channels" ON notification_channels
    FOR DELETE USING (
        EXISTS (
            SELECT 1
            FROM teams
            WHERE teams.id = notification_channels.team_id
              AND teams.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM team_members
            WHERE team_members.team_id = notification_channels.team_id
              AND team_members.user_id = auth.uid()
        )
    );
