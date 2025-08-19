import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { 
  StoredEmailThread, 
  CampaignThreadSummary, 
  RecentReply,
  EmailThreadFilters 
} from '@/types/emailThreads';
import type { EmailThread } from '@/types/inbox';

export function useEmailThreads() {
  const { toast } = useToast();

  // Get thread from unified inbox system
  const useStoredThread = (nylasThreadId: string) => {
    return useQuery<StoredEmailThread | EmailThread>({
      queryKey: ['/inbox/threads', nylasThreadId],
      queryFn: async () => {
        // Use unified inbox endpoint that now queries stored data
        const res = await apiRequest('GET', `/inbox/threads/${nylasThreadId}`);
        if (!res.ok) throw new Error('Failed to fetch thread');
        const data = await res.json();
        return { ...data, source: 'stored' }; // All data is now stored
      },
      staleTime: 30000, // Consider data fresh for 30 seconds
    });
  };

  // Get all threads for a campaign using unified inbox
  const useCampaignThreads = (campaignId: string, filters?: EmailThreadFilters) => {
    return useQuery<EmailThread[]>({
      queryKey: ['/inbox/threads', { campaign_id: campaignId, ...filters }],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append('campaign_id', campaignId);
        if (filters?.has_replies !== undefined) {
          params.append('has_replies', String(filters.has_replies));
        }
        if (filters?.limit) {
          params.append('limit', String(filters.limit));
        }
        
        // Use unified inbox endpoint with campaign filter
        const res = await apiRequest(
          'GET', 
          `/inbox/threads?${params}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            return [];
          }
          throw new Error('Failed to fetch campaign threads');
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      },
      enabled: !!campaignId && campaignId.length > 0,
    });
  };

  // Get thread for a specific pitch using unified inbox
  const usePitchThread = (pitchId: number) => {
    return useQuery<EmailThread>({
      queryKey: ['/inbox/threads', { pitch_id: pitchId }],
      queryFn: async () => {
        // Use unified inbox with pitch filter
        const res = await apiRequest('GET', `/inbox/threads?pitch_id=${pitchId}`);
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch pitch thread');
        }
        const data = await res.json();
        // Return first thread if multiple (should be only one per pitch)
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
      },
      enabled: pitchId > 0,
    });
  };

  // Get thread for a placement using unified inbox
  const usePlacementThread = (placementId: number) => {
    return useQuery<EmailThread>({
      queryKey: ['/inbox/threads', { placement_id: placementId }],
      queryFn: async () => {
        // Use unified inbox with placement filter
        const res = await apiRequest('GET', `/inbox/threads?placement_id=${placementId}`);
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch placement thread');
        }
        const data = await res.json();
        // Return first thread if multiple
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
      },
      enabled: placementId > 0,
    });
  };

  // Get recent replies using unified inbox with filters
  const useRecentReplies = (filters?: EmailThreadFilters) => {
    return useQuery<EmailThread[]>({
      queryKey: ['/inbox/threads', { has_replies: true, ...filters }],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append('has_replies', 'true'); // Only threads with replies
        params.append('sort', 'last_reply_desc'); // Sort by most recent reply
        if (filters?.limit) {
          params.append('limit', String(filters.limit));
        }
        if (filters?.campaign_id) {
          params.append('campaign_id', filters.campaign_id);
        }
        
        // Use unified inbox with reply filter
        const res = await apiRequest(
          'GET', 
          `/inbox/threads?${params}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            return [];
          }
          throw new Error('Failed to fetch recent replies');
        }
        const data = await res.json();
        // Handle paginated response structure
        if (data && data.threads && Array.isArray(data.threads)) {
          return data.threads;
        }
        // Fallback for array response
        return Array.isArray(data) ? data : [];
      },
      refetchInterval: 60000, // Poll every minute for new replies
    });
  };

  // Mark thread as read using unified inbox
  const markThreadAsRead = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await apiRequest('POST', `/inbox/threads/${threadId}/mark-read`);
      if (!res.ok) throw new Error('Failed to mark thread as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    },
  });

  // Sync thread using unified inbox
  const syncThread = useMutation({
    mutationFn: async (nylasThreadId: string) => {
      const res = await apiRequest('POST', `/inbox/sync`);
      if (!res.ok) throw new Error('Failed to sync');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Inbox synced',
        description: 'Email inbox has been synced successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    },
    onError: () => {
      toast({
        title: 'Sync failed',
        description: 'Failed to sync inbox. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    useStoredThread,
    useCampaignThreads,
    usePitchThread,
    usePlacementThread,
    useRecentReplies,
    markThreadAsRead,
    syncThread,
  };
}