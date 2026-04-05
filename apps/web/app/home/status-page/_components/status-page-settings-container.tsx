'use client';

import { useState, useEffect, useCallback } from 'react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';
import { Textarea } from '@kit/ui/textarea';
import { PageHeader } from '@kit/ui/page';
import { Badge } from '@kit/ui/badge';
import { Checkbox } from '@kit/ui/checkbox';

import type { StatusPage, Monitor } from '~/lib/status-vault/types';
import {
  getStatusPage,
  upsertStatusPage,
  getMonitors,
} from '~/lib/status-vault/actions';

export function StatusPageSettingsContainer() {
  const [statusPage, setStatusPage] = useState<StatusPage | undefined>();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  const [incidentHistoryDays, setIncidentHistoryDays] = useState(30);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pageData, monitorsData] = await Promise.all([
        getStatusPage(),
        getMonitors(),
      ]);
      setStatusPage(pageData);
      setMonitors(monitorsData.filter(m => m.status !== 'paused'));
      
      if (pageData) {
        setTitle(pageData.title || '');
        setDescription(pageData.description || '');
        setLogoUrl(pageData.logoUrl || '');
        setIsPublic(pageData.isPublic || false);
        setCustomDomain(pageData.customDomain || '');
        setSelectedMonitors(pageData.selectedMonitors || []);
        setIncidentHistoryDays(pageData.incidentHistoryDays || 30);
      } else {
        // Default values
        setTitle('Service Status');
        setDescription('Real-time status of our services');
        setIncidentHistoryDays(30);
        setSelectedMonitors([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await upsertStatusPage({
        title,
        description: description || undefined,
        logoUrl: logoUrl || undefined,
        isPublic,
        customDomain: customDomain || undefined,
        selectedMonitors,
        incidentHistoryDays,
      });
      setStatusPage(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMonitor = (monitorId: string) => {
    setSelectedMonitors(prev => 
      prev.includes(monitorId)
        ? prev.filter(id => id !== monitorId)
        : [...prev, monitorId]
    );
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  const publicUrl = statusPage?.slug ? `/status/${statusPage.slug}` : '/status';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Status Page Settings"
        description="Configure your public status page."
      />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Customize your status page appearance and visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Service Status"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Real-time status of our services"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="isPublic">Public Status Page</Label>
          </div>

          {isPublic && (
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-medium">Public URL</p>
              <p className="text-sm text-muted-foreground">{publicUrl}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitors to Display</CardTitle>
          <CardDescription>
            Select which monitors appear on your status page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monitors.length === 0 ? (
              <p className="text-muted-foreground">No active monitors available.</p>
            ) : (
              monitors.map((monitor) => (
                <div key={monitor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`monitor-${monitor.id}`}
                    checked={selectedMonitors.includes(monitor.id)}
                    onCheckedChange={() => toggleMonitor(monitor.id)}
                  />
                  <Label htmlFor={`monitor-${monitor.id}`} className="flex items-center gap-2">
                    {monitor.name}
                    <Badge variant={monitor.status === 'up' ? 'default' : 'destructive'}>
                      {monitor.status}
                    </Badge>
                  </Label>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Additional configuration options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="incidentHistory">Incident History (days)</Label>
            <Input
              id="incidentHistory"
              type="number"
              min={1}
              max={365}
              value={incidentHistoryDays}
              onChange={(e) => setIncidentHistoryDays(Number(e.target.value))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="status.example.com"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Custom domain support coming soon. Currently read-only.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
