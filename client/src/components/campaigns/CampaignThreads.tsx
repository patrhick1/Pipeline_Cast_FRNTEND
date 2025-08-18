import { useState } from 'react';
import { useEmailThreads } from '@/hooks/useEmailThreads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  MessageSquare, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import type { EmailThread } from '@/types/inbox';

interface CampaignThreadsProps {
  campaignId: string; // UUID string
  campaignName?: string;
}

export default function CampaignThreads({ campaignId, campaignName }: CampaignThreadsProps) {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<'all' | 'replied' | 'pending'>('all');
  const { useCampaignThreads } = useEmailThreads();
  
  const { data: threads, isLoading, refetch, error } = useCampaignThreads(campaignId, {
    has_replies: filter === 'replied' ? true : filter === 'pending' ? false : undefined
  });

  const getStatusIcon = (thread: EmailThread) => {
    if (thread.classification?.category === 'booking_confirmation') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (thread.classification?.category === 'rejection') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else if (thread.unread_count === 0 && thread.message_count > 1) {
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      booked: { color: 'bg-green-100 text-green-700', label: 'Booked' },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
      replied: { color: 'bg-blue-100 text-blue-700', label: 'Replied' },
      pending: { color: 'bg-gray-100 text-gray-700', label: 'Pending' }
    };
    
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={cn('text-xs', variant.color)}>
        {variant.label}
      </Badge>
    );
  };

  const handleThreadClick = (thread: EmailThread) => {
    // Navigate to inbox with thread selected
    setLocation(`/inbox?thread=${thread.id}`);
  };

  const stats = {
    total: threads?.length || 0,
    replied: threads?.filter((t: EmailThread) => t.message_count > 1).length || 0,
    booked: threads?.filter((t: EmailThread) => t.classification?.category === 'booking_confirmation').length || 0,
    pending: threads?.filter((t: EmailThread) => t.message_count === 1).length || 0
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Conversations
            </CardTitle>
            <CardDescription>
              {campaignName ? `All email threads for ${campaignName}` : 'Campaign email threads'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Threads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.replied}</p>
            <p className="text-xs text-muted-foreground">Replies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.booked}</p>
            <p className="text-xs text-muted-foreground">Booked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Threads</TabsTrigger>
            <TabsTrigger value="replied">With Replies</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Mail className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">Unable to load email threads</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    className="mt-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              ) : threads && threads.length > 0 ? (
                <div className="space-y-3">
                  {threads.map((thread: EmailThread) => {
                    const participant = thread.participants?.[0];
                    const hasReplies = thread.message_count > 1;
                    return (
                      <Card
                        key={thread.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleThreadClick(thread)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(thread)}
                                <h4 className="font-medium text-sm">
                                  {participant?.name || participant?.email || 'Unknown'}
                                </h4>
                                {thread.classification && getStatusBadge(thread.classification.category)}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-1">
                                {thread.subject}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {participant?.email || 'No email'}
                                </span>
                                {hasReplies && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {thread.message_count - 1} {thread.message_count - 1 === 1 ? 'reply' : 'replies'}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(thread.last_message_date), 'MMM d, h:mm a')}
                                </span>
                              </div>
                            </div>
                            
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Mail className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">No email threads found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {filter === 'replied' ? 'No replies received yet' : 
                     filter === 'pending' ? 'No pending threads' : 
                     'Start sending pitches to see conversations here'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}