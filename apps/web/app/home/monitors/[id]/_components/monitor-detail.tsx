'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Pause, 
  Clock,
  ArrowLeft,
  Activity,
  Globe,
  BarChart3,
  History,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import type { Monitor, HealthCheck } from '~/lib/status-vault/types';
import { updateMonitor } from '~/lib/status-vault/actions';

interface MonitorDetailProps {
  monitor: Monitor;
  healthChecks: HealthCheck[];
}

const statusConfig = {
  up: {
    label: 'Up',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  down: {
    label: 'Down',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200',
    badgeColor: 'bg-red-100 text-red-800',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-slate-600 bg-slate-50 dark:bg-slate-950 border-slate-200',
    badgeColor: 'bg-slate-100 text-slate-800',
  },
};

const typeLabels = {
  http: 'HTTP',
  https: 'HTTPS',
  tcp: 'TCP',
  ping: 'Ping',
};

export function MonitorDetail({ monitor: initialMonitor, healthChecks }: MonitorDetailProps) {
  const [monitor, setMonitor] = useState(initialMonitor);

  const status = statusConfig[monitor.status];

  // Format chart data
  const chartData = healthChecks
    .filter(hc => hc.status === 'up')
    .slice(0, 50)
    .reverse()
    .map(hc => ({
      time: new Date(hc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: hc.responseTime,
    }));

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/home/monitors">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Monitors
        </Button>
      </Link>

      {/* Status Header */}
      <Card className={status.color}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/50 dark:bg-black/50">
                <status.icon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{monitor.name}</h1>
                <p className="text-muted-foreground">{monitor.url}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${status.badgeColor} text-base px-3 py-1`}>
                {status.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Type: {typeLabels[monitor.type]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monitor.uptime24h >= 99.9 ? 'text-emerald-600' : monitor.uptime24h >= 99 ? 'text-amber-600' : 'text-red-600'}`}>
              {monitor.uptime24h.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime (7d)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monitor.uptime7d >= 99.9 ? 'text-emerald-600' : monitor.uptime7d >= 99 ? 'text-amber-600' : 'text-red-600'}`}>
              {monitor.uptime7d.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime (30d)</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monitor.uptime30d >= 99.9 ? 'text-emerald-600' : monitor.uptime30d >= 99 ? 'text-amber-600' : 'text-red-600'}`}>
              {monitor.uptime30d.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monitor.lastResponseTime && monitor.lastResponseTime > 500 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {monitor.lastResponseTime || 0}ms
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Check History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        unit="ms"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorResponse)" 
                        name="Response Time"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No response time data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* SSL Info */}
          {monitor.sslExpiryDate && (
            <Card>
              <CardHeader>
                <CardTitle>SSL Certificate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Certificate Expiry</p>
                    <p className="text-sm text-muted-foreground">
                      Expires on {new Date(monitor.sslExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <SSLExpiryBadge date={monitor.sslExpiryDate} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Health Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {healthChecks.slice(0, 20).map((check) => (
                  <div
                    key={check.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      check.status === 'up' 
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950' 
                        : 'bg-red-50 border-red-200 dark:bg-red-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {check.status === 'up' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {check.status === 'up' ? 'Healthy' : 'Down'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(check.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {check.status === 'up' ? (
                        <p className={`font-medium ${check.responseTime > 500 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {check.responseTime}ms
                        </p>
                      ) : (
                        <p className="text-red-600">Failed</p>
                      )}
                      {check.statusCode && (
                        <p className="text-xs text-muted-foreground">
                          Status: {check.statusCode}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <MonitorSettingsTab monitor={monitor} onUpdate={setMonitor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SSLExpiryBadge({ date }: { date: string }) {
  const daysUntilExpiry = Math.floor(
    (new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  let colorClass = 'bg-emerald-100 text-emerald-800';
  let text = `${daysUntilExpiry} days remaining`;

  if (daysUntilExpiry <= 7) {
    colorClass = 'bg-red-100 text-red-800';
    text = `${daysUntilExpiry} days - Renew ASAP!`;
  } else if (daysUntilExpiry <= 30) {
    colorClass = 'bg-amber-100 text-amber-800';
    text = `${daysUntilExpiry} days - Renew soon`;
  }

  return (
    <Badge className={colorClass}>
      {text}
    </Badge>
  );
}

// Monitor Settings Tab Component
interface MonitorSettingsTabProps {
  monitor: Monitor;
  onUpdate: (monitor: Monitor) => void;
}

function MonitorSettingsTab({ monitor, onUpdate }: MonitorSettingsTabProps) {
  const [name, setName] = useState(monitor.name);
  const [url, setUrl] = useState(monitor.url);
  const [interval, setInterval] = useState(monitor.interval);
  const [timeout, setTimeout] = useState(monitor.timeout);
  const [expectedStatus, setExpectedStatus] = useState(monitor.expectedStatus);
  const [notificationsEnabled, setNotificationsEnabled] = useState(monitor.notificationsEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMonitor(monitor.id, {
        name,
        url,
        interval,
        timeout,
        expectedStatus,
        notificationsEnabled,
      });
      if (updated) {
        onUpdate(updated);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = 
    name !== monitor.name ||
    url !== monitor.url ||
    interval !== monitor.interval ||
    timeout !== monitor.timeout ||
    expectedStatus !== monitor.expectedStatus ||
    notificationsEnabled !== monitor.notificationsEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitor Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/health"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="interval">Check Interval (seconds)</Label>
            <Select 
              value={interval.toString()} 
              onValueChange={(v) => setInterval(Number(v))}
            >
              <SelectTrigger id="interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="600">10 minutes</SelectItem>
                <SelectItem value="1800">30 minutes</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Minimum: 60 seconds</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              min={5}
              max={60}
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedStatus">Expected HTTP Status</Label>
            <Input
              id="expectedStatus"
              type="number"
              value={expectedStatus || 200}
              onChange={(e) => setExpectedStatus(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4 border-t">
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
          <Label htmlFor="notifications">Enable Notifications</Label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving || !name.trim() || !url.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Type: {monitor.type.toUpperCase()} (cannot be changed)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
