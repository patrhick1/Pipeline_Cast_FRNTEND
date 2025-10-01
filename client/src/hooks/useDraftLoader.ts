import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { draftsApi, adminDraftsApi, type Draft } from '@/services/drafts';

interface UseDraftLoaderOptions {
  threadId?: string;
  isAdminInbox?: boolean;
  adminAccountId?: number;
  enabled?: boolean; // Allow disabling the query
}

interface UseDraftLoaderReturn {
  draft: Draft | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to load existing draft for a specific thread
 *
 * Features:
 * - Fetches all drafts and filters by thread_id
 * - Returns the draft if one exists for the thread
 * - Caches results using React Query
 * - Works with both client and admin inbox
 */
export function useDraftLoader({
  threadId,
  isAdminInbox = false,
  adminAccountId,
  enabled = true,
}: UseDraftLoaderOptions): UseDraftLoaderReturn {
  const [draft, setDraft] = useState<Draft | null>(null);

  // Fetch drafts list using React Query
  const {
    data: draftsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: isAdminInbox
      ? ['admin-drafts', adminAccountId]
      : ['drafts'],
    queryFn: async () => {
      if (isAdminInbox && adminAccountId) {
        return adminDraftsApi.listDrafts(adminAccountId, 100, 0);
      } else {
        return draftsApi.listDrafts(100, 0);
      }
    },
    enabled: enabled && (!isAdminInbox || !!adminAccountId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Filter drafts by thread_id when data loads
  useEffect(() => {
    if (draftsData?.drafts && threadId) {
      // Find draft for this thread (only status === 'draft', not scheduled)
      const threadDraft = draftsData.drafts.find(
        (d) => d.thread_id === threadId && d.status === 'draft'
      );

      setDraft(threadDraft || null);
    } else {
      setDraft(null);
    }
  }, [draftsData, threadId]);

  return {
    draft,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  };
}
