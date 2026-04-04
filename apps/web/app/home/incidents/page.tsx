import { Suspense } from 'react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getIncidents } from '~/lib/status-vault/actions';
import { IncidentsList } from './_components/incidents-list';

export default async function IncidentsPage() {
  const incidents = await getIncidents();

  return (
    <>
      <PageHeader 
        title="Incidents" 
        description="Track and manage service incidents"
      >
        <Link href="/home/incidents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        </Link>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<div>Loading incidents...</div>}>
          <IncidentsList incidents={incidents} />
        </Suspense>
      </PageBody>
    </>
  );
}
