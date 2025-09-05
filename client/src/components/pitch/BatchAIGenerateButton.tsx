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
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchMatch {
  match_id: number;
  media_name?: string;
  status?: "pending" | "generating" | "success" | "failed";
  error?: string;
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
  const [batchProgress, setBatchProgress] = useState(0);
  const [processedMatches, setProcessedMatches] = useState<BatchMatch[]>([]);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseAI, isFreePlan, capabilities } = usePitchCapabilities();

  const handleBatchGenerate = async () => {
    if (!canUseAI) {
      toast({
        title: "Upgrade Required",
        description: "AI batch generation is available for Premium users.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setShowBatchDialog(true);
    setBatchProgress(0);
    setProcessedMatches([]);

    const results = [];
    const updatedMatches: BatchMatch[] = [...matches].map(m => ({ ...m, status: "pending" as BatchMatch["status"] }));
    setProcessedMatches(updatedMatches);

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      setCurrentlyProcessing(match.media_name || `Match ${match.match_id}`);
      
      // Update status to generating
      updatedMatches[i].status = "generating" as BatchMatch["status"];
      setProcessedMatches([...updatedMatches]);

      try {
        const response = await apiRequest("POST", "/pitches/generate", {
          match_id: match.match_id,
          pitch_template_id: "generic_pitch_v1"
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Failed to generate" }));
          throw new Error(errorData.detail);
        }

        const result = await response.json();
        results.push(result);
        
        // Update status to success
        updatedMatches[i].status = "success" as BatchMatch["status"];
        setProcessedMatches([...updatedMatches]);
      } catch (error: any) {
        // Update status to failed
        updatedMatches[i].status = "failed" as BatchMatch["status"];
        updatedMatches[i].error = error.message;
        setProcessedMatches([...updatedMatches]);
        results.push({ error: error.message, match_id: match.match_id });
      }

      // Update progress
      setBatchProgress(((i + 1) / matches.length) * 100);
    }

    setCurrentlyProcessing(null);
    setIsGenerating(false);

    // Show summary
    const successCount = updatedMatches.filter(m => m.status === "success").length;
    const failedCount = updatedMatches.filter(m => m.status === "failed").length;

    if (successCount > 0) {
      toast({
        title: "Batch Generation Complete",
        description: `Successfully generated ${successCount} pitch${successCount > 1 ? 'es' : ''}${failedCount > 0 ? `. ${failedCount} failed.` : '.'}`,
      });
    } else {
      toast({
        title: "Batch Generation Failed",
        description: "Failed to generate pitches. Please try again.",
        variant: "destructive",
      });
    }

    // Refresh data - more comprehensive refresh
    queryClient.invalidateQueries({ queryKey: ["/pitches"] });
    queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
    queryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
    queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
    
    // Also force immediate refetch for instant updates
    queryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });

    if (onComplete) {
      onComplete(results);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <X className="h-4 w-4 text-red-600" />;
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
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
                onClick={() => window.open('https://calendly.com/gentoftech/catch-up-call3', '_blank')}
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
        onClick={handleBatchGenerate}
        disabled={isGenerating || matches.length === 0}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate {matches.length} Pitch{matches.length !== 1 ? 'es' : ''}
      </Button>

      {/* Batch Generation Progress Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={(open) => !isGenerating && setShowBatchDialog(open)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Batch AI Generation
            </DialogTitle>
            <DialogDescription>
              Generating personalized pitches for {matches.length} approved matches.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{Math.round(batchProgress)}%</span>
              </div>
              <Progress value={batchProgress} className="h-2" />
              {currentlyProcessing && (
                <p className="text-sm text-gray-600">
                  Currently processing: <span className="font-medium">{currentlyProcessing}</span>
                </p>
              )}
            </div>

            {/* Match List */}
            <ScrollArea className="h-[200px] border rounded-lg p-3">
              <div className="space-y-2">
                {processedMatches.map((match) => (
                  <div 
                    key={match.match_id} 
                    className="flex items-center justify-between p-2 rounded-md bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(match.status)}
                      <span className="text-sm">
                        {match.media_name || `Match ${match.match_id}`}
                      </span>
                    </div>
                    {match.status === "failed" && match.error && (
                      <span className="text-xs text-red-600">{match.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Summary Stats */}
            {!isGenerating && processedMatches.some(m => m.status === "success" || m.status === "failed") && (
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {processedMatches.filter(m => m.status === "success").length} Success
                </Badge>
                {processedMatches.filter(m => m.status === "failed").length > 0 && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    {processedMatches.filter(m => m.status === "failed").length} Failed
                  </Badge>
                )}
              </div>
            )}

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
            {!isGenerating && (
              <Button
                variant="outline"
                onClick={() => setShowBatchDialog(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}