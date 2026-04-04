export type MonitorType = 'http' | 'https' | 'tcp' | 'ping';

export type MonitorStatus = 'up' | 'down' | 'pending' | 'paused';

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
