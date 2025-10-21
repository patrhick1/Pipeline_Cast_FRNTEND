import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Mail,
  Star,
  Archive,
  Trash2,
  RefreshCw,
  Filter,
  Send,
  Inbox as InboxIcon,
  ChevronLeft,
  ChevronRight,
  Settings,
  ExternalLink,
  MoreVertical,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EmailThread, InboxFilters, NylasAuthStatus } from '@/types/inbox';
import ThreadView from '@/components/inbox/ThreadView';
import ComposeModal from '@/components/inbox/ComposeModal';
import NylasConnect from '@/components/inbox/NylasConnect';
import { DraftsList } from '@/components/inbox/DraftsList';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { LockedOverlay } from '@/components/LockedOverlay';
import {
  CLASSIFICATION_TYPES,
  getAIClassifications,
  getWorkflowClassifications,
  getClassificationColor,
  getClassificationLabel
} from '@/lib/classifications';

export default function Inbox() {
  // Check URL params for thread ID
  const urlParams = new URLSearchParams(window.location.search);
  const threadFromUrl = urlParams.get('thread');

  const [selectedThread, setSelectedThread] = useState<string | null>(threadFromUrl);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [filters, setFilters] = useState<InboxFilters>({
    folder: 'inbox'  // Always default to inbox
  });

  const { user } = useAuth();
  const { hasPaidAccess, canAccessFeature } = useFeatureAccess();

  // Show paywall for clients without paid access
  const isClient = user?.role?.toLowerCase() === 'client';
  const shouldShowPaywall = isClient && !hasPaidAccess && !canAccessFeature('inbox');
  const { toast } = useToast();

  // Check Nylas connection status
  const { data: nylasStatus } = useQuery<NylasAuthStatus>({
    queryKey: ['/inbox/nylas-status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch email threads
  const { 
    data: threadsResponse, 
    isLoading, 
    refetch: refetchThreads 
  } = useQuery<{ threads: EmailThread[]; total: number; has_more: boolean } | EmailThread[]>({
    queryKey: ['/inbox/threads', filters],
    enabled: nylasStatus?.connected === true,
  });

  // Handle both wrapped and direct array responses
  const threads = Array.isArray(threadsResponse) 
    ? threadsResponse 
    : (threadsResponse?.threads || []);
  
  // Debug logging
  console.log('Inbox Debug - threadsResponse:', threadsResponse, 'threads:', threads, 'isArray:', Array.isArray(threads));
  if (!Array.isArray(threads)) {
    console.error('CRITICAL: Threads is not an array:', threads, 'threadsResponse:', threadsResponse);
  }

  // Mark thread as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await apiRequest('POST', `/inbox/threads/${threadId}/mark-read`);
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Star/unstar thread mutation
  const toggleStarMutation = useMutation({
    mutationFn: async ({ threadId, starred }: { threadId: string; starred: boolean }) => {
      const res = await apiRequest('POST', `/inbox/threads/${threadId}/star`, { starred });
      if (!res.ok) throw new Error('Failed to update star status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Archive thread mutation
  const archiveThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await apiRequest('POST', `/inbox/threads/${threadId}/archive`);
      if (!res.ok) throw new Error('Failed to archive thread');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thread archived',
        description: 'The conversation has been archived.',
      });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Delete thread mutation (move to trash)
  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await apiRequest('DELETE', `/inbox/threads/${threadId}`);
      if (!res.ok) throw new Error('Failed to delete thread');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thread deleted',
        description: 'The conversation has been moved to trash.',
      });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Handle search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery || undefined }));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Auto-mark as read when thread is selected
  useEffect(() => {
    if (selectedThread && threads.length > 0) {
      const thread = threads.find(t => (t.thread_id || t.id) === selectedThread);
      if (thread && thread.unread_count > 0) {
        markAsReadMutation.mutate(selectedThread);
      }
    }
  }, [selectedThread, threads]);
  
  // Update URL when selected thread changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedThread) {
      url.searchParams.set('thread', selectedThread);
    } else {
      url.searchParams.delete('thread');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedThread]);

  const handleFolderChange = (folder: string) => {
    setActiveFolder(folder);
    // Always ensure folder parameter is set (default to 'inbox')
    setFilters(prev => ({ ...prev, folder: folder || 'inbox' }));
    setSelectedThread(null);
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Draft';

    try {
      const messageDate = new Date(dateStr);
      // Check if date is valid
      if (isNaN(messageDate.getTime())) return 'Draft';

      const now = new Date();
      const diff = now.getTime() - messageDate.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return format(messageDate, 'h:mm a');
      } else if (days === 1) {
        return 'Yesterday';
      } else if (days < 7) {
        return format(messageDate, 'EEEE');
      } else if (messageDate.getFullYear() === now.getFullYear()) {
        return format(messageDate, 'MMM d');
      } else {
        return format(messageDate, 'MMM d, yyyy');
      }
    } catch (error) {
      return 'Draft';
    }
  };

  const getClassificationBadge = (classification?: string) => {
    if (!classification) return null;

    const color = getClassificationColor(classification);
    const label = getClassificationLabel(classification);

    return (
      <Badge className={cn('text-white text-xs', color)}>
        {label}
      </Badge>
    );
  };

  if (!nylasStatus?.connected) {
    return <NylasConnect status={nylasStatus} />;
  }

  return (
    <>
      {/* Upgrade Banner for free users */}
      {shouldShowPaywall && (
        <UpgradeBanner
          featureName="Email Inbox"
          featureDescription="Manage email conversations, track responses, and handle podcast outreach communications."
        />
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 relative">
        {/* Locked overlay for free users */}
        {shouldShowPaywall && (
          <LockedOverlay message="Upgrade to access your email inbox and manage conversations" />
        )}
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <Button 
            onClick={() => setIsComposeOpen(true)}
            className="w-full"
            size="lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 pb-4 space-y-1">
            {[
              { id: 'inbox', label: 'Inbox', icon: InboxIcon },
              { id: 'sent', label: 'Sent', icon: Send },
              { id: 'drafts', label: 'Drafts', icon: FileText },
              { id: 'starred', label: 'Starred', icon: Star },
              { id: 'archive', label: 'Archive', icon: Archive },
              { id: 'trash', label: 'Trash', icon: Trash2 },
            ].map(folder => (
              <button
                key={folder.id}
                onClick={() => handleFolderChange(folder.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  activeFolder === folder.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                <folder.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{folder.label}</span>
                {folder.id === 'inbox' && Array.isArray(threads) && threads.length > 0 && (
                  <span className="text-xs">
                    {threads.filter((t: any) => t && (t.unread_count > 0 || t.unread)).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="px-4 py-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Filter by Classification</p>
            <div className="space-y-1">
              <button
                onClick={() => setFilters(prev => ({ ...prev, classification: undefined }))}
                className={cn(
                  'w-full text-left px-3 py-1.5 rounded text-xs transition-colors',
                  !filters.classification ? 'bg-gray-200' : 'hover:bg-gray-100'
                )}
              >
                All Classifications
              </button>

              {/* AI Classifications */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-600 px-3 py-1">AI Classifications</p>
                {getAIClassifications().map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      classification: prev.classification === type.value ? undefined : type.value
                    }))}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors',
                      filters.classification === type.value
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    {getClassificationBadge(type.value)}
                    <span className="text-gray-700">{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Workflow Classifications */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-600 px-3 py-1">Workflow</p>
                {getWorkflowClassifications().map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      classification: prev.classification === type.value ? undefined : type.value
                    }))}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors',
                      filters.classification === type.value
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    {getClassificationBadge(type.value)}
                    <span className="text-gray-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {nylasStatus?.sync_status === 'syncing' ? (
                <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
              ) : null}
              {nylasStatus?.last_sync ? `Synced ${format(new Date(nylasStatus.last_sync), 'HH:mm')}` : 'Syncing...'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
                queryClient.invalidateQueries({ queryKey: ['/inbox/nylas-status'] });
                refetchThreads();
              }}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Thread List or Drafts List */}
      <div className="flex-1 flex">
        {activeFolder === 'drafts' ? (
          <div className="flex-1 bg-white">
            <DraftsList isAdminInbox={false} />
          </div>
        ) : (
          <>
          <div className={cn(
            'border-r border-gray-200 bg-white transition-all',
            selectedThread ? 'w-96' : 'flex-1'
          )}>
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Thread List */}
            <ScrollArea className="h-[calc(100%-5rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : Array.isArray(threads) && threads.length > 0 ? (
              <div className="divide-y">
                {threads.map((thread: any) => (
                  <div
                    key={thread.thread_id || thread.id}
                    onClick={() => setSelectedThread(thread.thread_id || thread.id)}
                    className={cn(
                      'group w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer',
                      selectedThread === (thread.thread_id || thread.id) && 'bg-blue-50',
                      (thread.unread_count > 0 || thread.unread) && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          'text-sm truncate max-w-[250px]',
                          (thread.unread_count > 0 || thread.unread) ? 'font-semibold' : 'font-medium'
                        )}>
                          {thread.media_name || thread.from_name || thread.from_email || 'Unknown'}
                        </h3>
                        {(thread.unread_count > 0 || thread.unread) && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMutation.mutate({ 
                            threadId: thread.thread_id || thread.id, 
                            starred: !thread.starred 
                          });
                        }}
                        className="text-gray-400 hover:text-yellow-500"
                      >
                        <Star className={cn(
                          'w-4 h-4',
                          thread.starred && 'fill-yellow-500 text-yellow-500'
                        )} />
                      </button>
                    </div>
                    
                    <p className={cn(
                      'text-sm truncate mb-1',
                      (thread.unread_count > 0 || thread.unread) ? 'font-medium text-gray-900' : 'text-gray-700'
                    )}>
                      {thread.subject}
                    </p>
                    
                    <p className="text-xs text-gray-500 truncate mb-2">
                      {thread.snippet}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getClassificationBadge(thread.classification)}
                        {thread.message_count > 1 && (
                          <span className="text-xs text-gray-500">
                            {thread.message_count} messages
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(thread.date || thread.last_message_date)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveThreadMutation.mutate(thread.thread_id || thread.id);
                              }}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteThreadMutation.mutate(thread.thread_id || thread.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <InboxIcon className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-sm">No emails found</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Thread View */}
        {selectedThread && (
          <ThreadView
            threadId={selectedThread}
            onClose={() => setSelectedThread(null)}
            onReply={() => {}}
          />
        )}
        </>
        )}
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <ComposeModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
        />
      )}
    </div>
    </>
  );
}