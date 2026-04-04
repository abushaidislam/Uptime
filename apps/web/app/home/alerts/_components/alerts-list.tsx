'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  Info,
  CheckCircle2,
  Search,
  Clock,
  Bell,
  Server,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import type { Alert } from '~/lib/status-vault/types';
import { acknowledgeAlert, resolveAlert } from '~/lib/status-vault/actions';

interface AlertsListProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    color: 'border-red-200 bg-red-50 dark:bg-red-950',
    badgeColor: 'bg-red-500 text-white',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'border-amber-200 bg-amber-50 dark:bg-amber-950',
    badgeColor: 'bg-amber-500 text-white',
  },
  info: {
    label: 'Info',
    icon: Info,
    color: 'border-blue-200 bg-blue-50 dark:bg-blue-950',
    badgeColor: 'bg-blue-500 text-white',
  },
};

const typeConfig = {
  down: {
    label: 'Monitor Down',
    icon: Server,
    description: 'A monitor has detected that a service is down',
  },
  up: {
    label: 'Monitor Up',
    icon: CheckCircle2,
    description: 'A monitor has recovered and the service is back up',
  },
  ssl_expiring: {
    label: 'SSL Expiring',
    icon: Shield,
    description: 'An SSL certificate is expiring soon',
  },
  performance: {
    label: 'Performance',
    icon: TrendingUp,
    description: 'A monitor has detected performance issues',
  },
};

const statusConfig = {
  active: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  acknowledged: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
};

export function AlertsList({ alerts }: AlertsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [activeTab, setActiveTab] = useState('all');

  const filteredAlerts = localAlerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || alert.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleAcknowledge = async (id: string) => {
    const updated = await acknowledgeAlert(id);
    if (updated) {
      setLocalAlerts(prev => prev.map(a => a.id === id ? updated : a));
    }
  };

  const handleResolve = async (id: string) => {
    const updated = await resolveAlert(id);
    if (updated) {
      setLocalAlerts(prev => prev.map(a => a.id === id ? updated : a));
    }
  };

  const activeCount = localAlerts.filter(a => a.status === 'active').length;
  const acknowledgedCount = localAlerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = localAlerts.filter(a => a.status === 'resolved').length;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="all">
                All ({localAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="text-red-600">
                Active ({activeCount})
              </TabsTrigger>
              <TabsTrigger value="acknowledged">
                Acknowledged ({acknowledgedCount})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedCount})
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-auto min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                  <p className="text-lg font-medium">No alerts found</p>
                  <p className="text-muted-foreground">
                    {activeTab === 'active' 
                      ? 'No active alerts at the moment. Great!' 
                      : 'No alerts match your search criteria.'}
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const severity = severityConfig[alert.severity];
                  const type = typeConfig[alert.type];
                  const isActive = alert.status === 'active';
                  const isAcknowledged = alert.status === 'acknowledged';

                  return (
                    <div
                      key={alert.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border ${severity.color}`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-white/50 dark:bg-black/50">
                          <severity.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={severity.badgeColor}>
                              {severity.label}
                            </Badge>
                            <Badge className={statusConfig[alert.status]}>
                              {alert.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(alert.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </div>
                      </div>

                      {(isActive || isAcknowledged) && (
                        <div className="flex gap-2 shrink-0">
                          {isActive && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
