import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  adminInboxService,
  AdminSendingAccount,
  EmailThread,
  ThreadDetails,
  ReplyData
} from '@/services/adminInbox';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Mail,
  Inbox as InboxIcon,
  Send,
  Star,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Loader2,
  Reply,
  ReplyAll,
  Forward,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Archive,
  Trash2,
  AlertCircle,
  FolderOpen,
  Sparkles,
  MoreVertical,
  Circle,
  UserCircle2,
  X,
  ArrowLeftIcon,
  Menu,
  Paperclip,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SmartReplies from '@/components/inbox/SmartReplies';

export default function AdminInbox() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [replyMode, setReplyMode] = useState<'reply' | 'replyAll' | 'forward' | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available admin accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: () => adminInboxService.getAccounts(),
  });

  // Fetch threads for ALL accounts or filtered account
  const { data: threadsData, isLoading: isLoadingThreads, refetch: refetchThreads } = useQuery({
    queryKey: ['admin-threads', selectedAccountFilter, currentPage, selectedFolder],
    queryFn: async () => {
      if (!accountsData?.accounts?.length) return null;

      // If no specific account selected, fetch from all accounts
      const accountIds = selectedAccountFilter
        ? [selectedAccountFilter]
        : accountsData.accounts.map(a => a.id);

      // Fetch threads from all selected accounts
      const promises = accountIds.map(id =>
        adminInboxService.getThreads(id, currentPage, 20, selectedFolder === 'all' ? undefined : selectedFolder as any)
      );

      const results = await Promise.all(promises);

      // Combine all threads and sort by date
      const allThreads = results.flatMap((r, idx) =>
        r.threads.map(thread => ({
          ...thread,
          account_id: accountIds[idx],
          account_email: accountsData.accounts.find(a => a.id === accountIds[idx])?.email_address
        }))
      );

      // Sort by date descending
      allThreads.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate totals
      const total = results.reduce((sum, r) => sum + r.total, 0);
      const pages = Math.max(...results.map(r => r.pages));

      return {
        threads: allThreads,
        total,
        page: currentPage,
        pages
      };
    },
    enabled: !!accountsData?.accounts?.length,
  });

  // Fetch thread details
  const { data: threadDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['admin-thread-details', selectedThreadId],
    queryFn: async () => {
      if (!selectedThreadId) return null;
      return adminInboxService.getThreadDetails(selectedThreadId);
    },
    enabled: !!selectedThreadId,
  });

  // Auto-expand last message when thread details load
  useEffect(() => {
    if (threadDetails?.messages && threadDetails.messages.length > 0) {
      const lastMessage = threadDetails.messages[threadDetails.messages.length - 1];
      setExpandedMessages(new Set([lastMessage.message_id]));
    }
  }, [threadDetails]);

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: ({ threadId, replyData }: { threadId: string; replyData: ReplyData }) =>
      adminInboxService.sendReply(threadId, replyData),
    onSuccess: () => {
      toast({ title: 'Reply sent successfully' });
      setReplyMode(null);
      setReplyContent('');
      setReplySubject('');
      setShowSmartReplies(false);
      queryClient.invalidateQueries({ queryKey: ['admin-thread-details', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
    },
    onError: () => {
      toast({
        title: 'Failed to send reply',
        variant: 'destructive'
      });
    },
  });

  // Archive thread mutation
  const archiveThreadMutation = useMutation({
    mutationFn: (threadId: string) => adminInboxService.archiveThread(threadId),
    onSuccess: () => {
      toast({ title: 'Thread archived successfully' });
      setSelectedThreadId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
    },
    onError: () => {
      toast({
        title: 'Failed to archive thread',
        variant: 'destructive'
      });
    },
  });

  // Delete (trash) thread mutation
  const trashThreadMutation = useMutation({
    mutationFn: (threadId: string) => adminInboxService.trashThread(threadId),
    onSuccess: () => {
      toast({ title: 'Thread moved to trash' });
      setSelectedThreadId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
    },
    onError: () => {
      toast({
        title: 'Failed to delete thread',
        variant: 'destructive'
      });
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: ({ threadId, starred }: { threadId: string; starred: boolean }) =>
      adminInboxService.toggleThreadStar(threadId, starred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thread-details'] });
    },
    onError: () => {
      toast({
        title: 'Failed to update star status',
        variant: 'destructive'
      });
    },
  });

  const handleSendReply = () => {
    if (!threadDetails || !replyContent.trim()) return;

    const lastMessage = threadDetails.messages[threadDetails.messages.length - 1];
    const replyTo = lastMessage.direction === 'inbound'
      ? [lastMessage.from_email]
      : lastMessage.to_emails || [];

    // Convert line breaks to HTML <br> tags to preserve formatting
    const formattedContent = replyContent
      .split('\n')
      .map(line => line || '&nbsp;') // Preserve empty lines
      .join('<br>');

    sendReplyMutation.mutate({
      threadId: threadDetails.thread.thread_id,
      replyData: {
        to: replyTo,
        subject: replySubject || `Re: ${threadDetails.thread.subject}`,
        body: formattedContent,
        reply_all: replyMode === 'replyAll'
      }
    });
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    setReplyMode(null);
    setReplyContent('');
    setShowSmartReplies(false);
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const getQuotedText = (message: any): string => {
    const from = message.from_name || message.from_email || 'Unknown';
    const date = format(new Date(message.date), 'MMM d, yyyy, h:mm a');
    const header = `\n\nOn ${date}, ${from} wrote:\n`;

    let plainText = '';

    if (message.body_html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.body_html;
      plainText = tempDiv.textContent || tempDiv.innerText || '';
    } else if (message.body_plain) {
      // If body_plain contains HTML, strip it
      if (message.body_plain.includes('<')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = message.body_plain;
        plainText = tempDiv.textContent || tempDiv.innerText || '';
      } else {
        plainText = message.body_plain;
      }
    }

    if (plainText) {
      const quotedLines = plainText.split('\n').map(line => `> ${line}`).join('\n');
      return header + quotedLines;
    }

    return '';
  };

  const handleSmartReplySelect = (text: string) => {
    setReplyContent(text);
    setReplyMode('reply');
    setShowSmartReplies(false);
  };

  const filteredThreads = threadsData?.threads?.filter(thread => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.subject?.toLowerCase().includes(query) ||
      thread.from_name?.toLowerCase().includes(query) ||
      thread.from_email?.toLowerCase().includes(query) ||
      thread.snippet?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: InboxIcon },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'spam', label: 'Spam', icon: AlertCircle },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            <h1 className="text-lg font-semibold text-gray-900">Shared Inboxes</h1>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Professional podcast booking system
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4">
            <Button
              onClick={() => refetchThreads()}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-1">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedFolder === folder.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  <folder.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{folder.label}</span>
                  {folder.id === 'inbox' && threadsData?.threads && (
                    <span className="text-xs">
                      {threadsData.threads.filter(t => t.unread).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Filter by Account</p>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedAccountFilter(null)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded text-xs transition-colors',
                    !selectedAccountFilter ? 'bg-gray-200' : 'hover:bg-gray-100'
                  )}
                >
                  All Accounts
                </button>
                {accountsData?.accounts?.map(account => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountFilter(account.id)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded text-xs transition-colors truncate',
                      selectedAccountFilter === account.id ? 'bg-gray-200' : 'hover:bg-gray-100'
                    )}
                    title={account.email_address}
                  >
                    {account.sending_name || account.email_address}
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Thread List */}
        <div className={cn(
          'border-r border-gray-200 bg-white transition-all',
          selectedThreadId ? 'w-96' : 'flex-1'
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
            {isLoadingThreads ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredThreads?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <InboxIcon className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-sm">No emails found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredThreads?.map((thread: any) => (
                  <div
                    key={thread.thread_id}
                    onClick={() => handleThreadSelect(thread.thread_id)}
                    className={cn(
                      'group w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer',
                      selectedThreadId === thread.thread_id && 'bg-blue-50',
                      thread.unread && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          'text-sm truncate max-w-[250px]',
                          thread.unread ? 'font-semibold' : 'font-medium'
                        )}>
                          {thread.from_name || thread.from_email || 'Unknown'}
                        </h3>
                        {thread.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMutation.mutate({
                            threadId: thread.thread_id,
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
                      thread.unread ? 'font-medium text-gray-900' : 'text-gray-700'
                    )}>
                      {thread.subject}
                    </p>

                    <p className="text-xs text-gray-500 truncate mb-2">
                      {thread.snippet}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {thread.account_email && (
                          <Badge variant="outline" className="text-xs">
                            {thread.account_email.split('@')[0]}
                          </Badge>
                        )}
                        {thread.message_count > 1 && (
                          <span className="text-xs text-gray-500">
                            {thread.message_count} messages
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(thread.date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {threadsData && threadsData.pages > 1 && (
            <div className="p-3 border-t flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {threadsData.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= threadsData.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Thread View */}
        {selectedThreadId && (
          <div className="flex-1 flex flex-col bg-white">
            {isLoadingDetails ? (
              <div className="flex-1 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : threadDetails ? (
              <>
                {/* Thread Header */}
                <div className="border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">{threadDetails.thread?.subject || 'Loading...'}</h2>
                      <p className="text-sm text-gray-500">
                        {threadDetails.thread?.participants?.join(', ') || 'Unknown participants'}
                      </p>
                    </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => archiveThreadMutation.mutate(selectedThreadId)}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => trashThreadMutation.mutate(selectedThreadId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedThreadId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {threadDetails.messages && threadDetails.messages.length > 0 ? (
                  threadDetails.messages.map((message, index) => {
                  const messageId = message.message_id;
                  const isExpanded = expandedMessages.has(messageId);
                  const isLastMessage = index === threadDetails.messages.length - 1;

                  return (
                    <Card key={messageId} className="overflow-hidden">
                      <button
                        onClick={() => toggleMessageExpansion(messageId)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(message.from_name, message.from_email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-medium">
                                {message.from_name || message.from_email || 'Unknown'}
                              </p>
                              {message.direction === 'inbound' ? (
                                <ArrowDownLeft className="w-3 h-3 text-green-500" title="Received" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 text-blue-500" title="Sent" />
                              )}
                            </div>
                            {!isExpanded && (message.body_html || message.body_plain) && (
                              <p className="text-sm text-gray-500 truncate max-w-md">
                                {(message.body_html || message.body_plain || '').replace(/<[^>]*>/g, '').slice(0, 100)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {format(new Date(message.date), 'MMM d, h:mm a')}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t">
                          <div className="pt-4">
                            {/* Email metadata */}
                            <div className="text-xs text-gray-500 mb-3 space-y-1">
                              {message.to_emails && (
                                <p className="flex items-start">
                                  <span className="font-medium mr-1">To:</span>
                                  <span>{message.to_emails.join(', ')}</span>
                                </p>
                              )}
                              {message.cc_emails && message.cc_emails.length > 0 && (
                                <p className="flex items-start">
                                  <span className="font-medium mr-1">Cc:</span>
                                  <span>{message.cc_emails.join(', ')}</span>
                                </p>
                              )}
                              {message.bcc_emails && message.bcc_emails.length > 0 && (
                                <p className="flex items-start">
                                  <span className="font-medium mr-1">Bcc:</span>
                                  <span>{message.bcc_emails.join(', ')}</span>
                                </p>
                              )}
                            </div>

                            {/* Email body - handle both HTML and plain text */}
                            {message.body_html ? (
                              <div
                                className="prose prose-sm max-w-none text-gray-800 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:ml-0 [&_blockquote]:text-gray-600"
                                dangerouslySetInnerHTML={{ __html: message.body_html }}
                              />
                            ) : message.body_plain ? (
                              <div
                                className="prose prose-sm max-w-none text-gray-800 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:ml-0 [&_blockquote]:text-gray-600"
                                dangerouslySetInnerHTML={{ __html: message.body_plain }}
                              />
                            ) : (
                              <p className="text-gray-500 italic">No message content available</p>
                            )}

                            {/* Action buttons */}
                            {isLastMessage && (
                              <div className="flex gap-2 mt-4 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyMode('reply');
                                    setReplyContent('');
                                  }}
                                >
                                  <Reply className="w-4 h-4 mr-2" />
                                  Reply
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyMode('replyAll');
                                    setReplyContent('');
                                  }}
                                >
                                  <ReplyAll className="w-4 h-4 mr-2" />
                                  Reply All
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyMode('forward');
                                    setReplyContent(getQuotedText(message));
                                  }}
                                >
                                  <Forward className="w-4 h-4 mr-2" />
                                  Forward
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <Mail className="w-8 h-8 mb-2 text-gray-300" />
                    <p className="text-sm">No messages in this thread</p>
                    <p className="text-xs mt-2">Check console for API response structure</p>
                  </div>
                )}
              </div>

              {/* Smart Replies */}
              {!replyMode && threadDetails?.messages && threadDetails.messages.length > 0 && (
                <div className="mt-4">
                  {!showSmartReplies ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowSmartReplies(true)}
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Smart Replies
                    </Button>
                  ) : (
                    <SmartReplies
                      threadId={selectedThreadId}
                      onSelectReply={handleSmartReplySelect}
                    />
                  )}
                </div>
              )}

              {/* Reply Composer */}
              {replyMode && (
                <Card className="mt-4 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">
                      {replyMode === 'reply' && 'Reply'}
                      {replyMode === 'replyAll' && 'Reply All'}
                      {replyMode === 'forward' && 'Forward'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyMode(null);
                        setReplyContent('');
                        setShowSmartReplies(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-[150px] mb-3"
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReplyMode(null);
                          setReplyContent('');
                          setShowSmartReplies(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyContent.trim() || sendReplyMutation.isPending}
                      >
                        {sendReplyMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Failed to load thread details</p>
              <p className="text-sm text-gray-500 mt-1">Thread ID: {selectedThreadId}</p>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
</div>
);
}