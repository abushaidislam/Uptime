import type { SupabaseClient } from '@supabase/supabase-js';

import { HttpChecker } from './checkers/http-checker.js';
import { SslChecker } from './checkers/ssl-checker.js';
import { TcpChecker } from './checkers/tcp-checker.js';
import { dispatchAlertNotifications } from './alert-delivery.js';
import type { Alert, HealthCheckResult, Monitor } from './types.js';

const httpChecker = new HttpChecker();
const tcpChecker = new TcpChecker();
const sslChecker = new SslChecker();

export interface MonitorRunResult {
  monitorId: string;
  monitorName: string;
  status: HealthCheckResult['status'];
  responseTime: number;
  statusCode?: number;
  error?: string;
}

function toAlert(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    monitorId: row.monitor_id as string,
    incidentId: row.incident_id as string | undefined,
    type: row.type as Alert['type'],
    severity: row.severity as Alert['severity'],
    status: row.status as Alert['status'],
    message: row.message as string,
    createdAt: row.created_at as string,
    acknowledgedAt: row.acknowledged_at as string | undefined,
    acknowledgedBy: row.acknowledged_by as string | undefined,
    resolvedAt: row.resolved_at as string | undefined,
  };
}

export function toMonitor(row: Record<string, unknown>): Monitor {
  return {
    id: row.id as string,
    name: row.name as string,
    url: row.url as string,
    type: row.type as Monitor['type'],
    status: row.status as Monitor['status'],
    interval: row.interval as number,
    timeout: row.timeout as number,
    expectedStatus: row.expected_status as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
    teamId: row.team_id as string | undefined,
    lastCheckedAt: row.last_checked_at as string | undefined,
    lastResponseTime: row.last_response_time as number | undefined,
    uptime24h: Number(row.uptime_24h) || 100,
    uptime7d: Number(row.uptime_7d) || 100,
    uptime30d: Number(row.uptime_30d) || 100,
    sslExpiryDate: row.ssl_expiry_date as string | undefined,
    notificationsEnabled: row.notifications_enabled as boolean,
    notificationChannels: (row.notification_channels as unknown[]) || [],
  };
}

export async function loadActiveMonitors(
  supabase: SupabaseClient,
): Promise<Monitor[]> {
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .neq('status', 'paused');

  if (error) {
    throw error;
  }

  return (data || []).map((row) => toMonitor(row as Record<string, unknown>));
}

export function isMonitorDue(
  monitor: Monitor,
  now: Date = new Date(),
): boolean {
  if (monitor.status === 'paused') {
    return false;
  }

  if (!monitor.lastCheckedAt) {
    return true;
  }

  const lastCheckedAt = new Date(monitor.lastCheckedAt);

  if (Number.isNaN(lastCheckedAt.getTime())) {
    return true;
  }

  const effectiveIntervalSeconds = Math.max(60, monitor.interval);
  const elapsedMs = now.getTime() - lastCheckedAt.getTime();

  return elapsedMs >= effectiveIntervalSeconds * 1000;
}

export function getDueMonitors(
  monitors: Monitor[],
  now: Date = new Date(),
): Monitor[] {
  return monitors.filter((monitor) => isMonitorDue(monitor, now));
}

export async function runMonitorCheck(
  supabase: SupabaseClient,
  monitor: Monitor,
): Promise<MonitorRunResult> {
  console.log(
    `[${new Date().toISOString()}] Checking monitor: ${monitor.name} (${monitor.url})`,
  );

  const result = await performHealthCheck(monitor);
  const sslExpiryDate = await maybeCheckSsl(monitor);

  await saveHealthCheck(supabase, monitor.id, result);
  await updateMonitorStatus(supabase, monitor, result, sslExpiryDate);

  // Handle status transitions
  if (result.status === 'down' && monitor.status !== 'down') {
    await createIncident(supabase, monitor, result);
  } else if (result.status === 'up' && monitor.status === 'down') {
    // Monitor recovered - create recovery alert and optionally resolve incident
    await handleMonitorRecovery(supabase, monitor);
  }

  // Check for SSL expiry alert
  if (sslExpiryDate && monitor.notificationsEnabled) {
    const daysUntilExpiry = Math.ceil((new Date(sslExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      await maybeCreateSslExpiryAlert(supabase, monitor, daysUntilExpiry);
    }
  }

  console.log(
    `  Status: ${result.status}, Response: ${result.responseTime}ms${
      result.error ? `, Error: ${result.error}` : ''
    }`,
  );

  return {
    monitorId: monitor.id,
    monitorName: monitor.name,
    status: result.status,
    responseTime: result.responseTime,
    statusCode: result.statusCode,
    error: result.error,
  };
}

async function performHealthCheck(monitor: Monitor): Promise<HealthCheckResult> {
  if (monitor.type === 'http' || monitor.type === 'https') {
    return httpChecker.check(
      monitor.url,
      monitor.timeout,
      monitor.expectedStatus,
    );
  }

  if (monitor.type === 'tcp') {
    return tcpChecker.check(monitor.url, monitor.timeout);
  }

  return httpChecker.check(
    monitor.url,
    monitor.timeout,
    monitor.expectedStatus,
  );
}

async function maybeCheckSsl(
  monitor: Monitor,
): Promise<string | undefined> {
  if (monitor.type !== 'https' && !monitor.url.startsWith('https://')) {
    return undefined;
  }

  try {
    const sslInfo = await sslChecker.check(monitor.url, monitor.timeout);

    if (sslInfo.valid && sslInfo.expiryDate) {
      console.log(`  SSL expires in ${sslInfo.daysUntilExpiry} days`);
      return sslInfo.expiryDate;
    }

    if (sslInfo.error) {
      console.log(`  SSL Error: ${sslInfo.error}`);
    }
  } catch (error) {
    console.error('  SSL check failed:', error);
  }

  return undefined;
}

async function saveHealthCheck(
  supabase: SupabaseClient,
  monitorId: string,
  result: HealthCheckResult,
): Promise<void> {
  const { error } = await supabase.from('health_checks').insert({
    monitor_id: monitorId,
    status: result.status,
    response_time: result.responseTime,
    status_code: result.statusCode,
    error: result.error,
    timestamp: result.timestamp,
    location: result.location,
  });

  if (error) {
    console.error('Failed to save health check:', error);
  }
}

async function updateMonitorStatus(
  supabase: SupabaseClient,
  monitor: Monitor,
  result: HealthCheckResult,
  sslExpiryDate?: string,
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status: result.status,
    last_checked_at: result.timestamp,
    last_response_time: result.responseTime,
    updated_at: new Date().toISOString(),
  };

  if (sslExpiryDate) {
    updateData.ssl_expiry_date = sslExpiryDate;
  }

  if (result.status === 'up') {
    updateData.uptime_24h = Math.min(100, (monitor.uptime24h * 23 + 100) / 24);
    updateData.uptime_7d = Math.min(100, (monitor.uptime7d * 167 + 100) / 168);
    updateData.uptime_30d = Math.min(100, (monitor.uptime30d * 719 + 100) / 720);
  } else {
    updateData.uptime_24h = (monitor.uptime24h * 23) / 24;
    updateData.uptime_7d = (monitor.uptime7d * 167) / 168;
    updateData.uptime_30d = (monitor.uptime30d * 719) / 720;
  }

  const { error } = await supabase
    .from('monitors')
    .update(updateData)
    .eq('id', monitor.id);

  if (error) {
    console.error('Failed to update monitor status:', error);
  }
}

async function createIncident(
  supabase: SupabaseClient,
  monitor: Monitor,
  result: HealthCheckResult,
): Promise<void> {
  const { data: existingIncidents, error: fetchError } = await supabase
    .from('incidents')
    .select('*')
    .eq('monitor_id', monitor.id)
    .in('status', ['investigating', 'identified', 'monitoring']);

  if (fetchError) {
    console.error('Failed to check for existing incidents:', fetchError);
    return;
  }

  if (existingIncidents && existingIncidents.length > 0) {
    console.log(`  Active incident already exists for monitor ${monitor.id}`);
    return;
  }

  const { error } = await supabase.from('incidents').insert({
    monitor_id: monitor.id,
    title: `${monitor.name} is down`,
    description: result.error || `Monitor ${monitor.name} failed health check`,
    status: 'investigating',
    severity: 'critical',
    started_at: new Date().toISOString(),
    affected_monitors: [monitor.id],
  });

  if (error) {
    console.error('Failed to create incident:', error);
    return;
  }

  console.log(`  Created incident for monitor ${monitor.id}`);
  await createAlert(supabase, monitor, result);
}

async function createAlert(
  supabase: SupabaseClient,
  monitor: Monitor,
  result: HealthCheckResult,
): Promise<void> {
  // Rate limiting: Check if an alert was created in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentAlerts, error: checkError } = await supabase
    .from('alerts')
    .select('*')
    .eq('monitor_id', monitor.id)
    .eq('type', 'down')
    .gte('created_at', fiveMinutesAgo)
    .limit(1);

  if (checkError) {
    console.error('Failed to check recent alerts:', checkError);
  }

  if (recentAlerts && recentAlerts.length > 0) {
    console.log(`  Rate limit: Alert already created for monitor ${monitor.id} in last 5 minutes`);
    return;
  }

  const { data: alert, error } = await supabase.from('alerts').insert({
    monitor_id: monitor.id,
    type: 'down',
    severity: 'critical',
    status: 'active',
    message: result.error || `${monitor.name} is down`,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) {
    console.error('Failed to create alert:', error);
    return;
  }

  console.log(`  Created alert for monitor ${monitor.id}`);

  // Dispatch notifications
  if (alert) {
    await dispatchAlertNotifications(
      supabase,
      toAlert(alert as Record<string, unknown>),
      monitor,
    );
  }
}

async function handleMonitorRecovery(
  supabase: SupabaseClient,
  monitor: Monitor,
): Promise<void> {
  // Create recovery alert
  if (monitor.notificationsEnabled) {
    const { data: alert, error: alertError } = await supabase.from('alerts').insert({
      monitor_id: monitor.id,
      type: 'up',
      severity: 'info',
      status: 'active',
      message: `${monitor.name} is back up`,
      created_at: new Date().toISOString(),
    }).select().single();

    if (alertError) {
      console.error('Failed to create recovery alert:', alertError);
    } else {
      console.log(`  Created recovery alert for monitor ${monitor.id}`);
      // Dispatch recovery notification
      if (alert) {
        await dispatchAlertNotifications(
          supabase,
          toAlert(alert as Record<string, unknown>),
          monitor,
        );
      }
    }
  }

  // Add system-generated incident update
  const { data: activeIncidents, error: fetchError } = await supabase
    .from('incidents')
    .select('*')
    .eq('monitor_id', monitor.id)
    .in('status', ['investigating', 'identified', 'monitoring']);

  if (fetchError) {
    console.error('Failed to fetch active incidents:', fetchError);
    return;
  }

  if (activeIncidents && activeIncidents.length > 0) {
    // Add timeline update for recovery
    for (const incident of activeIncidents) {
      const { error: updateError } = await supabase.from('incident_updates').insert({
        incident_id: incident.id,
        message: `Monitor ${monitor.name} has recovered and is now up`,
        status: 'monitoring',
        created_by: monitor.userId,
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error('Failed to create incident update:', updateError);
      } else {
        console.log(`  Added recovery update to incident ${incident.id}`);
      }

      // Note: We don't auto-resolve the incident - manual resolution remains default
      // But we update the incident status to 'monitoring' to indicate recovery
      await supabase
        .from('incidents')
        .update({ status: 'monitoring' })
        .eq('id', incident.id);
    }
  }
}

async function maybeCreateSslExpiryAlert(
  supabase: SupabaseClient,
  monitor: Monitor,
  daysUntilExpiry: number,
): Promise<void> {
  // Check if SSL alert already exists for this monitor in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentAlerts, error: checkError } = await supabase
    .from('alerts')
    .select('*')
    .eq('monitor_id', monitor.id)
    .eq('type', 'ssl_expiring')
    .gte('created_at', oneDayAgo)
    .limit(1);

  if (checkError) {
    console.error('Failed to check recent SSL alerts:', checkError);
    return;
  }

  if (recentAlerts && recentAlerts.length > 0) {
    console.log(`  SSL alert already created for monitor ${monitor.id} in last 24 hours`);
    return;
  }

  const { data: alert, error } = await supabase.from('alerts').insert({
    monitor_id: monitor.id,
    type: 'ssl_expiring',
    severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
    status: 'active',
    message: `SSL certificate for ${monitor.name} expires in ${daysUntilExpiry} days`,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) {
    console.error('Failed to create SSL expiry alert:', error);
    return;
  }

  console.log(`  Created SSL expiry alert for monitor ${monitor.id} (${daysUntilExpiry} days remaining)`);

  if (alert) {
    await dispatchAlertNotifications(
      supabase,
      toAlert(alert as Record<string, unknown>),
      monitor,
    );
  }
}
