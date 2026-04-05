import { Suspense } from 'react';

import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';
import { getTeamMembers, getTeamInvitations } from '~/lib/status-vault/actions';

import { TeamMembersList } from './_components/team-members-list';
import { TeamInvitationsList } from './_components/team-invitations-list';
import { InviteMemberForm } from './_components/invite-member-form';

export const metadata = {
  title: 'Team Settings',
};

async function TeamSettingsPage() {
  const [members, invitations] = await Promise.all([
    getTeamMembers(),
    getTeamInvitations(),
  ]);

  return (
    <PageBody>
      <div className="flex flex-col gap-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <Trans i18nKey={'team:pageTitle'} defaults={'Team Settings'} />
          </h1>
          <p className="text-muted-foreground mt-2">
            <Trans
              i18nKey={'team:pageDescription'}
              defaults={'Manage team members and pending invitations.'}
            />
          </p>
        </div>

        {/* Invite New Member */}
        <section>
          <h2 className="text-lg font-medium mb-4">
            <Trans i18nKey={'team:inviteMember'} defaults={'Invite Team Member'} />
          </h2>
          <InviteMemberForm />
        </section>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <section>
            <h2 className="text-lg font-medium mb-4">
              <Trans i18nKey={'team:pendingInvitations'} defaults={'Pending Invitations'} />
              <span className="ml-2 text-sm text-muted-foreground">({invitations.length})</span>
            </h2>
            <Suspense fallback={<div className="h-32 animate-pulse rounded bg-muted" />}>
              <TeamInvitationsList invitations={invitations} />
            </Suspense>
          </section>
        )}

        {/* Team Members */}
        <section>
          <h2 className="text-lg font-medium mb-4">
            <Trans i18nKey={'team:teamMembers'} defaults={'Team Members'} />
            <span className="ml-2 text-sm text-muted-foreground">({members.length})</span>
          </h2>
          <Suspense fallback={<div className="h-64 animate-pulse rounded bg-muted" />}>
            <TeamMembersList members={members} />
          </Suspense>
        </section>
      </div>
    </PageBody>
  );
}

export default withI18n(TeamSettingsPage);
