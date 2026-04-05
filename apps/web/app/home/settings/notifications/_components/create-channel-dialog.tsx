'use client';

import { useState } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import type { NotificationChannel } from '~/lib/status-vault/types';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    type: NotificationChannel['type'];
    name: string;
    config: NotificationChannel['config'];
  }) => Promise<void>;
}

export function CreateChannelDialog({ open, onOpenChange, onSubmit }: CreateChannelDialogProps) {
  const [type, setType] = useState<NotificationChannel['type']>('email');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      let channelConfig: NotificationChannel['config'];
      
      switch (type) {
        case 'email':
          channelConfig = { recipients: config.recipients?.split(',').map(e => e.trim()) || [] };
          break;
        case 'slack':
          channelConfig = { webhookUrl: config.webhookUrl || '', channel: config.channel };
          break;
        case 'webhook':
          channelConfig = { url: config.url || '', headers: config.headers ? JSON.parse(config.headers) : {} };
          break;
        default:
          channelConfig = {} as NotificationChannel['config'];
      }
      
      await onSubmit({ type, name, config: channelConfig });
      setName('');
      setConfig({});
      setType('email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Notification Channel</DialogTitle>
          <DialogDescription>
            Configure a new channel to receive monitor alerts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Channel Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as NotificationChannel['type'])}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering Slack"
            />
          </div>

          {type === 'email' && (
            <div className="grid gap-2">
              <Label htmlFor="recipients">Recipients (comma-separated)</Label>
              <Input
                id="recipients"
                value={config.recipients || ''}
                onChange={(e) => setConfig({ ...config, recipients: e.target.value })}
                placeholder="admin@example.com, ops@example.com"
              />
            </div>
          )}

          {type === 'slack' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={config.webhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="channel">Channel (optional)</Label>
                <Input
                  id="channel"
                  value={config.channel || ''}
                  onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                  placeholder="#alerts"
                />
              </div>
            </>
          )}

          {type === 'webhook' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={config.url || ''}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="headers">Headers (JSON, optional)</Label>
                <Input
                  id="headers"
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
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
