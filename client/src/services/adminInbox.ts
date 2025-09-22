import { apiRequest } from '@/lib/queryClient';

export interface AdminSendingAccount {
  id: number;
  email_address: string;
  sending_name: string;
  is_active: boolean;
  daily_send_limit: number;
  sends_today: number;
  last_used_at: string | null;
  has_grant: boolean;
}

export interface EmailThread {
  thread_id: string;
  subject: string;
  snippet: string;
  from_name: string;
  from_email: string;
  date: string;
  unread: boolean;
  starred: boolean;
  folder: string;
  message_count: number;
}

export interface EmailMessage {
  message_id: string;
  from_email: string;
  from_name: string;
  to_emails: string[] | null;
  cc_emails?: string[] | null;
  bcc_emails?: string[] | null;
  subject: string;
  body_html: string | null;
  body_plain?: string;
  snippet?: string;
  date: string;
  direction: 'inbound' | 'outbound';
  is_reply?: boolean;
  unread?: boolean;
  starred?: boolean;
  folder?: string;
}

export interface ThreadDetails {
  thread: {
    thread_id: string;
    subject: string;
    participants: string[];
    message_count: number;
    pitch_id?: number;
    campaign_id?: string;
  };
  messages: EmailMessage[];
  admin_account: {
    id: number;
    email_address: string;
    sending_name: string;
  };
}

export interface ReplyData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  reply_all?: boolean;
}

class AdminInboxService {
  private baseUrl = '/api/admin/inbox';

  /**
   * Get list of all available shared sending accounts
   */
  async getAccounts(activeOnly = true): Promise<{ accounts: AdminSendingAccount[]; total: number }> {
    const params = new URLSearchParams();
    params.append('active_only', activeOnly.toString());

    const response = await apiRequest('GET', `${this.baseUrl}/accounts?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch admin accounts');
    }
    return response.json();
  }

  /**
   * Get email threads for a specific shared account
   */
  async getThreads(
    accountId: number,
    page = 1,
    size = 20,
    folder?: string,
    unreadOnly = false
  ): Promise<{
    threads: EmailThread[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }> {
    const params = new URLSearchParams();
    params.append('account_id', accountId.toString());
    params.append('page', page.toString());
    params.append('size', size.toString());
    // Only append folder if it's provided (undefined means get all)
    if (folder) {
      params.append('folder', folder);
    }
    params.append('unread_only', unreadOnly.toString());

    const response = await apiRequest('GET', `${this.baseUrl}/threads?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch threads');
    }
    return response.json();
  }

  /**
   * Get full conversation details for a thread
   */
  async getThreadDetails(threadId: string): Promise<ThreadDetails> {
    const response = await apiRequest('GET', `${this.baseUrl}/threads/${threadId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch thread details');
    }
    return response.json();
  }

  /**
   * Send a reply within a specific thread
   */
  async sendReply(
    threadId: string,
    replyData: ReplyData,
    messageId?: string
  ): Promise<{
    status: string;
    message_id: string;
    thread_id: string;
  }> {
    const params = new URLSearchParams();
    params.append('thread_id', threadId);
    if (messageId) {
      params.append('message_id', messageId);
    }

    const response = await apiRequest(
      'POST',
      `${this.baseUrl}/reply?${params.toString()}`,
      replyData
    );
    if (!response.ok) {
      throw new Error('Failed to send reply');
    }
    return response.json();
  }

  /**
   * Mark a thread as read/unread
   */
  async markThreadRead(threadId: string, isRead: boolean): Promise<void> {
    const response = await apiRequest(
      'PATCH',
      `${this.baseUrl}/threads/${threadId}/read`,
      { is_read: isRead }
    );
    if (!response.ok) {
      throw new Error('Failed to update thread read status');
    }
  }

  /**
   * Star/unstar a thread
   */
  async toggleThreadStar(threadId: string, isStarred: boolean): Promise<void> {
    const response = await apiRequest(
      'PATCH',
      `${this.baseUrl}/threads/${threadId}/star`,
      { is_starred: isStarred }
    );
    if (!response.ok) {
      throw new Error('Failed to update thread star status');
    }
  }

  /**
   * Move thread to a different folder
   */
  async moveThreadToFolder(threadId: string, folder: 'archive' | 'trash' | 'spam' | 'inbox'): Promise<void> {
    const response = await apiRequest(
      'PATCH',
      `${this.baseUrl}/threads/${threadId}/folder`,
      { folder }
    );
    if (!response.ok) {
      throw new Error(`Failed to move thread to ${folder}`);
    }
  }

  /**
   * Archive a thread
   */
  async archiveThread(threadId: string): Promise<void> {
    return this.moveThreadToFolder(threadId, 'archive');
  }

  /**
   * Move thread to trash
   */
  async trashThread(threadId: string): Promise<void> {
    return this.moveThreadToFolder(threadId, 'trash');
  }

  /**
   * Mark thread as spam
   */
  async markAsSpam(threadId: string): Promise<void> {
    return this.moveThreadToFolder(threadId, 'spam');
  }

  /**
   * Move thread back to inbox
   */
  async moveToInbox(threadId: string): Promise<void> {
    return this.moveThreadToFolder(threadId, 'inbox');
  }
}

export const adminInboxService = new AdminInboxService();