import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIGeneratePitchButton } from "./AIGeneratePitchButton";
import { usePitchCapabilities } from "@/hooks/usePitchCapabilities";
import { 
  CheckCircle, 
  FileText, 
  Send,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

interface PostApprovalActionsProps {
  matchId: number;
  mediaName?: string;
  campaignName?: string;
  campaignId?: string;
  onPitchGenerated?: (pitchData: any) => void;
  className?: string;
}

export function PostApprovalActions({
  matchId,
  mediaName,
  campaignName,
  campaignId,
  onPitchGenerated,
  className = ""
}: PostApprovalActionsProps) {
  const [pitchGenerated, setPitchGenerated] = useState(false);
  const [generatedPitchId, setGeneratedPitchId] = useState<number | null>(null);
  const { canUseAI, isFreePlan } = usePitchCapabilities();
  const [, navigate] = useLocation();

  const handlePitchGenerated = (pitchData: any) => {
    setPitchGenerated(true);
    setGeneratedPitchId(pitchData.pitch_id || pitchData.pitch_gen_id);
    if (onPitchGenerated) {
      onPitchGenerated(pitchData);
    }
  };

  const handleNavigateToPitches = () => {
    navigate("/pitch-outreach");
  };

  const handleWriteManualPitch = () => {
    // Navigate to pitch outreach with the match ID
    navigate(`/pitch-outreach?match_id=${matchId}&tab=ready`);
  };

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-medium text-green-900">Match Approved!</h4>
              <p className="text-sm text-green-700 mt-1">
                {mediaName ? `${mediaName} has been approved.` : "This match has been approved."} 
                {" "}What would you like to do next?
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* AI Generate Pitch Button - For Paid Users */}
              {canUseAI ? (
                <>
                  {!pitchGenerated ? (
                    <AIGeneratePitchButton
                      matchId={matchId}
                      mediaName={mediaName}
                      campaignName={campaignName}
                      onSuccess={handlePitchGenerated}
                      size="sm"
                      variant="default"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pitch Generated
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNavigateToPitches}
                        className="border-green-600 text-green-700 hover:bg-green-100"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Go to Send
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* For Free Users - Show Manual Pitch Option */
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleWriteManualPitch}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Write Manual Pitch
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    onClick={() => window.open('https://calendly.com/gentoftech/catch-up-call3', '_blank')}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Book Demo
                  </Button>
                </div>
              )}

              {/* View All Pitches Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNavigateToPitches}
              >
                View All Pitches
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Free Plan Message */}
            {isFreePlan && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                <p className="text-xs text-amber-800">
                  💡 Upgrade to Premium to unlock AI pitch generation and save hours of manual writing.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}