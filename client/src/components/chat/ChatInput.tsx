import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Type your message..." }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to recalculate
      textareaRef.current.style.height = 'auto';
      
      // Calculate new height based on scrollHeight
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 60; // Minimum height in pixels
      const maxHeight = 240; // Maximum height for ~10 lines
      
      // Set new height within bounds
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);
  
  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="p-4 border-t bg-background">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "resize-none overflow-y-auto transition-all duration-150",
            "focus:ring-1 focus:ring-primary"
          )}
          style={{ minHeight: '60px', maxHeight: '240px' }}
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}