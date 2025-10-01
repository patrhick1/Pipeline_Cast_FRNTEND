import { useState, useEffect, useRef } from 'react';
import { draftsApi, adminDraftsApi, type DraftData } from '@/services/drafts';

interface EmailMetadata {
  to: string[];
  cc?: string[];
  subject: string;
  reply_to_message_id?: string;
}

interface UseDraftAutoSaveOptions {
  threadId?: string;
  initialBody?: string;
  emailMetadata: EmailMetadata;
  isAdminInbox?: boolean;
  adminAccountId?: number;
  onSaveSuccess?: (draftId: number) => void;
  onSaveError?: (error: Error) => void;
}

interface UseDraftAutoSaveReturn {
  body: string;
  setBody: (body: string) => void;
  draftId: number | null;
  setDraftId: (id: number | null) => void;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveDraft: () => Promise<void>;
  error: Error | null;
}

/**
 * Auto-save draft hook with debouncing
 *
 * Features:
 * - Automatically saves draft 2 seconds after user stops typing
 * - Creates draft on first save, updates on subsequent saves
 * - Doesn't save empty drafts
 * - Saves on unmount (when user navigates away)
 * - Works with both client and admin inbox
 */
export function useDraftAutoSave({
  threadId,
  initialBody = '',
  emailMetadata,
  isAdminInbox = false,
  adminAccountId,
  onSaveSuccess,
  onSaveError,
}: UseDraftAutoSaveOptions): UseDraftAutoSaveReturn {
  const [body, setBody] = useState(initialBody);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedBodyRef = useRef(initialBody);
  const isMountedRef = useRef(true);

  // Validate admin inbox has account ID
  useEffect(() => {
    if (isAdminInbox && !adminAccountId) {
      console.error('Admin inbox requires adminAccountId');
    }
  }, [isAdminInbox, adminAccountId]);

  // Save draft function
  const saveDraft = async () => {
    // Don't save if body is empty or unchanged
    if (!body.trim() || body === lastSavedBodyRef.current) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const draftData: DraftData = {
        to: emailMetadata.to,
        cc: emailMetadata.cc,
        subject: emailMetadata.subject,
        body: body,
        thread_id: threadId,
        reply_to_message_id: emailMetadata.reply_to_message_id,
      };

      if (draftId) {
        // Update existing draft
        if (isAdminInbox && adminAccountId) {
          await adminDraftsApi.updateDraft(adminAccountId, draftId, { body });
        } else {
          await draftsApi.updateDraft(draftId, { body });
        }
      } else {
        // Create new draft
        let result;
        if (isAdminInbox && adminAccountId) {
          result = await adminDraftsApi.createDraft(adminAccountId, draftData);
        } else {
          result = await draftsApi.createDraft(draftData);
        }
        setDraftId(result.draft_id);
        onSaveSuccess?.(result.draft_id);
      }

      lastSavedBodyRef.current = body;
      setLastSavedAt(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save draft');
      setError(error);
      onSaveError?.(error);
      console.error('Failed to auto-save draft:', error);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Debounced auto-save when body changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 2 seconds
    debounceTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [body]);

  // Save on unmount (when user navigates away)
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // If there are unsaved changes, save them
      if (body !== lastSavedBodyRef.current && body.trim()) {
        // Force immediate save without waiting for debounce
        // Note: This is a best-effort save, may not complete if page unloads quickly
        saveDraft();
      }
    };
  }, []);

  return {
    body,
    setBody,
    draftId,
    setDraftId,
    isSaving,
    lastSavedAt,
    saveDraft,
    error,
  };
}
