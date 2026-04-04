'use client';

import Link from 'next/link';
import { Bell, ArrowRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import type { Alert } from '~/lib/status-vault/types';

interface ActiveAlertsProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200',
  },
  info: {
    label: 'Info',
    icon: Info,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200',
  },
};

const typeConfig = {
  down: 'Monitor Down',
  up: 'Monitor Up',
  ssl_expiring: 'SSL Expiring',
  performance: 'Performance',
};

export function ActiveAlerts({ alerts }: ActiveAlertsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Active Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <Link href="/home/alerts">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                No active alerts. All systems operational!
              </p>
            </div>
          ) : (
            alerts.slice(0, 5).map((alert) => {
              const severity = severityConfig[alert.severity];
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${severity.color}`}
                >
                  <severity.icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {typeConfig[alert.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{alert.message}</p>
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
