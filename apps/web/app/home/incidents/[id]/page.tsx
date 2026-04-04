import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Separator } from '@kit/ui/separator';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, BarChart2, Search, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { getIncident, getMonitor, acknowledgeIncident, resolveIncident, addIncidentUpdate } from '~/lib/status-vault/actions';
import type { IncidentStatus, AlertSeverity } from '~/lib/status-vault/types';
import { formatDistanceToNow, format } from 'date-fns';
import { revalidatePath } from 'next/cache';

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params;
  const incident = await getIncident(id);

  if (!incident) {
    notFound();
  }

  const monitor = await getMonitor(incident.monitorId);

  return (
    <>
      <PageHeader
        title={incident.title}
        description={`Started ${format(new Date(incident.startedAt), 'MMM d, yyyy h:mm a')}`}
      >
        <Link href="/home/incidents">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Incidents
          </Button>
        </Link>
      </PageHeader>

      <PageBody>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<div>Loading...</div>}>
              <IncidentSummaryCard incident={incident} monitor={monitor} />
              <IncidentTimeline incident={incident} />
            </Suspense>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Suspense fallback={<div>Loading...</div>}>
              <IncidentActionsCard incident={incident} />
              <AddUpdateCard incident={incident} />
            </Suspense>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function IncidentSummaryCard({ incident, monitor }: { incident: { title: string; description?: string; severity: AlertSeverity; status: IncidentStatus; startedAt: string; resolvedAt?: string; acknowledgedAt?: string; affectedMonitors: string[] }; monitor?: { name: string; url: string; status: string } }) {
  const severityConfig: Record<AlertSeverity, { label: string; color: string }> = {
    critical: { label: 'Critical', color: 'bg-red-500 text-white' },
    warning: { label: 'Warning', color: 'bg-amber-500 text-white' },
    info: { label: 'Info', color: 'bg-blue-500 text-white' },
  };

  const statusConfig: Record<IncidentStatus, { label: string; color: string; icon: React.ElementType }> = {
    investigating: { label: 'Investigating', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: Search },
    identified: { label: 'Identified', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: AlertTriangle },
    monitoring: { label: 'Monitoring', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: BarChart2 },
    resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: CheckCircle2 },
  };

  const status = statusConfig[incident.status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={severityConfig[incident.severity].color}>
            {severityConfig[incident.severity].label}
          </Badge>
          <Badge className={status.color}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {incident.description && (
          <p className="text-muted-foreground">{incident.description}</p>
        )}

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Started</p>
            <p className="text-sm">
              {format(new Date(incident.startedAt), 'MMM d, yyyy h:mm a')}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })}
            </p>
          </div>

          {incident.resolvedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <p className="text-sm">
                {format(new Date(incident.resolvedAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          )}

          {incident.acknowledgedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Acknowledged</p>
              <p className="text-sm">
                {format(new Date(incident.acknowledgedAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          )}
        </div>

        {monitor && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Affected Monitor</p>
              <div className="flex items-center gap-2">
                <Badge variant={monitor.status === 'up' ? 'default' : 'destructive'}>
                  {monitor.status}
                </Badge>
                <span className="text-sm font-medium">{monitor.name}</span>
                <span className="text-sm text-muted-foreground">({monitor.url})</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function IncidentTimeline({ incident }: { incident: { updates: { id: string; message: string; status: IncidentStatus; createdAt: string; createdBy: string }[] } }) {
  const statusConfig: Record<IncidentStatus, { label: string; color: string }> = {
    investigating: { label: 'Investigating', color: 'text-red-600' },
    identified: { label: 'Identified', color: 'text-amber-600' },
    monitoring: { label: 'Monitoring', color: 'text-blue-600' },
    resolved: { label: 'Resolved', color: 'text-emerald-600' },
  };

  const sortedUpdates = [...incident.updates].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Incident Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedUpdates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No updates yet</p>
            <p className="text-sm">Add updates to keep stakeholders informed</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedUpdates.map((update, index) => (
              <div key={update.id} className="relative pl-6 pb-6 last:pb-0">
                {index !== sortedUpdates.length - 1 && (
                  <div className="absolute left-2 top-2 bottom-0 w-px bg-border" />
                )}
                <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-primary" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={statusConfig[update.status].color}>
                      {statusConfig[update.status].label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm">{update.message}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{update.createdBy === 'unknown' ? 'System' : update.createdBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IncidentActionsCard({ incident }: { incident: { id: string; status: IncidentStatus } }) {
  async function handleAcknowledge() {
    'use server';
    await acknowledgeIncident(incident.id);
    revalidatePath(`/home/incidents/${incident.id}`);
  }

  async function handleResolve() {
    'use server';
    await resolveIncident(incident.id);
    revalidatePath(`/home/incidents/${incident.id}`);
  }

  const isResolved = incident.status === 'resolved';
  const isInvestigating = incident.status === 'investigating';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isResolved && isInvestigating && (
          <form action={handleAcknowledge}>
            <Button type="submit" variant="outline" className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              Acknowledge
            </Button>
          </form>
        )}

        {!isResolved && (
          <form action={handleResolve}>
            <Button type="submit" className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Resolve Incident
            </Button>
          </form>
        )}

        {isResolved && (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-emerald-500" />
            <p className="text-sm">This incident has been resolved</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddUpdateCard({ incident }: { incident: { id: string; status: IncidentStatus } }) {
  async function handleSubmit(formData: FormData) {
    'use server';
    const message = formData.get('message') as string;
    const status = formData.get('status') as IncidentStatus;

    if (!message || !status) {
      throw new Error('Message and status are required');
    }

    await addIncidentUpdate(incident.id, message, status);
    revalidatePath(`/home/incidents/${incident.id}`);
  }

  const statusOptions: { value: IncidentStatus; label: string }[] = [
    { value: 'investigating', label: 'Investigating' },
    { value: 'identified', label: 'Identified' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const isResolved = incident.status === 'resolved';

  if (isResolved) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Update</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="update-status" className="text-sm font-medium block mb-2">
              New Status
            </label>
            <select
              id="update-status"
              name="status"
              required
              defaultValue={incident.status}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="update-message" className="text-sm font-medium block mb-2">
              Message
            </label>
            <textarea
              id="update-message"
              name="message"
              required
              rows={3}
              placeholder="Describe the current status..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background resize-none"
              maxLength={1000}
            />
          </div>

          <Button type="submit" className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Post Update
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
