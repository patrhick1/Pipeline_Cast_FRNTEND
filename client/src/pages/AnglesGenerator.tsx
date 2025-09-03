// client/src/pages/AnglesGenerator.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Copy, 
  RefreshCw, 
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Link as LinkIcon, // Renamed to avoid conflict with wouter Link
  Info,
  Tags,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter"; // For navigation links
import { KeywordEditor } from "@/components/KeywordEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientCampaign {
  campaign_id: string;
  campaign_name: string;
  person_id: number;
  campaign_bio?: string | null;
  campaign_angles?: string | null;
  mock_interview_trancript?: string | null;
  questionnaire_responses?: any | null;
  campaign_keywords?: string[] | null;
}

// This interface is a placeholder. The actual angles are generated as GDoc content.
// The backend returns links to these GDocs.
interface GeneratedAngleDisplayInfo {
  title: string; // e.g., "Generated Angles Document"
  link: string;
  type: "angles" | "bio";
}

interface AnglesBioTriggerResponse {
    campaign_id: string;
    status: string; 
    message: string;
    details?: {
        bio_doc_link?: string | null;
        angles_doc_link?: string | null;
        keywords?: string[] | null;
    } | null;
}

interface AnglesGeneratorProps {
  campaignId: string | null;
  onSuccessfulGeneration?: () => void;
  onKeywordsUpdate?: (keywords: string[]) => void | Promise<void>;
  isKeywordsUpdateLoading?: boolean;
  // We could also pass a flag like `isQuestionnaireComplete` if ProfileSetup has this readily available
  // to manage the disabled state of the generate button, rather than AnglesGenerator re-fetching campaign details for this.
  // For now, AnglesGenerator will still fetch minimal campaign details to check `mock_interview_trancript`
  // or rely on parent to disable it if questionnaire is not complete.
}

export default function AnglesGenerator({ campaignId, onSuccessfulGeneration, onKeywordsUpdate, isKeywordsUpdateLoading }: AnglesGeneratorProps) {
  // Remove local selectedCampaignId and clientCampaigns query as campaignId is now a prop
  // const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<AnglesBioTriggerResponse['details']>(null);
  const [isProcessingCampaignContent, setIsProcessingCampaignContent] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [anglesModalOpen, setAnglesModalOpen] = useState(false);
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth(); // Keep useAuth for potential user context if needed

  // Fetch details for the *specific* campaignId passed as prop to check its status (e.g., mock_interview_trancript)
  // This is a simplified fetch, ProfileSetup might already have this data.
  const { data: campaignDetails, isLoading: isLoadingCampaignDetails } = useQuery<ClientCampaign | null>({
    queryKey: ["campaignDetailsForAnglesGenerator", campaignId], // Use prop campaignId
    queryFn: async () => {
      if (!campaignId) return null;
      const response = await apiRequest("GET", `/campaigns/${campaignId}`);
      if (!response.ok) {
        // console.warn(`Failed to fetch campaign details for ${campaignId} in AnglesGenerator`);
        // It might be better to let the mutation handle the error if the campaign doesn't exist or questionnaire is not ready
        return null; 
      }
      return response.json();
    },
    enabled: !!campaignId, // Only run if campaignId is provided
  });

  // const { data: clientCampaigns = [], isLoading: isLoadingCampaigns } = useQuery<ClientCampaign[]>({
  //   queryKey: ["clientCampaignsForAngles", user?.person_id],
  //   queryFn: async () => {
  //     if (!user?.person_id) return [];
  //     const response = await apiRequest("GET", `/campaigns/?person_id=${user.person_id}`);
  //     if (!response.ok) throw new Error("Failed to fetch client campaigns");
  //     const campaigns: ClientCampaign[] = await response.json();
  //     // Filter for campaigns that have a mock interview transcript, indicating questionnaire is likely filled.
  //     return campaigns.filter(c => c.mock_interview_trancript && c.mock_interview_trancript.trim() !== "");
  //   },
  //   enabled: !!user?.person_id && !authLoading,
  // });
  
  // const selectedCampaignDetails = clientCampaigns.find(c => c.campaign_id === selectedCampaignId);

  const triggerAnglesBioMutation = useMutation({
    mutationFn: async (currentCampaignId: string): Promise<AnglesBioTriggerResponse> => { // parameter renamed to avoid conflict with prop
      if (!currentCampaignId) throw new Error("Campaign ID is required for generation.");
      const response = await apiRequest("POST", `/campaigns/${currentCampaignId}/generate-angles-bio`, {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to trigger generation."}));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === "success" && data.details) {
        setGeneratedContent(data.details);
        // toast({ title: "Generation Successful", description: data.message }); // Handled by parent
        setIsProcessingCampaignContent(true);
        // toast({ // Handled by parent
        //   title: "Processing Campaign Content",
        //   description: "Bio & Angles generated. We're now further processing your campaign content for enhanced matching.",
        //   duration: 7000,
        // });
        if (onSuccessfulGeneration) {
          onSuccessfulGeneration();
        }
      } else {
        setGeneratedContent(null);
        setIsProcessingCampaignContent(false);
        toast({ title: "Generation Info", description: data.message, variant: data.status === "error" ? "destructive" : "default" });
      }
      // Invalidation will be handled by parent or specific queries in ProfileSetup after callback
      // if (campaignId) { // Use prop campaignId
      //   tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForAngles", user?.person_id] });
      //   tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetails", campaignId] });
      //   tanstackQueryClient.invalidateQueries({ queryKey: ["campaignKeywords", campaignId] });
      // }
    },
    onError: (error: any) => {
      setGeneratedContent(null);
      setIsProcessingCampaignContent(false);
      toast({ title: "Generation Failed", description: error.message || "Could not trigger angles/bio generation.", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!campaignId) { // Use prop campaignId
      toast({ title: "Campaign Required", description: "Please select a campaign (this should not happen).", variant: "destructive" });
      return;
    }
    // const campaign = clientCampaigns.find(c => c.campaign_id === campaignId);
    // Check for either questionnaire_responses or mock_interview_transcript
    const hasQuestionnaire = campaignDetails?.questionnaire_responses && 
                            Object.keys(campaignDetails.questionnaire_responses).length > 0;
    const hasTranscript = campaignDetails?.mock_interview_trancript && 
                         campaignDetails.mock_interview_trancript.trim() !== "";
    
    if (!campaignDetails || (!hasQuestionnaire && !hasTranscript)) {
        toast({ title: "Questionnaire Needed", description: "The selected campaign needs a completed questionnaire before generating angles/bio.", variant: "destructive" });
        return;
    }
    setGeneratedContent(null); // Clear previous results
    triggerAnglesBioMutation.mutate(campaignId); // Use prop campaignId
  };

  if (authLoading || (campaignId && isLoadingCampaignDetails)) { // Check loading state for campaignDetails if campaignId is present
    return <div className="p-6 text-center"><Skeleton className="h-10 w-1/2 mx-auto mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!campaignId) { // If no campaign is selected (passed as prop)
    return (
        <Card>
            <CardContent className="p-6 text-center text-gray-500">
                <Info className="mx-auto h-10 w-10 mb-3 text-blue-500" />
                <p>Please select a campaign in the main setup page to generate AI Bio & Angles.</p>
            </CardContent>
        </Card>
    );
  }

  // Check if questionnaire is complete for the selected campaign (using campaignDetails)
  const hasQuestionnaire = campaignDetails?.questionnaire_responses && 
                          Object.keys(campaignDetails.questionnaire_responses).length > 0;
  const hasTranscript = campaignDetails?.mock_interview_trancript && 
                       campaignDetails.mock_interview_trancript.trim() !== "";
  const isQuestionnaireCompleteForSelectedCampaign = !!(hasQuestionnaire || hasTranscript);

  return (
    <>
          {/* How Bio & Angles Generation Works - moved to top for better UX */}
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2"><Info className="h-5 w-5"/>How Bio & Angles Generation Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-600 space-y-2">
                <p>1. First, ensure you have selected a campaign and completed its <Link href="/questionnaire" className="font-medium underline hover:text-blue-700">Questionnaire</Link>. This provides the core information (mock interview transcript) our AI needs.</p>
                <p>2. Once a campaign with a completed questionnaire is selected, click the "Generate Bio & Angles" button.</p>
                <p>3. Our AI system (<code>AnglesProcessorPG</code> on the backend) will analyze the mock interview transcript and other campaign details.</p>
                <p>4. It will then generate:</p>
                <ul className="list-disc list-inside pl-4">
                    <li>A comprehensive client bio (Full, Summary, Short versions).</li>
                    <li>A set of at least 10 potential pitch angles (Topic, Outcome, Description).</li>
                    <li>A list of relevant keywords for the campaign.</li>
                </ul>
                <p>5. The generated bio and angles will be saved as new Google Documents, and links to these documents will be stored in the campaign's record in the database. Keywords will also be saved to the campaign.</p>
                <p>6. You will see links to the generated documents and the keywords on this page after successful generation. The main campaign status will update shortly thereafter.</p>
            </CardContent>
          </Card>

          {/* Previous content of the component, now inside a fragment */}
          {campaignDetails && (
            <div className="p-3 border rounded-md bg-gray-50 text-xs text-gray-600 space-y-1 mb-4">
                <p><strong>Selected Campaign:</strong> {campaignDetails.campaign_name}</p>
                <p>
                    <strong>Questionnaire Status:</strong> 
                    {isQuestionnaireCompleteForSelectedCampaign ? 
                        <Badge variant="default" className="bg-green-100 text-green-700 ml-1">Complete</Badge> :
                        <Badge variant="destructive" className="ml-1">Incomplete</Badge>
                    }
                </p>
                {campaignDetails.campaign_bio && 
                    <p><strong>Current Bio:</strong> 
                        <Button
                          variant="link"
                          onClick={() => setBioModalOpen(true)}
                          className="p-0 h-auto text-sm ml-1"
                        >
                          <Eye className="h-3 w-3 mr-1"/> View Bio
                        </Button>
                    </p>}
                {campaignDetails.campaign_angles && 
                    <p><strong>Current Angles:</strong> 
                        <Button
                          variant="link"
                          onClick={() => setAnglesModalOpen(true)}
                          className="p-0 h-auto text-sm ml-1"
                        >
                          <Eye className="h-3 w-3 mr-1"/> View Angles
                        </Button>
                    </p>}
            </div>
          )}

          {!isQuestionnaireCompleteForSelectedCampaign && campaignId && !isLoadingCampaignDetails && (
            <div className="p-4 border rounded-md bg-yellow-50 border-yellow-200 text-yellow-700 text-sm mb-4">
                <AlertTriangle className="inline h-4 w-4 mr-2" />
                The selected campaign needs a completed and processed questionnaire before Bio & Angles can be generated. Please complete the Questionnaire tab first.
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={!campaignId || triggerAnglesBioMutation.isPending || !isQuestionnaireCompleteForSelectedCampaign || isLoadingCampaignDetails}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
          >
            {triggerAnglesBioMutation.isPending ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Generate Bio & Angles</>
            )}
          </Button>

      {triggerAnglesBioMutation.isSuccess && campaignDetails && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Content Generated Successfully!</CardTitle>
            <CardDescription>Your bio and angles have been generated. Refresh the page to view them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => {
                tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetailsForAnglesGenerator", campaignId] });
                toast({ title: "Refreshing...", description: "Fetching updated content from the server." });
              }}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Content
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Keywords Section */}
      {campaignDetails && (campaignDetails.campaign_keywords && campaignDetails.campaign_keywords.length > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Keywords Management
            </CardTitle>
            <CardDescription>
              Manage your campaign keywords to improve podcast discovery and matching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KeywordEditor
              keywords={campaignDetails.campaign_keywords}
              onUpdate={onKeywordsUpdate || (async () => {})}
              isLoading={isKeywordsUpdateLoading}
              showGeneratedBadge={true}
              title="Campaign Discovery Keywords"
              description="These keywords help us find the most relevant podcasts for your campaign. You can add, edit, or remove keywords to improve matching accuracy."
            />
          </CardContent>
        </Card>
      )}

      {/* Show message if no keywords yet */}
      {campaignDetails && (!campaignDetails.campaign_keywords || campaignDetails.campaign_keywords.length === 0) && (
        <Card className="mt-6">
          <CardContent className="p-6 text-center text-gray-500">
            <Tags className="mx-auto h-10 w-10 mb-2 text-gray-400"/>
            <p className="mb-2">No keywords have been generated yet.</p>
            <p className="text-sm">Generate your Bio & Angles first to create initial keywords.</p>
          </CardContent>
        </Card>
      )}

      {/* Bio Modal */}
      <Dialog open={bioModalOpen} onOpenChange={setBioModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>AI-Generated Bio</DialogTitle>
            <DialogDescription>
              Your professionally crafted bio for podcast outreach
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[60vh] pr-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {typeof campaignDetails?.campaign_bio === 'string' && 
                (campaignDetails.campaign_bio.startsWith('http') || campaignDetails.campaign_bio.startsWith('https://docs.google.com')) 
                ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Bio content is stored as an external document.</p>
                    <a 
                      href={campaignDetails.campaign_bio} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary underline hover:text-primary/80"
                    >
                      Open Bio Document
                    </a>
                  </div>
                ) : (
                  campaignDetails?.campaign_bio || "No bio content available."
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Angles Modal */}
      <Dialog open={anglesModalOpen} onOpenChange={setAnglesModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>AI-Generated Pitch Angles</DialogTitle>
            <DialogDescription>
              Compelling angles to pitch yourself to podcast hosts
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[60vh] pr-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {typeof campaignDetails?.campaign_angles === 'string' && 
                (campaignDetails.campaign_angles.startsWith('http') || campaignDetails.campaign_angles.startsWith('https://docs.google.com')) 
                ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Angles content is stored as an external document.</p>
                    <a 
                      href={campaignDetails.campaign_angles} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary underline hover:text-primary/80"
                    >
                      Open Angles Document
                    </a>
                  </div>
                ) : (
                  campaignDetails?.campaign_angles || "No angles content available."
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </> // Closing the main fragment
  );
}