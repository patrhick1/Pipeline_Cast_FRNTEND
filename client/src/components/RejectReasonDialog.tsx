import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsDown, AlertCircle } from "lucide-react";

interface RejectReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
  title?: string;
  mediaName?: string;
}

// Predefined rejection reasons for better UX
const commonRejectReasons = [
  "Not relevant to our target audience",
  "Podcast is inactive/no recent episodes",
  "Content doesn't align with our brand values",
  "Audience size too small",
  "Geographic mismatch",
  "Already contacted this podcast",
  "Poor content quality",
  "Host doesn't fit our target demographic",
  "Topics covered are too broad/unfocused",
  "Engagement levels too low",
  "Other (specify below)"
];

export const RejectReasonDialog: React.FC<RejectReasonDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Reject Match",
  mediaName
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const handleConfirm = () => {
    // Combine selected reason with custom text if "Other" was selected
    const finalReason = selectedReason === 'Other (specify below)'
      ? customReason
      : selectedReason || customReason;

    onConfirm(finalReason || undefined);
    // Reset state
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            {title} {mediaName && `: ${mediaName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Why are you rejecting this match? (Optional)
            </Label>
            
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {commonRejectReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label 
                    htmlFor={reason} 
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom reason text area (shown when "Other" is selected) */}
          {selectedReason === 'Other (specify below)' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Please specify your reason:
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Enter your specific reason for rejection..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {customReason.length}/500 characters
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              <strong>💡 Tip:</strong> Providing a reason helps improve future match suggestions and gives valuable feedback to the team.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || (selectedReason === 'Other (specify below)' && !customReason.trim())}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};