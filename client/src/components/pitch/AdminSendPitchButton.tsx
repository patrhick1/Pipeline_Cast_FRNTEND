import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mail, Crown, Users } from 'lucide-react';
import { usePitchSending } from '@/hooks/usePitchSending';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SendingAccount } from '@/services/adminSendingAccounts';
import { Badge } from '@/components/ui/badge';

interface AdminSendPitchButtonProps {
  pitchGenId: number;
  campaignId: string;
  recipientEmail?: string | null;
  clientSubscriptionPlan?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  buttonText?: string;
}

export function AdminSendPitchButton({
  pitchGenId,
  campaignId,
  recipientEmail,
  clientSubscriptionPlan,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  buttonText = 'Send Pitch'
}: AdminSendPitchButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const isStaffOrAdmin = user?.role?.toLowerCase() === 'staff' || user?.role?.toLowerCase() === 'admin';
  const isPremiumClient = clientSubscriptionPlan === 'paid_premium';

  // Fetch available sending accounts for admin/staff
  const { data: sendingAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['/api/admin/sending-accounts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/sending-accounts');
      if (!response.ok) {
        console.error('Failed to fetch sending accounts:', response.status);
        throw new Error('Failed to fetch sending accounts');
      }
      const accounts: SendingAccount[] = await response.json();
      // Filter to only active accounts with capacity
      return accounts.filter(acc =>
        acc.is_active &&
        acc.sends_today < acc.daily_send_limit
      );
    },
    enabled: isStaffOrAdmin && isPremiumClient,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Send pitch mutation using admin account
  const sendPitchMutation = useMutation({
    mutationFn: async ({ accountId, pitchGenId, recipientEmail }: {
      accountId: string;
      pitchGenId: number;
      recipientEmail?: string | null;
    }) => {
      const response = await apiRequest('POST', '/admin/send-pitch', {
        sending_account_id: accountId,
        pitch_gen_id: pitchGenId,
        recipient_email: recipientEmail || undefined
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send pitch');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pitch sent successfully from admin account"
      });
      setShowSendDialog(false);
      setSelectedAccount('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (!selectedAccount) {
      toast({
        title: "Error",
        description: "Please select a sending account",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    sendPitchMutation.mutate({
      accountId: selectedAccount,
      pitchGenId,
      recipientEmail
    });
    setIsSending(false);
  };

  // If not staff/admin or not premium client, use regular send button
  if (!isStaffOrAdmin || !isPremiumClient) {
    return null; // Let the regular SendPitchButton handle it
  }

  const availableAccounts = sendingAccounts || [];
  const hasAvailableAccounts = availableAccounts.length > 0;

  return (
    <>
      <Button
        onClick={() => setShowSendDialog(true)}
        disabled={disabled || !hasAvailableAccounts || loadingAccounts}
        variant={variant}
        size={size}
        className={className}
      >
        {loadingAccounts ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </>
        ) : !hasAvailableAccounts ? (
          <>
            <Mail className="h-4 w-4 mr-2 opacity-50" />
            No Accounts Available
          </>
        ) : (
          <>
            {showIcon && <Crown className="h-4 w-4 mr-2 text-yellow-500" />}
            {buttonText} (Premium)
          </>
        )}
      </Button>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Send Pitch for Premium Client
            </DialogTitle>
            <DialogDescription>
              Select an admin sending account to send this pitch on behalf of the premium client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {recipientEmail && recipientEmail !== null && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Recipient:</span>
                <Badge variant="secondary">{recipientEmail}</Badge>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Sending Account
              </label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sending account" />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.map((account) => {
                    const usagePercent = (account.sends_today / account.daily_send_limit) * 100;
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.email}</span>
                          <div className="ml-4 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {account.sends_today}/{account.daily_send_limit} sent
                            </span>
                            {usagePercent >= 80 && (
                              <Badge variant="destructive" className="text-xs">
                                {usagePercent.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedAccount && (
                <p className="text-xs text-muted-foreground">
                  The pitch will be sent from this account's email address.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedAccount || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}