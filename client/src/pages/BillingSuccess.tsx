import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  Rocket,
  PartyPopper,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";

export default function BillingSuccess() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/billing/subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    },
    refetchInterval: 2000,
    refetchIntervalInBackground: false
  });

  useEffect(() => {
    if (subscription?.status === 'active' && subscription?.plan_type !== 'free') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    }
  }, [subscription, queryClient]);

  const getPlanName = (planType?: string) => {
    switch (planType) {
      case 'paid_basic':
        return 'Basic Plan';
      case 'paid_premium':
        return 'Premium Plan';
      default:
        return 'Free Plan';
    }
  };

  const getNextSteps = (planType?: string) => {
    const basicSteps = [
      {
        title: "Complete Your Profile",
        description: "Add your bio and expertise to get better podcast matches",
        link: "/questionnaire",
        linkText: "Complete Profile"
      },
      {
        title: "Discover Podcasts",
        description: "Search for podcasts that match your expertise",
        link: "/discover",
        linkText: "Start Discovering"
      },
      {
        title: "Create Your Media Kit",
        description: "Build a professional media kit to showcase your expertise",
        link: "/media-kit",
        linkText: "Create Media Kit"
      }
    ];

    const premiumSteps = [
      ...basicSteps,
      {
        title: "Set Up Batch Campaigns",
        description: "Use our batch tools to reach multiple podcasts efficiently",
        link: "/campaigns",
        linkText: "Manage Campaigns"
      }
    ];

    return planType === 'paid_premium' ? premiumSteps : basicSteps;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Processing your subscription...</h2>
              <p className="text-gray-600">Please wait while we activate your plan</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = subscription?.status === 'active';
  const nextSteps = getNextSteps(subscription?.plan_type);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {isActive ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Welcome to {getPlanName(subscription?.plan_type)}!</h1>
              <p className="text-xl text-gray-600">
                Your subscription is now active. Let's get you started!
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <PartyPopper className="h-5 w-5 text-purple-600" />
                  <CardTitle>Subscription Activated</CardTitle>
                </div>
                <CardDescription>
                  You now have access to all {getPlanName(subscription?.plan_type)} features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-green-50 border-green-200">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your payment was successful and your account has been upgraded!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Rocket className="h-6 w-6 mr-2 text-primary" />
                Next Steps
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {nextSteps.map((step, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={step.link}>
                        <Button variant="outline" className="w-full">
                          {step.linkText}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link href="/">
                <Button size="lg">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/billing">
                <Button size="lg" variant="outline">
                  View Billing Details
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Almost there...</h2>
              <p className="text-gray-600 mb-6">
                We're still processing your subscription. This usually takes just a moment.
              </p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['billing-subscription'] })}>
                Check Status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}