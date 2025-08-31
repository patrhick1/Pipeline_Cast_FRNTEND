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
  pitchId: number;
  pitchGenId: number;
  mediaName?: string;
  followUpNumber?: number;
  lastResponseType?: "no_response" | "positive" | "negative" | "neutral";
  onSuccess?: (followUpData: any) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function AIGenerateFollowUpButton({
  pitchId,
  pitchGenId,
  mediaName,
  followUpNumber = 1,
  lastResponseType = "no_response",
  onSuccess,
  size = "sm",
  variant = "outline",
  className = ""
}: AIGenerateFollowUpButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [followUpType, setFollowUpType] = useState("gentle_reminder");
  const [customContext, setCustomContext] = useState("");
  const [daysSinceLastContact, setDaysSinceLastContact] = useState("7");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseAI, isFreePlan } = usePitchCapabilities();

  const followUpTypes = [
    { 
      value: "gentle_reminder", 
      label: "Gentle Reminder",
      description: "Friendly follow-up to check if they saw your email",
      icon: MessageSquare
    },
    { 
      value: "value_reinforcement", 
      label: "Value Reinforcement",
      description: "Emphasize the value you can bring to their audience",
      icon: Zap
    },
    { 
      value: "time_sensitive", 
      label: "Time Sensitive",
      description: "Create urgency with a time-limited opportunity",
      icon: Clock
    },
    { 
      value: "different_angle", 
      label: "Different Angle",
      description: "Approach from a new perspective",
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
      const response = await apiRequest("POST", "/pitches/generate-follow-up", {
        parent_pitch_gen_id: pitchGenId,
        follow_up_type: followUpType,
        follow_up_number: followUpNumber,
        days_since_last_contact: parseInt(daysSinceLastContact),
        last_response_type: lastResponseType,
        custom_context: customContext || undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate follow-up" }));
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      
      toast({
        title: "Follow-up Generated!",
        description: `Follow-up #${followUpNumber} created for ${mediaName || "this podcast"}`,
      });

      // Refresh pitch data
      queryClient.invalidateQueries({ queryKey: ["/pitches"] });
      queryClient.invalidateQueries({ queryKey: [`/pitches/${pitchId}`] });

      if (onSuccess) {
        onSuccess(result);
      }
      
      setShowFollowUpDialog(false);
      setCustomContext(""); // Reset form
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
            Generate Follow-up
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
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Follow-up Type Selection */}
            <div className="space-y-2">
              <Label>Follow-up Strategy</Label>
              <Select value={followUpType} onValueChange={setFollowUpType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select follow-up type" />
                </SelectTrigger>
                <SelectContent>
                  {followUpTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{type.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Days Since Last Contact */}
            <div className="space-y-2">
              <Label>Days Since Last Contact</Label>
              <Select value={daysSinceLastContact} onValueChange={setDaysSinceLastContact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="21">3 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Context (Optional) */}
            <div className="space-y-2">
              <Label>Additional Context (Optional)</Label>
              <Textarea
                placeholder="Add any specific points you want the AI to include..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Help the AI personalize the follow-up with relevant context or recent developments.
              </p>
            </div>

            {/* AI Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                The AI will craft a follow-up that maintains conversation continuity while adjusting the approach based on your selected strategy.
              </AlertDescription>
            </Alert>

            {/* Follow-up Number Badge */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <span className="text-sm text-gray-600">Follow-up Number</span>
              <Badge variant="secondary">#{followUpNumber}</Badge>
            </div>
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