import test from 'node:test';
import assert from 'node:assert/strict';

import type { Monitor } from './types.js';
import { getDueMonitors, isMonitorDue } from './monitoring-service.js';

function createMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return {
    id: 'monitor-1',
    name: 'Main API',
    url: 'https://example.com',
    type: 'https',
    status: 'up',
    interval: 300,
    timeout: 30,
    createdAt: '2026-04-05T00:00:00.000Z',
    updatedAt: '2026-04-05T00:00:00.000Z',
    userId: 'user-1',
    uptime24h: 100,
    uptime7d: 100,
    uptime30d: 100,
    notificationsEnabled: true,
    notificationChannels: [],
    ...overrides,
  };
}

test('isMonitorDue returns true when a monitor has never been checked', () => {
  const monitor = createMonitor({ lastCheckedAt: undefined });

  assert.equal(isMonitorDue(monitor, new Date('2026-04-05T00:10:00.000Z')), true);
});

test('isMonitorDue returns false before the interval has elapsed', () => {
  const monitor = createMonitor({
    interval: 300,
    lastCheckedAt: '2026-04-05T00:08:00.000Z',
  });

  assert.equal(isMonitorDue(monitor, new Date('2026-04-05T00:10:00.000Z')), false);
});

test('getDueMonitors keeps only monitors whose interval has elapsed', () => {
  const now = new Date('2026-04-05T00:10:00.000Z');
  const monitors = [
    createMonitor({
      id: 'due-monitor',
      interval: 60,
      lastCheckedAt: '2026-04-05T00:08:00.000Z',
    }),
    createMonitor({
      id: 'not-due-monitor',
      interval: 600,
      lastCheckedAt: '2026-04-05T00:08:00.000Z',
    }),
  ];

  assert.deepEqual(
    getDueMonitors(monitors, now).map((monitor) => monitor.id),
    ['due-monitor'],
  );
});
