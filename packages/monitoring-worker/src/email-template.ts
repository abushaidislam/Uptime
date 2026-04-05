import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Alert, Monitor } from './types.js';

const DEFAULT_APP_URL = 'https://uptime.flinkeo.online';
const DEFAULT_BRAND_NAME = 'Uptime by Flinkeo';
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const EMAIL_ROOT = path.join(MODULE_DIR, 'email');
const TEMPLATE_ROOT = path.join(EMAIL_ROOT, 'templates');
const ASSET_ROOT = path.join(EMAIL_ROOT, 'assets');

type TemplateAssetId =
  | 'logo-mark'
  | 'wordmark'
  | 'hero-monitoring'
  | 'hero-report';

export type EmailTemplateId =
  | 'monitor-down'
  | 'monitor-recovered'
  | 'ssl-expiring'
  | 'team-invite'
  | 'weekly-uptime-report';

export interface EmailAttachment {
  cid: string;
  contentType: string;
  filename: string;
  path: string;
}

export interface AlertEmailContent {
  attachments: EmailAttachment[];
  html: string;
  subject: string;
  templateId: EmailTemplateId;
  text: string;
}

export interface TeamInviteEmailInput {
  acceptUrl: string;
  appUrl?: string;
  brandName?: string;
  inviterName: string;
  recipientEmail: string;
  teamName: string;
}

export interface WeeklyUptimeReportInput {
  appUrl?: string;
  averageResponseTime: string;
  brandName?: string;
  healthyMonitors: number;
  incidentsSummary: string[];
  monitorsChecked: number;
  reportPeriodLabel: string;
  teamName: string;
  uptimeAverage: string;
}

interface TemplateDefinition {
  assetIds: TemplateAssetId[];
  fileName: string;
}

interface TemplateRenderInput {
  rawValues?: Record<string, string>;
  subject: string;
  templateId: EmailTemplateId;
  text: string;
  values: Record<string, string>;
}

const assetManifest: Record<
  TemplateAssetId,
  Omit<EmailAttachment, 'path'>
> = {
  'hero-monitoring': {
    cid: 'hero-monitoring',
    contentType: 'image/jpeg',
    filename: 'hero-monitoring.jpg',
  },
  'hero-report': {
    cid: 'hero-report',
    contentType: 'image/jpeg',
    filename: 'hero-report.jpg',
  },
  'logo-mark': {
    cid: 'logo-mark',
    contentType: 'image/png',
    filename: 'logo-mark.png',
  },
  wordmark: {
    cid: 'wordmark',
    contentType: 'image/png',
    filename: 'wordmark.png',
  },
};

const templateDefinitions: Record<EmailTemplateId, TemplateDefinition> = {
  'monitor-down': {
    assetIds: ['logo-mark', 'wordmark', 'hero-monitoring'],
    fileName: 'monitor-down.html',
  },
  'monitor-recovered': {
    assetIds: ['logo-mark', 'wordmark', 'hero-monitoring'],
    fileName: 'monitor-recovered.html',
  },
  'ssl-expiring': {
    assetIds: ['logo-mark', 'wordmark', 'hero-monitoring'],
    fileName: 'ssl-expiring.html',
  },
  'team-invite': {
    assetIds: ['logo-mark', 'wordmark', 'hero-monitoring'],
    fileName: 'team-invite.html',
  },
  'weekly-uptime-report': {
    assetIds: ['logo-mark', 'wordmark', 'hero-report'],
    fileName: 'weekly-uptime-report.html',
  },
};

const templateCache = new Map<EmailTemplateId, string>();

export function buildAlertEmail(
  alert: Alert,
  monitor: Monitor,
): AlertEmailContent {
  const appUrl = getAppUrl();
  const templateId = getAlertTemplateId(alert);
  const baseValues = {
    app_url: appUrl,
    brand_name: DEFAULT_BRAND_NAME,
    event_time: formatDateTime(alert.createdAt),
    footer_note:
      'You are receiving this email because this monitor is connected to an active email notification channel.',
    monitor_name: monitor.name,
    monitor_status: monitor.status.toUpperCase(),
    monitor_url: monitor.url,
    response_time: monitor.lastResponseTime
      ? `${monitor.lastResponseTime} ms`
      : 'N/A',
    severity: alert.severity.toUpperCase(),
    ssl_expiry: monitor.sslExpiryDate
      ? formatDateTime(monitor.sslExpiryDate)
      : 'Not available',
    subject_line: alert.message,
    uptime_24h: formatPercent(monitor.uptime24h),
    uptime_30d: formatPercent(monitor.uptime30d),
    uptime_7d: formatPercent(monitor.uptime7d),
  };

  switch (templateId) {
    case 'monitor-down':
      return renderEmailTemplate({
        subject: `[${DEFAULT_BRAND_NAME}] ${alert.message}`,
        templateId,
        text: [
          `${DEFAULT_BRAND_NAME} outage alert`,
          '',
          `Monitor: ${monitor.name}`,
          `URL: ${monitor.url}`,
          `Severity: ${alert.severity.toUpperCase()}`,
          `Detected at: ${formatDateTime(alert.createdAt)}`,
          `Response time: ${baseValues.response_time}`,
          `Open dashboard: ${appUrl}/home/settings/notifications`,
        ].join('\n'),
        values: {
          ...baseValues,
          accent_color: '#c24735',
          accent_soft: '#fff0ea',
          badge_label: 'Outage detected',
          cta_label: 'Open incident dashboard',
          cta_url: `${appUrl}/home`,
          headline: alert.message,
          summary:
            'We could not reach this monitor during the latest health check. The service may be unavailable for users right now.',
        },
      });

    case 'monitor-recovered':
      return renderEmailTemplate({
        subject: `[${DEFAULT_BRAND_NAME}] ${alert.message}`,
        templateId,
        text: [
          `${DEFAULT_BRAND_NAME} recovery alert`,
          '',
          `Monitor: ${monitor.name}`,
          `URL: ${monitor.url}`,
          `Recovered at: ${formatDateTime(alert.createdAt)}`,
          `24h uptime: ${baseValues.uptime_24h}`,
          `Open dashboard: ${appUrl}/home`,
        ].join('\n'),
        values: {
          ...baseValues,
          accent_color: '#1f8f5f',
          accent_soft: '#eefaf4',
          badge_label: 'Service recovered',
          cta_label: 'Review service timeline',
          cta_url: `${appUrl}/home`,
          headline: `${monitor.name} is back online`,
          summary:
            'The latest health check succeeded and the monitor is responding again. This is a good moment to review the incident timeline and confirm stability.',
        },
      });

    case 'ssl-expiring':
      return renderEmailTemplate({
        subject: `[${DEFAULT_BRAND_NAME}] ${alert.message}`,
        templateId,
        text: [
          `${DEFAULT_BRAND_NAME} SSL expiry warning`,
          '',
          `Monitor: ${monitor.name}`,
          `Certificate expiry: ${baseValues.ssl_expiry}`,
          `Triggered at: ${formatDateTime(alert.createdAt)}`,
          `Open dashboard: ${appUrl}/home`,
        ].join('\n'),
        values: {
          ...baseValues,
          accent_color: '#c9831a',
          accent_soft: '#fff6e8',
          badge_label: 'SSL reminder',
          cta_label: 'Review certificate details',
          cta_url: `${appUrl}/home`,
          headline: alert.message,
          summary:
            'This SSL certificate is approaching its expiry date. Renew it before the deadline to avoid browser warnings or downtime.',
        },
      });

    default:
      return assertNever(templateId);
  }
}

export function buildTeamInviteEmail(
  input: TeamInviteEmailInput,
): AlertEmailContent {
  const appUrl = input.appUrl ?? getAppUrl();
  const brandName = input.brandName ?? DEFAULT_BRAND_NAME;

  return renderEmailTemplate({
    subject: `[${brandName}] Join ${input.teamName}`,
    templateId: 'team-invite',
    text: [
      `${input.inviterName} invited you to join ${input.teamName} on ${brandName}.`,
      '',
      `Accept invite: ${input.acceptUrl}`,
      `Recipient: ${input.recipientEmail}`,
    ].join('\n'),
    values: {
      accept_url: input.acceptUrl,
      app_url: appUrl,
      brand_name: brandName,
      footer_note:
        'Accept the invitation to collaborate on incidents, monitors, and status communication.',
      headline: `Join ${input.teamName}`,
      inviter_name: input.inviterName,
      recipient_email: input.recipientEmail,
      summary: `${input.inviterName} invited you to join the ${input.teamName} workspace so you can help manage monitors and incidents together.`,
      team_name: input.teamName,
    },
  });
}

export function buildWeeklyUptimeReportEmail(
  input: WeeklyUptimeReportInput,
): AlertEmailContent {
  const appUrl = input.appUrl ?? getAppUrl();
  const brandName = input.brandName ?? DEFAULT_BRAND_NAME;

  return renderEmailTemplate({
    rawValues: {
      incident_rows: input.incidentsSummary
        .map(
          (item) =>
            `<tr><td style="padding:0 0 10px;color:#52606d;font-size:14px;line-height:1.6;">${escapeHtml(
              item,
            )}</td></tr>`,
        )
        .join(''),
    },
    subject: `[${brandName}] Weekly uptime report for ${input.teamName}`,
    templateId: 'weekly-uptime-report',
    text: [
      `${brandName} weekly uptime report`,
      '',
      `Team: ${input.teamName}`,
      `Period: ${input.reportPeriodLabel}`,
      `Monitors checked: ${input.monitorsChecked}`,
      `Healthy monitors: ${input.healthyMonitors}`,
      `Average uptime: ${input.uptimeAverage}`,
      `Average response time: ${input.averageResponseTime}`,
      '',
      ...input.incidentsSummary.map((item) => `- ${item}`),
    ].join('\n'),
    values: {
      app_url: appUrl,
      average_response_time: input.averageResponseTime,
      brand_name: brandName,
      cta_label: 'Open uptime dashboard',
      cta_url: `${appUrl}/home`,
      footer_note:
        'Use this report to spot recurring reliability issues before they become customer-facing incidents.',
      healthy_monitors: String(input.healthyMonitors),
      headline: `Weekly uptime report for ${input.teamName}`,
      monitors_checked: String(input.monitorsChecked),
      report_period: input.reportPeriodLabel,
      summary:
        'Here is your latest reliability snapshot across all active monitors, including uptime trends and incident notes worth revisiting.',
      team_name: input.teamName,
      uptime_average: input.uptimeAverage,
    },
  });
}

function renderEmailTemplate(input: TemplateRenderInput): AlertEmailContent {
  const template = loadTemplate(input.templateId);
  const html = applyTemplateValues(
    template,
    input.values,
    input.rawValues ?? {},
  );

  return {
    attachments: getTemplateAttachments(input.templateId),
    html,
    subject: input.subject,
    templateId: input.templateId,
    text: input.text,
  };
}

function loadTemplate(templateId: EmailTemplateId): string {
  const cached = templateCache.get(templateId);

  if (cached) {
    return cached;
  }

  const templatePath = path.join(
    TEMPLATE_ROOT,
    templateDefinitions[templateId].fileName,
  );
  const template = fs.readFileSync(templatePath, 'utf8');
  templateCache.set(templateId, template);
  return template;
}

function getTemplateAttachments(templateId: EmailTemplateId): EmailAttachment[] {
  return templateDefinitions[templateId].assetIds.map((assetId) => {
    const asset = assetManifest[assetId];

    return {
      ...asset,
      path: path.join(ASSET_ROOT, asset.filename),
    };
  });
}

function applyTemplateValues(
  template: string,
  values: Record<string, string>,
  rawValues: Record<string, string>,
): string {
  let rendered = template.replace(/\{\{\{(\w+)\}\}\}/g, (_, key: string) => {
    return rawValues[key] ?? '';
  });

  rendered = rendered.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return escapeHtml(values[key] ?? '');
  });

  return rendered;
}

function getAlertTemplateId(alert: Alert): Extract<
  EmailTemplateId,
  'monitor-down' | 'monitor-recovered' | 'ssl-expiring'
> {
  switch (alert.type) {
    case 'down':
      return 'monitor-down';
    case 'up':
      return 'monitor-recovered';
    case 'ssl_expiring':
      return 'ssl-expiring';
    default:
      return 'monitor-down';
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

function formatPercent(value: number): string {
  return `${Number.isFinite(value) ? value.toFixed(2) : '0.00'}%`;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_APP_URL;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function assertNever(value: never): never {
  throw new Error(`Unsupported email template: ${value}`);
}
