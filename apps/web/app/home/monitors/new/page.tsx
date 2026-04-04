import { PageBody, PageHeader } from '@kit/ui/page';
import { CreateMonitorForm } from './_components/create-monitor-form';

export const metadata = {
  title: 'Create Monitor - StatusVault',
  description: 'Create a new service monitor',
};

export default function NewMonitorPage() {
  return (
    <>
      <PageHeader 
        title="Create Monitor" 
        description="Add a new service monitor to track uptime and performance"
      />

      <PageBody>
        <CreateMonitorForm />
      </PageBody>
    </>
  );
}
