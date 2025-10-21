// client/src/hooks/useFeatureAccess.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { CampaignWithSubscription } from '@/services/campaignSubscription';

export function useFeatureAccess() {
  const { user, isAuthenticated } = useAuth();

  // Fetch campaigns with subscription info for clients
  const { data: campaignsData, isLoading } = useQuery<CampaignWithSubscription[]>({
    queryKey: ['/campaigns/with-subscriptions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/campaigns/with-subscriptions');
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: isAuthenticated && user?.role?.toLowerCase() === 'client',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract subscription plan from client's campaigns
  // All campaigns for a client have the same subscription
  const subscriptionPlan = campaignsData?.[0]?.subscription_plan || 'free';

  // Determine if user has access to premium features
  const hasPaidAccess = () => {
    // Admin and staff always have access
    if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'staff') {
      return true;
    }

    // For clients, check subscription plan from their campaigns
    if (user?.role?.toLowerCase() === 'client') {
      return subscriptionPlan === 'paid_basic' || subscriptionPlan === 'paid_premium';
    }

    return false;
  };

  const canAccessFeature = (featureName: string): boolean => {
    // Features that are always accessible (ungated)
    const freeFeatures = [
      'profile-setup',
      'media-kit',
      'settings',
      'dashboard',
      'my-campaigns'
    ];

    if (freeFeatures.includes(featureName.toLowerCase())) {
      return true;
    }

    // Premium features require paid access
    const premiumFeatures = [
      'approvals',
      'match-approvals',
      'pitch-outreach',
      'placement-tracking',
      'analytics',
      'inbox'
    ];

    if (premiumFeatures.includes(featureName.toLowerCase())) {
      return hasPaidAccess();
    }

    // Default to allowing access if feature is not explicitly defined
    return true;
  };

  return {
    hasPaidAccess: hasPaidAccess(),
    subscriptionPlan,
    isLoading,
    canAccessFeature,
  };
}
