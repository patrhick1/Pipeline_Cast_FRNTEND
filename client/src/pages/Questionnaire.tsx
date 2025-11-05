// client/src/pages/Questionnaire.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient";
import { ClipboardList, CheckCircle, Save, AlertTriangle, Info, Plus, X, Upload, ChevronLeft, ChevronRight, MessageSquare, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImageUpload } from "@/components/ImageUpload";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Define Campaign interface to match backend (simplified for this context)
interface ClientCampaign {
  campaign_id: string; // UUID
  campaign_name: string;
  person_id: number;
  questionnaire_responses?: QuestionnaireFormData | null; // To check if already filled
  mock_interview_trancript?: string | null; // To see if it was generated
}

// Social Media Entry
const socialMediaSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  handle: z.string().url("Must be a valid URL").or(z.string().min(1, "Handle is required"))
});

// Previous Appearance Entry
const previousAppearanceSchema = z.object({
  showName: z.string().min(1, "Show name is required"),
  link: z.string().url("Must be a valid URL")
});

// Speaking Clip Entry
const speakingClipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  link: z.string().url("Must be a valid URL")
});

// Asset Entry
const assetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL")
});

// Main questionnaire schema with updated sections for new design
const questionnaireSchema = z.object({
  contactInfo: z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    socialMedia: z.array(socialMediaSchema).optional()
  }),
  professionalBio: z.object({
    aboutWork: z.string().min(50, "Please provide at least 50 characters about your work"),
    expertiseTopics: z.string().min(10, "Please list your main areas of expertise"),
    achievements: z.string().optional()
  }),
  atAGlanceStats: z.object({
    keynoteEngagements: z.string().optional(),
    yearsOfExperience: z.string().optional(),
    emailSubscribers: z.string().optional(),
  }).optional(),
  mediaExperience: z.object({
    previousAppearances: z.array(previousAppearanceSchema).optional(),
    speakingClips: z.array(speakingClipSchema).optional()
  }),
  suggestedTopics: z.object({
    topics: z.string().min(20, "Please provide 3-5 specific topics you'd like to discuss"),
    keyStoriesOrMessages: z.string().optional()
  }),
  sampleQuestions: z.object({
    frequentlyAsked: z.string().optional(), // For "Sample Questions" section
    loveToBeAsked: z.string().optional()   // For "Sample Questions" section
  }),
  socialProof: z.object({
    testimonials: z.string().optional(), // For "Testimonials" section
    // notableStats from existing schema can be used for general stats if needed beyond At-a-Glance
    notableStats: z.string().optional() 
  }),
  assets: z.object({
    otherAssets: z.array(assetSchema).optional()
  }),
  promotionPrefs: z.object({
    preferredIntro: z.string().min(10, "Please provide a preferred introduction"),
    itemsToPromote: z.string().optional(),
    bestContactForHosts: z.string().min(5, "Please provide contact information for hosts")
  }),
  finalNotes: z.object({
    idealPodcastDescription: z.string().optional(),
    anythingElse: z.string().optional(),
    questionsOrConcerns: z.string().optional()
  })
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

// Platform options for social media
const socialPlatforms = [
  "LinkedIn", "Twitter/X", "Instagram", "TikTok", "YouTube", "Facebook", "Other"
];

// Update section definitions
const sections = [
  { id: 'contactInfo', title: 'Contact & Basic Info', description: 'Your basic contact information and social media.' },
  { id: 'professionalBio', title: 'Professional Bio & Background', description: 'Tell us about yourself, your work, and key expertise.' },
  { id: 'atAGlanceStats', title: 'At-a-Glance Stats', description: 'Provide key metrics like speaking engagements, years of experience, and email subscribers.' },
  { id: 'mediaExperience', title: 'Podcast & Media Experience', description: 'Your previous appearances and speaking clips.' },
  { id: 'suggestedTopics', title: 'Topics & Talking Points', description: 'What you love to discuss on podcasts.' },
  { id: 'sampleQuestions', title: 'Sample Questions', description: 'Questions you get asked or want to be asked.' },
  { id: 'socialProof', title: 'Testimonials & Social Proof', description: 'Share testimonials and other notable accomplishments.' },
  { id: 'assets', title: 'Additional Assets', description: 'Other relevant images or resources you want to include.' },
  { id: 'promotionPrefs', title: 'Promotion & Contact Preferences', description: 'How you want to be introduced and contacted.' },
  { id: 'finalNotes', title: 'Final Notes', description: 'Any additional information or questions.' }
];

interface QuestionnaireProps {
  campaignId: string | null;
  onSuccessfulSubmit?: () => void;
  isOnboarding?: boolean;
}

export default function Questionnaire({ campaignId, onSuccessfulSubmit, isOnboarding = false }: QuestionnaireProps) {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessingContent, setIsProcessingContent] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  
  // Mode toggle state - default to 'form' for safety
  const [mode, setMode] = useState<'form' | 'chat'>(() => {
    const saved = localStorage.getItem('questionnaire-mode');
    return saved === 'chat' ? 'chat' : 'form';
  });
  
  // Save mode preference
  useEffect(() => {
    localStorage.setItem('questionnaire-mode', mode);
    // Track mode selection for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'questionnaire_mode_selected', {
        mode: mode,
        campaign_id: campaignId
      });
    }
  }, [mode, campaignId]);

  const { data: existingQuestionnaire, isLoading: isLoadingQuestionnaire, refetch: refetchQuestionnaire } = useQuery<QuestionnaireFormData | null>({
    queryKey: ["campaignQuestionnaireData", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const response = await apiRequest("GET", `/campaigns/${campaignId}`);
      if (!response.ok) {
        console.warn(`Failed to fetch campaign details for ${campaignId}`);
        return null;
      }
      const campaignData: ClientCampaign = await response.json();
      const rawData = campaignData.questionnaire_responses;
      
      if (!rawData) return null;
      
      try {
        if ((rawData as any).personalInfo || (rawData as any).experience || (rawData as any).preferences || (rawData as any).goals) {
          console.log("Detected old questionnaire format, starting fresh with new structure.");
          return null; // Return null to force default values for the new structure
        }
        return questionnaireSchema.parse(rawData);
      } catch (error) {
        console.error("Failed to parse questionnaire data:", error);
        return null;
      }
    },
    enabled: !!campaignId,
  });

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      contactInfo: { 
        fullName: user?.full_name || "", 
        email: "",
        phone: "", 
        website: "", 
        socialMedia: []
      },
      professionalBio: { aboutWork: "", expertiseTopics: "", achievements: "" },
      atAGlanceStats: { 
        keynoteEngagements: "", 
        yearsOfExperience: "", 
        emailSubscribers: "" 
      },
      mediaExperience: { previousAppearances: [], speakingClips: [] },
      suggestedTopics: { topics: "", keyStoriesOrMessages: "" },
      sampleQuestions: { frequentlyAsked: "", loveToBeAsked: "" },
      socialProof: { testimonials: "", notableStats: "" },
      assets: { otherAssets: [] },
      promotionPrefs: { preferredIntro: "", itemsToPromote: "", bestContactForHosts: "" },
      finalNotes: { idealPodcastDescription: "", anythingElse: "", questionsOrConcerns: "" }
    },
  });

  // Auto-save functionality
  const saveDraftMutation = useMutation({
    mutationFn: async (data: QuestionnaireFormData) => {
      if (!campaignId) throw new Error("No campaign selected.");
      console.log('Saving draft with finalNotes:', data.finalNotes);
      return apiRequest("POST", `/campaigns/${campaignId}/save-questionnaire-draft`, { questionnaire_data: data });
    },
    onError: (error: any) => {
      console.error("Failed to save draft:", error);
    }
  });

  // Auto-save every 30 seconds if form is dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty && campaignId) {
        const formData = form.getValues();
        saveDraftMutation.mutate(formData);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [form.formState.isDirty, campaignId, saveDraftMutation, form]);

  useEffect(() => {
    if (campaignId) {
        refetchQuestionnaire();
    }
  }, [campaignId, refetchQuestionnaire]);

  useEffect(() => {
    if (existingQuestionnaire) {
      form.reset(existingQuestionnaire);
      const completed = new Set<number>();
      sections.forEach((section, index) => {
        const sectionData = existingQuestionnaire[section.id as keyof QuestionnaireFormData];
        let hasData = false;
        if (section.id === 'atAGlanceStats') {
          // Explicitly ensure a boolean result
          hasData = (sectionData && typeof sectionData === 'object' && sectionData !== null) 
                    ? Object.values(sectionData).some(value => !!value) 
                    : false;
        } else if (sectionData && typeof sectionData === 'object' && sectionData !== null) {
           // Explicitly ensure a boolean result
           hasData = (sectionData && typeof sectionData === 'object' && sectionData !== null) 
                     ? Object.values(sectionData).some(value => Array.isArray(value) ? value.length > 0 : !!value) 
                     : false;
        }
        if (hasData) {
          completed.add(index);
        }
      });
      setCompletedSections(completed);
    } else {
       form.reset({
        contactInfo: { fullName: user?.full_name || "", email: "", phone: "", website: "", socialMedia: [] },
        professionalBio: { aboutWork: "", expertiseTopics: "", achievements: "" },
        atAGlanceStats: { keynoteEngagements: "", yearsOfExperience: "", emailSubscribers: "" },
        mediaExperience: { previousAppearances: [], speakingClips: [] },
        suggestedTopics: { topics: "", keyStoriesOrMessages: "" },
        sampleQuestions: { frequentlyAsked: "", loveToBeAsked: "" },
        socialProof: { testimonials: "", notableStats: "" },
        assets: { otherAssets: [] },
        promotionPrefs: { preferredIntro: "", itemsToPromote: "", bestContactForHosts: "" },
        finalNotes: { idealPodcastDescription: "", anythingElse: "", questionsOrConcerns: "" }
      });
    }
  }, [existingQuestionnaire, form, user?.full_name]);

  const submitQuestionnaireMutation = useMutation({
    mutationFn: async (data: QuestionnaireFormData) => {
      if (!campaignId) throw new Error("No campaign selected.");
      return apiRequest("POST", `/campaigns/${campaignId}/submit-questionnaire`, { questionnaire_data: data });
    },
    onSuccess: () => {
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignQuestionnaireData", campaignId] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaigns", user?.person_id] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForProfileSetupPage", user?.person_id] });
      setIsProcessingContent(true);
      toast({ title: "Success!", description: "Your questionnaire has been submitted and your media kit is being generated." });
      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      }
    },
    onError: (error: any) => {
      toast({ title: "Submission Error", description: error.message || "Failed to submit questionnaire.", variant: "destructive" });
      setIsProcessingContent(false);
    },
  });

  const onSubmit = (data: QuestionnaireFormData) => {
    if (!campaignId) {
        toast({ title: "Error", description: "Please select a campaign first.", variant: "destructive" });
        return;
    }
    
    // Debug: Log the complete form data being submitted
    console.log('Submitting questionnaire data:', JSON.stringify(data, null, 2));
    
    // Ensure all fields are properly included
    const completeData = {
      ...data,
      finalNotes: {
        idealPodcastDescription: data.finalNotes?.idealPodcastDescription || '',
        anythingElse: data.finalNotes?.anythingElse || '',
        questionsOrConcerns: data.finalNotes?.questionsOrConcerns || ''
      }
    };
    
    console.log('Complete data with finalNotes:', JSON.stringify(completeData.finalNotes, null, 2));
    
    submitQuestionnaireMutation.mutate(completeData);
  };


  // Helper functions for dynamic arrays
  const addSocialMedia = () => {
    const current = form.getValues('contactInfo.socialMedia') || [];
    form.setValue('contactInfo.socialMedia', [...current, { platform: "", handle: "" }]);
  };

  const removeSocialMedia = (index: number) => {
    const current = form.getValues('contactInfo.socialMedia') || [];
    form.setValue('contactInfo.socialMedia', current.filter((_, i) => i !== index));
  };

  const addPreviousAppearance = () => {
    const current = form.getValues('mediaExperience.previousAppearances') || [];
    form.setValue('mediaExperience.previousAppearances', [...current, { showName: "", link: "" }]);
  };

  const removePreviousAppearance = (index: number) => {
    const current = form.getValues('mediaExperience.previousAppearances') || [];
    form.setValue('mediaExperience.previousAppearances', current.filter((_, i) => i !== index));
  };

  const addSpeakingClip = () => {
    const current = form.getValues('mediaExperience.speakingClips') || [];
    form.setValue('mediaExperience.speakingClips', [...current, { title: "", link: "" }]);
  };

  const removeSpeakingClip = (index: number) => {
    const current = form.getValues('mediaExperience.speakingClips') || [];
    form.setValue('mediaExperience.speakingClips', current.filter((_, i) => i !== index));
  };

  const addOtherAsset = () => {
    const current = form.getValues('assets.otherAssets') || [];
    form.setValue('assets.otherAssets', [...current, { title: "", url: "" }]);
  };

  const removeOtherAsset = (index: number) => {
    const current = form.getValues('assets.otherAssets') || [];
    form.setValue('assets.otherAssets', current.filter((_, i) => i !== index));
  };

  // Section validation
  const validateCurrentSection = async () => {
    const sectionId = sections[currentSection].id;
    const result = await form.trigger(sectionId as keyof QuestionnaireFormData);
    if (result) {
      setCompletedSections(prev => new Set([...Array.from(prev), currentSection]));
    }
    return result;
  };

  const nextSection = async () => {
    const isValid = await validateCurrentSection();
    if (isValid && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const progress = ((currentSection + 1) / sections.length) * 100;
  const isQuestionnaireCompletedForSelectedCampaign = !!existingQuestionnaire;

  if (authLoading) {
    return <div className="p-6 text-center"><Skeleton className="h-10 w-1/2 mx-auto mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!campaignId) {
    return (
        <Card>
            <CardContent className="p-6 text-center text-gray-500">
                <Info className="mx-auto h-10 w-10 mb-3 text-blue-500" />
                <p>Please select a campaign in the main setup page to fill out its questionnaire.</p>
            </CardContent>
        </Card>
    );
  }

  const currentSectionData = sections[currentSection];

  // Handle chat completion
  const handleChatComplete = (data: any) => {
    // The chat conversation has been completed and submitted through the backend
    // Now we need to refresh the questionnaire data and notify the parent
    tanstackQueryClient.invalidateQueries({ queryKey: ["campaignQuestionnaireData", campaignId] });
    tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaigns", user?.person_id] });
    tanstackQueryClient.invalidateQueries({ queryKey: ["clientCampaignsForProfileSetupPage", user?.person_id] });
    
    toast({ 
      title: "Success!", 
      description: "Your interview has been completed and your media kit is being generated." 
    });
    
    // Notify parent component if callback provided
    if (onSuccessfulSubmit) {
      onSuccessfulSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Edit Later Notice */}
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Don't worry about getting everything perfect!
              </p>
              <p className="text-sm text-blue-700">
                After our AI generates your media kit, you'll be able to edit and refine all content including your bio, talking points, and other details. Just provide your best answers now, and polish it later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Profile Setup Method</CardTitle>
              <CardDescription>
                Choose how you'd like to provide your information
              </CardDescription>
            </div>
            <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as 'form' | 'chat')}>
              <ToggleGroupItem value="form" aria-label="Form mode">
                <FileText className="mr-2 h-4 w-4" />
                Questionnaire
              </ToggleGroupItem>
              <ToggleGroupItem value="chat" aria-label="Chat mode">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat Assistant
                <Badge variant="secondary" className="ml-2">Beta</Badge>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
      </Card>

      {/* Show chat interface if chat mode is selected */}
      {mode === 'chat' ? (
        <div className="space-y-4">
          {/* Chat Mode Info */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900">
                    Chat with our AI assistant to create your media kit
                  </p>
                  <p className="text-sm text-green-700">
                    Just have a natural conversation! The AI will guide you through the process. Remember, you can edit everything in your media kit after it's generated, so don't stress about perfect answers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <ChatInterface 
            campaignId={campaignId} 
            onComplete={handleChatComplete}
            isOnboarding={isOnboarding}
          />
        </div>
      ) : (
        <>
          {/* Welcome Section - only show on first load */}
          {currentSection === 0 && !existingQuestionnaire && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Welcome to Your Media Kit Builder!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <p className="mb-3">
              This form will help us gather the information needed to create a professional and compelling media kit for your podcast guest appearances.
            </p>
            <p className="mb-3">
              Please provide simple, honest answers – we'll take care of the professional wording. You can save your progress at any time.
            </p>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Your progress is automatically saved every 30 seconds
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Section {currentSection + 1} of {sections.length}</CardTitle>
              <CardDescription>{currentSectionData.title}</CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              {completedSections.size} of {sections.length} completed
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Main Form */}
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{currentSectionData.title}</CardTitle>
              <CardDescription>{currentSectionData.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Render current section */}
              {currentSection === 0 && <ContactInfoSection form={form} socialPlatforms={socialPlatforms} addSocialMedia={addSocialMedia} removeSocialMedia={removeSocialMedia} />}
              {currentSection === 1 && <ProfessionalBioSection form={form} />}
              {currentSection === 2 && <AtAGlanceStatsSection form={form} />}
              {currentSection === 3 && <MediaExperienceSection form={form} addPreviousAppearance={addPreviousAppearance} removePreviousAppearance={removePreviousAppearance} addSpeakingClip={addSpeakingClip} removeSpeakingClip={removeSpeakingClip} />}
              {currentSection === 4 && <SuggestedTopicsSection form={form} />}
              {currentSection === 5 && <SampleQuestionsSection form={form} />}
              {currentSection === 6 && <SocialProofSection form={form} />}
              {currentSection === 7 && <AssetsSection form={form} addOtherAsset={addOtherAsset} removeOtherAsset={removeOtherAsset} />}
              {currentSection === 8 && <PromotionPrefsSection form={form} />}
              {currentSection === 9 && <FinalNotesSection form={form} />}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevSection}
              disabled={currentSection === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentSection === sections.length - 1 ? (
                <Button 
                  type="button"
                  onClick={async () => {
                    // Validate the form first
                    const isFormValid = await form.trigger();
                    if (!isFormValid) {
                      toast({ 
                        title: "Validation Error", 
                        description: "Please check all required fields before submitting.", 
                        variant: "destructive" 
                      });
                      return;
                    }
                    
                    // Get the latest form data and submit
                    const formData = form.getValues();
                    onSubmit(formData);
                  }}
                  disabled={submitQuestionnaireMutation.isPending || !campaignId}
                  className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
                >
                  {submitQuestionnaireMutation.isPending ? (
                    "Generating Media Kit..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {isQuestionnaireCompletedForSelectedCampaign ? "Update Media Kit" : "Generate Media Kit"}
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={nextSection}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
        </>
      )}
    </div>
  );
}

// Section Components
function ContactInfoSection({ form, socialPlatforms, addSocialMedia, removeSocialMedia }: any) {
  const socialMediaFields = form.watch('contactInfo.socialMedia') || [];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="contactInfo.fullName" render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name *</FormLabel>
            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contactInfo.email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address *</FormLabel>
            <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="contactInfo.phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number (Optional)</FormLabel>
            <FormControl><Input type="tel" placeholder="555-1234" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contactInfo.website" render={({ field }) => (
          <FormItem>
            <FormLabel>Your Primary Website (Optional)</FormLabel>
            <FormControl><Input type="url" placeholder="https://yourwebsite.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      
      <div>
        <FormLabel className="text-base font-medium">Social Media Handles</FormLabel>
        <FormDescription>Add your social media profiles to help podcast hosts find and promote you</FormDescription>
        
        <div className="mt-3 space-y-3">
          {socialMediaFields.map((_: any, index: number) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <FormField control={form.control} name={`contactInfo.socialMedia.${index}.platform`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {socialPlatforms.map((platform: string) => (
                            <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name={`contactInfo.socialMedia.${index}.handle`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="URL or @handle" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeSocialMedia(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addSocialMedia} className="mt-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Social Media
        </Button>
      </div>
    </div>
  );
}

function ProfessionalBioSection({ form }: any) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="professionalBio.aboutWork" render={({ field }) => (
        <FormItem>
          <FormLabel>About You & Your Work *</FormLabel>
          <FormDescription>
            In a few sentences, tell us about yourself and your work. Don't worry about wording, just share what you do and what you're passionate about.
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="I'm a marketing director at a SaaS company, passionate about growth strategies and helping businesses scale. I specialize in digital marketing and have helped increase our user base by 300% over the past two years..."
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="professionalBio.expertiseTopics" render={({ field }) => (
        <FormItem>
          <FormLabel>Main Areas of Expertise *</FormLabel>
          <FormDescription>
            What are your main areas of expertise or topics you love to talk about? (List a few, e.g., SaaS Growth, Leadership, AI in Marketing)
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="SaaS Growth Strategies, Digital Marketing, Lead Generation, Marketing Automation, Team Leadership"
              minRows={2}
              maxRows={6}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="professionalBio.achievements" render={({ field }) => (
        <FormItem>
          <FormLabel>Unique Experiences or Achievements (Optional)</FormLabel>
          <FormDescription>
            Are there any unique experiences or achievements you'd like to highlight? (e.g., awards won, significant projects, unique background)
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="Won 'Marketing Leader of the Year' award, authored a popular blog with 50K+ monthly readers, grew startup from 0 to $5M ARR..."
              minRows={2}
              maxRows={8}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

// New Section Component for At-a-Glance Stats
function AtAGlanceStatsSection({ form }: any) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="atAGlanceStats.keynoteEngagements" render={({ field }) => (
        <FormItem>
          <FormLabel>Keynote Engagements (Optional)</FormLabel>
          <FormDescription>e.g., "150+" or "Over 100 keynotes delivered"</FormDescription>
          <FormControl><Input placeholder="150+" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="atAGlanceStats.yearsOfExperience" render={({ field }) => (
        <FormItem>
          <FormLabel>Years of Experience (Optional)</FormLabel>
          <FormDescription>In your primary field, e.g., "10+" or "Over a decade"</FormDescription>
          <FormControl><Input placeholder="10+" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="atAGlanceStats.emailSubscribers" render={({ field }) => (
        <FormItem>
          <FormLabel>Email Subscribers (Optional)</FormLabel>
          <FormDescription>If applicable, e.g., "100k+" or "Community of 100,000+"</FormDescription>
          <FormControl><Input placeholder="100k+" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

function MediaExperienceSection({ form, addPreviousAppearance, removePreviousAppearance, addSpeakingClip, removeSpeakingClip }: any) {
  const previousAppearances = form.watch('mediaExperience.previousAppearances') || [];
  const speakingClips = form.watch('mediaExperience.speakingClips') || [];

  return (
    <div className="space-y-6">
      <div>
        <FormLabel className="text-base font-medium">Previous Podcast Appearances</FormLabel>
        <FormDescription>
          Have you been a guest on any podcasts or media before? If yes, please share links to your favorite appearances.
        </FormDescription>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 mb-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Use the exact podcast episode name (e.g., "The Marketing Show - Ep. 123: Growth Strategies with Jane Doe") for best results. This helps us fetch episode details and display them beautifully in your media kit.
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {previousAppearances.map((_: any, index: number) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <FormField control={form.control} name={`mediaExperience.previousAppearances.${index}.showName`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Episode Name (e.g., Show Name - Ep. 45: Topic)" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name={`mediaExperience.previousAppearances.${index}.link`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="https://podcast-link.com" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removePreviousAppearance(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addPreviousAppearance} className="mt-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Previous Appearance
        </Button>
      </div>

      <div>
        <FormLabel className="text-base font-medium">Speaking Clips (Audio/Video)</FormLabel>
        <FormDescription>
          If you have audio or video clips of you speaking (e.g., from talks, webinars, previous podcasts), please share links here.
        </FormDescription>
        
        <div className="mt-3 space-y-3">
          {speakingClips.map((_: any, index: number) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <FormField control={form.control} name={`mediaExperience.speakingClips.${index}.title`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Clip Title/Description" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name={`mediaExperience.speakingClips.${index}.link`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="https://video-link.com" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeSpeakingClip(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addSpeakingClip} className="mt-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Speaking Clip
        </Button>
      </div>
    </div>
  );
}

function SuggestedTopicsSection({ form }: any) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="suggestedTopics.topics" render={({ field }) => (
        <FormItem>
          <FormLabel>Potential Podcast Topics *</FormLabel>
          <FormDescription>
            List 3-5 topics you'd be excited to discuss on a podcast. Be specific!
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="1. How to scale SaaS companies from 0 to $10M ARR&#10;2. Building high-performing marketing teams&#10;3. The future of AI in digital marketing&#10;4. Common mistakes startups make with growth strategies&#10;5. Building a personal brand as a marketing leader"
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="suggestedTopics.keyStoriesOrMessages" render={({ field }) => (
        <FormItem>
          <FormLabel>Key Stories or Messages (Optional)</FormLabel>
          <FormDescription>
            Are there any specific stories, lessons, or messages you want to share with listeners related to these topics?
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="I love sharing the story of how we turned around our failing marketing strategy by focusing on customer success metrics instead of vanity metrics. I also have insights about building diverse, inclusive teams that drive innovation..."
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

function SampleQuestionsSection({ form }: any) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="sampleQuestions.frequentlyAsked" render={({ field }) => (
        <FormItem>
          <FormLabel>Frequently Asked Questions (Optional)</FormLabel>
          <FormDescription>
            What are some questions you're often asked about your work or expertise?
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="• How do you measure marketing ROI effectively?&#10;• What's the biggest mistake you see companies make with growth?&#10;• How do you build a team that scales with your company?&#10;• What metrics should early-stage startups focus on?"
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="sampleQuestions.loveToBeAsked" render={({ field }) => (
        <FormItem>
          <FormLabel>Questions You'd Love to Be Asked (Optional)</FormLabel>
          <FormDescription>
            Are there any questions you wish more people would ask you?
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="• How do you balance growth with sustainability?&#10;• What role does empathy play in effective marketing?&#10;• How do you handle failure and pivot strategies?&#10;• What advice would you give your younger self?"
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

function SocialProofSection({ form }: any) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="socialProof.testimonials" render={({ field }) => (
        <FormItem>
          <FormLabel>Testimonials/Reviews (Optional)</FormLabel>
          <FormDescription>
            Do you have any testimonials, reviews, or positive feedback from previous podcast hosts, clients, or audiences? Please share them here or provide links.
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="'Sarah was an incredible guest - our audience loved her practical insights and engaging stories. We saw our highest engagement rates after her episode!' - John Smith, Host of Marketing Mastery Podcast"
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="socialProof.notableStats" render={({ field }) => (
        <FormItem>
          <FormLabel>Notable Stats & Accomplishments (Optional)</FormLabel>
          <FormDescription>
            Any notable stats or accomplishments (e.g., awards, audience size for your own platforms, books published, significant company milestones)?
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="• Grew company from $500K to $5M ARR in 3 years&#10;• 15K+ LinkedIn followers&#10;• Featured in Forbes '30 Under 30'&#10;• Author of 'Growth Hacking for SaaS' (10K+ copies sold)&#10;• Speaker at 20+ industry conferences"
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

function AssetsSection({ form, addOtherAsset, removeOtherAsset }: any) {
  const otherAssets = form.watch('assets.otherAssets') || [];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Headshot & Logo Upload</h4>
            <p className="text-sm text-blue-700 mt-1">
              You can upload your professional headshot and company logo in the <strong>Media Kit</strong> tab after completing this questionnaire.
            </p>
          </div>
        </div>
      </div>

      <div>
        <FormLabel className="text-base font-medium">Other Images/Assets (Optional)</FormLabel>
        <FormDescription>
          Any other relevant images you'd like included (e.g., book covers, product screenshots, etc.)
        </FormDescription>
        
        <div className="mt-3 space-y-3">
          {otherAssets.map((_: any, index: number) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <FormField control={form.control} name={`assets.otherAssets.${index}.title`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Asset Title/Description" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name={`assets.otherAssets.${index}.url`} render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="https://link-to-asset.com" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeOtherAsset(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addOtherAsset} className="mt-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Other Asset
        </Button>
      </div>
    </div>
  );
}

function PromotionPrefsSection({ form }: any) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="promotionPrefs.preferredIntro" render={({ field }) => (
        <FormItem>
          <FormLabel>Preferred Introduction *</FormLabel>
          <FormDescription>
            How would you like to be introduced on podcasts? (e.g., 'Founder of X, helping Y achieve Z', or a short, punchy intro)
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="Sarah is the VP of Marketing at TechCorp, where she's helped grow the company from startup to $10M ARR. She's passionate about sustainable growth strategies and building diverse, high-performing teams."
              minRows={2}
              maxRows={8}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="promotionPrefs.itemsToPromote" render={({ field }) => (
        <FormItem>
          <FormLabel>Items to Promote (Optional)</FormLabel>
          <FormDescription>
            Are there specific products, services, projects, or a book you want to promote during appearances?
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="My new book 'Growth Marketing Mastery', our free SaaS growth assessment tool at growthcheck.com, and our monthly newsletter with 10K+ subscribers"
              minRows={2}
              maxRows={8}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="promotionPrefs.bestContactForHosts" render={({ field }) => (
        <FormItem>
          <FormLabel>Best Contact for Hosts *</FormLabel>
          <FormDescription>
            What's the best way for podcast hosts to contact you or your team for booking inquiries?
          </FormDescription>
          <FormControl>
            <Input 
              placeholder="sarah@techcorp.com or use our booking page: calendly.com/sarah-marketing"
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

function FinalNotesSection({ form }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">💡 Pro Tip</h4>
            <p className="text-sm text-blue-700 mt-1">
              The information you share below helps us find the perfect podcast matches for you and generates your ideal podcast description for vetting.
            </p>
          </div>
        </div>
      </div>

      <FormField control={form.control} name="finalNotes.idealPodcastDescription" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">Ideal Podcast Preferences (Optional)</FormLabel>
          <FormDescription className="space-y-3">
            <div>
              Help us find your perfect podcast matches by describing shows that align with your expertise.
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-900 mb-2">
                🎯 Focus Tip: Choose 1-2 Primary Topics
              </p>
              <p className="text-sm text-amber-800">
                Rather than listing all your areas of expertise, focus on the 1-2 topics you're most passionate about. This helps us find highly relevant shows where you'll shine as an expert.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900 mb-1">✅ Good Example:</p>
                <p className="text-xs text-green-700 italic">
                  "I love talking about sustainable business practices and circular economy on shows focused on environmental entrepreneurship. Ideal shows have 5K+ engaged listeners who are founders or sustainability leaders."
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900 mb-1">❌ Too Restrictive:</p>
                <p className="text-xs text-red-700 italic">
                  "Only top 10 business podcasts with 100K+ downloads, must be video format, host must be a CEO, only want to discuss all 15 of my expertise areas."
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Consider mentioning:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Your 1-2 favorite topics to discuss in depth</li>
                <li>Target audience (entrepreneurs, marketers, tech leaders, etc.)</li>
                <li>Preferred show format (interview, conversational, educational)</li>
                <li>Any specific values or themes that resonate with you</li>
              </ul>
            </div>
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="Example: I'm passionate about discussing data-driven marketing strategies on business and marketing podcasts. I connect best with shows targeting B2B marketers and growth leaders who want practical, actionable insights. I enjoy conversational formats where I can share real case studies and results."
              minRows={3}
              maxRows={10}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="finalNotes.anythingElse" render={({ field }) => (
        <FormItem>
          <FormLabel>Additional Notes (Optional)</FormLabel>
          <FormDescription>
            Any other information you'd like us to know? (recording preferences, availability, resources you can provide to listeners, etc.)
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="I prefer morning recordings (EST), I'm happy to provide additional resources to listeners, and I'm always excited to connect with fellow marketers on LinkedIn after episodes..."
              minRows={2}
              maxRows={8}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="finalNotes.questionsOrConcerns" render={({ field }) => (
        <FormItem>
          <FormLabel>Questions or Concerns (Optional)</FormLabel>
          <FormDescription>
            Any questions or concerns about this process, your media kit, or the podcast discovery process?
          </FormDescription>
          <FormControl>
            <AutoTextarea 
              placeholder="I'd love to review the media kit before it goes live. Also, how often can I update this information? Any specific requirements for podcast bookings?"
              minRows={2}
              maxRows={8}
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800">Almost Done!</h4>
            <p className="text-sm text-green-700 mt-1">
              Once you submit this questionnaire, our team will use your information to create a professional media kit. 
              You'll be able to review and edit it before it goes live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}