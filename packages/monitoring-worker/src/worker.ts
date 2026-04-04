import { createClient } from '@supabase/supabase-js';

import { loadActiveMonitors, runMonitorCheck } from './monitoring-service.js';
import { MonitorScheduler } from './scheduler/monitor-scheduler.js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const scheduler = new MonitorScheduler(async (monitor) => {
  await runMonitorCheck(supabase, monitor);
});

async function loadMonitors(): Promise<void> {
  console.log('[Worker] Loading monitors from database...');

  try {
    const monitors = await loadActiveMonitors(supabase);

    if (monitors.length === 0) {
      console.log('[Worker] No active monitors found');
      return;
    }

    console.log(`[Worker] Loaded ${monitors.length} monitors`);

    for (const monitor of monitors) {
      scheduler.schedule(monitor);
    }
  } catch (error) {
    console.error('Failed to load monitors:', error);
  }
}

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

async function main(): Promise<void> {
  console.log('==============================================');
  console.log('       StatusVault Monitoring Worker Started');
  console.log('==============================================');
  console.log(`[Worker] Connected to: ${SUPABASE_URL}`);
  console.log('[Worker] Press Ctrl+C to stop\n');

  await loadMonitors();

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
