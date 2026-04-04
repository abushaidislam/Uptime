import { Suspense } from 'react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { getAlerts, acknowledgeAllAlerts, resolveAllAlerts } from '~/lib/status-vault/actions';
import { AlertsList } from './_components/alerts-list';

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <>
      <PageHeader 
        title="Alerts" 
        description="Manage notifications and alerts for your monitors"
      >
        <div className="flex gap-2">
          <form action={acknowledgeAllAlerts}>
            <Button type="submit" variant="outline">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Acknowledge All
            </Button>
          </form>
          <form action={resolveAllAlerts}>
            <Button type="submit" variant="outline">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Resolve All
            </Button>
          </form>
        </div>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<div>Loading alerts...</div>}>
          <AlertsList alerts={alerts} />
        </Suspense>
      </PageBody>
    </>
  );
}
