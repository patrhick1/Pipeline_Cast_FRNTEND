import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Save,
  X,
  Edit2,
  Check,
  Mail,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PitchDetails {
  id: string;
  podcastName: string;
  hostName: string;
  hostEmail: string;
  subject: string;
  body: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'sent';
  campaignName?: string;
}

interface PitchPreviewPaneProps {
  pitch: PitchDetails | null;
  onSave: (updates: Partial<PitchDetails>) => Promise<void>;
  onSend: () => Promise<void>;
  onApprove?: () => Promise<void>;
  isStaff?: boolean;
}

export function PitchPreviewPane({
  pitch,
  onSave,
  onSend,
  onApprove,
  isStaff = false,
}: PitchPreviewPaneProps) {
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!pitch) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Select a pitch to preview</p>
          <p className="text-sm mt-2">Choose from the list on the left</p>
        </div>
      </div>
    );
  }

  const handleStartEditSubject = () => {
    setEditedSubject(pitch.subject);
    setIsEditingSubject(true);
  };

  const handleStartEditBody = () => {
    setEditedBody(pitch.body);
    setIsEditingBody(true);
  };

  const handleSaveSubject = async () => {
    if (editedSubject.trim() && editedSubject !== pitch.subject) {
      setIsSaving(true);
      try {
        await onSave({ subject: editedSubject });
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditingSubject(false);
  };

  const handleSaveBody = async () => {
    if (editedBody.trim() && editedBody !== pitch.body) {
      setIsSaving(true);
      try {
        await onSave({ body: editedBody });
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditingBody(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'sent':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-orange-600 bg-orange-50';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{pitch.podcastName}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {pitch.hostName}
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {pitch.hostEmail}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(pitch.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Badge className={cn("ml-4", getStatusColor(pitch.status))}>
            {pitch.status}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {pitch.status === 'pending' && isStaff && onApprove && (
            <Button onClick={onApprove} variant="default" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          {pitch.status === 'approved' && (
            <Button onClick={onSend} variant="default" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send Pitch
            </Button>
          )}
          <Button
            onClick={() => onSave({})}
            variant="outline"
            size="sm"
            disabled={!isEditingSubject && !isEditingBody}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl">
          {/* Subject Line */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">
                Subject Line
              </label>
              {!isEditingSubject && (
                <button
                  onClick={handleStartEditSubject}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>
            {isEditingSubject ? (
              <div className="flex gap-2">
                <Input
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveSubject();
                    } else if (e.key === 'Escape') {
                      setIsEditingSubject(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSaveSubject}
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingSubject(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg font-medium">
                {pitch.subject}
              </div>
            )}
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email Body
              </label>
              {!isEditingBody && (
                <button
                  onClick={handleStartEditBody}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>
            {isEditingBody ? (
              <div className="space-y-2">
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveBody}
                    disabled={isSaving}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingBody(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                {pitch.body}
              </div>
            )}
          </div>

          {/* Campaign Info */}
          {pitch.campaignName && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Campaign:</span>
                <span className="font-medium">{pitch.campaignName}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}