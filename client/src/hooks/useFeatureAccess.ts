// client/src/hooks/useFeatureAccess.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

export interface SubscriptionStatus {
  subscription_plan: 'free' | 'paid_basic' | 'paid_premium';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  trial_end_date: string | null;
}

export function useFeatureAccess() {
  const { user, isAuthenticated } = useAuth();

  // Fetch subscription status for clients
  const { data: subscriptionData, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/subscription/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/subscription/status');
      if (!response.ok) {
        // If the endpoint fails, assume free plan
        return {
          subscription_plan: 'free',
          stripe_subscription_id: null,
          stripe_customer_id: null,
          subscription_status: null,
          trial_end_date: null
        };
      }
      return response.json();
    },
    enabled: isAuthenticated && user?.role?.toLowerCase() === 'client',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Determine if user has access to premium features
  const hasPaidAccess = () => {
    // Admin and staff always have access
    if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'staff') {
      return true;
    }

    // For clients, check subscription plan
    if (user?.role?.toLowerCase() === 'client') {
      const plan = subscriptionData?.subscription_plan;
      return plan === 'paid_basic' || plan === 'paid_premium';
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
      'my-campaigns' // Can view campaigns but not create/manage them
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
    subscriptionPlan: subscriptionData?.subscription_plan || 'free',
    subscriptionStatus: subscriptionData?.subscription_status,
    isLoading,
    canAccessFeature,
  };
}
