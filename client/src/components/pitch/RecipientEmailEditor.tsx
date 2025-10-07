import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit3, Check, X, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RecipientEmailEditorProps {
  pitchGenId: number;
  currentEmail?: string | null;
  onEmailUpdated?: (newEmail: string) => void;
  compact?: boolean;
  method?: 'PUT' | 'PATCH'; // Allow customizing the HTTP method
  userRole?: string | null; // Add userRole to determine edit permissions
}

export function RecipientEmailEditor({
  pitchGenId,
  currentEmail,
  onEmailUpdated,
  compact = false,
  method = 'PUT', // Default to PUT for backward compatibility
  userRole = null
}: RecipientEmailEditorProps) {
  const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmail, setTempEmail] = useState(currentEmail || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!tempEmail || !tempEmail.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiRequest(method, `/pitches/generations/${pitchGenId}/content`, {
        recipient_email: tempEmail
      });

      if (response.ok) {
        toast({
          title: 'Email Updated',
          description: 'Recipient email has been updated successfully.'
        });
        setIsEditing(false);
        onEmailUpdated?.(tempEmail);
      } else {
        throw new Error('Failed to update email');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update recipient email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempEmail(currentEmail || '');
  };

  // For clients, show read-only view
  if (!isAdminOrStaff) {
    if (compact) {
      return (
        <div className="flex items-center gap-1 text-xs">
          <Mail className="h-3 w-3 text-gray-500" />
          <span className="text-gray-600">
            {currentEmail || 'Email configured'}
          </span>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Recipient Email</label>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4 text-gray-500" />
          <span>{currentEmail || 'Email configured by admin'}</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs">
        {isEditing ? (
          <>
            <Input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="Enter email"
              className="h-7 text-xs w-48"
              disabled={isUpdating}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={isUpdating}
              className="h-7 w-7 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isUpdating}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            <Mail className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">
              {currentEmail || 'No email set'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(true);
                setTempEmail(currentEmail || '');
              }}
              className="h-5 w-5 p-0 ml-1"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Recipient Email</label>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="Enter recipient email"
              className="flex-1"
              disabled={isUpdating}
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 bg-gray-50 p-2 rounded flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {currentEmail || 'No recipient email set'}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(true);
                setTempEmail(currentEmail || '');
              }}
            >
              <Edit3 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}