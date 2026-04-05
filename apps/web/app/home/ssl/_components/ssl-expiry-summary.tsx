'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Clock,
  Award,
} from 'lucide-react';
import type { SSLCertificateWithMonitor } from '~/lib/status-vault/types';

interface SSLExpirySummaryProps {
  certificates: SSLCertificateWithMonitor[];
}

export function SSLExpirySummary({ certificates }: SSLExpirySummaryProps) {
  const stats = {
    total: certificates.length,
    valid: certificates.filter((c) => c.isValid && (c.daysUntilExpiry ?? 0) > 30).length,
    expiringSoon: certificates.filter((c) => {
      const days = c.daysUntilExpiry ?? 0;
      return c.isValid && days <= 30 && days > 0;
    }).length,
    expired: certificates.filter((c) => (c.daysUntilExpiry ?? 0) <= 0).length,
    invalid: certificates.filter((c) => !c.isValid).length,
    gradeA: certificates.filter((c) => c.grade === 'A+' || c.grade === 'A').length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Active SSL monitors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Healthy</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{stats.valid}</div>
          <p className="text-xs text-muted-foreground">
            Valid for &gt;30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.expiringSoon > 0 ? 'text-amber-600' : ''}`}>
            {stats.expiringSoon}
          </div>
          <p className="text-xs text-muted-foreground">
            Expires within 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.expired + stats.invalid > 0 ? 'text-red-600' : ''}`}>
            {stats.expired + stats.invalid}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.expired} expired, {stats.invalid} invalid
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Grade A/A+</CardTitle>
          <Award className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{stats.gradeA}</div>
          <p className="text-xs text-muted-foreground">
            Top grade certificates
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Action Required</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.expiringSoon + stats.expired > 0 ? 'text-amber-600' : ''}`}>
            {stats.expiringSoon + stats.expired}
          </div>
          <p className="text-xs text-muted-foreground">
            Certificates need attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
