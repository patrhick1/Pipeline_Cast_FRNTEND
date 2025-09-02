// client/src/pages/CampaignDetail.tsx
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter"; // useParams is not used if campaignIdParam is passed directly
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Edit, ExternalLink, Lightbulb, Search, CheckCircle, Send, TrendingUp,
  ClipboardList, AlertTriangle, Info, Users, FileText, MessageSquare, PlayCircle, ThumbsUp, ThumbsDown, RefreshCw, Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator"; // Added Separator
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CampaignFunnel } from "@/components/CampaignFunnel";
import CampaignThreads from "@/components/campaigns/CampaignThreads";

// --- Interfaces (Ensure these match your actual backend responses) ---
interface CampaignDetailData {
  campaign_id: string;
  person_id: number;
  campaign_name: string;
  campaign_type?: string | null;
  campaign_bio?: string | null; // Raw text content
  campaign_angles?: string | null; // Raw text content
  campaign_keywords?: string[] | null;
  embedding_status?: string | null; // Added
  mock_interview_trancript?: string | null; // Text or GDoc Link
  media_kit_url?: string | null;
  questionnaire_responses?: object | null; // To check if questionnaire is filled
  created_at: string;
  client_full_name?: string; // Populated if needed
}

interface CampaignStats {
    discovered: number;
    vetted: number;
    pitched: number;
    responses: number;
    bookings: number;
}

interface CampaignAnalyticsSummary {
    active_campaigns: number;
    total_pitches_sent: number;
    placements_secured: number;
    upcoming_recordings: number;
    pending_reviews: number;
    approved_placements?: number;
    success_rate_placements?: number;
}

interface MatchSuggestionForCampaign {
  match_id: number;
  media_id: number;
  media_name?: string | null;
  media_website?: string | null;
  status: string; // 'pending', 'approved', 'rejected', 'pending_internal_review'
  ai_reasoning?: string | null;
  match_score?: number | null;
  created_at: string;
  review_task_id?: number | null; // Added to support review-tasks endpoint
}

interface PitchForCampaign { // Simplified from PitchInDB
  pitch_id: number;
  pitch_gen_id?: number | null;
  media_id: number; // Added media_id for fetching media details if needed
  media_name?: string | null; // Joined from media table
  subject_line?: string | null;
  pitch_state?: string | null; // e.g., 'generated', 'pending_review', 'ready_to_send', 'sent', 'opened', 'replied'
  send_ts?: string | null;
  reply_ts?: string | null;
  created_at: string;
}

interface PlacementForCampaign { // Simplified from PlacementInDB
  placement_id: number;
  media_id: number; // Added media_id for fetching media details if needed
  media_name?: string | null; // Joined from media table
  current_status?: string | null;
  go_live_date?: string | null;
  episode_link?: string | null;
  created_at: string;
}
// --- End Interfaces ---

// --- Define the props for CampaignDetail ---
interface CampaignDetailProps {
  campaignIdParam: string; // Expect this prop
}


// --- Tab Content Components (Can be moved to separate files) ---

function CampaignOverviewTab({ campaign, onReprocess, stats }: { campaign: CampaignDetailData; onReprocess: () => void; stats?: CampaignStats | null; }) {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  const defaultStats = { discovered: 0, vetted: 0, pitched: 0, responses: 0, bookings: 0 };

  // Check for internal media kit
  const { data: internalMediaKit } = useQuery({
    queryKey: ["mediaKitData", campaign.campaign_id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/campaigns/${campaign.campaign_id}/media-kit`);
      if (response.status === 404) return null;
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!campaign.campaign_id,
  });

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>Campaign Funnel</CardTitle>
            <CardDescription>A visual representation of your campaign's progress.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
                {stats ? (
                    <CampaignFunnel stats={stats} />
                ) : (
                    <div className="text-center text-gray-500">Stats are currently unavailable.</div>
                )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Key details and settings for this campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <p><strong>Campaign Name:</strong> {campaign.campaign_name}</p>
                <p><strong>Client:</strong> {campaign.client_full_name || `Person ID: ${campaign.person_id}`}</p>
                <p><strong>Campaign Type:</strong> {campaign.campaign_type || "N/A"}</p>
                <p><strong>Created:</strong> {new Date(campaign.created_at).toLocaleDateString()}</p>
                {isAdminOrStaff && (
                  <div>
                      <span className="font-semibold">Keywords: </span>
                      {campaign.campaign_keywords && campaign.campaign_keywords.length > 0 ? 
                          campaign.campaign_keywords.map(kw => <Badge key={kw} variant="secondary" className="mr-1 mb-1">{kw}</Badge>) : 
                          <span className="text-gray-500">Not set</span>}
                  </div>
                )}
                <div>
                    <span className="font-semibold">Embedding Status: </span>
                    {campaign.embedding_status ? (
                        <Badge 
                          variant={
                            campaign.embedding_status === 'completed' ? 'default' :
                            campaign.embedding_status === 'pending' ? 'outline' :
                            campaign.embedding_status === 'failed' ? 'destructive' :
                            campaign.embedding_status === 'not_enough_content' ? 'secondary' :
                            'secondary'
                          }
                          className={`capitalize ${campaign.embedding_status === 'completed' ? 'bg-green-100 text-green-700' : campaign.embedding_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : campaign.embedding_status === 'not_enough_content' ? 'bg-orange-100 text-orange-700' : ''}`}
                        >
                            {campaign.embedding_status.replace(/_/g, ' ')}
                        </Badge>
                        ) : <Badge variant="secondary">Not Started</Badge>}
                </div>
                <div className="md:col-span-2">
                  <p><strong>Media Kit URL:</strong>
                  {campaign.media_kit_url ?
                      <a href={campaign.media_kit_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                      View External Media Kit <ExternalLink className="inline h-3 w-3"/>
                      </a>
                      : " Not provided"}
                  </p>
                  {internalMediaKit && internalMediaKit.is_public && internalMediaKit.slug && (
                    <p className="mt-1"><strong>Internal Media Kit:</strong>
                      <a href={`/media-kit/${internalMediaKit.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                        View Public Media Kit <ExternalLink className="inline h-3 w-3"/>
                      </a>
                    </p>
                  )}
                </div>
            </div>
            {isAdminOrStaff && (
                <div className="mt-4 pt-4 border-t">
                    <Button onClick={onReprocess} size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Re-process Campaign Content & Embedding
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

function ProfileContentTab({ campaign, userRole }: { campaign: CampaignDetailData; userRole: string | null }) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [, navigate] = useLocation();
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [anglesModalOpen, setAnglesModalOpen] = useState(false);

  const triggerAnglesBioMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/campaigns/${campaignId}/generate-angles-bio`, {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to trigger generation."}));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Generation Successful", description: data.message || "Bio & Angles are being generated." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", campaign.campaign_id] });
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message || "Could not trigger generation.", variant: "destructive" });
    },
  });

  const handleGenerateBioAngles = () => {
    if (!campaign.mock_interview_trancript && !campaign.questionnaire_responses) {
        toast({ title: "Missing Prerequisite", description: "Questionnaire must be completed first to provide content for AI.", variant: "destructive"});
        if (userRole === 'client') navigate(`/profile-setup?campaignId=${campaign.campaign_id}&tab=questionnaire`);
        return;
    }
    triggerAnglesBioMutation.mutate(campaign.campaign_id);
  };

  const questionnaireLink = userRole === 'client' ? `/profile-setup?campaignId=${campaign.campaign_id}&tab=questionnaire` : `/admin?tab=campaigns&action=editQuestionnaire&campaignId=${campaign.campaign_id}`;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Client Profile & AI-Generated Content</CardTitle>
        <CardDescription>Manage client information and AI-generated assets for this campaign.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-1">Questionnaire / Mock Interview</h4>
          <div className="flex items-center space-x-2">
            {campaign.questionnaire_responses || campaign.mock_interview_trancript ? (
              <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1"/>Completed</Badge>
            ) : (
              <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1"/>Incomplete</Badge>
            )}
            <Link href={questionnaireLink}>
              <Button variant="link" className="p-0 h-auto text-sm">
                {campaign.questionnaire_responses ? "View/Edit Questionnaire" : "Complete Questionnaire"}
              </Button>
            </Link>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold mb-1">AI-Generated Client Bio</h4>
          {campaign.campaign_bio ? (
            <Button
              variant="link"
              onClick={() => setBioModalOpen(true)}
              className="p-0 h-auto text-sm justify-start"
            >
              <Eye className="h-4 w-4 mr-1"/> View Bio Content
            </Button>
          ) : <p className="text-sm text-gray-500">Not generated yet. Complete questionnaire and click below.</p>}
        </div>
         <div>
          <h4 className="font-semibold mb-1">AI-Generated Pitch Angles</h4>
          {campaign.campaign_angles ? (
            <Button
              variant="link"
              onClick={() => setAnglesModalOpen(true)}
              className="p-0 h-auto text-sm justify-start"
            >
              <Eye className="h-4 w-4 mr-1"/> View Angles Content
            </Button>
          ) : <p className="text-sm text-gray-500">Not generated yet. Complete questionnaire and click below.</p>}
        </div>

        {(userRole === 'staff' || userRole === 'admin') && (
          <Button onClick={handleGenerateBioAngles} disabled={triggerAnglesBioMutation.isPending || (!campaign.questionnaire_responses && !campaign.mock_interview_trancript)}>
            <Lightbulb className="mr-2 h-4 w-4" />
            {triggerAnglesBioMutation.isPending ? "Generating..." : (campaign.campaign_bio ? "Re-generate Bio & Angles" : "Generate Bio & Angles")}
          </Button>
        )}
         {userRole === 'client' && (!campaign.campaign_bio || !campaign.campaign_angles) && (
            <p className="text-sm text-gray-500 italic">
                Once your questionnaire is complete, our team will generate your Bio & Angles.
            </p>
        )}
      </CardContent>
    </Card>

    {/* Bio Content Modal */}
    <Dialog open={bioModalOpen} onOpenChange={setBioModalOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>AI-Generated Client Bio</DialogTitle>
          <DialogDescription>
            This bio has been generated based on the questionnaire responses
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh] pr-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {campaign.campaign_bio}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    {/* Angles Content Modal */}
    <Dialog open={anglesModalOpen} onOpenChange={setAnglesModalOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>AI-Generated Pitch Angles</DialogTitle>
          <DialogDescription>
            Strategic angles for pitching to podcasts based on your expertise
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh] pr-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {campaign.campaign_angles}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
}

function PodcastMatchesTab({ campaignId, userRole }: { campaignId: string; userRole: string | null }) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('desc'); // For sorting

  const { data: rawMatches = [], isLoading, error } = useQuery<MatchSuggestionForCampaign[]>({
    queryKey: ["campaignMatchesDetail", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/match-suggestions/campaign/${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch match suggestions");
      const matchData: any[] = await response.json();
      // Enrich with media name if not already joined by backend
      return Promise.all(matchData.map(async (m: any) => {
          if (m.media_id && !m.media_name) { 
              try {
                const mediaRes = await apiRequest("GET", `/media/${m.media_id}`);
                if (mediaRes.ok) {
                    const mediaDetails = await mediaRes.json();
                    m.media_name = mediaDetails.name;
                    m.media_website = mediaDetails.website;
                }
              } catch (e) { console.warn(`Could not fetch media details for media_id ${m.media_id}`); }
          }
          return m as MatchSuggestionForCampaign;
      }));
    },
  });

  const matches = [...rawMatches].sort((a, b) => {
    if (sortOrder === 'none') return 0;
    const scoreA = a.match_score ?? -1;
    const scoreB = b.match_score ?? -1;
    return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });

  const approveMatchMutation = useMutation({
    mutationFn: ({ reviewTaskId, matchId }: { reviewTaskId: number | null; matchId: number }) => {
      // Use review-tasks endpoint if reviewTaskId is available, otherwise fall back to match-suggestions
      if (reviewTaskId) {
        // IMPORTANT: Backend should verify that the current user owns the campaign associated with this review task
        // This prevents clients from approving matches for campaigns they don't own
        return apiRequest("POST", `/review-tasks/${reviewTaskId}/approve`, { 
          status: 'approved', 
          notes: 'Approved by client' 
        });
      }
      // Fallback for backward compatibility
      return apiRequest("PATCH", `/match-suggestions/${matchId}/approve`);
    },
    onSuccess: () => {
      toast({ title: "Match Approved", description: "The match has been approved. Our team will draft a pitch." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignMatchesDetail", campaignId] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to approve match.", variant: "destructive" }),
  });

  const rejectMatchMutation = useMutation({
    mutationFn: ({ reviewTaskId, matchId }: { reviewTaskId: number | null; matchId: number }) => {
      // Use review-tasks endpoint if reviewTaskId is available, otherwise fall back to match-suggestions
      if (reviewTaskId) {
        return apiRequest("POST", `/review-tasks/${reviewTaskId}/approve`, { 
          status: 'rejected', 
          notes: 'Rejected by client' 
        });
      }
      // Fallback for backward compatibility
      return apiRequest("PATCH", `/match-suggestions/${matchId}`, { status: 'rejected_by_client' });
    },
    onSuccess: () => {
      toast({ title: "Match Rejected", description: "The match has been marked as rejected." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignMatchesDetail", campaignId] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/review-tasks/"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to reject match.", variant: "destructive" }),
  });


  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  if (error) return <p className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md">Error loading matches: {(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle>Podcast Matches</CardTitle>
                <CardDescription>Podcasts suggested or vetted for this campaign.</CardDescription>
            </div>
            {matches.length > 0 && (
                <div className="mt-2 sm:mt-0">
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
                      <SelectTrigger className="w-full sm:w-[180px] text-xs h-9">
                        <SelectValue placeholder="Sort by score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Score: High to Low</SelectItem>
                        <SelectItem value="asc">Score: Low to High</SelectItem>
                        <SelectItem value="none">Default Order</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
            <div className="text-center py-6">
                <Search className="mx-auto h-10 w-10 text-gray-400 mb-2"/>
                <p className="text-gray-600">No podcast matches found for this campaign yet.</p>
                {(userRole === 'staff' || userRole === 'admin') && (
                    <Link href={`/discover?campaignId=${campaignId}`}>
                        <Button variant="link" className="mt-2">Discover Podcasts for this Campaign</Button>
                    </Link>
                )}
            </div>
        ) : (
          <div className="space-y-3">
            {matches.map(match => (
              <Card key={match.match_id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0 flex-1">
                    <h4 className="font-semibold text-md">{match.media_name || `Media ID: ${match.media_id}`}</h4>
                    <div className="text-xs text-gray-500 flex items-center gap-x-2 flex-wrap mt-0.5">
                        <span>Status: <Badge variant={match.status === 'approved' ? 'default' : 'outline'} className={`capitalize text-xs px-1.5 py-0.5 ${match.status === 'approved' ? 'bg-green-100 text-green-700' : ''}`}>{match.status.replace('_', ' ')}</Badge></span>
                        {typeof match.match_score === 'number' && (
                            <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5">
                                Match: {Math.round(match.match_score)}%
                            </Badge>
                        )}
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0 sm:ml-4 mt-2 sm:mt-0">
                    {match.media_website && <Button variant="ghost" size="icon" asChild className="h-8 w-8"><a href={match.media_website} target="_blank" rel="noopener noreferrer" title="Visit Website"><ExternalLink className="h-4 w-4"/></a></Button>}
                    {userRole === 'client' && match.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => approveMatchMutation.mutate({ reviewTaskId: match.review_task_id || null, matchId: match.match_id })} disabled={approveMatchMutation.isPending} className="bg-green-500 hover:bg-green-600 text-white">
                            <ThumbsUp className="h-4 w-4 mr-1"/> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectMatchMutation.mutate({ reviewTaskId: match.review_task_id || null, matchId: match.match_id })} disabled={rejectMatchMutation.isPending}>
                            <ThumbsDown className="h-4 w-4 mr-1"/> Reject
                        </Button>
                      </>
                    )}
                     {(userRole === 'staff' || userRole === 'admin') && match.status === 'pending_internal_review' && (
                      <Button size="sm" onClick={() => { /* Staff action to finalize approval */ }}>Vet & Finalize</Button>
                    )}
                  </div>
                </div>
                {match.ai_reasoning && 
                    <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                        <h5 className="text-xs font-semibold text-gray-600 mb-0.5 flex items-center">
                          <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-yellow-500 shrink-0" /> AI Reasoning:
                        </h5> 
                        <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100 whitespace-pre-wrap break-words">{match.ai_reasoning}</p>
                    </div>
                }
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PitchesTab({ campaignId, userRole }: { campaignId: string; userRole: string | null }) {
  const { data: pitches = [], isLoading, error } = useQuery<PitchForCampaign[]>({
    queryKey: ["campaignPitches", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/pitches/?campaign_id=${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch pitches");
      const pitchData: any[] = await response.json();
      return Promise.all(pitchData.map(async p => {
          if (p.media_id && !p.media_name) {
              try {
                const mediaRes = await apiRequest("GET", `/media/${p.media_id}`);
                if (mediaRes.ok) p.media_name = (await mediaRes.json()).name;
              } catch (e) { console.warn(`Could not fetch media details for pitch's media_id ${p.media_id}`); }
          }
          return p;
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md">Error loading pitches: {(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pitches Sent</CardTitle>
        <CardDescription>Status of pitches sent out for this campaign.</CardDescription>
      </CardHeader>
      <CardContent>
        {pitches.length === 0 ? <p>No pitches sent for this campaign yet.</p> : (
          <div className="space-y-2">
            {pitches.map(pitch => (
              <Card key={pitch.pitch_id} className="p-3">
                <p className="font-medium text-sm">{pitch.media_name || `Media ID: ${pitch.media_id}`}</p>
                <p className="text-xs text-gray-600">Subject: {pitch.subject_line || "N/A"}</p>
                <p className="text-xs">Status: <Badge variant={pitch.pitch_state === 'replied' ? 'default' : 'secondary'}>{pitch.pitch_state || "N/A"}</Badge></p>
                {pitch.send_ts && <p className="text-xs text-gray-500">Sent: {new Date(pitch.send_ts).toLocaleString()}</p>}
                {userRole !== 'client' && (
                    <Link href={`/pitch-outreach?pitchGenId=${pitch.pitch_gen_id}`}>
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">View/Manage Pitch</Button>
                    </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlacementsTab({ campaignId, userRole }: { campaignId: string; userRole: string | null }) {
  const { data: placements = [], isLoading, error } = useQuery<PlacementForCampaign[]>({
    queryKey: ["campaignPlacements", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/placements/?campaign_id=${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch placements");
      const placementData: any[] = (await response.json()).items || [];
       return Promise.all(placementData.map(async p => {
          if (p.media_id && !p.media_name) {
              try {
                const mediaRes = await apiRequest("GET", `/media/${p.media_id}`);
                if (mediaRes.ok) p.media_name = (await mediaRes.json()).name;
              } catch (e) { console.warn(`Could not fetch media details for placement's media_id ${p.media_id}`); }
          }
          return p;
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md">Error loading placements: {(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader><CardTitle>Placements & Bookings</CardTitle><CardDescription>Confirmed podcast appearances for this campaign.</CardDescription></CardHeader>
      <CardContent>
        {placements.length === 0 ? <p>No placements recorded for this campaign yet.</p> : (
          <div className="space-y-2">
            {placements.map(placement => (
              <Card key={placement.placement_id} className="p-3">
                <p className="font-medium text-sm">{placement.media_name || `Media ID: ${placement.media_id}`}</p>
                <p className="text-xs">Status: <Badge>{placement.current_status || "N/A"}</Badge></p>
                {placement.go_live_date && <p className="text-xs text-gray-500">Go-Live: {new Date(placement.go_live_date + 'T00:00:00').toLocaleDateString()}</p>}
                {placement.episode_link && <a href={placement.episode_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Listen to Episode <PlayCircle className="inline h-3 w-3"/></a>}
                {userRole !== 'client' && (
                    <Link href={`/placement-tracking?placementId=${placement.placement_id}`}>
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">Manage Placement</Button>
                    </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// --- Main CampaignDetail Component ---
export default function CampaignDetail({ campaignIdParam }: CampaignDetailProps) { // Use the prop
  const campaignId = campaignIdParam; // Use the passed prop
  const { user, isLoading: authLoading } = useAuth();
  const tanstackQueryClient = useTanstackQueryClient();
  const { toast } = useToast(); // Added toast for reprocess button
  
  // Get tab from URL query parameter
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab') || 'overview';

  const { data: campaign, isLoading, error, refetch: refetchCampaignDetail } = useQuery<CampaignDetailData>({
    queryKey: ["campaignDetail", campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error("Campaign ID is missing");
      const response = await apiRequest("GET", `/campaigns/${campaignId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Campaign not found.");
        const errorData = await response.json().catch(() => ({detail: "Failed to fetch campaign details"}));
        throw new Error(errorData.detail);
      }
      const campaignData: CampaignDetailData = await response.json();
      if (campaignData.person_id && !campaignData.client_full_name) {
          try {
            const personRes = await apiRequest("GET", `/people/${campaignData.person_id}`);
            if (personRes.ok) {
                const personData = await personRes.json();
                campaignData.client_full_name = personData.full_name;
            }
          } catch (e) { console.warn("Could not fetch client name for campaign detail"); }
      }
      return campaignData;
    },
    enabled: !!campaignId && !authLoading && !!user,
  });

  // Fetch match suggestions for campaign stats
  const { data: matchSuggestions } = useQuery<MatchSuggestionForCampaign[]>({
    queryKey: ["matchSuggestions", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const response = await apiRequest("GET", `/match-suggestions/?campaign_id=${campaignId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!campaignId,
  });

  // Fetch pitches for campaign stats
  const { data: pitches } = useQuery<PitchForCampaign[]>({
    queryKey: ["pitches", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const response = await apiRequest("GET", `/pitches/?campaign_id=${campaignId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!campaignId,
  });

  // Fetch placements for campaign stats
  const { data: placements } = useQuery<PlacementForCampaign[]>({
    queryKey: ["placementsForStats", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const response = await apiRequest("GET", `/placements/?campaign_id=${campaignId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.items || [];
    },
    enabled: !!campaignId,
  });

  // Calculate campaign stats from actual data
  const campaignStats: CampaignStats | null = useMemo(() => {
    if (!matchSuggestions || !pitches || !placements) return null;
    
    const discovered = matchSuggestions.length;
    const vetted = matchSuggestions.filter(m => m.status === 'approved').length;
    const pitched = pitches.filter(p => p.pitch_state === 'sent').length;
    const responses = pitches.filter(p => p.reply_ts).length;
    const bookings = placements.filter(p => 
      p.current_status === 'confirmed' || 
      p.current_status === 'scheduled' || 
      p.current_status === 'recorded' || 
      p.current_status === 'live'
    ).length;
    
    return { discovered, vetted, pitched, responses, bookings };
  }, [matchSuggestions, pitches, placements]);

  const isLoadingStats = !campaignStats;

  const reprocessCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!campaignId) throw new Error("Campaign ID is missing.");
      // API: POST /tasks/run/process_campaign_content?campaign_id={campaign.campaign_id}
      const response = await apiRequest("POST", `/tasks/run/process_campaign_content?campaign_id=${campaignId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({detail: "Failed to trigger campaign reprocessing."}));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Reprocessing Initiated", description: "Campaign content reprocessing started. Status will update shortly." });
      // Optionally, set a timeout to refetch campaign details after a few seconds
      // or rely on websockets if you implement real-time status updates.
      setTimeout(() => {
        tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", campaignId] });
         // Also invalidate lists that might show embedding_status
        tanstackQueryClient.invalidateQueries({ queryKey: ["allCampaignsForManagement"] });
        tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForProfileSetupPage"] }); 
      }, 3000); // Refetch after 3s
    },
    onError: (error: any) => {
      toast({ title: "Error Reprocessing", description: error.message || "Failed to start reprocessing.", variant: "destructive" });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6 animate-pulse">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-2 text-xl font-semibold text-red-600">Error Loading Campaign</h2>
        <p className="text-red-500">{(error as Error).message}</p>
        <Link href={user?.role === 'client' ? "/my-campaigns" : "/campaign-management"}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  if (!campaign) {
    return (
        <div className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-xl font-semibold text-gray-700">Campaign Not Found</h2>
            <p className="text-gray-500">The requested campaign could not be loaded.</p>
            <Link href={user?.role === 'client' ? "/my-campaigns" : "/campaign-management"}>
            <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
            </Button>
            </Link>
      </div>
    );
  }

  const backLink = user?.role === 'client' ? "/my-campaigns" : "/campaign-management";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Link href={backLink}>
        <Button variant="outline" className="mb-4 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns List
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{campaign.campaign_name}</h1>
          <p className="text-gray-600">Client: {campaign.client_full_name || `Person ID: ${campaign.person_id}`}</p>
        </div>
        {(user?.role === 'staff' || user?.role === 'admin') && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Link href={`/discover?campaignId=${campaign.campaign_id}`} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full"><Search className="mr-2 h-4 w-4"/> Discover Podcasts</Button>
                </Link>
                <Link href={`/pitch-outreach?campaignId=${campaign.campaign_id}`} className="w-full sm:w-auto">
                    <Button className="w-full bg-primary text-primary-foreground"><Send className="mr-2 h-4 w-4"/> Manage Pitches</Button>
                </Link>
            </div>
        )}
      </div>

      <Tabs defaultValue={tabFromUrl} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profileContent">Profile & Content</TabsTrigger>
          <TabsTrigger value="matches">Podcast Matches</TabsTrigger>
          <TabsTrigger value="pitches">Pitches</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="emails">Email Threads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CampaignOverviewTab campaign={campaign} onReprocess={() => reprocessCampaignMutation.mutate()} stats={campaignStats} />
        </TabsContent>
        <TabsContent value="profileContent" className="mt-6">
          <ProfileContentTab campaign={campaign} userRole={user?.role || null} />
        </TabsContent>
        <TabsContent value="matches" className="mt-6">
          <PodcastMatchesTab campaignId={campaign.campaign_id} userRole={user?.role || null} />
        </TabsContent>
        <TabsContent value="pitches" className="mt-6">
          <PitchesTab campaignId={campaign.campaign_id} userRole={user?.role || null} />
        </TabsContent>
        <TabsContent value="placements" className="mt-6">
          <PlacementsTab campaignId={campaign.campaign_id} userRole={user?.role || null} />
        </TabsContent>
        <TabsContent value="emails" className="mt-6">
          <CampaignThreads campaignId={campaign.campaign_id} campaignName={campaign.campaign_name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}