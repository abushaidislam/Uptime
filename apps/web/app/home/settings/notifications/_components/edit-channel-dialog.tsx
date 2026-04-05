'use client';

import { useState, useEffect } from 'react';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

import type { NotificationChannel } from '~/lib/status-vault/types';

interface EditChannelDialogProps {
  channel: NotificationChannel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; config: NotificationChannel['config'] }) => Promise<void>;
}

export function EditChannelDialog({ channel, open, onOpenChange, onSubmit }: EditChannelDialogProps) {
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      // Convert config back to form values
      const formConfig: Record<string, string> = {};
      if (channel.config && typeof channel.config === 'object') {
        Object.entries(channel.config).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            formConfig[key] = value.join(', ');
          } else if (typeof value === 'object') {
            formConfig[key] = JSON.stringify(value);
          } else {
            formConfig[key] = String(value);
          }
        });
      }
      setConfig(formConfig);
    }
  }, [channel]);

  const handleSubmit = async () => {
    if (!channel || !name.trim()) return;
    
    setIsSubmitting(true);
    try {
      let updatedConfig: NotificationChannel['config'];
      
      switch (channel.type) {
        case 'email':
          updatedConfig = { recipients: config.recipients?.split(',').map(e => e.trim()) || [] };
          break;
        case 'slack':
          updatedConfig = { webhookUrl: config.webhookUrl || '', channel: config.channel };
          break;
        case 'webhook':
          updatedConfig = { url: config.url || '', headers: config.headers ? JSON.parse(config.headers) : {} };
          break;
        default:
          updatedConfig = channel.config;
      }
      
      await onSubmit({ name, config: updatedConfig });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Notification Channel</DialogTitle>
          <DialogDescription>
            Update {channel.type} channel settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering Slack"
            />
          </div>

          {channel.type === 'email' && (
            <div className="grid gap-2">
              <Label htmlFor="edit-recipients">Recipients (comma-separated)</Label>
              <Input
                id="edit-recipients"
                value={config.recipients || ''}
                onChange={(e) => setConfig({ ...config, recipients: e.target.value })}
                placeholder="admin@example.com, ops@example.com"
              />
            </div>
          )}

          {channel.type === 'slack' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edit-webhookUrl">Webhook URL</Label>
                <Input
                  id="edit-webhookUrl"
                  type="url"
                  value={config.webhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-channel">Channel (optional)</Label>
                <Input
                  id="edit-channel"
                  value={config.channel || ''}
                  onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                  placeholder="#alerts"
                />
              </div>
            </>
          )}

          {channel.type === 'webhook' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  type="url"
                  value={config.url || ''}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-headers">Headers (JSON, optional)</Label>
                <Input
                  id="edit-headers"
                  value={config.headers || ''}
                  onChange={(e) => setConfig({ ...config, headers: e.target.value })}
                  placeholder='{"Authorization": "Bearer token"}'
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
