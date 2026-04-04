import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import {
  getDueMonitors,
  loadActiveMonitors,
  runMonitorCheck,
} from '@kit/monitoring-worker';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] Missing CRON_SECRET');

    return Response.json(
      { ok: false, error: 'CRON_SECRET is not configured' },
      { status: 500 },
    );
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = getSupabaseServerAdminClient();
  const now = new Date();

  try {
    const monitors = await loadActiveMonitors(supabase);
    const dueMonitors = getDueMonitors(monitors, now);
    const settled = await Promise.allSettled(
      dueMonitors.map((monitor) => runMonitorCheck(supabase, monitor)),
    );

    const completed = settled.filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof runMonitorCheck>>> =>
        result.status === 'fulfilled',
    );
    const failed = settled.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failed.length > 0) {
      console.error(
        '[Cron] Failed monitor runs:',
        failed.map((result) => stringifyError(result.reason)),
      );
    }

    return Response.json({
      ok: failed.length === 0,
      checkedAt: now.toISOString(),
      activeMonitorCount: monitors.length,
      dueMonitorCount: dueMonitors.length,
      completedCount: completed.length,
      failedCount: failed.length,
      results: completed.map((result) => result.value),
      errors: failed.map((result) => stringifyError(result.reason)),
    });
  } catch (error) {
    console.error('[Cron] Monitoring run failed:', error);

    return Response.json(
      {
        ok: false,
        error: stringifyError(error),
      },
      { status: 500 },
    );
  }
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
