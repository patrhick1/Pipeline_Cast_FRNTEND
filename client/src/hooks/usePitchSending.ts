import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { NylasAuthStatus } from '@/types/inbox';

interface SendPitchResult {
  success: boolean;
  message: string;
  provider: string;
  nylas_message_id?: string;
  nylas_thread_id?: string;
  recipient_email?: string;
  pitch_gen_id?: number;
}

interface BatchSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendPitchResult[];
}

export function usePitchSending() {
  const { toast } = useToast();
  const [sendingPitchIds, setSendingPitchIds] = useState<Set<number>>(new Set());

  // Check Nylas connection status
  const { data: nylasStatus, isLoading: isLoadingStatus } = useQuery<NylasAuthStatus>({
    queryKey: ['/inbox/nylas-status'],
    refetchInterval: 60000, // Check every minute
  });

  const isEmailConnected = nylasStatus?.connected === true && nylasStatus?.grants && nylasStatus.grants.length > 0;
  const connectedEmail = nylasStatus?.grants?.[0]?.email || nylasStatus?.email;

  // Send single pitch via Nylas
  const sendPitchMutation = useMutation({
    mutationFn: async ({ pitchGenId, recipientEmail }: { pitchGenId: number; recipientEmail?: string }) => {
      if (!isEmailConnected) {
        throw new Error('Please connect your email account first');
      }

      setSendingPitchIds(prev => new Set(prev).add(pitchGenId));
      
      const body = recipientEmail ? { recipient_email: recipientEmail } : {};
      
      const response = await apiRequest(
        'POST',
        `/pitches/send-nylas/${pitchGenId}`,
        body
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'Failed to send pitch' 
        }));
        throw new Error(errorData.message || errorData.detail || 'Failed to send pitch');
      }

      return response.json() as Promise<SendPitchResult>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Pitch Sent Successfully',
        description: `Sent to ${data.recipient_email || 'recipient'} via Gmail`,
      });

      // Invalidate relevant queries to refresh all tabs
      queryClient.invalidateQueries({ queryKey: ['approvedMatchesForPitching'] });
      queryClient.invalidateQueries({ queryKey: ['pitchDraftsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pitchesReadyToSend'] });
      queryClient.invalidateQueries({ queryKey: ['sentPitchesStatus'] });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error.message);
      toast({
        title: 'Failed to Send Pitch',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSettled: (_, __, { pitchGenId }) => {
      setSendingPitchIds(prev => {
        const next = new Set(prev);
        next.delete(pitchGenId);
        return next;
      });
    }
  });

  // Send batch pitches via Nylas
  const sendBatchMutation = useMutation({
    mutationFn: async (pitchGenIds: number[]) => {
      if (!isEmailConnected) {
        throw new Error('Please connect your email account first');
      }

      pitchGenIds.forEach(id => 
        setSendingPitchIds(prev => new Set(prev).add(id))
      );

      const response = await apiRequest(
        'POST',
        '/pitches/send-batch-nylas',
        { pitch_gen_ids: pitchGenIds }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'Failed to send pitches' 
        }));
        throw new Error(errorData.message || errorData.detail || 'Failed to send pitches');
      }

      return response.json() as Promise<BatchSendResult>;
    },
    onSuccess: (data) => {
      const { successful, failed, results } = data;
      
      // Show individual results
      results.forEach(result => {
        if (result.success) {
          console.log(`✓ Sent to ${result.recipient_email}`);
        } else {
          console.error(`✗ Failed: ${result.message}`);
        }
      });

      // Show summary toast
      let description = `Successfully sent ${successful} pitch${successful !== 1 ? 'es' : ''}`;
      if (failed > 0) {
        description += ` (${failed} failed)`;
      }

      toast({
        title: 'Batch Send Complete',
        description,
        variant: failed > 0 ? 'default' : 'default',
      });

      // Invalidate queries to refresh all tabs
      queryClient.invalidateQueries({ queryKey: ['approvedMatchesForPitching'] });
      queryClient.invalidateQueries({ queryKey: ['pitchDraftsForReview'] });
      queryClient.invalidateQueries({ queryKey: ['pitchesReadyToSend'] });
      queryClient.invalidateQueries({ queryKey: ['sentPitchesStatus'] });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error.message);
      toast({
        title: 'Batch Send Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSettled: (_, __, pitchGenIds) => {
      setSendingPitchIds(prev => {
        const next = new Set(prev);
        pitchGenIds.forEach(id => next.delete(id));
        return next;
      });
    }
  });

  // Connect email (redirect to OAuth)
  const connectEmail = () => {
    apiRequest('POST', '/inbox/nylas/connect')
      .then(res => res.json())
      .then(data => {
        if (data.oauth_url) {
          window.location.href = data.oauth_url;
        } else if (data.auth_url) {
          // Fallback for old response format
          window.location.href = data.auth_url;
        }
      })
      .catch(error => {
        toast({
          title: 'Connection Failed',
          description: 'Failed to initiate Gmail connection',
          variant: 'destructive',
        });
      });
  };

  // Disconnect email
  const disconnectEmailMutation = useMutation({
    mutationFn: async () => {
      if (!isEmailConnected || !nylasStatus?.grants || nylasStatus.grants.length === 0) {
        throw new Error('No connected account found');
      }

      // Get the grant_id from the first grant
      const grantId = nylasStatus.grants[0].grant_id;
      
      const response = await apiRequest(
        'POST',
        `/inbox/nylas/disconnect?grant_id=${grantId}`,
        {}
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'Failed to disconnect Gmail' 
        }));
        throw new Error(errorData.message || errorData.detail || 'Failed to disconnect Gmail');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Gmail Disconnected',
        description: 'Your Gmail account has been disconnected successfully',
      });
      
      // Invalidate the status query to refresh connection state
      queryClient.invalidateQueries({ queryKey: ['/inbox/nylas-status'] });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect Gmail account',
        variant: 'destructive',
      });
    }
  });

  // Helper function to check if a pitch is currently sending
  const isPitchSending = (pitchGenId: number) => sendingPitchIds.has(pitchGenId);

  return {
    // Status
    isEmailConnected,
    connectedEmail,
    isLoadingStatus,
    
    // Actions
    sendPitch: (pitchGenId: number, recipientEmail?: string) => 
      sendPitchMutation.mutate({ pitchGenId, recipientEmail }),
    sendBatch: sendBatchMutation.mutate,
    connectEmail,
    disconnectEmail: disconnectEmailMutation.mutate,
    
    // Loading states
    isSending: sendPitchMutation.isPending || sendBatchMutation.isPending,
    isDisconnecting: disconnectEmailMutation.isPending,
    isPitchSending,
    sendingPitchIds: Array.from(sendingPitchIds),
    
    // Mutations for advanced usage
    sendPitchMutation,
    sendBatchMutation,
    disconnectEmailMutation,
  };
}

// Error message mapping
function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'No active email account connected': 'Please connect your Gmail account first',
    'No contact email found': 'This podcast has no email address',
    'Invalid grant': 'Email connection expired. Please reconnect.',
    'Rate limit exceeded': 'Too many emails sent. Please wait before sending more.',
    'Please connect your email account first': 'Connect your Gmail to send pitches',
  };

  return errorMessages[error] || error;
}