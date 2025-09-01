import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Zap
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface AIGenerateFollowUpButtonProps {
  matchId: number;
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
  const [templateId, setTemplateId] = useState("follow_up_gentle");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseAI, isFreePlan } = usePitchCapabilities();

  const followUpTemplates = [
    { 
      value: "follow_up_gentle", 
      label: "Gentle Reminder",
      description: "Friendly follow-up to check if they saw your email",
      icon: MessageSquare
    },
    { 
      value: "follow_up_value", 
      label: "Value Reinforcement",
      description: "Emphasize the value you can bring to their audience",
      icon: Zap
    },
    { 
      value: "follow_up_urgent", 
      label: "Time Sensitive",
      description: "Create urgency with a time-limited opportunity",
      icon: Clock
    },
    { 
      value: "follow_up_custom", 
      label: "Custom Follow-up",
      description: "Create your own custom follow-up message",
      icon: RefreshCw
    }
  ];

  const handleGenerateFollowUp = async () => {
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
      const payload: any = {
        template_id: templateId
      };
      
      // Only add custom fields if they have values
      if (customSubject) {
        payload.custom_subject = customSubject;
      }
      if (customBody) {
        payload.custom_body = customBody;
      }

      const response = await apiRequest("POST", `/pitches/match/${matchId}/generate-followup`, payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate follow-up" }));
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      
      toast({
        title: "Follow-up Generated!",
        description: `Follow-up created for ${mediaName || "this podcast"}`,
      });

      // Refresh pitch data
      // Refresh pitch data - more comprehensive refresh
      queryClient.invalidateQueries({ queryKey: ["/pitches"] });
      queryClient.invalidateQueries({ queryKey: [`/pitches/match/${matchId}`] });
      queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      queryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
      
      // Also force immediate refetch for instant updates
      queryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });

      if (onSuccess) {
        onSuccess(result);
      }
      
      setShowFollowUpDialog(false);
      setCustomSubject(""); // Reset form
      setCustomBody(""); // Reset form
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate follow-up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
                onClick={() => window.location.href = '/settings/subscription'}
              >
                Upgrade Now
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
        onClick={() => setShowFollowUpDialog(true)}
        disabled={isGenerating}
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
              Generate Follow-up
            </DialogTitle>
            <DialogDescription>
              Create an AI-powered follow-up message for {mediaName || "this podcast"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Follow-up Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
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
                          </div>
                          <span className="text-xs text-gray-500">{template.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Subject (Optional) */}
            <div className="space-y-2">
              <Label>Custom Subject Line (Optional)</Label>
              <Textarea
                placeholder="Leave blank to use template default..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Override the template's default subject line if needed.
              </p>
            </div>

            {/* Custom Body (Optional) */}
            <div className="space-y-2">
              <Label>Custom Body Text (Optional)</Label>
              <Textarea
                placeholder="Add any specific points or customize the message..."
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Customize the follow-up message or add specific talking points.
              </p>
            </div>

            {/* AI Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                The AI will generate a follow-up based on your previous pitch and the selected template. The system automatically tracks which follow-up number this is.
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
              onClick={handleGenerateFollowUp}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}