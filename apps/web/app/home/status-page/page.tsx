import { Suspense } from 'react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Settings, Eye } from 'lucide-react';
import Link from 'next/link';
import { getMonitors, getIncidents } from '~/lib/status-vault/actions';
import { StatusPagePreview } from './_components/status-page-preview';

export default async function StatusPage() {
  const [monitors, incidents] = await Promise.all([
    getMonitors(),
    getIncidents(),
  ]);

  // Only show public monitors on status page
  const publicMonitors = monitors.filter(m => m.status !== 'paused');
  const recentIncidents = incidents
    .filter(i => !i.resolvedAt || new Date(i.resolvedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
    .slice(0, 10);

  return (
    <>
      <PageHeader 
        title="Status Page" 
        description="Configure and preview your public status page"
      >
        <div className="flex gap-2">
          <Link href="/status" target="_blank">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview Public Page
            </Button>
          </Link>
          <Link href="/home/status-page/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<div>Loading status page...</div>}>
          <StatusPagePreview 
            monitors={publicMonitors} 
            incidents={recentIncidents}
          />
        </Suspense>
      </PageBody>
    </>
  );
}
