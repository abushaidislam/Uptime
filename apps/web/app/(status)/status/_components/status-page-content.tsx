'use client';

import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Calendar,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import type { Monitor, Incident } from '~/lib/status-vault/types';

interface StatusPageContentProps {
  monitors: Monitor[];
  incidents: Incident[];
}

const statusConfig = {
  up: {
    label: 'Operational',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    icon: CheckCircle2,
  },
  down: {
    label: 'Major Outage',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: AlertTriangle,
  },
  paused: {
    label: 'Maintenance',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: Clock,
  },
  pending: {
    label: 'Checking',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    icon: Clock,
  },
};

const incidentStatusConfig = {
  investigating: { label: 'Investigating', color: 'bg-red-500' },
  identified: { label: 'Identified', color: 'bg-amber-500' },
  monitoring: { label: 'Monitoring', color: 'bg-blue-500' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500' },
};

export function StatusPageContent({ monitors, incidents }: StatusPageContentProps) {
  const operationalCount = monitors.filter(m => m.status === 'up').length;
  const downCount = monitors.filter(m => m.status === 'down').length;
  const isAllOperational = downCount === 0 && monitors.length > 0;

  const getOverallStatus = () => {
    if (downCount === 0) return { label: 'All Systems Operational', color: 'bg-emerald-500' };
    if (downCount === monitors.length) return { label: 'Major Outage', color: 'bg-red-500' };
    return { label: 'Partial Outage', color: 'bg-amber-500' };
  };

  const overallStatus = getOverallStatus();
  const activeIncidents = incidents.filter(i => !i.resolvedAt);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Activity className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">StatusVault</h1>
        </div>
        <p className="text-muted-foreground">Real-time service status and incident updates</p>
      </div>

      {/* Overall Status */}
      <Card className="mb-8">
        <CardContent className="p-8 text-center">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-white ${overallStatus.color}`}>
            {isAllOperational ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
            <span className="font-semibold text-xl">{overallStatus.label}</span>
          </div>
          <p className="mt-4 text-muted-foreground">
            {operationalCount} of {monitors.length} services are operational
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Services */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Services</h2>
        <div className="space-y-3">
          {monitors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No services configured
              </CardContent>
            </Card>
          ) : (
            monitors.map((monitor) => {
              const status = statusConfig[monitor.status];
              return (
                <Card key={monitor.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${status.color}`}>
                          <status.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{monitor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uptime: {monitor.uptime30d.toFixed(2)}% (30 days)
                          </p>
                        </div>
                      </div>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Active Incidents
          </h2>
          <div className="space-y-4">
            {activeIncidents.map((incident) => {
              const status = incidentStatusConfig[incident.status];
              return (
                <Card key={incident.id} className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Started {new Date(incident.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-semibold">{incident.title}</p>
                    {incident.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.description}
                      </p>
                    )}
                    {incident.updates?.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium">Latest Update</p>
                        {(() => {
                          const lastUpdate = incident.updates[incident.updates.length - 1];
                          if (!lastUpdate) return null;
                          return (
                            <>
                              <p className="text-sm text-muted-foreground mt-1">
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Incident History */}
      {incidents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Past Incidents
          </h2>
          <div className="space-y-3">
            {incidents.slice(0, 5).map((incident) => (
              <Card key={incident.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {incident.resolvedAt ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{incident.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>Started: {new Date(incident.startedAt).toLocaleDateString()}</span>
                    {incident.resolvedAt && (
                      <span> • Resolved: {new Date(incident.resolvedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p>Powered by StatusVault - Enterprise Uptime Monitoring</p>
      </footer>
    </div>
  );
}
