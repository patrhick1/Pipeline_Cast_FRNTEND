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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePitchCapabilities } from "@/hooks/usePitchCapabilities";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle,
  XCircle,
  SkipForward,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface BulkFollowUpResult {
  status: string;
  message: string;
  campaign_id: string;
  pitch_type_processed: string;
  next_pitch_type_generated: string;
  results: {
    successful: Array<{
      match_id: number;
      pitch_gen_id: number;
      pitch_type: string;
      parent_pitch_id?: number;
    }>;
    failed: Array<{
      match_id: number;
      error: string;
    }>;
    skipped: Array<{
      match_id: number;
      reason: string;
    }>;
  };
}

interface BulkFollowUpButtonProps {
  campaignId: string;
  campaignName?: string;
  onComplete?: (results: BulkFollowUpResult) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
}

export function BulkFollowUpButton({
  campaignId,
  campaignName,
  onComplete,
  size = "default",
  variant = "default",
  className = "",
  disabled = false
}: BulkFollowUpButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [pitchTypeFilter, setPitchTypeFilter] = useState("initial");
  const [limit, setLimit] = useState("50");
  const [results, setResults] = useState<BulkFollowUpResult | null>(null);
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseAI, isFreePlan, isAdmin, isStaff } = usePitchCapabilities();

  const pitchTypeOptions = [
    {
      value: "initial",
      label: "Initial Pitches",
      nextType: "follow_up_1",
      description: "Generate first follow-ups for all initial pitches"
    },
    {
      value: "follow_up_1",
      label: "First Follow-ups",
      nextType: "follow_up_2",
      description: "Generate second follow-ups"
    },
    {
      value: "follow_up_2",
      label: "Second Follow-ups",
      nextType: "follow_up_3",
      description: "Generate third follow-ups"
    },
    {
      value: "follow_up_3",
      label: "Third Follow-ups",
      nextType: "follow_up_4",
      description: "Generate final follow-ups"
    }
  ];

  const handleBulkGenerate = async () => {
    if (!canUseAI) {
      toast({
        title: "Upgrade Required",
        description: "Bulk follow-up generation is available for paid plan users.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        pitch_type_filter: pitchTypeFilter,
        limit: limit
      });

      const response = await apiRequest(
        "POST",
        `/pitches/campaign/${campaignId}/generate-followups-bulk?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate bulk follow-ups" }));
        throw new Error(errorData.detail);
      }

      const result: BulkFollowUpResult = await response.json();
      setResults(result);

      const successCount = result.results.successful.length;
      const failedCount = result.results.failed.length;
      const skippedCount = result.results.skipped.length;

      toast({
        title: "Bulk Generation Complete!",
        description: `Generated: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      // Refresh pitch data
      queryClient.invalidateQueries({ queryKey: ["/pitches"] });
      queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      queryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });

      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });

      if (onComplete) {
        onComplete(result);
      }

      // Keep dialog open to show results
      setProgress(100);
    } catch (error: any) {
      toast({
        title: "Bulk Generation Failed",
        description: error.message || "Failed to generate bulk follow-ups. Please try again.",
        variant: "destructive",
      });
      setShowBulkDialog(false);
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
            title: "Paid Feature",
            description: "Upgrade to a paid plan to unlock bulk follow-up generation",
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
        Bulk Follow-ups (Paid Plan)
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={`${className} ${variant === 'default' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white' : ''}`}
        onClick={() => setShowBulkDialog(true)}
        disabled={disabled || isGenerating}
      >
        <Users className="h-4 w-4 mr-2" />
        Bulk Generate Follow-ups
      </Button>

      {/* Bulk Generation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Bulk Generate Follow-ups
            </DialogTitle>
            <DialogDescription>
              Generate follow-ups for multiple matches in {campaignName || "this campaign"} at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Pitch Type Selection */}
            <div className="space-y-2">
              <Label>Select Pitch Type to Process</Label>
              <Select value={pitchTypeFilter} onValueChange={setPitchTypeFilter} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pitch type" />
                </SelectTrigger>
                <SelectContent>
                  {pitchTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Will generate <strong>{pitchTypeOptions.find(o => o.value === pitchTypeFilter)?.nextType}</strong> follow-ups
              </p>
            </div>

            {/* Limit Selection */}
            <div className="space-y-2">
              <Label>Maximum Number to Generate</Label>
              <Select value={limit} onValueChange={setLimit} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 follow-ups</SelectItem>
                  <SelectItem value="25">25 follow-ups</SelectItem>
                  <SelectItem value="50">50 follow-ups (recommended)</SelectItem>
                  <SelectItem value="100">100 follow-ups (maximum)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                {isAdmin || isStaff ? (
                  <>Admin templates will be automatically used for all generated follow-ups.</>
                ) : (
                  <>The system will automatically select the best template for each follow-up based on the sequence.</>
                )}
              </AlertDescription>
            </Alert>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Generating follow-ups...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Results Display */}
            {results && !isGenerating && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">Generation Results</h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{results.results.successful.length}</p>
                      <p className="text-xs text-gray-500">Successful</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{results.results.failed.length}</p>
                      <p className="text-xs text-gray-500">Failed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <SkipForward className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-2xl font-bold">{results.results.skipped.length}</p>
                      <p className="text-xs text-gray-500">Skipped</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                {(results.results.failed.length > 0 || results.results.skipped.length > 0) && (
                  <ScrollArea className="h-[150px] border rounded p-2">
                    {results.results.failed.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-red-600 mb-1">Failed:</p>
                        {results.results.failed.map((item, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            Match {item.match_id}: {item.error}
                          </p>
                        ))}
                      </div>
                    )}

                    {results.results.skipped.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-amber-600 mb-1">Skipped:</p>
                        {results.results.skipped.map((item, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            Match {item.match_id}: {item.reason}
                          </p>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkDialog(false);
                setResults(null);
              }}
              disabled={isGenerating}
            >
              {results ? "Close" : "Cancel"}
            </Button>
            {!results && (
              <Button
                onClick={handleBulkGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Bulk Generation
                  </>
                )}
              </Button>
            )}
            {results && results.results.successful.length > 0 && (
              <Button
                onClick={() => {
                  setShowBulkDialog(false);
                  setResults(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                View Generated Follow-ups
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}