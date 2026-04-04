'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Pause, 
  Clock, 
  Play,
  MoreHorizontal,
  Search,
  ExternalLink,
  BarChart3,
  Trash2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import type { Monitor } from '~/lib/status-vault/types';
import { toggleMonitorStatus, deleteMonitor } from '~/lib/status-vault/actions';

interface MonitorsTableProps {
  monitors: Monitor[];
}

const statusConfig = {
  up: {
    label: 'Up',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  down: {
    label: 'Down',
    icon: AlertTriangle,
    color: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-slate-600',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  },
};

const typeLabels = {
  http: 'HTTP',
  https: 'HTTPS',
  tcp: 'TCP',
  ping: 'Ping',
};

export function MonitorsTable({ monitors }: MonitorsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localMonitors, setLocalMonitors] = useState(monitors);

  const filteredMonitors = localMonitors.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (id: string) => {
    const updated = await toggleMonitorStatus(id);
    if (updated) {
      setLocalMonitors(prev => 
        prev.map(m => m.id === id ? updated : m)
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this monitor?')) {
      await deleteMonitor(id);
      setLocalMonitors(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search monitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Uptime (24h)</TableHead>
                <TableHead>SSL Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMonitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No monitors found. Create your first monitor to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMonitors.map((monitor) => {
                  const status = statusConfig[monitor.status];
                  return (
                    <TableRow key={monitor.id}>
                      <TableCell>
                        <Badge className={status.badgeColor}>
                          <status.icon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{monitor.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {monitor.url}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{typeLabels[monitor.type]}</TableCell>
                      <TableCell>
                        {monitor.status === 'up' && monitor.lastResponseTime ? (
                          <span className={monitor.lastResponseTime > 500 ? 'text-amber-600' : 'text-emerald-600'}>
                            {monitor.lastResponseTime}ms
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={monitor.uptime24h >= 99.9 ? 'text-emerald-600' : monitor.uptime24h >= 99 ? 'text-amber-600' : 'text-red-600'}>
                          {monitor.uptime24h.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {monitor.sslExpiryDate ? (
                          <SSLExpiryBadge date={monitor.sslExpiryDate} />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/home/monitors/${monitor.id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/home/monitors/${monitor.id}/analytics`}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Analytics
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(monitor.id)}>
                              {monitor.status === 'paused' ? (
                                <>
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                  Resume
                                </>
                              ) : (
                                <>
                                  <PauseCircle className="mr-2 h-4 w-4" />
                                  Pause
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(monitor.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SSLExpiryBadge({ date }: { date: string }) {
  const daysUntilExpiry = Math.floor(
    (new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  let colorClass = 'text-emerald-600';
  if (daysUntilExpiry <= 7) {
    colorClass = 'text-red-600';
  } else if (daysUntilExpiry <= 30) {
    colorClass = 'text-amber-600';
  }

  return (
    <span className={colorClass}>
      {daysUntilExpiry} days
    </span>
  );
}
