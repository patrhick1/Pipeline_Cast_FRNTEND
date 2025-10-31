import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/inbox/RichTextEditor';
import {
  Check,
  X,
  Edit3,
  Send,
  Clock,
  User,
  Sparkles,
  ChevronRight,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  Mail,
  Calendar,
  Hash,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { AIGenerateFollowUpButton } from '@/components/pitch/AIGenerateFollowUpButton';

interface PitchDraft {
  review_task_id: number;
  pitch_gen_id: number;
  campaign_id: string;
  media_id: number;
  match_id?: number | null;
  parent_pitch_gen_id?: number | null;
  draft_text: string;
  subject_line?: string | null;
  media_name?: string | null;
  campaign_name?: string | null;
  client_name?: string | null;
  media_website?: string | null;
  status?: string;
  sequence_number?: number | null;
  pitch_type?: string | null;
  created_at?: string;
}

interface ModernPitchReviewProps {
  drafts: PitchDraft[];
  onApprove: (pitchGenId: number) => void;
  onEdit: (draft: PitchDraft) => void;
  onBatchAction?: (action: 'approve' | 'delete', draftIds: number[]) => void;
  onFollowUpGenerated?: () => void;
  isLoading?: boolean;
  isProcessing?: boolean;
  canUseAI?: boolean;
}

export function ModernPitchReview({
  drafts,
  onApprove,
  onEdit,
  onBatchAction,
  onFollowUpGenerated,
  isLoading = false,
  isProcessing = false,
  canUseAI = false,
}: ModernPitchReviewProps) {
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'subject' | 'body' | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const { toast } = useToast();

  // Group drafts by campaign and media
  const groupedDrafts = useMemo(() => {
    const groups = new Map<string, PitchDraft[]>();

    drafts.forEach(draft => {
      const key = `${draft.campaign_id}_${draft.media_id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(draft);
    });

    // Sort drafts within each group
    groups.forEach(group => {
      group.sort((a, b) => {
        if (a.sequence_number && b.sequence_number) {
          return a.sequence_number - b.sequence_number;
        }
        const getTypeOrder = (type?: string | null) => {
          if (!type || type === 'initial') return 0;
          const match = type.match(/follow_up_(\d+)/);
          return match ? parseInt(match[1]) : 999;
        };
        return getTypeOrder(a.pitch_type) - getTypeOrder(b.pitch_type);
      });
    });

    return Array.from(groups.entries());
  }, [drafts]);

  // Filter drafts based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedDrafts;

    return groupedDrafts.filter(([_, pitches]) =>
      pitches.some(pitch =>
        pitch.media_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pitch.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pitch.subject_line?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pitch.draft_text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [groupedDrafts, searchQuery]);

  // Select first draft by default
  useEffect(() => {
    if (!selectedGroupKey && filteredGroups.length > 0) {
      const firstGroup = filteredGroups[0][1];
      if (firstGroup.length > 0) {
        setSelectedGroupKey(filteredGroups[0][0]);
      }
    }
  }, [filteredGroups, selectedGroupKey]);

  // Get all drafts for the selected group
  const selectedGroupDrafts = selectedGroupKey
    ? (groupedDrafts.find(([key]) => key === selectedGroupKey)?.[1] || [])
    : [];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingField) return; // Don't navigate while editing

      const currentIndex = filteredGroups.findIndex(([key]) => key === selectedGroupKey);

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (currentIndex < filteredGroups.length - 1) {
          setSelectedGroupKey(filteredGroups[currentIndex + 1][0]);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedGroupKey(filteredGroups[currentIndex - 1][0]);
        }
      } else if (e.key === 'Enter' && e.ctrlKey && selectedGroupDrafts.length > 0) {
        e.preventDefault();
        // Approve all in the group
        selectedGroupDrafts.forEach(draft => onApprove(draft.pitch_gen_id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGroupKey, filteredGroups, editingField, selectedGroupDrafts, onApprove]);

  const handleStartEdit = (draftId: number, field: 'subject' | 'body') => {
    const draft = drafts.find(d => d.pitch_gen_id === draftId);
    if (!draft) return;

    setEditingDraftId(draftId);
    if (field === 'subject') {
      setEditedSubject(draft.subject_line || '');
    } else {
      // Convert plain text line breaks to HTML if the text doesn't already contain HTML tags
      let bodyText = draft.draft_text;
      const hasHtmlTags = /<[^>]+>/.test(bodyText);
      if (!hasHtmlTags && bodyText) {
        // Plain text - convert \n to <br>
        bodyText = bodyText.replace(/\n/g, '<br>');
      }
      setEditedBody(bodyText);
    }
    setEditingField(field);
  };

  const handleSaveEdit = () => {
    const editingDraft = drafts.find(d => d.pitch_gen_id === editingDraftId);
    if (!editingDraft || !editingField) return;

    // Create updated draft with edited content
    const updatedDraft = {
      ...editingDraft,
      subject_line: editingField === 'subject' ? editedSubject : editingDraft.subject_line,
      draft_text: editingField === 'body' ? editedBody : editingDraft.draft_text,
    };

    onEdit(updatedDraft);
    setEditingField(null);
    setEditingDraftId(null);

    toast({
      title: "Changes saved",
      description: "Your edits have been saved successfully.",
    });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingDraftId(null);
    setEditedSubject('');
    setEditedBody('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  const getPitchTypeLabel = (type?: string | null) => {
    if (!type || type === 'initial') return 'Initial Pitch';
    if (type.startsWith('follow_up_')) {
      const num = type.replace('follow_up_', '');
      return `Follow-up #${num}`;
    }
    return 'Pitch';
  };

  const getPitchTypeColor = (type?: string | null) => {
    if (!type || type === 'initial') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  // Helper to convert plain text to HTML for display
  const formatTextForDisplay = (text: string) => {
    if (!text) return 'Click to add email content...';
    // Check if text already contains HTML tags
    const hasHtmlTags = /<[^>]+>/.test(text);
    if (hasHtmlTags) {
      return text;
    }
    // Plain text - convert \n to <br>
    return text.replace(/\n/g, '<br>');
  };

  if (isLoading && drafts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading drafts...</p>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No drafts to review</h3>
          <p className="text-gray-500">Drafts will appear here when they're ready for review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-14rem)] flex bg-gradient-to-br from-gray-50/50 to-white rounded-xl overflow-hidden border border-gray-200">
      {/* Left Sidebar - Draft List */}
      <div className="w-[450px] flex flex-col bg-white border-r border-gray-200">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search pitches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-gray-50/70 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Draft List - Only Show Initial Pitches */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredGroups.map(([groupKey, groupPitches]) => {
              const initialPitch = groupPitches[0]; // Always the initial pitch
              const followUpCount = groupPitches.length - 1;
              const isSelected = selectedGroupKey === groupKey;
              const hasApprovedPitches = groupPitches.some(p => p.status === 'approved');

              return (
                <div
                  key={groupKey}
                  onClick={() => setSelectedGroupKey(groupKey)}
                  className={cn(
                    "p-5 rounded-xl cursor-pointer transition-all",
                    "hover:shadow-md hover:scale-[1.01]",
                    isSelected
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 border-l-4 border-l-blue-500 shadow-md"
                      : "bg-gray-50/50 hover:bg-white border border-gray-200/50"
                  )}
                >
                  {/* Media Name - Most Prominent */}
                  <h4 className="font-semibold text-base text-gray-900 mb-2 leading-tight">
                    {initialPitch.media_name || 'Untitled Podcast'}
                  </h4>

                  {/* Subject Preview from Initial Pitch */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {initialPitch.subject_line || 'Add a subject line...'}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Sequence Count Badge */}
                      {followUpCount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {followUpCount + 1} emails
                        </Badge>
                      )}
                      {/* Status Indicator */}
                      {hasApprovedPitches && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                          Ready
                        </Badge>
                      )}
                    </div>
                    {isProcessing && isSelected && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Pane - Full Conversation Thread */}
      {selectedGroupDrafts.length > 0 ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Thread Header */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedGroupDrafts[0].media_name || 'Untitled Podcast'}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <Badge className="px-3 py-1 bg-indigo-100 text-indigo-700 border-indigo-200">
                    {selectedGroupDrafts.length} {selectedGroupDrafts.length === 1 ? 'Email' : 'Email Sequence'}
                  </Badge>
                  {selectedGroupDrafts[0].client_name && (
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {selectedGroupDrafts[0].client_name}
                    </span>
                  )}
                  {selectedGroupDrafts[0].media_website && (
                    <a
                      href={selectedGroupDrafts[0].media_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {canUseAI && selectedGroupDrafts[0].match_id && (
                  <AIGenerateFollowUpButton
                    matchId={selectedGroupDrafts[0].match_id}
                    mediaName={selectedGroupDrafts[0].media_name || undefined}
                    onSuccess={() => onFollowUpGenerated?.()}
                    size="default"
                    variant="outline"
                    className="border-gray-300"
                  />
                )}

                <Button
                  onClick={() => {
                    // Approve all drafts in the sequence
                    selectedGroupDrafts.forEach(draft => onApprove(draft.pitch_gen_id));
                  }}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-sm px-6"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve All ({selectedGroupDrafts.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Email Thread */}
          <ScrollArea className="flex-1 bg-gradient-to-b from-gray-50/30 to-white">
            <div className="px-8 py-8 max-w-4xl mx-auto space-y-6">
              {/* Render each email in the sequence */}
              {selectedGroupDrafts.map((draft, index) => {
                const isEditingThis = editingDraftId === draft.pitch_gen_id;
                const sequenceLabel = draft.pitch_type === 'initial' ? 'Initial Pitch' :
                                     draft.pitch_type?.startsWith('follow_up_') ?
                                       `Follow-up #${draft.pitch_type.replace('follow_up_', '')}` :
                                       `Sequence #${draft.sequence_number || (index + 1)}`;

                return (
                  <div
                    key={draft.pitch_gen_id}
                    className={cn(
                      "rounded-xl border p-6",
                      index === 0
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-sky-200 bg-sky-50/30 ml-6"
                    )}
                  >
                    {/* Email Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge
                          className={cn(
                            "mb-2",
                            draft.pitch_type === 'initial'
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-sky-100 text-sky-700 border-sky-200"
                          )}
                        >
                          {sequenceLabel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {draft.status === 'approved' && (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(draft.draft_text)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div className="mb-4">

                      {isEditingThis && editingField === 'subject' ? (
                  <div className="space-y-3">
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="text-lg font-semibold h-12 px-4 border-2 border-blue-200 focus:border-blue-400"
                      placeholder="Enter email subject line..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <div
                      className="text-lg font-semibold text-gray-900 px-5 py-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-text"
                      onClick={() => handleStartEdit(draft.pitch_gen_id, 'subject')}
                    >
                      {draft.subject_line || 'Click to add subject line...'}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(draft.pitch_gen_id, 'subject');
                      }}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                    </div>

                    {/* Email Body */}
                    <div>
                      {isEditingThis && editingField === 'body' ? (
                  <div className="space-y-3">
                    <RichTextEditor
                      value={editedBody}
                      onChange={setEditedBody}
                      placeholder="Write your email content here..."
                      minHeight="min-h-[500px]"
                      className="border-2 border-blue-200 focus:border-blue-400 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Save Changes
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <div
                      className="text-gray-700 text-[15px] leading-[1.85] p-6 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-text min-h-[500px]"
                      onClick={() => handleStartEdit(draft.pitch_gen_id, 'body')}
                      dangerouslySetInnerHTML={{ __html: formatTextForDisplay(draft.draft_text) }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(draft.pitch_gen_id, 'body');
                      }}
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Mail className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Select a podcast to review</h3>
            <p className="text-sm text-gray-500 max-w-sm">Choose a podcast from the list to view the full email sequence</p>
          </div>
        </div>
      )}
    </div>
  );
}