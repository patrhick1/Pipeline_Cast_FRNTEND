// client/src/pages/PitchOutreach.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"; // Removed DialogTrigger, DialogClose as they are used within specific components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { nn } from "@/lib/utils";
import { Send, Edit3, Check, X, ListChecks, MailCheck, MailOpen, RefreshCw, ExternalLink, Eye, MessageSquare, Filter, Search, Lightbulb, Info, Save, LinkIcon, SendHorizontal, CheckSquare, Clock, CheckCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { PodcastDetailsModal } from "@/components/modals/PodcastDetailsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FreeUserUpgradeCard } from "@/components/pitch/FreeUserUpgradeCard";
import { PitchTemplate } from "@/pages/PitchTemplates.tsx"; // Added .tsx extension
import { Checkbox } from "@/components/ui/checkbox";
import { usePitchSending } from "@/hooks/usePitchSending";
import { EmailStatusBadge } from "@/components/pitch/EmailStatusBadge";
import { SendPitchButton } from "@/components/pitch/SendPitchButton";
import { AdminSendPitchButton } from "@/components/pitch/AdminSendPitchButton";
import { BatchSendButton } from "@/components/pitch/BatchSendButton";
import { usePitchCapabilities } from "@/hooks/usePitchCapabilities";
import { useSubscription } from "@/hooks/useSubscription";
// ManualPitchEditor removed - using PitchSequenceEditor for all pitch creation
import { PitchSequenceEditor } from "@/components/pitch/PitchSequenceEditor";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { LockedOverlay } from "@/components/LockedOverlay";
import PitchEmailThread from "@/components/pitch/PitchEmailThread";
import { SmartSendSettings } from "@/components/pitch/SmartSendSettings";
import { AIGeneratePitchButton } from "@/components/pitch/AIGeneratePitchButton";
import { AIGenerateFollowUpButton } from "@/components/pitch/AIGenerateFollowUpButton";
import { BatchAIGenerateButton } from "@/components/pitch/BatchAIGenerateButton";
import { BulkFollowUpButton } from "@/components/pitch/BulkFollowUpButton";
import { BulkApproveButton } from "@/components/pitch/BulkApproveButton";
import { formatUTCToLocal } from "@/lib/timezone";
import { ModernPitchReview } from "@/components/pitch/ModernPitchReview";

// --- Interfaces (Aligned with expected enriched backend responses) ---

interface ApprovedMatchForPitching { // From GET /match-suggestions/?status=approved (enriched)
  match_id: number;
  campaign_id: string;
  media_id: number;
  status: string;
  media_name?: string | null;
  media_website?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
}

interface EpisodeAnalysisData { // Define placeholder for expected data structure
  episode_id?: number;
  title?: string | null;
  ai_episode_summary?: string | null;
  episode_themes?: string[] | null;
  episode_keywords?: string[] | null;
  transcript_available?: boolean;
  ai_analysis_done?: boolean;
  // Potentially a link to the episode or transcript viewer
}

interface PitchDraftForReview { // From GET /review-tasks/?task_type=pitch_review&status=pending (enriched)
  review_task_id: number;
  pitch_gen_id: number;
  campaign_id: string;
  media_id: number;
  match_id?: number | null; // Match ID for generating follow-ups
  parent_pitch_gen_id?: number | null; // Parent pitch for follow-ups
  draft_text: string;
  subject_line?: string | null; // From associated pitches record
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  media_website?: string | null; // Added for context
  relevant_episode_analysis?: EpisodeAnalysisData | null; // NEW - To be populated by backend
  status?: string; // Status of the review task
  sequence_number?: number | null; // Sequence number for ordering pitches
  pitch_type?: string | null; // Type of pitch (initial, follow_up_1, etc.)
}

interface PitchReadyToSend { // From GET /pitches/?pitch_state=ready_to_send (enriched)
  pitch_id: number;
  pitch_gen_id: number;
  campaign_id: string;
  media_id: number;
  match_id?: number | null; // Match ID for generating follow-ups
  final_text?: string | null; // From pitch_generations
  draft_text?: string | null; // Fallback from pitch_generations
  subject_line?: string | null; // From pitches table
  recipient_email?: string | null; // Recipient email address
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  media_website?: string | null; // Added for context
  pitch_type?: string | null; // To identify if it's initial or follow-up
  parent_pitch_gen_id?: number | null; // To identify if it has follow-ups
  follow_up_count?: number; // Number of follow-ups configured
  sequence_number?: number | null; // Sequence number for ordering
}

interface SentPitchStatus { // From GET /pitches/?pitch_state__in=... (enriched)
  pitch_id: number;
  media_id: number;
  campaign_id: string;
  pitch_state?: string | null;
  send_ts?: string | null;
  reply_ts?: string | null;
  instantly_lead_id?: string | null;
  subject_line?: string | null;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  media_website?: string | null; // Added for context
}

// const pitchTemplateOptions = [ // REMOVE THIS
//     { value: "friendly_intro_template", label: "Friendly Introduction" },
//     // Add more templates as they are created in the backend
// ];

const editDraftSchema = z.object({
  subject_line: z.string().min(1, "Subject line is required."),
  draft_text: z.string().min(50, "Draft text must be at least 50 characters."),
});
type EditDraftFormData = z.infer<typeof editDraftSchema>;


// --- Helper Components ---

function CampaignSelector({ selectedCampaignId, onCampaignChange, campaigns, isLoading }: {
    selectedCampaignId: string | null;
    onCampaignChange: (campaignId: string | null) => void;
    campaigns?: any[];
    isLoading?: boolean;
}) {
    if (isLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    return (
        <Select 
            value={selectedCampaignId || "all"} 
            onValueChange={(value) => onCampaignChange(value === "all" ? null : value)}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a campaign..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns?.map((campaign: any) => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                        {campaign.campaign_name || `Campaign ${campaign.campaign_id.substring(0, 8)}`}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// --- Tab Components ---
// Global functions (will be set by main component)
let globalRefreshAllPitchData: () => void = () => {};
let globalSetActiveTab: (tab: string) => void = () => {};

function ReadyForDraftTab({
    approvedMatches, isLoadingMatches, onCreateSequence, selectedCampaignId, campaigns
}: {
    approvedMatches: ApprovedMatchForPitching[];
    isLoadingMatches: boolean;
    onCreateSequence?: (match: ApprovedMatchForPitching) => void;
    selectedCampaignId?: string | null;
    campaigns?: any[];
}) {
    const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
    const [showPodcastDetails, setShowPodcastDetails] = useState(false);
    const { canUseAI, isFreePlan } = usePitchCapabilities();
    const queryClient = useTanstackQueryClient();

    if (isLoadingMatches) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3 mb-4" />
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
        );
    }
    if (!approvedMatches || approvedMatches.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No approved matches awaiting pitch generation.</div>;
    }

    return (
        <div className="space-y-4">
            {/* Batch AI Generation for all approved matches */}
            {canUseAI && approvedMatches.length > 1 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                            <h3 className="font-medium text-purple-900">Generate AI Pitches for All</h3>
                            <p className="text-sm text-purple-700">
                                Create personalized initial pitches for all {approvedMatches.length} approved matches at once.
                            </p>
                        </div>
                        <BatchAIGenerateButton
                            matches={approvedMatches.map(m => ({
                                match_id: m.match_id,
                                media_name: m.media_name ?? undefined
                            }))}
                            onComplete={() => {
                                // Refresh all pitch-related data immediately
                                globalRefreshAllPitchData();
                                // Auto-switch to review drafts tab
                                globalSetActiveTab("draftsReview");
                            }}
                            size="sm"
                        />
                    </div>
                </div>
            )}
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {approvedMatches.map((match) => (
                    <Card key={match.match_id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div className="mb-3 sm:mb-0 flex-1">
                                <h4 className="font-semibold text-gray-800">{match.media_name || `Media ID: ${match.media_id}`}</h4>
                                <p className="text-xs text-gray-500">
                                    For Campaign: {match.campaign_name || `ID: ${match.campaign_id.substring(0,8)}...`}
                                    {match.client_name && ` (Client: ${match.client_name})`}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {match.media_website && (
                                        <a href={match.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center">
                                            <ExternalLink className="h-3 w-3 mr-1"/> Visit
                                        </a>
                                    )}
                                    {match.media_id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-2 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMediaId(match.media_id);
                                                setShowPodcastDetails(true);
                                            }}
                                        >
                                            <Info className="h-3 w-3 mr-1"/> Details
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {canUseAI ? (
                                    <AIGeneratePitchButton
                                        matchId={match.match_id}
                                        mediaName={match.media_name ?? undefined}
                                        campaignName={match.campaign_name ?? undefined}
                                        onSuccess={() => {
                                            // Refresh all pitch-related data immediately
                                            globalRefreshAllPitchData();
                                            // Auto-switch to review drafts tab
                                            globalSetActiveTab("draftsReview");
                                        }}
                                        size="sm"
                                    />
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => onCreateSequence && onCreateSequence(match)}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <Send className="h-4 w-4 mr-1"/>
                                        {isFreePlan ? 'Create Pitch' : 'Create Manual Pitch'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            
            {/* Podcast Details Modal */}
            {selectedMediaId && (
                <PodcastDetailsModal
                    isOpen={showPodcastDetails}
                    onClose={() => {
                        setShowPodcastDetails(false);
                        setSelectedMediaId(null);
                    }}
                    mediaId={selectedMediaId}
                    podcastName={approvedMatches.find(m => m.media_id === selectedMediaId)?.media_name || undefined}
                />
            )}
        </div>
    );
}

function EditDraftModal({ draft, open, onOpenChange, onSave, isSaving }: {
    draft: PitchDraftForReview | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (pitchGenId: number, data: EditDraftFormData) => void;
    isSaving: boolean;
}) {
    const form = useForm<EditDraftFormData>({
        resolver: zodResolver(editDraftSchema),
        defaultValues: { subject_line: "", draft_text: "" },
    });

    useEffect(() => {
        if (draft && open) {
            form.reset({
                subject_line: draft.subject_line || "",
                draft_text: draft.draft_text || "",
            });
        }
    }, [draft, form, open]);

    const onSubmit = (data: EditDraftFormData) => {
        if (draft) { // Ensure draft is not null
            onSave(draft.pitch_gen_id, data);
        }
    };

    if (!draft) return null; // Add null check for draft

    // Placeholder for displaying relevant episode analysis
    const episodeAnalysis = draft.relevant_episode_analysis;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Pitch Draft for: {draft.media_name}</DialogTitle>
                    <DialogDescription>
                        Campaign: {draft.campaign_name} | Client: {draft.client_name}
                        {draft.media_website && 
                            <a href={draft.media_website} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline text-sm inline-flex items-center">
                                <LinkIcon className="h-3 w-3 mr-1" /> Website
                            </a>
                        }
                    </DialogDescription>
                </DialogHeader>
                
                {/* --- Relevant Episode Analysis Display (Placeholder) --- START */}
                {episodeAnalysis && (
                    <Card className="my-4 bg-slate-50 p-3">
                        <CardHeader className="p-2">
                            <CardTitle className="text-base flex items-center">
                                <Info className="h-4 w-4 mr-2 text-blue-600" /> Relevant Episode Insights: {episodeAnalysis.title || 'Episode Info'}
                                {episodeAnalysis.ai_analysis_done && <Badge variant="secondary" className="ml-2 text-xs">Analyzed</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs p-2 space-y-1">
                            {episodeAnalysis.ai_episode_summary && 
                                <p><span className="font-semibold">Summary:</span> {episodeAnalysis.ai_episode_summary}</p>}
                            {episodeAnalysis.episode_themes && episodeAnalysis.episode_themes.length > 0 && 
                                <div><span className="font-semibold">Themes:</span> {episodeAnalysis.episode_themes.map(t => <Badge key={t} variant="outline" className="mr-1 text-xs">{t}</Badge>)}</div>}
                            {episodeAnalysis.episode_keywords && episodeAnalysis.episode_keywords.length > 0 && 
                                <div><span className="font-semibold">Keywords:</span> {episodeAnalysis.episode_keywords.map(k => <Badge key={k} variant="outline" className="mr-1 text-xs">{k}</Badge>)}</div>}
                            {episodeAnalysis.transcript_available === false && <p className="text-orange-600">Transcript not yet available.</p>}
                        </CardContent>
                    </Card>
                )}
                {/* --- Relevant Episode Analysis Display (Placeholder) --- END */}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <FormField control={form.control} name="subject_line" render={({ field }) => (<FormItem><FormLabel>Subject Line</FormLabel><FormControl><Input placeholder="Enter pitch subject line" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="draft_text" render={({ field }) => (<FormItem><FormLabel>Pitch Body</FormLabel><FormControl><Textarea placeholder="Enter pitch body..." className="min-h-[200px] max-h-[35vh] overflow-y-auto text-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground">{isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4"/>Save Changes</>}</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DraftsReviewTab({
    drafts, onApprove, onEdit, isLoadingApproveForPitchGenId, isLoadingDrafts,
    currentPage, totalPages, onPageChange
}: {
    drafts: PitchDraftForReview[];
    onApprove: (pitchGenId: number) => void;
    onEdit: (draft: PitchDraftForReview) => void;
    isLoadingApproveForPitchGenId: number | null;
    isLoadingDrafts: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    const { canUseAI } = usePitchCapabilities();
    const [followUpStates, setFollowUpStates] = useState<Record<number, { count: number; generated: boolean }>>({});
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    
    // Group drafts by campaign_id and media_id, then sort by sequence_number
    const groupedDrafts = useMemo(() => {
        const groups: Map<string, {
            campaign_id: string;
            media_id: number;
            media_name: string | null | undefined;
            campaign_name: string | null | undefined;
            client_name: string | null | undefined;
            media_website: string | null | undefined;
            pitches: PitchDraftForReview[];
        }> = new Map();

        // Group by campaign_id and media_id
        drafts.forEach(draft => {
            const key = `${draft.campaign_id}_${draft.media_id}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    campaign_id: draft.campaign_id,
                    media_id: draft.media_id,
                    media_name: draft.media_name,
                    campaign_name: draft.campaign_name,
                    client_name: draft.client_name,
                    media_website: draft.media_website,
                    pitches: []
                });
            }

            groups.get(key)!.pitches.push(draft);
        });

        // Sort pitches within each group by sequence_number (or pitch_type as fallback)
        groups.forEach(group => {
            group.pitches.sort((a, b) => {
                // First try to sort by sequence_number
                if (a.sequence_number !== undefined && b.sequence_number !== undefined) {
                    return (a.sequence_number || 0) - (b.sequence_number || 0);
                }
                // Fallback: sort by pitch_type (initial first, then follow_up_1, follow_up_2, etc.)
                const getTypeOrder = (type?: string | null) => {
                    if (!type || type === 'initial') return 0;
                    const match = type.match(/follow_up_(\d+)/);
                    return match ? parseInt(match[1]) : 999;
                };
                return getTypeOrder(a.pitch_type) - getTypeOrder(b.pitch_type);
            });
        });

        return Array.from(groups.values());
    }, [drafts]);
    
    const toggleThread = (groupKey: string) => {
        const newExpanded = new Set(expandedThreads);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedThreads(newExpanded);
    };
    
    if (isLoadingDrafts && !drafts.length) { // Show skeleton only on initial load
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </div>
        );
    }
    if (!drafts || drafts.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No pitch drafts currently pending review.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {groupedDrafts.map((group) => {
                    const groupKey = `${group.campaign_id}_${group.media_id}`;
                    const isExpanded = expandedThreads.has(groupKey);
                    const hasMultiplePitches = group.pitches.length > 1;
                    const firstPitch = group.pitches[0];

                    return (
                        <div key={groupKey} className="space-y-2">
                            {/* Group Header Card */}
                            <Card className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                    <div className="flex-1 mb-3 sm:mb-0">
                                        <div className="flex items-center gap-2">
                                            {hasMultiplePitches && (
                                                <button
                                                    onClick={() => toggleThread(groupKey)}
                                                    className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </button>
                                            )}
                                            <h4 className="font-semibold text-gray-800">
                                                {group.media_name || `Media ID: ${group.media_id}`}
                                                {group.pitches.length > 0 && (
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        {group.pitches.length} pitch{group.pitches.length > 1 ? ' sequence' : ''}
                                                    </Badge>
                                                )}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Campaign: {group.campaign_name || 'N/A'} (Client: {group.client_name || 'N/A'})</p>
                                        {!isExpanded && firstPitch && (
                                            <>
                                                <p className="text-xs text-gray-600 mt-1 italic">Initial Subject: {firstPitch.subject_line || "Not set"}</p>
                                                <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">Preview: {firstPitch.draft_text?.substring(0, 100) || "No preview."}...</p>
                                            </>
                                        )}
                                        {group.media_website && (
                                            <a href={group.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">
                                                <ExternalLink className="h-3 w-3 mr-1"/> Visit Podcast
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                                        {/* Add Follow-ups Button - only if AI enabled */}
                                        {canUseAI && firstPitch?.match_id && (
                                            <AIGenerateFollowUpButton
                                                matchId={firstPitch.match_id}
                                                mediaName={group.media_name ?? undefined}
                                                onSuccess={() => {
                                                    // Refresh the data to show new follow-ups
                                                    window.location.reload(); // Temporary - should refresh via React Query
                                                }}
                                                size="sm"
                                                variant="outline"
                                                className="border-blue-200 hover:bg-blue-50"
                                            />
                                        )}

                                        {/* Approve All Button */}
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => {
                                                // Approve all pitches in the sequence
                                                group.pitches.forEach(pitch => onApprove(pitch.pitch_gen_id));
                                            }}
                                            disabled={group.pitches.some(p => isLoadingApproveForPitchGenId === p.pitch_gen_id)}
                                        >
                                            {group.pitches.some(p => isLoadingApproveForPitchGenId === p.pitch_gen_id) ?
                                                <RefreshCw className="h-4 w-4 animate-spin mr-1"/> :
                                                <Check className="h-4 w-4 mr-1.5"/>
                                            }
                                            Approve All ({group.pitches.length})
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Individual Pitches - shown when expanded or when only one pitch */}
                            {(isExpanded || group.pitches.length === 1) && (
                                <div className="ml-8 space-y-2">
                                    {group.pitches.map((pitch, index) => {
                                        const sequenceLabel = pitch.pitch_type === 'initial' ? 'Initial Pitch' :
                                                            pitch.pitch_type?.startsWith('follow_up_') ?
                                                                `Follow-up #${pitch.pitch_type.replace('follow_up_', '')}` :
                                                                `Sequence #${pitch.sequence_number ?? (index + 1)}`;

                                        return (
                                            <Card key={pitch.review_task_id} className={`p-3 border-l-4 ${
                                                pitch.pitch_type === 'initial' ? 'border-green-400 bg-green-50/30' :
                                                'border-blue-300 bg-blue-50/30'
                                            }`}>
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                                    <div className="flex-1 mb-2 sm:mb-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {sequenceLabel}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">
                                                                {pitch.subject_line || "No subject"}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 italic line-clamp-2">
                                                            {pitch.draft_text?.substring(0, 150) || "No preview."}...
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onEdit(pitch)}
                                                        >
                                                            <Edit3 className="h-3 w-3 mr-1"/> Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => onApprove(pitch.pitch_gen_id)}
                                                            disabled={isLoadingApproveForPitchGenId === pitch.pitch_gen_id}
                                                        >
                                                            {isLoadingApproveForPitchGenId === pitch.pitch_gen_id ?
                                                                <RefreshCw className="h-3 w-3 animate-spin"/> :
                                                                <Check className="h-3 w-3"/>
                                                            }
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1 || isLoadingDrafts}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoadingDrafts}>Next</Button>
                </div>
            )}
        </div>
    );
}

function ReadyToSendTab({
    pitches, onSend, onBulkSend, onPreview, onSendSequence, isLoadingSendForPitchId, isLoadingBulkSend, isLoadingPitches, campaigns
}: {
    pitches: PitchReadyToSend[];
    onSend: (pitchGenId: number) => void;
    onBulkSend: (pitchIds: number[]) => void;
    onPreview: (pitch: PitchReadyToSend) => void;
    onSendSequence?: (matchId: number) => void;
    isLoadingSendForPitchId: number | null;
    isLoadingBulkSend: boolean;
    isLoadingPitches: boolean;
    campaigns?: any[];
}) {
    const [selectedPitchIds, setSelectedPitchIds] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [pitchEmails, setPitchEmails] = useState<Record<number, string>>({});
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [updatingEmailForGroup, setUpdatingEmailForGroup] = useState<string | null>(null);
    const [editingGroupEmail, setEditingGroupEmail] = useState<string | null>(null);
    const [tempGroupEmail, setTempGroupEmail] = useState("");
    const { isFreePlan } = usePitchCapabilities();
    const { toast } = useToast();
    const { user } = useAuth();

    // Function to check if a campaign's client has premium subscription
    const getCampaignSubscription = (campaignId: string) => {
        const campaign = campaigns?.find(c => c.campaign_id === campaignId);
        return campaign?.subscription_plan || 'free';
    };

    const isStaffOrAdmin = user?.role?.toLowerCase() === 'staff' || user?.role?.toLowerCase() === 'admin';

    // Group pitches by campaign_id and media_id
    const groupedPitches = useMemo(() => {
        const groups: Map<string, {
            campaign_id: string;
            media_id: number;
            media_name: string | null | undefined;
            campaign_name: string | null | undefined;
            client_name: string | null | undefined;
            media_website: string | null | undefined;
            pitches: PitchReadyToSend[];
        }> = new Map();

        pitches.forEach(pitch => {
            const key = `${pitch.campaign_id}_${pitch.media_id}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    campaign_id: pitch.campaign_id,
                    media_id: pitch.media_id,
                    media_name: pitch.media_name,
                    campaign_name: pitch.campaign_name,
                    client_name: pitch.client_name,
                    media_website: pitch.media_website,
                    pitches: []
                });
            }

            groups.get(key)!.pitches.push(pitch);
        });

        // Sort pitches within each group
        groups.forEach(group => {
            group.pitches.sort((a, b) => {
                // Sort by sequence_number or pitch_type
                if (a.sequence_number !== undefined && b.sequence_number !== undefined) {
                    return (a.sequence_number || 0) - (b.sequence_number || 0);
                }
                const getTypeOrder = (type?: string | null) => {
                    if (!type || type === 'initial') return 0;
                    const match = type.match(/follow_up_(\d+)/);
                    return match ? parseInt(match[1]) : 999;
                };
                return getTypeOrder(a.pitch_type) - getTypeOrder(b.pitch_type);
            });
        });

        return Array.from(groups.values());
    }, [pitches]);

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        if (checked) {
            setSelectedPitchIds(pitches.map(p => p.pitch_id));
        } else {
            setSelectedPitchIds([]);
        }
    };

    const handleSelectPitch = (pitchId: number, checked: boolean) => {
        if (checked) {
            setSelectedPitchIds([...selectedPitchIds, pitchId]);
        } else {
            setSelectedPitchIds(selectedPitchIds.filter(id => id !== pitchId));
            setSelectAll(false);
        }
    };

    const handleBulkSend = () => {
        if (selectedPitchIds.length === 0) return;
        onBulkSend(selectedPitchIds);
        setSelectedPitchIds([]);
        setSelectAll(false);
    };

    const toggleGroup = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
    };

    // Function to update email for all pitches in a group
    const updateGroupEmail = async (groupKey: string, newEmail: string, pitchGenIds: number[]) => {
        if (!newEmail || !newEmail.includes('@')) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                variant: "destructive"
            });
            return;
        }

        setUpdatingEmailForGroup(groupKey);

        try {
            // Update all pitches in the group
            const updatePromises = pitchGenIds.map(pitchGenId =>
                apiRequest('PATCH', `/pitches/generations/${pitchGenId}/content`, {
                    recipient_email: newEmail
                })
            );

            const results = await Promise.all(updatePromises);
            const allSuccessful = results.every(r => r.ok);

            if (allSuccessful) {
                // Update local state for all pitches
                pitchGenIds.forEach(id => {
                    setPitchEmails(prev => ({ ...prev, [id]: newEmail }));
                });

                toast({
                    title: "Email Updated",
                    description: `Email updated for all ${pitchGenIds.length} pitches in the sequence`,
                });
            } else {
                throw new Error('Some updates failed');
            }
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Failed to update email addresses. Please try again.",
                variant: "destructive"
            });
        } finally {
            setUpdatingEmailForGroup(null);
        }
    };

    if (isLoadingPitches) {
        return <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>;
    }
    if (!pitches || pitches.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No pitches currently approved and ready to send.</div>;
    }

    return (
        <div className="space-y-4 relative">
            {/* Bulk Actions Bar */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                    <Checkbox 
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        disabled={isLoadingBulkSend}
                    />
                    <span className="text-sm text-gray-600">
                        {selectedPitchIds.length === 0
                            ? "Select all"
                            : `${selectedPitchIds.length} of ${pitches.length} selected`}
                    </span>
                </div>
                <Button
                    size="sm"
                    variant="default"
                    onClick={handleBulkSend}
                    disabled={selectedPitchIds.length === 0 || isLoadingBulkSend}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isLoadingBulkSend ? (
                        <><RefreshCw className="h-4 w-4 animate-spin mr-1.5"/> Sending pitches and scheduling follow-ups...</>
                    ) : (
                        <><SendHorizontal className="h-4 w-4 mr-1.5"/> Send Selected ({selectedPitchIds.length})</>
                    )}
                </Button>
            </div>

            {/* Grouped Pitch Cards */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {groupedPitches.map((group) => {
                    const groupKey = `${group.campaign_id}_${group.media_id}`;
                    const isExpanded = expandedGroups.has(groupKey);
                    const hasMultiplePitches = group.pitches.length > 1;
                    const firstPitch = group.pitches[0];
                    const isEditingEmail = editingGroupEmail === groupKey;
                    const groupEmail = pitchEmails[firstPitch.pitch_gen_id] || firstPitch.recipient_email;

                    return (
                        <div key={groupKey} className="space-y-2">
                            {/* Group Header Card */}
                            <Card className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col">
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {hasMultiplePitches && (
                                                <button
                                                    onClick={() => toggleGroup(groupKey)}
                                                    className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </button>
                                            )}
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    {group.media_name || `Media ID: ${group.media_id}`}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Campaign: {group.campaign_name || 'N/A'} (Client: {group.client_name || 'N/A'})
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {group.pitches.length} pitch{group.pitches.length > 1 ? ' sequence' : ''}
                                        </Badge>
                                    </div>

                                    {/* Email Address Section - Only visible to admin/staff */}
                                    {(user?.role === 'admin' || user?.role === 'staff') && (
                                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-medium text-gray-700">
                                                    Recipient Email {hasMultiplePitches && '(for all pitches)'}
                                                </label>
                                                {hasMultiplePitches && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Updates all {group.pitches.length} pitches
                                                    </Badge>
                                                )}
                                            </div>
                                            {isEditingEmail ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="email"
                                                        value={tempGroupEmail}
                                                        onChange={(e) => setTempGroupEmail(e.target.value)}
                                                        placeholder="Enter recipient email"
                                                        className="flex-1 h-8 text-sm"
                                                        disabled={updatingEmailForGroup === groupKey}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={() => {
                                                            const pitchIds = group.pitches.map(p => p.pitch_gen_id);
                                                            updateGroupEmail(groupKey, tempGroupEmail, pitchIds).then(() => {
                                                                setEditingGroupEmail(null);
                                                            });
                                                        }}
                                                        disabled={updatingEmailForGroup === groupKey}
                                                    >
                                                        {updatingEmailForGroup === groupKey ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8"
                                                        onClick={() => {
                                                            setEditingGroupEmail(null);
                                                            setTempGroupEmail("");
                                                        }}
                                                        disabled={updatingEmailForGroup === groupKey}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-800 flex-1">
                                                        {groupEmail || "No email set"}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7"
                                                        onClick={() => {
                                                            setEditingGroupEmail(groupKey);
                                                            setTempGroupEmail(groupEmail || "");
                                                        }}
                                                    >
                                                        <Edit3 className="h-3 w-3 mr-1" /> Edit
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Quick Preview (when collapsed) */}
                                    {!isExpanded && (
                                        <div className="text-xs text-gray-600 mb-3">
                                            <p className="italic">Initial: {firstPitch.subject_line || "No subject"}</p>
                                            <p className="line-clamp-1 mt-1">
                                                {(firstPitch.final_text || firstPitch.draft_text || "No content").substring(0, 100)}...
                                            </p>
                                        </div>
                                    )}

                                    {/* Website Link */}
                                    {group.media_website && (
                                        <a
                                            href={group.media_website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline inline-flex items-center mb-3"
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" /> Visit Podcast
                                        </a>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 justify-end">
                                        {/* Check if this is a premium client and user is staff/admin */}
                                        {isStaffOrAdmin && getCampaignSubscription(group.campaign_id) === 'paid_premium' ? (
                                            // Show admin send button for premium clients
                                            <AdminSendPitchButton
                                                pitchId={firstPitch.pitch_id}
                                                campaignId={group.campaign_id}
                                                recipientEmail={groupEmail || firstPitch.recipient_email}
                                                clientSubscriptionPlan="paid_premium"
                                                size="sm"
                                                buttonText={hasMultiplePitches ? `Send Sequence (${group.pitches.length})` : 'Send Pitch'}
                                            />
                                        ) : (
                                            // Regular send flow for non-premium or client users
                                            <>
                                                {/* Use new send-sequence endpoint if match_id is available */}
                                                {firstPitch.match_id && onSendSequence ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        onClick={() => {
                                                            const confirmMessage = hasMultiplePitches
                                                                ? `Send initial pitch and schedule ${group.pitches.length - 1} follow-up${group.pitches.length - 1 > 1 ? 's' : ''}?`
                                                                : 'Send this pitch?';
                                                            if (confirm(confirmMessage)) {
                                                                onSendSequence(firstPitch.match_id!);
                                                            }
                                                        }}
                                                        disabled={isLoadingBulkSend || isLoadingSendForPitchId === firstPitch.match_id}
                                                    >
                                                        {isLoadingSendForPitchId === firstPitch.match_id ? (
                                                            <><RefreshCw className="h-4 w-4 animate-spin mr-1" /> Sending...</>
                                                        ) : (
                                                            <>
                                                                <Send className="h-4 w-4 mr-1.5" />
                                                                {hasMultiplePitches ? `Send & Schedule (${group.pitches.length})` : 'Send Pitch'}
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    // Fallback to old method if no match_id
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        onClick={() => {
                                                            const confirmMessage = hasMultiplePitches
                                                                ? `Send all ${group.pitches.length} pitches in this sequence?`
                                                                : 'Send this pitch?';
                                                            if (confirm(confirmMessage)) {
                                                                group.pitches.forEach(p => onSend(p.pitch_gen_id));
                                                            }
                                                        }}
                                                        disabled={isLoadingBulkSend || group.pitches.some(p => isLoadingSendForPitchId === p.pitch_gen_id)}
                                                    >
                                                        {group.pitches.some(p => isLoadingSendForPitchId === p.pitch_gen_id) ? (
                                                            <><RefreshCw className="h-4 w-4 animate-spin mr-1" /> Sending...</>
                                                        ) : (
                                                            <><Send className="h-4 w-4 mr-1.5" /> Send All ({group.pitches.length})</>
                                                        )}
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Individual Pitches (when expanded) */}
                            {isExpanded && hasMultiplePitches && (
                                <div className="ml-8 space-y-2">
                                    {group.pitches.map((pitch, index) => {
                                        const sequenceLabel = pitch.pitch_type === 'initial' ? 'Initial Pitch' :
                                                            pitch.pitch_type?.startsWith('follow_up_') ?
                                                                `Follow-up #${pitch.pitch_type.replace('follow_up_', '')}` :
                                                                `Sequence #${pitch.sequence_number ?? (index + 1)}`;

                                        return (
                                            <Card key={pitch.pitch_id} className={`p-3 border-l-4 ${
                                                pitch.pitch_type === 'initial' ? 'border-green-400 bg-green-50/30' :
                                                'border-blue-300 bg-blue-50/30'
                                            }`}>
                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        checked={selectedPitchIds.includes(pitch.pitch_id)}
                                                        onCheckedChange={(checked) => handleSelectPitch(pitch.pitch_id, checked as boolean)}
                                                        disabled={isLoadingBulkSend || isLoadingSendForPitchId === pitch.pitch_id}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {sequenceLabel}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-600 italic">Subject: {pitch.subject_line || "Not set"}</p>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            {(pitch.final_text || pitch.draft_text || "No content").substring(0, 150)}...
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onPreview(pitch)}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                        {/* Show admin send button for premium clients when user is staff/admin */}
                                                        {isStaffOrAdmin && getCampaignSubscription(pitch.campaign_id) === 'paid_premium' ? (
                                                            <AdminSendPitchButton
                                                                pitchId={pitch.pitch_id}
                                                                campaignId={pitch.campaign_id}
                                                                recipientEmail={pitch.recipient_email || pitchEmails[pitch.pitch_gen_id]}
                                                                clientSubscriptionPlan="paid_premium"
                                                                size="sm"
                                                                showIcon={false}
                                                                buttonText="Send"
                                                            />
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                onClick={() => onSend(pitch.pitch_gen_id)}
                                                                disabled={isLoadingBulkSend || isLoadingSendForPitchId === pitch.pitch_gen_id}
                                                            >
                                                                {isLoadingSendForPitchId === pitch.pitch_gen_id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Send className="h-3 w-3" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SentPitchesTab({ pitches, isLoadingPitches }: { pitches: SentPitchStatus[]; isLoadingPitches: boolean; }) {
    const { canUseAI } = usePitchCapabilities();
    const [selectedThreadPitch, setSelectedThreadPitch] = useState<SentPitchStatus | null>(null);
    const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
    
    if (isLoadingPitches) {
        return <div className="border rounded-lg"><Skeleton className="h-48 w-full" /></div>;
    }
    if (!pitches || pitches.length === 0) {
        return <div className="text-center py-8 text-gray-500"><Info className="mx-auto h-10 w-10 mb-2"/>No pitches have been sent yet.</div>;
    }
    return (
        <>
        <div className="border rounded-lg overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead>Podcast</TableHead>
                        <TableHead>Campaign (Client)</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Replied At</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pitches.map((pitch) => (
                        <TableRow key={pitch.pitch_id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-800">
                                {pitch.media_name || `Media ID: ${pitch.media_id}`}
                                {pitch.media_website && (
                                    <a href={pitch.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-1">
                                        <ExternalLink className="inline h-3 w-3"/>
                                    </a>
                                )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">{pitch.campaign_name || 'N/A'} ({pitch.client_name || 'N/A'})</TableCell>
                            <TableCell className="text-xs text-gray-600 italic">{pitch.subject_line || "N/A"}</TableCell>
                            <TableCell><Badge variant={pitch.pitch_state === 'replied' || pitch.pitch_state === 'replied_interested' ? 'default' : 'secondary'} className="capitalize text-xs">{pitch.pitch_state?.replace('_', ' ') || "N/A"}</Badge></TableCell>
                            <TableCell className="text-xs text-gray-500">{pitch.send_ts ? formatUTCToLocal(pitch.send_ts, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}</TableCell>
                            <TableCell className="text-xs text-gray-500">{pitch.reply_ts ? formatUTCToLocal(pitch.reply_ts, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    
                                    {(pitch.pitch_state === 'replied' || pitch.pitch_state === 'replied_interested') && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => {
                                                setSelectedThreadPitch(pitch);
                                                setIsThreadModalOpen(true);
                                            }}
                                        >
                                            <MessageSquare className="w-3 h-3 mr-1" />
                                            View Thread
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Thread View Modal */}
        <Dialog open={isThreadModalOpen} onOpenChange={setIsThreadModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Email Thread</DialogTitle>
                    <DialogDescription>
                        {selectedThreadPitch?.media_name} - {selectedThreadPitch?.campaign_name}
                    </DialogDescription>
                </DialogHeader>
                {selectedThreadPitch && (
                    <PitchEmailThread 
                        pitchId={selectedThreadPitch.pitch_id}
                        podcastName={selectedThreadPitch.media_name || ''}
                    />
                )}
            </DialogContent>
        </Dialog>
    </>
    );
}

// --- Main PitchOutreach Component ---
export default function PitchOutreach() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [, navigate] = useLocation(); // Keep for potential future use
  const queryParams = new URLSearchParams(window.location.search);
  const initialCampaignIdFilter = queryParams.get("campaignId"); // Example: ?campaignId=some-uuid
  const { user } = useAuth();
  const { capabilities, isLoading: isLoadingCapabilities, canUseAI, isFreePlan, isAdmin } = usePitchCapabilities();
  const { hasPaidAccess, canAccessFeature } = useFeatureAccess();

  // Show paywall for clients without paid access
  const isClient = user?.role?.toLowerCase() === 'client';
  const shouldShowPaywall = isClient && !hasPaidAccess && !canAccessFeature('pitch-outreach');

  const [activeTabState, setActiveTabState] = useState<string>("readyForDraft");
  const [editingDraft, setEditingDraft] = useState<PitchDraftForReview | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewPitch, setPreviewPitch] = useState<PitchReadyToSend | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  // ManualPitchEditor state removed - using PitchSequenceEditor for all pitch creation
  const [sequencePitchMatch, setSequencePitchMatch] = useState<{ match_id: number; media_name?: string; campaign_name?: string; } | null>(null);
  const [isSequenceEditorOpen, setIsSequenceEditorOpen] = useState(false);
  const [createdInitialPitchGenId, setCreatedInitialPitchGenId] = useState<number | null>(null);
  const [editingRecipientEmail, setEditingRecipientEmail] = useState(false);
  const [tempRecipientEmail, setTempRecipientEmail] = useState("");
  const [editingSubject, setEditingSubject] = useState(false);
  const [tempSubject, setTempSubject] = useState("");
  const [editingBody, setEditingBody] = useState(false);
  const [tempBody, setTempBody] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Per-item loading states
  const [isLoadingGenerateForMatchId, setIsLoadingGenerateForMatchId] = useState<number | null>(null);
  const [isLoadingApproveForPitchGenId, setIsLoadingApproveForPitchGenId] = useState<number | null>(null);
  const [isLoadingSendForPitchId, setIsLoadingSendForPitchId] = useState<number | null>(null);
  // isLoadingBulkSend removed - now using sendBatchMutation.isPending from usePitchSending hook
  const [isLoadingBatchGenerate, setIsLoadingBatchGenerate] = useState(false);

  // State for pagination for "Review Drafts" tab
  const [reviewDraftsPage, setReviewDraftsPage] = useState(1);
  const REVIEW_DRAFTS_PAGE_SIZE = 100; // Increased from 10 to show more drafts per page

  // Filter campaign ID based on user role - clients only see their own campaigns
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string | null>(initialCampaignIdFilter);
  const userRole = user?.role?.toLowerCase();
  // isClient already declared above for paywall logic

  // Fetch campaigns for both campaign selector and Smart Send settings
  const { data: allCampaignsData = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['/campaigns/with-subscriptions', isClient ? 'client' : 'all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/campaigns/with-subscriptions');
      if (!response.ok) {
        // Fallback to regular campaigns endpoint
        const fallbackResponse = await apiRequest('GET', '/campaigns');
        if (!fallbackResponse.ok) throw new Error('Failed to fetch campaigns');
        const campaigns = await fallbackResponse.json();
        // Return campaigns without subscription data
        return campaigns.map((c: any) => ({ ...c, subscription_plan: 'free' }));
      }
      return response.json();
    },
    enabled: !!user, // Only fetch when user is loaded
  });

  // Filter campaigns for admin/staff to only show paid_premium
  const isStaffOrAdmin = userRole === 'admin' || userRole === 'staff';
  const campaignsData = isStaffOrAdmin
    ? allCampaignsData.filter((c: any) => c.subscription_plan === 'paid_premium')
    : allCampaignsData;

  // Auto-select campaign for clients with only one campaign
  React.useEffect(() => {
    if (isClient && campaignsData && campaignsData.length === 1 && !selectedCampaignFilter) {
      setSelectedCampaignFilter(campaignsData[0].campaign_id);
    }
  }, [isClient, campaignsData, selectedCampaignFilter]);

  // Fetch pitch templates for the dropdown (only for non-clients)
  const { data: pitchTemplates = [], isLoading: isLoadingTemplates, error: templatesError } = useQuery<PitchTemplate[]>({
    queryKey: ["/pitch-templates/"],
    queryFn: async () => {
        // Skip fetching templates for clients as they don't have access
        if (isClient) {
            return [];
        }
        const response = await apiRequest("GET", "/pitch-templates/");
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Failed to fetch pitch templates" }));
            throw new Error(errorData.detail);
        }
        return response.json();
    },
    enabled: !isClient && !!user, // Only fetch for staff/admin
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  // --- Data Fetching with React Query ---

  // 1. Fetch Approved Matches without pitches (for "Ready for Draft" tab)
  const { data: approvedMatchesData, isLoading: isLoadingApprovedMatches, error: approvedMatchesError } = useQuery<ApprovedMatchForPitching[]>({
    queryKey: ["approvedMatchesForPitching", selectedCampaignFilter, isClient],
    queryFn: async ({ queryKey }) => {
      const [, campaignId, clientOnly] = queryKey as [string, string | null, boolean];
      let url = `/match-suggestions/approved-without-pitches`;
      const params = new URLSearchParams();
      if (campaignId) params.append('campaign_id', campaignId);
      if (clientOnly) params.append('client_only', 'true');
      if (params.toString()) url += `?${params.toString()}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch approved matches without pitches");
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
  });
  const approvedMatches = approvedMatchesData || [];

  // 2. Fetch Pitch Drafts for Review (paginated)
  const { data: reviewTasksPageData, isLoading: isLoadingPitchDrafts, error: reviewDraftsError } = useQuery<{
    items: PitchDraftForReview[]; total: number; page: number; size: number; pages?: number; // pages might not be returned by all backends
  }>({
    queryKey: ["pitchDraftsForReview", reviewDraftsPage, selectedCampaignFilter, isClient],
    queryFn: async ({ queryKey }) => {
      const [, page, campaignId, clientOnly] = queryKey as [string, number, string | null, boolean];
      let url = `/review-tasks/?task_type=pitch_review&status=pending&page=${page}&size=${REVIEW_DRAFTS_PAGE_SIZE}`;
      if (campaignId) url += `&campaign_id=${campaignId}`;
      if (clientOnly) url += `&client_only=true`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch pitch drafts for review");
      // Backend status filter not working correctly - returns completed tasks when requesting pending
      // Client-side filtering applied as workaround
      return response.json();
    },
    staleTime: 1000 * 60 * 1,
  });
  // Filter out non-pending tasks (backend status filter not working correctly)
  const allPitchDrafts = reviewTasksPageData?.items || [];
  const pitchDraftsForReview = allPitchDrafts.filter(draft => draft.status === 'pending');
  const reviewDraftsTotalItems = pitchDraftsForReview.length;
  const reviewDraftsTotalPages = Math.ceil(reviewDraftsTotalItems / REVIEW_DRAFTS_PAGE_SIZE);


  // 3. Fetch Pitches Ready to Send
  const { data: pitchesReadyData, isLoading: isLoadingReadyToSend, error: pitchesReadyError } = useQuery<PitchReadyToSend[]>({
    queryKey: ["pitchesReadyToSend", selectedCampaignFilter, isClient],
    queryFn: async ({ queryKey }) => {
      const [, campaignId, clientOnly] = queryKey as [string, string | null, boolean];
      let url = `/pitches/?pitch_state__in=ready_to_send`; // Using __in filter as per backend documentation
      if (campaignId) url += `&campaign_id=${campaignId}`;
      if (clientOnly) url += `&client_only=true`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch pitches ready to send");
      // Assuming backend /pitches/ returns enriched PitchReadyToSend data
      return response.json();
    },
    staleTime: 1000 * 60 * 1,
  });
  const pitchesReadyToSend = pitchesReadyData || [];

  // 4. Fetch Sent Pitches
  const { data: sentPitchesData, isLoading: isLoadingSentPitches, error: sentPitchesError } = useQuery<SentPitchStatus[]>({
    queryKey: ["sentPitchesStatus", selectedCampaignFilter, isClient],
    queryFn: async ({ queryKey }) => {
      const [, campaignId, clientOnly] = queryKey as [string, string | null, boolean];
      // Build query with multiple pitch_state__in parameters
      const states = ['sent', 'opened', 'replied', 'clicked', 'replied_interested', 'live', 'paid', 'lost'];
      const params = new URLSearchParams();
      states.forEach(state => params.append('pitch_state__in', state));
      if (campaignId) params.append('campaign_id', campaignId);
      if (clientOnly) params.append('client_only', 'true');
      
      const url = `/pitches/?${params.toString()}`;
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch sent pitches");
      return response.json();
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
  const sentPitches = sentPitchesData || [];


  // --- Mutations ---
  // AI Generation mutation (for paid users)
  const generatePitchDraftMutation = useMutation({
    mutationFn: async ({ matchId, pitch_template_id }: { matchId: number; pitch_template_id: string }) => {
      setIsLoadingGenerateForMatchId(matchId);
      const response = await apiRequest("POST", "/pitches/generate", { match_id: matchId, pitch_template_id: pitch_template_id });
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to generate pitch draft." })); throw new Error(errorData.detail); }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Pitch Draft Generated", description: data.message || "Draft created and is ready for review." });
      refreshAllPitchData();
      setActiveTabState("draftsReview");
    },
    onError: (error: any) => { toast({ title: "Generation Failed", description: error.message, variant: "destructive" }); },
    onSettled: () => { setIsLoadingGenerateForMatchId(null); }
  });

  const generateBatchPitchDraftsMutation = useMutation({
    mutationFn: async (items: { match_id: number; pitch_template_id: string }[]) => {
      setIsLoadingBatchGenerate(true);
      const response = await apiRequest("POST", "/pitches/generate-batch", items);
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate batch pitches." })); 
        throw new Error(errorData.detail); 
      }
      return response.json();
    },
    onSuccess: (data) => {
      const count = Array.isArray(data) ? data.length : data.count || 'multiple';
      toast({ 
        title: "Batch Generation Complete", 
        description: `Successfully generated ${count} pitch draft${count !== 1 ? 's' : ''}. Ready for review.` 
      });
      refreshAllPitchData();
      setActiveTabState("draftsReview");
    },
    onError: (error: any) => { 
      toast({ title: "Batch Generation Failed", description: error.message, variant: "destructive" }); 
    },
    onSettled: () => { setIsLoadingBatchGenerate(false); }
  });

  const approvePitchDraftMutation = useMutation({
    mutationFn: async (pitchGenId: number) => {
      setIsLoadingApproveForPitchGenId(pitchGenId);
      const response = await apiRequest("PATCH", `/pitches/generations/${pitchGenId}/approve`, {});
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to approve draft." })); throw new Error(errorData.detail); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Pitch Approved", description: "Pitch draft approved and moved to 'Ready to Send'." });
      refreshAllPitchData();
      setActiveTabState("readyToSend");
    },
    onError: (error: any) => { toast({ title: "Approval Failed", description: error.message, variant: "destructive" }); },
    onSettled: () => { setIsLoadingApproveForPitchGenId(null); }
  });

  const updatePitchDraftMutation = useMutation({
    mutationFn: async ({ pitchGenId, data }: { pitchGenId: number; data: EditDraftFormData }) => {
      const payload = {
        draft_text: data.draft_text,
        new_subject_line: data.subject_line,
      };
      const response = await apiRequest("PATCH", `/pitches/generations/${pitchGenId}/content`, payload);
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to update draft." })); throw new Error(errorData.detail); }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Draft Updated", description: "Pitch draft and subject line saved." });
      refreshAllPitchData();
      setIsEditModalOpen(false); setEditingDraft(null);
    },
    onError: (error: any) => { toast({ title: "Update Failed", description: error.message, variant: "destructive" }); },
  });

  // Get Nylas sending functions
  const {
    sendPitch: sendPitchViaNylas,
    sendBatch: sendBatchViaNylas,
    sendBatchMutation,
    isPitchSending,
    isEmailConnected
  } = usePitchSending();

  // OLD: Replaced with Nylas sending
  /*
  const sendPitchMutation = useMutation({
    mutationFn: async (pitchId: number) => {
        setIsLoadingSendForPitchId(pitchId);
        // Calls POST /pitches/{pitch_id}/send
        const response = await apiRequest("POST", `/pitches/${pitchId}/send`, {});
        if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Failed to send pitch." })); throw new Error(errorData.detail); }
        return response.json();
    },
    onSuccess: (data) => {
        toast({ title: "Pitch Sent", description: data.message || "Pitch has been queued for sending." });
        tanstackQueryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
        tanstackQueryClient.invalidateQueries({ queryKey: ["sentPitchesStatus"] });
    },
    onError: (error: any) => { toast({ title: "Send Failed", description: error.message, variant: "destructive" }); },
    onSettled: () => { setIsLoadingSendForPitchId(null); }
  });
  */

  // NEW: Send entire sequence using the new endpoint
  const sendSequenceMutation = useMutation({
    mutationFn: async (matchId: number) => {
      const response = await apiRequest("POST", `/pitches/send-sequence/${matchId}`, {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to send sequence" }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      const followUpCount = data.scheduled_follow_ups?.length || 0;
      toast({
        title: "Sequence Sent Successfully!",
        description: followUpCount > 0
          ? `Initial pitch sent and ${followUpCount} follow-up${followUpCount > 1 ? 's' : ''} scheduled`
          : "Pitch sent successfully",
      });
      refreshAllPitchData();
      setActiveTabState("sentPitches");
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLoadingSendForPitchId(null);
    }
  });

  // Legacy: Keep old sending for backwards compatibility if needed
  const sendPitchMutation = {
    mutate: (pitchGenId: number) => {
      setIsLoadingSendForPitchId(pitchGenId);
      sendPitchViaNylas(pitchGenId);
      // Refresh data after a short delay to show the update
      setTimeout(() => {
        setIsLoadingSendForPitchId(null);
        refreshAllPitchData();
        setActiveTabState("sentPitches");
      }, 2000);
    },
    isPending: false
  };

  // Admin/Staff bulk send mutation using the correct endpoint
  const bulkSendPitchesMutation = useMutation({
    mutationFn: async (pitchIds: number[]) => {
        const response = await apiRequest("POST", `/pitches/bulk-send`, pitchIds);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Failed to send pitches." }));
            throw new Error(errorData.detail);
        }
        return response.json();
    },
    onSuccess: (data) => {
        const successCount = data.successful || 0;
        const failCount = data.failed || 0;

        let description = `Successfully sent ${successCount} pitch${successCount !== 1 ? 'es' : ''}.`;
        if (failCount > 0) {
            description += ` ${failCount} failed.`;
        }

        toast({
            title: "Bulk Send Complete",
            description,
            variant: failCount > 0 ? "default" : "default"
        });

        refreshAllPitchData();
        setActiveTabState("sentPitches");
    },
    onError: (error: any) => {
        toast({ title: "Bulk Send Failed", description: error.message, variant: "destructive" });
    }
  });



  // Helper function to refresh all pitch-related data for better UX
  const refreshAllPitchData = useCallback(() => {
    // Invalidate all pitch-related queries to force immediate refresh
    tanstackQueryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
    tanstackQueryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
    tanstackQueryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
    tanstackQueryClient.invalidateQueries({ queryKey: ["sentPitchesStatus"] });
    // Also refetch immediately for instant updates
    tanstackQueryClient.refetchQueries({ queryKey: ["approvedMatchesForPitching"] });
    tanstackQueryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });
    tanstackQueryClient.refetchQueries({ queryKey: ["pitchesReadyToSend"] });
    tanstackQueryClient.refetchQueries({ queryKey: ["sentPitchesStatus"] });
    setLastRefreshTime(new Date());
  }, [tanstackQueryClient]);

  // Set global functions for use in child components
  React.useEffect(() => {
    globalRefreshAllPitchData = refreshAllPitchData;
    globalSetActiveTab = setActiveTabState;
  }, [refreshAllPitchData, setActiveTabState]);

  const handleGeneratePitch = (matchId: number, templateId: string) => {
    // This function is now deprecated - we use PitchSequenceEditor for all pitch creation
    const match = approvedMatches.find(m => m.match_id === matchId);
    if (match) {
      setSequencePitchMatch({
        match_id: match.match_id,
        media_name: match.media_name || undefined,
        campaign_name: match.campaign_name || undefined
      });
      setIsSequenceEditorOpen(true);
    }
  };
  const handleGenerateBatchPitches = (items: { match_id: number; pitch_template_id: string }[]) => {
    if (!canUseAI) {
      toast({ title: "Premium Feature", description: "Batch AI pitch generation requires a Premium subscription.", variant: "destructive"});
      return;
    }
    generateBatchPitchDraftsMutation.mutate(items);
  };
  const handleApprovePitch = (pitchGenId: number) => { approvePitchDraftMutation.mutate(pitchGenId); };
  const handleSendPitch = (pitchGenId: number) => { sendPitchMutation.mutate(pitchGenId); };
  const handleSendSequence = (matchId: number) => {
    setIsLoadingSendForPitchId(matchId); // Use matchId as loading indicator
    sendSequenceMutation.mutate(matchId);
  };
  const handleBulkSendPitches = (pitchIds: number[]) => { bulkSendPitchesMutation.mutate(pitchIds); };
  const handleOpenEditModal = (draft: PitchDraftForReview) => { setEditingDraft(draft); setIsEditModalOpen(true); };
  const handleSaveEditedDraft = (pitchGenId: number, data: EditDraftFormData) => { updatePitchDraftMutation.mutate({ pitchGenId, data }); };
  const handlePreviewPitch = (pitch: PitchReadyToSend) => { setPreviewPitch(pitch); setIsPreviewModalOpen(true); };

  const handleReviewDraftsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= reviewDraftsTotalPages) {
        setReviewDraftsPage(newPage);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      refreshAllPitchData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshAllPitchData]);

  // Show loading state while capabilities are being fetched
  if (isLoadingCapabilities) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Upgrade Banner for free users */}
      {shouldShowPaywall && (
        <UpgradeBanner
          featureName="Pitch Outreach"
          featureDescription="Create, manage, and send personalized podcast pitches with AI assistance."
        />
      )}

      {/* Main Content */}
      <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Send className="mr-3 h-6 w-6 text-primary" />
                Pitch Outreach & Management
            </h1>
            <p className="text-gray-600">
              {isClient 
                ? "Create and manage pitches for your podcast outreach campaigns."
                : "Oversee the entire pitch lifecycle from drafting to sending and tracking."}
            </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshAllPitchData()}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          {lastRefreshTime && (
            <span className="text-xs text-gray-500">
              Last updated: {lastRefreshTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {capabilities && (
            <Badge variant={isFreePlan ? "secondary" : "default"} className="text-sm">
              {capabilities.plan_type === 'admin' ? 'Admin' :
               capabilities.plan_type === 'paid_premium' ? 'Premium' :
               capabilities.plan_type === 'paid_basic' ? 'Basic' : 'Free'} Plan
            </Badge>
          )}
          {/* Only show email connection for clients, not for staff/admin who use shared sending accounts */}
          {isClient && <EmailStatusBadge showConnectButton={true} showDisconnect={true} />}
        </div>
      </div>

      {/* Show upgrade prompt for free users - single card only */}
      {isFreePlan && (
        <FreeUserUpgradeCard variant="compact" context="banner" />
      )}

      {/* Campaign filter - only show if admin/staff OR client with multiple campaigns */}
      {(!isClient || (isClient && campaignsData && campaignsData.length > 1)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Selection</CardTitle>
            <CardDescription>Select a campaign to manage its pitches and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <CampaignSelector
              selectedCampaignId={selectedCampaignFilter}
              onCampaignChange={setSelectedCampaignFilter}
              campaigns={campaignsData}
              isLoading={isLoadingCampaigns}
            />
          </CardContent>
        </Card>
      )}

      {/* Smart Send Settings - Show for paid_basic clients only (not for admin/staff managing premium campaigns) */}
      {!isFreePlan && user?.role !== 'admin' && user?.role !== 'staff' && (
        <SmartSendSettings
          campaignId={
            // If a campaign is selected, use it
            selectedCampaignFilter ||
            // If user has only one campaign, auto-select it
            (campaignsData?.length === 1 ? campaignsData[0].campaign_id : null) ||
            // Otherwise require selection
            null
          }
          campaignName={
            selectedCampaignFilter
              ? campaignsData?.find((c: any) => c.campaign_id === selectedCampaignFilter)?.campaign_name
              : campaignsData?.length === 1
                ? campaignsData[0].campaign_name
                : undefined
          }
          campaigns={campaignsData} // Pass all campaigns for selection
          onCampaignChange={setSelectedCampaignFilter} // Allow changing campaign from Smart Send
        />
      )}

      {/* Info for Admin/Staff about Smart Send */}
      {!isFreePlan && (user?.role === 'admin' || user?.role === 'staff') && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Smart Send Schedule for Premium Campaigns</p>
                <p className="text-sm text-gray-600 mt-1">
                  Premium (DFY) campaign sending schedules are managed globally.
                  Go to <Link href="/settings" className="text-primary hover:underline">Settings → Admin Settings</Link> to configure the global schedule.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        {/* Locked overlay for free users */}
        {shouldShowPaywall && (
          <LockedOverlay message="Upgrade to create and manage pitch outreach campaigns" />
        )}

        <Tabs defaultValue={activeTabState} onValueChange={setActiveTabState} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="readyForDraft"><Lightbulb className="mr-1.5 h-4 w-4"/>Ready for Draft ({isLoadingApprovedMatches ? '...' : approvedMatches.length})</TabsTrigger>
          <TabsTrigger value="draftsReview"><Edit3 className="mr-1.5 h-4 w-4"/>Review Drafts ({isLoadingPitchDrafts ? '...' : pitchDraftsForReview.length})</TabsTrigger>
          <TabsTrigger value="readyToSend"><MailCheck className="mr-1.5 h-4 w-4"/>Ready to Send ({isLoadingReadyToSend ? '...' : pitchesReadyToSend.length})</TabsTrigger>
          <TabsTrigger value="sentPitches"><MailOpen className="mr-1.5 h-4 w-4"/>Sent Pitches ({isLoadingSentPitches ? '...' : sentPitches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="readyForDraft" className="mt-6">
          <ReadyForDraftTab
            approvedMatches={approvedMatches}
            isLoadingMatches={isLoadingApprovedMatches}
            selectedCampaignId={selectedCampaignFilter}
            campaigns={campaignsData}
            onCreateSequence={(match) => {
              setSequencePitchMatch({
                match_id: match.match_id,
                media_name: match.media_name || undefined,
                campaign_name: match.campaign_name || undefined
              });
              setIsSequenceEditorOpen(true);
            }}
          />
          {approvedMatchesError && <p className="text-red-500 mt-2">Error loading approved matches: {(approvedMatchesError as Error).message}</p>}
          {templatesError && <p className="text-red-500 mt-2">Error loading pitch templates: {(templatesError as Error).message}</p>}
        </TabsContent>

        <TabsContent value="draftsReview" className="mt-6">
          <div className="space-y-4">
            {/* Bulk Actions for Paid Users and Admins */}
            {pitchDraftsForReview.length > 0 && (
              <div className="grid gap-3">
                {/* Bulk Follow-up Generation - requires campaign selection */}
                {(capabilities?.plan_type === 'paid_basic' || capabilities?.plan_type === 'paid_premium' || capabilities?.plan_type === 'admin' || isAdmin) && selectedCampaignFilter && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-blue-900">Bulk Generate Follow-ups</h3>
                        <p className="text-sm text-blue-700">
                          Generate follow-ups for all existing pitches in this campaign.
                        </p>
                      </div>
                      <BulkFollowUpButton
                        campaignId={selectedCampaignFilter}
                        campaignName={campaignsData?.find((c: any) => c.campaign_id === selectedCampaignFilter)?.campaign_name}
                        onComplete={() => {
                          // Refresh all pitch-related data
                          refreshAllPitchData();
                        }}
                        size="sm"
                      />
                    </div>
                  </div>
                )}

                {/* Bulk Approve - works across all visible drafts */}
                {(capabilities?.plan_type === 'paid_basic' || capabilities?.plan_type === 'paid_premium' || capabilities?.plan_type === 'admin' || isAdmin) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-green-900">Bulk Approve Pitches</h3>
                        <p className="text-sm text-green-700">
                          Approve all {pitchDraftsForReview.length} draft{pitchDraftsForReview.length !== 1 ? 's' : ''} and move them to "Ready to Send".
                        </p>
                      </div>
                      <BulkApproveButton
                        pitchGenIds={pitchDraftsForReview.map(d => d.pitch_gen_id)}
                        onComplete={() => {
                          // Refresh all pitch-related data
                          refreshAllPitchData();
                          // Switch to "Ready to Send" tab
                          setActiveTabState("readyToSend");
                        }}
                        size="sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <ModernPitchReview
              drafts={pitchDraftsForReview}
              onApprove={handleApprovePitch}
              onEdit={handleOpenEditModal}
              onBatchAction={(action, draftIds) => {
                if (action === 'approve') {
                  draftIds.forEach(id => {
                    const draft = pitchDraftsForReview.find(d => d.pitch_gen_id === id);
                    if (draft) handleApprovePitch(draft.pitch_gen_id);
                  });
                }
              }}
              isLoading={isLoadingPitchDrafts}
              isProcessing={isLoadingApproveForPitchGenId !== null}
              canUseAI={canUseAI}
            />
            {reviewDraftsError && <p className="text-red-500 mt-2">Error loading drafts for review: {(reviewDraftsError as Error).message}</p>}
          </div>
        </TabsContent>

        <TabsContent value="readyToSend" className="mt-6">
           <ReadyToSendTab
             pitches={pitchesReadyToSend}
             onSend={handleSendPitch}
             onBulkSend={handleBulkSendPitches}
             onPreview={handlePreviewPitch}
             onSendSequence={handleSendSequence}
             isLoadingSendForPitchId={isLoadingSendForPitchId}
             isLoadingBulkSend={bulkSendPitchesMutation.isPending}
             isLoadingPitches={isLoadingReadyToSend}
             campaigns={campaignsData}
           />
           {pitchesReadyError && <p className="text-red-500 mt-2">Error loading pitches ready to send: {(pitchesReadyError as Error).message}</p>}
        </TabsContent>

        <TabsContent value="sentPitches" className="mt-6">
           <SentPitchesTab pitches={sentPitches} isLoadingPitches={isLoadingSentPitches} />
           {sentPitchesError && <p className="text-red-500 mt-2">Error loading sent pitches: {(sentPitchesError as Error).message}</p>}
        </TabsContent>
      </Tabs>
      </div>

      <EditDraftModal
        draft={editingDraft}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveEditedDraft}
        isSaving={updatePitchDraftMutation.isPending}
      />

      {/* Pitch Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={(open) => {
        setIsPreviewModalOpen(open);
        if (!open) {
          setEditingRecipientEmail(false);
          setEditingSubject(false);
          setEditingBody(false);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pitch Preview</DialogTitle>
            <DialogDescription>
              {previewPitch?.media_name} - {previewPitch?.campaign_name}
            </DialogDescription>
          </DialogHeader>
          
          {previewPitch && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">To:</h4>
                <p className="text-sm">{previewPitch.media_name}</p>
                {previewPitch.media_website && (
                  <a href={previewPitch.media_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center mt-1">
                    <ExternalLink className="h-3 w-3 mr-1"/> {previewPitch.media_website}
                  </a>
                )}
              </div>

              {/* Only admin/staff can see recipient email */}
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Recipient Email:</h4>
                  <div className="flex items-center gap-2">
                    {editingRecipientEmail ? (
                      <>
                        <Input
                          type="email"
                          value={tempRecipientEmail}
                          onChange={(e) => setTempRecipientEmail(e.target.value)}
                          placeholder="Enter recipient email"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (tempRecipientEmail && tempRecipientEmail.includes('@')) {
                              try {
                                const response = await apiRequest('PATCH', `/pitches/generations/${previewPitch.pitch_gen_id}/content`, {
                                  recipient_email: tempRecipientEmail
                                });
                                if (response.ok) {
                                  setPreviewPitch({ ...previewPitch, recipient_email: tempRecipientEmail });
                                  toast({ title: "Email updated", description: "Recipient email has been updated successfully." });
                                  setEditingRecipientEmail(false);
                                } else {
                                  throw new Error('Failed to update email');
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to update recipient email. Please try again.",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRecipientEmail(false);
                            setTempRecipientEmail(previewPitch.recipient_email || "");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm bg-gray-50 p-2 rounded flex-1">
                          {previewPitch.recipient_email || "No recipient email set"}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRecipientEmail(true);
                            setTempRecipientEmail(previewPitch.recipient_email || "");
                          }}
                        >
                          <Edit3 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Subject:</h4>
                <div className="flex items-center gap-2">
                  {editingSubject ? (
                    <>
                      <Input
                        value={tempSubject}
                        onChange={(e) => setTempSubject(e.target.value)}
                        placeholder="Enter subject line"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (tempSubject.trim()) {
                            try {
                              const response = await apiRequest('PATCH', `/pitches/generations/${previewPitch.pitch_gen_id}/content`, {
                                new_subject_line: tempSubject
                              });
                              if (response.ok) {
                                setPreviewPitch({ ...previewPitch, subject_line: tempSubject });
                                toast({ title: "Subject updated", description: "Subject line has been updated successfully." });
                                setEditingSubject(false);
                              } else {
                                throw new Error('Failed to update subject');
                              }
                            } catch (error) {
                              toast({ 
                                title: "Error", 
                                description: "Failed to update subject line. Please try again.", 
                                variant: "destructive" 
                              });
                            }
                          }
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSubject(false);
                          setTempSubject(previewPitch.subject_line || "");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm bg-gray-50 p-2 rounded flex-1">
                        {previewPitch.subject_line || "No subject line set"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSubject(true);
                          setTempSubject(previewPitch.subject_line || "");
                        }}
                      >
                        <Edit3 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Body:</h4>
                {editingBody ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tempBody}
                      onChange={(e) => setTempBody(e.target.value)}
                      placeholder="Enter email body"
                      className="min-h-[300px] text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (tempBody.trim()) {
                            try {
                              const response = await apiRequest('PATCH', `/pitches/generations/${previewPitch.pitch_gen_id}/content`, {
                                draft_text: tempBody
                              });
                              if (response.ok) {
                                setPreviewPitch({ ...previewPitch, final_text: tempBody });
                                toast({ title: "Body updated", description: "Email body has been updated successfully." });
                                setEditingBody(false);
                                refreshAllPitchData();
                              } else {
                                throw new Error('Failed to update body');
                              }
                            } catch (error) {
                              toast({ 
                                title: "Error", 
                                description: "Failed to update email body. Please try again.", 
                                variant: "destructive" 
                              });
                            }
                          }
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingBody(false);
                          setTempBody(previewPitch.final_text || previewPitch.draft_text || "");
                        }}
                      >
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-sm">
                      {previewPitch.final_text || previewPitch.draft_text || "No content available"}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setEditingBody(true);
                        setTempBody(previewPitch.final_text || previewPitch.draft_text || "");
                      }}
                    >
                      <Edit3 className="h-3 w-3 mr-1" /> Edit Body
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Campaign: {previewPitch.campaign_name}</p>
                <p>Client: {previewPitch.client_name}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
            <Button 
              onClick={() => {
                if (previewPitch) {
                  handleSendPitch(previewPitch.pitch_gen_id);
                  setIsPreviewModalOpen(false);
                }
              }}
              disabled={isLoadingSendForPitchId === previewPitch?.pitch_gen_id}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoadingSendForPitchId === previewPitch?.pitch_gen_id ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-1"/> Sending...</>
              ) : (
                <><Send className="h-4 w-4 mr-1.5"/> Send Pitch</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pitch Sequence Editor Modal - Used for all pitch creation */}
      <PitchSequenceEditor
        isOpen={isSequenceEditorOpen}
        onClose={() => {
          setIsSequenceEditorOpen(false);
          setSequencePitchMatch(null);
        }}
        match={sequencePitchMatch ? {
          match_id: sequencePitchMatch.match_id,
          media_name: sequencePitchMatch.media_name || undefined,
          campaign_name: sequencePitchMatch.campaign_name || undefined
        } : { match_id: 0 }}
        onSuccess={(initialPitchGenId) => {
          // Store the initial pitch ID and refresh data
          setCreatedInitialPitchGenId(initialPitchGenId);
          refreshAllPitchData();
          setActiveTabState("readyToSend");
          
          // Show a notification about the sequence
          toast({
            title: "Sequence Ready",
            description: "Your pitch sequence has been created. Send the initial pitch to activate automatic follow-ups.",
          });
        }}
      />
    </div>
    </>
  );
}