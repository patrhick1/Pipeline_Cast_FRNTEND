import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PricingPlans from "@/components/ui/pricing-plans";
import { 
  Zap, 
  Check, 
  X, 
  Package,
  Rocket,
  ArrowLeft,
  Info
} from "lucide-react";

export default function BillingFreePlan() {
  const { toast } = useToast();

  // Handle plan selection - redirect to checkout
  const checkoutMutation = useMutation({
    mutationFn: async ({ planType, billingPeriod }: { planType: string; billingPeriod: 'monthly' | 'yearly' }) => {
      const response = await apiRequest('POST', '/billing/checkout-session', {
        plan_type: planType,
        billing_period: billingPeriod,
        success_url: `${window.location.origin}/billing/success`,
        cancel_url: `${window.location.origin}/billing`
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout session');
      }
      
      return response.json() as Promise<{ checkout_url: string }>;
    },
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSelectPlan = (plan: any, billingPeriod: 'monthly' | 'yearly' = 'monthly') => {
    // Only handle paid plans
    if (plan.id === 'free') {
      return;
    }
    
    const planType = plan.stripePriceId;
    
    if (!planType) {
      toast({
        title: "Plan Not Available",
        description: "This plan is not yet available. Please contact support.",
        variant: "destructive"
      });
      return;
    }
    
    checkoutMutation.mutate({ planType, billingPeriod });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Back to Dashboard Button */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

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
                  <span className="text-sm">50 podcast searches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Basic media kit editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">3 AI pitch generations per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Email templates</span>
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

          {/* Info Alert */}
          <Alert className="mb-12 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>No billing information needed for Free Plan.</strong> You'll only be charged when you upgrade to a paid plan. 
              All paid plans come with a 3-day money-back guarantee.
            </AlertDescription>
          </Alert>

          {/* Upgrade CTA */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-4">
              <Rocket className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-green-900 font-semibold">Ready to unlock your full potential?</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Choose Your Upgrade Path</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of successful podcast guests who use our premium features 
              to land more podcast appearances and grow their personal brand.
            </p>
          </div>

          {/* Pricing Plans Component - This fetches prices from API */}
          <PricingPlans 
            currentPlan="free"
            onSelectPlan={handleSelectPlan}
          />

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Have questions about our plans?
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="https://calendly.com/paschal-pipelinecast/30min" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  Schedule a Demo
                </Button>
              </a>
              <a href="mailto:support@pipelinecast.co">
                <Button size="lg" variant="ghost">
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}