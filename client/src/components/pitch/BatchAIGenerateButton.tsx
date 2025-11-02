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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePitchCapabilities } from "@/hooks/usePitchCapabilities";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Loader2,
  Lock,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface BatchMatch {
  match_id: number;
  media_name?: string;
}

interface BatchAIGenerateButtonProps {
  matches: BatchMatch[];
  onComplete?: (results: any[]) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function BatchAIGenerateButton({
  matches,
  onComplete,
  size = "default",
  variant = "default",
  className = ""
}: BatchAIGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("ai_pitch_authority_v2");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseAI, isFreePlan, capabilities, isAdmin } = usePitchCapabilities();

  const handleInitiateBatchGenerate = () => {
    if (!canUseAI) {
      toast({
        title: "Upgrade Required",
        description: "AI batch generation is available for Premium users.",
        variant: "destructive",
      });
      return;
    }

    // For admins, skip template selection and go straight to generation
    if (isAdmin) {
      handleBatchGenerate();
    } else {
      // For paid_basic users, show template selection dialog
      setShowTemplateSelection(true);
    }
  };

  const handleBatchGenerate = async () => {
    setShowTemplateSelection(false);
    setIsGenerating(true);
    setShowBatchDialog(true);

    try {
      // Determine template based on user role
      const templateId = isAdmin ? "admin_pitch_authority_v2" : selectedTemplate;

      // Build batch payload
      const batchPayload = matches.map(match => ({
        match_id: match.match_id,
        pitch_template_id: templateId
      }));

      // Call batch endpoint
      const response = await apiRequest("POST", "/pitches/generate-batch", batchPayload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate batch" }));
        throw new Error(errorData.detail || "Failed to generate batch");
      }

      const result = await response.json();

      // Extract counts from response
      const successCount = result.results?.successful?.length || 0;
      const failedCount = result.results?.failed?.length || 0;
      const duplicateCount = result.results?.duplicates?.length || 0;

      // Show summary toast
      if (successCount > 0) {
        toast({
          title: "Batch Generation Complete",
          description: `Successfully generated ${successCount} pitch${successCount > 1 ? 'es' : ''}${failedCount > 0 ? `. ${failedCount} failed` : ''}${duplicateCount > 0 ? `. ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} skipped` : ''}.`,
        });
      } else {
        toast({
          title: "Batch Generation Failed",
          description: `Failed to generate pitches${failedCount > 0 ? `: ${failedCount} error${failedCount > 1 ? 's' : ''}` : ''}. Please try again.`,
          variant: "destructive",
        });
      }

      // Refresh data - comprehensive refresh
      queryClient.invalidateQueries({ queryKey: ["/pitches"] });
      queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      queryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });

      // Force immediate refetch for instant updates
      queryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });

      if (onComplete) {
        onComplete(result.results?.successful || []);
      }

    } catch (error: any) {
      toast({
        title: "Batch Generation Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      // Keep dialog open briefly to show completion
      setTimeout(() => setShowBatchDialog(false), 1500);
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
            description: "Upgrade to Premium to unlock batch AI generation",
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
        Batch AI Generate (Premium)
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={`${className} ${variant === 'default' ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' : ''}`}
        onClick={handleInitiateBatchGenerate}
        disabled={isGenerating || matches.length === 0}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate {matches.length} Pitch{matches.length !== 1 ? 'es' : ''}
      </Button>

      {/* Template Selection Dialog (for paid_basic users) */}
      <Dialog open={showTemplateSelection} onOpenChange={setShowTemplateSelection}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Select Pitch Template
            </DialogTitle>
            <DialogDescription>
              Choose a template for generating {matches.length} pitch{matches.length !== 1 ? 'es' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-select">Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_pitch_authority_v2">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Authority Template</span>
                      <span className="text-xs text-gray-500">Professional and authoritative tone</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ai_pitch_smart_v2">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Smart Template</span>
                      <span className="text-xs text-gray-500">Conversational and engaging tone</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Limits Warning */}
            {capabilities?.limits?.ai_generations_per_month !== 'unlimited' && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  This will use {matches.length} of your {capabilities?.limits?.ai_generations_per_month} monthly AI generations.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateSelection(false)}>
              Cancel
            </Button>
            <Button onClick={handleBatchGenerate} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Pitches
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Generation Progress Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={(open) => !isGenerating && setShowBatchDialog(open)}>
        <DialogContent className="sm:max-w-[400px]" hideCloseButton={isGenerating}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              {isGenerating ? 'Generating Pitches...' : 'Generation Complete'}
            </DialogTitle>
            <DialogDescription>
              {isGenerating
                ? `Processing ${matches.length} pitch${matches.length !== 1 ? 'es' : ''} in parallel. This may take a moment.`
                : `Batch generation finished.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {isGenerating && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                <p className="text-sm text-gray-600">
                  Please wait while AI generates your pitches...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}