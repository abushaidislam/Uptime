import { Suspense } from 'react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getMonitors } from '~/lib/status-vault/actions';
import { MonitorsTable } from './_components/monitors-table';

export default async function MonitorsPage() {
  const monitors = await getMonitors();

  return (
    <>
      <PageHeader 
        title="Monitors" 
        description="Manage and configure your service monitors"
      >
        <Link href="/home/monitors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Monitor
          </Button>
        </Link>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<div>Loading monitors...</div>}>
          <MonitorsTable monitors={monitors} />
        </Suspense>
      </PageBody>
    </>
  );
}
