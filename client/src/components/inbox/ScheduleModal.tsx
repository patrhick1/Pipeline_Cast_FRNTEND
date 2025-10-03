import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock } from 'lucide-react';
import { draftsApi, adminDraftsApi, type DraftData } from '@/services/drafts';
import { useToast } from '@/hooks/use-toast';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId?: number | null;
  emailData?: DraftData;
  threadId?: string;
  isAdminInbox?: boolean;
  adminAccountId?: number;
  onScheduled?: () => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  draftId,
  emailData,
  threadId,
  isAdminInbox = false,
  adminAccountId,
  onScheduled,
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();

  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get next Monday's date
  const getNextMondayDate = () => {
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  };

  // Quick schedule options
  const quickSchedule = async (hours: number, minutes: number, daysFromNow: number = 1, isNextMonday: boolean = false) => {
    let scheduledDate: Date;

    if (isNextMonday) {
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + daysUntilMonday);
    } else {
      scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
    }

    scheduledDate.setHours(hours, minutes, 0, 0);
    const scheduledTime = scheduledDate.toISOString();

    await handleSchedule(scheduledTime);
  };

  // Validate scheduled time
  const validateScheduledTime = (scheduledDate: Date): { valid: boolean; error?: string } => {
    const now = new Date();
    const minFutureTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now

    if (scheduledDate <= now) {
      return { valid: false, error: 'Scheduled time must be in the future' };
    }

    if (scheduledDate < minFutureTime) {
      return { valid: false, error: 'Please schedule at least 1 minute in the future' };
    }

    return { valid: true };
  };

  // Handle custom schedule
  const handleCustomSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time',
        variant: 'destructive',
      });
      return;
    }

    // Create date object in user's local timezone
    const scheduledDate = new Date(`${selectedDate}T${selectedTime}`);

    // Validate the scheduled time
    const validation = validateScheduledTime(scheduledDate);
    if (!validation.valid) {
      toast({
        title: 'Invalid Schedule Time',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // Convert to ISO string (UTC) for API
    const scheduledTime = scheduledDate.toISOString();
    await handleSchedule(scheduledTime);
  };

  // Main schedule handler
  const handleSchedule = async (scheduledTime: string) => {
    try {
      setIsScheduling(true);

      if (draftId) {
        // Update existing draft with scheduled time
        if (isAdminInbox && adminAccountId) {
          await adminDraftsApi.updateDraft(adminAccountId, draftId, {
            scheduled_send_at: scheduledTime,
          });
        } else {
          await draftsApi.updateDraft(draftId, {
            scheduled_send_at: scheduledTime,
          });
        }
      } else if (emailData) {
        // Create new scheduled draft
        const draftData = {
          ...emailData,
          thread_id: threadId,
          scheduled_send_at: scheduledTime,
        };

        if (isAdminInbox && adminAccountId) {
          await adminDraftsApi.createDraft(adminAccountId, draftData);
        } else {
          await draftsApi.createDraft(draftData);
        }
      } else {
        throw new Error('No draft or email data provided');
      }

      toast({
        title: 'Email Scheduled',
        description: `Your email will be sent on ${new Date(scheduledTime).toLocaleString()}`,
      });

      onScheduled?.();
      onClose();
    } catch (error) {
      console.error('Failed to schedule email:', error);
      toast({
        title: 'Failed to Schedule',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Send</DialogTitle>
          <DialogDescription>
            Choose when to send this email. It will be sent automatically at the scheduled time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Schedule Options */}
          <div>
            <h3 className="text-sm font-medium mb-3">Quick Schedule</h3>
            <div className="grid grid-cols-2 gap-2">
              {/* Relative time options */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const scheduledDate = new Date(Date.now() + 30 * 60 * 1000);
                  await handleSchedule(scheduledDate.toISOString());
                }}
                disabled={isScheduling}
                className="justify-start"
              >
                <Clock className="mr-2 h-4 w-4" />
                In 30 minutes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const scheduledDate = new Date(Date.now() + 60 * 60 * 1000);
                  await handleSchedule(scheduledDate.toISOString());
                }}
                disabled={isScheduling}
                className="justify-start"
              >
                <Clock className="mr-2 h-4 w-4" />
                In 1 hour
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const scheduledDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
                  await handleSchedule(scheduledDate.toISOString());
                }}
                disabled={isScheduling}
                className="justify-start"
              >
                <Clock className="mr-2 h-4 w-4" />
                In 2 hours
              </Button>

              {/* Specific time options */}
              <Button
                type="button"
                variant="outline"
                onClick={() => quickSchedule(9, 0, 1)}
                disabled={isScheduling}
                className="justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Tomorrow 9 AM
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => quickSchedule(14, 0, 1)}
                disabled={isScheduling}
                className="justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Tomorrow 2 PM
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => quickSchedule(9, 0, 0, true)}
                disabled={isScheduling}
                className="justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Next Monday 9 AM
              </Button>
            </div>
          </div>

          {/* Custom Date/Time */}
          <div>
            <h3 className="text-sm font-medium mb-3">Custom Schedule</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="schedule-date" className="text-sm text-gray-600 mb-1 block">
                  Date
                </label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="schedule-time" className="text-sm text-gray-600 mb-1 block">
                  Time (your local timezone)
                </label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-500">
                Times are in your local timezone and will be converted for sending
              </p>
              <Button
                type="button"
                onClick={handleCustomSchedule}
                disabled={!selectedDate || !selectedTime || isScheduling}
                className="w-full"
              >
                <Clock className="mr-2 h-4 w-4" />
                {isScheduling ? 'Scheduling...' : 'Schedule'}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isScheduling}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
