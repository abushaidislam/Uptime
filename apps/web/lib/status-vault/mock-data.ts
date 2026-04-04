import type {
  Alert,
  HealthCheck,
  Incident,
  Monitor,
  StatusPage,
  Team,
  NotificationChannel,
  AnalyticsSummary,
  MonitorAnalytics,
} from './types';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock data store
class MockDataStore {
  private monitors: Map<string, Monitor> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private teams: Map<string, Team> = new Map();
  private statusPages: Map<string, StatusPage> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private currentUserId: string = 'demo-user-123';

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo monitors
    const monitors: Monitor[] = [
      {
        id: 'mon-1',
        name: 'API Server',
        url: 'https://api.example.com/health',
        type: 'https',
        status: 'up',
        interval: 60,
        timeout: 30,
        expectedStatus: 200,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        userId: this.currentUserId,
        lastCheckedAt: new Date().toISOString(),
        lastResponseTime: 245,
        uptime24h: 99.98,
        uptime7d: 99.95,
        uptime30d: 99.92,
        sslExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        notificationsEnabled: true,
        notificationChannels: [],
      },
      {
        id: 'mon-2',
        name: 'Website',
        url: 'https://example.com',
        type: 'https',
        status: 'up',
        interval: 120,
        timeout: 30,
        expectedStatus: 200,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        userId: this.currentUserId,
        lastCheckedAt: new Date().toISOString(),
        lastResponseTime: 156,
        uptime24h: 100,
        uptime7d: 99.98,
        uptime30d: 99.95,
        sslExpiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        notificationsEnabled: true,
        notificationChannels: [],
      },
      {
        id: 'mon-3',
        name: 'Database Server',
        url: 'db.example.com:5432',
        type: 'tcp',
        status: 'up',
        interval: 300,
        timeout: 10,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        userId: this.currentUserId,
        lastCheckedAt: new Date().toISOString(),
        lastResponseTime: 12,
        uptime24h: 100,
        uptime7d: 100,
        uptime30d: 99.99,
        notificationsEnabled: true,
        notificationChannels: [],
      },
      {
        id: 'mon-4',
        name: 'CDN Endpoint',
        url: 'https://cdn.example.com',
        type: 'https',
        status: 'down',
        interval: 60,
        timeout: 30,
        expectedStatus: 200,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        userId: this.currentUserId,
        lastCheckedAt: new Date().toISOString(),
        lastResponseTime: 0,
        uptime24h: 95.5,
        uptime7d: 98.2,
        uptime30d: 99.1,
        sslExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        notificationsEnabled: true,
        notificationChannels: [],
      },
      {
        id: 'mon-5',
        name: 'Payment Gateway',
        url: 'https://payments.example.com',
        type: 'https',
        status: 'up',
        interval: 60,
        timeout: 30,
        expectedStatus: 200,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        userId: this.currentUserId,
        lastCheckedAt: new Date().toISOString(),
        lastResponseTime: 523,
        uptime24h: 99.95,
        uptime7d: 99.9,
        uptime30d: 99.85,
        sslExpiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        notificationsEnabled: true,
        notificationChannels: [],
      },
    ];

    monitors.forEach(m => this.monitors.set(m.id, m));

    // Create demo incidents
    const incidents: Incident[] = [
      {
        id: 'inc-1',
        monitorId: 'mon-4',
        title: 'CDN Endpoint Down',
        description: 'CDN endpoint is returning 503 errors',
        status: 'investigating',
        severity: 'critical',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        affectedMonitors: ['mon-4'],
        updates: [
          {
            id: 'upd-1',
            incidentId: 'inc-1',
            message: 'Investigating CDN connectivity issues',
            status: 'investigating',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdBy: this.currentUserId,
          },
        ],
      },
      {
        id: 'inc-2',
        monitorId: 'mon-2',
        title: 'Website Slow Response',
        description: 'Website response time exceeded threshold',
        status: 'resolved',
        severity: 'warning',
        startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        affectedMonitors: ['mon-2'],
        updates: [
          {
            id: 'upd-2',
            incidentId: 'inc-2',
            message: 'Identified database connection pool exhaustion',
            status: 'identified',
            createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
            createdBy: this.currentUserId,
          },
          {
            id: 'upd-3',
            incidentId: 'inc-2',
            message: 'Issue resolved after connection pool adjustment',
            status: 'resolved',
            createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
            createdBy: this.currentUserId,
          },
        ],
      },
    ];

    incidents.forEach(i => this.incidents.set(i.id, i));

    // Create demo alerts
    const alerts: Alert[] = [
      {
        id: 'alert-1',
        monitorId: 'mon-4',
        incidentId: 'inc-1',
        type: 'down',
        severity: 'critical',
        status: 'active',
        message: 'CDN Endpoint is DOWN - HTTP 503 Service Unavailable',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-2',
        monitorId: 'mon-5',
        type: 'ssl_expiring',
        severity: 'warning',
        status: 'active',
        message: 'SSL certificate expiring in 10 days',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-3',
        monitorId: 'mon-1',
        type: 'up',
        severity: 'info',
        status: 'resolved',
        message: 'API Server is back UP',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      },
    ];

    alerts.forEach(a => this.alerts.set(a.id, a));

    // Generate health check history for each monitor
    this.generateHealthCheckHistory();
  }

  private generateHealthCheckHistory() {
    const locations = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
    
    this.monitors.forEach(monitor => {
      // Generate 24 hours of health check data (every 5 minutes)
      const now = Date.now();
      for (let i = 0; i < 288; i++) {
        const timestamp = new Date(now - i * 5 * 60 * 1000);
        const isUp = monitor.status === 'up' || (monitor.status === 'down' && i > 24);
        
        const healthCheck: HealthCheck = {
          id: generateId(),
          monitorId: monitor.id,
          status: isUp ? 'up' : 'down',
          responseTime: isUp ? Math.floor(Math.random() * 500) + 50 : 0,
          statusCode: isUp ? (monitor.expectedStatus || 200) : 503,
          timestamp: timestamp.toISOString(),
          location: locations[Math.floor(Math.random() * locations.length)],
        };
        
        this.healthChecks.set(healthCheck.id, healthCheck);
      }
    });
  }

  // Monitors
  getMonitors(): Monitor[] {
    return Array.from(this.monitors.values()).filter(
      m => m.userId === this.currentUserId
    );
  }

  getMonitor(id: string): Monitor | undefined {
    const monitor = this.monitors.get(id);
    return monitor?.userId === this.currentUserId ? monitor : undefined;
  }

  createMonitor(monitor: Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>): Monitor {
    const newMonitor: Monitor = {
      ...monitor,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.monitors.set(newMonitor.id, newMonitor);
    return newMonitor;
  }

  updateMonitor(id: string, updates: Partial<Monitor>): Monitor | undefined {
    const monitor = this.monitors.get(id);
    if (!monitor || monitor.userId !== this.currentUserId) return undefined;
    
    const updated = { ...monitor, ...updates, updatedAt: new Date().toISOString() };
    this.monitors.set(id, updated);
    return updated;
  }

  deleteMonitor(id: string): boolean {
    const monitor = this.monitors.get(id);
    if (!monitor || monitor.userId !== this.currentUserId) return false;
    
    this.monitors.delete(id);
    // Clean up related data
    this.healthChecks.forEach((hc, key) => {
      if (hc.monitorId === id) this.healthChecks.delete(key);
    });
    return true;
  }

  // Health Checks
  getHealthChecks(monitorId: string, limit: number = 100): HealthCheck[] {
    return Array.from(this.healthChecks.values())
      .filter(hc => hc.monitorId === monitorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Incidents
  getIncidents(): Incident[] {
    const monitorIds = this.getMonitors().map(m => m.id);
    return Array.from(this.incidents.values()).filter(
      i => monitorIds.includes(i.monitorId)
    );
  }

  getIncident(id: string): Incident | undefined {
    const incident = this.incidents.get(id);
    const monitorIds = this.getMonitors().map(m => m.id);
    return incident && monitorIds.includes(incident.monitorId) ? incident : undefined;
  }

  createIncident(incident: Omit<Incident, 'id'>): Incident {
    const newIncident: Incident = {
      ...incident,
      id: generateId(),
    };
    this.incidents.set(newIncident.id, newIncident);
    return newIncident;
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const incident = this.incidents.get(id);
    const monitorIds = this.getMonitors().map(m => m.id);
    if (!incident || !monitorIds.includes(incident.monitorId)) return undefined;
    
    const updated = { ...incident, ...updates };
    this.incidents.set(id, updated);
    return updated;
  }

  // Alerts
  getAlerts(): Alert[] {
    const monitorIds = this.getMonitors().map(m => m.id);
    return Array.from(this.alerts.values()).filter(
      a => monitorIds.includes(a.monitorId)
    );
  }

  getAlert(id: string): Alert | undefined {
    const alert = this.alerts.get(id);
    const monitorIds = this.getMonitors().map(m => m.id);
    return alert && monitorIds.includes(alert.monitorId) ? alert : undefined;
  }

  updateAlert(id: string, updates: Partial<Alert>): Alert | undefined {
    const alert = this.alerts.get(id);
    const monitorIds = this.getMonitors().map(m => m.id);
    if (!alert || !monitorIds.includes(alert.monitorId)) return undefined;
    
    const updated = { ...alert, ...updates };
    this.alerts.set(id, updated);
    return updated;
  }

  // Analytics
  getAnalyticsSummary(): AnalyticsSummary {
    const monitors = this.getMonitors();
    const incidents = this.getIncidents().filter(i => !i.resolvedAt);
    
    const upMonitors = monitors.filter(m => m.status === 'up').length;
    const downMonitors = monitors.filter(m => m.status === 'down').length;
    const pausedMonitors = monitors.filter(m => m.status === 'paused').length;
    
    const avgResponseTime = monitors.length > 0
      ? monitors.reduce((sum, m) => sum + (m.lastResponseTime || 0), 0) / monitors.length
      : 0;
    
    const uptimePercentage = monitors.length > 0
      ? monitors.reduce((sum, m) => sum + m.uptime24h, 0) / monitors.length
      : 100;
    
    const sslExpiringSoon = monitors.filter(m => {
      if (!m.sslExpiryDate) return false;
      const daysUntilExpiry = Math.floor(
        (new Date(m.sslExpiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return {
      totalMonitors: monitors.length,
      upMonitors,
      downMonitors,
      pausedMonitors,
      activeIncidents: incidents.length,
      avgResponseTime: Math.round(avgResponseTime),
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      sslExpiringSoon,
    };
  }

  getMonitorAnalytics(monitorId: string): MonitorAnalytics | undefined {
    const monitor = this.getMonitor(monitorId);
    if (!monitor) return undefined;

    const healthChecks = this.getHealthChecks(monitorId, 1000);
    
    // Calculate average response time
    const avgResponseTime = healthChecks.length > 0
      ? healthChecks.reduce((sum, hc) => sum + hc.responseTime, 0) / healthChecks.length
      : 0;

    // Group by timestamp for time series
    const responseTimeData = healthChecks
      .filter(hc => hc.status === 'up')
      .slice(0, 100)
      .map(hc => ({
        timestamp: hc.timestamp,
        value: hc.responseTime,
      }))
      .reverse();

    const statusHistory = healthChecks
      .slice(0, 100)
      .map(hc => ({
        timestamp: hc.timestamp,
        status: hc.status,
      }))
      .reverse();

    return {
      monitorId,
      uptime24h: monitor.uptime24h,
      uptime7d: monitor.uptime7d,
      uptime30d: monitor.uptime30d,
      avgResponseTime: Math.round(avgResponseTime),
      responseTimeData,
      statusHistory,
    };
  }
}

// Singleton instance
export const mockDataStore = new MockDataStore();
