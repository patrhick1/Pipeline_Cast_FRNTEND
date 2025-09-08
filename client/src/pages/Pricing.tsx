import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { apiRequest } from "@/lib/queryClient";
import PricingPlans from "@/components/ui/pricing-plans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Pricing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription } = useSubscription();

  const checkoutMutation = useMutation({
    mutationFn: async ({ planType, billingPeriod }: { planType: string; billingPeriod: 'monthly' | 'yearly' }) => {
      // Map the plan IDs to Stripe plan types
      let stripePlanType = 'free';
      
      if (planType === 'paid_basic' || planType === 'paid_basic_yearly') {
        stripePlanType = 'paid_basic';
      } else if (planType === 'paid_premium' || planType === 'paid_premium_yearly') {
        stripePlanType = 'paid_premium';
      }
      
      const response = await apiRequest('POST', '/billing/checkout-session', {
        plan_type: planType,
        billing_period: billingPeriod,
        success_url: `${window.location.origin}/billing/success`,
        cancel_url: `${window.location.origin}/pricing`
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
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }
    
    if (plan.id === 'free') {
      if (subscription?.plan_type !== 'free') {
        toast({
          title: "Downgrade to Free",
          description: "Please use the billing portal to cancel your subscription",
          variant: "default"
        });
      }
      return;
    }
    
    // Get the appropriate Stripe plan ID based on billing period
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
      {/* Header Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            {user && (
              <Link href="/billing">
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Status Alert */}
      {subscription?.cancel_at_period_end && (
        <div className="container mx-auto px-4 pt-6">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription will be cancelled at the end of the current billing period.
              Reactivate anytime from your billing settings.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Pricing Component */}
      <PricingPlans
        currentPlan={subscription?.plan_type}
        onSelectPlan={handleSelectPlan}
      />

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          
          <div className="space-y-8">
            <div>
              <h4 className="font-semibold text-lg mb-2">What's the difference between Self-Service and Done-For-You?</h4>
              <p className="text-muted-foreground">
                Self-Service gives you full access to our platform and tools to manage your own podcast outreach. 
                Done-For-You includes a dedicated team that handles everything for you - from finding podcasts to 
                securing bookings.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-2">Can I switch plans later?</h4>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-2">Do you offer refunds?</h4>
              <p className="text-muted-foreground">
                All paid plans come with a 3-day money-back guarantee. If you're not satisfied, 
                contact our support team for a full refund.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-2">What happens to my data if I cancel?</h4>
              <p className="text-muted-foreground">
                Your data remains accessible for 30 days after cancellation. You can export your contacts 
                and campaign data at any time from your account settings.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-2">How does the Done-For-You service work?</h4>
              <p className="text-muted-foreground">
                After signing up, you'll have a strategy call with your dedicated account manager. They'll learn about 
                your expertise and goals, then handle all podcast research, pitching, and booking coordination on your behalf. 
                You'll receive regular updates and monthly performance reports.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Launch Your Podcast Guest Career?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of thought leaders and experts who use PGL to get booked on top podcasts
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="https://calendly.com/alex-podcastguestlaunch/30min" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  Schedule a Demo
                </Button>
              </a>
              <a href="mailto:support@podcastguestlaunch.com">
                <Button size="lg" variant="ghost">
                  Contact Sales
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}