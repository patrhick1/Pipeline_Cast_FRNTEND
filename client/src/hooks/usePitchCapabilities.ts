import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export interface PitchCapabilities {
  user_role: 'admin' | 'staff' | 'client';
  plan_type: 'admin' | 'paid_basic' | 'paid_premium' | 'free';
  capabilities: {
    manual_pitch_creation: boolean;
    ai_pitch_generation: boolean;
    view_templates: boolean;
    use_templates: boolean;
    send_via_nylas: boolean;
    send_via_instantly: boolean;
    view_all_pitches?: boolean;
    view_own_pitches?: boolean;
  };
  limits?: {
    ai_generations_per_month: number | 'unlimited';
    manual_pitches: 'unlimited';
  };
  upgrade_message?: string | null;
  upgrade_url?: string;
}

export function usePitchCapabilities() {
  const { user, isAuthenticated } = useAuth();

  const { data: capabilities, isLoading, error, refetch } = useQuery<PitchCapabilities>({
    queryKey: ['/pitches/capabilities'],
    queryFn: async () => {
      // Use the actual backend endpoint
      const response = await apiRequest('GET', '/pitches/capabilities');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch capabilities' }));
        throw new Error(errorData.detail);
      }
      const data = await response.json();
      
      // Add upgrade URL if it's a free plan
      if (data.plan_type === 'free' && !data.upgrade_url) {
        data.upgrade_url = '/settings/subscription';
      }
      
      return data;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    capabilities,
    isLoading,
    error,
    refetch,
    // Helper functions
    canUseAI: capabilities?.capabilities?.ai_pitch_generation || false,
    canCreateManual: capabilities?.capabilities?.manual_pitch_creation !== false,
    canViewTemplates: capabilities?.capabilities?.view_templates || false,
    canUseTemplates: capabilities?.capabilities?.use_templates || false,
    canSendNylas: capabilities?.capabilities?.send_via_nylas !== false,
    canSendInstantly: capabilities?.capabilities?.send_via_instantly !== false,
    isFreePlan: capabilities?.plan_type === 'free',
    isPaidPlan: capabilities?.plan_type === 'paid_basic' || capabilities?.plan_type === 'paid_premium',
    isBasicPlan: capabilities?.plan_type === 'paid_basic',
    isPremiumPlan: capabilities?.plan_type === 'paid_premium',
    isAdmin: capabilities?.user_role === 'admin' || capabilities?.user_role === 'staff',
  };
}