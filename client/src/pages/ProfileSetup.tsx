// client/src/pages/ProfileSetup.tsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardList, BookOpen, Save, AlertTriangle, Lightbulb, Info, ArrowLeft } from "lucide-react";
import Questionnaire from "./Questionnaire"; // Assuming Questionnaire.tsx is now a component for the form logic
import AnglesGenerator from "./AnglesGenerator"; // Assuming AnglesGenerator.tsx is now a component
import MediaKitTab from "@/components/tabs/MediaKitTab"; // Import the new MediaKitTab
import { Badge } from "@/components/ui/badge";

// Schema for just the Media Kit URL part - THIS CAN BE REMOVED if MediaKitTab handles all media kit aspects
// const mediaKitUrlSchema = z.object({
//   media_kit_url: z.string().url("Please enter a valid URL for your media kit.").optional().or(z.literal("")).nullable(),
// });
// type MediaKitUrlFormData = z.infer<typeof mediaKitUrlSchema>;

interface ClientCampaignForSetup {
  campaign_id: string;
  campaign_name: string;
  media_kit_url?: string | null;
  questionnaire_responses?: object | null;
  mock_interview_trancript?: string | null; // Added to check if questionnaire was processed
  campaign_bio?: string | null;
  campaign_angles?: string | null;
  campaign_keywords?: string[] | null;
  embedding_status?: 'pending' | 'completed' | 'failed' | 'not_started' | 'not_enough_content' | string | null; // Updated and expanded
}

export default function ProfileSetup() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation(); // For navigation
  
  const queryParams = new URLSearchParams(window.location.search);
  const initialCampaignIdFromUrl = queryParams.get("campaignId");

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignIdFromUrl);
  const [activeTab, setActiveTab] = useState<string>("questionnaire");


  const { data: campaigns = [], isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useQuery<ClientCampaignForSetup[]>({
    queryKey: ["clientCampaignsForProfileSetupPage", user?.person_id],
    queryFn: async () => {
      if (!user?.person_id) return [];
      // Clients automatically see only their own campaigns
      const response = await apiRequest("GET", "/campaigns/");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: !!user && !authLoading,
  });
  
  const selectedCampaignData = campaigns.find(c => c.campaign_id === selectedCampaignId);

  // Form for Media Kit URL - THIS CAN BE REMOVED if MediaKitTab handles it
  // const mediaKitUrlForm = useForm<MediaKitUrlFormData>({
  //   resolver: zodResolver(mediaKitUrlSchema),
  //   defaultValues: { media_kit_url: "" },
  // });

  useEffect(() => {
    if (selectedCampaignData) {
      // mediaKitUrlForm.reset({ media_kit_url: selectedCampaignData.media_kit_url || "" }); // REMOVE
      // If campaign from URL is valid and exists in fetched campaigns, keep it.
      // Otherwise, if no valid campaign is selected, and campaigns list is available, select the first one.
      if (!campaigns.find(c => c.campaign_id === selectedCampaignId) && campaigns.length > 0) {
        // setSelectedCampaignId(campaigns[0].campaign_id); // Auto-select first if URL one is bad
      }
    } else if (!selectedCampaignId && campaigns.length > 0 && !initialCampaignIdFromUrl) {
      // If no campaign is selected (neither from URL nor state) and campaigns are loaded, select the first one.
      // setSelectedCampaignId(campaigns[0].campaign_id);
    } else if (!selectedCampaignId && campaigns.length === 0 && !isLoadingCampaigns) {
        // No campaigns, do nothing or show a message
    }
  }, [selectedCampaignData, /* mediaKitUrlForm, */ campaigns, selectedCampaignId, isLoadingCampaigns, initialCampaignIdFromUrl]);


  // updateMediaKitUrlMutation - THIS CAN BE REMOVED if MediaKitTab handles all media kit updates
  // const updateMediaKitUrlMutation = useMutation({ ... });

  const handleCampaignChange = (campaignId: string) => {
    const newId = campaignId === "none" ? null : campaignId;
    setSelectedCampaignId(newId);
    if (newId) {
      navigate(`/profile-setup?campaignId=${newId}`, { replace: true }); // Update URL
    } else {
      navigate(`/profile-setup`, { replace: true });
    }
  };

  // Mutation for updating keywords
  const updateKeywordsMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      if (!selectedCampaignId) throw new Error("No campaign selected");
      
      const response = await apiRequest("PATCH", `/campaigns/${selectedCampaignId}`, {
        campaign_keywords: keywords
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update keywords" }));
        throw new Error(errorData.detail || "Failed to update keywords");
      }
      
      return response.json();
    },
    onSuccess: () => {
      tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForProfileSetupPage"] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", selectedCampaignId] });
      toast({ 
        title: "Keywords Updated", 
        description: "Your campaign keywords have been saved successfully." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update keywords", 
        description: error.message || "Please try again later.", 
        variant: "destructive" 
      });
    }
  });

  const handleKeywordsUpdate = async (keywords: string[]) => {
    await updateKeywordsMutation.mutateAsync(keywords);
  };

  if (authLoading || isLoadingCampaigns) {
    return (
        <div className="space-y-6 p-4 md:p-6 animate-pulse">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      <Link href="/my-campaigns">
        <Button variant="outline" className="mb-4 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Campaigns
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Client Profile & Campaign Content Setup</CardTitle>
          <CardDescription>
            Complete the questionnaire for your campaign, manage your media kit link, and generate AI-powered bio & angles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Campaign Selection - Rewritten to avoid Form context issues */}
          <div className="mb-6 space-y-1.5">
            <label htmlFor="campaign-select" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select Campaign to Setup/Update
            </label>
            <Select 
                onValueChange={handleCampaignChange}
                value={selectedCampaignId || ""}
            >
              <SelectTrigger id="campaign-select" disabled={isLoadingCampaigns || campaigns.length === 0}>
                <SelectValue placeholder="Select a campaign..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Select a campaign...</SelectItem>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                    {campaign.campaign_name}
                    {campaign.questionnaire_responses || campaign.mock_interview_trancript ? " (Questionnaire Started/Filled)" : " (Questionnaire Pending)"}
                  </SelectItem>
                ))}
                {campaigns.length === 0 && <div className="p-2 text-sm text-gray-500">No campaigns found. Please ask your account manager to create one.</div>}
              </SelectContent>
            </Select>
            {!selectedCampaignId && campaigns.length > 0 && 
              <p className="text-sm text-muted-foreground text-red-500 pt-1">Please select a campaign to proceed.</p>}
          </div>

          {selectedCampaignId && selectedCampaignData ? (
            <>
            <Card className="mb-6 border-l-4 border-primary">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Info className="h-5 w-5 mr-2 text-primary" /> Campaign Profile Strength
                </CardTitle>
                <CardDescription>This section shows the processing status for your selected campaign, indicating its readiness for effective podcast matching.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Profile Enhancement Status:</h4>
                  {selectedCampaignData.embedding_status ? (
                    <Badge 
                      variant={
                        selectedCampaignData.embedding_status === 'completed' ? 'default' :
                        selectedCampaignData.embedding_status === 'pending' ? 'outline' :
                        selectedCampaignData.embedding_status === 'failed' ? 'destructive' :
                        selectedCampaignData.embedding_status === 'not_enough_content' ? 'secondary' : // Example for new status
                        'secondary' // Default for other string values
                      }
                      className={`capitalize text-sm px-3 py-1 ${selectedCampaignData.embedding_status === 'completed' ? 'bg-green-100 text-green-700' : selectedCampaignData.embedding_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : selectedCampaignData.embedding_status === 'not_enough_content' ? 'bg-orange-100 text-orange-700' : ''}`}
                    >
                      {selectedCampaignData.embedding_status.replace(/_/g, ' ')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-sm">Not Started</Badge>
                  )}
                  {selectedCampaignData.embedding_status === 'not_enough_content' && 
                    <p className="text-xs text-orange-600 mt-1">Consider adding more details to your questionnaire or generating bio & angles to improve profile strength.</p>}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="questionnaire"><ClipboardList className="mr-2 h-4 w-4"/>Questionnaire</TabsTrigger>
                <TabsTrigger value="aiBioAngles" disabled={!selectedCampaignData?.questionnaire_responses && !selectedCampaignData?.mock_interview_trancript && 
                                                            !selectedCampaignData?.campaign_bio && !selectedCampaignData?.campaign_angles}>
                    <Lightbulb className="mr-2 h-4 w-4"/>AI Bio & Angles
                </TabsTrigger>
                <TabsTrigger value="mediaKit"><BookOpen className="mr-2 h-4 w-4"/>Media Kit</TabsTrigger>
              </TabsList>

              <TabsContent value="questionnaire" className="mt-6">
                <Questionnaire 
                  campaignId={selectedCampaignId} 
                  onSuccessfulSubmit={() => {
                    toast({ title: "Questionnaire Submitted!", description: "We are now processing your information to enhance matching and content generation. This may take a few moments." });
                    refetchCampaigns(); 
                    tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", selectedCampaignId] });
                    tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/", selectedCampaignId, "/media-kit"] }); // Invalidate media kit data too
                  }}
                />
              </TabsContent>
              
              <TabsContent value="aiBioAngles" className="mt-6">
                {selectedCampaignData?.questionnaire_responses || selectedCampaignData?.mock_interview_trancript || 
                 selectedCampaignData?.campaign_bio || selectedCampaignData?.campaign_angles ? (
                    <AnglesGenerator 
                      campaignId={selectedCampaignId} 
                      onSuccessfulGeneration={() => {
                        toast({ title: "Bio & Angles Generated!", description: "We are now processing this new content to further enhance matching."}); 
                        refetchCampaigns(); 
                        tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", selectedCampaignId] });
                        tanstackQueryClient.invalidateQueries({ queryKey: ["/campaigns/", selectedCampaignId, "/media-kit"] }); // Invalidate media kit data too
                      }}
                      onKeywordsUpdate={handleKeywordsUpdate}
                      isKeywordsUpdateLoading={updateKeywordsMutation.isPending}
                    />
                ) : (
                    <Card>
                        <CardContent className="p-6 text-center text-gray-500">
                            <AlertTriangle className="mx-auto h-10 w-10 mb-2 text-yellow-500"/>
                            Please complete the Questionnaire for this campaign before viewing Bio & Angles.
                        </CardContent>
                    </Card>
                )}
              </TabsContent>


              <TabsContent value="mediaKit" className="mt-6">
                <MediaKitTab campaignId={selectedCampaignId} />
              </TabsContent>
            </Tabs>
            </>
          ) : (
            campaigns.length > 0 && <p className="text-center text-gray-500 py-6">Select a campaign above to manage its profile content.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}