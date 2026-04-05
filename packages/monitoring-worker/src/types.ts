export type MonitorType = 'http' | 'https' | 'tcp' | 'ping';

export type MonitorStatus = 'up' | 'down' | 'pending' | 'paused';

export type NotificationChannelType = 'email' | 'slack' | 'webhook' | 'sms';

export type AlertType = 'down' | 'up' | 'ssl_expiring' | 'performance';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface NotificationChannel {
  id: string;
  type: NotificationChannelType;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface Alert {
  id: string;
  monitorId: string;
  incidentId?: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  interval: number;
  timeout: number;
  expectedStatus?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  teamId?: string;
  lastCheckedAt?: string;
  lastResponseTime?: number;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  sslExpiryDate?: string;
  notificationsEnabled: boolean;
  notificationChannels: unknown[];
}

export interface HealthCheckResult {
  status: 'up' | 'down';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
  location: string;
}

export interface SSLInfo {
  valid: boolean;
  expiryDate?: string;
  daysUntilExpiry?: number;
  issuer?: string;
  error?: string;
}
