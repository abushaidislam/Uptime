'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  ExternalLink,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import type { SSLCertificateWithMonitor } from '~/lib/status-vault/types';

import { SSLGradeBadge } from './ssl-grade-badge';

interface SSLCertificatesTableProps {
  certificates: SSLCertificateWithMonitor[];
}

type FilterStatus = 'all' | 'healthy' | 'expiring-soon' | 'expired' | 'invalid';

export function SSLCertificatesTable({ certificates }: SSLCertificatesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filteredCertificates = useMemo(() => {
    return certificates
      .filter((cert) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            cert.domain.toLowerCase().includes(query) ||
            cert.monitorName.toLowerCase().includes(query) ||
            (cert.issuer && cert.issuer.toLowerCase().includes(query));
          if (!matchesSearch) return false;
        }

        // Status filter
        if (filterStatus !== 'all') {
          const daysUntilExpiry = cert.daysUntilExpiry ?? 0;
          switch (filterStatus) {
            case 'healthy':
              return daysUntilExpiry > 30 && cert.isValid;
            case 'expiring-soon':
              return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && cert.isValid;
            case 'expired':
              return daysUntilExpiry <= 0;
            case 'invalid':
              return !cert.isValid;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by expiry date (soonest first)
        const daysA = a.daysUntilExpiry ?? 999;
        const daysB = b.daysUntilExpiry ?? 999;
        return daysA - daysB;
      });
  }, [certificates, searchQuery, filterStatus]);

  const handleExport = () => {
    const csvContent = [
      ['Domain', 'Monitor', 'Grade', 'Valid Until', 'Days Remaining', 'Issuer', 'Status'].join(','),
      ...filteredCertificates.map((cert) =>
        [
          cert.domain,
          cert.monitorName,
          cert.grade || 'Unknown',
          cert.validTo ? new Date(cert.validTo).toLocaleDateString() : 'N/A',
          cert.daysUntilExpiry ?? 'N/A',
          cert.issuer || 'Unknown',
          cert.isValid ? (cert.daysUntilExpiry && cert.daysUntilExpiry <= 30 ? 'Expiring Soon' : 'Valid') : 'Invalid',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ssl-certificates-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SSL Certificates ({filteredCertificates.length})
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search domain or monitor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[250px]"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certificates</SelectItem>
                <SelectItem value="healthy">Healthy (&gt;30 days)</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon (≤30 days)</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleExport} title="Export to CSV">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Monitor</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Days Left</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCertificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No SSL certificates found. Add HTTPS monitors to see SSL certificate information.
                </TableCell>
              </TableRow>
            ) : (
              filteredCertificates.map((cert) => (
                <SSLCertificateRow key={cert.id} certificate={cert} />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SSLCertificateRow({ certificate: cert }: { certificate: SSLCertificateWithMonitor }) {
  const daysUntilExpiry = cert.daysUntilExpiry ?? 0;
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

  let statusBadge = (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      Valid
    </Badge>
  );

  if (!cert.isValid) {
    statusBadge = (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />
        Invalid
      </Badge>
    );
  } else if (isExpired) {
    statusBadge = (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />
        Expired
      </Badge>
    );
  } else if (isExpiringSoon) {
    statusBadge = (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Expiring Soon
      </Badge>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          {cert.domain}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{cert.monitorName}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {cert.monitorUrl}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <SSLGradeBadge grade={cert.grade} />
      </TableCell>
      <TableCell>
        {cert.validTo ? new Date(cert.validTo).toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell>
        <span
          className={`font-medium ${
            isExpired
              ? 'text-red-600'
              : isExpiringSoon
              ? 'text-amber-600'
              : 'text-emerald-600'
          }`}
        >
          {cert.daysUntilExpiry ?? 'N/A'}
        </span>
      </TableCell>
      <TableCell>{statusBadge}</TableCell>
      <TableCell className="text-right">
        <Link href={`/home/monitors/${cert.monitorId}`}>
          <Button variant="ghost" size="sm">
            View
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}
