import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Clock, ExternalLink, Edit, MessageSquare,
  CheckCircle, PlayCircle, Mic, Phone, FileText, Bell
} from "lucide-react";
import { PlacementTimeline } from "./PlacementTimeline";
import { PlacementEditDialog } from "./PlacementEditDialog";
import { formatDateTime, fromAPIDateTime, isUpcoming } from "@/lib/timezone";
import { statusConfig, type PlacementStatus } from "@/constants/placementStatus";

interface Placement {
  placement_id: number;
  campaign_id: string;
  media_id: number;
  current_status?: string | null;
  status_ts?: string | null;
  meeting_date?: string | null; // ISO 8601 DateTime
  call_date?: string | null; // ISO 8601 DateTime
  recording_date?: string | null; // ISO 8601 DateTime
  go_live_date?: string | null; // ISO 8601 DateTime
  follow_up_date?: string | null; // ISO 8601 DateTime - NEW
  outreach_topic?: string | null;
  episode_link?: string | null;
  notes?: string | null;
  pitch_id?: number | null;
  created_at: string;
  // Enriched fields
  campaign_name?: string | null;
  client_name?: string | null;
  media_name?: string | null;
  media_website?: string | null;
}

interface ClientPlacementCardProps {
  placement: Placement;
  onUpdate?: () => void;
}

// statusConfig is now imported from @/constants/placementStatus

export const ClientPlacementCard: React.FC<ClientPlacementCardProps> = ({
  placement,
  onUpdate
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const status = (placement.current_status || 'pending') as PlacementStatus;
  const statusInfo = statusConfig[status] || statusConfig.default;
  const StatusIcon = statusInfo.icon;

  const upcomingDates = [
    { label: "Follow-up", date: placement.follow_up_date, icon: Bell },
    { label: "Meeting", date: placement.meeting_date, icon: Calendar },
    { label: "Recording", date: placement.recording_date, icon: Mic },
    { label: "Go Live", date: placement.go_live_date, icon: PlayCircle }
  ].filter(item => {
    if (!item.date) return false;
    const date = fromAPIDateTime(item.date);
    return date && date >= new Date();
  });

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
                {placement.media_name || `Media ID: ${placement.media_id}`}
              </CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${statusInfo.color} font-medium`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                {placement.episode_link && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <PlayCircle className="w-3 h-3 mr-1" />
                    Episode Available
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Campaign: {placement.campaign_name || 'N/A'}
              </p>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Upcoming Dates */}
              {upcomingDates.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Upcoming Events</h4>
                  <div className="space-y-2">
                    {upcomingDates.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">{item.label}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {formatDateTime(item.date, 'PPp')}
                        </span>
                        {isUpcoming(item.date, 7) && (
                          <span className="ml-1 text-xs text-blue-600">(Soon)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Topic</p>
                  <p className="text-sm font-medium">
                    {placement.outreach_topic || "Not specified"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(placement.created_at, 'PP')}
                  </p>
                </div>
              </div>

              {/* Episode Link */}
              {placement.episode_link && (
                <div className="border-t pt-3">
                  <a
                    href={placement.episode_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span className="font-medium">Listen to Episode</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Notes */}
              {placement.notes && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {placement.notes}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <PlacementTimeline placement={placement} />
            </TabsContent>

            <TabsContent value="details" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Follow-up Date</p>
                  <p className="text-sm font-medium">{formatDateTime(placement.follow_up_date, 'PPp') || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Meeting Date</p>
                  <p className="text-sm font-medium">{formatDateTime(placement.meeting_date, 'PPp') || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recording Date</p>
                  <p className="text-sm font-medium">{formatDateTime(placement.recording_date, 'PPp') || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Go Live Date</p>
                  <p className="text-sm font-medium">{formatDateTime(placement.go_live_date, 'PPp') || '—'}</p>
                </div>
              </div>

              {placement.media_website && (
                <div className="border-t pt-3">
                  <a
                    href={placement.media_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Visit Podcast Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PlacementEditDialog
        placement={placement}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onUpdate}
        userRole="client"
      />
    </>
  );
};