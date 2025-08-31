import { apiRequest } from '@/lib/queryClient';

// Types for comprehensive podcast data
export interface PodcastStats {
  total_episodes?: number;
  audience_size?: number | string;
  total_reach?: number;
  calculated_total_reach?: number;
  publishing_schedule?: string;
  publishing_frequency_days?: number | null;
  average_duration?: number;
  avg_episode_duration_minutes?: number | null;
  latest_episode_date?: string;
  first_episode_date?: string;
}

export interface SocialPlatform {
  name: string;
  url?: string;
  followers?: number | null;
  subscribers?: number | null;
}

export interface SocialPresence {
  total_followers?: number;
  platforms?: SocialPlatform[];
  // Legacy format support
  twitter?: { url?: string; followers?: number };
  instagram?: { url?: string; followers?: number };
  linkedin?: { url?: string; followers?: number };
  youtube?: { url?: string; subscribers?: number };
  facebook?: { url?: string; followers?: number };
}

export interface RecentEpisode {
  episode_id: number;
  title: string;
  publish_date: string;
  duration_sec?: number | null;
  duration_formatted?: string | null;
  summary?: string;
  episode_url?: string;
  direct_audio_url?: string;
  guest_names?: string[] | string;  // Can be array or string
  episode_themes?: string[];
  episode_keywords?: string[];
  // Legacy support
  duration?: number;
  description?: string;
  topics?: string[];
  keywords?: string[];
}

export interface ComprehensivePodcast {
  media_id: number;
  name: string;
  title?: string;
  website?: string;
  image_url?: string;
  host_names?: string[];
  description?: string;
  ai_description?: string;
  
  // Direct stats fields
  audience_size?: number;
  total_reach?: number;
  calculated_total_reach?: number;
  total_episodes?: number;
  latest_episode_date?: string;
  first_episode_date?: string;
  avg_episode_duration_minutes?: number | null;
  publishing_frequency_days?: number | null;
  
  // Social URLs
  podcast_twitter_url?: string;
  podcast_linkedin_url?: string;
  podcast_instagram_url?: string;
  podcast_facebook_url?: string;
  podcast_youtube_url?: string;
  podcast_tiktok_url?: string | null;
  
  // Social followers
  twitter_followers?: number;
  linkedin_connections?: number | null;
  instagram_followers?: number | null;
  facebook_likes?: number | null;
  youtube_subscribers?: number | null;
  tiktok_followers?: number | null;
  
  // Ratings
  itunes_rating_average?: number | null;
  itunes_rating_count?: number | null;
  spotify_rating_average?: number | null;
  spotify_rating_count?: number | null;
  listen_score?: number | null;
  
  // Content
  recent_themes?: string[];
  recent_topics?: string[];
  notable_guests?: string[];
  recent_episodes?: RecentEpisode[];
  
  // Nested structures (for compatibility)
  stats?: PodcastStats;
  social_presence?: SocialPresence;
  themes?: string[];
  topics?: string[];
  categories?: string[];
  rss_categories?: string[] | null;
  contact_email?: string;
  language?: string;
  is_active?: boolean;
}

// Types for comprehensive episode data
export interface ComprehensiveEpisode {
  episode_id: number;
  media_id: number;
  title: string;
  publish_date: string;
  duration?: number;
  duration_sec?: number;  // Duration in seconds
  duration_formatted?: string;
  description?: string;
  summary?: string;
  episode_summary?: string;  // From API response
  ai_episode_summary?: string;
  audio_url?: string;
  direct_audio_url?: string;  // Alternative audio URL
  keywords?: string[];
  episode_keywords?: string[];  // From API response
  themes?: string[];
  episode_themes?: string[];  // From API response
  topics?: string[];
  guest_names?: string[] | string;  // Can be array or string
  transcript_available?: boolean;
  has_transcript?: boolean;  // From API response
  ai_analysis_done?: boolean;
  playback_available?: boolean;
  key_moments?: Array<{
    timestamp: string;
    description: string;
  }>;
}

/**
 * Fetch comprehensive podcast information
 */
export async function getComprehensivePodcast(mediaId: number): Promise<ComprehensivePodcast> {
  const response = await apiRequest('GET', `/media/${mediaId}/comprehensive`);
  if (!response.ok) {
    throw new Error('Failed to fetch comprehensive podcast data');
  }
  return response.json();
}

/**
 * Fetch comprehensive episode information
 */
export async function getComprehensiveEpisode(episodeId: number): Promise<ComprehensiveEpisode> {
  const response = await apiRequest('GET', `/episodes/${episodeId}/comprehensive`);
  if (!response.ok) {
    throw new Error('Failed to fetch comprehensive episode data');
  }
  return response.json();
}

/**
 * Fetch multiple episodes in batch
 */
export async function getEpisodesBatch(episodeIds: number[]): Promise<ComprehensiveEpisode[]> {
  const promises = episodeIds.map(id => getComprehensiveEpisode(id));
  return Promise.all(promises);
}