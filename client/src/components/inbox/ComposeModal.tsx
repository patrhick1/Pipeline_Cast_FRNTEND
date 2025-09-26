import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  X, 
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ComposeEmail } from '@/types/inbox';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    threadId: string;
    messageId: string;
    subject: string;
    to: string[];
  };
}

export default function ComposeModal({ isOpen, onClose, replyTo }: ComposeModalProps) {
  const [to, setTo] = useState<string[]>(replyTo?.to || []);
  const [toInput, setToInput] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [bcc, setBcc] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject || '');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (email: ComposeEmail) => {
      // Use JSON endpoint if no attachments, multipart if attachments
      if (attachments.length === 0) {
        // Use JSON endpoint for better performance
        const res = await apiRequest('POST', '/inbox/send-json', {
          to: email.to,
          subject: email.subject,
          body: email.body,
          cc: email.cc && email.cc.length > 0 ? email.cc : undefined,
          bcc: email.bcc && email.bcc.length > 0 ? email.bcc : undefined,
          thread_id: replyTo?.threadId,
          reply_to_message_id: replyTo?.messageId,
        });
        
        if (!res.ok) throw new Error('Failed to send email');
        return res.json();
      } else {
        // Use multipart for attachments
        const formData = new FormData();
        formData.append('to', JSON.stringify(email.to));
        formData.append('subject', email.subject);
        // Note: email.body is already formatted with <br> tags from handleSend
        formData.append('body', email.body);
        
        if (email.cc && email.cc.length > 0) {
          formData.append('cc', JSON.stringify(email.cc));
        }
        if (email.bcc && email.bcc.length > 0) {
          formData.append('bcc', JSON.stringify(email.bcc));
        }
        if (replyTo) {
          formData.append('thread_id', replyTo.threadId);
          formData.append('reply_to_message_id', replyTo.messageId);
        }
        
        // Add attachments
        attachments.forEach(file => {
          formData.append('attachments', file);
        });

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inbox/send`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) throw new Error('Failed to send email');
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: 'Email sent',
        description: 'Your email has been sent successfully.',
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Failed to send',
        description: 'There was an error sending your email. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setTo([]);
    setToInput('');
    setCc([]);
    setCcInput('');
    setBcc([]);
    setBccInput('');
    setSubject('');
    setBody('');
    setAttachments([]);
    setShowCcBcc(false);
  };

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
    } else if (e.key === 'Backspace' && !input && emails.length > 0) {
      setEmails(emails.slice(0, -1));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (to.length === 0) {
      toast({
        title: 'Missing recipient',
        description: 'Please add at least one recipient.',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'Missing subject',
        description: 'Please add a subject to your email.',
        variant: 'destructive',
      });
      return;
    }

    if (!body.trim()) {
      toast({
        title: 'Missing message',
        description: 'Please write a message.',
        variant: 'destructive',
      });
      return;
    }

    // Convert line breaks to HTML <br> tags to preserve formatting
    const formattedBody = body
      .split('\n')
      .map(line => line || '&nbsp;') // Preserve empty lines
      .join('<br>');

    sendEmailMutation.mutate({
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      body: formattedBody,
      attachments,
      reply_to_message_id: replyTo?.messageId,
      thread_id: replyTo?.threadId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 space-y-3 border-b">
            {/* To field */}
            <div className="flex items-start gap-2">
              <Label className="w-12 pt-2 text-sm text-gray-600">To</Label>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  {to.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email, to, setTo)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, toInput, to, setTo, setToInput)}
                    onBlur={() => handleAddEmail(toInput, to, setTo, setToInput)}
                    placeholder="Add recipients..."
                    className="flex-1 min-w-[200px] border-0 shadow-none px-0 focus-visible:ring-0"
                  />
                </div>
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

            {/* CC field */}
            {showCcBcc && (
              <>
                <div className="flex items-start gap-2">
                  <Label className="w-12 pt-2 text-sm text-gray-600">Cc</Label>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      {cc.map(email => (
                        <Badge key={email} variant="secondary" className="gap-1">
                          {email}
                          <button
                            onClick={() => handleRemoveEmail(email, cc, setCc)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <Input
                        value={ccInput}
                        onChange={(e) => setCcInput(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, ccInput, cc, setCc, setCcInput)}
                        onBlur={() => handleAddEmail(ccInput, cc, setCc, setCcInput)}
                        placeholder="Add Cc recipients..."
                        className="flex-1 min-w-[200px] border-0 shadow-none px-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* BCC field */}
                <div className="flex items-start gap-2">
                  <Label className="w-12 pt-2 text-sm text-gray-600">Bcc</Label>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      {bcc.map(email => (
                        <Badge key={email} variant="secondary" className="gap-1">
                          {email}
                          <button
                            onClick={() => handleRemoveEmail(email, bcc, setBcc)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <Input
                        value={bccInput}
                        onChange={(e) => setBccInput(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, bccInput, bcc, setBcc, setBccInput)}
                        onBlur={() => handleAddEmail(bccInput, bcc, setBcc, setBccInput)}
                        placeholder="Add Bcc recipients..."
                        className="flex-1 min-w-[200px] border-0 shadow-none px-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Subject field */}
            <div className="flex items-center gap-2">
              <Label className="w-12 text-sm text-gray-600">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 border-0 shadow-none px-0 focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Message body */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your message..."
              className="min-h-full border-0 shadow-none resize-none focus-visible:ring-0"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-6 py-3 border-t bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    <Paperclip className="w-3 h-3" />
                    {file.name}
                    <button
                      onClick={() => handleRemoveAttachment(index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend}
                disabled={sendEmailMutation.isPending}
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}