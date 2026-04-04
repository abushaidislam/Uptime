export type MonitorType = 'http' | 'https' | 'tcp' | 'ping';
export type MonitorStatus = 'up' | 'down' | 'paused' | 'pending';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  interval: number; // seconds
  timeout: number; // seconds
  expectedStatus?: number; // for HTTP monitors
  createdAt: string;
  updatedAt: string;
  userId: string;
  teamId?: string;
  lastCheckedAt?: string;
  lastResponseTime?: number; // ms
  uptime24h: number; // percentage
  uptime7d: number; // percentage
  uptime30d: number; // percentage
  sslExpiryDate?: string;
  notificationsEnabled: boolean;
  notificationChannels: NotificationChannel[];
}

export interface HealthCheck {
  id: string;
  monitorId: string;
  status: 'up' | 'down';
  responseTime: number; // ms
  statusCode?: number;
  timestamp: string;
  error?: string;
  location: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  title: string;
  description?: string;
  status: IncidentStatus;
  severity: AlertSeverity;
  startedAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  rootCause?: string;
  updates: IncidentUpdate[];
  affectedMonitors: string[];
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  status: IncidentStatus;
  createdAt: string;
  createdBy: string;
}

export interface Alert {
  id: string;
  monitorId: string;
  incidentId?: string;
  type: 'down' | 'up' | 'ssl_expiring' | 'performance';
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export type NotificationChannelType = 'email' | 'slack' | 'webhook' | 'sms';

export interface NotificationChannel {
  id: string;
  type: NotificationChannelType;
  name: string;
  enabled: boolean;
  config: EmailConfig | SlackConfig | WebhookConfig | SmsConfig;
}

export interface EmailConfig {
  recipients: string[];
}

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
}

export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface SmsConfig {
  phoneNumbers: string[];
  provider: 'twilio';
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  email: string;
  name?: string;
}

export interface StatusPage {
  id: string;
  teamId: string;
  slug: string;
  title: string;
  description?: string;
  logoUrl?: string;
  isPublic: boolean;
  customDomain?: string;
  selectedMonitors: string[];
  incidentHistoryDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  pausedMonitors: number;
  activeIncidents: number;
  avgResponseTime: number;
  uptimePercentage: number;
  sslExpiringSoon: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface MonitorAnalytics {
  monitorId: string;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  avgResponseTime: number;
  responseTimeData: TimeSeriesData[];
  statusHistory: { timestamp: string; status: 'up' | 'down' }[];
}
