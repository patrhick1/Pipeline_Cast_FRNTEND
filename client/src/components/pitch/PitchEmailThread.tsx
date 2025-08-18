import { useEmailThreads } from '@/hooks/useEmailThreads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, 
  Send,
  MessageSquare,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useLocation } from 'wouter';
import type { EmailMessage } from '@/types/inbox';

interface PitchEmailThreadProps {
  pitchId: number;
  podcastName?: string;
  compact?: boolean;
}

export default function PitchEmailThread({ pitchId, podcastName, compact = false }: PitchEmailThreadProps) {
  const [, setLocation] = useLocation();
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const { usePitchThread, syncThread } = useEmailThreads();
  
  const { data: thread, isLoading, refetch } = usePitchThread(pitchId);

  const toggleMessage = (messageId: number) => {
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

  const getInitials = (name: string, email: string) => {
    if (name && name !== email) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getMessageIcon = (message: EmailMessage) => {
    // Check if message is from the client (outbound)
    const isOutbound = message.folders?.includes('sent') || false;
    if (isOutbound) {
      return <Send className="w-3 h-3 text-blue-500" />;
    }
    return <MessageSquare className="w-3 h-3 text-green-500" />;
  };

  const handleOpenInInbox = () => {
    if (thread?.id) {
      setLocation(`/inbox?thread=${thread.id}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!thread) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-32 text-gray-500">
          <Mail className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm">No email conversation yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Send a pitch to start the conversation
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact view for embedding in other components
    return (
      <Card className="cursor-pointer hover:bg-gray-50" onClick={handleOpenInInbox}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Email Thread</span>
              <Badge variant="secondary" className="text-xs">
                {thread.message_count || thread.messages?.length || 0} messages
              </Badge>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
          
          {(thread.messages?.length > 0 || thread.snippet) && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {thread.snippet || (thread.messages && thread.messages[thread.messages.length - 1]?.snippet)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {format(new Date(thread.last_message_date || new Date()), 'MMM d, h:mm a')}
                {thread.message_count > 1 && (
                  <>
                    <span>•</span>
                    <span className="text-green-600">Reply received</span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Conversation
            </CardTitle>
            <CardDescription>
              {podcastName ? `Conversation with ${podcastName}` : thread.thread.subject}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInInbox}
            >
              Open in Inbox
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Thread Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{thread.messages.length} messages</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{thread.participants?.length || 1} participants</span>
          </div>
          {thread.thread.last_reply_at && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Last reply: {format(new Date(thread.thread.last_reply_at), 'MMM d, h:mm a')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {thread.messages.map((message, index) => {
              const isExpanded = expandedMessages.has(message.message_id);
              const isLastMessage = index === thread.messages.length - 1;
              
              return (
                <Card 
                  key={message.message_id} 
                  className={cn(
                    "overflow-hidden",
                    message.direction === 'outbound' ? 'ml-8' : 'mr-8'
                  )}
                >
                  <button
                    onClick={() => toggleMessage(message.message_id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender_name, message.sender_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          {getMessageIcon(message)}
                          <p className="text-sm font-medium">
                            {message.sender_name || message.sender_email}
                          </p>
                          {message.sender_type && (
                            <Badge variant="outline" className="text-xs">
                              {message.sender_type}
                            </Badge>
                          )}
                        </div>
                        {!isExpanded && (
                          <p className="text-sm text-gray-500 truncate max-w-md">
                            {message.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.message_date), 'MMM d, h:mm a')}
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
                          <p>To: {message.recipient_emails.join(', ')}</p>
                        </div>

                        {/* Email body */}
                        {message.body_html ? (
                          <div 
                            className="prose prose-sm max-w-none text-gray-800"
                            dangerouslySetInnerHTML={{ __html: message.body_html }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap text-sm text-gray-800">
                            {message.body_text}
                          </div>
                        )}

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Attachments</p>
                            <div className="space-y-1">
                              {message.attachments.map(attachment => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 text-sm text-gray-600"
                                >
                                  <span>{attachment.filename}</span>
                                  <span className="text-gray-400">
                                    ({(attachment.size / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Source indicator */}
        {thread.source && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Data source: {thread.source === 'stored' ? 'Cached' : 'Live'}
            {thread.source === 'stored' && (
              <Button
                variant="link"
                size="sm"
                className="ml-2 text-xs p-0 h-auto"
                onClick={() => thread.thread.nylas_thread_id && syncThread.mutate(thread.thread.nylas_thread_id)}
              >
                Refresh from Nylas
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}