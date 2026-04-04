import { Suspense } from 'react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { getMonitors, getMonitorAnalytics } from '~/lib/status-vault/actions';
import { AnalyticsOverview } from './_components/analytics-overview';

export default async function AnalyticsPage() {
  const monitors = await getMonitors();
  
  // Fetch analytics for first monitor as default
  const defaultAnalytics = monitors.length > 0 
    ? (await getMonitorAnalytics(monitors[0]!.id)) ?? null
    : null;

  return (
    <>
      <PageHeader 
        title="Analytics" 
        description="Detailed uptime and performance analytics"
      />

      <PageBody>
        <Suspense fallback={<div>Loading analytics...</div>}>
          <AnalyticsOverview 
            monitors={monitors} 
            defaultAnalytics={defaultAnalytics}
          />
        </Suspense>
      </PageBody>
    </>
  );
}
