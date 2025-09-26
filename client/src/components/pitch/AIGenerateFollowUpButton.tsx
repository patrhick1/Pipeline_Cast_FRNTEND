import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePitchCapabilities } from "@/hooks/usePitchCapabilities";
import { useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Loader2,
  Lock,
  MessageSquare,
  Clock,
  AlertCircle,
  Zap,
  Sparkles
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface AIGenerateFollowUpButtonProps {
  matchId?: number | null;
  mediaName?: string;
  onSuccess?: (followUpData: any) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function AIGenerateFollowUpButton({
  matchId,
  mediaName,
  onSuccess,
  size = "sm",
  variant = "outline",
  className = ""
}: AIGenerateFollowUpButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [followUpNumber, setFollowUpNumber] = useState(1);
  const [useAutoTemplate, setUseAutoTemplate] = useState(true);
  const [generateCompleteSequence, setGenerateCompleteSequence] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseAI, isFreePlan, isAdmin, isStaff } = usePitchCapabilities();

  // Get appropriate template ID based on user role
  const getTemplateId = (baseTemplate: string): string => {
    if (isAdmin || isStaff) {
      return `admin_${baseTemplate}`;
    }
    return baseTemplate;
  };

  const followUpTemplates = [
    {
      value: "follow_up_gentle",
      label: "Gentle Reminder",
      description: "Friendly follow-up to check if they saw your email",
      icon: MessageSquare,
      pitchType: "follow_up_1"
    },
    {
      value: "follow_up_value",
      label: "Value Add",
      description: "Emphasize the value you can bring to their audience",
      icon: Zap,
      pitchType: "follow_up_2"
    },
    {
      value: "follow_up_urgent",
      label: "Timely Hook",
      description: "Create urgency with a time-limited opportunity",
      icon: Clock,
      pitchType: "follow_up_3"
    },
    {
      value: "follow_up_breakup",
      label: "Final Outreach",
      description: "Final outreach using reverse psychology",
      icon: AlertCircle,
      pitchType: "follow_up_4"
    }
  ];
  
  // Function to auto-select template based on existing follow-ups
  const selectTemplateBasedOnSequence = async () => {
    if (!matchId) return "follow_up_gentle";
    
    try {
      // Get existing pitches for this match
      const response = await apiRequest("GET", `/pitches/match/${matchId}/pitches`);
      if (response.ok) {
        const pitches = await response.json();
        
        // Count follow-ups already sent
        const followUpCount = pitches.filter((p: any) => 
          p.pitch_type && p.pitch_type.includes('follow_up')
        ).length;
        
        // Select template based on sequence
        switch(followUpCount) {
          case 0:
            return 'follow_up_gentle';
          case 1:
            return 'follow_up_value';
          case 2:
            return 'follow_up_urgent';
          default:
            return 'follow_up_breakup';
        }
      }
    } catch (error) {
      console.error('Error selecting template:', error);
    }
    
    return 'follow_up_gentle'; // Default fallback
  };
  
  // Auto-select template when dialog opens and get follow-up number
  useEffect(() => {
    if (showFollowUpDialog && matchId) {
      selectTemplateBasedOnSequence().then(template => {
        setTemplateId(template);
      });
      
      // Get follow-up number
      apiRequest("GET", `/pitches/match/${matchId}/pitches`)
        .then(response => response.json())
        .then(pitches => {
          const followUpCount = pitches.filter((p: any) => 
            p.pitch_type && p.pitch_type.includes('follow_up')
          ).length;
          setFollowUpNumber(followUpCount + 1);
        })
        .catch(() => setFollowUpNumber(1));
    }
  }, [showFollowUpDialog, matchId]);

  const handleGenerateFollowUp = async (singleMatchId?: number, customTemplateId?: string | null) => {
    const targetMatchId = singleMatchId || matchId;

    // Validate match_id first
    if (!targetMatchId || targetMatchId === undefined || targetMatchId === null) {
      toast({
        title: "Match Required",
        description: "Please select a match before generating a follow-up.",
        variant: "destructive",
      });
      return;
    }

    if (!canUseAI) {
      toast({
        title: "Upgrade Required",
        description: "AI follow-up generation is available for Premium users.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Build payload - only include template_id if not using auto-selection
      const payload: any = {};

      if (!useAutoTemplate && (customTemplateId || templateId)) {
        const baseTemplate = customTemplateId || templateId;
        payload.template_id = getTemplateId(baseTemplate);
      }
      // If useAutoTemplate is true, send empty payload for backend auto-selection

      const response = await apiRequest("POST", `/pitches/match/${targetMatchId}/generate-followup`, payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate follow-up" }));
        
        // Handle specific error cases
        let errorMessage = errorData.detail || "Failed to generate follow-up";
        
        if (errorMessage.includes('not found')) {
          errorMessage = 'Match not found. Please refresh and try again.';
        } else if (errorMessage.includes('parsing')) {
          errorMessage = `Invalid match ID: ${matchId}. Please select a valid match.`;
        } else if (errorMessage.includes('No initial pitch')) {
          errorMessage = 'Please generate an initial pitch before creating follow-ups.';
        } else if (errorMessage.includes('already exists')) {
          errorMessage = 'A follow-up of this type already exists for this match.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Don't show toast if generating complete sequence
      if (!generateCompleteSequence) {
        toast({
          title: "Follow-up Generated!",
          description: `${result.pitch_type || 'Follow-up'} created for ${mediaName || "this podcast"}`,
        });
      }

      // Refresh pitch data
      queryClient.invalidateQueries({ queryKey: ["/pitches"] });
      queryClient.invalidateQueries({ queryKey: [`/pitches/match/${targetMatchId}`] });
      queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      queryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });

      // Also force immediate refetch for instant updates
      queryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });

      if (onSuccess && !generateCompleteSequence) {
        onSuccess(result);
      }

      return result; // Return result for sequence generation
    } catch (error: any) {
      if (!generateCompleteSequence) {
        toast({
          title: "Generation Failed",
          description: error.message || "Failed to generate follow-up. Please try again.",
          variant: "destructive",
        });
      }
      throw error; // Re-throw for sequence generation
    } finally {
      if (!generateCompleteSequence) {
        setIsGenerating(false);
      }
    }
  };

  // Generate complete sequence of follow-ups
  const handleGenerateCompleteSequence = async () => {
    if (!matchId) {
      toast({
        title: "Match Required",
        description: "Please select a match before generating follow-ups.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerateCompleteSequence(true);

    try {
      const results = [];
      let errorCount = 0;

      // Generate all 4 follow-ups
      for (let i = 0; i < 4; i++) {
        try {
          const result = await handleGenerateFollowUp(matchId);
          results.push(result);
        } catch (error: any) {
          errorCount++;
          // Continue generating even if one fails
          console.error(`Failed to generate follow-up ${i + 1}:`, error);
        }
      }

      const successCount = results.length;

      toast({
        title: "Sequence Generation Complete!",
        description: `Generated ${successCount} follow-ups${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      if (onSuccess) {
        onSuccess(results);
      }

      setShowFollowUpDialog(false);
    } finally {
      setIsGenerating(false);
      setGenerateCompleteSequence(false);
    }
  };

  // If user is on free plan, show upgrade prompt
  if (isFreePlan) {
    return (
      <Button
        size={size}
        variant="outline"
        className={`${className} border-amber-200 hover:bg-amber-50`}
        onClick={() => {
          toast({
            title: "Premium Feature",
            description: "Upgrade to Premium to unlock AI follow-up generation",
            action: (
              <Button 
                size="sm" 
                onClick={() => window.open('https://calendly.com/alex-podcastguestlaunch/30min', '_blank')}
              >
                Book Demo
              </Button>
            )
          });
        }}
      >
        <Lock className="h-4 w-4 mr-2 text-amber-600" />
        AI Follow-up (Premium)
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => {
          if (!matchId) {
            toast({
              title: "Match Required",
              description: "Please select a match before generating a follow-up.",
              variant: "destructive",
            });
            return;
          }
          setShowFollowUpDialog(true);
        }}
        disabled={isGenerating || !matchId}
        title={!matchId ? "Match ID required to generate follow-ups" : undefined}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Plan Follow-ups
          </>
        )}
      </Button>

      {/* Follow-up Generation Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Generate Follow-up #{followUpNumber}
            </DialogTitle>
            <DialogDescription>
              Create an AI-powered follow-up message for {mediaName || "this podcast"}.
              {followUpNumber > 1 && (
                <span className="block mt-1 text-xs text-amber-600">
                  This will be follow-up #{followUpNumber} in the sequence.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Auto Template Selection */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-template"
                checked={useAutoTemplate}
                onCheckedChange={(checked) => {
                  setUseAutoTemplate(checked as boolean);
                  if (checked) {
                    setTemplateId(null);
                  }
                }}
              />
              <Label
                htmlFor="auto-template"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Auto-select best template based on sequence
                <Badge variant="secondary" className="ml-2">Recommended</Badge>
              </Label>
            </div>

            {/* Template Selection - Only show if not using auto */}
            {!useAutoTemplate && (
              <div className="space-y-2">
                <Label>Choose Template Manually</Label>
                <Select value={templateId || ""} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select follow-up template" />
                  </SelectTrigger>
                  <SelectContent>
                    {followUpTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <SelectItem key={template.value} value={template.value}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="font-medium">{template.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.pitchType}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">{template.description}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Generate Complete Sequence Option */}
            <div className="border-t pt-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="complete-sequence"
                  checked={generateCompleteSequence}
                  onCheckedChange={(checked) => setGenerateCompleteSequence(checked as boolean)}
                  disabled={followUpNumber > 1}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="complete-sequence"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Generate complete follow-up sequence (all 4)
                    {followUpNumber > 1 && (
                      <Badge variant="outline" className="ml-2">
                        {followUpNumber - 1} already exist
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-gray-500">
                    Automatically generate all remaining follow-ups in the sequence
                  </p>
                </div>
              </div>
            </div>

            {/* AI Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                The AI will generate a follow-up based on your previous pitch and the selected template.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFollowUpDialog(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={generateCompleteSequence ? handleGenerateCompleteSequence : () => handleGenerateFollowUp()}
              disabled={isGenerating || (!useAutoTemplate && !templateId && !generateCompleteSequence)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {generateCompleteSequence ? "Generating Sequence..." : "Generating..."}
                </>
              ) : (
                <>
                  {generateCompleteSequence ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate All Follow-ups
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Follow-up
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}