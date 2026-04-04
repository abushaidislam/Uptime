'use client';

import Link from 'next/link';
import { Activity, ArrowRight, CheckCircle2, AlertTriangle, Clock, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import type { Monitor } from '~/lib/status-vault/types';

interface RecentMonitorsProps {
  monitors: Monitor[];
}

const statusConfig = {
  up: {
    label: 'Up',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
  },
  down: {
    label: 'Down',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50 dark:bg-red-950',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-slate-600 bg-slate-50 dark:bg-slate-950',
  },
};

export function RecentMonitors({ monitors }: RecentMonitorsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Monitors
        </CardTitle>
        <Link href="/home/monitors">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {monitors.length === 0 ? (
            <p className="text-muted-foreground text-sm">No monitors configured yet.</p>
          ) : (
            monitors.map((monitor) => {
              const status = statusConfig[monitor.status];
              return (
                <div
                  key={monitor.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${status.color}`}>
                      <status.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{monitor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{monitor.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {monitor.status === 'up' && monitor.lastResponseTime && (
                      <span className="text-muted-foreground">
                        {monitor.lastResponseTime}ms
                      </span>
                    )}
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
