import { 
  getPublicMonitorsForStatusPage, 
  getPublicStatusPage,
  getIncidents 
} from '~/lib/status-vault/actions';
import { StatusPageContent } from './_components/status-page-content';

export const metadata = {
  title: 'Status Page - StatusVault',
  description: 'Real-time service status and incident updates',
};

export default async function PublicStatusPage() {
  const [statusPage, monitors, allIncidents] = await Promise.all([
    getPublicStatusPage(),
    getPublicMonitorsForStatusPage(),
    getIncidents(),
  ]);

  // Filter incidents based on status page config
  const incidentHistoryDays = statusPage?.incidentHistoryDays || 30;
  const cutoffDate = Date.now() - incidentHistoryDays * 24 * 60 * 60 * 1000;
  
  const recentIncidents = allIncidents
    .filter(i => new Date(i.startedAt).getTime() > cutoffDate)
    .slice(0, 10);

  if (!statusPage || !statusPage.isPublic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Status Page Not Available</h1>
          <p className="text-muted-foreground">This status page is not configured or not public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StatusPageContent 
        statusPage={statusPage}
        monitors={monitors} 
        incidents={recentIncidents} 
      />
    </div>
  );
}
