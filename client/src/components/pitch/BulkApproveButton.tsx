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
  CheckCircle2,
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkApproveResult {
  message: string;
  total: number;
  successful_count: number;
  failed_count: number;
  successful_ids: number[];
  failed_ids: number[];
  details: Record<string, {
    status: "success" | "error";
    message: string;
  }>;
}

interface BulkApproveButtonProps {
  pitchGenIds: number[];
  onComplete?: (results: BulkApproveResult) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
}

export function BulkApproveButton({
  pitchGenIds,
  onComplete,
  size = "default",
  variant = "default",
  className = "",
  disabled = false
}: BulkApproveButtonProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [results, setResults] = useState<BulkApproveResult | null>(null);
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isPaidPlan, isAdmin, isStaff, isFreePlan } = usePitchCapabilities();

  const handleBulkApprove = async () => {
    if (pitchGenIds.length === 0) {
      toast({
        title: "No Pitches Selected",
        description: "Please select at least one pitch to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    setProgress(0);
    setResults(null);

    try {
      const response = await apiRequest(
        "POST",
        "/pitches/generations/bulk-approve",
        {
          pitch_gen_ids: pitchGenIds,
          notes: `Bulk approval of ${pitchGenIds.length} pitch${pitchGenIds.length !== 1 ? 'es' : ''}`
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to approve pitches"
        }));
        throw new Error(errorData.detail);
      }

      const result: BulkApproveResult = await response.json();
      setResults(result);

      const { successful_count, failed_count } = result;

      toast({
        title: "Bulk Approval Complete!",
        description: `Approved: ${successful_count}, Failed: ${failed_count}`,
        variant: successful_count > 0 ? "default" : "destructive",
      });

      // Refresh pitch data
      queryClient.invalidateQueries({ queryKey: ["/pitches"] });
      queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      queryClient.invalidateQueries({ queryKey: ["pitchDraftsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });

      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ["pitchDraftsForReview"] });
      queryClient.refetchQueries({ queryKey: ["pitchesReadyToSend"] });

      if (onComplete) {
        onComplete(result);
      }

      setProgress(100);
    } catch (error: any) {
      toast({
        title: "Bulk Approval Failed",
        description: error.message || "Failed to approve pitches. Please try again.",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
    } finally {
      setIsApproving(false);
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
            description: "Upgrade to a paid plan to unlock bulk approval",
            action: (
              <Button
                size="sm"
                onClick={() => window.open('https://calendly.com/paschal-pipelinecast/30min', '_blank')}
              >
                Book Demo
              </Button>
            )
          });
        }}
      >
        <Lock className="h-4 w-4 mr-2 text-amber-600" />
        Bulk Approve (Premium)
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={`${className} ${variant === 'default' ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' : ''}`}
        onClick={() => setShowConfirmDialog(true)}
        disabled={disabled || isApproving || pitchGenIds.length === 0}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Bulk Approve ({pitchGenIds.length})
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Bulk Approve Pitches
            </DialogTitle>
            <DialogDescription>
              You're about to approve {pitchGenIds.length} pitch{pitchGenIds.length !== 1 ? 'es' : ''}.
              They will be moved to "Ready to Send" status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                {isAdmin || isStaff ? (
                  <>All approved pitches will be marked as ready to send and can be sent immediately.</>
                ) : (
                  <>This will approve the entire sequence including initial pitches and all follow-ups.</>
                )}
              </AlertDescription>
            </Alert>

            {/* Progress Bar */}
            {isApproving && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Approving pitches...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Results Display */}
            {results && !isApproving && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">Approval Results</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{results.successful_count}</p>
                      <p className="text-xs text-gray-500">Approved</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{results.failed_count}</p>
                      <p className="text-xs text-gray-500">Failed</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                {results.failed_count > 0 && (
                  <ScrollArea className="h-[150px] border rounded p-2">
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Failed Approvals:</p>
                      {results.failed_ids.map((pitchGenId) => (
                        <p key={pitchGenId} className="text-xs text-gray-600">
                          Pitch {pitchGenId}: {results.details[pitchGenId]?.message || "Unknown error"}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setResults(null);
              }}
              disabled={isApproving}
            >
              {results ? "Close" : "Cancel"}
            </Button>
            {!results && (
              <Button
                onClick={handleBulkApprove}
                disabled={isApproving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve All {pitchGenIds.length} Pitches
                  </>
                )}
              </Button>
            )}
            {results && results.successful_count > 0 && (
              <Button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setResults(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                View Ready to Send
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
