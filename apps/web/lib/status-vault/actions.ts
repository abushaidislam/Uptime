'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import type { Json } from '~/lib/database.types';
import type {
  Monitor,
  Incident,
  Alert,
  HealthCheck,
  AnalyticsSummary,
  MonitorAnalytics,
  MonitorType,
  IncidentStatus,
  AlertSeverity,
  IncidentUpdate,
  NotificationChannel,
  StatusPage,
} from '~/lib/status-vault/types';

// Helper to convert DB snake_case to camelCase
function toMonitor(row: Record<string, unknown>): Monitor {
  return {
    id: row.id as string,
    name: row.name as string,
    url: row.url as string,
    type: row.type as MonitorType,
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
  } as Monitor;
}

function toIncident(row: Record<string, unknown>, updates: IncidentUpdate[] = []): Incident {
  return {
    id: row.id as string,
    monitorId: row.monitor_id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    status: row.status as IncidentStatus,
    severity: row.severity as AlertSeverity,
    startedAt: row.started_at as string,
    resolvedAt: row.resolved_at as string | undefined,
    acknowledgedAt: row.acknowledged_at as string | undefined,
    acknowledgedBy: row.acknowledged_by as string | undefined,
    rootCause: row.root_cause as string | undefined,
    affectedMonitors: (row.affected_monitors as string[]) || [],
    updates,
  };
}

function toAlert(row: Record<string, unknown>): Alert {
  return {
    id: row.id as string,
    monitorId: row.monitor_id as string,
    incidentId: row.incident_id as string | undefined,
    type: row.type as Alert['type'],
    severity: row.severity as AlertSeverity,
    status: row.status as Alert['status'],
    message: row.message as string,
    createdAt: row.created_at as string,
    acknowledgedAt: row.acknowledged_at as string | undefined,
    acknowledgedBy: row.acknowledged_by as string | undefined,
    resolvedAt: row.resolved_at as string | undefined,
  };
}

function toHealthCheck(row: Record<string, unknown>): HealthCheck {
  return {
    id: row.id as string,
    monitorId: row.monitor_id as string,
    status: row.status as 'up' | 'down',
    responseTime: row.response_time as number,
    statusCode: row.status_code as number | undefined,
    timestamp: row.timestamp as string,
    error: row.error as string | undefined,
    location: row.location as string,
  };
}

function toIncidentUpdate(row: Record<string, unknown>): IncidentUpdate {
  return {
    id: row.id as string,
    incidentId: row.incident_id as string,
    message: row.message as string,
    status: row.status as IncidentStatus,
    createdAt: row.created_at as string,
    createdBy: row.created_by as string,
  };
}

function toNotificationChannel(row: Record<string, unknown>): NotificationChannel {
  return {
    id: row.id as string,
    type: row.type as NotificationChannel['type'],
    name: row.name as string,
    enabled: (row.enabled as boolean | null) ?? true,
    config: row.config as NotificationChannel['config'],
    createdAt: row.created_at as string,
  };
}

function toStatusPage(row: Record<string, unknown>): StatusPage {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string | undefined,
    logoUrl: row.logo_url as string | undefined,
    isPublic: row.is_public as boolean,
    customDomain: row.custom_domain as string | undefined,
    selectedMonitors: (row.selected_monitors as string[]) || [],
    incidentHistoryDays: row.incident_history_days as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function getOwnedTeamId(
  client: any,
  userId: string | undefined,
): Promise<string | undefined> {
  if (!userId) {
    return undefined;
  }

  const { data, error } = await client
    .from('teams')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (error || !data) {
    return undefined;
  }

  return data.id as string;
}

// Monitor Actions
export async function getMonitors(): Promise<Monitor[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('monitors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toMonitor);
}

export async function getMonitor(id: string): Promise<Monitor | undefined> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('monitors')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return toMonitor(data);
}

export async function createMonitor(data: {
  name: string;
  url: string;
  type: MonitorType;
  interval: number;
  timeout: number;
  expectedStatus?: number;
}): Promise<Monitor> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  
  const { data: monitor, error } = await client
    .from('monitors')
    .insert({
      name: data.name,
      url: data.url,
      type: data.type,
      interval: data.interval,
      timeout: data.timeout,
      expected_status: data.expectedStatus,
      status: 'pending',
      user_id: user?.id || 'unknown',
      uptime_24h: 100,
      uptime_7d: 100,
      uptime_30d: 100,
      notifications_enabled: true,
      notification_channels: [],
    })
    .select()
    .single();

  if (error) throw error;
  return toMonitor(monitor);
}

export async function updateMonitor(
  id: string,
  data: Partial<Monitor>
): Promise<Monitor | undefined> {
  const client = getSupabaseServerClient();
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.interval !== undefined) updateData.interval = data.interval;
  if (data.timeout !== undefined) updateData.timeout = data.timeout;
  if (data.expectedStatus !== undefined) updateData.expected_status = data.expectedStatus;
  if (data.lastCheckedAt !== undefined) updateData.last_checked_at = data.lastCheckedAt;
  if (data.lastResponseTime !== undefined) updateData.last_response_time = data.lastResponseTime;
  if (data.uptime24h !== undefined) updateData.uptime_24h = data.uptime24h;
  if (data.uptime7d !== undefined) updateData.uptime_7d = data.uptime7d;
  if (data.uptime30d !== undefined) updateData.uptime_30d = data.uptime30d;
  if (data.sslExpiryDate !== undefined) updateData.ssl_expiry_date = data.sslExpiryDate;
  if (data.notificationsEnabled !== undefined) updateData.notifications_enabled = data.notificationsEnabled;
  if (data.notificationChannels !== undefined) updateData.notification_channels = data.notificationChannels;
  updateData.updated_at = new Date().toISOString();

  const { data: monitor, error } = await client
    .from('monitors')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !monitor) return undefined;
  return toMonitor(monitor);
}

export async function deleteMonitor(id: string): Promise<boolean> {
  const client = getSupabaseServerClient();
  const { error } = await client
    .from('monitors')
    .delete()
    .eq('id', id);

  return !error;
}

export async function toggleMonitorStatus(id: string): Promise<Monitor | undefined> {
  const monitor = await getMonitor(id);
  if (!monitor) return undefined;
  
  const newStatus = monitor.status === 'paused' ? 'up' : 'paused';
  return updateMonitor(id, { status: newStatus });
}

// Health Check Actions
export async function getHealthChecks(
  monitorId: string,
  limit: number = 50
): Promise<HealthCheck[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('health_checks')
    .select('*')
    .eq('monitor_id', monitorId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(toHealthCheck);
}

export async function createHealthCheck(data: {
  monitorId: string;
  status: 'up' | 'down';
  responseTime: number;
  statusCode?: number;
  error?: string;
  location?: string;
}): Promise<HealthCheck> {
  const client = getSupabaseServerClient();
  const { data: healthCheck, error } = await client
    .from('health_checks')
    .insert({
      monitor_id: data.monitorId,
      status: data.status,
      response_time: data.responseTime,
      status_code: data.statusCode,
      error: data.error,
      location: data.location || 'default',
    })
    .select()
    .single();

  if (error) throw error;
  return toHealthCheck(healthCheck);
}

// Incident Actions
export async function getIncidents(): Promise<Incident[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('incidents')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) throw error;

  const incidents = await Promise.all(
    (data || []).map(async (row) => {
      const { data: updates } = await client
        .from('incident_updates')
        .select('*')
        .eq('incident_id', row.id)
        .order('created_at', { ascending: true });
      return toIncident(row, (updates || []).map(toIncidentUpdate));
    })
  );

  return incidents;
}

export async function getIncident(id: string): Promise<Incident | undefined> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;

  const { data: updates } = await client
    .from('incident_updates')
    .select('*')
    .eq('incident_id', id)
    .order('created_at', { ascending: true });

  return toIncident(data, (updates || []).map(toIncidentUpdate));
}

export async function createIncident(data: {
  monitorId: string;
  title: string;
  description?: string;
  severity: AlertSeverity;
  affectedMonitors?: string[];
}): Promise<Incident> {
  const client = getSupabaseServerClient();
  const { data: incident, error } = await client
    .from('incidents')
    .insert({
      monitor_id: data.monitorId,
      title: data.title,
      description: data.description,
      status: 'investigating',
      severity: data.severity,
      started_at: new Date().toISOString(),
      affected_monitors: data.affectedMonitors || [data.monitorId],
    })
    .select()
    .single();

  if (error) throw error;
  return toIncident(incident);
}

export async function updateIncident(
  id: string,
  data: Partial<Incident>
): Promise<Incident | undefined> {
  const client = getSupabaseServerClient();

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.severity !== undefined) updateData.severity = data.severity;
  if (data.resolvedAt !== undefined) updateData.resolved_at = data.resolvedAt;
  if (data.acknowledgedAt !== undefined) updateData.acknowledged_at = data.acknowledgedAt;
  if (data.acknowledgedBy !== undefined) updateData.acknowledged_by = data.acknowledgedBy;
  if (data.rootCause !== undefined) updateData.root_cause = data.rootCause;
  if (data.affectedMonitors !== undefined) updateData.affected_monitors = data.affectedMonitors;

  const { data: incident, error } = await client
    .from('incidents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !incident) return undefined;
  return toIncident(incident);
}

export async function resolveIncident(id: string): Promise<Incident | undefined> {
  return updateIncident(id, {
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
  });
}

export async function acknowledgeIncident(id: string): Promise<Incident | undefined> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  
  return updateIncident(id, {
    status: 'identified',
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: user?.id || 'unknown',
  });
}

export async function addIncidentUpdate(
  incidentId: string,
  message: string,
  status: IncidentStatus
): Promise<Incident | undefined> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();

  const { error } = await client
    .from('incident_updates')
    .insert({
      incident_id: incidentId,
      message,
      status,
      created_by: user?.id || 'unknown',
    });

  if (error) return undefined;

  await client
    .from('incidents')
    .update({ status })
    .eq('id', incidentId);

  return getIncident(incidentId);
}

// Alert Actions
export async function getAlerts(): Promise<Alert[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toAlert);
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('alerts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return toAlert(data);
}

export async function createAlert(data: {
  monitorId: string;
  incidentId?: string;
  type: Alert['type'];
  severity: AlertSeverity;
  message: string;
}): Promise<Alert> {
  const client = getSupabaseServerClient();
  const { data: alert, error } = await client
    .from('alerts')
    .insert({
      monitor_id: data.monitorId,
      incident_id: data.incidentId,
      type: data.type,
      severity: data.severity,
      status: 'active',
      message: data.message,
    })
    .select()
    .single();

  if (error) throw error;
  return toAlert(alert);
}

export async function acknowledgeAlert(id: string): Promise<Alert | undefined> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();

  const { data: alert, error } = await client
    .from('alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user?.id || 'unknown',
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !alert) return undefined;
  return toAlert(alert);
}

export async function resolveAlert(id: string): Promise<Alert | undefined> {
  const { data: alert, error } = await getSupabaseServerClient()
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !alert) return undefined;
  return toAlert(alert);
}

// Analytics Actions
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const client = getSupabaseServerClient();
  
  const { data: monitors, error: monitorsError } = await client
    .from('monitors')
    .select('status,last_response_time,uptime_24h,ssl_expiry_date');

  if (monitorsError) throw monitorsError;

  const { data: incidents, error: incidentsError } = await client
    .from('incidents')
    .select('*')
    .in('status', ['investigating', 'identified', 'monitoring']);

  if (incidentsError) throw incidentsError;

  const totalMonitors = monitors?.length || 0;
  const upMonitors = monitors?.filter(m => m.status === 'up').length || 0;
  const downMonitors = monitors?.filter(m => m.status === 'down').length || 0;
  const pausedMonitors = monitors?.filter(m => m.status === 'paused').length || 0;
  
  const activeIncidents = incidents?.length || 0;
  
  const avgResponseTime = monitors?.length 
    ? Math.round(monitors.reduce((sum, m) => sum + (m.last_response_time || 0), 0) / monitors.length)
    : 0;
  
  const uptimePercentage = totalMonitors 
    ? Math.round((upMonitors / totalMonitors) * 100)
    : 100;

  const sslExpiringSoon = monitors?.filter(m => {
    if (!m.ssl_expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(m.ssl_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length || 0;

  return {
    totalMonitors,
    upMonitors,
    downMonitors,
    pausedMonitors,
    activeIncidents,
    avgResponseTime,
    uptimePercentage,
    sslExpiringSoon,
  };
}

export async function getMonitorAnalytics(monitorId: string): Promise<MonitorAnalytics | undefined> {
  const monitor = await getMonitor(monitorId);
  if (!monitor) return undefined;

  const healthChecks = await getHealthChecks(monitorId, 100);

  const responseTimeData = healthChecks.map(hc => ({
    timestamp: hc.timestamp,
    value: hc.responseTime,
  }));

  const statusHistory = healthChecks.map(hc => ({
    timestamp: hc.timestamp,
    status: hc.status,
  }));

  const avgResponseTime = healthChecks.length
    ? Math.round(healthChecks.reduce((sum, hc) => sum + hc.responseTime, 0) / healthChecks.length)
    : 0;

  return {
    monitorId,
    uptime24h: monitor.uptime24h,
    uptime7d: monitor.uptime7d,
    uptime30d: monitor.uptime30d,
    avgResponseTime,
    responseTimeData,
    statusHistory,
  };
}

// Bulk Actions
export async function acknowledgeAllAlerts(): Promise<void> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();

  await client
    .from('alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user?.id || 'unknown',
    })
    .eq('status', 'active');
}

export async function resolveAllAlerts(): Promise<void> {
  await getSupabaseServerClient()
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .neq('status', 'resolved');
}

// Notification Channel Actions
export async function getNotificationChannels(): Promise<NotificationChannel[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('notification_channels')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toNotificationChannel);
}

export async function getNotificationChannel(id: string): Promise<NotificationChannel | undefined> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('notification_channels')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return toNotificationChannel(data);
}

export async function createNotificationChannel(data: {
  type: NotificationChannel['type'];
  name: string;
  config: NotificationChannel['config'];
}): Promise<NotificationChannel> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const teamId = await getOwnedTeamId(client, user?.id);

  if (!teamId) {
    throw new Error('No owned team found for the current user.');
  }
  
  const { data: channel, error } = await client
    .from('notification_channels')
    .insert({
      team_id: teamId,
      type: data.type,
      name: data.name,
      enabled: true,
      config: data.config as unknown as Json,
    })
    .select()
    .single();

  if (error) throw error;
  return toNotificationChannel(channel);
}

export async function updateNotificationChannel(
  id: string,
  data: Partial<NotificationChannel>
): Promise<NotificationChannel | undefined> {
  const client = getSupabaseServerClient();
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.config !== undefined) updateData.config = data.config;
  
  const { data: channel, error } = await client
    .from('notification_channels')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !channel) return undefined;
  return toNotificationChannel(channel);
}

export async function toggleNotificationChannel(id: string): Promise<NotificationChannel | undefined> {
  const channel = await getNotificationChannel(id);
  if (!channel) return undefined;
  
  return updateNotificationChannel(id, { enabled: !channel.enabled });
}

export async function deleteNotificationChannel(id: string): Promise<boolean> {
  const client = getSupabaseServerClient();
  const { error } = await client
    .from('notification_channels')
    .delete()
    .eq('id', id);

  return !error;
}

// Status Page Actions
export async function getStatusPage(): Promise<StatusPage | undefined> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const teamId = await getOwnedTeamId(client, user?.id);

  if (!teamId) {
    return undefined;
  }
  
  const { data, error } = await client
    .from('status_pages')
    .select('*')
    .eq('team_id', teamId)
    .single();

  if (error || !data) return undefined;
  return toStatusPage(data);
}

export async function upsertStatusPage(data: {
  title: string;
  description?: string;
  logoUrl?: string;
  isPublic: boolean;
  customDomain?: string;
  selectedMonitors: string[];
  incidentHistoryDays: number;
}): Promise<StatusPage> {
  const client = getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const teamId = await getOwnedTeamId(client, user?.id);

  if (!teamId) {
    throw new Error('No owned team found for the current user.');
  }
  
  // Check if status page exists
  const existing = await getStatusPage();
  
  if (existing) {
    const { data: statusPage, error } = await client
      .from('status_pages')
      .update({
        title: data.title,
        description: data.description,
        logo_url: data.logoUrl,
        is_public: data.isPublic,
        custom_domain: data.customDomain,
        selected_monitors: data.selectedMonitors,
        incident_history_days: data.incidentHistoryDays,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return toStatusPage(statusPage);
  } else {
    const slug = `status-${Date.now()}`;
    const { data: statusPage, error } = await client
      .from('status_pages')
      .insert({
        team_id: teamId,
        slug,
        title: data.title,
        description: data.description,
        logo_url: data.logoUrl,
        is_public: data.isPublic,
        custom_domain: data.customDomain,
        selected_monitors: data.selectedMonitors,
        incident_history_days: data.incidentHistoryDays || 30,
      })
      .select()
      .single();
    
    if (error) throw error;
    return toStatusPage(statusPage);
  }
}

// Public Status Page (no auth required)
export async function getPublicStatusPage(): Promise<StatusPage | undefined> {
  const client = getSupabaseServerClient();
  
  const { data, error } = await client
    .from('status_pages')
    .select('*')
    .eq('is_public', true)
    .single();

  if (error || !data) return undefined;
  return toStatusPage(data);
}

export async function getPublicMonitorsForStatusPage(): Promise<Monitor[]> {
  const statusPage = await getPublicStatusPage();
  if (!statusPage || !statusPage.selectedMonitors?.length) return [];
  
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('monitors')
    .select('*')
    .in('id', statusPage.selectedMonitors)
    .neq('status', 'paused')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toMonitor);
}
