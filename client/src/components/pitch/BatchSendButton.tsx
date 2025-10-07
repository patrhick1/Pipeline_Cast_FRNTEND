import { Button } from '@/components/ui/button';
import { Send, Loader2, Mail, SendHorizontal } from 'lucide-react';
import { usePitchSending } from '@/hooks/usePitchSending';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface BatchSendButtonProps {
  pitchGenIds: number[];
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function BatchSendButton({
  pitchGenIds,
  disabled = false,
  variant = 'default',
  size = 'default',
  className
}: BatchSendButtonProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { 
    isEmailConnected,
    connectedEmail,
    sendBatch, 
    isSending,
    connectEmail 
  } = usePitchSending();

  const handleClick = () => {
    if (!isEmailConnected) {
      setShowConnectDialog(true);
      return;
    }
    if (pitchGenIds.length > 0) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSend = () => {
    setShowConfirmDialog(false);
    sendBatch(pitchGenIds);
  };

  const handleConnect = () => {
    setShowConnectDialog(false);
    connectEmail();
  };

  const isDisabled = disabled || isSending || pitchGenIds.length === 0;

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={className}
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending pitches and scheduling follow-ups...
          </>
        ) : (
          <>
            <SendHorizontal className="h-4 w-4 mr-2" />
            Send {pitchGenIds.length} Pitch{pitchGenIds.length !== 1 ? 'es' : ''} via Gmail
          </>
        )}
      </Button>

      {/* Email Connection Dialog */}
      <AlertDialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect Your Email</AlertDialogTitle>
            <AlertDialogDescription>
              To send pitches directly from the platform, you need to connect your Gmail account.
              This allows us to send emails on your behalf using OAuth 2.0 secure authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConnect}>
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Send</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to send {pitchGenIds.length} pitch{pitchGenIds.length !== 1 ? 'es' : ''} via your connected Gmail account ({connectedEmail}).
              <br /><br />
              Each pitch will be sent as a separate email to the respective podcast hosts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>
              <Send className="h-4 w-4 mr-2" />
              Send All Pitches
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}