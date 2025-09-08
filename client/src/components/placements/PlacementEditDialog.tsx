import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Link, MessageSquare, AlertCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { utcToLocal, localToUTC } from "@/lib/timezone";

interface Placement {
  placement_id: number;
  campaign_id: string;
  media_id: number;
  current_status?: string | null;
  status_ts?: string | null;
  meeting_date?: string | null;
  call_date?: string | null;
  outreach_topic?: string | null;
  recording_date?: string | null;
  go_live_date?: string | null;
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

// Status options with logical progression
const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'text-gray-600' },
  { value: 'responded', label: 'Responded', color: 'text-blue-600' },
  { value: 'interested', label: 'Interested', color: 'text-green-600' },
  { value: 'form_submitted', label: 'Form Submitted', color: 'text-purple-600' },
  { value: 'meeting_booked', label: 'Meeting Booked', color: 'text-indigo-600' },
  { value: 'recording_booked', label: 'Recording Booked', color: 'text-pink-600' },
  { value: 'recorded', label: 'Recorded', color: 'text-orange-600' },
  { value: 'live', label: 'Live', color: 'text-green-600' },
  { value: 'paid', label: 'Paid', color: 'text-emerald-600' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-600' }
];

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
    meeting_date: placement.meeting_date || '',
    call_date: placement.call_date || '',
    recording_date: placement.recording_date || '',
    go_live_date: placement.go_live_date || '',
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
        meeting_date: placement.meeting_date ? utcToLocal(placement.meeting_date)?.toISOString().split('T')[0] || '' : '',
        call_date: placement.call_date ? utcToLocal(placement.call_date)?.toISOString().split('T')[0] || '' : '',
        recording_date: placement.recording_date ? utcToLocal(placement.recording_date)?.toISOString().split('T')[0] || '' : '',
        go_live_date: placement.go_live_date ? utcToLocal(placement.go_live_date)?.toISOString().split('T')[0] || '' : '',
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
      meeting_date: placement.meeting_date ? utcToLocal(placement.meeting_date)?.toISOString().split('T')[0] || '' : '',
      call_date: placement.call_date ? utcToLocal(placement.call_date)?.toISOString().split('T')[0] || '' : '',
      recording_date: placement.recording_date ? utcToLocal(placement.recording_date)?.toISOString().split('T')[0] || '' : '',
      go_live_date: placement.go_live_date ? utcToLocal(placement.go_live_date)?.toISOString().split('T')[0] || '' : '',
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
        meeting_date: placement.meeting_date ? utcToLocal(placement.meeting_date)?.toISOString().split('T')[0] || '' : '',
        call_date: placement.call_date ? utcToLocal(placement.call_date)?.toISOString().split('T')[0] || '' : '',
        recording_date: placement.recording_date ? utcToLocal(placement.recording_date)?.toISOString().split('T')[0] || '' : '',
        go_live_date: placement.go_live_date ? utcToLocal(placement.go_live_date)?.toISOString().split('T')[0] || '' : '',
        episode_link: placement.episode_link || '',
        outreach_topic: placement.outreach_topic || '',
        notes: placement.notes || ''
      };

      Object.keys(data).forEach(key => {
        if (data[key] !== originalData[key as keyof typeof originalData]) {
          // Convert date fields to UTC before sending to backend
          if (['meeting_date', 'call_date', 'recording_date', 'go_live_date'].includes(key) && data[key]) {
            // Date input gives us YYYY-MM-DD, we need to convert to UTC ISO string
            const localDate = new Date(data[key] + 'T00:00:00');
            changedFields[key] = localToUTC(localDate);
          } else {
            changedFields[key] = data[key] || null;
          }
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
    
    // Validate dates logic
    if (formData.recording_date && formData.meeting_date) {
      if (new Date(formData.recording_date) < new Date(formData.meeting_date)) {
        toast({
          title: "Invalid dates",
          description: "Recording date cannot be before meeting date",
          variant: "destructive"
        });
        return;
      }
    }

    if (formData.go_live_date && formData.recording_date) {
      if (new Date(formData.go_live_date) < new Date(formData.recording_date)) {
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

  // Get current status config for display
  const currentStatusConfig = statusOptions.find(opt => opt.value === formData.current_status);

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
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Current: <span className={currentStatusConfig?.color}>{currentStatusConfig?.label}</span>
            </p>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_date">
                <Calendar className="inline w-4 h-4 mr-1" />
                Meeting Date
              </Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) => handleInputChange('meeting_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="call_date">
                <Clock className="inline w-4 h-4 mr-1" />
                Call Date
              </Label>
              <Input
                id="call_date"
                type="date"
                value={formData.call_date}
                onChange={(e) => handleInputChange('call_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording_date">
                <Clock className="inline w-4 h-4 mr-1" />
                Recording Date
              </Label>
              <Input
                id="recording_date"
                type="date"
                value={formData.recording_date}
                onChange={(e) => handleInputChange('recording_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="go_live_date">
                <Calendar className="inline w-4 h-4 mr-1" />
                Go Live Date
              </Label>
              <Input
                id="go_live_date"
                type="date"
                value={formData.go_live_date}
                onChange={(e) => handleInputChange('go_live_date', e.target.value)}
              />
            </div>
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