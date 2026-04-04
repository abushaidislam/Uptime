import { Suspense } from 'react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { getAnalyticsSummary, getMonitors, getIncidents, getAlerts } from '~/lib/status-vault/actions';
import { OverviewStats } from './_components/overview-stats';
import { RecentMonitors } from './_components/recent-monitors';
import { ActiveAlerts } from './_components/active-alerts';
import { RecentIncidents } from './_components/recent-incidents';

export default async function DashboardPage() {
  const [summary, monitors, incidents, alerts] = await Promise.all([
    getAnalyticsSummary(),
    getMonitors(),
    getIncidents(),
    getAlerts(),
  ]);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const activeIncidents = incidents.filter(i => !i.resolvedAt).slice(0, 5);
  const recentMonitors = monitors.slice(0, 5);

  return (
    <>
      <PageHeader 
        title="StatusVault Dashboard" 
        description="Monitor your services uptime and performance" 
      />

      <PageBody>
        <div className="space-y-6">
          <Suspense fallback={<div>Loading stats...</div>}>
            <OverviewStats summary={summary} />
          </Suspense>

          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<div>Loading monitors...</div>}>
              <RecentMonitors monitors={recentMonitors} />
            </Suspense>

            <Suspense fallback={<div>Loading alerts...</div>}>
              <ActiveAlerts alerts={activeAlerts} />
            </Suspense>
          </div>

          <Suspense fallback={<div>Loading incidents...</div>}>
            <RecentIncidents incidents={activeIncidents} />
          </Suspense>
        </div>
      </PageBody>
    </>
  );
}
