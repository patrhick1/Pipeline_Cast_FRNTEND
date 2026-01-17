"use client";

import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { CheckIcon, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ApiPlan {
  stripe_product_id: string;
  stripe_price_id: string;
  plan_type: string;
  billing_period: 'month' | 'year';
  amount: number; // In cents
  currency: string;
  features: Record<string, any>;
}

type PLAN = {
    id: string; // This will be plan_type from API
    title: string;
    desc: string;
    monthlyPrice: number; // This will be amount / 100 from API
    stripePriceId: string; // This will be stripe_price_id from API
    stripeMonthlyPlanId?: string; // Monthly plan ID for legacy support
    stripeYearlyPlanId?: string; // Yearly plan ID for legacy support
    yearlyPrice?: number; // Yearly price for legacy support
    badge?: string;
    buttonText: string;
    features: string[];
    highlighted?: boolean;
};



interface PricingPlansProps {
  currentPlan?: string;
  onSelectPlan: (plan: PLAN, billingPeriod: 'monthly' | 'yearly') => void;
  isLoading?: boolean;
}

const getFeaturesList = (planType: string): string[] => {
  switch (planType) {
    case 'free':
      return [
        '50 podcast discovery searches',
        'Basic media kit',
        '3 AI pitch generations per month',
        'Email templates',
        'Community support'
      ];
    case 'paid_basic':
      return [
        'Everything in Free, plus:',
        '200 weekly podcast discovery & search',
        'AI-powered pitch generator',
        'Professional media kit customization',
        'Email automation & sequences',
        'Campaign tracking & analytics',
        'Advanced pitch templates library',
        'Priority email support',
        'Training resources & tutorials'
      ];
    case 'paid_premium':
      return [
        'Everything in Self-Service, plus:',
        'Dedicated PGL account manager',
        'We find relevant podcasts for you',
        'Professional team handles all pitching',
        'Unlimited AI generations',
        'Booking coordination & scheduling',
        'Follow-up management',
        'Monthly performance reports',
        'Strategy calls with your account manager',
        'Guaranteed booking targets',
        'Priority support via Slack/phone',
        'Custom onboarding & strategy session'
      ];
    default:
      return [];
  }
};

export default function PricingPlans({ currentPlan, onSelectPlan, isLoading }: PricingPlansProps) {
  const { data: apiPlans, isLoading: isLoadingPlans, error: plansError } = useQuery<ApiPlan[]>({ 
    queryKey: ['/billing/plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/billing/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      return response.json();
    }
  });

  // Debug: Log the API response
  console.log('API Plans Response:', apiPlans);
  
  const plans: PLAN[] = (
    apiPlans?.filter(p => {
      console.log('Filtering plan:', p);
      // Only filter out free plans since we only have monthly plans
      return p.plan_type !== 'free';
    }).map(p => {
      let title = '';
      let desc = '';
      let buttonText = '';
      let highlighted = false;
      let badge = undefined;

      switch (p.plan_type) {
        case 'free':
          title = 'Free';
          desc = 'Get started with basic features to explore podcast guesting';
          buttonText = 'Start Free';
          break;
        case 'paid_basic':
          title = 'Self-Service';
          desc = 'Full platform access for proactive podcast guests who want to manage their own outreach';
          buttonText = 'Start Self-Service';
          highlighted = true;
          badge = 'Most Popular';
          break;
        case 'paid_premium':
          title = 'Done-For-You';
          desc = 'Let the PGL team handle everything. We find podcasts, pitch hosts, and secure bookings for you';
          buttonText = 'Get Started with Done-For-You';
          badge = 'Premium Service';
          break;
        default:
          title = p.plan_type;
          desc = '';
          buttonText = 'Select Plan';
      }

      return {
        id: p.plan_type,
        title,
        desc,
        monthlyPrice: p.amount / 100,
        stripePriceId: p.stripe_price_id,
        badge,
        buttonText,
        features: getFeaturesList(p.plan_type),
        highlighted,
      };
    }) || []
  ).sort((a, b) => a.monthlyPrice - b.monthlyPrice);

  console.log('Filtered plans:', plans);

  if (isLoadingPlans) {
    return <div className="text-center py-20">Loading plans...</div>;
  }

  if (plansError) {
    return <div className="text-center py-20 text-red-500">Error loading plans: {plansError.message}</div>;
  }
  
  if (!apiPlans || apiPlans.length === 0) {
    return <div className="text-center py-20 text-yellow-500">No pricing plans available. Please check your backend configuration.</div>;
  }
  
  if (plans.length === 0) {
    return <div className="text-center py-20 text-yellow-500">No monthly plans found. API returned {apiPlans.length} plans but none matched the filter criteria.</div>;
  }
  
  return (
    <div className="relative flex flex-col items-center justify-center max-w-6xl py-20 mx-auto">
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Launch Your Podcast Guest Career
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Choose Your Path to
            <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent"> Podcast Success</span>
          </h2>
          <p className="text-lg md:text-xl text-center text-muted-foreground mt-6 max-w-2xl">
            Whether you prefer to manage your own outreach or have our expert team handle everything, we have the perfect plan for you.
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 lg:grid-cols-2 pt-12 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id} 
            plan={plan} 
            currentPlan={currentPlan}
            onSelect={() => onSelectPlan(plan, 'monthly')}
            isLoading={isLoading}
          />
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include a 3-day money-back guarantee • Cancel anytime • No setup fees
        </p>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: PLAN;
  currentPlan?: string;
  onSelect: () => void;
  isLoading?: boolean;
}

const PlanCard = ({ plan, currentPlan, onSelect, isLoading }: PlanCardProps) => {
  const isHighlighted = plan.highlighted;
  const isCurrentPlan = currentPlan === plan.id;
  const price = plan.monthlyPrice;
  
  const getPlanIcon = () => {
    switch(plan.id) {
      case 'free': return <Zap className="w-5 h-5" />;
      case 'paid_basic': return <Sparkles className="w-5 h-5" />;
      case 'paid_premium': return <Crown className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };
  
  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (plan.id === 'free') return "Start Free";
    return plan.buttonText;
  };
  
  return (
    <div className={cn(
      "flex flex-col relative rounded-2xl lg:rounded-3xl transition-all bg-card items-start w-full border overflow-hidden",
      isHighlighted ? "border-primary shadow-xl shadow-primary/20 scale-105" : "border-border",
      isCurrentPlan && "ring-2 ring-primary"
    )}>
      {isHighlighted && (
        <>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <div className="absolute top-1/2 inset-x-0 mx-auto h-32 -rotate-45 w-full bg-gradient-to-r from-primary to-teal rounded-full blur-[8rem] opacity-20 -z-10"></div>
        </>
      )}
      
      {plan.badge && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-teal text-white px-3 py-1 rounded-full text-xs font-semibold">
          {plan.badge}
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute top-4 left-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
          Current Plan
        </div>
      )}

      <div className="p-6 md:p-8 flex rounded-t-2xl lg:rounded-t-3xl flex-col items-start w-full relative">
        <div className={cn(
          "p-2 rounded-lg mb-4",
          isHighlighted ? "bg-primary/10 text-primary" : "bg-muted"
        )}>
          {getPlanIcon()}
        </div>
        
        <h2 className="font-semibold text-2xl text-foreground">
          {plan.title}
        </h2>
        
        <p className="text-sm md:text-base text-muted-foreground mt-2 min-h-[3rem]">
          {plan.desc}
        </p>
        
        <div className="mt-6">
          {price === 0 ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <>
              <div className="flex items-baseline">
                <NumberFlow
                  value={price}
                  className="text-4xl font-bold"
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-start w-full px-6 md:px-8">
        <Button 
          size="lg" 
          className={cn(
            "w-full",
            isHighlighted && !isCurrentPlan && "bg-gradient-to-r from-primary to-teal hover:from-primary/90 hover:to-teal/90"
          )}
          variant={isHighlighted && !isCurrentPlan ? "default" : isCurrentPlan ? "secondary" : "outline"}
          onClick={onSelect}
          disabled={isCurrentPlan || isLoading}
        >
          {isLoading ? "Processing..." : getButtonText()}
        </Button>
      </div>
      
      <div className="flex flex-col items-start w-full p-6 md:p-8 gap-y-3">
        <span className="text-base text-left mb-2 font-semibold">
          What's included:
        </span>
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex items-center justify-center mt-0.5">
              <CheckIcon className={cn(
                "size-5 flex-shrink-0",
                isHighlighted ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <span className={cn(
              "text-sm",
              feature.includes("Everything in") || feature.includes("plus:") 
                ? "font-medium" 
                : ""
            )}>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PlanProps {
  plan: PLAN;
  billingPeriod: 'monthly' | 'yearly';
  currentPlan?: string;
  onSelect: () => void;
  isLoading?: boolean;
}

const Plan = ({ plan, billingPeriod, currentPlan, onSelect, isLoading }: PlanProps) => {
  const isHighlighted = plan.highlighted;
  const isCurrentPlan = currentPlan === plan.stripeMonthlyPlanId || currentPlan === plan.stripeYearlyPlanId;
  const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const monthlyEquivalent = billingPeriod === 'yearly' && plan.yearlyPrice 
    ? Math.round(plan.yearlyPrice / 12) 
    : plan.monthlyPrice;
  
  const getPlanIcon = () => {
    switch(plan.id) {
      case 'free': return <Zap className="w-5 h-5" />;
      case 'self-service': return <Sparkles className="w-5 h-5" />;
      case 'done-for-you': return <Crown className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };
  
  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (plan.id === 'free') return "Start Free";
    return plan.buttonText;
  };
  
  return (
    <div className={cn(
      "flex flex-col relative rounded-2xl lg:rounded-3xl transition-all bg-card items-start w-full border overflow-hidden",
      isHighlighted ? "border-primary shadow-xl shadow-primary/20 scale-105" : "border-border",
      isCurrentPlan && "ring-2 ring-primary"
    )}>
      {isHighlighted && (
        <>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <div className="absolute top-1/2 inset-x-0 mx-auto h-32 -rotate-45 w-full bg-gradient-to-r from-primary to-teal rounded-full blur-[8rem] opacity-20 -z-10"></div>
        </>
      )}
      
      {plan.badge && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-teal text-white px-3 py-1 rounded-full text-xs font-semibold">
          {plan.badge}
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute top-4 left-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
          Current Plan
        </div>
      )}

      <div className="p-6 md:p-8 flex rounded-t-2xl lg:rounded-t-3xl flex-col items-start w-full relative">
        <div className={cn(
          "p-2 rounded-lg mb-4",
          isHighlighted ? "bg-primary/10 text-primary" : "bg-muted"
        )}>
          {getPlanIcon()}
        </div>
        
        <h2 className="font-semibold text-2xl text-foreground">
          {plan.title}
        </h2>
        
        <p className="text-sm md:text-base text-muted-foreground mt-2 min-h-[3rem]">
          {plan.desc}
        </p>
        
        <div className="mt-6">
          {price === 0 ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <>
              <div className="flex items-baseline">
                <NumberFlow
                  value={monthlyEquivalent}
                  className="text-4xl font-bold"
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }}
                />
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              {billingPeriod === 'yearly' && plan.yearlyPrice && (
                <div className="text-sm text-muted-foreground mt-1">
                  ${plan.yearlyPrice} billed annually
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-start w-full px-6 md:px-8">
        <Button 
          size="lg" 
          className={cn(
            "w-full",
            isHighlighted && !isCurrentPlan && "bg-gradient-to-r from-primary to-teal hover:from-primary/90 hover:to-teal/90"
          )}
          variant={isHighlighted && !isCurrentPlan ? "default" : isCurrentPlan ? "secondary" : "outline"}
          onClick={onSelect}
          disabled={isCurrentPlan || isLoading}
        >
          {isLoading ? "Processing..." : getButtonText()}
        </Button>
      </div>
      
      <div className="flex flex-col items-start w-full p-6 md:p-8 gap-y-3">
        <span className="text-base text-left mb-2 font-semibold">
          What's included:
        </span>
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex items-center justify-center mt-0.5">
              <CheckIcon className={cn(
                "size-5 flex-shrink-0",
                isHighlighted ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <span className={cn(
              "text-sm",
              feature.includes("Everything in") || feature.includes("plus:") 
                ? "font-medium" 
                : ""
            )}>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};