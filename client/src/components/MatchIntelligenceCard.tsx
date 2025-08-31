import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Check, Globe, Twitter, Linkedin, Instagram, Facebook, Youtube, Info, CheckSquare, Square } from "lucide-react";
import { Button } from './ui/button';
import { RejectReasonDialog } from './RejectReasonDialog';
import { PodcastDetailsModal } from './modals/PodcastDetailsModal';

// Helper function to format reach numbers
function formatReachNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

// --- Interfaces (Should align with backend schemas) ---
interface Media {
  name: string | null;
  image_url?: string | null;
  website?: string | null;
  host_names?: string[] | null;
  category?: string | null;
  quality_score?: number | null;
  quality_score_audience?: number | null;
  quality_score_recency?: number | null;
  quality_score_frequency?: number | null;
  podcast_twitter_url?: string | null;
  podcast_linkedin_url?: string | null;
  podcast_instagram_url?: string | null;
  podcast_facebook_url?: string | null;
  podcast_youtube_url?: string | null;
  podcast_tiktok_url?: string | null;
}

interface MatchSuggestion {
  match_id: number;
  media_id: number;
  media_name?: string; // This is a fallback - make it optional
  vetting_reasoning?: string | null;
  vetting_score?: number | null;
  reach_estimate_min?: number | null;
  reach_estimate_max?: number | null;
  matched_keywords?: string[] | null;
  media?: Media; // The enriched media object
}

interface MatchIntelligenceCardProps {
  match: MatchSuggestion;
  onApprove: (matchId: number) => void;
  onReject: (matchId: number, rejectReason?: string) => void;
  isActionPending: boolean;
  rejectReason?: string; // Display existing reject reason if any
  isSelectable?: boolean; // Whether this card can be selected for bulk actions
  isSelected?: boolean; // Whether this card is currently selected
  onSelect?: (matchId: number) => void; // Callback when selection checkbox is clicked
}


export const MatchIntelligenceCard = ({ 
  match, 
  onApprove, 
  onReject, 
  isActionPending, 
  rejectReason,
  isSelectable = false,
  isSelected = false,
  onSelect
}: MatchIntelligenceCardProps) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPodcastDetails, setShowPodcastDetails] = useState(false);
  const media = match.media;

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = (reason?: string) => {
    onReject(match.match_id, reason);
    setShowRejectDialog(false);
  };
  if (!media) {
    // Fallback: Show basic card with available information instead of error
    return (
      <div className={`match-card bg-white rounded-lg shadow-md overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start gap-3">
            {/* Selection Checkbox for fallback card */}
            {isSelectable && (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(match.match_id);
                }}
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </Button>
            )}
            <div className="flex items-start justify-between flex-1">
              <div>
                <h3 className="font-bold text-lg">{match.media_name || `Media ID: ${match.media_id}`}</h3>
                <p className="text-sm text-yellow-600">⚠️ Detailed media information is being loaded...</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPodcastDetails(true);
                }}
              >
                <Info className="h-3 w-3 mr-1" />
                Details
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4">
          {match.vetting_score !== null && match.vetting_score !== undefined && (
            <div className="flex gap-3 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex-1">
                <strong className="text-blue-800">Match Percentage: {Math.round(match.vetting_score)}%</strong>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex-1">
                <strong className="text-gray-800">Reach Estimate: {formatReachNumber(match.reach_estimate_min || 10000)}-{formatReachNumber(match.reach_estimate_max || 50000)}</strong>
              </div>
            </div>
          )}
          {match.vetting_reasoning && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-4">
              <strong className="text-purple-800">Fit Assessment:</strong>
              <p className="text-xs text-purple-900 italic mt-1">"{match.vetting_reasoning}"</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t flex gap-3">
          <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
              onClick={() => onApprove(match.match_id)}
              disabled={isActionPending}
          >
            <ThumbsUp className="h-4 w-4 mr-2"/>
            Approve
          </Button>
          <Button 
              className="flex-1" 
              variant="destructive"
              onClick={handleRejectClick}
              disabled={isActionPending}
          >
            <ThumbsDown className="h-4 w-4 mr-2"/>
            Reject
          </Button>
        </div>

        {/* Reject Reason Dialog for fallback card */}
        <RejectReasonDialog
          isOpen={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          onConfirm={handleRejectConfirm}
          isLoading={isActionPending}
          title="Reject Match"
          mediaName={match.media_name || undefined}
        />
        
        {/* Podcast Details Modal for fallback card */}
        <PodcastDetailsModal
          isOpen={showPodcastDetails}
          onClose={() => setShowPodcastDetails(false)}
          mediaId={match.media_id}
          podcastName={match.media_name || undefined}
        />
      </div>
    );
  }
  
  return (
    <div className={`match-card bg-white rounded-lg shadow-md overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-start gap-4">
        {/* Selection Checkbox */}
        {isSelectable && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(match.match_id);
            }}
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-blue-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </Button>
        )}
        <a 
          href={media.website || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block hover:opacity-90 transition-opacity cursor-pointer"
        >
          <img 
            src={media.image_url || '/default-podcast.svg'} 
            alt={media.name || 'Podcast Cover'} 
            className="w-20 h-20 rounded-md object-cover border bg-gray-50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = '/default-podcast.svg'; // Fallback image
            }}
          />
        </a>
        <div className="podcast-info flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <a 
                href={media.website || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <h3 className="font-bold text-lg">{media.name}</h3>
              </a>
              <p className="text-sm text-gray-600">Host: {media.host_names?.join(', ') || 'N/A'}</p>
              <p className="text-sm text-gray-500">Category: {media.category || 'N/A'}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setShowPodcastDetails(true);
              }}
            >
              <Info className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
          
          {/* Social Media Icons */}
          <div className="flex gap-2 mt-2">
            {media.website && (
              <a href={media.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
                <Globe className="h-4 w-4" />
              </a>
            )}
            {media.podcast_twitter_url && (
              <a href={media.podcast_twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {media.podcast_linkedin_url && (
              <a href={media.podcast_linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {media.podcast_instagram_url && (
              <a href={media.podcast_instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {media.podcast_facebook_url && (
              <a href={media.podcast_facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {media.podcast_youtube_url && (
              <a href={media.podcast_youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-600">
                <Youtube className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="match-intelligence p-4 space-y-4">
        <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">Match Intelligence</h4>

        {/* Display existing rejection reason if present */}
        {rejectReason && (
          <div className="intelligence-item p-3 bg-red-50 border border-red-200 rounded-md">
            <strong className="flex items-center text-red-800">
              <ThumbsDown className="h-4 w-4 mr-2 text-red-600"/> Previous Rejection Reason
            </strong>
            <p className="text-xs text-red-900 mt-1 pl-6">{rejectReason}</p>
          </div>
        )}
        
        <div className="flex gap-3 mb-4">
          <div className="intelligence-item p-3 bg-blue-50 border border-blue-200 rounded-md flex-1">
            <strong className="flex items-center text-blue-800">
              <Check className="h-4 w-4 mr-2 text-blue-600"/> Match Percentage: {match.vetting_score !== null && match.vetting_score !== undefined ? `${Math.round(match.vetting_score)}%` : 'N/A'}
            </strong>
          </div>
          <div className="intelligence-item p-3 bg-gray-50 border border-gray-200 rounded-md flex-1">
            <strong className="flex items-center text-gray-800">
              <Check className="h-4 w-4 mr-2 text-gray-600"/> Reach Estimate: {formatReachNumber(match.reach_estimate_min || 10000)}-{formatReachNumber(match.reach_estimate_max || 50000)}
            </strong>
          </div>
        </div>

        <div className="intelligence-item p-3 bg-purple-50 border border-purple-200 rounded-md">
          <strong className="flex items-center text-purple-800">
             <Check className="h-4 w-4 mr-2 text-purple-600"/> Fit Assessment
          </strong>
          <p className="reasoning text-xs text-purple-900 italic mt-1 pl-6">"{match.vetting_reasoning || 'This podcast is a good fit based on content alignment.'}"</p>
        </div>

      </div>

      <div className="approval-actions p-4 bg-gray-50 border-t flex gap-3">
        <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => onApprove(match.match_id)}
            disabled={isActionPending}
        >
          <ThumbsUp className="h-4 w-4 mr-2"/>
          Approve
        </Button>
        <Button 
            className="flex-1" 
            variant="destructive"
            onClick={handleRejectClick}
            disabled={isActionPending}
        >
          <ThumbsDown className="h-4 w-4 mr-2"/>
          Reject
        </Button>
      </div>

      {/* Reject Reason Dialog */}
      <RejectReasonDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleRejectConfirm}
        isLoading={isActionPending}
        title="Reject Match"
        mediaName={media.name || undefined}
      />
      
      {/* Podcast Details Modal */}
      <PodcastDetailsModal
        isOpen={showPodcastDetails}
        onClose={() => setShowPodcastDetails(false)}
        mediaId={match.media_id}
        podcastName={media.name || undefined}
      />
    </div>
  );
}; 