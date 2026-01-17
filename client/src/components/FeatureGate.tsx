import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Lock, Sparkles, Crown, AlertCircle } from "lucide-react";

interface FeatureGateProps {
  feature?: string;
  requiredPlan?: 'basic' | 'premium';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  customMessage?: string;
}

export function FeatureGate({
  feature,
  requiredPlan,
  children,
  fallback,
  showUpgradePrompt = true,
  customMessage
}: FeatureGateProps) {
  const { hasFeature, requiresUpgrade, planType, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const hasAccess = feature ? hasFeature(feature) : !requiresUpgrade(requiredPlan || 'basic');

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return <UpgradePrompt requiredPlan={requiredPlan} customMessage={customMessage} currentPlan={planType} />;
}

interface UpgradePromptProps {
  requiredPlan?: 'basic' | 'premium';
  customMessage?: string;
  currentPlan: string;
  compact?: boolean;
}

export function UpgradePrompt({ 
  requiredPlan = 'basic', 
  customMessage,
  currentPlan,
  compact = false
}: UpgradePromptProps) {
  const Icon = requiredPlan === 'premium' ? Crown : Sparkles;
  const planName = requiredPlan === 'premium' ? 'Premium' : 'Basic';
  
  const defaultMessage = requiredPlan === 'premium' 
    ? "Unlock advanced features with our Premium plan"
    : "Upgrade to our Basic plan to access this feature";

  if (compact) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <Lock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-amber-800">
            {customMessage || `This feature requires the ${planName} plan`}
          </span>
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="ml-4">
              Upgrade
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-100 to-navy-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-teal-600" />
        </div>
        <CardTitle>Upgrade to {planName}</CardTitle>
        <CardDescription>
          {customMessage || defaultMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            You're currently on the <span className="font-semibold">{currentPlan}</span> plan
          </p>
          {requiredPlan === 'premium' && (
            <div className="text-left max-w-xs mx-auto space-y-2">
              <p className="text-sm font-semibold text-gray-700">Premium features include:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Unlimited AI generations</li>
                <li>• Batch pitch sending</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
              </ul>
            </div>
          )}
          {requiredPlan === 'basic' && currentPlan === 'free' && (
            <div className="text-left max-w-xs mx-auto space-y-2">
              <p className="text-sm font-semibold text-gray-700">Basic features include:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Unlimited podcast searches</li>
                <li>• AI pitch generation</li>
                <li>• Email tracking</li>
                <li>• Advanced media kit</li>
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing">
            <Button>
              View Plans
            </Button>
          </Link>
          <Link href="/billing">
            <Button variant="outline">
              Manage Subscription
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface FeatureLimitAlertProps {
  feature: string;
  currentUsage: number;
  limit: number;
  upgradeText?: string;
}

export function FeatureLimitAlert({ 
  feature, 
  currentUsage, 
  limit, 
  upgradeText = "Upgrade for unlimited access" 
}: FeatureLimitAlertProps) {
  const percentUsed = (currentUsage / limit) * 100;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = currentUsage >= limit;

  if (percentUsed < 50) return null;

  return (
    <Alert className={`${isAtLimit ? 'border-red-200 bg-red-50' : isNearLimit ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
      <AlertCircle className={`h-4 w-4 ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-blue-600'}`} />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className={`font-medium ${isAtLimit ? 'text-red-800' : isNearLimit ? 'text-amber-800' : 'text-blue-800'}`}>
            {isAtLimit 
              ? `You've reached your ${feature} limit` 
              : `${currentUsage} of ${limit} ${feature} used this month`}
          </span>
          {!isAtLimit && (
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
                }`} 
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          )}
        </div>
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="ml-4">
            {upgradeText}
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}