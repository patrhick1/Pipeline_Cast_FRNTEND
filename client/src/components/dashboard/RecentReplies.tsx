import { useEmailThreads } from '@/hooks/useEmailThreads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Clock,
  Mail,
  User,
  ChevronRight,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import type { EmailThread } from '@/types/inbox';

interface RecentRepliesProps {
  campaignId?: string; // UUID string
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export default function RecentReplies({ 
  campaignId, 
  limit = 10, 
  showHeader = true, 
  compact = false 
}: RecentRepliesProps) {
  const [, setLocation] = useLocation();
  const { useRecentReplies, markThreadAsRead } = useEmailThreads();
  
  const { data: replies, isLoading, refetch, error } = useRecentReplies({
    campaign_id: campaignId,
    limit
  });

  const handleReplyClick = (thread: EmailThread) => {
    // Mark as read if unread
    if (thread.unread_count > 0) {
      markThreadAsRead.mutate(thread.id);
    }
    // Navigate to inbox with thread selected
    setLocation(`/inbox?thread=${thread.id}`);
  };

  // Ensure replies is always an array
  const repliesArray = Array.isArray(replies) ? replies : [];
  const unreadCount = repliesArray.filter((t: EmailThread) => t.unread_count > 0).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    console.error('Error fetching recent replies:', error);
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-32 text-gray-500">
          <Mail className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm">Unable to load recent replies</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!repliesArray || repliesArray.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Replies
            </CardTitle>
            <CardDescription>
              No new replies yet
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className="flex flex-col items-center justify-center h-32 text-gray-500">
          <Mail className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm">No replies received</p>
          <p className="text-xs text-gray-400 mt-1">
            New replies will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact widget view for dashboards
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <CardTitle className="text-base">Recent Replies</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-7 px-2"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {repliesArray.slice(0, 5).map((thread: EmailThread) => (
              <button
                key={thread.id}
                onClick={() => handleReplyClick(thread)}
                className={cn(
                  "w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors",
                  thread.unread_count > 0 && "bg-blue-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(thread.last_message_date), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {thread.snippet}
                </p>
              </button>
            ))}
          </div>
          {repliesArray.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setLocation('/inbox')}
            >
              View all {repliesArray.length} replies
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Replies
                {unreadCount > 0 && (
                  <Badge variant="destructive">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Latest responses from podcast hosts
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {repliesArray.map((thread: EmailThread) => {
              const participant = thread.participants?.[0];
              return (
                <Card
                  key={thread.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all",
                    thread.unread_count > 0 && "border-blue-200 bg-blue-50/50"
                  )}
                  onClick={() => handleReplyClick(thread)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {thread.unread_count > 0 && (
                          <Bell className="w-4 h-4 text-blue-500" />
                        )}
                        <div>
                          <h4 className="font-medium text-sm">
                            {participant?.name || participant?.email || 'Unknown'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {participant?.email || ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {format(new Date(thread.last_message_date), 'MMM d, h:mm a')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(thread.last_message_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {thread.subject}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {thread.snippet}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {thread.classification && (
                        <Badge variant="outline" className="text-xs">
                          {thread.classification.category}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View Thread
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Auto-refreshing every minute
        </div>
      </CardContent>
    </Card>
  );
}