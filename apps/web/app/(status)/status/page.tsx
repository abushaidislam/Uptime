import { getMonitors, getIncidents } from '~/lib/status-vault/actions';
import { StatusPageContent } from './_components/status-page-content';

export const metadata = {
  title: 'Status Page - StatusVault',
  description: 'Real-time service status and incident updates',
};

export default async function PublicStatusPage() {
  const [monitors, incidents] = await Promise.all([
    getMonitors(),
    getIncidents(),
  ]);

  const publicMonitors = monitors.filter(m => m.status !== 'paused');
  const recentIncidents = incidents
    .filter(i => !i.resolvedAt || new Date(i.resolvedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <StatusPageContent monitors={publicMonitors} incidents={recentIncidents} />
    </div>
  );
}
