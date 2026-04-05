'use client';

import { useState, useEffect, useCallback } from 'react';

import type { NotificationChannel } from '~/lib/status-vault/types';
import {
  getNotificationChannels,
  createNotificationChannel,
  updateNotificationChannel,
  toggleNotificationChannel,
  deleteNotificationChannel,
} from '~/lib/status-vault/actions';

export function useNotificationChannels() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotificationChannels();
      setChannels(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (data: {
    type: NotificationChannel['type'];
    name: string;
    config: NotificationChannel['config'];
  }) => {
    await createNotificationChannel(data);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<NotificationChannel>) => {
    await updateNotificationChannel(id, data);
    await refresh();
  }, [refresh]);

  const toggle = useCallback(async (id: string) => {
    await toggleNotificationChannel(id);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteNotificationChannel(id);
    await refresh();
  }, [refresh]);

  return {
    channels,
    isLoading,
    refresh,
    create,
    update,
    toggle,
    remove,
  };
}
