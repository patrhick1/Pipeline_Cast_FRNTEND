// client/src/pages/Approvals.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient"; // Use appQueryClient
import { 
  CheckCircle, Clock, XCircle, Search, Filter, Podcast, Users, ExternalLink, ThumbsUp, ThumbsDown, Edit3, Eye, MessageSquare,
  ChevronLeft, ChevronRight, ListChecks, Info, CheckSquare, Square, Sparkles // Added ListChecks for Total icon and Info for details
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // For loading states
import { MatchIntelligenceCard } from "@/components/MatchIntelligenceCard";
import { PitchReviewCard } from "@/components/PitchReviewCard";
import { PodcastDetailsModal } from "@/components/modals/PodcastDetailsModal";
import { BatchAIGenerateButton } from "@/components/pitch/BatchAIGenerateButton";
import { usePitchCapabilities } from "@/hooks/usePitchCapabilities";

export interface ReviewTask {
  review_task_id: number;
  task_type: 'match_suggestion' | 'pitch_review' | string;
  related_id: number;
  campaign_id?: string | null; // UUID string
  assigned_to_id?: number | null; // Corresponds to 'assigned_to' in DB
  status: 'pending' | 'approved' | 'rejected' | 'completed' | string;
  notes?: string | null;
  reject_reason?: string | null; // NEW field for rejection reasons
  created_at: string; // ISO datetime string
  completed_at?: string | null; // ISO datetime string

  // --- Enhanced endpoint fields ---
  campaign_name?: string;
  client_name?: string | null;
  media_id?: number;
  media_name?: string;
  media_website?: string;
  media_image_url?: string;
  media_description?: string;
  discovery_keyword?: string;
  discovered_at?: string;
  vetting_score?: number | null;
  vetting_reasoning?: string | null;
  vetting_criteria_met?: any | null;
  match_score?: number | null;
  reach_estimate_min?: number | null;
  reach_estimate_max?: number | null;
  matched_keywords?: string[] | null;
  best_matching_episode_id?: number | null;
  recommendation?: string;
  key_highlights?: string[];
  potential_concerns?: string[];
  host_names?: string[];
  podcast_twitter_url?: string | null;
  podcast_linkedin_url?: string | null;
  podcast_instagram_url?: string | null;
  podcast_facebook_url?: string | null;
  podcast_youtube_url?: string | null;
  podcast_tiktok_url?: string | null;
  // Pitch review specific fields
  pitch_body_full?: string;
  pitch_subject_line?: string;
  pitch_gen_id?: number;
}

// --- From podcast_outreach/api/schemas/match_schemas.py ---
export interface MatchSuggestion { // MatchSuggestionInDB
  match_id: number;
  campaign_id: string; // UUID string
  media_id: number;
  match_score?: number | null;
  reach_estimate_min?: number | null;
  reach_estimate_max?: number | null;
  matched_keywords?: string[] | null;
  ai_reasoning?: string | null;
  vetting_reasoning?: string | null; // Added this field
  status: string; // 'pending_human_review', 'approved_by_client', 'rejected_by_client', etc.
  client_approved: boolean;
  approved_at?: string | null; // ISO datetime string
  created_at: string; // ISO datetime string
  media?: Media; // This will be the enriched Media object
  media_name?: string; // Fallback - make it optional since it might not always be present
}

// --- From podcast_outreach/api/schemas/media_schemas.py ---
export interface Media { // MediaInDB
  media_id: number;
  name: string | null;
  title?: string | null;
  rss_url?: string | null;
  rss_feed_url?: string | null;
  website?: string | null;
  description?: string | null;
  ai_description?: string | null;
  contact_email?: string | null;
  language?: string | null;
  category?: string | null;
  image_url?: string | null;
  company_id?: number | null;
  avg_downloads?: number | null;
  audience_size?: number | null;
  total_episodes?: number | null;
  itunes_id?: string | null;
  podcast_spotify_id?: string | null;
  listen_score?: number | null;
  listen_score_global_rank?: number | null;
  itunes_rating_average?: number | null;
  itunes_rating_count?: number | null;
  spotify_rating_average?: number | null;
  spotify_rating_count?: number | null;
  fetched_episodes?: boolean;
  source_api?: string | null;
  api_id?: string | null; // ID from the source_api
  last_posted_at?: string | null; // ISO datetime string
  podcast_twitter_url?: string | null;
  podcast_linkedin_url?: string | null;
  podcast_instagram_url?: string | null;
  podcast_facebook_url?: string | null;
  podcast_youtube_url?: string | null;
  podcast_tiktok_url?: string | null;
  podcast_other_social_url?: string | null;
  host_names?: string[] | null; // From your DB schema
  // --- Fields for Match Intelligence Card ---
  quality_score?: number | null;
  quality_score_recency?: number | null;
  quality_score_frequency?: number | null;
  quality_score_audience?: number | null;
  quality_score_social?: number | null;
  // embedding is omitted
  created_at: string; // ISO datetime string
}

// --- From podcast_outreach/api/schemas/campaign_schemas.py ---
export interface Campaign { // CampaignInDB
  campaign_id: string; // UUID string
  person_id: number;
  attio_client_id?: string | null; // UUID string
  campaign_name: string;
  campaign_type?: string | null;
  campaign_bio?: string | null; // Link to GDoc or text
  campaign_angles?: string | null; // Link to GDoc or text
  campaign_keywords?: string[] | null;
  compiled_social_posts?: string | null;
  podcast_transcript_link?: string | null;
  compiled_articles_link?: string | null;
  mock_interview_trancript?: string | null;
  // embedding is omitted
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
  goal_note?: string | null;
  media_kit_url?: string | null;
  instantly_campaign_id?: string | null; // Added from your backend schema
  created_at: string; // ISO datetime string
}

// --- From podcast_outreach/api/schemas/person_schemas.py ---
export interface Person { // PersonInDB
  person_id: number;
  company_id?: number | null;
  full_name: string | null;
  email: string;
  linkedin_profile_url?: string | null;
  twitter_profile_url?: string | null;
  instagram_profile_url?: string | null;
  tiktok_profile_url?: string | null;
  dashboard_username?: string | null;
  // dashboard_password_hash is intentionally omitted for client-side
  attio_contact_id?: string | null; // UUID string
  role?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// --- From podcast_outreach/api/schemas/pitch_schemas.py ---
export interface PitchGeneration { // PitchGenerationInDB
  pitch_gen_id: number;
  campaign_id: string; // UUID string
  media_id: number;
  template_id: string;
  draft_text: string;
  ai_model_used?: string | null;
  pitch_topic?: string | null;
  temperature?: number | null;
  generated_at: string; // ISO datetime string
  reviewer_id?: string | null;
  reviewed_at?: string | null; // ISO datetime string
  final_text?: string | null;
  send_ready_bool?: boolean | null;
  generation_status?: string | null; // e.g., 'draft', 'approved'
}

const reviewTaskStatusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700", dotColor: "bg-yellow-500" },
  approved: { label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700", dotColor: "bg-red-500" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500" },
  default: { label: "Unknown", icon: Clock, color: "bg-gray-100 text-gray-700", dotColor: "bg-gray-500" },
};

// --- ReviewTaskItem Component ---
function ReviewTaskItem({ 
  task, 
  isSelectable = false,
  isSelected = false,
  onSelect
}: { 
  task: ReviewTask;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: number) => void;
}) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [showPodcastDetails, setShowPodcastDetails] = useState(false);

  // Enhanced endpoint provides all data, no need for separate queries
  const relatedData = {
    entityName: task.media_name || `Task for ID: ${task.related_id}`,
    campaignName: task.campaign_name || "N/A",
    clientName: task.client_name || "N/A",
    mediaUrl: task.media_website || undefined,
    pitchDraftPreview: undefined, // Not provided in enhanced response for pitch tasks
    match_suggestion: task.task_type === 'match_suggestion' ? {
      match_id: task.related_id,
      campaign_id: task.campaign_id || '',
      media_id: task.media_id || 0,
      match_score: task.match_score,
      reach_estimate_min: task.reach_estimate_min,
      reach_estimate_max: task.reach_estimate_max,
      matched_keywords: null, // Remove keyword overlap
      ai_reasoning: task.vetting_reasoning,
      vetting_reasoning: task.vetting_reasoning,
      vetting_score: task.vetting_score,
      status: task.status,
      client_approved: task.status === 'approved',
      created_at: task.created_at,
      media: task.media_id ? {
        media_id: task.media_id,
        name: task.media_name || null,
        website: task.media_website || null,
        image_url: task.media_image_url || null,
        description: task.media_description || null,
        created_at: task.created_at,
        ai_description: null,
        contact_email: null,
        language: null,
        category: null,
        company_id: null,
        avg_downloads: null,
        audience_size: null,
        total_episodes: null,
        itunes_id: null,
        podcast_spotify_id: null,
        listen_score: null,
        listen_score_global_rank: null,
        itunes_rating_average: null,
        itunes_rating_count: null,
        spotify_rating_average: null,
        spotify_rating_count: null,
        fetched_episodes: null,
        source_api: null,
        api_id: null,
        last_posted_at: null,
        podcast_twitter_url: task.podcast_twitter_url || null,
        podcast_linkedin_url: task.podcast_linkedin_url || null,
        podcast_instagram_url: task.podcast_instagram_url || null,
        podcast_facebook_url: task.podcast_facebook_url || null,
        podcast_youtube_url: task.podcast_youtube_url || null,
        podcast_tiktok_url: task.podcast_tiktok_url || null,
        podcast_other_social_url: null,
        host_names: task.host_names || null,
        quality_score: null,
        quality_score_recency: null,
        quality_score_frequency: null,
        quality_score_audience: null,
        quality_score_social: null
      } : undefined,
      media_name: task.media_name
    } as MatchSuggestion : null
  };
  
  const isLoadingRelated = false;
  const relatedDataError = null;

  const reviewActionMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string; payload: any }) => {
      const response = await apiRequest("POST", endpoint, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Action failed" }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate both the filtered and unfiltered queries
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/enhanced"] });
      toast({ title: "Action Successful", description: `Task ${variables.payload.status || 'processed'}.` });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Could not process the review action.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = () => {
    // Use the approve endpoint for match suggestions
    reviewActionMutation.mutate({ 
      endpoint: `/review-tasks/${task.review_task_id}/approve`, 
      payload: { 
        status: 'approved', 
        notes: 'Approved by team via UI' 
      } 
    });
  };

  const handleReject = (rejectReason?: string) => {
    // Use the new approve endpoint with rejected status and optional reject_reason
    reviewActionMutation.mutate({ 
      endpoint: `/review-tasks/${task.review_task_id}/approve`, 
      payload: { 
        status: 'rejected', 
        notes: 'Rejected by team via UI',
        reject_reason: rejectReason || undefined
      } 
    });
  };

  const currentStatusConfig = reviewTaskStatusConfig[task.status as keyof typeof reviewTaskStatusConfig] || reviewTaskStatusConfig.default;
  const StatusIcon = currentStatusConfig.icon;

  if (isLoadingRelated) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-2/5 mb-2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
          <Skeleton className="h-3 w-1/3 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/3" />
          <div className="flex space-x-2 pt-4 border-t">
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-9 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (relatedDataError) {
     return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 text-base">Error loading details for Task ID: {task.review_task_id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">{(relatedDataError as Error).message}</p>
          <p className="text-xs text-gray-500 mt-1">Task Type: {task.task_type}, Related ID: {task.related_id}</p>
        </CardContent>
      </Card>
     );
  }

  // --- NEW: Render MatchIntelligenceCard for match_suggestion tasks ---
  if (task.task_type === 'match_suggestion' && relatedData?.match_suggestion) {
    const isActionPending = reviewActionMutation.isPending;
    return (
      <MatchIntelligenceCard
        match={relatedData.match_suggestion}
        onApprove={() => handleApprove()} // `handleApprove` already knows the context
        onReject={(matchId, rejectReason) => handleReject(rejectReason)}   // Pass reject reason
        isActionPending={isActionPending}
        rejectReason={task.reject_reason || undefined}
        isSelectable={isSelectable && task.status === 'pending'}
        isSelected={isSelected}
        onSelect={() => onSelect?.(task.review_task_id)}
      />
    );
  }
  
  // --- NEW: Render PitchReviewCard for pitch_review tasks ---
  if (task.task_type === 'pitch_review') {
    const isActionPending = reviewActionMutation.isPending;
    return (
      <PitchReviewCard
        task={task}
        onApprove={() => handleApprove()}
        onReject={(rejectReason) => handleReject(rejectReason)}
        isActionPending={isActionPending}
      />
    );
  }
  
  // --- Fallback to original card for other task types ---
  return (
    <>
    <Card className="hover:shadow-lg transition-shadow duration-150">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1.5">
              <Badge className={`${currentStatusConfig.color} font-medium text-xs px-2 py-0.5`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {currentStatusConfig.label}
              </Badge>
              <Badge variant="outline" className="capitalize text-xs px-2 py-0.5">{task.task_type.replace('_', ' ')}</Badge>
              {task.task_type === 'match_suggestion' && (
                <div className="flex items-center space-x-2">
                  {typeof task.match_score === 'number' && (
                    <Badge variant="default" className="text-xs bg-blue-600 text-white">
                      Match: {Math.round(task.match_score)}%
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    Reach: {formatReachNumber(task.reach_estimate_min || 10000)}-{formatReachNumber(task.reach_estimate_max || 50000)}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <CardTitle className="text-base md:text-md leading-tight">{relatedData?.entityName || `Task for ID: ${task.related_id}`}</CardTitle>
              {task.media_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPodcastDetails(true);
                  }}
                >
                  <Info className="w-3 h-3 mr-1" />
                  Details
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Campaign: {relatedData?.campaignName || "N/A"} | Client: {relatedData?.clientName || "N/A"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Created: {new Date(task.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2.5 text-sm pt-0">
        {task.task_type === 'match_suggestion' && task.vetting_reasoning && (
            <div className="bg-indigo-50 p-2.5 rounded-md border border-indigo-200">
                <h4 className="text-xs font-semibold text-indigo-700 mb-1 flex items-center">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Fit Assessment:
                </h4>
                <p className="text-indigo-800 text-xs whitespace-pre-wrap">{task.vetting_reasoning}</p>
            </div>
        )}
        {task.task_type === 'pitch_review' && relatedData?.pitchDraftPreview && (
          <div className="bg-gray-50 p-2.5 rounded-md border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 mb-1">PITCH DRAFT PREVIEW:</h4>
            <p className="text-gray-700 italic line-clamp-3 text-xs">{relatedData.pitchDraftPreview}</p>
          </div>
        )}
         {task.recommendations && (
          <div className="bg-blue-50 p-2.5 rounded-md border border-blue-200">
            <h4 className="text-xs font-semibold text-blue-700 mb-1">RECOMMENDATIONS:</h4>
            <p className="text-blue-800 text-xs">{task.recommendations}</p>
          </div>
        )}
        {task.notes && (
          <div className="bg-yellow-50 p-2.5 rounded-md border border-yellow-200">
            <h4 className="text-xs font-semibold text-yellow-700 mb-1">NOTES:</h4>
            <p className="text-yellow-800 text-xs">{task.notes}</p>
          </div>
        )}
        {task.reject_reason && (
          <div className="bg-red-50 p-2.5 rounded-md border border-red-200">
            <h4 className="text-xs font-semibold text-red-700 mb-1">REJECTION REASON:</h4>
            <p className="text-red-800 text-xs">{task.reject_reason}</p>
          </div>
        )}

        {relatedData?.mediaUrl && (
          <div className="pt-1">
            <a 
              href={relatedData.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-primary hover:text-primary/80"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Media/Source
            </a>
          </div>
        )}

        {task.status === 'pending' && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100 mt-3">
            <Button
              onClick={handleApprove}
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1.5 h-auto"
              disabled={reviewActionMutation.isPending}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              size="sm"
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs px-2 py-1.5 h-auto"
              disabled={reviewActionMutation.isPending}
            >
              <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Podcast Details Modal */}
    {task.media_id && (
      <PodcastDetailsModal
        isOpen={showPodcastDetails}
        onClose={() => setShowPodcastDetails(false)}
        mediaId={task.media_id}
        podcastName={task.media_name}
      />
    )}
    </>
  );
}


// Helper function to format reach numbers
function formatReachNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

// --- Main Approvals Page Component ---
const ITEMS_PER_PAGE = 10;

export default function Approvals() {
  const { user } = useAuth();
  const tanstackQueryClient = useTanstackQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [taskTypeFilter, setTaskTypeFilter] = useState<"all" | "match_suggestion">("match_suggestion");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [approvedMatches, setApprovedMatches] = useState<any[]>([]);
  const [showBatchAIGenerate, setShowBatchAIGenerate] = useState(false);
  
  // Determine if user is a client
  const isClient = user?.role?.toLowerCase() === 'client';
  const { canUseAI } = usePitchCapabilities();

  interface PaginatedReviewTasks {
    items: ReviewTask[];
    total: number;
    page: number;
    size: number;
    pages?: number; 
  }
  
  // Enhanced endpoint might return paginated response or array
  interface EnhancedReviewTasksResponse {
    items?: ReviewTask[];
    total?: number;
    page?: number;
    size?: number;
    pages?: number;
  }

  // Always fetch ALL tasks, then filter client-side
  const { data: allTasksData, isLoading, error, isFetching } = useQuery<ReviewTask[], Error>({
    queryKey: ["/review-tasks/enhanced", { 
      task_type: "match_suggestion"
      // Always fetch all, no status filter
    }],
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Use all tasks for stats
  const allTasksForStats = allTasksData || [];
  
  // Filter tasks client-side based on statusFilter
  const allDataResponse = statusFilter === "all" 
    ? allTasksData 
    : allTasksData?.filter(task => task.status === statusFilter);
  
  // Client-side pagination
  const allTasks = allDataResponse || [];
  const totalTasks = allTasks.length;
  const totalPages = Math.ceil(totalTasks / ITEMS_PER_PAGE);
  
  // Apply client-side pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = allTasks.slice(startIndex, endIndex);
  
  // Debug logging
  console.log('Pagination debug:', {
    ITEMS_PER_PAGE,
    totalTasks,
    currentPage,
    startIndex,
    endIndex,
    paginatedTasksLength: paginatedTasks.length,
    totalPages
  });
  
  const reviewTasksData: PaginatedReviewTasks = {
    items: paginatedTasks,
    total: totalTasks,
    page: currentPage,
    size: ITEMS_PER_PAGE,
    pages: totalPages
  };
  
  const reviewTasks = reviewTasksData.items;

  const displayedTasks = reviewTasks.filter((task: ReviewTask) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const relatedIdMatch = task.related_id.toString().includes(term);
    const notesMatch = task.notes?.toLowerCase().includes(term);
    return relatedIdMatch || notesMatch;
  });

  // Calculate stats from all tasks (unfiltered)
  const statsData = allTasksForStats || [];
  const stats = {
    total: statsData.length,
    pending: statsData.filter((task: ReviewTask) => task.status === 'pending').length,
    approved: statsData.filter((task: ReviewTask) => task.status === 'approved').length,
    completed: statsData.filter((task: ReviewTask) => task.status === 'completed').length,
    rejected: statsData.filter((task: ReviewTask) => task.status === 'rejected').length,
  };
  // Define which keys from stats map to reviewTaskStatusConfig
  const statusKeysForStats: Array<keyof Omit<typeof stats, 'total'>> = ['pending', 'approved', 'completed', 'rejected'];


  useEffect(() => {
    setCurrentPage(1);
    setSelectedTasks(new Set()); // Clear selections when filters change
  }, [statusFilter, taskTypeFilter]);

  // Get pending tasks that can be selected (only for clients viewing pending tasks)
  const selectableTasks = displayedTasks.filter(task => 
    task.status === 'pending' && 
    task.task_type === 'match_suggestion'
  );

  // Handle select all for current page
  const handleSelectAll = () => {
    if (selectedTasks.size === selectableTasks.length && selectableTasks.length > 0) {
      // All are selected, deselect all
      setSelectedTasks(new Set());
    } else {
      // Select all on current page
      const newSelected = new Set(selectedTasks);
      selectableTasks.forEach(task => {
        newSelected.add(task.review_task_id);
      });
      setSelectedTasks(newSelected);
    }
  };

  // Handle individual task selection
  const handleTaskSelect = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedTasks.size === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one task to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkApproving(true);
    try {
      const response = await apiRequest("POST", "/review-tasks/bulk-approve", {
        review_task_ids: Array.from(selectedTasks),
        status: "approved",
        notes: "Bulk approved by client via UI"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Bulk approval failed" }));
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      
      // Show success message with details
      // The API returns successful_count and failed_count directly
      const successCount = result.successful_count || 0;
      const failureCount = result.failed_count || 0;
      
      if (successCount > 0) {
        // Collect successfully approved matches for AI generation
        const approvedMatchData = result.details?.filter((d: any) => d.status === "success").map((d: any) => ({
          match_id: d.match_id,
          media_name: displayedTasks.find(t => t.review_task_id === d.review_task_id)?.media_name
        })) || [];
        
        setApprovedMatches(approvedMatchData);
        setShowBatchAIGenerate(true);
        
        toast({
          title: "Bulk Approval Successful",
          description: `Successfully approved ${successCount} match${successCount > 1 ? 'es' : ''}${failureCount > 0 ? `. ${failureCount} failed.` : '.'}`,
        });
      } else if (failureCount > 0) {
        toast({
          title: "Partial Success",
          description: `${failureCount} match${failureCount > 1 ? 'es' : ''} failed to approve. Please try again.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bulk Approval Failed",
          description: "No matches were approved. Please try again.",
          variant: "destructive",
        });
      }

      // Clear selections and refresh data
      setSelectedTasks(new Set());
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/enhanced"] });
    } catch (error: any) {
      toast({
        title: "Bulk Approval Failed",
        description: error.message || "Could not process bulk approval.",
        variant: "destructive",
      });
    } finally {
      setIsBulkApproving(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Review Tasks</h3>
              <p className="text-red-600 mb-4">{error.message}</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {/* Total Card - Rendered Separately */}
        <Card className="shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500 capitalize">Total Tasks</p>
                <p className="text-lg md:text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <ListChecks className={`h-5 w-5 md:h-6 md:w-6 text-gray-500`} />
            </div>
          </CardContent>
        </Card>

        {/* Other Status Cards */}
        {statusKeysForStats.map(key => {
          const statusConf = reviewTaskStatusConfig[key] || reviewTaskStatusConfig.default;
          return (
            <Card key={key} className="shadow-sm">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500 capitalize">{statusConf.label}</p>
                    <p className="text-lg md:text-xl font-bold text-gray-800">{stats[key]}</p>
                  </div>
                  <statusConf.icon className={`h-5 w-5 md:h-6 md:w-6 ${statusConf.color.replace('bg-', 'text-').split(' ')[0]}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-xl">{isClient ? 'Approve Matches' : 'Match Suggestion Approvals'}</CardTitle>
            <CardDescription>
              {isClient 
                ? 'Review and approve podcast matches for your campaigns.' 
                : 'Review and approve AI-generated podcast match suggestions.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
              <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              {/* Task type filter removed - only showing match suggestions */}
            </div>
          </div>

          {/* Batch AI Generation Bar - Show after successful bulk approval */}
          {showBatchAIGenerate && approvedMatches.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      {approvedMatches.length} Match{approvedMatches.length > 1 ? 'es' : ''} Approved!
                    </p>
                    <p className="text-sm text-green-700">
                      Would you like to generate AI pitches for these matches?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canUseAI ? (
                    <BatchAIGenerateButton
                      matches={approvedMatches}
                      size="sm"
                      onComplete={() => {
                        setShowBatchAIGenerate(false);
                        setApprovedMatches([]);
                      }}
                    />
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      onClick={() => window.location.href = '/settings/subscription'}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade for AI Pitches
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowBatchAIGenerate(false);
                      setApprovedMatches([]);
                    }}
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions Bar - Only show for clients viewing pending tasks */}
          {isClient && statusFilter === 'pending' && selectableTasks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  onClick={handleSelectAll}
                >
                  {selectedTasks.size === selectableTasks.length && selectableTasks.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-600" />
                  )}
                </Button>
                <span className="text-sm text-gray-700">
                  {selectedTasks.size > 0 ? (
                    <>
                      {selectedTasks.size} of {selectableTasks.length} selected
                    </>
                  ) : (
                    <>Select all ({selectableTasks.length})</>
                  )}
                </span>
              </div>
              
              {selectedTasks.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isBulkApproving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isBulkApproving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Bulk Approve ({selectedTasks.size})
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {isLoading ? ( 
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600">Loading match suggestions...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-4">
                      <Skeleton className="h-5 w-2/5 mb-2" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-1" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <div className="flex space-x-2 pt-4">
                        <Skeleton className="h-9 w-1/2" />
                        <Skeleton className="h-9 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : displayedTasks.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-md font-medium text-gray-700">No tasks match your filters</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="relative">
              {isFetching && !isLoading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                  <div className="bg-white rounded-lg shadow-lg p-4 flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600">Refreshing data...</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {displayedTasks.map((task) => (
                  <ReviewTaskItem 
                    key={task.review_task_id} 
                    task={task}
                    isSelectable={isClient && task.status === 'pending' && task.task_type === 'match_suggestion'}
                    isSelected={selectedTasks.has(task.review_task_id)}
                    onSelect={handleTaskSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {totalPages > 0 && (
            <div className="mt-6 flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isFetching}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                {isFetching && <span className="animate-pulse mr-2">Updating...</span>}
                Page {currentPage} of {totalPages} (Total: {totalTasks})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0 || isFetching}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}