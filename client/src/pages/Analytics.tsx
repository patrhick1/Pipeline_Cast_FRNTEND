import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import PitchAnalyticsDashboard from '@/components/analytics/PitchAnalyticsDashboard';
import PlacementAnalyticsDashboard from '@/components/analytics/PlacementAnalyticsDashboard';
import { BarChart3, Target, TrendingUp, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Campaign {
  id: string;
  name: string;
  client_name?: string;
}

interface AnalyticsSummary {
  active_campaigns: number;
  total_pitches_sent: number;
  placements_secured: number;
  upcoming_recordings: number;
  pending_reviews: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedDays, setSelectedDays] = useState<number>(30);
  
  // Fetch available campaigns with subscription info
  const { data: allCampaignsData = [] } = useQuery<Campaign[]>({
    queryKey: ['/campaigns/with-subscriptions', user?.role],
    queryFn: async () => {
      const response = await apiRequest('GET', '/campaigns/with-subscriptions');
      if (!response.ok) {
        // Fallback to regular campaigns endpoint
        const fallbackResponse = await apiRequest('GET', '/campaigns');
        if (!fallbackResponse.ok) throw new Error('Failed to fetch campaigns');
        const campaigns = await fallbackResponse.json();
        // Return campaigns without subscription data
        return campaigns.map((c: any) => ({ ...c, subscription_plan: 'free' }));
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Filter campaigns for admin/staff to only show paid_premium
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
  const campaigns = isStaffOrAdmin
    ? allCampaignsData.filter((c: any) => c.subscription_plan === 'paid_premium')
    : allCampaignsData;

  // Fetch analytics summary (no parameters documented)
  const { data: summary, isLoading: summaryLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['/analytics/summary'],
  });

  const isClient = user?.role?.toLowerCase() === 'client';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
              <p className="text-gray-600 mt-2">
                Track your podcast outreach performance and placement metrics
              </p>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex gap-4 items-center">
            {/* Date Range Selector */}
            <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(Number(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Campaign Selector */}
            {!isClient && campaigns && campaigns.length > 0 && (
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                      {campaign.client_name && (
                        <span className="text-gray-500 text-sm ml-2">
                          ({campaign.client_name})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Campaigns
              </CardTitle>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Pitches Sent
              </CardTitle>
              <Target className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                summary?.total_pitches_sent || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Placements Secured
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                summary?.placements_secured || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming Recordings
              </CardTitle>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                summary?.upcoming_recordings || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="pitches" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pitches">Pitch Analytics</TabsTrigger>
          <TabsTrigger value="placements">Placement Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pitches" className="space-y-6">
          <PitchAnalyticsDashboard 
            campaignId={selectedCampaignId === 'all' ? undefined : selectedCampaignId}
            days={selectedDays}
          />
        </TabsContent>

        <TabsContent value="placements" className="space-y-6">
          <PlacementAnalyticsDashboard 
            campaignId={selectedCampaignId === 'all' ? undefined : selectedCampaignId}
            days={selectedDays}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}