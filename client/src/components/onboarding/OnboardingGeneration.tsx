import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Lightbulb,
  Loader2,
  RefreshCw,
  ArrowRight,
  Wand2,
  Edit2,
  Plus,
  X,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface OnboardingGenerationProps {
  campaignId: string;
  questionnaireData: any;
  onComplete: (content: any) => void;
}

export default function OnboardingGeneration({ campaignId, onComplete }: OnboardingGenerationProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStarted, setGenerationStarted] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isEditingKeywords, setIsEditingKeywords] = useState(false);
  const [editableKeywords, setEditableKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Check if content already exists
  const { data: campaign, refetch: refetchCampaign } = useQuery({
    queryKey: ["campaign-generation", campaignId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/campaigns/${campaignId}`);
        if (!response.ok) {
          console.log("Campaign fetch failed, will generate fresh content");
          return null;
        }
        return response.json();
      } catch (error) {
        console.log("Campaign fetch error, will generate fresh content");
        return null;
      }
    },
    retry: false,
  });

  // Generation mutation
  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/campaigns/${campaignId}/generate-angles-bio`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate content");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: "Content generated! ✨",
        description: "Your bio and pitch angles are ready.",
      });
      // Refetch campaign to get updated data
      refetchCampaign();
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Update keywords mutation
  const updateKeywordsMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      const response = await apiRequest("PATCH", `/campaigns/${campaignId}`, {
        campaign_keywords: keywords
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update keywords");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Keywords updated! ✅",
        description: "Your discovery keywords have been saved.",
      });
      setIsEditingKeywords(false);
      refetchCampaign();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-start generation
  useEffect(() => {
    if (!generationStarted && campaign && !campaign.campaign_bio) {
      setGenerationStarted(true);
      handleGenerate();
    } else if (campaign?.campaign_bio && campaign?.campaign_angles) {
      // Content already exists
      setGeneratedContent({
        bio: campaign.campaign_bio,
        angles: campaign.campaign_angles,
        keywords: campaign.campaign_keywords
      });
      // Initialize editable keywords
      if (campaign.campaign_keywords && editableKeywords.length === 0) {
        setEditableKeywords(campaign.campaign_keywords);
      }
    }
  }, [campaign, generationStarted]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await generateContentMutation.mutateAsync();
    setIsGenerating(false);
  };

  // Keyword editing functions
  const handleStartEditingKeywords = () => {
    setIsEditingKeywords(true);
    if (campaign?.campaign_keywords) {
      setEditableKeywords([...campaign.campaign_keywords]);
    }
  };

  const handleCancelEditingKeywords = () => {
    setIsEditingKeywords(false);
    setEditableKeywords(campaign?.campaign_keywords || []);
    setNewKeyword("");
    setEditingIndex(null);
    setEditValue("");
  };

  const handleSaveKeywords = () => {
    updateKeywordsMutation.mutate(editableKeywords);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setEditableKeywords([...editableKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setEditableKeywords(editableKeywords.filter((_, i) => i !== index));
  };

  const handleStartEditKeyword = (index: number, value: string) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const handleSaveEditKeyword = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newKeywords = [...editableKeywords];
      newKeywords[editingIndex] = editValue.trim();
      setEditableKeywords(newKeywords);
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const handleCancelEditKeyword = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleContinue = () => {
    onComplete(generatedContent);
  };

  // Loading state
  if (!campaign || (isGenerating && !generatedContent)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy/5 via-white to-teal/5 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-navy/10 rounded-full mb-4 animate-pulse">
            <Wand2 className="h-10 w-10 text-navy" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Creating Your Professional Content
            </h2>
            <p className="text-lg text-gray-600">
              Our AI is analyzing your responses and crafting the perfect bio and pitch angles...
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-navy" />
              <span className="text-gray-700">Analyzing your expertise...</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-navy" />
              <span className="text-gray-700">Crafting compelling pitch angles...</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-navy" />
              <span className="text-gray-700">Optimizing for podcast discovery...</span>
            </div>
          </div>

          <p className="text-sm text-gray-500">This usually takes 30-60 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy/5 via-white to-teal/5 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            Your Content is Ready! 🎉
          </h2>
          <p className="text-lg text-gray-600">
            Here's a preview of your AI-generated bio and pitch angles
          </p>
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-100 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800 font-medium">
              You can edit and refine everything in the next step
            </p>
          </div>
        </div>

        {/* Bio Preview */}
        <Card className="border-2 hover:border-teal/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-navy" />
              Your Professional Bio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign?.campaign_bio ? (
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {campaign.campaign_bio.substring(0, 300)}...
                </p>
                <Badge variant="secondary" className="mt-2">
                  Full bio available in next step
                </Badge>
              </div>
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>

        {/* Angles Preview */}
        <Card className="border-2 hover:border-teal/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-navy" />
              Your Pitch Angles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign?.campaign_angles ? (
              <div className="space-y-3">
                {(() => {
                  // Check if campaign_angles is a URL (Google Docs link)
                  if (typeof campaign.campaign_angles === 'string' && campaign.campaign_angles.startsWith('http')) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-3">Your pitch angles have been generated!</p>
                        <a 
                          href={campaign.campaign_angles} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-navy hover:text-navy-700 underline inline-flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View Angles Document
                        </a>
                      </div>
                    );
                  }
                  
                  // Try to parse as JSON if not a URL
                  try {
                    const angles = JSON.parse(campaign.campaign_angles);
                    if (Array.isArray(angles)) {
                      return angles.slice(0, 3).map((angle: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Badge className="mt-0.5">{index + 1}</Badge>
                          <div>
                            <h4 className="font-medium text-gray-900">{angle.topic}</h4>
                            <p className="text-sm text-gray-600 mt-1">{angle.outcome}</p>
                          </div>
                        </div>
                      ));
                    } else {
                      console.error('campaign_angles is not an array:', angles);
                      return <p className="text-gray-500">No angles available</p>;
                    }
                  } catch (error) {
                    console.error('Failed to parse campaign_angles:', campaign.campaign_angles);
                    return <p className="text-gray-500">No angles available</p>;
                  }
                })()}
                {(() => {
                  // Don't show count if it's a URL
                  if (typeof campaign.campaign_angles === 'string' && campaign.campaign_angles.startsWith('http')) {
                    return null;
                  }
                  
                  try {
                    const angles = JSON.parse(campaign.campaign_angles);
                    if (Array.isArray(angles) && angles.length > 3) {
                      return (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          + {angles.length - 3} more angles generated
                        </p>
                      );
                    }
                    return null;
                  } catch (error) {
                    return null;
                  }
                })()}
              </div>
            ) : (
              <Skeleton className="h-32 w-full" />
            )}
          </CardContent>
        </Card>

        {/* Keywords */}
        {campaign?.campaign_keywords && (
          <Card className="border-2 hover:border-teal/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-navy" />
                  Discovery Keywords
                </div>
                {!isEditingKeywords ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEditingKeywords}
                    className="text-navy hover:text-navy-700"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEditingKeywords}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveKeywords}
                      disabled={updateKeywordsMutation.isPending}
                    >
                      {updateKeywordsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!isEditingKeywords && (
                  <p className="text-sm text-gray-600">
                    These keywords help podcasts find you. Click Edit to customize them.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(isEditingKeywords ? editableKeywords : campaign.campaign_keywords.slice(0, 8)).map((keyword: string, index: number) => (
                    <div key={index} className="flex items-center">
                      {isEditingKeywords && editingIndex === index ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditKeyword();
                              if (e.key === 'Escape') handleCancelEditKeyword();
                            }}
                            className="h-7 w-32 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveEditKeyword}
                            className="h-7 w-7 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEditKeyword}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className={isEditingKeywords ? "cursor-pointer pr-1" : ""}
                          onClick={() => isEditingKeywords && handleStartEditKeyword(index, keyword)}
                        >
                          {keyword}
                          {isEditingKeywords && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveKeyword(index);
                              }}
                              className="h-4 w-4 p-0 ml-1 hover:bg-red-100"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                
                {isEditingKeywords && (
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      placeholder="Add new keyword..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      className="h-8 max-w-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddKeyword}
                      disabled={!newKeyword.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                )}
                
                {!isEditingKeywords && campaign.campaign_keywords.length > 8 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 8 of {campaign.campaign_keywords.length} keywords
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate Content
          </Button>
          
          <Button
            size="lg"
            onClick={handleContinue}
            className="flex items-center gap-2 bg-gradient-to-r from-navy to-teal hover:from-navy-700 hover:to-teal-700"
          >
            Continue to Media Kit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-teal/5 to-navy/5 border-2 border-teal/20">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wand2 className="h-5 w-5 text-navy" />
              <h3 className="font-semibold text-gray-900">Remember: This is just the starting point!</h3>
            </div>
            <p className="text-sm text-gray-700">
              In the next step, you'll be able to edit your bio, refine your talking points, add images, 
              and customize everything to perfectly represent your brand.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}