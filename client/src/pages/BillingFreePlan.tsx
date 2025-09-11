import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Zap, 
  Sparkles, 
  Crown, 
  Check, 
  X, 
  ArrowRight,
  Package,
  Rocket
} from "lucide-react";

interface PricingPlan {
  plan_type: string;
  stripe_price_id: string;
  amount: number;
  currency: string;
  interval: string;
}

const PLAN_FEATURES = {
  paid_basic: {
    name: "Self-Service",
    icon: Sparkles,
    color: "from-blue-500 to-blue-600",
    features: [
      { name: "Unlimited podcast searches", included: true },
      { name: "AI-powered pitch generation", included: true },
      { name: "Advanced media kit editor", included: true },
      { name: "Email tracking & analytics", included: true },
      { name: "100 pitches per month", included: true },
      { name: "5 active campaigns", included: true },
      { name: "Priority support", included: true },
      { name: "Batch pitch sending", included: false },
      { name: "Custom templates", included: false },
      { name: "Dedicated account manager", included: false }
    ]
  },
  paid_premium: {
    name: "Done-For-You",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    features: [
      { name: "Everything in Self-Service, plus:", included: true },
      { name: "Unlimited AI generations", included: true },
      { name: "Unlimited pitches", included: true },
      { name: "Unlimited campaigns", included: true },
      { name: "Batch pitch sending", included: true },
      { name: "Custom pitch templates", included: true },
      { name: "Advanced analytics dashboard", included: true },
      { name: "API access", included: true },
      { name: "10 team members", included: true },
      { name: "Dedicated account manager", included: true }
    ]
  }
};

export default function BillingFreePlan() {
  // Fetch pricing plans from API
  const { data: pricingPlans, isLoading } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/billing/plans');
      if (!response.ok) throw new Error('Failed to fetch pricing plans');
      return response.json() as Promise<PricingPlan[]>;
    }
  });

  // Get the basic and premium plans from the API response
  const basicPlan = pricingPlans?.find(p => p.plan_type === 'paid_basic');
  const premiumPlan = pricingPlans?.find(p => p.plan_type === 'paid_premium');

  const formatPrice = (amount?: number) => {
    if (!amount) return '$--';
    return `$${(amount / 100).toFixed(0)}`;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mb-6">
            <Package className="h-10 w-10 text-gray-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">You're on the Free Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You currently don't have any billing information to manage. Upgrade to unlock powerful features 
            and take your podcast guest journey to the next level!
          </p>
        </div>

        {/* Current Plan Card */}
        <Card className="mb-8 border-2 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Zap className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <CardTitle>Free Plan</CardTitle>
                <CardDescription>Basic features to get you started</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">5 podcast searches per month</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Basic media kit editor</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">1 active campaign</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-muted-foreground">AI pitch generation</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-muted-foreground">Email tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-muted-foreground">Priority support</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade CTA */}
        <Alert className="mb-12 border-blue-200 bg-blue-50">
          <Rocket className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Ready to level up?</strong> Join thousands of successful podcast guests who use our premium features 
            to land more podcast appearances and grow their personal brand.
          </AlertDescription>
        </Alert>

        {/* Upgrade Plans */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full mt-6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {Object.entries(PLAN_FEATURES).map(([key, plan]) => {
              const Icon = plan.icon;
              const planData = key === 'paid_basic' ? basicPlan : premiumPlan;
              const price = formatPrice(planData?.amount);
              
              return (
                <Card key={key} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color}`} />
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${plan.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {key === 'paid_premium' && (
                        <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full">
                          MOST POPULAR
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-bold">{price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.slice(0, 6).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${!feature.included ? 'text-muted-foreground' : ''}`}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/pricing">
                      <Button className="w-full" variant={key === 'paid_premium' ? 'default' : 'outline'}>
                        Upgrade to {plan.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Want to see all features and pricing options?
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/pricing">
              <Button size="lg" variant="default">
                View All Plans
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}