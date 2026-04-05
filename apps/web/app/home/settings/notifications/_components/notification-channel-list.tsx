'use client';

import { useState } from 'react';

import { Button } from '@kit/ui/button';
import { Switch } from '@kit/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Badge } from '@kit/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { MoreHorizontal, Mail, Slack, Webhook, MessageSquare, Pencil, Trash2 } from 'lucide-react';

import type { NotificationChannel } from '~/lib/status-vault/types';
import { EditChannelDialog } from './edit-channel-dialog';

interface NotificationChannelListProps {
  channels: NotificationChannel[];
  isLoading: boolean;
  onUpdate: (id: string, data: Partial<NotificationChannel>) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  slack: <Slack className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
};

export function NotificationChannelList({
  channels,
  isLoading,
  onUpdate,
  onToggle,
  onDelete,
}: NotificationChannelListProps) {
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (channels.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No notification channels configured. Add one to receive alerts.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.map((channel) => (
            <TableRow key={channel.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {channelIcons[channel.type]}
                  <span className="capitalize">{channel.type}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{channel.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={() => onToggle(channel.id)}
                  />
                  <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                    {channel.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingChannel(channel)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(channel.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditChannelDialog
        channel={editingChannel}
        open={!!editingChannel}
        onOpenChange={(open: boolean) => !open && setEditingChannel(null)}
        onSubmit={async (data: { name: string; config: NotificationChannel['config'] }) => {
          if (editingChannel) {
            await onUpdate(editingChannel.id, data);
            setEditingChannel(null);
          }
        }}
      />
    </>
  );
}
