import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAlertEmail,
  buildTeamInviteEmail,
  buildWeeklyUptimeReportEmail,
} from './email-template.js';
import type { Alert, Monitor } from './types.js';

function createMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return {
    createdAt: '2026-04-05T00:00:00.000Z',
    id: 'monitor-1',
    interval: 300,
    name: 'Primary API',
    notificationChannels: [],
    notificationsEnabled: true,
    status: 'down',
    teamId: 'team-1',
    timeout: 30,
    type: 'https',
    updatedAt: '2026-04-05T00:00:00.000Z',
    uptime24h: 99.25,
    uptime30d: 99.92,
    uptime7d: 99.81,
    url: 'https://status.flinkeo.online/api',
    userId: 'user-1',
    ...overrides,
  };
}

function createAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    createdAt: '2026-04-05T00:05:00.000Z',
    id: 'alert-1',
    message: 'Primary API is down',
    monitorId: 'monitor-1',
    severity: 'critical',
    status: 'active',
    type: 'down',
    ...overrides,
  };
}

test('buildAlertEmail renders monitor outage HTML without runtime file access', () => {
  const email = buildAlertEmail(
    createAlert(),
    createMonitor({ lastResponseTime: 842 }),
  );

  assert.equal(email.templateId, 'monitor-down');
  assert.match(email.subject, /Primary API is down/);
  assert.match(email.html, /Primary API/);
  assert.match(email.html, /Outage detected/);
  assert.equal(email.attachments.length, 0);
});

test('buildAlertEmail switches template for SSL warnings', () => {
  const email = buildAlertEmail(
    createAlert({
      message: 'SSL certificate expires in 5 days',
      severity: 'warning',
      type: 'ssl_expiring',
    }),
    createMonitor({ sslExpiryDate: '2026-04-10T00:00:00.000Z' }),
  );

  assert.equal(email.templateId, 'ssl-expiring');
  assert.match(email.html, /SSL certificate expires in 5 days/);
  assert.match(email.text, /Certificate expiry:/);
});

test('future templates render invite and weekly report layouts', () => {
  const invite = buildTeamInviteEmail({
    acceptUrl: 'https://uptime.flinkeo.online/invite/team-1',
    inviterName: 'Sayeed',
    recipientEmail: 'ops@flinkeo.online',
    teamName: 'Ops Team',
  });
  const report = buildWeeklyUptimeReportEmail({
    averageResponseTime: '241 ms',
    healthyMonitors: 12,
    incidentsSummary: ['2 short incidents resolved within 14 minutes'],
    monitorsChecked: 14,
    reportPeriodLabel: 'Mar 29 - Apr 4',
    teamName: 'Ops Team',
    uptimeAverage: '99.94%',
  });

  assert.match(invite.html, /Join Ops Team/);
  assert.match(invite.text, /Accept invite:/);
  assert.equal(report.templateId, 'weekly-uptime-report');
  assert.match(report.html, /Incident highlights/);
  assert.match(report.html, /2 short incidents resolved within 14 minutes/);
});
