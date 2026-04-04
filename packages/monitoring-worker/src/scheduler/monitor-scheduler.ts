import cron from 'node-cron';
import type { Monitor } from '../types.js';

export interface ScheduledJob {
  monitorId: string;
  task: cron.ScheduledTask;
}

export class MonitorScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private onTick: (monitor: Monitor) => Promise<void>;

  constructor(onTick: (monitor: Monitor) => Promise<void>) {
    this.onTick = onTick;
  }

  schedule(monitor: Monitor): void {
    // Remove existing job if any
    this.unschedule(monitor.id);

    // Skip paused monitors
    if (monitor.status === 'paused') {
      return;
    }

    // Convert interval (seconds) to cron expression
    const cronExpression = this.intervalToCron(monitor.interval);
    
    const task = cron.schedule(cronExpression, async () => {
      try {
        await this.onTick(monitor);
      } catch (error) {
        console.error(`Error checking monitor ${monitor.id}:`, error);
      }
    }, {
      scheduled: true,
    });

    this.jobs.set(monitor.id, {
      monitorId: monitor.id,
      task,
    });

    console.log(`Scheduled monitor ${monitor.id} (${monitor.name}) - every ${monitor.interval}s`);
  }

  unschedule(monitorId: string): void {
    const job = this.jobs.get(monitorId);
    if (job) {
      job.task.stop();
      this.jobs.delete(monitorId);
      console.log(`Unscheduled monitor ${monitorId}`);
    }
  }

  stopAll(): void {
    for (const job of this.jobs.values()) {
      job.task.stop();
    }
    this.jobs.clear();
    console.log('All scheduled jobs stopped');
  }

  getScheduledCount(): number {
    return this.jobs.size;
  }

  private intervalToCron(intervalSeconds: number): string {
    // Convert seconds to cron expression
    // Minimum interval is 60 seconds (1 minute)
    const interval = Math.max(60, intervalSeconds);
    
    if (interval < 60) {
      // Less than a minute - run every X seconds
      return `*/${interval} * * * * *`;
    } else if (interval === 60) {
      // Every minute
      return '* * * * *';
    } else if (interval < 3600) {
      // Less than an hour - run every X minutes
      const minutes = Math.floor(interval / 60);
      return `*/${minutes} * * * *`;
    } else if (interval === 3600) {
      // Every hour
      return '0 * * * *';
    } else {
      // Every X hours
      const hours = Math.floor(interval / 3600);
      return `0 */${hours} * * *`;
    }
  }
}
