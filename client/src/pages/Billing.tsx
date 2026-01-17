import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Link, useLocation } from "wouter";
import { formatUTCDateOnly } from "@/lib/timezone";
import BillingFreePlan from "./BillingFreePlan";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  Package,
  Clock,
  Zap,
  Sparkles,
  Crown
} from "lucide-react";

interface SubscriptionData {
  plan_type: string;
  status: string;
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

const PLAN_DETAILS = {
  free: {
    name: "Free Plan",
    icon: Zap,
    color: "bg-gray-100 text-gray-700",
    description: "Basic features for getting started"
  },
  paid_basic: {
    name: "Basic Plan",
    icon: Sparkles,
    color: "bg-blue-100 text-blue-700",
    description: "Professional features for growing podcasters"
  },
  paid_premium: {
    name: "Premium Plan",
    icon: Crown,
    color: "bg-teal/10 text-teal",
    description: "Advanced features for podcast professionals"
  }
};

const STATUS_CONFIG = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle
  },
  trialing: {
    label: "Trial",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock
  },
  past_due: {
    label: "Past Due",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: AlertCircle
  },
  canceled: {
    label: "Canceled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle
  },
  incomplete: {
    label: "Incomplete",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: AlertCircle
  },
  incomplete_expired: {
    label: "Expired",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle
  },
  unpaid: {
    label: "Unpaid",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle
  }
};

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  return formatUTCDateOnly(dateString);
}

function BillingInfoCard({ subscription }: { subscription: SubscriptionData }) {
  const planInfo = PLAN_DETAILS[subscription.plan_type as keyof typeof PLAN_DETAILS];
  const statusInfo = STATUS_CONFIG[subscription.status as keyof typeof STATUS_CONFIG];
  const Icon = planInfo?.icon || Package;
  const StatusIcon = statusInfo?.icon || AlertCircle;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Subscription</CardTitle>
          <Badge className={statusInfo?.color || "bg-gray-100 text-gray-700"}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo?.label || subscription.status}
          </Badge>
        </div>
        <CardDescription>Manage your subscription and billing details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${planInfo?.color || 'bg-gray-100'}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{planInfo?.name || subscription.plan_type}</h3>
            <p className="text-sm text-gray-600">{planInfo?.description}</p>
          </div>
        </div>

        {subscription.cancel_at_period_end && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription will be canceled at the end of the current billing period on {formatDate(subscription.current_period_end)}.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Period</p>
            <p className="font-medium">
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </p>
          </div>

          {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Trial Ends</p>
              <p className="font-medium">{formatDate(subscription.trial_end)}</p>
            </div>
          )}

          {subscription.payment_method && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment Method</p>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {subscription.payment_method.brand} •••• {subscription.payment_method.last4}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Expires {subscription.payment_method.exp_month}/{subscription.payment_method.exp_year}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/billing/portal-session`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button className="w-full" variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          </a>
          
          {subscription.plan_type !== 'paid_premium' && (
            <Link href="/pricing">
              <Button className="w-full" variant="outline">
                Upgrade Plan
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



export default function Billing() {
  const { user } = useAuth();
  const { isFreePlan, subscription: subscriptionFromHook } = useSubscription();

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/billing/subscription');
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch subscription');
      }
      return response.json() as Promise<SubscriptionData>;
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your billing information
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Redirect free plan users to the dedicated free plan page
  if (!isLoading && (isFreePlan || !subscription || subscription?.plan_type === 'free')) {
    return <BillingFreePlan />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load billing information. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and payment details</p>
        </div>

        <div className="grid gap-6">
          <BillingInfoCard subscription={subscription!} />
        </div>
      </div>
    </div>
  );
}