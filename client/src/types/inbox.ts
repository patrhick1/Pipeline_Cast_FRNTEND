// Email and Inbox related types

export interface EmailMessage {
  id: string;
  message_id?: string | number;  // Backend uses this (can be string or number)
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
  sender_type?: 'client' | 'host';  // Message sender type
  message_status?: 'draft' | 'scheduled' | 'sent' | 'failed';  // Message status
  scheduled_send_at?: string;  // Scheduled send time
  nylas_message_id?: string;  // Nylas message identifier
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
  internal_thread_id?: string;  // Internal thread identifier
  subject: string;
  snippet: string;
  participants: EmailParticipant[];
  from_email?: string;  // Added from backend spec
  from_name?: string;   // Added from backend spec
  to_emails?: string[]; // Added from backend spec
  last_message_date: string;
  date?: string;        // Alternative date field from backend
  last_reply_at?: string;  // Last reply timestamp
  message_count: number;
  unread_count: number;
  unread?: boolean;     // Alternative unread field
  starred: boolean;
  folders: string[];
  folder?: string;      // Single folder from backend
  labels?: string[];
  classification?: EmailClassification | string;  // Can be object or string
  messages?: EmailMessage[];
  has_attachments?: boolean;
  pitch_id?: number;
  placement_id?: number;
  campaign_id?: string;  // Campaign UUID
  body_text?: string;  // Thread body text (for simple threads)
  body_html?: string;  // Thread body HTML (for simple threads)
  thread?: {  // Nested thread info (for stored threads)
    thread_id?: number;
    nylas_thread_id?: string;
    subject?: string;
    last_reply_at?: string;
    campaign_id?: string;
  };
  source?: 'stored' | 'nylas';  // Data source indicator
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

// New Analytics Summary from /analytics/summary and /analytics/summary/filtered endpoints
export interface AnalyticsSummary {
  active_campaigns: number;
  unique_outreach: number;           // Distinct podcasts contacted (no duplicate follow-ups)
  outreach_with_followups: number;   // Outreach that got follow-up emails
  interested_responses: number;      // Podcasts that showed interest
  confirmed_bookings: number;        // Confirmed podcast bookings
  completed_placements: number;      // Completed recordings
  live_episodes: number;             // Published episodes
  upcoming_recordings: number;       // Scheduled future recordings
  pending_reviews: number;           // Pitches pending approval
  approved_placements?: number;      // Optional: approved placements
  success_rate_placements?: number;  // Optional: placement success rate
}

// Legacy interfaces - kept for backward compatibility with old endpoints if needed
export interface PitchMetrics {
  total_sent: number;           // Unique podcasts contacted
  total_pitches?: number;       // Total pitch emails sent (including follow-ups)
  reply_rate: number;           // Percentage
  booking_rate: number;         // Percentage (renamed from acceptance_rate)
  acceptance_rate?: number;     // Deprecated: use booking_rate instead
  bounce_rate?: number;         // Email bounce rate percentage
  avg_pitches_per_match?: number; // Average pitches sent per podcast match
  avg_pitches_to_reply?: number;  // Average pitches needed to get a reply
  average_response_time?: number;
  by_status: {
    pending: number;
    replied: number;
    booked: number;   // Renamed from accepted
    accepted?: number; // Deprecated: use booked instead
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
  media_id?: number;
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
  grants?: Array<{
    grant_id: string;
    email: string;
    provider?: string;
  }>;
  status?: string;
}

export interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  pitch_metrics: PitchMetrics;
  placement_metrics: PlacementMetrics;
  timeline_events: TimelineEvent[];
}

// New backend response format from /api/campaigns/{id}/metrics
export interface CampaignMetricsResponse {
  campaign_id: string;
  campaign_name: string;
  date_range: {
    start: string;
    end: string;
  };
  summary: {
    total_pitches: number;
    total_sent: number;
    unique_podcasts_contacted: number;
    unique_podcasts_sent: number;
    total_clicked: number;
    total_replied: number;
    total_bounced: number;
    placements_created: number;
    confirmed_bookings: number;
  };
  rates: {
    send_rate: number;
    click_rate: number;
    reply_rate: number;
    bounce_rate: number;
    booking_rate: number;
    unique_booking_rate: number;
  };
  engagement: {
    avg_clicks_per_email: number;
    avg_pitches_per_match?: number;
    avg_pitches_to_get_reply?: number;
  };
  deliverability: {
    hard_bounces: number;
    soft_bounces: number;
    total_bounces: number;
  };
  classifications: any[];
  daily_breakdown: Array<{
    date: string;
    sent: number;
    clicked: number;
    replied: number;
  }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'email_sent' | 'email_replied' | 'booking_confirmed' | 'placement_completed';
  details: string;
  metadata?: Record<string, any>;
}

// Detailed analytics response from /analytics/detailed/filtered endpoint
export interface DetailedAnalyticsResponse {
  outcome_metrics: {
    total_outreach: number;
    booking_success_rate: number;
    publish_success_rate: number;
    avg_days_to_publish: number;
  };
  outcome_distribution: Array<{
    outcome: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  campaign_performance: Array<{
    campaign_id: string;
    campaign_name: string;
    booking_rate: number;
    publish_rate: number;
    total_outreach: number;
  }>;
}