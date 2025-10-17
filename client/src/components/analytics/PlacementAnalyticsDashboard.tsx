import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingUp,
  Target,
  Award,
  Clock
} from 'lucide-react';
import type { DetailedAnalyticsResponse } from '@/types/inbox';

interface PlacementAnalyticsDashboardProps {
  campaignId?: string;
  days?: number;
}

export default function PlacementAnalyticsDashboard({ campaignId, days = 30 }: PlacementAnalyticsDashboardProps) {
  // Fetch enhanced analytics from new detailed endpoint
  const { data: analyticsData, isLoading } = useQuery<DetailedAnalyticsResponse>({
    queryKey: ['/analytics/detailed/filtered', { campaign_id: campaignId, days }],
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

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  // Extract outcome metrics from new detailed endpoint
  const outcomeMetrics = analyticsData.outcome_metrics || {
    total_outreach: 0,
    booking_success_rate: 0,
    publish_success_rate: 0,
    avg_days_to_publish: 0
  };

  const outcomeDistribution = analyticsData.outcome_distribution || [];
  const campaignPerformance = analyticsData.campaign_performance || [];

  // Prepare colors for outcome distribution bar chart
  const outcomeColors: Record<string, string> = {
    published: '#10b981',      // green
    scheduled: '#3b82f6',      // blue
    in_discussion: '#f59e0b',  // amber
    declined: '#ef4444',       // red
    no_response: '#9ca3af'     // gray
  };

  return (
    <div className="space-y-6">
      {/* Key Outcome Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Outreach
              </CardTitle>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outcomeMetrics.total_outreach}</div>
            <p className="text-xs text-gray-500 mt-1">
              Unique podcasts contacted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Booking Success
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outcomeMetrics.booking_success_rate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Reached scheduled or beyond
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Publish Success
              </CardTitle>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outcomeMetrics.publish_success_rate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Reached published/live
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Time to Publish
              </CardTitle>
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(outcomeMetrics.avg_days_to_publish)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Days for successful placements
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outcome Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Outcome Distribution</CardTitle>
            <CardDescription>
              Final outcome of all outreach efforts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {outcomeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={outcomeDistribution}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="label" type="category" width={110} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} (${outcomeDistribution.find((d) => d.label === name)?.percentage?.toFixed(1) || 0}%)`,
                        'Count'
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {outcomeDistribution.map((entry, index: number) => (
                        <Cell key={`cell-${index}`} fill={outcomeColors[entry.outcome] || '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No outcome data available
                </div>
              )}
            </div>
            {/* Legend below chart */}
            {outcomeDistribution.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {outcomeDistribution.map((entry) => (
                  <div key={entry.outcome} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: outcomeColors[entry.outcome] || '#9ca3af' }}
                    />
                    <span className="text-sm text-gray-600">
                      {entry.label}: <strong>{entry.count}</strong> ({entry.percentage?.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Performance Comparison */}
        {campaignPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Comparison</CardTitle>
              <CardDescription>
                Top campaigns by booking success rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={campaignPerformance}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: 'Success Rate (%)', position: 'insideBottom', offset: -5 }} />
                    <YAxis dataKey="campaign_name" type="category" width={110} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="booking_rate" fill="#10b981" name="Booking Rate" />
                    <Bar dataKey="publish_rate" fill="#3b82f6" name="Publish Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info card when viewing single campaign */}
      {campaignId && campaignPerformance.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Select "All Campaigns" to see campaign performance comparison
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
