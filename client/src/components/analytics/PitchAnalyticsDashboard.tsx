import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import type { PitchMetrics, CampaignMetrics, CampaignMetricsResponse, TimelineEvent } from '@/types/inbox';

interface PitchAnalyticsDashboardProps {
  campaignId?: string;
  days?: number; // Optional days parameter for date filtering
  planType?: 'paid_premium'; // Optional plan type filter for admin/staff viewing all campaigns
}

export default function PitchAnalyticsDashboard({ campaignId, days = 30, planType }: PitchAnalyticsDashboardProps) {
  // Fetch metrics using the new analytics endpoints
  const { data: metrics, isLoading } = useQuery<CampaignMetricsResponse | CampaignMetrics | any>({
    queryKey: campaignId
      ? [`/api/campaigns/${campaignId}/metrics`, { days }] // Campaign-specific detailed metrics
      : ['/analytics/summary/filtered', { days, plan_type: planType }], // General analytics summary with days filter and optional plan_type
  });

  // Fetch timeline events if we have pitch data
  // Note: This would need to be implemented per pitch or aggregated
  // For now, we'll use the timeline_events from metrics if available

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
          <p className="text-gray-500">No metrics available</p>
        </CardContent>
      </Card>
    );
  }

  // Handle different response formats
  const pitchMetrics: PitchMetrics = 'summary' in metrics && 'rates' in metrics
    ? {
        // NEW: Handle CampaignMetricsResponse format (from /api/campaigns/{id}/metrics)
        total_sent: (metrics as CampaignMetricsResponse).summary.total_sent || 0, // 83 unique podcasts
        total_pitches: (metrics as CampaignMetricsResponse).summary.total_pitches || 0, // 203 total emails
        reply_rate: (metrics as CampaignMetricsResponse).rates.reply_rate || 0, // 21.69%
        booking_rate: (metrics as CampaignMetricsResponse).rates.booking_rate || 0, // 20.48%
        bounce_rate: (metrics as CampaignMetricsResponse).rates.bounce_rate || 0, // 1.2%
        avg_pitches_per_match: (metrics as CampaignMetricsResponse).engagement?.avg_pitches_per_match || 0, // 2.45
        avg_pitches_to_reply: (metrics as CampaignMetricsResponse).engagement?.avg_pitches_to_get_reply || 0, // 1.56
        by_status: {
          pending: Math.max(
            0,
            ((metrics as CampaignMetricsResponse).summary.total_sent || 0) -
            ((metrics as CampaignMetricsResponse).summary.total_replied || 0) -
            ((metrics as CampaignMetricsResponse).summary.confirmed_bookings || 0)
          ), // 83 - 18 - 2 = 63
          replied: (metrics as CampaignMetricsResponse).summary.total_replied || 0, // 18
          booked: (metrics as CampaignMetricsResponse).summary.confirmed_bookings || 0, // 2 (confirmed bookings, not placements_created)
          rejected: 0, // Not tracked separately in backend
        }
      }
    : 'pitch_metrics' in metrics
    ? {
        ...metrics.pitch_metrics,
        // Ensure booking_rate exists (fallback to acceptance_rate for backwards compatibility)
        booking_rate: metrics.pitch_metrics.booking_rate ?? metrics.pitch_metrics.acceptance_rate ?? 0,
        by_status: {
          ...metrics.pitch_metrics.by_status,
          booked: metrics.pitch_metrics.by_status.booked ?? metrics.pitch_metrics.by_status.accepted ?? 0,
        }
      }
    : 'unique_outreach' in metrics
    ? {
        // Convert AnalyticsSummary to PitchMetrics format
        total_sent: (metrics as any).unique_outreach || 0,
        reply_rate: (metrics as any).interested_responses
          ? Math.round(((metrics as any).interested_responses / (metrics as any).unique_outreach) * 100)
          : 0,
        booking_rate: (metrics as any).confirmed_bookings
          ? Math.round(((metrics as any).confirmed_bookings / (metrics as any).unique_outreach) * 100)
          : 0,
        by_status: {
          pending: (metrics as any).pending_reviews || 0,
          replied: (metrics as any).interested_responses || 0,
          booked: (metrics as any).confirmed_bookings || 0,
          rejected: 0, // Not available in new summary format
        }
      }
    : metrics as PitchMetrics;

  // Prepare data for charts with null safety
  const statusData = pitchMetrics?.by_status 
    ? Object.entries(pitchMetrics.by_status).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }))
    : [];

  const performanceData = [
    {
      name: 'Unique Outreach',
      value: pitchMetrics?.total_sent || 0,
      subtitle: pitchMetrics?.total_pitches ? `${pitchMetrics.total_pitches} total pitches` : undefined,
      icon: Mail,
      color: 'text-blue-600',
      isCount: true
    },
    {
      name: 'Reply Rate',
      value: Math.round(pitchMetrics?.reply_rate || 0),
      subtitle: `${pitchMetrics?.by_status?.replied || 0} replies`,
      icon: MessageSquare,
      color: 'text-purple-600',
      isCount: false
    },
    {
      name: 'Booking Rate',
      value: Math.round(pitchMetrics?.booking_rate || 0),
      subtitle: `${pitchMetrics?.by_status?.booked || 0} bookings`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      isCount: false
    },
    {
      name: 'Avg Follow-ups',
      value: pitchMetrics?.avg_pitches_per_match || 0,
      subtitle: 'Pitches per podcast match',
      icon: TrendingUp,
      color: 'text-orange-600',
      isCount: true,
      decimals: 1
    },
  ];

  const COLORS = {
    pending: '#94a3b8',
    replied: '#8b5cf6',
    booked: '#10b981',
    accepted: '#10b981', // Backwards compatibility
    rejected: '#ef4444',
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Campaign Title if available */}
      {'campaign_name' in metrics && (
        <div>
          <h2 className="text-2xl font-bold">{metrics.campaign_name}</h2>
          <p className="text-gray-600">Campaign Analytics</p>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceData.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.name}
                </CardTitle>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.isCount
                  ? (metric.decimals ? metric.value.toFixed(metric.decimals) : metric.value)
                  : `${metric.value}%`
                }
              </div>
              {metric.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
              )}
              {!metric.isCount && (
                <Progress value={metric.value} className="mt-2 h-2" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Average Response Time */}
      {pitchMetrics?.average_response_time && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <CardTitle>Average Response Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {Math.round((pitchMetrics?.average_response_time || 0) / 3600)}
              </span>
              <span className="text-gray-600">hours</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                {('daily_breakdown' in metrics && metrics.daily_breakdown)
                  ? 'Daily pitch activity over time'
                  : 'Recent pitch events and activities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {'daily_breakdown' in metrics && metrics.daily_breakdown ? (
                <div className="space-y-6">
                  {/* Daily Breakdown Chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(metrics as CampaignMetricsResponse).daily_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sent"
                          stroke="#3b82f6"
                          name="Sent"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="replied"
                          stroke="#8b5cf6"
                          name="Replied"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Daily Stats List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {(metrics as CampaignMetricsResponse).daily_breakdown
                      .slice()
                      .reverse()
                      .map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{format(new Date(day.date), 'EEEE, MMM d, yyyy')}</p>
                            <div className="flex gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {day.sent} sent
                              </span>
                              {day.replied > 0 && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <MessageSquare className="w-3 h-3" />
                                  {day.replied} replied
                                </span>
                              )}
                            </div>
                          </div>
                          {day.replied > 0 && (
                            <Badge variant="secondary">
                              {((day.replied / day.sent) * 100).toFixed(1)}% reply rate
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ) : 'timeline_events' in metrics && metrics.timeline_events ? (
                <div className="space-y-4">
                  {metrics.timeline_events.slice(0, 10).map((event: TimelineEvent) => (
                    <div key={event.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="p-2 rounded-full bg-gray-100">
                        {event.type === 'email_sent' && <Mail className="w-4 h-4 text-blue-600" />}
                        {event.type === 'email_replied' && <MessageSquare className="w-4 h-4 text-purple-600" />}
                        {event.type === 'booking_confirmed' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                        {event.type === 'placement_completed' && <Target className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.details}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No timeline data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Funnel</CardTitle>
              <CardDescription>
                Conversion rates through each stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Funnel Visualization */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sent</span>
                      <span className="text-sm text-gray-600">{pitchMetrics?.total_sent || 0}</span>
                    </div>
                    <Progress value={100} className="h-8" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Replied</span>
                      <span className="text-sm text-gray-600">
                        {Math.round((pitchMetrics?.total_sent || 0) * (pitchMetrics?.reply_rate || 0) / 100)}
                        <span className="ml-2 text-gray-400">({pitchMetrics?.reply_rate || 0}%)</span>
                      </span>
                    </div>
                    <Progress value={pitchMetrics?.reply_rate || 0} className="h-8" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Booked</span>
                      <span className="text-sm text-gray-600">
                        {pitchMetrics?.by_status?.booked || 0}
                        <span className="ml-2 text-gray-400">({pitchMetrics?.booking_rate || 0}%)</span>
                      </span>
                    </div>
                    <Progress value={pitchMetrics?.booking_rate || 0} className="h-8" />
                  </div>
                </div>

                {/* Conversion Rates */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Stage-to-Stage Conversion</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Sent to Reply</p>
                      <p className="text-2xl font-bold">
                        {Math.round(pitchMetrics?.reply_rate || 0)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {pitchMetrics?.by_status?.replied || 0} replies / {pitchMetrics?.total_sent || 0} sent
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reply to Booking</p>
                      <p className="text-2xl font-bold">
                        {(pitchMetrics?.by_status?.replied || 0) > 0
                          ? Math.round(((pitchMetrics?.by_status?.booked || 0) / (pitchMetrics?.by_status?.replied || 1)) * 100)
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {pitchMetrics?.by_status?.booked || 0} bookings / {pitchMetrics?.by_status?.replied || 0} replies
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}