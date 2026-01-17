import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Sparkles, 
  ThumbsUp, 
  Info, 
  ThumbsDown,
  Edit,
  Send,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SmartReply {
  type: 'positive' | 'neutral' | 'decline';
  text: string;
}

interface SmartRepliesResponse {
  thread_id: string;
  replies: SmartReply[];
}

interface SmartRepliesProps {
  threadId: string;
  onSelectReply: (text: string) => void;
  className?: string;
}

export default function SmartReplies({ threadId, onSelectReply, className }: SmartRepliesProps) {
  const [editingReply, setEditingReply] = useState<SmartReply | null>(null);
  const [editedText, setEditedText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch smart replies
  const { data, isLoading, error, refetch } = useQuery<SmartRepliesResponse>({
    queryKey: [`/inbox/threads/${threadId}/smart-replies`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/inbox/threads/${threadId}/smart-replies`);
      if (!res.ok) throw new Error('Failed to fetch smart replies');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 1, // Only retry once since we have fallback replies
  });

  const getReplyIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 'neutral':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'decline':
        return <ThumbsDown className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getReplyLabel = (type: string) => {
    switch (type) {
      case 'positive':
        return 'Accept';
      case 'neutral':
        return 'Need Info';
      case 'decline':
        return 'Decline';
      default:
        return type;
    }
  };

  const getReplyVariant = (type: string): "default" | "secondary" | "outline" | "destructive" | null => {
    switch (type) {
      case 'positive':
        return 'default';
      case 'neutral':
        return 'secondary';
      case 'decline':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleQuickSelect = (reply: SmartReply) => {
    onSelectReply(reply.text);
    toast({
      title: 'Smart reply selected',
      description: 'You can now edit and send your message.',
    });
  };

  const handleEdit = (reply: SmartReply) => {
    setEditingReply(reply);
    setEditedText(reply.text);
  };

  const handleSaveEdit = () => {
    if (editedText.trim()) {
      onSelectReply(editedText);
      setEditingReply(null);
      setEditedText('');
      toast({
        title: 'Reply customized',
        description: 'Your edited reply has been added to the compose area.',
      });
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: 'Copied to clipboard',
        description: 'The reply has been copied to your clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy text to clipboard.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
          <h3 className="text-sm font-medium">Generating smart replies...</h3>
        </div>
      </Card>
    );
  }

  if (error || !data?.replies || data.replies.length === 0) {
    return null; // Don't show anything if there's an error or no replies
  }

  return (
    <>
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-medium">Smart Replies</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-7 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
        
        <div className="space-y-2">
          {data.replies.map((reply, index) => (
            <div
              key={index}
              className="group relative p-3 rounded-lg border hover:bg-gray-50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getReplyIcon(reply.type)}
                  <Badge 
                    variant={getReplyVariant(reply.type)}
                    className="text-xs"
                  >
                    {getReplyLabel(reply.type)}
                  </Badge>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(reply.text, index)}
                    className="h-7 w-7 p-0"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(reply)}
                    className="h-7 w-7 p-0"
                    title="Edit reply"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                {reply.text}
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(reply)}
                className="w-full h-8 text-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                Use this reply
              </Button>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          Click to use as-is or edit before sending
        </p>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingReply} onOpenChange={() => setEditingReply(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Customize Smart Reply
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {editingReply && getReplyIcon(editingReply.type)}
              <Badge variant={editingReply && getReplyVariant(editingReply.type)}>
                {editingReply && getReplyLabel(editingReply.type)}
              </Badge>
            </div>
            
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Edit your reply..."
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingReply(null);
                setEditedText('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Send className="w-4 h-4 mr-2" />
              Use Edited Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}