import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Card, CardContent } from '@kit/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getMonitors } from '~/lib/status-vault/actions';
import { createIncident } from '~/lib/status-vault/actions';
import type { AlertSeverity } from '~/lib/status-vault/types';

export default function NewIncidentPage() {
  return (
    <>
      <PageHeader
        title="Report Incident"
        description="Create a new incident to track and manage service disruptions"
      >
        <Link href="/home/incidents">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Incidents
          </Button>
        </Link>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<div>Loading...</div>}>
          <CreateIncidentForm />
        </Suspense>
      </PageBody>
    </>
  );
}

async function CreateIncidentForm() {
  const monitors = await getMonitors();

  async function handleSubmit(formData: FormData) {
    'use server';

    const monitorId = formData.get('monitorId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const severity = formData.get('severity') as AlertSeverity;

    if (!monitorId || !title || !severity) {
      throw new Error('Monitor, title, and severity are required');
    }

    const incident = await createIncident({
      monitorId,
      title,
      description,
      severity,
    });

    redirect(`/home/incidents/${incident.id}`);
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6">
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="monitorId">Affected Monitor *</Label>
            <Select name="monitorId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a monitor" />
              </SelectTrigger>
              <SelectContent>
                {monitors.map((monitor) => (
                  <SelectItem key={monitor.id} value={monitor.id}>
                    {monitor.name} ({monitor.url})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {monitors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No monitors available. Please create a monitor first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Incident Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., API service experiencing high latency"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the incident, symptoms, and initial observations..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity *</Label>
            <Select name="severity" required defaultValue="warning">
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical - Service completely unavailable</SelectItem>
                <SelectItem value="warning">Warning - Degraded performance</SelectItem>
                <SelectItem value="info">Info - Minor issue or potential concern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/home/incidents">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={monitors.length === 0}>
              Create Incident
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
