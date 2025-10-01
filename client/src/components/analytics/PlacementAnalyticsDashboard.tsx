import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  Mic,
  Video,
  ExternalLink,
  TrendingUp,
  Target,
  Award,
  Info
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import type { PlacementMetrics, PlacementEvent } from '@/types/inbox';
import { PodcastDetailsModal } from '@/components/modals/PodcastDetailsModal';

interface PlacementAnalyticsDashboardProps {
  campaignId?: string;
  days?: number; // Optional days parameter for date filtering
}

export default function PlacementAnalyticsDashboard({ campaignId, days = 30 }: PlacementAnalyticsDashboardProps) {
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);

  // Fetch placement metrics - using the correct backend endpoints with days parameter
  const { data: metrics, isLoading } = useQuery<PlacementMetrics>({
    queryKey: ['/placements/metrics', { campaign_id: campaignId, days }], // Single endpoint with optional filters
  });

  // Fetch monthly chart data
  const { data: monthlyData } = useQuery({
    queryKey: ['/placements/monthly-chart', { campaign_id: campaignId }], // Support campaign filter
    select: (data: any[]) => data || [],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No placement data available</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const statusData = [
    { name: 'Scheduled', value: metrics?.by_status?.scheduled || 0, color: '#3b82f6' },
    { name: 'Completed', value: metrics?.by_status?.completed || 0, color: '#10b981' },
    { name: 'Cancelled', value: metrics?.by_status?.cancelled || 0, color: '#ef4444' },
  ];

  const upcomingPlacements = (metrics?.upcoming_placements || []).filter(
    p => p.status === 'scheduled' && isAfter(new Date(p.date), new Date())
  );

  const pastPlacements = (metrics?.upcoming_placements || []).filter(
    p => p.status === 'completed' || isBefore(new Date(p.date), new Date())
  );

  const getStatusBadge = (status: PlacementEvent['status']) => {
    const variants = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const completionRate = (metrics?.total_placements || 0) > 0 
    ? Math.round(((metrics?.by_status?.completed || 0) / (metrics?.total_placements || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Placements
              </CardTitle>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_placements || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Placement Rate
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.placement_rate || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Pitches to placements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completion Rate
              </CardTitle>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming
              </CardTitle>
              <CalendarIcon className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingPlacements.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Placement Status</CardTitle>
                <CardDescription>
                  Distribution of placement statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Placements</CardTitle>
                <CardDescription>
                  Placement trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData && monthlyData.length > 0 ? monthlyData : [
                        { month: 'No Data', placements: 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="placements" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upcoming Placements */}
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Placements</CardTitle>
              <CardDescription>
                Scheduled podcast appearances in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPlacements.length > 0 ? (
                <div className="space-y-4">
                  {upcomingPlacements.map((placement) => (
                    <div 
                      key={placement.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mic className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{placement.podcast_name}</h4>
                            {placement.media_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setSelectedMediaId(placement.media_id);
                                  setIsPodcastModalOpen(true);
                                }}
                              >
                                <Info className="w-4 h-4 text-gray-500 hover:text-primary" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(placement.date), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(placement.date), 'h:mm a')}
                          </p>
                          {placement.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {placement.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(placement.status)}
                        {placement.recording_link && (
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={placement.recording_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming placements scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Placements */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Placements</CardTitle>
              <CardDescription>
                Successfully completed podcast appearances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastPlacements.length > 0 ? (
                <div className="space-y-4">
                  {pastPlacements.map((placement) => (
                    <div 
                      key={placement.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{placement.podcast_name}</h4>
                            {placement.media_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setSelectedMediaId(placement.media_id);
                                  setIsPodcastModalOpen(true);
                                }}
                              >
                                <Info className="w-4 h-4 text-gray-500 hover:text-primary" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Completed on {format(new Date(placement.date), 'MMMM d, yyyy')}
                          </p>
                          {placement.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {placement.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(placement.status)}
                        {placement.recording_link && (
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={placement.recording_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Recording
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No completed placements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Placement Calendar</CardTitle>
              <CardDescription>
                Visual overview of scheduled placements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={(metrics?.upcoming_placements || []).map(p => new Date(p.date))}
                  className="rounded-md border"
                  disabled={(date) => isBefore(date, new Date())}
                />
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Scheduled placement</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <span>Past date</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Podcast Details Modal */}
      {selectedMediaId && (
        <PodcastDetailsModal
          isOpen={isPodcastModalOpen}
          onClose={() => {
            setIsPodcastModalOpen(false);
            setSelectedMediaId(null);
          }}
          mediaId={selectedMediaId}
        />
      )}
    </div>
  );
}