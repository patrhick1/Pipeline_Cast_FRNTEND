import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Redirect } from "wouter";

interface PremiumClientRouteProps {
  children: React.ReactNode;
}

// This component prevents premium clients from accessing certain pages
// Premium clients have their outreach handled by staff, so they shouldn't access these features
export function PremiumClientRoute({ children }: PremiumClientRouteProps) {
  const { user } = useAuth();
  const { isPremiumPlan } = useSubscription();

  const userRoleLower = user?.role?.toLowerCase();
  const isPremiumClient = userRoleLower === 'client' && isPremiumPlan;

  // If user is a premium client, redirect to dashboard
  if (isPremiumClient) {
    return <Redirect to="/" replace />;
  }

  // Otherwise, render the children
  return <>{children}</>;
}