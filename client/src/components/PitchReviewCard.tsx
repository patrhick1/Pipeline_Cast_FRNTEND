import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown, Eye, Check, Globe, Twitter, Linkedin, Instagram, Facebook, Youtube, Edit, Save, X, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RejectReasonDialog } from "./RejectReasonDialog";
import type { ReviewTask } from "@/pages/Approvals";

interface PitchReviewCardProps {
  task: ReviewTask;
  onApprove: () => void;
  onReject: (rejectReason?: string) => void;
  isActionPending: boolean;
}

export const PitchReviewCard = ({ task, onApprove, onReject, isActionPending }: PitchReviewCardProps) => {
  const [showFullPitch, setShowFullPitch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [editedSubject, setEditedSubject] = useState(task.pitch_subject_line || '');
  const [editedBody, setEditedBody] = useState(task.pitch_body_full || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for editing pitch content
  const editPitchMutation = useMutation({
    mutationFn: async ({ subject, body }: { subject: string; body: string }) => {
      const response = await apiRequest("PATCH", `/pitches/generations/${task.pitch_gen_id}/content`, {
        draft_text: body,
        new_subject_line: subject
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update pitch" }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pitch updated successfully" });
      // Update the task data in the query cache
      queryClient.invalidateQueries({ queryKey: ["/review-tasks/enhanced"] });
      setIsEditing(false);
      // Update local state to reflect saved changes
      task.pitch_subject_line = editedSubject;
      task.pitch_body_full = editedBody;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pitch",
        variant: "destructive",
      });
    }
  });

  const handleSaveEdit = () => {
    editPitchMutation.mutate({ subject: editedSubject, body: editedBody });
  };

  const handleCancelEdit = () => {
    setEditedSubject(task.pitch_subject_line || '');
    setEditedBody(task.pitch_body_full || '');
    setIsEditing(false);
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = (reason?: string) => {
    onReject(reason);
    setShowRejectDialog(false);
  };

  // Get preview of pitch body (first 500 chars)
  const pitchPreview = task.pitch_body_full ? 
    task.pitch_body_full.substring(0, 500) : '';

  return (
    <>
      <div className="match-card bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header section with podcast image and info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-start gap-4">
          <a 
            href={task.media_website || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity cursor-pointer"
          >
            <img 
              src={task.media_image_url || '/default-podcast.png'} 
              alt={task.media_name || 'Podcast Cover'} 
              className="w-20 h-20 rounded-md object-cover border"
            />
          </a>
          <div className="podcast-info flex-1">
            <a 
              href={task.media_website || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              <h3 className="font-bold text-lg">{task.media_name || 'Media'}</h3>
            </a>
            <p className="text-sm text-gray-600">Host: {task.host_names?.join(', ') || 'N/A'}</p>
            <p className="text-sm text-gray-500">Campaign: {task.campaign_name || 'N/A'}</p>
            
            {/* Social Media Icons */}
            <div className="flex gap-2 mt-2">
              {task.media_website && (
                <a href={task.media_website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {task.podcast_twitter_url && (
                <a href={task.podcast_twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {task.podcast_linkedin_url && (
                <a href={task.podcast_linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {task.podcast_instagram_url && (
                <a href={task.podcast_instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {task.podcast_facebook_url && (
                <a href={task.podcast_facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {task.podcast_youtube_url && (
                <a href={task.podcast_youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-600">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Pitch Intelligence section */}
        <div className="match-intelligence p-4 space-y-4">
          <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">Pitch Intelligence</h4>
          
          {/* Subject Line */}
          {task.pitch_subject_line && (
            <div className="intelligence-item p-3 bg-blue-50 border border-blue-200 rounded-md">
              <strong className="flex items-center text-blue-800">
                <Check className="h-4 w-4 mr-2 text-blue-600"/> Subject Line
              </strong>
              <p className="text-xs text-blue-900 mt-1 pl-6">{task.pitch_subject_line}</p>
            </div>
          )}

          {/* Pitch Preview */}
          {pitchPreview && (
            <div className="intelligence-item p-3 bg-teal/5 border border-teal/20 rounded-md">
              <strong className="flex items-center text-teal">
                <Check className="h-4 w-4 mr-2 text-teal"/> Pitch Preview
              </strong>
              <p className="reasoning text-xs text-teal-900 italic mt-1 pl-6">
                "{pitchPreview}"
                {task.pitch_body_full && task.pitch_body_full.length > 500 && (
                  <span className="text-xs text-teal-700 not-italic">...truncated</span>
                )}
              </p>
            </div>
          )}

          {/* View/Edit Full Pitch Button */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullPitch(true)}
              className="flex-1 text-xs"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View Full Pitch
            </Button>
            {task.pitch_gen_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowFullPitch(true);
                  setIsEditing(true);
                }}
                className="flex-1 text-xs"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit Pitch
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="approval-actions p-4 bg-gray-50 border-t flex gap-3">
          {task.status === 'pending' ? (
            <>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={onApprove}
                disabled={isActionPending}
              >
                <ThumbsUp className="h-4 w-4 mr-2"/>
                Approve
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={handleRejectClick}
                disabled={isActionPending}
              >
                <ThumbsDown className="h-4 w-4 mr-2"/>
                Reject
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {task.status === 'approved' && (
                <Badge className="bg-green-100 text-green-700 py-2 px-4">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Approved
                </Badge>
              )}
              {task.status === 'rejected' && (
                <Badge className="bg-red-100 text-red-700 py-2 px-4">
                  <XCircle className="h-4 w-4 mr-2" />
                  Already Rejected
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Pitch Dialog */}
      <Dialog open={showFullPitch} onOpenChange={(open) => {
        setShowFullPitch(open);
        if (!open) {
          setIsEditing(false);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Pitch Content' : 'Full Pitch Content'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] w-full pr-4">
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="subject" className="text-sm font-semibold mb-1">Subject Line:</Label>
                    <Input
                      id="subject"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="mt-1"
                      placeholder="Enter subject line"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="body" className="text-sm font-semibold mb-1">Email Body:</Label>
                    <Textarea
                      id="body"
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      className="mt-1 min-h-[400px] font-mono text-sm"
                      placeholder="Enter email body"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Subject Line:</h4>
                    <p className="text-sm">{task.pitch_subject_line || 'No subject line'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Email Body:</h4>
                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                      {task.pitch_body_full || 'No content available'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            {isEditing ? (
              <div className="flex justify-end space-x-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={editPitchMutation.isPending}
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={editPitchMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(true);
                  }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullPitch(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowFullPitch(false);
                      onApprove();
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isActionPending}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                    Approve Pitch
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <RejectReasonDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleRejectConfirm}
        isLoading={isActionPending}
        title="Reject Pitch"
        mediaName={task.media_name}
      />
    </>
  );
};