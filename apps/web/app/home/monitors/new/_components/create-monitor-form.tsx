'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Server, Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { createMonitor } from '~/lib/status-vault/actions';
import type { MonitorType } from '~/lib/status-vault/types';

const monitorTypes = [
  { value: 'https' as MonitorType, label: 'HTTPS', icon: Globe, description: 'Monitor a secure website or API' },
  { value: 'http' as MonitorType, label: 'HTTP', icon: Globe, description: 'Monitor a website or API' },
  { value: 'tcp' as MonitorType, label: 'TCP', icon: Server, description: 'Monitor a TCP port (e.g., database, custom service)' },
  { value: 'ping' as MonitorType, label: 'Ping', icon: Activity, description: 'ICMP ping check' },
];

const intervalOptions = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
];

const timeoutOptions = [
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 45, label: '45 seconds' },
  { value: 60, label: '60 seconds' },
];

export function CreateMonitorForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'https' as MonitorType,
    interval: 60,
    timeout: 30,
    expectedStatus: 200,
  });
  const [selectedType, setSelectedType] = useState('https' as MonitorType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createMonitor({
        name: formData.name,
        url: formData.url,
        type: selectedType,
        interval: formData.interval,
        timeout: formData.timeout,
        expectedStatus: ['http', 'https'].includes(selectedType) ? formData.expectedStatus : undefined,
      });
      
      router.push('/home/monitors');
      router.refresh();
    } catch (error) {
      console.error('Failed to create monitor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6 max-w-2xl">
        {/* Monitor Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monitor Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {monitorTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      selectedType === type.value ? 'bg-blue-500 text-white' : 'bg-muted'
                    }`}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name</Label>
              <Input
                id="name"
                placeholder="e.g., API Server, Website, Database"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">
                {selectedType === 'ping' ? 'Hostname or IP' : 
                 selectedType === 'tcp' ? 'Host:Port' : 'URL'}
              </Label>
              <Input
                id="url"
                placeholder={
                  selectedType === 'ping' ? 'example.com' :
                  selectedType === 'tcp' ? 'db.example.com:5432' :
                  'https://api.example.com/health'
                }
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {selectedType === 'https' && 'Include https:// for secure connections'}
                {selectedType === 'tcp' && 'Format: hostname:port'}
                {selectedType === 'ping' && 'Domain name or IP address'}
              </p>
            </div>

            {['http', 'https'].includes(selectedType) && (
              <div className="space-y-2">
                <Label htmlFor="expectedStatus">Expected HTTP Status Code</Label>
                <Input
                  id="expectedStatus"
                  type="number"
                  placeholder="200"
                  value={formData.expectedStatus}
                  onChange={(e) => setFormData({ ...formData, expectedStatus: parseInt(e.target.value) })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monitoring Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monitoring Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interval" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Check Interval
              </Label>
              <Select
                value={formData.interval.toString()}
                onValueChange={(value) => setFormData({ ...formData, interval: parseInt(value) })}
              >
                <SelectTrigger id="interval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often to check if your service is up
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeout
              </Label>
              <Select
                value={formData.timeout.toString()}
                onValueChange={(value: string) => setFormData({ ...formData, timeout: parseInt(value) })}
              >
                <SelectTrigger id="timeout">
                  <SelectValue placeholder="Select timeout" />
                </SelectTrigger>
                <SelectContent>
                  {timeoutOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How long to wait for a response before marking as down
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? 'Creating...' : 'Create Monitor'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/home/monitors')}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
