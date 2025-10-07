import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ExternalLink, Users, Calendar, Clock, BarChart3,
  Globe, Twitter, Instagram, Linkedin, Youtube, Facebook,
  ChevronDown, ChevronRight, Mic, Hash, User, Play,
  FileText, TrendingUp, Mail, AlertCircle
} from 'lucide-react';
import {
  getComprehensivePodcast,
  getComprehensiveEpisode,
  type ComprehensivePodcast,
  type ComprehensiveEpisode,
  type RecentEpisode
} from '@/services/podcastApi';
import { useAuth } from '@/hooks/useAuth';

interface PodcastDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: number;
  podcastName?: string;
}

export function PodcastDetailsModal({
  isOpen,
  onClose,
  mediaId,
  podcastName
}: PodcastDetailsModalProps) {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set());
  const [loadingEpisodes, setLoadingEpisodes] = useState<Set<number>>(new Set());
  const [episodeDetails, setEpisodeDetails] = useState<Map<number, ComprehensiveEpisode>>(new Map());

  // Fetch comprehensive podcast data
  const { data: podcast, isLoading: isPodcastLoading, error: podcastError } = useQuery<ComprehensivePodcast>({
    queryKey: ['podcast-comprehensive', mediaId],
    queryFn: () => getComprehensivePodcast(mediaId),
    enabled: isOpen && !!mediaId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Reset expanded episodes when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedEpisodes(new Set());
      setEpisodeDetails(new Map());
    }
  }, [isOpen]);

  const toggleEpisode = async (episodeId: number) => {
    if (expandedEpisodes.has(episodeId)) {
      // Collapse
      setExpandedEpisodes(prev => {
        const next = new Set(prev);
        next.delete(episodeId);
        return next;
      });
    } else {
      // Expand and fetch details if not already loaded
      if (!episodeDetails.has(episodeId)) {
        setLoadingEpisodes(prev => new Set(prev).add(episodeId));
        try {
          const details = await getComprehensiveEpisode(episodeId);
          setEpisodeDetails(prev => new Map(prev).set(episodeId, details));
        } catch (error) {
          console.error('Failed to fetch episode details:', error);
        } finally {
          setLoadingEpisodes(prev => {
            const next = new Set(prev);
            next.delete(episodeId);
            return next;
          });
        }
      }
      setExpandedEpisodes(prev => new Set(prev).add(episodeId));
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl">
            {podcast?.name || podcastName || 'Podcast Details'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-80px)] px-6 pb-6">
          {isPodcastLoading ? (
            <PodcastSkeleton />
          ) : podcastError ? (
            <ErrorState message="Failed to load podcast details" />
          ) : podcast ? (
            <div className="space-y-6 mt-4">
              {/* Header Section */}
              <div className="flex items-start gap-4">
                {podcast.image_url && (
                  <img 
                    src={podcast.image_url} 
                    alt={podcast.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-gray-600 mb-2">{podcast.description}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {podcast.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={podcast.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-3 h-3 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                    {podcast.contact_email && isAdminOrStaff && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${podcast.contact_email}`}>
                          <Mail className="w-3 h-3 mr-1" />
                          Contact
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="episodes">Episodes</TabsTrigger>
                  <TabsTrigger value="topics">Topics & Themes</TabsTrigger>
                  <TabsTrigger value="social">Social Presence</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Hosts */}
                  {podcast.host_names && Array.isArray(podcast.host_names) && podcast.host_names.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Hosts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {podcast.host_names.map((host, idx) => (
                            <Badge key={idx} variant="secondary">
                              <User className="w-3 h-3 mr-1" />
                              {host}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                      icon={<Mic className="w-4 h-4" />}
                      label="Total Episodes"
                      value={podcast.total_episodes?.toString() || podcast.stats?.total_episodes?.toString() || '0'}
                    />
                    <StatCard
                      icon={<Users className="w-4 h-4" />}
                      label="Audience Size"
                      value={formatNumber(podcast.audience_size) || podcast.stats?.audience_size?.toString() || 'N/A'}
                    />
                    {podcast.publishing_frequency_days && (
                      <StatCard
                        icon={<Calendar className="w-4 h-4" />}
                        label="Publishing Frequency"
                        value={`Every ${podcast.publishing_frequency_days} days`}
                      />
                    )}
                    {podcast.avg_episode_duration_minutes && (
                      <StatCard
                        icon={<Clock className="w-4 h-4" />}
                        label="Avg. Duration"
                        value={formatDuration(podcast.avg_episode_duration_minutes)}
                      />
                    )}
                    <StatCard
                      icon={<Calendar className="w-4 h-4" />}
                      label="Latest Episode"
                      value={(podcast.latest_episode_date || podcast.stats?.latest_episode_date) ?
                        new Date(podcast.latest_episode_date || podcast.stats?.latest_episode_date || '').toLocaleDateString() :
                        'N/A'}
                    />
                    {podcast.itunes_rating_average && (
                      <StatCard
                        icon={<TrendingUp className="w-4 h-4" />}
                        label="iTunes Rating"
                        value={`${podcast.itunes_rating_average.toFixed(1)} ⭐ (${podcast.itunes_rating_count || 0})`}
                      />
                    )}
                  </div>

                  {/* Categories */}
                  {podcast.categories && Array.isArray(podcast.categories) && podcast.categories.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {podcast.categories.map((cat, idx) => (
                            <Badge key={idx} variant="outline">{cat}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Episodes Tab */}
                <TabsContent value="episodes" className="space-y-2 mt-4">
                  {podcast.recent_episodes && Array.isArray(podcast.recent_episodes) && podcast.recent_episodes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">
                        Recent episodes • Click to expand for details
                      </p>
                      {podcast.recent_episodes.map((episode) => (
                        <EpisodeCard
                          key={episode.episode_id}
                          episode={episode}
                          isExpanded={expandedEpisodes.has(episode.episode_id)}
                          isLoading={loadingEpisodes.has(episode.episode_id)}
                          details={episodeDetails.get(episode.episode_id)}
                          onToggle={() => toggleEpisode(episode.episode_id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8 text-gray-500">
                        No recent episodes available
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Topics & Themes Tab */}
                <TabsContent value="topics" className="space-y-4 mt-4">
                  {((podcast.recent_themes && podcast.recent_themes.length > 0) || 
                    (podcast.themes && Array.isArray(podcast.themes) && podcast.themes.length > 0)) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Common Themes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(podcast.recent_themes || podcast.themes || []).map((theme, idx) => (
                            <Badge key={idx} variant="default">
                              <Hash className="w-3 h-3 mr-1" />
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {((podcast.recent_topics && podcast.recent_topics.length > 0) ||
                    (podcast.topics && Array.isArray(podcast.topics) && podcast.topics.length > 0)) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recent Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(podcast.recent_topics || podcast.topics || []).map((topic, idx) => (
                            <Badge key={idx} variant="secondary">{topic}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {podcast.notable_guests && podcast.notable_guests.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Notable Guests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {podcast.notable_guests.map((guest, idx) => (
                            <Badge key={idx} variant="outline">
                              <User className="w-3 h-3 mr-1" />
                              {guest}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!podcast.themes?.length && !podcast.topics?.length && (
                    <Card>
                      <CardContent className="text-center py-8 text-gray-500">
                        No topics or themes data available
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Social Presence Tab */}
                <TabsContent value="social" className="space-y-4 mt-4">
                  {(podcast.social_presence?.platforms && podcast.social_presence.platforms.length > 0) ? (
                    <div>
                      {podcast.social_presence.total_followers && (
                        <Card className="mb-4">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold">{formatNumber(podcast.social_presence.total_followers)}</p>
                              <p className="text-sm text-gray-500">Total Followers</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {podcast.social_presence.platforms.map((platform, idx) => {
                          const iconMap: { [key: string]: React.ReactNode } = {
                            'Twitter': <Twitter className="w-4 h-4" />,
                            'Instagram': <Instagram className="w-4 h-4" />,
                            'LinkedIn': <Linkedin className="w-4 h-4" />,
                            'YouTube': <Youtube className="w-4 h-4" />,
                            'Facebook': <Facebook className="w-4 h-4" />,
                          };
                          return (
                            <SocialCard
                              key={idx}
                              platform={platform.name}
                              icon={iconMap[platform.name] || <Globe className="w-4 h-4" />}
                              url={platform.url}
                              followers={platform.followers || platform.subscribers}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (podcast.podcast_twitter_url || podcast.podcast_instagram_url || 
                       podcast.podcast_linkedin_url || podcast.podcast_youtube_url || 
                       podcast.podcast_facebook_url) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {podcast.podcast_twitter_url && (
                        <SocialCard
                          platform="Twitter"
                          icon={<Twitter className="w-4 h-4" />}
                          url={podcast.podcast_twitter_url}
                          followers={podcast.twitter_followers}
                        />
                      )}
                      {podcast.podcast_instagram_url && (
                        <SocialCard
                          platform="Instagram"
                          icon={<Instagram className="w-4 h-4" />}
                          url={podcast.podcast_instagram_url}
                          followers={podcast.instagram_followers}
                        />
                      )}
                      {podcast.podcast_linkedin_url && (
                        <SocialCard
                          platform="LinkedIn"
                          icon={<Linkedin className="w-4 h-4" />}
                          url={podcast.podcast_linkedin_url}
                          followers={podcast.linkedin_connections}
                        />
                      )}
                      {podcast.podcast_youtube_url && (
                        <SocialCard
                          platform="YouTube"
                          icon={<Youtube className="w-4 h-4" />}
                          url={podcast.podcast_youtube_url}
                          followers={podcast.youtube_subscribers}
                        />
                      )}
                      {podcast.podcast_facebook_url && (
                        <SocialCard
                          platform="Facebook"
                          icon={<Facebook className="w-4 h-4" />}
                          url={podcast.podcast_facebook_url}
                          followers={podcast.facebook_likes}
                        />
                      )}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8 text-gray-500">
                        No social presence data available
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Sub-components

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SocialCard({ 
  platform, 
  icon, 
  url, 
  followers 
}: { 
  platform: string; 
  icon: React.ReactNode; 
  url?: string; 
  followers?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{platform}</span>
          </div>
          {followers && (
            <Badge variant="secondary">
              {followers >= 1000000 ? `${(followers / 1000000).toFixed(1)}M` :
               followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` :
               followers} followers
            </Badge>
          )}
        </div>
        {url && (
          <Button variant="link" size="sm" className="p-0 h-auto mt-2" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Visit Profile <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EpisodeCard({ 
  episode, 
  isExpanded, 
  isLoading,
  details,
  onToggle 
}: { 
  episode: RecentEpisode;
  isExpanded: boolean;
  isLoading: boolean;
  details?: ComprehensiveEpisode;
  onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={onToggle}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {episode.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {new Date(episode.publish_date).toLocaleDateString()} 
                  {episode.duration && ` • ${formatDuration(episode.duration)}`}
                  {episode.guest_names && (
                    <span className="ml-2">
                      • Guests: {Array.isArray(episode.guest_names) ? episode.guest_names.join(', ') : episode.guest_names}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 border-t">
            {isLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : details ? (
              <div className="space-y-4 py-4">
                {/* Episode Description/Summary */}
                {(details.episode_summary || details.description) && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <div 
                      className="text-sm text-gray-600" 
                      dangerouslySetInnerHTML={{ __html: details.episode_summary || details.description || '' }}
                    />
                  </div>
                )}

                {/* AI Summary */}
                {(details.ai_episode_summary || details.summary) && (
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      AI Summary
                    </h4>
                    <p className="text-sm text-gray-600">{details.ai_episode_summary || details.summary}</p>
                  </div>
                )}

                {/* Keywords & Topics */}
                <div className="flex flex-wrap gap-4">
                  {((details.episode_keywords && details.episode_keywords.length > 0) || 
                    (details.keywords && Array.isArray(details.keywords) && details.keywords.length > 0)) && (
                    <div className="flex-1 min-w-[200px]">
                      <h4 className="text-sm font-medium mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {(details.episode_keywords || details.keywords || []).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {((details.episode_themes && details.episode_themes.length > 0) ||
                    (details.themes && Array.isArray(details.themes) && details.themes.length > 0)) && (
                    <div className="flex-1 min-w-[200px]">
                      <h4 className="text-sm font-medium mb-2">Themes</h4>
                      <div className="flex flex-wrap gap-1">
                        {(details.episode_themes || details.themes || []).map((theme, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio Player */}
                {(details.direct_audio_url || details.audio_url) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Play className="w-3 h-3 mr-1" />
                      Listen to Episode
                    </h4>
                    <audio controls className="w-full">
                      <source src={details.direct_audio_url || details.audio_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Analysis Status */}
                <div className="flex gap-4 text-xs text-gray-500">
                  {(details.has_transcript || details.transcript_available) && (
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      Transcript Available
                    </span>
                  )}
                  {details.ai_analysis_done && (
                    <span className="flex items-center">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      AI Analysis Complete
                    </span>
                  )}
                  {details.playback_available && (
                    <span className="flex items-center">
                      <Play className="w-3 h-3 mr-1" />
                      Playback Available
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-sm text-gray-500">
                {episode.description || 'No additional details available'}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function PodcastSkeleton() {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-24 h-24 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="mt-4">
      <CardContent className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">{message}</p>
      </CardContent>
    </Card>
  );
}