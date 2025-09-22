import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PitchDraft {
  id: string;
  podcastName: string;
  hostName: string;
  subject: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'sent';
  hasEdits?: boolean;
}

interface PitchReviewSidebarProps {
  drafts: PitchDraft[];
  selectedDraftId: string | null;
  onSelectDraft: (draftId: string) => void;
}

export function PitchReviewSidebar({
  drafts,
  selectedDraftId,
  onSelectDraft,
}: PitchReviewSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrafts = useMemo(() => {
    if (!searchQuery) return drafts;

    const query = searchQuery.toLowerCase();
    return drafts.filter(
      draft =>
        draft.podcastName.toLowerCase().includes(query) ||
        draft.hostName.toLowerCase().includes(query) ||
        draft.subject.toLowerCase().includes(query)
    );
  }, [drafts, searchQuery]);

  const getStatusIcon = (status: PitchDraft['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: PitchDraft['status']) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      sent: 'outline',
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
        {status}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col border-r bg-muted/10">
      {/* Search Header */}
      <div className="p-4 border-b bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {filteredDrafts.length} of {drafts.length} drafts
        </div>
      </div>

      {/* Drafts List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No drafts found</p>
            </div>
          ) : (
            filteredDrafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => onSelectDraft(draft.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg mb-2 transition-all",
                  "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  selectedDraftId === draft.id
                    ? "bg-accent shadow-sm border border-border"
                    : "bg-background border border-transparent"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(draft.status)}
                    <div className="font-medium text-sm truncate">
                      {draft.podcastName}
                    </div>
                  </div>
                  {draft.hasEdits && (
                    <Edit3 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  )}
                </div>

                <div className="text-xs text-muted-foreground mb-2 truncate">
                  Host: {draft.hostName}
                </div>

                <div className="text-sm mb-2 line-clamp-2 text-muted-foreground">
                  {draft.subject}
                </div>

                <div className="flex items-center justify-between">
                  {getStatusBadge(draft.status)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}