import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

export interface SubscriptionData {
  plan_type: 'free' | 'paid_basic' | 'paid_premium';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  trial_end?: string;
  payment_method?: {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
  };
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/billing/subscription');
      if (!response.ok) {
        if (response.status === 404) {
          return {
            plan_type: 'free',
            status: 'active'
          } as SubscriptionData;
        }
        throw new Error('Failed to fetch subscription');
      }
      return response.json() as Promise<SubscriptionData>;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isFreePlan = !subscription || subscription.plan_type === 'free';
  const isBasicPlan = subscription?.plan_type === 'paid_basic';
  const isPremiumPlan = subscription?.plan_type === 'paid_premium';
  const isPaidPlan = isBasicPlan || isPremiumPlan;
  const isActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  const hasFeature = (feature: string): boolean => {
    if (!isActiveSubscription && !isFreePlan) return false;

    const featureMatrix: Record<string, { free: boolean; basic: boolean; premium: boolean }> = {
      'basic_discovery': { free: true, basic: true, premium: true },
      'limited_searches': { free: true, basic: false, premium: false },
      'unlimited_searches': { free: false, basic: true, premium: true },
      'basic_media_kit': { free: true, basic: true, premium: true },
      'advanced_media_kit': { free: false, basic: true, premium: true },
      'ai_pitch_generation': { free: false, basic: true, premium: true },
      'unlimited_ai_generation': { free: false, basic: false, premium: true },
      'batch_pitch_sending': { free: false, basic: false, premium: true },
      'email_tracking': { free: false, basic: true, premium: true },
      'advanced_analytics': { free: false, basic: false, premium: true },
      'custom_templates': { free: false, basic: false, premium: true },
      'api_access': { free: false, basic: false, premium: true },
      'priority_support': { free: false, basic: true, premium: true },
      'dedicated_manager': { free: false, basic: false, premium: true },
    };

    const featureAccess = featureMatrix[feature];
    if (!featureAccess) return false;

    if (isFreePlan) return featureAccess.free;
    if (isBasicPlan) return featureAccess.basic;
    if (isPremiumPlan) return featureAccess.premium;
    
    return false;
  };

  const getFeatureLimits = () => {
    if (isFreePlan) {
      return {
        searches_per_month: 5,
        pitches_per_month: 0,
        ai_generations_per_month: 0,
        campaigns: 1,
        team_members: 1,
      };
    }
    
    if (isBasicPlan) {
      return {
        searches_per_month: -1,
        pitches_per_month: 100,
        ai_generations_per_month: 50,
        campaigns: 5,
        team_members: 1,
      };
    }
    
    if (isPremiumPlan) {
      return {
        searches_per_month: -1,
        pitches_per_month: -1,
        ai_generations_per_month: -1,
        campaigns: -1,
        team_members: 10,
      };
    }

    return {
      searches_per_month: 0,
      pitches_per_month: 0,
      ai_generations_per_month: 0,
      campaigns: 0,
      team_members: 0,
    };
  };

  const requiresUpgrade = (requiredPlan: 'basic' | 'premium'): boolean => {
    if (!isActiveSubscription && !isFreePlan) return true;
    
    if (requiredPlan === 'basic') {
      return isFreePlan;
    }
    
    if (requiredPlan === 'premium') {
      return isFreePlan || isBasicPlan;
    }
    
    return false;
  };

  return {
    subscription,
    isLoading,
    error,
    refetch,
    isFreePlan,
    isBasicPlan,
    isPremiumPlan,
    isPaidPlan,
    isActiveSubscription,
    hasFeature,
    getFeatureLimits,
    requiresUpgrade,
    planType: subscription?.plan_type || 'free',
    status: subscription?.status || 'active',
  };
}