'use client';

import { useState, useCallback } from 'react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { PageHeader } from '@kit/ui/page';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import type { NotificationChannel } from '~/lib/status-vault/types';
import { useNotificationChannels } from './use-notification-channels';
import { NotificationChannelList } from './notification-channel-list';
import { CreateChannelDialog } from './create-channel-dialog';

export function NotificationChannelsContainer() {
  const { channels, isLoading, refresh: _refresh, create, update, toggle, remove } = useNotificationChannels();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreate = useCallback(async (data: {
    type: NotificationChannel['type'];
    name: string;
    config: NotificationChannel['config'];
  }) => {
    try {
      await create(data);
      setIsCreateDialogOpen(false);
      toast.success('Notification channel created');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to create notification channel';

      toast.error(message);
    }
  }, [create]);

  const handleUpdate = useCallback(async (id: string, data: Partial<NotificationChannel>) => {
    await update(id, data);
  }, [update]);

  const handleToggle = useCallback(async (id: string) => {
    await toggle(id);
  }, [toggle]);

  const handleDelete = useCallback(async (id: string) => {
    await remove(id);
  }, [remove]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Channels"
        description="Manage how you receive alerts for monitor events."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Channels</CardTitle>
            <CardDescription>
              Configure email, Slack, and webhook notifications.
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </CardHeader>
        <CardContent>
          <NotificationChannelList
            channels={channels}
            isLoading={isLoading}
            onUpdate={handleUpdate}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <CreateChannelDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
