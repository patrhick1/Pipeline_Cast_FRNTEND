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
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Download,
  Calendar,
  Check,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SmartReplies from '@/components/inbox/SmartReplies';
import RichTextEditor from '@/components/inbox/RichTextEditor';
import { ScheduleModal } from '@/components/inbox/ScheduleModal';
import { DraftsList } from '@/components/inbox/DraftsList';
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave';
import { useDraftLoader } from '@/hooks/useDraftLoader';
import { draftsApi, adminDraftsApi } from '@/services/drafts';

export default function AdminInbox() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [replyMode, setReplyMode] = useState<'reply' | 'replyAll' | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<number | null>(null);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string | null>(null);
  const [groupByCampaign, setGroupByCampaign] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Recipient fields state
  const [replyTo, setReplyTo] = useState<string[]>([]);
  const [replyCc, setReplyCc] = useState<string[]>([]);
  const [replyBcc, setReplyBcc] = useState<string[]>([]);
  const [replyToInput, setReplyToInput] = useState('');
  const [replyCcInput, setReplyCcInput] = useState('');
  const [replyBccInput, setReplyBccInput] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Determine if user is admin/staff
  const userRole = user?.role?.toLowerCase();
  const isStaffOrAdmin = userRole === 'admin' || userRole === 'staff';

  // Read URL query parameters to auto-select thread
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const threadParam = params.get('thread');
    if (threadParam && threadParam !== selectedThreadId) {
      setSelectedThreadId(threadParam);
      setSelectedFolder('inbox'); // Switch to inbox when thread is selected from URL
    }
  }, []);

  // Fetch all available admin accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: () => adminInboxService.getAccounts(),
  });

  // Fetch all campaigns for grouping
  const { data: allCampaignsData = [] } = useQuery({
    queryKey: ['/campaigns/with-subscriptions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/campaigns/with-subscriptions');
      if (!response.ok) {
        // Fallback to regular campaigns endpoint
        const fallbackResponse = await apiRequest('GET', '/campaigns');
        if (!fallbackResponse.ok) throw new Error('Failed to fetch campaigns');
        const campaigns = await fallbackResponse.json();
        // Return campaigns without subscription data
        return campaigns.map((c: any) => ({ ...c, subscription_plan: 'free' }));
      }
      return response.json();
    },
    enabled: !!user, // Only fetch when user is loaded
  });

  // Filter campaigns for admin/staff to only show paid_premium
  const campaigns = isStaffOrAdmin
    ? allCampaignsData.filter((c: any) => c.subscription_plan === 'paid_premium')
    : allCampaignsData;

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

  // Get admin account ID from thread details
  const adminAccountId = threadDetails?.admin_account?.id;

  // Load existing draft for this thread
  const { draft: existingDraft, isLoading: loadingDraft } = useDraftLoader({
    threadId: selectedThreadId || '',
    enabled: !!selectedThreadId && !!threadDetails,
    isAdminInbox: true,
    adminAccountId: adminAccountId,
  });

  // Get email metadata for auto-save
  // Get email metadata for auto-save - use custom recipients if reply mode is active
  const emailMetadata = threadDetails?.messages && threadDetails.messages.length > 0
    ? {
        to: replyMode ? replyTo : [(threadDetails as any).from_email || threadDetails.messages[0]?.from_email || ''],
        cc: replyMode && replyCc.length > 0 ? replyCc : undefined,
        bcc: replyMode && replyBcc.length > 0 ? replyBcc : undefined,
        subject: (threadDetails as any).subject || threadDetails.thread?.subject || '',
        reply_to_message_id: threadDetails.messages[threadDetails.messages.length - 1]?.message_id || undefined,
      }
    : { to: [], subject: '' };

  // Auto-save hook for reply content
  const {
    body: draftBody,
    setBody: setDraftBody,
    draftId,
    setDraftId,
    isSaving,
    lastSavedAt,
  } = useDraftAutoSave({
    threadId: selectedThreadId || '',
    initialBody: existingDraft?.body || '',
    emailMetadata,
    isAdminInbox: true,
    adminAccountId: adminAccountId,
  });

  // Populate reply box when draft loads
  useEffect(() => {
    if (existingDraft && existingDraft.body) {
      setDraftBody(existingDraft.body);
      setDraftId(existingDraft.draft_id);
      setReplyContent(existingDraft.body);
      if (!replyMode) {
        setReplyMode('reply'); // Auto-open reply mode if draft exists
      }
    }
  }, [existingDraft, setDraftBody, setDraftId]);

  // Sync draft body with replyContent state
  useEffect(() => {
    if (replyMode && draftBody !== replyContent) {
      setReplyContent(draftBody);
    }
  }, [draftBody, replyMode]);

  // Update draft body when user types
  useEffect(() => {
    if (replyMode && replyContent !== draftBody) {
      setDraftBody(replyContent);
    }
  }, [replyContent, replyMode]);

  // Auto-expand last message when thread details load
  useEffect(() => {
    if (threadDetails?.messages && threadDetails.messages.length > 0) {
      const lastMessage = threadDetails.messages[threadDetails.messages.length - 1];
      setExpandedMessages(new Set([lastMessage.message_id]));
    }
  }, [threadDetails]);

  // Mark thread as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (threadId: string) => adminInboxService.markThreadRead(threadId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
    },
    onError: () => {
      // Silently fail - marking as read is not critical
      console.error('Failed to mark thread as read');
    },
  });

  // Auto-mark as read when thread is selected and it's unread
  useEffect(() => {
    if (selectedThreadId && threadsData?.threads) {
      const thread = threadsData.threads.find(t => t.thread_id === selectedThreadId);
      if (thread && thread.unread) {
        markAsReadMutation.mutate(selectedThreadId);
      }
    }
  }, [selectedThreadId]);

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

  const handleSendReply = async () => {
    if (!threadDetails || !replyContent.trim()) return;

    // If we have a draft, update recipients first, then send it using the drafts API
    if (draftId && adminAccountId) {
      try {
        // Update draft with custom recipients before sending
        await adminDraftsApi.updateDraft(adminAccountId, draftId, {
          to: replyTo.length > 0 ? replyTo : emailMetadata.to,
          cc: replyCc.length > 0 ? replyCc : undefined,
          bcc: replyBcc.length > 0 ? replyBcc : undefined,
          body: replyContent,
        });

        // Now send the draft
        await adminDraftsApi.sendDraft(adminAccountId, draftId);
        toast({
          title: 'Reply sent',
          description: 'Your reply has been sent successfully.',
        });
        setReplyMode(null);
        setReplyContent('');
        setDraftBody('');
        setDraftId(null);
        setShowSmartReplies(false);
        queryClient.invalidateQueries({ queryKey: ['admin-thread-details', selectedThreadId] });
        queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
      } catch (error) {
        toast({
          title: 'Failed to send',
          description: 'There was an error sending your reply. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Send as regular reply (non-draft) - use state recipients
      // Content is already in HTML format from RichTextEditor
      sendReplyMutation.mutate({
        threadId: threadDetails.thread.thread_id,
        replyData: {
          to: replyTo.length > 0 ? replyTo : emailMetadata.to,
          cc: replyCc.length > 0 ? replyCc : undefined,
          bcc: replyBcc.length > 0 ? replyBcc : undefined,
          subject: replySubject || `Re: ${threadDetails.thread.subject}`,
          body: replyContent,
          reply_all: replyMode === 'replyAll'
        }
      });
    }
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
    // Filter by campaign if selected
    if (selectedCampaignFilter && thread.campaign_id !== selectedCampaignFilter) {
      return false;
    }

    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.subject?.toLowerCase().includes(query) ||
      thread.from_name?.toLowerCase().includes(query) ||
      thread.from_email?.toLowerCase().includes(query) ||
      thread.snippet?.toLowerCase().includes(query)
    );
  });

  // Group threads by campaign if enabled
  const groupedThreads = groupByCampaign && filteredThreads ?
    filteredThreads.reduce((groups: Record<string, any[]>, thread) => {
      const campaignId = thread.campaign_id || 'no-campaign';
      if (!groups[campaignId]) {
        groups[campaignId] = [];
      }
      groups[campaignId].push(thread);
      return groups;
    }, {}) : null;

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
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
  };

  const getInitials = (name: string | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Recipient management helpers
  const handleAddEmail = (
    input: string,
    emails: string[],
    setEmails: (emails: string[]) => void,
    setInput: (input: string) => void
  ) => {
    const email = input.trim();
    if (email && email.includes('@') && !emails.includes(email)) {
      setEmails([...emails, email]);
      setInput('');
    }
  };

  const handleRemoveEmail = (
    email: string,
    emails: string[],
    setEmails: (emails: string[]) => void
  ) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    emails: string[],
    setEmails: (emails: string[]) => void,
    setInput: (input: string) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddEmail(input, emails, setEmails, setInput);
    }
  };

  // Calculate default recipients based on reply mode
  const getReplyRecipients = (mode: 'reply' | 'replyAll') => {
    if (!threadDetails?.messages || threadDetails.messages.length === 0) {
      return { to: [], cc: [], bcc: [] };
    }

    const lastMessage = threadDetails.messages[threadDetails.messages.length - 1];

    // Determine who to reply to based on message direction
    let replyToEmail: string | null = null;

    if (lastMessage.direction === 'inbound') {
      // If inbound, reply to the sender (from_email)
      replyToEmail = lastMessage.from_email || lastMessage.sender_email;
    } else if (lastMessage.direction === 'outbound') {
      // If outbound, reply to the original recipients (to_emails)
      const toEmails = lastMessage.to_emails || [];
      replyToEmail = toEmails.length > 0 ? toEmails[0] : null;
    } else {
      // Fallback: try from_email first
      replyToEmail = lastMessage.from_email || lastMessage.sender_email;
    }

    if (mode === 'reply') {
      return {
        to: replyToEmail ? [replyToEmail] : [],
        cc: [],
        bcc: []
      };
    } else {
      // replyAll mode
      const toEmails = lastMessage.to_emails || [];
      const ccEmails = lastMessage.cc_emails || [];

      // Build comprehensive recipient list for reply all
      const allRecipients = new Set<string>();
      if (replyToEmail) allRecipients.add(replyToEmail);
      toEmails.forEach((email: string) => allRecipients.add(email));

      return {
        to: Array.from(allRecipients),
        cc: ccEmails,
        bcc: []
      };
    }
  };

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: InboxIcon },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'drafts', label: 'Drafts', icon: FileText },
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
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['admin-threads'] });
                queryClient.invalidateQueries({ queryKey: ['admin-thread-details'] });
                refetchThreads();
              }}
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

            <div className="px-4 py-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Filter by Campaign</p>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCampaignFilter(null)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded text-xs transition-colors',
                    !selectedCampaignFilter ? 'bg-gray-200' : 'hover:bg-gray-100'
                  )}
                >
                  All Campaigns
                </button>
                {campaigns?.map((campaign: any) => (
                  <button
                    key={campaign.campaign_id}
                    onClick={() => setSelectedCampaignFilter(campaign.campaign_id)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded text-xs transition-colors truncate',
                      selectedCampaignFilter === campaign.campaign_id ? 'bg-gray-200' : 'hover:bg-gray-100'
                    )}
                    title={campaign.campaign_name}
                  >
                    {campaign.campaign_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-2 border-t">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={groupByCampaign}
                  onChange={(e) => setGroupByCampaign(e.target.checked)}
                  className="rounded"
                />
                Group by Campaign
              </label>
            </div>
          </ScrollArea>
        </div>

        {/* Thread List or Drafts List */}
        {selectedFolder === 'drafts' ? (
          <div className="flex-1 bg-white">
            <DraftsList
              isAdminInbox={true}
              adminAccountId={selectedAccountFilter || accountsData?.accounts?.[0]?.id}
            />
          </div>
        ) : (
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
            ) : groupByCampaign && groupedThreads ? (
              <div className="divide-y">
                {Object.entries(groupedThreads).map(([campaignId, threads]: [string, any[]]) => {
                  const campaign = campaigns?.find((c: any) => c.campaign_id === campaignId);
                  const campaignName = campaign?.campaign_name || (campaignId === 'no-campaign' ? 'No Campaign' : 'Unknown Campaign');

                  return (
                    <div key={campaignId} className="border-b">
                      <div className="sticky top-0 bg-gray-100 px-4 py-2 border-b">
                        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                          <FolderOpen className="w-3 h-3" />
                          {campaignName}
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
                          </Badge>
                        </h3>
                      </div>
                      {threads.map((thread: any) => (
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
                                {thread.media_name || thread.from_name || thread.from_email || 'Unknown'}
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
                          <p className="text-sm text-gray-900 mb-1 line-clamp-1">
                            {thread.subject || '(no subject)'}
                          </p>
                          {thread.snippet && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {thread.snippet}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatDate(thread.date)}</span>
                              {thread.message_count > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {thread.message_count} messages
                                </Badge>
                              )}
                            </div>
                            {thread.account_email && (
                              <span className="text-xs text-gray-400 truncate max-w-[150px]" title={thread.account_email}>
                                {thread.account_email}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
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
                          {thread.media_name || thread.from_name || thread.from_email || 'Unknown'}
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
        )}

        {/* Thread View */}
        {selectedThreadId && selectedFolder !== 'drafts' && (
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
                  // Use nylas_message_id for React key, but message_id for draft operations
                  const messageKey = message.nylas_message_id || message.message_id || index;
                  const internalMessageId = message.message_id; // Internal ID for draft operations
                  const isExpanded = expandedMessages.has(messageKey.toString());
                  const isLastMessage = index === threadDetails.messages.length - 1;
                  const isDraft = message.message_status === 'draft' || message.message_status === 'scheduled' || message.message_status === 'failed';

                  return (
                    <Card key={messageKey} className={`overflow-hidden ${isDraft ? 'border-2 border-yellow-300 bg-yellow-50' : ''}`}>
                      <button
                        onClick={() => toggleMessageExpansion(messageKey.toString())}
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
                              {isDraft ? (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                  {message.message_status === 'scheduled' ? (
                                    <>
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Scheduled
                                    </>
                                  ) : message.message_status === 'failed' ? (
                                    <>
                                      <X className="w-3 h-3 mr-1" />
                                      Failed
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-3 h-3 mr-1" />
                                      Draft
                                    </>
                                  )}
                                </Badge>
                              ) : message.direction === 'inbound' ? (
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
                            {isDraft ? (
                              <div className="space-y-4">
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  {message.message_status === 'scheduled' && message.scheduled_send_at ? (
                                    <>
                                      <p className="text-sm font-medium text-yellow-900 mb-2">📅 Scheduled Message</p>
                                      <p className="text-xs text-yellow-700">
                                        This message is scheduled to send on {format(new Date(message.scheduled_send_at), 'MMM d, yyyy \'at\' h:mm a')}
                                      </p>
                                    </>
                                  ) : message.message_status === 'failed' ? (
                                    <>
                                      <p className="text-sm font-medium text-red-900 mb-2">❌ Failed to Send</p>
                                      <p className="text-xs text-red-700">This message failed to send. You can edit and try sending again.</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm font-medium text-yellow-900 mb-2">📝 This is a draft message</p>
                                      <p className="text-xs text-yellow-700">Click "Edit Draft" below to modify and send or schedule this message.</p>
                                    </>
                                  )}
                                </div>
                                <div
                                  className="prose prose-sm max-w-none text-gray-800 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:ml-0 [&_blockquote]:text-gray-600"
                                  dangerouslySetInnerHTML={{ __html: message.body_html || message.body_plain || '' }}
                                />

                                {/* Draft Actions */}
                                <div className="flex gap-2 pt-4 border-t">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      // Load draft into reply box for editing
                                      setReplyMode('reply');
                                      setReplyContent(message.body_html || message.body_plain || '');
                                      setDraftBody(message.body_html || message.body_plain || '');
                                      // Use internal message_id as draft_id
                                      if (internalMessageId) {
                                        setDraftId(internalMessageId);
                                      }
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Edit Draft
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (internalMessageId && adminAccountId) {
                                        try {
                                          await adminDraftsApi.sendDraft(adminAccountId, internalMessageId);
                                          toast({
                                            title: 'Draft Sent',
                                            description: 'Your message has been sent',
                                          });
                                          queryClient.invalidateQueries({ queryKey: ['admin-thread-details'] });
                                        } catch (error) {
                                          toast({
                                            title: 'Error',
                                            description: 'Failed to send draft',
                                            variant: 'destructive',
                                          });
                                        }
                                      }
                                    }}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Now
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setShowScheduleModal(true);
                                      // Load draft into reply box
                                      setReplyMode('reply');
                                      setReplyContent(message.body_html || message.body_plain || '');
                                      setDraftBody(message.body_html || message.body_plain || '');
                                      // Use internal message_id as draft_id
                                      if (internalMessageId) {
                                        setDraftId(internalMessageId);
                                      }
                                    }}
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Schedule
                                  </Button>
                                </div>
                              </div>
                            ) : message.body_html ? (
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
                                    const recipients = getReplyRecipients('reply');
                                    setReplyTo(recipients.to);
                                    setReplyCc(recipients.cc);
                                    setReplyBcc(recipients.bcc);
                                    setShowCcBcc(false);
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
                                    const recipients = getReplyRecipients('replyAll');
                                    setReplyTo(recipients.to);
                                    setReplyCc(recipients.cc);
                                    setReplyBcc(recipients.bcc);
                                    setShowCcBcc(recipients.cc.length > 0);
                                    setReplyMode('replyAll');
                                    setReplyContent('');
                                  }}
                                >
                                  <ReplyAll className="w-4 h-4 mr-2" />
                                  Reply All
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

                  {/* Recipient Fields */}
                  <div className="space-y-2 mb-4 border-b pb-3">
                    {/* To Field */}
                    <div className="flex items-start gap-2">
                      <Label className="w-12 pt-2 text-sm text-gray-600">To</Label>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 flex flex-wrap gap-1 items-center border rounded-md p-2 min-h-[38px]">
                          {replyTo.map(email => (
                            <Badge key={email} variant="secondary" className="gap-1">
                              {email}
                              <button
                                onClick={() => handleRemoveEmail(email, replyTo, setReplyTo)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          <Input
                            value={replyToInput}
                            onChange={(e) => setReplyToInput(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, replyToInput, replyTo, setReplyTo, setReplyToInput)}
                            onBlur={() => handleAddEmail(replyToInput, replyTo, setReplyTo, setReplyToInput)}
                            placeholder="Add recipients..."
                            className="flex-1 min-w-[150px] border-0 shadow-none px-0 focus-visible:ring-0"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCcBcc(!showCcBcc)}
                        >
                          {showCcBcc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="ml-1 text-xs">Cc/Bcc</span>
                        </Button>
                      </div>
                    </div>

                    {/* CC Field */}
                    {showCcBcc && (
                      <>
                        <div className="flex items-start gap-2">
                          <Label className="w-12 pt-2 text-sm text-gray-600">Cc</Label>
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1 items-center border rounded-md p-2 min-h-[38px]">
                              {replyCc.map(email => (
                                <Badge key={email} variant="secondary" className="gap-1">
                                  {email}
                                  <button
                                    onClick={() => handleRemoveEmail(email, replyCc, setReplyCc)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                              <Input
                                value={replyCcInput}
                                onChange={(e) => setReplyCcInput(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, replyCcInput, replyCc, setReplyCc, setReplyCcInput)}
                                onBlur={() => handleAddEmail(replyCcInput, replyCc, setReplyCc, setReplyCcInput)}
                                placeholder="Add Cc recipients..."
                                className="flex-1 min-w-[150px] border-0 shadow-none px-0 focus-visible:ring-0"
                              />
                            </div>
                          </div>
                        </div>

                        {/* BCC Field */}
                        <div className="flex items-start gap-2">
                          <Label className="w-12 pt-2 text-sm text-gray-600">Bcc</Label>
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1 items-center border rounded-md p-2 min-h-[38px]">
                              {replyBcc.map(email => (
                                <Badge key={email} variant="secondary" className="gap-1">
                                  {email}
                                  <button
                                    onClick={() => handleRemoveEmail(email, replyBcc, setReplyBcc)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                              <Input
                                value={replyBccInput}
                                onChange={(e) => setReplyBccInput(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, replyBccInput, replyBcc, setReplyBcc, setReplyBccInput)}
                                onBlur={() => handleAddEmail(replyBccInput, replyBcc, setReplyBcc, setReplyBccInput)}
                                placeholder="Add Bcc recipients..."
                                className="flex-1 min-w-[150px] border-0 shadow-none px-0 focus-visible:ring-0"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <RichTextEditor
                    value={replyContent}
                    onChange={setReplyContent}
                    placeholder="Type your reply..."
                    minHeight="min-h-[150px]"
                    className="mb-3"
                  />

                  {/* Draft Status Indicator */}
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      {isSaving && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving draft...
                        </span>
                      )}
                      {!isSaving && draftId && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="w-3 h-3" />
                          Draft saved {lastSavedAt && `at ${format(lastSavedAt, 'h:mm a')}`}
                        </span>
                      )}
                    </div>
                  </div>

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
                        variant="outline"
                        onClick={() => setShowScheduleModal(true)}
                        disabled={!replyContent.trim()}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyContent.trim() || sendReplyMutation.isPending}
                      >
                        {sendReplyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

    {/* Schedule Modal */}
    <ScheduleModal
      isOpen={showScheduleModal}
      onClose={() => setShowScheduleModal(false)}
      draftId={draftId}
      emailData={{
        to: emailMetadata.to,
        subject: emailMetadata.subject,
        body: replyContent,
        reply_to_message_id: emailMetadata.reply_to_message_id,
      }}
      threadId={selectedThreadId || ''}
      isAdminInbox={true}
      onScheduled={() => {
        setShowScheduleModal(false);
        setReplyMode(null);
        setReplyContent('');
        setDraftBody('');
        setDraftId(null);
        toast({
          title: 'Email Scheduled',
          description: 'Your email has been scheduled successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
      }}
    />
  </div>
</div>
);
}