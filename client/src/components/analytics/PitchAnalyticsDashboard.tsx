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
  PieChart,
  Pie,
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
  Eye, 
  MessageSquare, 
  CheckCircle,
  XCircle,
  Clock,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import type { PitchMetrics, CampaignMetrics } from '@/types/inbox';

interface PitchAnalyticsDashboardProps {
  campaignId?: string;
  days?: number; // Optional days parameter for date filtering
}

export default function PitchAnalyticsDashboard({ campaignId, days = 30 }: PitchAnalyticsDashboardProps) {
  // Fetch metrics - using the correct backend endpoints with days parameter
  const { data: metrics, isLoading } = useQuery<CampaignMetrics | PitchMetrics>({
    queryKey: campaignId 
      ? [`/api/campaigns/${campaignId}/metrics`] // Campaign-specific metrics (no days param documented)
      : ['/pitches/metrics', { campaign_id: campaignId, days }], // General pitch metrics with filters
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

  const pitchMetrics = 'pitch_metrics' in metrics ? metrics.pitch_metrics : metrics as PitchMetrics;

  // Prepare data for charts with null safety
  const statusData = pitchMetrics?.by_status 
    ? Object.entries(pitchMetrics.by_status).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }))
    : [];

  const performanceData = [
    { name: 'Sent', value: pitchMetrics?.total_sent || 0, icon: Mail, color: 'text-blue-600' },
    { name: 'Opened', value: Math.round(pitchMetrics?.open_rate || 0), icon: Eye, color: 'text-green-600' },
    { name: 'Replied', value: Math.round(pitchMetrics?.reply_rate || 0), icon: MessageSquare, color: 'text-purple-600' },
    { name: 'Accepted', value: Math.round(pitchMetrics?.acceptance_rate || 0), icon: CheckCircle, color: 'text-emerald-600' },
  ];

  const COLORS = {
    pending: '#94a3b8',
    opened: '#3b82f6',
    replied: '#8b5cf6',
    accepted: '#10b981',
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
                {metric.name === 'Sent' ? metric.value : `${metric.value}%`}
              </div>
              {metric.name !== 'Sent' && (
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

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Status Distribution */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Pitch Status Distribution</CardTitle>
              <CardDescription>
                Current status of all sent pitches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart */}
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
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#94a3b8'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status List */}
                <div className="space-y-4">
                  {statusData.map((status) => {
                    const percentage = (pitchMetrics?.total_sent || 0) > 0 
                      ? (status.value / (pitchMetrics?.total_sent || 1) * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={status.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[status.name.toLowerCase() as keyof typeof COLORS] || '#94a3b8' }}
                          />
                          <span className="font-medium">{status.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">{status.value}</span>
                          <Badge variant="secondary">{percentage}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Recent pitch events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {'timeline_events' in metrics && metrics.timeline_events ? (
                <div className="space-y-4">
                  {metrics.timeline_events.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="p-2 rounded-full bg-gray-100">
                        {event.type === 'email_sent' && <Mail className="w-4 h-4 text-blue-600" />}
                        {event.type === 'email_opened' && <Eye className="w-4 h-4 text-green-600" />}
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
                <p className="text-gray-500 text-center py-8">No timeline events available</p>
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
                      <span className="text-sm font-medium">Opened</span>
                      <span className="text-sm text-gray-600">
                        {Math.round((pitchMetrics?.total_sent || 0) * (pitchMetrics?.open_rate || 0) / 100)}
                        <span className="ml-2 text-gray-400">({pitchMetrics?.open_rate || 0}%)</span>
                      </span>
                    </div>
                    <Progress value={pitchMetrics?.open_rate || 0} className="h-8" />
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
                      <span className="text-sm font-medium">Accepted</span>
                      <span className="text-sm text-gray-600">
                        {Math.round((pitchMetrics?.total_sent || 0) * (pitchMetrics?.acceptance_rate || 0) / 100)}
                        <span className="ml-2 text-gray-400">({pitchMetrics?.acceptance_rate || 0}%)</span>
                      </span>
                    </div>
                    <Progress value={pitchMetrics?.acceptance_rate || 0} className="h-8" />
                  </div>
                </div>

                {/* Conversion Rates */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Stage-to-Stage Conversion</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Open to Reply</p>
                      <p className="text-2xl font-bold">
                        {(pitchMetrics?.open_rate || 0) > 0 
                          ? Math.round((pitchMetrics?.reply_rate || 0) / (pitchMetrics?.open_rate || 1) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reply to Accept</p>
                      <p className="text-2xl font-bold">
                        {(pitchMetrics?.reply_rate || 0) > 0 
                          ? Math.round((pitchMetrics?.acceptance_rate || 0) / (pitchMetrics?.reply_rate || 1) * 100)
                          : 0}%
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