import type { Alert, Monitor } from './types.js';

const DEFAULT_APP_URL = 'https://uptime.flinkeo.online';
const DEFAULT_BRAND_NAME = 'Uptime by Flinkeo';

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

export function buildAlertEmail(
  alert: Alert,
  monitor: Monitor,
): AlertEmailContent {
  const appUrl = getAppUrl();
  const templateId = getAlertTemplateId(alert);
  const sharedFields = [
    metricRow('Monitor', monitor.name),
    metricRow('URL', monitor.url),
    metricRow('Severity', alert.severity.toUpperCase()),
    metricRow('Triggered', formatDateTime(alert.createdAt)),
    metricRow(
      'Response time',
      monitor.lastResponseTime ? `${monitor.lastResponseTime} ms` : 'N/A',
    ),
    metricRow('24h uptime', formatPercent(monitor.uptime24h)),
    metricRow('7d uptime', formatPercent(monitor.uptime7d)),
    metricRow('30d uptime', formatPercent(monitor.uptime30d)),
  ].join('');

  switch (templateId) {
    case 'monitor-down':
      return createEmail({
        body: sharedFields,
        ctaLabel: 'Open incident dashboard',
        ctaUrl: `${appUrl}/home`,
        preheader: alert.message,
        subject: `[${DEFAULT_BRAND_NAME}] ${alert.message}`,
        summary:
          'We could not reach this monitor during the latest health check. The service may be unavailable for users right now.',
        templateId,
        text: [
          `${DEFAULT_BRAND_NAME} outage alert`,
          '',
          `Monitor: ${monitor.name}`,
          `URL: ${monitor.url}`,
          `Severity: ${alert.severity.toUpperCase()}`,
          `Triggered: ${formatDateTime(alert.createdAt)}`,
          `Open dashboard: ${appUrl}/home`,
        ].join('\n'),
        tone: {
          accent: '#c24735',
          soft: '#fff0ea',
          badge: 'Outage detected',
        },
        title: alert.message,
      });

    case 'monitor-recovered':
      return createEmail({
        body: sharedFields,
        ctaLabel: 'Review service timeline',
        ctaUrl: `${appUrl}/home`,
        preheader: `${monitor.name} is back online`,
        subject: `[${DEFAULT_BRAND_NAME}] ${alert.message}`,
        summary:
          'The latest health check succeeded and the monitor is responding again. This is a good moment to review the incident timeline and confirm stability.',
        templateId,
        text: [
          `${DEFAULT_BRAND_NAME} recovery alert`,
          '',
          `Monitor: ${monitor.name}`,
          `URL: ${monitor.url}`,
          `Recovered: ${formatDateTime(alert.createdAt)}`,
          `Open dashboard: ${appUrl}/home`,
        ].join('\n'),
        tone: {
          accent: '#1f8f5f',
          soft: '#eefaf4',
          badge: 'Service recovered',
        },
        title: `${monitor.name} is back online`,
      });

    case 'ssl-expiring':
      return createEmail({
        body:
          sharedFields +
          metricRow(
            'SSL expiry',
            monitor.sslExpiryDate ? formatDateTime(monitor.sslExpiryDate) : 'Not available',
          ),
        ctaLabel: 'Review certificate details',
        ctaUrl: `${appUrl}/home`,
        preheader: alert.message,
        subject: `[${DEFAULT_BRAND_NAME}] ${alert.message}`,
        summary:
          'This SSL certificate is approaching its expiry date. Renew it before the deadline to avoid browser warnings or downtime.',
        templateId,
        text: [
          `${DEFAULT_BRAND_NAME} SSL expiry warning`,
          '',
          `Monitor: ${monitor.name}`,
          `SSL expiry: ${
            monitor.sslExpiryDate ? formatDateTime(monitor.sslExpiryDate) : 'Not available'
          }`,
          `Triggered: ${formatDateTime(alert.createdAt)}`,
          `Open dashboard: ${appUrl}/home`,
        ].join('\n'),
        tone: {
          accent: '#c9831a',
          soft: '#fff6e8',
          badge: 'SSL reminder',
        },
        title: alert.message,
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

  return createEmail({
    body: [
      metricRow('Workspace', input.teamName),
      metricRow('Invited by', input.inviterName),
      metricRow('Recipient', input.recipientEmail),
    ].join(''),
    ctaLabel: 'Accept invite',
    ctaUrl: input.acceptUrl,
    preheader: `${input.inviterName} invited you to join ${input.teamName}`,
    subject: `[${brandName}] Join ${input.teamName}`,
    summary: `${input.inviterName} invited you to join the ${input.teamName} workspace so you can help manage monitors and incidents together.`,
    templateId: 'team-invite',
    text: [
      `${input.inviterName} invited you to join ${input.teamName} on ${brandName}.`,
      '',
      `Accept invite: ${input.acceptUrl}`,
      `Recipient: ${input.recipientEmail}`,
    ].join('\n'),
    tone: {
      accent: '#142033',
      soft: '#eef2f8',
      badge: 'Workspace invite',
    },
    title: `Join ${input.teamName}`,
  });
}

export function buildWeeklyUptimeReportEmail(
  input: WeeklyUptimeReportInput,
): AlertEmailContent {
  const appUrl = input.appUrl ?? getAppUrl();
  const brandName = input.brandName ?? DEFAULT_BRAND_NAME;

  return createEmail({
    body:
      [
        metricRow('Report period', input.reportPeriodLabel),
        metricRow('Team', input.teamName),
        metricRow('Monitors checked', String(input.monitorsChecked)),
        metricRow('Healthy monitors', String(input.healthyMonitors)),
        metricRow('Average uptime', input.uptimeAverage),
        metricRow('Average response time', input.averageResponseTime),
      ].join('') +
      sectionBlock(
        'Incident highlights',
        `<ul style="margin:0;padding-left:18px;color:#52606d;font-size:14px;line-height:1.7;">${input.incidentsSummary
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`,
      ),
    ctaLabel: 'Open uptime dashboard',
    ctaUrl: `${appUrl}/home`,
    preheader: `Weekly uptime report for ${input.teamName}`,
    subject: `[${brandName}] Weekly uptime report for ${input.teamName}`,
    summary:
      'Here is your latest reliability snapshot across all active monitors, including uptime trends and incident notes worth revisiting.',
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
    tone: {
      accent: '#142033',
      soft: '#eef2f8',
      badge: 'Weekly report',
    },
    title: `Weekly uptime report for ${input.teamName}`,
  });
}

function createEmail(input: {
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  preheader: string;
  subject: string;
  summary: string;
  templateId: EmailTemplateId;
  text: string;
  title: string;
  tone: {
    accent: string;
    badge: string;
    soft: string;
  };
}): AlertEmailContent {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(input.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f2f3f7;font-family:Arial,Helvetica,sans-serif;color:#17202a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f2f3f7;">
      <tr>
        <td align="center" style="padding:24px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 14px;font-size:14px;color:#5b6672;font-weight:700;">
                ${escapeHtml(DEFAULT_BRAND_NAME)}
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e6e9f0;">
                <div style="background:linear-gradient(135deg,#17202a 0%,#243447 100%);padding:28px;">
                  <span style="display:inline-block;background:${escapeHtml(
                    input.tone.soft,
                  )};color:${escapeHtml(
                    input.tone.accent,
                  )};padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(
                    input.tone.badge,
                  )}</span>
                  <h1 style="margin:18px 0 12px;font-size:30px;line-height:1.15;color:#ffffff;">${escapeHtml(
                    input.title,
                  )}</h1>
                  <p style="margin:0;font-size:15px;line-height:1.75;color:#dbe4ee;">${escapeHtml(
                    input.summary,
                  )}</p>
                </div>
                <div style="padding:28px;">
                  ${input.body}
                  <div style="padding-top:20px;">
                    <a href="${escapeAttribute(
                      input.ctaUrl,
                    )}" style="display:inline-block;background:${escapeHtml(
                      input.tone.accent,
                    )};color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:700;">${escapeHtml(
                      input.ctaLabel,
                    )}</a>
                  </div>
                  <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#6b7785;">
                    You are receiving this email because this monitor is connected to an active email notification channel.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    attachments: [],
    html,
    subject: input.subject,
    templateId: input.templateId,
    text: input.text,
  };
}

function metricRow(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fcfdfd;border:1px solid #edf0f4;border-radius:18px;margin-bottom:12px;"><tr><td style="padding:16px 18px;color:#607080;">${escapeHtml(
    label,
  )}</td><td align="right" style="padding:16px 18px;color:#17202a;font-weight:700;">${escapeHtml(
    value,
  )}</td></tr></table>`;
}

function sectionBlock(title: string, body: string): string {
  return `<div style="background:#fcfdfd;border:1px solid #edf0f4;border-radius:18px;padding:18px;margin-top:12px;"><div style="padding-bottom:10px;font-size:15px;font-weight:700;color:#17202a;">${escapeHtml(
    title,
  )}</div>${body}</div>`;
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

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
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

function escapeHtml(value: unknown): string {
  const normalized = value == null ? '' : String(value);

  return normalized
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value: unknown): string {
  return escapeHtml(value);
}

function assertNever(value: never): never {
  throw new Error(`Unsupported email template: ${value}`);
}
