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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePitchCapabilities } from "@/hooks/usePitchCapabilities";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Sparkles, 
  Loader2, 
  Lock, 
  Zap,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface AIGeneratePitchButtonProps {
  matchId: number;
  mediaName?: string;
  campaignName?: string;
  onSuccess?: (pitchData: any) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showIcon?: boolean;
  className?: string;
}

export function AIGeneratePitchButton({
  matchId,
  mediaName,
  campaignName,
  onSuccess,
  size = "default",
  variant = "default",
  showIcon = true,
  className = ""
}: AIGeneratePitchButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("generic_pitch_v1");
  const [generationResult, setGenerationResult] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseAI, isFreePlan, capabilities } = usePitchCapabilities();

  const handleGeneratePitch = async () => {
    if (!canUseAI) {
      toast({
        title: "Upgrade Required",
        description: "AI pitch generation is available for Premium users. Please upgrade your plan to access this feature.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/pitches/generate", {
        match_id: matchId,
        pitch_template_id: selectedTemplate
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate pitch" }));
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      setGenerationResult(result);
      
      toast({
        title: "Pitch Generated Successfully!",
        description: `AI pitch created for ${mediaName || "this podcast"}`,
      });

      // Refresh pitch data - more comprehensive refresh
      queryClient.invalidateQueries({ queryKey: ["/pitches"] });
      queryClient.invalidateQueries({ queryKey: ["/review-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      queryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
      
      // Also force immediate refetch for instant updates
      queryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });

      if (onSuccess) {
        onSuccess(result);
      }
      
      setShowTemplateDialog(false);
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate pitch. Please try again.",
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
            description: "Upgrade to Premium to unlock AI pitch generation",
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
        AI Generate (Premium)
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={`${className} ${variant === 'default' ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' : ''}`}
        onClick={() => setShowTemplateDialog(true)}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            {showIcon && <Sparkles className="h-4 w-4 mr-2" />}
            AI Generate Pitch
          </>
        )}
      </Button>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Generate AI Pitch
            </DialogTitle>
            <DialogDescription>
              Select a template and let AI create a personalized pitch for {mediaName || "this podcast"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Campaign Info */}
            {campaignName && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Campaign</p>
                <p className="font-medium">{campaignName}</p>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pitch Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic_pitch_v1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Generic Pitch (Default)
                    </div>
                  </SelectItem>
                  <SelectItem value="personalized_pitch_v1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Personalized Pitch
                    </div>
                  </SelectItem>
                  <SelectItem value="expert_pitch_v1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Expert Authority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Capabilities Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                AI will analyze the podcast's content and create a personalized pitch that matches their style and audience.
              </AlertDescription>
            </Alert>

            {/* Generation Limits (if applicable) */}
            {capabilities?.limits?.ai_generations_per_month !== 'unlimited' && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-sm text-amber-800">
                  AI Generations remaining this month: 
                  <Badge className="ml-2" variant="secondary">
                    {capabilities?.limits?.ai_generations_per_month || 0}
                  </Badge>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePitch}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Pitch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}