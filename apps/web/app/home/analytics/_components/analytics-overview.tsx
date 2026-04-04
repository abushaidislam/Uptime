'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  Activity, 
  Clock, 
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { Monitor, MonitorAnalytics } from '~/lib/status-vault/types';
import { getMonitorAnalytics } from '~/lib/status-vault/actions';

interface AnalyticsOverviewProps {
  monitors: Monitor[];
  defaultAnalytics: MonitorAnalytics | null;
}

export function AnalyticsOverview({ monitors, defaultAnalytics }: AnalyticsOverviewProps) {
  const [selectedMonitor, setSelectedMonitor] = useState(monitors[0]?.id || '');
  const [analytics, setAnalytics] = useState<MonitorAnalytics | null>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(false);

  const handleMonitorChange = async (monitorId: string) => {
    setSelectedMonitor(monitorId);
    setIsLoading(true);
    const data = await getMonitorAnalytics(monitorId);
    setAnalytics(data || null);
    setIsLoading(false);
  };

  const selectedMonitorData = monitors.find(m => m.id === selectedMonitor);

  // Format chart data
  const chartData = analytics?.responseTimeData.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    responseTime: d.value,
  })) || [];

  const uptimeData = [
    { name: '24h', value: analytics?.uptime24h || 0 },
    { name: '7d', value: analytics?.uptime7d || 0 },
    { name: '30d', value: analytics?.uptime30d || 0 },
  ];

  if (monitors.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No monitors configured</p>
          <p className="text-muted-foreground">
            Add monitors to see analytics and performance data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Select Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMonitor} onValueChange={handleMonitorChange}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a monitor" />
            </SelectTrigger>
            <SelectContent>
              {monitors.map(monitor => (
                <SelectItem key={monitor.id} value={monitor.id}>
                  <div className="flex items-center gap-2">
                    <span className={monitor.status === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                      ●
                    </span>
                    {monitor.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMonitorData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${selectedMonitorData.uptime24h >= 99.9 ? 'text-emerald-600' : selectedMonitorData.uptime24h >= 99 ? 'text-amber-600' : 'text-red-600'}`}>
                {selectedMonitorData.uptime24h.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime (7d)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${selectedMonitorData.uptime7d >= 99.9 ? 'text-emerald-600' : selectedMonitorData.uptime7d >= 99 ? 'text-amber-600' : 'text-red-600'}`}>
                {selectedMonitorData.uptime7d.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime (30d)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${selectedMonitorData.uptime30d >= 99.9 ? 'text-emerald-600' : selectedMonitorData.uptime30d >= 99 ? 'text-amber-600' : 'text-red-600'}`}>
                {selectedMonitorData.uptime30d.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${selectedMonitorData.lastResponseTime && selectedMonitorData.lastResponseTime > 500 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {analytics?.avgResponseTime || 0}ms
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="response-time">
        <TabsList>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="uptime">Uptime Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="response-time">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : chartData.length > 0 ? (
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
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uptime">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uptime Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={uptimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#10b981" 
                      name="Uptime %"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
