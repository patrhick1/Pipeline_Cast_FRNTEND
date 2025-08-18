// Email Thread Tracking System Types

export interface StoredEmailThread {
  thread: {
    thread_id: number;
    nylas_thread_id: string;
    pitch_id: number;
    placement_id?: number;
    subject: string;
    message_count: number;
    last_message_at: string;
    last_reply_at?: string;
    campaign_id?: string; // UUID string
    podcast_id?: number;
    podcast_name?: string;
  };
  messages: StoredEmailMessage[];
  participants: EmailParticipant[];
  source?: 'stored' | 'nylas';
}

export interface StoredEmailMessage {
  message_id: number;
  nylas_message_id: string;
  sender_email: string;
  sender_name: string;
  recipient_emails: string[];
  subject: string;
  body_text: string;
  body_html?: string;
  snippet: string;
  message_date: string;
  direction: 'inbound' | 'outbound';
  sender_type?: 'client' | 'host';
  attachments?: EmailAttachment[];
}

export interface EmailParticipant {
  email: string;
  name: string;
  message_count: number;
  type?: 'client' | 'host' | 'other';
}

export interface EmailAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface CampaignThreadSummary {
  thread_id: number;
  nylas_thread_id: string;
  pitch_id: number;
  podcast_name: string;
  podcast_email: string;
  subject: string;
  last_message_at: string;
  has_reply: boolean;
  reply_count: number;
  status: 'pending' | 'replied' | 'booked' | 'rejected';
  campaign_id?: string; // UUID string
}

export interface RecentReply {
  thread_id: number;
  nylas_thread_id: string;
  pitch_id: number;
  campaign_id: string; // UUID string
  campaign_name: string;
  podcast_name: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  snippet: string;
  reply_date: string;
  is_read: boolean;
}

export interface EmailThreadFilters {
  campaign_id?: string; // UUID string
  has_replies?: boolean;
  sender_type?: 'client' | 'host';
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}