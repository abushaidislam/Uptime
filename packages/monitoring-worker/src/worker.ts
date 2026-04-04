import { createClient } from '@supabase/supabase-js';
import type { Monitor, HealthCheckResult } from './types.js';
import { HttpChecker } from './checkers/http-checker.js';
import { TcpChecker } from './checkers/tcp-checker.js';
import { SslChecker } from './checkers/ssl-checker.js';
import { MonitorScheduler } from './scheduler/monitor-scheduler.js';

// Initialize checkers
const httpChecker = new HttpChecker();
const tcpChecker = new TcpChecker();
const sslChecker = new SslChecker();

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create scheduler
const scheduler = new MonitorScheduler(async (monitor) => {
  await checkMonitor(monitor);
});

async function checkMonitor(monitor: Monitor): Promise<void> {
  console.log(`[${new Date().toISOString()}] Checking monitor: ${monitor.name} (${monitor.url})`);

  let result: HealthCheckResult;

  // Perform the appropriate check based on monitor type
  if (monitor.type === 'http' || monitor.type === 'https') {
    result = await httpChecker.check(
      monitor.url,
      monitor.timeout,
      monitor.expectedStatus
    );
  } else if (monitor.type === 'tcp') {
    result = await tcpChecker.check(monitor.url, monitor.timeout);
  } else {
    // For ping type, use HTTP checker as fallback
    result = await httpChecker.check(
      monitor.url,
      monitor.timeout,
      monitor.expectedStatus
    );
  }

  // Check SSL if HTTPS
  let sslExpiryDate: string | undefined;
  if (monitor.type === 'https' || monitor.url.startsWith('https://')) {
    try {
      const sslInfo = await sslChecker.check(monitor.url, monitor.timeout);
      if (sslInfo.valid && sslInfo.expiryDate) {
        sslExpiryDate = sslInfo.expiryDate;
        console.log(`  SSL expires in ${sslInfo.daysUntilExpiry} days`);
      } else if (sslInfo.error) {
        console.log(`  SSL Error: ${sslInfo.error}`);
      }
    } catch (error) {
      console.error('  SSL check failed:', error);
    }
  }

  // Save health check to database
  await saveHealthCheck(monitor.id, result);

  // Update monitor status and SSL info
  await updateMonitorStatus(monitor, result, sslExpiryDate);

  // Create incident if monitor went down
  if (result.status === 'down' && monitor.status !== 'down') {
    await createIncident(monitor, result);
  }

  // Log result
  const statusEmoji = result.status === 'up' ? '✅' : '❌';
  console.log(`  ${statusEmoji} Status: ${result.status}, Response: ${result.responseTime}ms${result.error ? `, Error: ${result.error}` : ''}`);
}

async function saveHealthCheck(
  monitorId: string,
  result: HealthCheckResult
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
  monitor: Monitor,
  result: HealthCheckResult,
  sslExpiryDate?: string
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

  // Calculate uptime percentages (simplified - in production, calculate from health check history)
  if (result.status === 'up') {
    // Gradually improve uptime percentages
    updateData.uptime_24h = Math.min(100, (monitor.uptime24h * 23 + 100) / 24);
    updateData.uptime_7d = Math.min(100, (monitor.uptime7d * 167 + 100) / 168);
    updateData.uptime_30d = Math.min(100, (monitor.uptime30d * 719 + 100) / 720);
  } else {
    // Gradually decrease uptime percentages
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
  monitor: Monitor,
  result: HealthCheckResult
): Promise<void> {
  // Check if there's already an active incident for this monitor
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

  // Create new incident
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
  } else {
    console.log(`  🚨 Created incident for monitor ${monitor.id}`);
  }

  // Create alert
  await createAlert(monitor, result);
}

async function createAlert(
  monitor: Monitor,
  result: HealthCheckResult
): Promise<void> {
  const { error } = await supabase.from('alerts').insert({
    monitor_id: monitor.id,
    type: 'down',
    severity: 'critical',
    status: 'active',
    message: result.error || `${monitor.name} is down`,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to create alert:', error);
  } else {
    console.log(`  🔔 Created alert for monitor ${monitor.id}`);
  }
}

async function loadMonitors(): Promise<void> {
  console.log('[Worker] Loading monitors from database...');

  const { data: monitors, error } = await supabase
    .from('monitors')
    .select('*')
    .neq('status', 'paused');

  if (error) {
    console.error('Failed to load monitors:', error);
    return;
  }

  if (!monitors || monitors.length === 0) {
    console.log('[Worker] No active monitors found');
    return;
  }

  console.log(`[Worker] Loaded ${monitors.length} monitors`);

  // Schedule each monitor
  for (const row of monitors) {
    const monitor: Monitor = {
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

    scheduler.schedule(monitor);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Worker] Shutting down gracefully...');
  scheduler.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Worker] Shutting down gracefully...');
  scheduler.stopAll();
  process.exit(0);
});

// Start the worker
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       StatusVault Monitoring Worker Started            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`[Worker] Connected to: ${SUPABASE_URL}`);
  console.log('[Worker] Press Ctrl+C to stop\n');

  // Load and schedule monitors
  await loadMonitors();

  // Refresh monitor list every 5 minutes
  setInterval(async () => {
    console.log('[Worker] Refreshing monitor list...');
    scheduler.stopAll();
    await loadMonitors();
  }, 5 * 60 * 1000);
}

main().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
