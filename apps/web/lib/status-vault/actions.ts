'use server';

import { mockDataStore } from '~/lib/status-vault/mock-data';
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
} from '~/lib/status-vault/types';

// Monitor Actions
export async function getMonitors(): Promise<Monitor[]> {
  return mockDataStore.getMonitors();
}

export async function getMonitor(id: string): Promise<Monitor | undefined> {
  return mockDataStore.getMonitor(id);
}

export async function createMonitor(data: {
  name: string;
  url: string;
  type: MonitorType;
  interval: number;
  timeout: number;
  expectedStatus?: number;
}): Promise<Monitor> {
  return mockDataStore.createMonitor({
    ...data,
    status: 'pending',
    userId: 'demo-user-123',
    uptime24h: 100,
    uptime7d: 100,
    uptime30d: 100,
    notificationsEnabled: true,
    notificationChannels: [],
  });
}

export async function updateMonitor(
  id: string,
  data: Partial<Monitor>
): Promise<Monitor | undefined> {
  return mockDataStore.updateMonitor(id, data);
}

export async function deleteMonitor(id: string): Promise<boolean> {
  return mockDataStore.deleteMonitor(id);
}

export async function toggleMonitorStatus(id: string): Promise<Monitor | undefined> {
  const monitor = mockDataStore.getMonitor(id);
  if (!monitor) return undefined;
  
  const newStatus = monitor.status === 'paused' ? 'up' : 'paused';
  return mockDataStore.updateMonitor(id, { status: newStatus });
}

// Health Check Actions
export async function getHealthChecks(
  monitorId: string,
  limit?: number
): Promise<HealthCheck[]> {
  return mockDataStore.getHealthChecks(monitorId, limit);
}

// Incident Actions
export async function getIncidents(): Promise<Incident[]> {
  return mockDataStore.getIncidents();
}

export async function getIncident(id: string): Promise<Incident | undefined> {
  return mockDataStore.getIncident(id);
}

export async function createIncident(data: {
  monitorId: string;
  title: string;
  description?: string;
  severity: AlertSeverity;
  affectedMonitors?: string[];
}): Promise<Incident> {
  return mockDataStore.createIncident({
    ...data,
    status: 'investigating',
    startedAt: new Date().toISOString(),
    updates: [],
    affectedMonitors: data.affectedMonitors || [data.monitorId],
  });
}

export async function updateIncident(
  id: string,
  data: Partial<Incident>
): Promise<Incident | undefined> {
  return mockDataStore.updateIncident(id, data);
}

export async function resolveIncident(id: string): Promise<Incident | undefined> {
  return mockDataStore.updateIncident(id, {
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
  });
}

export async function acknowledgeIncident(id: string): Promise<Incident | undefined> {
  return mockDataStore.updateIncident(id, {
    status: 'identified',
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: 'demo-user-123',
  });
}

export async function addIncidentUpdate(
  incidentId: string,
  message: string,
  status: IncidentStatus
): Promise<Incident | undefined> {
  const incident = mockDataStore.getIncident(incidentId);
  if (!incident) return undefined;

  const newUpdate = {
    id: Math.random().toString(36).substring(2, 15),
    incidentId,
    message,
    status,
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-123',
  };

  return mockDataStore.updateIncident(incidentId, {
    updates: [...incident.updates, newUpdate],
    status,
  });
}

// Alert Actions
export async function getAlerts(): Promise<Alert[]> {
  return mockDataStore.getAlerts();
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  return mockDataStore.getAlert(id);
}

export async function acknowledgeAlert(id: string): Promise<Alert | undefined> {
  return mockDataStore.updateAlert(id, {
    status: 'acknowledged',
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: 'demo-user-123',
  });
}

export async function resolveAlert(id: string): Promise<Alert | undefined> {
  return mockDataStore.updateAlert(id, {
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
  });
}

// Analytics Actions
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return mockDataStore.getAnalyticsSummary();
}

export async function getMonitorAnalytics(monitorId: string): Promise<MonitorAnalytics | undefined> {
  return mockDataStore.getMonitorAnalytics(monitorId);
}

// Bulk Actions
export async function acknowledgeAllAlerts(): Promise<void> {
  const alerts = mockDataStore.getAlerts().filter(a => a.status === 'active');
  for (const alert of alerts) {
    await acknowledgeAlert(alert.id);
  }
}

export async function resolveAllAlerts(): Promise<void> {
  const alerts = mockDataStore.getAlerts().filter(a => a.status !== 'resolved');
  for (const alert of alerts) {
    await resolveAlert(alert.id);
  }
}
