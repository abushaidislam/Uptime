'use client';

import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import type { Monitor, Incident } from '~/lib/status-vault/types';

interface StatusPagePreviewProps {
  monitors: Monitor[];
  incidents: Incident[];
}

const statusConfig = {
  up: {
    label: 'Operational',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-200',
    icon: CheckCircle2,
  },
  down: {
    label: 'Major Outage',
    color: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200',
    icon: AlertTriangle,
  },
  paused: {
    label: 'Maintenance',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200',
    icon: Clock,
  },
  pending: {
    label: 'Checking',
    color: 'text-slate-600 bg-slate-50 dark:bg-slate-950 border-slate-200',
    icon: Clock,
  },
};

const incidentStatusConfig = {
  investigating: { label: 'Investigating', color: 'bg-red-500' },
  identified: { label: 'Identified', color: 'bg-amber-500' },
  monitoring: { label: 'Monitoring', color: 'bg-blue-500' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500' },
};

export function StatusPagePreview({ monitors, incidents }: StatusPagePreviewProps) {
  const operationalCount = monitors.filter(m => m.status === 'up').length;
  const downCount = monitors.filter(m => m.status === 'down').length;
  const isAllOperational = downCount === 0 && monitors.length > 0;

  // Calculate overall status
  const getOverallStatus = () => {
    if (downCount === 0) return { label: 'All Systems Operational', color: 'text-emerald-600' };
    if (downCount === monitors.length) return { label: 'Major Outage', color: 'text-red-600' };
    return { label: 'Partial Outage', color: 'text-amber-600' };
  };

  const overallStatus = getOverallStatus();
  const activeIncidents = incidents.filter(i => !i.resolvedAt);

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={isAllOperational ? 'border-emerald-200' : downCount > 0 ? 'border-red-200' : 'border-amber-200'}>
        <CardContent className="p-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isAllOperational 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
              : downCount > 0 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
          }`}>
            {isAllOperational ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span className="font-semibold text-lg">{overallStatus.label}</span>
          </div>
          <p className="mt-4 text-muted-foreground">
            {operationalCount} of {monitors.length} services operational
          </p>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monitors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No monitors configured for public status page.
              </p>
            ) : (
              monitors.map((monitor) => {
                const status = statusConfig[monitor.status];
                return (
                  <div
                    key={monitor.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${status.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <status.icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{monitor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last checked: {monitor.lastCheckedAt 
                            ? new Date(monitor.lastCheckedAt).toLocaleString() 
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeIncidents.map((incident) => {
                const status = incidentStatusConfig[incident.status];
                return (
                  <div
                    key={incident.id}
                    className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(incident.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-semibold">{incident.title}</p>
                    {incident.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.description}
                      </p>
                    )}
                    {incident.updates?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-sm font-medium mb-1">Latest Update:</p>
                        {(() => {
                          const lastUpdate = incident.updates[incident.updates.length - 1];
                          if (!lastUpdate) return null;
                          return (
                            <>
                              <p className="text-sm text-muted-foreground">
                                {lastUpdate.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {lastUpdate.createdAt 
                                  ? new Date(lastUpdate.createdAt).toLocaleString()
                                  : ''}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident History */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {incident.resolvedAt ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{incident.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Started: {new Date(incident.startedAt).toLocaleDateString()}</span>
                    {incident.resolvedAt && (
                      <>
                        <span>•</span>
                        <span>Resolved: {new Date(incident.resolvedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uptime Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uptime Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {(monitors.reduce((sum, m) => sum + m.uptime24h, 0) / (monitors.length || 1)).toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground">Last 24 Hours</p>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {(monitors.reduce((sum, m) => sum + m.uptime7d, 0) / (monitors.length || 1)).toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground">Last 7 Days</p>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {(monitors.reduce((sum, m) => sum + m.uptime30d, 0) / (monitors.length || 1)).toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground">Last 30 Days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
