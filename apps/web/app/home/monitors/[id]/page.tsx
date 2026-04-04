import { notFound } from 'next/navigation';
import { PageBody, PageHeader } from '@kit/ui/page';
import { getMonitor, getHealthChecks } from '~/lib/status-vault/actions';
import { MonitorDetail } from './_components/monitor-detail';

interface MonitorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MonitorDetailPage({ params }: MonitorPageProps) {
  const { id } = await params;
  const [monitor, healthChecks] = await Promise.all([
    getMonitor(id),
    getHealthChecks(id, 50),
  ]);

  if (!monitor) {
    notFound();
  }

  return (
    <>
      <PageHeader 
        title={monitor.name} 
        description={monitor.url}
      />

      <PageBody>
        <MonitorDetail monitor={monitor} healthChecks={healthChecks} />
      </PageBody>
    </>
  );
}
