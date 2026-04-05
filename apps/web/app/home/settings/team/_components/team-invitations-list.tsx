'use client';

import { useState } from 'react';
import { Clock, X, Loader2, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import type { TeamInvitationWithDetails } from '~/lib/status-vault/types';
import { cancelTeamInvitation } from '~/lib/status-vault/actions';
import { toast } from 'sonner';

interface TeamInvitationsListProps {
  invitations: TeamInvitationWithDetails[];
}

export function TeamInvitationsList({ invitations }: TeamInvitationsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (invitation: TeamInvitationWithDetails) => {
    setCancellingId(invitation.id);
    try {
      await cancelTeamInvitation(invitation.id);
      toast.success(`Invitation to ${invitation.email} has been cancelled`);
      window.location.reload();
    } catch {
      toast.error('Failed to cancel invitation');
    } finally {
      setCancellingId(null);
    }
  };

  const getExpiryText = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    if (days === 1) return 'Expires in 1 day';
    return `Expires in ${days} days`;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge
                      variant="outline"
                      className={
                        invitation.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {getExpiryText(invitation.expiresAt)}
                    <span className="text-xs">
                      • Invited by {invitation.invitedByName || invitation.invitedByEmail || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(invitation)}
                disabled={cancellingId === invitation.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {cancellingId === invitation.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
