'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import type { Incident } from '~/lib/status-vault/types';

interface RecentIncidentsProps {
  incidents: Incident[];
}

const statusConfig = {
  investigating: {
    label: 'Investigating',
    color: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200',
    icon: Search,
  },
  identified: {
    label: 'Identified',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200',
    icon: AlertTriangle,
  },
  monitoring: {
    label: 'Monitoring',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200',
    icon: Clock,
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-200',
    icon: CheckCircle2,
  },
};

const severityConfig = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function RecentIncidents({ incidents }: RecentIncidentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Active Incidents
        </CardTitle>
        <Link href="/home/incidents">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                No active incidents. Everything is running smoothly!
              </p>
            </div>
          ) : (
            incidents.map((incident) => {
              const status = statusConfig[incident.status];
              return (
                <div
                  key={incident.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${status.color}`}
                >
                  <status.icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={severityConfig[incident.severity]}>
                        {incident.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Started {new Date(incident.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 font-medium">{incident.title}</p>
                    {incident.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.description}
                      </p>
                    )}
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
