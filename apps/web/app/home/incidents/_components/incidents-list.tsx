'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Search,
  Clock,
  SearchIcon,
  BarChart2,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import type { Incident } from '~/lib/status-vault/types';
import { acknowledgeIncident, resolveIncident } from '~/lib/status-vault/actions';

interface IncidentsListProps {
  incidents: Incident[];
}

const statusConfig = {
  investigating: {
    label: 'Investigating',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: SearchIcon,
  },
  identified: {
    label: 'Identified',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    icon: AlertTriangle,
  },
  monitoring: {
    label: 'Monitoring',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: BarChart2,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    icon: CheckCircle2,
  },
};

const severityConfig = {
  critical: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
};

export function IncidentsList({ incidents }: IncidentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localIncidents, setLocalIncidents] = useState(incidents);
  const [activeTab, setActiveTab] = useState('all');

  const filteredIncidents = localIncidents.filter(incident => {
    const matchesSearch = 
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'active' && !incident.resolvedAt) ||
      (activeTab === 'resolved' && incident.resolvedAt);
    
    return matchesSearch && matchesTab;
  });

  const handleAcknowledge = async (id: string) => {
    const updated = await acknowledgeIncident(id);
    if (updated) {
      setLocalIncidents(prev => 
        prev.map(i => i.id === id ? updated : i)
      );
    }
  };

  const handleResolve = async (id: string) => {
    const updated = await resolveIncident(id);
    if (updated) {
      setLocalIncidents(prev => 
        prev.map(i => i.id === id ? updated : i)
      );
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-auto min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-3">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                  <p className="text-lg font-medium">No incidents found</p>
                  <p className="text-muted-foreground">
                    {activeTab === 'active' 
                      ? 'Great! No active incidents at the moment.' 
                      : 'No incidents match your search criteria.'}
                  </p>
                </div>
              ) : (
                filteredIncidents.map((incident) => {
                  const status = statusConfig[incident.status];
                  const isResolved = !!incident.resolvedAt;
                  
                  return (
                    <div
                      key={incident.id}
                      className="flex flex-col gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge className={severityConfig[incident.severity]}>
                              {incident.severity}
                            </Badge>
                            <Badge className={status.color}>
                              <status.icon className="mr-1 h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                          <Link 
                            href={`/home/incidents/${incident.id}`}
                            className="font-semibold text-lg hover:underline"
                          >
                            {incident.title}
                          </Link>
                          {incident.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {incident.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground shrink-0">
                          <p>Started: {new Date(incident.startedAt).toLocaleDateString()}</p>
                          {isResolved && incident.resolvedAt && (
                            <p>Resolved: {new Date(incident.resolvedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      {incident.updates.length > 0 && (
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>{incident.updates.length} update(s)</span>
                          </div>
                          <p className="text-sm">
                            Latest: {incident.updates[incident.updates.length - 1]?.message}
                          </p>
                        </div>
                      )}

                      {!isResolved && (
                        <div className="flex gap-2 border-t pt-3">
                          {incident.status === 'investigating' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAcknowledge(incident.id)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Acknowledge
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => handleResolve(incident.id)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Resolve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            asChild
                          >
                            <Link href={`/home/incidents/${incident.id}`}>
                              View Details
                            </Link>
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
