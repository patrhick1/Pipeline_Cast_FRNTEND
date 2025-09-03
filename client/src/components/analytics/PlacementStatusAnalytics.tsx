import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Activity,
  Target,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface PlacementStatusAnalyticsProps {
  campaignId?: string;
  days?: number;
}

interface StatusHistoryData {
  period: string;
  date_range: {
    start: string;
    end: string;
  };
  current_status_distribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  status_history_by_period: Array<{
    period: string;
    total: number;
    statuses: Record<string, {
      count: number;
      percentage: number;
    }>;
  }>;
  status_transitions: Array<{
    from_status: string;
    to_status: string;
    count: number;
    avg_days_in_from_status: number;
  }>;
  time_in_status: Array<{
    status: string;
    metrics: {
      occurrences: number;
      avg_days: number;
      min_days: number;
      max_days: number;
      median_days: number;
    };
  }>;
  conversion_funnel: {
    contacted: number;
    confirmed: number;
    scheduled: number;
    recorded: number;
    published: number;
    paid: number;
    confirmation_rate: number;
    recording_rate: number;
    publish_rate: number;
  };
}

const statusColors: Record<string, string> = {
  'initial_contact': '#6b7280',
  'initial_reply': '#60a5fa',
  'in_discussion': '#3b82f6',
  'confirmed_interest': '#34d399',
  'confirmed': '#10b981',
  'scheduling': '#fbbf24',
  'scheduled': '#f97316',
  'recording_booked': '#a78bfa',
  'recorded': '#8b5cf6',
  'live': '#14b8a6',
  'published': '#10b981',
  'paid': '#22c55e',
  'needs_info': '#fb923c',
  'declined': '#f87171',
  'cancelled': '#ef4444',
  'rejected': '#dc2626',
  'default': '#9ca3af'
};

const statusLabels: Record<string, string> = {
  'initial_contact': 'Initial Contact',
  'initial_reply': 'Initial Reply',
  'in_discussion': 'In Discussion',
  'confirmed_interest': 'Confirmed Interest',
  'confirmed': 'Confirmed',
  'scheduling': 'Scheduling',
  'scheduled': 'Scheduled',
  'recording_booked': 'Recording Booked',
  'recorded': 'Recorded',
  'live': 'Live',
  'published': 'Published',
  'paid': 'Paid',
  'needs_info': 'Needs Info',
  'declined': 'Declined',
  'cancelled': 'Cancelled',
  'rejected': 'Rejected'
};

export default function PlacementStatusAnalytics({ campaignId, days = 30 }: PlacementStatusAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');
  
  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch status history analytics
  const { data: analytics, isLoading, error } = useQuery<StatusHistoryData>({
    queryKey: ['/placements/analytics/status-history', { 
      campaign_id: campaignId,
      period: selectedPeriod,
      start_date: startDate,
      end_date: endDate
    }],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load placement analytics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare data for charts
  const funnelData = analytics.conversion_funnel ? [
    { stage: 'Contacted', value: analytics.conversion_funnel.contacted || 0, fill: '#3b82f6' },
    { stage: 'Confirmed', value: analytics.conversion_funnel.confirmed || 0, fill: '#10b981' },
    { stage: 'Scheduled', value: analytics.conversion_funnel.scheduled || 0, fill: '#f97316' },
    { stage: 'Recorded', value: analytics.conversion_funnel.recorded || 0, fill: '#8b5cf6' },
    { stage: 'Published', value: analytics.conversion_funnel.published || 0, fill: '#14b8a6' },
    { stage: 'Paid', value: analytics.conversion_funnel.paid || 0, fill: '#22c55e' }
  ].filter(item => item.value > 0) : [];

  // Prepare timeline data
  const timelineData = (analytics.status_history_by_period || []).map(period => {
    const data: any = { period: format(new Date(period.period), 'MMM d') };
    Object.entries(period.statuses || {}).forEach(([status, values]) => {
      data[status] = values.count;
    });
    return data;
  });

  // Get unique statuses for timeline chart
  const uniqueStatuses = [...new Set(
    (analytics.status_history_by_period || []).flatMap(p => Object.keys(p.statuses || {}))
  )];

  // Prepare duration data
  const durationData = (analytics.time_in_status || [])
    .sort((a, b) => (b.metrics?.avg_days || 0) - (a.metrics?.avg_days || 0))
    .slice(0, 8)
    .map(item => ({
      status: statusLabels[item.status] || item.status,
      avg: parseFloat((item.metrics?.avg_days || 0).toFixed(1)),
      min: parseFloat((item.metrics?.min_days || 0).toFixed(1)),
      max: parseFloat((item.metrics?.max_days || 0).toFixed(1))
    }));

  // Top transitions
  const topTransitions = (analytics.status_transitions || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Placement Status Analytics</h3>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Confirmation Rate
              </CardTitle>
              <Target className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.conversion_funnel?.confirmation_rate || 0).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Contacted to confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Recording Rate
              </CardTitle>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.conversion_funnel?.recording_rate || 0).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Contacted to recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Publish Rate
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.conversion_funnel?.publish_rate || 0).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Contacted to published
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of all placements by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.current_status_distribution || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(analytics.current_status_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status] || statusColors.default} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, statusLabels[name as string] || name]} />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical"
                    formatter={(value) => statusLabels[value] || value}
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Progression through key milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status Changes Over Time</CardTitle>
            <CardDescription>
              {selectedPeriod === 'day' ? 'Daily' : 
               selectedPeriod === 'week' ? 'Weekly' :
               selectedPeriod === 'month' ? 'Monthly' : 'Quarterly'} status progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {uniqueStatuses.map((status, index) => (
                    <Area
                      key={status}
                      type="monotone"
                      dataKey={status}
                      stackId="1"
                      stroke={statusColors[status] || statusColors.default}
                      fill={statusColors[status] || statusColors.default}
                      name={statusLabels[status] || status}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average Time in Status */}
        <Card>
          <CardHeader>
            <CardTitle>Average Time in Status</CardTitle>
            <CardDescription>
              Days spent in each status (avg)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={durationData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Status Transitions */}
        <Card>
          <CardHeader>
            <CardTitle>Top Status Transitions</CardTitle>
            <CardDescription>
              Most common status progressions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTransitions.map((transition, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {statusLabels[transition.from_status] || transition.from_status}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge variant="outline">
                      {statusLabels[transition.to_status] || transition.to_status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{transition.count}</div>
                    <div className="text-xs text-gray-500">
                      ~{(transition.avg_days_in_from_status || 0).toFixed(1)} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}