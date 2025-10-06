// client/src/hooks/useFollowUpReminders.ts

import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { isPast, isUpcoming } from "@/lib/timezone";

interface Placement {
  placement_id: number;
  campaign_id: string;
  media_id: number;
  current_status?: string | null;
  follow_up_date?: string | null;
  meeting_date?: string | null;
  recording_date?: string | null;
  go_live_date?: string | null;
  outreach_topic?: string | null;
  notes?: string | null;
  created_at: string;
  // Enriched fields
  campaign_name?: string | null;
  client_name?: string | null;
  media_name?: string | null;
  media_website?: string | null;
}

interface PaginatedPlacementList {
  items: Placement[];
  total: number;
  page: number;
  size: number;
}

interface FollowUpRemindersData {
  overdue: Placement[];
  upcoming: Placement[];
  total: number;
  overdueCount: number;
  upcomingCount: number;
}

/**
 * Hook to fetch and categorize placements with follow-up dates
 * Separates them into overdue (past) and upcoming (next 7 days)
 */
export function useFollowUpReminders() {
  const { data, isLoading, error, refetch } = useQuery<PaginatedPlacementList>({
    queryKey: ["/placements/my-placements", { page: 1, size: 100 }],
    queryFn: getQueryFn<PaginatedPlacementList>(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });

  // Process placements to categorize by follow-up status
  const reminders: FollowUpRemindersData = {
    overdue: [],
    upcoming: [],
    total: 0,
    overdueCount: 0,
    upcomingCount: 0,
  };

  if (data?.items) {
    // Filter placements that have follow_up_date set
    const placementsWithFollowUp = data.items.filter(
      (p) => p.follow_up_date && p.current_status !== 'paid' && p.current_status !== 'rejected' && p.current_status !== 'cancelled'
    );

    // Categorize into overdue and upcoming
    placementsWithFollowUp.forEach((placement) => {
      if (!placement.follow_up_date) return;

      if (isPast(placement.follow_up_date)) {
        reminders.overdue.push(placement);
      } else if (isUpcoming(placement.follow_up_date, 7)) {
        reminders.upcoming.push(placement);
      }
    });

    // Sort overdue by oldest first (most urgent)
    reminders.overdue.sort((a, b) => {
      const aDate = a.follow_up_date ? new Date(a.follow_up_date).getTime() : 0;
      const bDate = b.follow_up_date ? new Date(b.follow_up_date).getTime() : 0;
      return aDate - bDate;
    });

    // Sort upcoming by soonest first
    reminders.upcoming.sort((a, b) => {
      const aDate = a.follow_up_date ? new Date(a.follow_up_date).getTime() : 0;
      const bDate = b.follow_up_date ? new Date(b.follow_up_date).getTime() : 0;
      return aDate - bDate;
    });

    reminders.overdueCount = reminders.overdue.length;
    reminders.upcomingCount = reminders.upcoming.length;
    reminders.total = reminders.overdueCount + reminders.upcomingCount;
  }

  return {
    reminders,
    isLoading,
    error,
    refetch,
  };
}
