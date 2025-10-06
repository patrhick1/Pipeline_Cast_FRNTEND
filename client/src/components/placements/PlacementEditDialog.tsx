import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Link, MessageSquare, AlertCircle, Save, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DateTimePicker } from "@/components/DateTimePicker";
import { statusConfig, type PlacementStatus } from "@/constants/placementStatus";
import { fromAPIDateTime, formatDateTime } from "@/lib/timezone";

interface Placement {
  placement_id: number;
  campaign_id: string;
  media_id: number;
  current_status?: string | null;
  status_ts?: string | null;
  meeting_date?: string | null; // ISO 8601 DateTime string
  call_date?: string | null; // ISO 8601 DateTime string
  recording_date?: string | null; // ISO 8601 DateTime string
  go_live_date?: string | null; // ISO 8601 DateTime string
  follow_up_date?: string | null; // ISO 8601 DateTime string - NEW
  outreach_topic?: string | null;
  episode_link?: string | null;
  notes?: string | null;
  pitch_id?: number | null;
  created_at: string;
  // Enriched fields
  campaign_name?: string | null;
  client_name?: string | null;
  media_name?: string | null;
  media_website?: string | null;
}

interface PlacementEditDialogProps {
  placement: Placement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userRole?: string | null;
}

// Status options come from statusConfig constant

export const PlacementEditDialog: React.FC<PlacementEditDialogProps> = ({
  placement,
  open,
  onOpenChange,
  onSuccess,
  userRole
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    current_status: placement.current_status || 'pending',
    meeting_date: placement.meeting_date || null,
    call_date: placement.call_date || null,
    recording_date: placement.recording_date || null,
    go_live_date: placement.go_live_date || null,
    follow_up_date: placement.follow_up_date || null, // NEW
    episode_link: placement.episode_link || '',
    outreach_topic: placement.outreach_topic || '',
    notes: placement.notes || ''
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when placement changes
  useEffect(() => {
    if (placement && open) {
      setFormData({
        current_status: placement.current_status || 'pending',
        meeting_date: placement.meeting_date || null,
        call_date: placement.call_date || null,
        recording_date: placement.recording_date || null,
        go_live_date: placement.go_live_date || null,
        follow_up_date: placement.follow_up_date || null,
        episode_link: placement.episode_link || '',
        outreach_topic: placement.outreach_topic || '',
        notes: placement.notes || ''
      });
      setHasChanges(false);
    }
  }, [placement, open]);

  // Track changes
  useEffect(() => {
    const originalData = {
      current_status: placement.current_status || 'pending',
      meeting_date: placement.meeting_date || null,
      call_date: placement.call_date || null,
      recording_date: placement.recording_date || null,
      go_live_date: placement.go_live_date || null,
      follow_up_date: placement.follow_up_date || null,
      episode_link: placement.episode_link || '',
      outreach_topic: placement.outreach_topic || '',
      notes: placement.notes || ''
    };

    const changed = Object.keys(formData).some(
      key => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
    );
    setHasChanges(changed);
  }, [formData, placement]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Only send changed fields
      const changedFields: any = {};
      const originalData = {
        current_status: placement.current_status || 'pending',
        meeting_date: placement.meeting_date || null,
        call_date: placement.call_date || null,
        recording_date: placement.recording_date || null,
        go_live_date: placement.go_live_date || null,
        follow_up_date: placement.follow_up_date || null,
        episode_link: placement.episode_link || '',
        outreach_topic: placement.outreach_topic || '',
        notes: placement.notes || ''
      };

      Object.keys(data).forEach(key => {
        if (data[key] !== originalData[key as keyof typeof originalData]) {
          // DateTime fields are already in ISO 8601 format from DateTimePicker
          // Just send them directly (or null if empty)
          changedFields[key] = data[key] || null;
        }
      });

      const response = await apiRequest('PATCH', `/placements/${placement.placement_id}`, changedFields);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to edit this placement");
        }
        const error = await response.json().catch(() => ({ detail: 'Failed to update placement' }));
        throw new Error(error.detail || 'Failed to update placement');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Placement updated successfully"
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/placements/'] });
      queryClient.invalidateQueries({ queryKey: ['/placements/my-placements'] });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update placement",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate date sequence logic
    const meetingDate = fromAPIDateTime(formData.meeting_date);
    const recordingDate = fromAPIDateTime(formData.recording_date);
    const goLiveDate = fromAPIDateTime(formData.go_live_date);

    if (recordingDate && meetingDate) {
      if (recordingDate < meetingDate) {
        toast({
          title: "Invalid dates",
          description: "Recording date cannot be before meeting date",
          variant: "destructive"
        });
        return;
      }
    }

    if (goLiveDate && recordingDate) {
      if (goLiveDate < recordingDate) {
        toast({
          title: "Invalid dates",
          description: "Go live date cannot be before recording date",
          variant: "destructive"
        });
        return;
      }
    }

    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateTimeChange = (field: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get current status config for display
  const currentStatusKey = formData.current_status as PlacementStatus;
  const currentStatusConfig = statusConfig[currentStatusKey] || statusConfig.pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Placement Details</DialogTitle>
          <DialogDescription>
            Update the status and details for {placement.media_name || 'this placement'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign and Media Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Campaign</Label>
                <p className="font-medium">{placement.campaign_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Podcast</Label>
                <p className="font-medium">{placement.media_name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Current Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.current_status}
              onValueChange={(value) => handleInputChange('current_status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig)
                  .filter(([key]) => key !== 'default')
                  .map(([value, config]) => {
                    const StatusIcon = config.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              Current:
              <span className={`${currentStatusConfig.color} px-2 py-0.5 rounded text-xs font-medium`}>
                {currentStatusConfig.label}
              </span>
            </p>
          </div>

          {/* DateTime Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimePicker
              label="Meeting Date"
              value={formData.meeting_date}
              onChange={(value) => handleDateTimeChange('meeting_date', value)}
              helpText="Pre-interview or prep call"
              placeholder="Select meeting date and time"
            />

            <DateTimePicker
              label="Follow-up Date"
              value={formData.follow_up_date}
              onChange={(value) => handleDateTimeChange('follow_up_date', value)}
              helpText="When to check in about status"
              placeholder="Select follow-up date and time"
            />

            <DateTimePicker
              label="Call Date"
              value={formData.call_date}
              onChange={(value) => handleDateTimeChange('call_date', value)}
              helpText="Separate call if needed"
              placeholder="Select call date and time"
            />

            <DateTimePicker
              label="Recording Date"
              value={formData.recording_date}
              onChange={(value) => handleDateTimeChange('recording_date', value)}
              helpText="Actual podcast recording"
              placeholder="Select recording date and time"
            />

            <DateTimePicker
              label="Go Live Date"
              value={formData.go_live_date}
              onChange={(value) => handleDateTimeChange('go_live_date', value)}
              helpText="Episode publication date"
              placeholder="Select go live date and time"
            />
          </div>

          {/* Episode Link */}
          <div className="space-y-2">
            <Label htmlFor="episode_link">
              <Link className="inline w-4 h-4 mr-1" />
              Episode Link
            </Label>
            <Input
              id="episode_link"
              type="url"
              placeholder="https://..."
              value={formData.episode_link}
              onChange={(e) => handleInputChange('episode_link', e.target.value)}
            />
            {formData.episode_link && (
              <a
                href={formData.episode_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Open episode in new tab →
              </a>
            )}
          </div>

          {/* Outreach Topic */}
          <div className="space-y-2">
            <Label htmlFor="outreach_topic">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Outreach Topic
            </Label>
            <Input
              id="outreach_topic"
              placeholder="What topic will be discussed?"
              value={formData.outreach_topic}
              onChange={(e) => handleInputChange('outreach_topic', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All changes are tracked in the placement history. Providing dates and notes helps track progress effectively.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};