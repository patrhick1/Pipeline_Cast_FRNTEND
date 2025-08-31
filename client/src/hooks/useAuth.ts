// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

interface AuthUser {
  username: string; // This is the email
  role: string | null;
  person_id: number | null; // Changed from optional to match backend session data more closely
  full_name: string | null; // Changed from optional
  
  // Email verification fields
  email_verified?: boolean;
  email_verified_at?: string | null;
  email_verification_required?: boolean;
  grace_period_end_date?: string | null;
  
  // Onboarding fields
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  needs_onboarding?: boolean;
  has_campaign_data?: boolean;
  has_onboarding_token?: boolean;
  
  // UI flags
  show_verification_banner?: boolean;
  show_onboarding_button?: boolean;
  
  // Fields from Person schema / settings page
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  timezone?: string | null;
  linkedin_profile_url?: string | null;
  twitter_profile_url?: string | null;
  instagram_profile_url?: string | null;
  tiktok_profile_url?: string | null;
  dashboard_username?: string | null;
  profile_image_url?: string | null; // Match backend response field name
  notification_settings?: Record<string, any> | null; // Assuming object, adjust if different
  privacy_settings?: Record<string, any> | null;    // Assuming object, adjust if different
}

interface OAuthProvider {
  provider: string;
  connected: boolean;
  email?: string;
  is_only_auth_method?: boolean;
}

export function useAuth() {
  const { data: user, isLoading, error, isSuccess } = useQuery<AuthUser | null>({
    queryKey: ["/auth/me"], // Corrected path to match backend auth.router
    queryFn: async (context) => {
      try {
        const result = await getQueryFn<AuthUser | null>({ on401: "returnNull" })(context);
        return result;
      } catch (err: any) {
        // Handle 404 errors gracefully - treat as not authenticated
        if (err?.status === 404) {
          console.warn('Auth endpoint not found, treating as unauthenticated');
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: true,
  });

  // Debug logging
  console.log('🔐 useAuth data:', { user, isLoading, error, isSuccess });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error && isSuccess, // Ensure query was successful
    error,
  };
}

// OAuth-related functions
export async function getOAuthProviders(): Promise<OAuthProvider[]> {
  try {
    const response = await apiRequest("GET", "/auth/oauth/providers");
    if (!response.ok) {
      throw new Error("Failed to get OAuth providers");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to get OAuth providers:", error);
    return [];
  }
}

export async function linkOAuthProvider(provider: string): Promise<{ authorization_url: string }> {
  const response = await apiRequest("POST", `/auth/oauth/${provider}/link`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to link provider" }));
    throw new Error(errorData.detail || "Failed to link provider");
  }
  return await response.json();
}

export async function disconnectOAuthProvider(provider: string, password?: string): Promise<void> {
  const formData = new FormData();
  if (password) {
    formData.append("password", password);
  }
  
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/oauth/${provider}/disconnect`, {
    method: "DELETE",
    body: formData,
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to disconnect provider" }));
    throw new Error(errorData.detail || "Failed to disconnect provider");
  }
}