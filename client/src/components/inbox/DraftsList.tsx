import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { draftsApi, adminDraftsApi, type Draft } from '@/services/drafts';
import { FileText, Send, Trash2, Calendar, Clock, Edit, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextEditor from '@/components/inbox/RichTextEditor';

interface DraftsListProps {
  isAdminInbox?: boolean;
  adminAccountId?: number;
  onDraftClick?: (draft: Draft) => void;
}

export function DraftsList({ isAdminInbox = false, adminAccountId }: DraftsListProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled'>('all');
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [editForm, setEditForm] = useState({
    to: [] as string[],
    subject: '',
    body: '',
  });

  // Fetch drafts
  const { data: draftsData, isLoading } = useQuery({
    queryKey: isAdminInbox ? ['admin-drafts', adminAccountId] : ['drafts'],
    queryFn: async () => {
      if (isAdminInbox && adminAccountId) {
        return adminDraftsApi.listDrafts(adminAccountId, 100, 0);
      } else {
        return draftsApi.listDrafts(100, 0);
      }
    },
    enabled: !isAdminInbox || !!adminAccountId,
  });

  // Delete draft mutation
  const deleteMutation = useMutation({
    mutationFn: async (draftId: number) => {
      if (isAdminInbox && adminAccountId) {
        return adminDraftsApi.deleteDraft(adminAccountId, draftId);
      } else {
        return draftsApi.deleteDraft(draftId);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Draft Deleted',
        description: 'Draft has been deleted successfully',
      });
      queryClient.invalidateQueries({
        queryKey: isAdminInbox ? ['admin-drafts', adminAccountId] : ['drafts'],
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete draft',
        variant: 'destructive',
      });
    },
  });

  // Send draft mutation
  const sendMutation = useMutation({
    mutationFn: async (draftId: number) => {
      if (isAdminInbox && adminAccountId) {
        return adminDraftsApi.sendDraft(adminAccountId, draftId);
      } else {
        return draftsApi.sendDraft(draftId);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Draft Sent',
        description: 'Your email has been sent successfully',
      });
      queryClient.invalidateQueries({
        queryKey: isAdminInbox ? ['admin-drafts', adminAccountId] : ['drafts'],
      });
      queryClient.invalidateQueries({
        queryKey: isAdminInbox ? ['admin-threads'] : ['/inbox/threads'],
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send draft',
        variant: 'destructive',
      });
    },
  });

  // Update draft mutation
  const updateMutation = useMutation({
    mutationFn: async ({ draftId, updates }: { draftId: number; updates: any }) => {
      if (isAdminInbox && adminAccountId) {
        return adminDraftsApi.updateDraft(adminAccountId, draftId, updates);
      } else {
        return draftsApi.updateDraft(draftId, updates);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Draft Updated',
        description: 'Your changes have been saved',
      });
      queryClient.invalidateQueries({
        queryKey: isAdminInbox ? ['admin-drafts', adminAccountId] : ['drafts'],
      });
      setEditingDraft(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update draft',
        variant: 'destructive',
      });
    },
  });

  const handleDraftClick = (draft: Draft) => {
    if (draft.thread_id) {
      // Navigate to thread to edit draft
      if (isAdminInbox) {
        setLocation(`/admin-inbox?thread=${draft.thread_id}`);
      } else {
        setLocation(`/inbox?thread=${draft.thread_id}`);
      }
    } else {
      // Open editor modal for drafts without thread_id
      setEditingDraft(draft);
      setEditForm({
        to: draft.to || [],
        subject: draft.subject || '',
        body: draft.body || '',
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editingDraft) return;

    updateMutation.mutate({
      draftId: editingDraft.draft_id,
      updates: {
        to: editForm.to,
        subject: editForm.subject,
        body: editForm.body,
      },
    });
  };

  const handleToEmailsChange = (value: string) => {
    // Split by comma or semicolon and trim
    const emails = value.split(/[,;]/).map(e => e.trim()).filter(e => e);
    setEditForm({ ...editForm, to: emails });
  };

  const handleDeleteDraft = async (e: React.MouseEvent, draftId: number) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this draft?')) {
      deleteMutation.mutate(draftId);
    }
  };

  const handleSendDraft = async (e: React.MouseEvent, draftId: number) => {
    e.stopPropagation();
    if (window.confirm('Send this draft now?')) {
      sendMutation.mutate(draftId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const drafts = draftsData?.drafts || [];
  const filteredDrafts = drafts.filter((draft) => {
    if (filter === 'all') return true;
    if (filter === 'draft') return draft.status === 'draft';
    if (filter === 'scheduled') return draft.status === 'scheduled';
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Drafts ({drafts.length})</h2>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('draft')}
            >
              Drafts
            </Button>
            <Button
              variant={filter === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('scheduled')}
            >
              Scheduled
            </Button>
          </div>
        </div>
      </div>

      {/* Drafts list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts yet</h3>
            <p className="text-sm text-gray-500">
              {filter === 'scheduled'
                ? 'You have no scheduled emails'
                : 'Start typing a reply and it will auto-save as a draft'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrafts.map((draft) => (
              <Card
                key={draft.draft_id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleDraftClick(draft)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {draft.subject || '(No subject)'}
                        </h3>
                        {draft.status === 'scheduled' && (
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        To: {draft.to.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Snippet */}
                  <div
                    className="text-sm text-gray-700 mb-3 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: draft.snippet || draft.body.substring(0, 150),
                    }}
                  />

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(draft.last_edited_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {draft.status === 'scheduled' && draft.scheduled_send_at && (
                        <span className="flex items-center gap-1 text-blue-600">
                          📅 {new Date(draft.scheduled_send_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleSendDraft(e, draft.draft_id)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send Now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteDraft(e, draft.draft_id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Draft Editor Modal */}
      <Dialog open={!!editingDraft} onOpenChange={(open) => !open && setEditingDraft(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* To field */}
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                placeholder="recipient@example.com, another@example.com"
                value={editForm.to.join(', ')}
                onChange={(e) => handleToEmailsChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">Separate multiple emails with commas</p>
            </div>

            {/* Subject field */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              />
            </div>

            {/* Body field */}
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <RichTextEditor
                value={editForm.body}
                onChange={(value) => setEditForm({ ...editForm, body: value })}
                placeholder="Type your message..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditingDraft(null)}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending || !editForm.to.length}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={() => {
                    if (editingDraft) {
                      handleSendDraft(
                        { stopPropagation: () => {} } as React.MouseEvent,
                        editingDraft.draft_id
                      );
                    }
                  }}
                  disabled={sendMutation.isPending || !editForm.to.length}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMutation.isPending ? 'Sending...' : 'Send Now'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
