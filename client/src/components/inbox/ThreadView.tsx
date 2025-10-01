import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useEmailThreads } from '@/hooks/useEmailThreads';
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave';
import { useDraftLoader } from '@/hooks/useDraftLoader';
import { draftsApi } from '@/services/drafts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from './RichTextEditor';
import { ScheduleModal } from './ScheduleModal';
import {
  X,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  Archive,
  Star,
  MoreVertical,
  Paperclip,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  RefreshCw,
  Code,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { EmailThread, EmailMessage, SmartReply } from '@/types/inbox';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SmartReplies from './SmartReplies';

interface ThreadViewProps {
  threadId: string;
  onClose: () => void;
  onReply: (messageId: string) => void;
}

export default function ThreadView({ threadId, onClose, onReply }: ThreadViewProps) {
  const [replyMode, setReplyMode] = useState<'reply' | 'replyAll' | 'forward' | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [selectedSmartReply, setSelectedSmartReply] = useState<string | null>(null);
  const [viewModes, setViewModes] = useState<Record<string, 'auto' | 'html' | 'text'>>({});
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use hybrid approach - try stored thread first, fallback to Nylas
  const { useStoredThread } = useEmailThreads();
  const { data: thread, isLoading } = useStoredThread(threadId);

  // Load existing draft for this thread
  const { draft: existingDraft, isLoading: loadingDraft } = useDraftLoader({
    threadId,
    enabled: !!thread,
  });

  // Get email metadata for auto-save
  const emailMetadata = thread?.messages && thread.messages.length > 0
    ? {
        to: [('from_email' in thread ? thread.from_email : null) || thread.messages[0]?.sender_email || ''],
        subject: ('subject' in thread ? thread.subject : 'thread' in thread ? thread.thread.subject : '') || '',
        reply_to_message_id: (() => {
          const lastMsg = thread.messages[thread.messages.length - 1] as any;
          if ('id' in lastMsg) return lastMsg.id;
          if ('nylas_message_id' in lastMsg) return lastMsg.nylas_message_id;
          return lastMsg.message_id?.toString();
        })() || undefined,
      }
    : { to: [], subject: '' };

  // Auto-save hook for reply content
  const {
    body: replyContent,
    setBody: setReplyContent,
    draftId,
    setDraftId,
    isSaving,
    lastSavedAt,
  } = useDraftAutoSave({
    threadId,
    initialBody: existingDraft?.body || '',
    emailMetadata,
    isAdminInbox: false,
  });

  // Populate reply box when draft loads
  useEffect(() => {
    if (existingDraft && existingDraft.body && !replyMode) {
      setReplyContent(existingDraft.body);
      setDraftId(existingDraft.draft_id);
      setReplyMode('reply'); // Auto-open reply mode if draft exists
    }
  }, [existingDraft]);

  // Generate smart reply
  const { data: smartReplies } = useQuery<SmartReply[]>({
    queryKey: [`/inbox/threads/${threadId}/smart-replies`],
    enabled: !!thread && thread.messages && thread.messages.length > 0,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (data: { 
      content: string; 
      replyAll: boolean;
      messageId: string;
    }) => {
      const res = await apiRequest('POST', `/inbox/messages/${data.messageId}/reply`, {
        body: data.content,
        reply_all: data.replyAll
      });
      if (!res.ok) throw new Error('Failed to send reply');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent successfully.',
      });
      setReplyMode(null);
      setReplyContent('');
      setShowSmartReplies(false);
      queryClient.invalidateQueries({ queryKey: [`/inbox/threads/${threadId}`] });
    },
    onError: () => {
      toast({
        title: 'Failed to send',
        description: 'There was an error sending your reply. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Archive thread mutation
  const archiveThreadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/inbox/threads/${threadId}/archive`);
      if (!res.ok) throw new Error('Failed to archive thread');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thread archived',
        description: 'This conversation has been archived.',
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/inbox/threads/${threadId}`);
      if (!res.ok) throw new Error('Failed to delete thread');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thread deleted',
        description: 'This conversation has been moved to trash.',
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Auto-expand last message
  useEffect(() => {
    if (thread?.messages && thread.messages.length > 0) {
      const lastMessage = thread.messages[thread.messages.length - 1] as any;
      const lastMessageId = (() => {
        if ('id' in lastMessage) return lastMessage.id;
        if ('nylas_message_id' in lastMessage) return lastMessage.nylas_message_id;
        return lastMessage.message_id?.toString() || '';
      })();
      setExpandedMessages(new Set([lastMessageId]));
    }
  }, [thread]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [thread?.messages]);

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
    // Create a quoted version of the original message
    const from = message.from?.[0]?.name || message.from?.[0]?.email || message.sender_name || message.sender_email || 'Unknown';
    const date = format(new Date(message.date || message.message_date || new Date()), 'MMM d, yyyy, h:mm a');
    const header = `\n\nOn ${date}, ${from} wrote:\n`;

    if (message.body_text) {
      // Quote plain text by adding > to each line
      const quotedLines = message.body_text.split('\n').map((line: string) => `> ${line}`).join('\n');
      return header + quotedLines;
    } else if (message.body_html) {
      // Strip HTML and quote as plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.body_html;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      const quotedLines = plainText.split('\n').map((line: string) => `> ${line}`).join('\n');
      return header + quotedLines;
    } else if (message.body) {
      // Fallback for legacy data
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.body;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      const quotedLines = plainText.split('\n').map((line: string) => `> ${line}`).join('\n');
      return header + quotedLines;
    }

    return '';
  };

  const handleSmartReplySelect = (reply: SmartReply) => {
    setReplyContent(reply.draft);
    setSelectedSmartReply(reply.id);
    setReplyMode('reply');
  };

  const handleNewSmartReplySelect = (text: string) => {
    setReplyContent(text);
    setReplyMode('reply');
    setShowSmartReplies(false);
  };

  const handleSendReply = async () => {
    if (!thread?.messages || thread.messages.length === 0) return;

    // If we have a draft, send it using the drafts API
    if (draftId) {
      try {
        await draftsApi.sendDraft(draftId);
        toast({
          title: 'Reply sent',
          description: 'Your reply has been sent successfully.',
        });
        setReplyMode(null);
        setReplyContent('');
        setDraftId(null);
        setShowSmartReplies(false);
        queryClient.invalidateQueries({ queryKey: [`/inbox/threads/${threadId}`] });
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
      } catch (error) {
        toast({
          title: 'Failed to send',
          description: 'There was an error sending your reply. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Send as regular reply (non-draft)
      const lastMessage = thread.messages[thread.messages.length - 1] as any;
      const messageId = (() => {
        if ('id' in lastMessage) return lastMessage.id;
        if ('nylas_message_id' in lastMessage) return lastMessage.nylas_message_id;
        return lastMessage.message_id?.toString() || '';
      })();

      sendReplyMutation.mutate({
        content: replyContent,
        replyAll: replyMode === 'replyAll',
        messageId: messageId
      });
    }
  };

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-gray-500">Thread not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {'subject' in thread ? thread.subject : 'thread' in thread ? thread.thread.subject : 'No Subject'}
            </h2>
            <p className="text-sm text-gray-500">
              {(() => {
                // If we have participants array with data, use it
                if (thread.participants && thread.participants.length > 0) {
                  return thread.participants.map(p => p.name || p.email).join(', ');
                }

                // Otherwise, try to build participant list from messages
                if (thread.messages && thread.messages.length > 0) {
                  const participantSet = new Set<string>();
                  thread.messages.forEach(msg => {
                    if (msg.sender_name) {
                      participantSet.add(msg.sender_name);
                    } else if (msg.sender_email) {
                      participantSet.add(msg.sender_email);
                    }
                  });

                  if (participantSet.size > 0) {
                    return Array.from(participantSet).join(', ');
                  }
                }

                // Fallback to thread-level sender info
                if ('from_email' in thread) return thread.from_email || thread.from_name || 'Unknown participants';
                return 'Unknown participants';
              })()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => archiveThreadMutation.mutate()}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteThreadMutation.mutate()}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                <DropdownMenuItem>Add label</DropdownMenuItem>
                <DropdownMenuItem>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {thread.messages?.map((message, index) => {
            const msg = message as any;
            const messageId = (() => {
              if ('id' in msg) return msg.id;
              if ('nylas_message_id' in msg) return msg.nylas_message_id;
              return msg.message_id?.toString() || '';
            })();
            const isExpanded = expandedMessages.has(messageId);
            const isLastMessage = index === thread.messages!.length - 1;

            return (
              <Card key={messageId} className="overflow-hidden">
                <button
                  onClick={() => toggleMessageExpansion(messageId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(() => {
                          const email = ('from' in message && message.from?.[0]?.email) || ('sender_email' in message && message.sender_email) || '';
                          const name = ('from' in message && message.from?.[0]?.name) || ('sender_name' in message && message.sender_name) || undefined;
                          return getInitials(email, name);
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium">
                          {(() => {
                            if ('from' in message && message.from?.[0]) {
                              return message.from[0].name || message.from[0].email;
                            }
                            if ('sender_name' in message && message.sender_name) {
                              return message.sender_name;
                            }
                            if ('sender_email' in message && message.sender_email) {
                              return message.sender_email;
                            }
                            return 'Unknown';
                          })()}
                        </p>
                        {('direction' in message && message.direction === 'inbound') ? (
                          <ArrowDownLeft className="w-3 h-3 text-green-500" />
                        ) : ('direction' in message && message.direction === 'outbound') ? (
                          <ArrowUpRight className="w-3 h-3 text-blue-500" />
                        ) : null}
                      </div>
                      {!isExpanded && (
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          {'snippet' in message ? message.snippet : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {format(new Date(('date' in message ? message.date : message.message_date) || new Date()), 'MMM d, h:mm a')}
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
                        <p className="flex items-start">
                          <span className="font-medium mr-1">To:</span>
                          <span>{(() => {
                            // First try the structured to field
                            if ('to' in message && message.to && message.to.length > 0) {
                              return message.to.map(t => t.name ? `${t.name} <${t.email}>` : t.email).join(', ');
                            }
                            // Then try recipient_emails array
                            if ('recipient_emails' in message && message.recipient_emails && message.recipient_emails.length > 0) {
                              return message.recipient_emails.join(', ');
                            }
                            // Fallback
                            return 'No recipients';
                          })()}</span>
                        </p>
                        {(() => {
                          // Handle cc emails - could be EmailParticipant[] or string[]
                          const ccEmails = 'cc' in message && message.cc
                            ? (Array.isArray(message.cc) && message.cc.length > 0
                                ? (typeof message.cc[0] === 'string'
                                    ? message.cc
                                    : message.cc.map((p: any) => p.name ? `${p.name} <${p.email}>` : p.email))
                                : [])
                            : [];
                          return ccEmails.length > 0 && (
                            <p className="flex items-start">
                              <span className="font-medium mr-1">Cc:</span>
                              <span>{ccEmails.join(', ')}</span>
                            </p>
                          );
                        })()}
                        {(() => {
                          // Handle bcc emails - could be EmailParticipant[] or string[]
                          const bccEmails = 'bcc' in message && message.bcc
                            ? (Array.isArray(message.bcc) && message.bcc.length > 0
                                ? (typeof message.bcc[0] === 'string'
                                    ? message.bcc
                                    : message.bcc.map((p: any) => p.name ? `${p.name} <${p.email}>` : p.email))
                                : [])
                            : [];
                          return bccEmails.length > 0 && (
                            <p className="flex items-start">
                              <span className="font-medium mr-1">Bcc:</span>
                              <span>{bccEmails.join(', ')}</span>
                            </p>
                          );
                        })()}
                      </div>

                      {/* Format toggle only if we have both HTML and actual plain text */}
                      {(() => {
                        const bodyText = 'body_text' in message ? message.body_text : undefined;
                        const bodyHtml = 'body_html' in message ? message.body_html : undefined;
                        const bodyTextHasHtml = bodyText && /<[^>]+>/.test(bodyText);
                        // Only show toggle if we have body_html AND body_text that isn't HTML
                        if (bodyHtml && bodyText && !bodyTextHasHtml) {
                          return (
                            <div className="flex gap-1 mb-3">
                              <Button
                                variant={viewModes[messageId] === 'text' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewModes(prev => ({ ...prev, [messageId]: 'text' }))}
                                className="h-7 text-xs"
                              >
                                <Code className="w-3 h-3 mr-1" />
                                Plain Text
                              </Button>
                              <Button
                                variant={viewModes[messageId] !== 'text' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewModes(prev => ({ ...prev, [messageId]: 'html' }))}
                                className="h-7 text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Rich Text
                              </Button>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Email body */}
                      {(() => {
                        const viewMode = viewModes[messageId] || 'auto';
                        const bodyText = 'body_text' in message ? message.body_text : undefined;
                        const bodyHtml = 'body_html' in message ? message.body_html : undefined;
                        const bodyLegacy = 'body' in message ? message.body : undefined;

                        // Check if body_text contains HTML tags
                        const bodyTextHasHtml = bodyText && /<[^>]+>/.test(bodyText);

                        // If we have body_html, use it
                        if (bodyHtml) {
                          if (viewMode === 'text' && bodyText && !bodyTextHasHtml) {
                            // Show plain text if explicitly requested and it's actually plain
                            return (
                              <div className="text-gray-800 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-3 rounded">
                                {bodyText}
                              </div>
                            );
                          }
                          return (
                            <div
                              className="prose prose-sm max-w-none text-gray-800 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:ml-0 [&_blockquote]:text-gray-600"
                              dangerouslySetInnerHTML={{ __html: bodyHtml }}
                            />
                          );
                        }

                        // If body_text contains HTML, render it as HTML
                        if (bodyTextHasHtml && bodyText) {
                          return (
                            <div
                              className="prose prose-sm max-w-none text-gray-800 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:ml-0 [&_blockquote]:text-gray-600"
                              dangerouslySetInnerHTML={{ __html: bodyText }}
                            />
                          );
                        }

                        // If body_text is plain text, show it as plain
                        if (bodyText) {
                          return (
                            <div className="text-gray-800 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-3 rounded">
                              {bodyText}
                            </div>
                          );
                        }

                        // Fallback for legacy data with only body field
                        if (bodyLegacy) {
                          return (
                            <div
                              className="prose prose-sm max-w-none text-gray-800 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:ml-0 [&_blockquote]:text-gray-600"
                              dangerouslySetInnerHTML={{ __html: bodyLegacy }}
                            />
                          );
                        }

                        // No content available
                        return (
                          <div className="text-gray-500 italic">No message content available</div>
                        );
                      })()}

                      {/* Attachments */}
                      {('attachments' in message && message.attachments && message.attachments.length > 0) && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Attachments</p>
                          <div className="space-y-2">
                            {message.attachments.map(attachment => (
                              <button
                                key={attachment.id}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                              >
                                <Paperclip className="w-4 h-4" />
                                <span>{attachment.filename}</span>
                                <span className="text-gray-500">
                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                </span>
                                <Download className="w-3 h-3 ml-auto" />
                              </button>
                            ))}
                          </div>
                        </div>
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
          })}
        </div>

        {/* New AI-Powered Smart Replies from Backend */}
        {!replyMode && thread?.messages && thread.messages.length > 0 && (
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
                threadId={threadId}
                onSelectReply={handleNewSmartReplySelect}
              />
            )}
          </div>
        )}

        {/* Existing Smart Replies (from different system) */}
        {smartReplies && smartReplies.length > 0 && !replyMode && (
          <Card className="mt-4 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-medium">Suggested Replies</h3>
            </div>
            <div className="space-y-2">
              {smartReplies.map(reply => (
                <button
                  key={reply.id}
                  onClick={() => handleSmartReplySelect(reply)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {reply.tone}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {Math.round(reply.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {reply.draft}
                  </p>
                </button>
              ))}
            </div>
          </Card>
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
        threadId={threadId}
        isAdminInbox={false}
        onScheduled={() => {
          setShowScheduleModal(false);
          setReplyMode(null);
          setReplyContent('');
          setDraftId(null);
          toast({
            title: 'Email Scheduled',
            description: 'Your email has been scheduled successfully.',
          });
          queryClient.invalidateQueries({ queryKey: ['drafts'] });
        }}
      />
    </div>
  );
}