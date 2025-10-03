import { apiRequest } from '@/lib/queryClient';

export interface DraftData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  thread_id?: string;
  reply_to_message_id?: string | number; // Accept both, will convert to string
  scheduled_send_at?: string; // ISO 8601 format
}

export interface Draft {
  draft_id: number;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  snippet?: string;
  status: 'draft' | 'scheduled';
  scheduled_send_at?: string | null;
  thread_id?: string;
  reply_to_message_id?: string;
  last_edited_at: string;
  created_at: string;
}

export interface DraftListResponse {
  drafts: Draft[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateDraftResponse {
  status: string;
  draft_id: number;
  message_status: 'draft' | 'scheduled';
  scheduled_send_at?: string;
  created_at: string;
}

export interface UpdateDraftResponse {
  status: string;
  draft_id: number;
  message_status: 'draft' | 'scheduled';
  scheduled_send_at?: string;
  last_edited_at: string;
}

export interface SendDraftResponse {
  status: string;
  message_id: string;
  sent_at: string;
}

/**
 * Client Inbox Drafts API Service
 * Uses authenticated user's grant_id from session (no account_id needed)
 */
export const draftsApi = {
  /**
   * Create a new draft
   */
  async createDraft(draftData: DraftData): Promise<CreateDraftResponse> {
    // Ensure reply_to_message_id is a string if provided
    const payload = {
      ...draftData,
      reply_to_message_id: draftData.reply_to_message_id !== undefined
        ? String(draftData.reply_to_message_id)
        : undefined
    };

    const response = await apiRequest('POST', '/inbox/drafts', payload);
    if (!response.ok) {
      throw new Error('Failed to create draft');
    }
    return response.json();
  },

  /**
   * Update an existing draft
   */
  async updateDraft(draftId: number, updates: Partial<DraftData>): Promise<UpdateDraftResponse> {
    // Ensure reply_to_message_id is a string if provided
    const payload = {
      ...updates,
      reply_to_message_id: updates.reply_to_message_id !== undefined
        ? String(updates.reply_to_message_id)
        : undefined
    };

    const response = await apiRequest('PATCH', `/inbox/drafts/${draftId}`, payload);
    if (!response.ok) {
      throw new Error('Failed to update draft');
    }
    return response.json();
  },

  /**
   * Get a specific draft by ID
   */
  async getDraft(draftId: number): Promise<Draft> {
    const response = await apiRequest('GET', `/inbox/drafts/${draftId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch draft');
    }
    return response.json();
  },

  /**
   * List all drafts with pagination
   */
  async listDrafts(limit = 50, offset = 0): Promise<DraftListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const response = await apiRequest('GET', `/inbox/drafts?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch drafts');
    }
    return response.json();
  },

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: number): Promise<{ status: string; message: string }> {
    const response = await apiRequest('DELETE', `/inbox/drafts/${draftId}`);
    if (!response.ok) {
      throw new Error('Failed to delete draft');
    }
    return response.json();
  },

  /**
   * Send a draft immediately
   */
  async sendDraft(draftId: number): Promise<SendDraftResponse> {
    const response = await apiRequest('POST', `/inbox/drafts/${draftId}/send`);
    if (!response.ok) {
      throw new Error('Failed to send draft');
    }
    return response.json();
  },
};

/**
 * Admin Inbox Drafts API Service
 * All endpoints require account_id query parameter
 */
export const adminDraftsApi = {
  /**
   * Create a new draft for an admin account
   */
  async createDraft(accountId: number, draftData: DraftData): Promise<CreateDraftResponse> {
    // Ensure reply_to_message_id is a string if provided
    const payload = {
      ...draftData,
      reply_to_message_id: draftData.reply_to_message_id !== undefined
        ? String(draftData.reply_to_message_id)
        : undefined
    };

    const response = await apiRequest('POST', `/api/admin/inbox/drafts?account_id=${accountId}`, payload);
    if (!response.ok) {
      throw new Error('Failed to create draft');
    }
    return response.json();
  },

  /**
   * Update an existing draft
   */
  async updateDraft(accountId: number, draftId: number, updates: Partial<DraftData>): Promise<UpdateDraftResponse> {
    // Ensure reply_to_message_id is a string if provided
    const payload = {
      ...updates,
      reply_to_message_id: updates.reply_to_message_id !== undefined
        ? String(updates.reply_to_message_id)
        : undefined
    };

    const response = await apiRequest('PATCH', `/api/admin/inbox/drafts/${draftId}?account_id=${accountId}`, payload);
    if (!response.ok) {
      throw new Error('Failed to update draft');
    }
    return response.json();
  },

  /**
   * Get a specific draft by ID
   */
  async getDraft(accountId: number, draftId: number): Promise<Draft> {
    const response = await apiRequest('GET', `/api/admin/inbox/drafts/${draftId}?account_id=${accountId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch draft');
    }
    return response.json();
  },

  /**
   * List all drafts with pagination
   */
  async listDrafts(accountId: number, limit = 50, offset = 0): Promise<DraftListResponse> {
    const params = new URLSearchParams({
      account_id: accountId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const response = await apiRequest('GET', `/api/admin/inbox/drafts?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch drafts');
    }
    return response.json();
  },

  /**
   * Delete a draft
   */
  async deleteDraft(accountId: number, draftId: number): Promise<{ status: string; message: string }> {
    const response = await apiRequest('DELETE', `/api/admin/inbox/drafts/${draftId}?account_id=${accountId}`);
    if (!response.ok) {
      throw new Error('Failed to delete draft');
    }
    return response.json();
  },

  /**
   * Send a draft immediately
   */
  async sendDraft(accountId: number, draftId: number): Promise<SendDraftResponse> {
    const response = await apiRequest('POST', `/api/admin/inbox/drafts/${draftId}/send?account_id=${accountId}`);
    if (!response.ok) {
      throw new Error('Failed to send draft');
    }
    return response.json();
  },
};
