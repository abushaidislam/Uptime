import type { SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

import { buildAlertEmail } from './email-template.js';
import type { NotificationChannel, Alert, Monitor } from './types.js';

// Alert Delivery Service
// Responsible for dispatching alerts to configured notification channels

export async function dispatchAlertNotifications(
  supabase: SupabaseClient,
  alert: Alert,
  monitor: Monitor,
): Promise<void> {
  if (!monitor.notificationsEnabled) {
    console.log(`[AlertDelivery] Notifications disabled for monitor ${monitor.id}`);
    return;
  }

  const teamId = await resolveMonitorTeamId(supabase, monitor);

  if (!teamId) {
    console.warn(
      `[AlertDelivery] No team found for monitor ${monitor.id}; skipping notification dispatch`,
    );

    return;
  }

  // Get team notification channels
  const { data: channels, error } = await supabase
    .from('notification_channels')
    .select('*')
    .eq('team_id', teamId)
    .eq('enabled', true);

  if (error) {
    console.error('[AlertDelivery] Failed to fetch notification channels:', error);
    return;
  }

  if (!channels || channels.length === 0) {
    console.log(`[AlertDelivery] No active notification channels for monitor ${monitor.id}`);
    return;
  }

  console.log(`[AlertDelivery] Dispatching ${alert.type} alert to ${channels.length} channels`);

  // Dispatch to each channel
  for (const channel of channels) {
    try {
      await dispatchToChannel(channel, alert, monitor);
    } catch (err) {
      console.error(`[AlertDelivery] Failed to dispatch to ${channel.type}:`, err);
    }
  }
}

async function resolveMonitorTeamId(
  supabase: SupabaseClient,
  monitor: Monitor,
): Promise<string | undefined> {
  if (monitor.teamId) {
    return monitor.teamId;
  }

  const { data: ownedTeam, error: ownedTeamError } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', monitor.userId)
    .limit(1)
    .maybeSingle();

  if (!ownedTeamError && ownedTeam?.id) {
    return ownedTeam.id as string;
  }

  const { data: memberTeam, error: memberTeamError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', monitor.userId)
    .limit(1)
    .maybeSingle();

  if (!memberTeamError && memberTeam?.team_id) {
    return memberTeam.team_id as string;
  }

  return undefined;
}

async function dispatchToChannel(
  channel: NotificationChannel,
  alert: Alert,
  monitor: Monitor,
): Promise<void> {
  switch (channel.type) {
    case 'email':
      await dispatchEmail(channel, alert, monitor);
      break;
    case 'slack':
      await dispatchSlack(channel, alert, monitor);
      break;
    case 'webhook':
      await dispatchWebhook(channel, alert, monitor);
      break;
    default:
      console.warn(`[AlertDelivery] Unknown channel type: ${channel.type}`);
  }
}

async function dispatchEmail(
  channel: NotificationChannel,
  alert: Alert,
  monitor: Monitor,
): Promise<void> {
  const config = channel.config as { recipients: string[] };

  if (!config.recipients?.length) {
    console.warn('[AlertDelivery] Email channel has no recipients');
    return;
  }

  const transporter = getEmailTransport();

  if (!transporter) {
    console.warn(
      '[AlertDelivery] SMTP configuration missing; skipping email delivery',
    );
    return;
  }

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  if (!fromEmail) {
    console.warn(
      '[AlertDelivery] SMTP_FROM_EMAIL or SMTP_USER must be set for email delivery',
    );
    return;
  }

  const fromName = process.env.SMTP_FROM_NAME || 'Uptime by Flinkeo';
  const { attachments, subject, html, text } = buildAlertEmail(alert, monitor);

  await transporter.sendMail({
    attachments,
    from: `${fromName} <${fromEmail}>`,
    to: config.recipients.join(', '),
    subject,
    text,
    html,
  });

  console.log(
    `[AlertDelivery] Email notification sent to ${config.recipients.join(', ')}`,
  );
}

async function dispatchSlack(
  channel: NotificationChannel,
  alert: Alert,
  monitor: Monitor,
): Promise<void> {
  const config = channel.config as { webhookUrl: string; channel?: string };
  
  if (!config.webhookUrl) {
    console.warn('[AlertDelivery] Slack channel has no webhook URL');
    return;
  }

  const color = alert.type === 'down' ? '#dc2626' : 
                alert.type === 'ssl_expiring' ? '#f59e0b' : '#16a34a';
  
  const payload = {
    text: alert.message,
    channel: config.channel,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'Monitor',
            value: `${monitor.name} (${monitor.url})`,
            short: true,
          },
          {
            title: 'Status',
            value: alert.type.toUpperCase(),
            short: true,
          },
          {
            title: 'Severity',
            value: alert.severity,
            short: true,
          },
          {
            title: 'Time',
            value: new Date(alert.createdAt).toLocaleString(),
            short: true,
          },
        ],
        footer: 'StatusVault',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`[AlertDelivery] Slack notification sent successfully`);
  } catch (err) {
    console.error('[AlertDelivery] Slack dispatch failed:', err);
    throw err;
  }
}

async function dispatchWebhook(
  channel: NotificationChannel,
  alert: Alert,
  monitor: Monitor,
): Promise<void> {
  const config = channel.config as { url: string; headers?: Record<string, string> };
  
  if (!config.url) {
    console.warn('[AlertDelivery] Webhook channel has no URL');
    return;
  }

  const payload = {
    alert: {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      createdAt: alert.createdAt,
    },
    monitor: {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      status: monitor.status,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`[AlertDelivery] Webhook notification sent successfully`);
  } catch (err) {
    console.error('[AlertDelivery] Webhook dispatch failed:', err);
    throw err;
  }
}

let cachedTransporter: nodemailer.Transporter | undefined;

function getEmailTransport(): nodemailer.Transporter | undefined {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !portValue || !user || !pass) {
    return undefined;
  }

  const port = Number(portValue);

  if (Number.isNaN(port)) {
    console.warn(
      `[AlertDelivery] Invalid SMTP_PORT value "${portValue}"; skipping email delivery`,
    );
    return undefined;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: getSmtpSecure(port),
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

function getSmtpSecure(port: number): boolean {
  if (process.env.SMTP_SECURE !== undefined) {
    return process.env.SMTP_SECURE === 'true';
  }

  return port === 465;
}
