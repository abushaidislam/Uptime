import type { SSLGrade } from '~/lib/status-vault/types';
import { Badge } from '@kit/ui/badge';

interface SSLGradeBadgeProps {
  grade?: SSLGrade;
}

const gradeConfig: Record<SSLGrade, { color: string; bg: string; label: string }> = {
  'A+': { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'A+' },
  'A': { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'A' },
  'B': { color: 'text-blue-600', bg: 'bg-blue-50', label: 'B' },
  'C': { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'C' },
  'D': { color: 'text-orange-600', bg: 'bg-orange-50', label: 'D' },
  'F': { color: 'text-red-600', bg: 'bg-red-50', label: 'F' },
  'Unknown': { color: 'text-gray-600', bg: 'bg-gray-100', label: '?' },
};

export function SSLGradeBadge({ grade }: SSLGradeBadgeProps) {
  const config = grade ? gradeConfig[grade] : gradeConfig['Unknown'];

  return (
    <Badge variant="outline" className={`${config.bg} ${config.color} border-transparent font-bold`}>
      {config.label}
    </Badge>
  );
}
