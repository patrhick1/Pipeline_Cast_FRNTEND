// Email and Inbox related types

export interface EmailMessage {
  id: string;
  message_id?: string;  // Backend uses this
  thread_id: string;
  subject: string;
  from: EmailParticipant[];
  to: EmailParticipant[];
  cc?: EmailParticipant[];
  bcc?: EmailParticipant[];
  sender_email?: string;   // Added from backend spec
  sender_name?: string;    // Added from backend spec
  recipient_emails?: string[]; // Added from backend spec
  body?: string;           // DEPRECATED: Use body_text or body_html instead
  body_text?: string;      // Plain text version from backend
  body_html?: string;      // HTML formatted version from backend
  snippet: string;
  date: string;
  message_date?: string;   // Alternative date field
  direction?: 'inbound' | 'outbound';  // Added from backend
  unread: boolean;
  starred: boolean;
  folders: string[];
  folder?: string;         // Single folder from backend
  labels?: string[];
  attachments?: EmailAttachment[];
  classification?: EmailClassification;
  smart_reply?: SmartReply;
}

export interface EmailThread {
  id: string;
  thread_id?: string;  // Backend uses this
  subject: string;
  snippet: string;
  participants: EmailParticipant[];
  from_email?: string;  // Added from backend spec
  from_name?: string;   // Added from backend spec
  to_emails?: string[]; // Added from backend spec
  last_message_date: string;
  date?: string;        // Alternative date field from backend
  message_count: number;
  unread_count: number;
  unread?: boolean;     // Alternative unread field
  starred: boolean;
  folders: string[];
  folder?: string;      // Single folder from backend
  labels?: string[];
  classification?: EmailClassification;
  messages?: EmailMessage[];
  has_attachments?: boolean;
  pitch_id?: number;
  placement_id?: number;
}

export interface EmailParticipant {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  content_id?: string;
}

export interface EmailClassification {
  category: 'booking_confirmation' | 'rejection' | 'question' | 'follow_up' | 'general' | 'pitch_response';
  confidence: number;
  suggested_action?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface SmartReply {
  id: string;
  draft: string;
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  confidence: number;
  alternatives?: string[];
}

export interface ComposeEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: File[];
  reply_to_message_id?: string;
  thread_id?: string;
}

export interface InboxFilters {
  folder?: string;
  label?: string;
  unread_only?: boolean;
  starred_only?: boolean;
  search?: string;
  classification?: string;
  date_from?: string;
  date_to?: string;
}

export interface PitchMetrics {
  total_sent: number;
  open_rate: number;
  reply_rate: number;
  acceptance_rate: number;
  average_response_time?: number;
  by_status: {
    pending: number;
    opened: number;
    replied: number;
    accepted: number;
    rejected: number;
  };
}

export interface PlacementMetrics {
  total_placements: number;
  placement_rate: number;
  by_status: {
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  upcoming_placements: PlacementEvent[];
}

export interface PlacementEvent {
  id: string;
  podcast_name: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  recording_link?: string;
  notes?: string;
}

export interface NylasAuthStatus {
  connected: boolean;
  email?: string;
  provider?: 'google' | 'microsoft' | 'icloud';
  last_sync?: string;
  sync_status?: 'syncing' | 'synced' | 'error';
  error_message?: string;
}

export interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  pitch_metrics: PitchMetrics;
  placement_metrics: PlacementMetrics;
  timeline_events: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'email_sent' | 'email_opened' | 'email_replied' | 'booking_confirmed' | 'placement_completed';
  details: string;
  metadata?: Record<string, any>;
}