import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Mic, 
  FileText, 
  Share2,
  ArrowRight,
  Zap
} from "lucide-react";

interface OnboardingWelcomeProps {
  userName: string;
  campaignId: string;
  onComplete: () => void;
}

export default function OnboardingWelcome({ userName, campaignId, onComplete }: OnboardingWelcomeProps) {
  const [isReady, setIsReady] = useState(false);

  // Fetch campaign details - optional, don't fail if not available
  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/campaigns/${campaignId}`);
        if (!response.ok) {
          console.log("Campaign fetch failed, continuing without campaign details");
          return null;
        }
        return response.json();
      } catch (error) {
        console.log("Campaign fetch error, continuing without campaign details");
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    // Add a small delay for better UX
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const benefits = [
    {
      icon: <Mic className="h-5 w-5" />,
      title: "Professional Bio",
      description: "AI-powered bio that highlights your expertise"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Pitch Angles",
      description: "10+ compelling topics for podcast conversations"
    },
    {
      icon: <Share2 className="h-5 w-5" />,
      title: "Media Kit",
      description: "Beautiful one-page profile to share with hosts"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy/5 via-white to-teal/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in duration-500">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal/10 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-teal" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome, {userName.split(' ')[0]}! 👋
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's create your professional podcast guest profile
            {campaign?.campaign_name && (
              <span> for <span className="font-semibold text-gray-900">{campaign.campaign_name}</span></span>
            )}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Takes about 15-20 minutes</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>

        {/* What You'll Get */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className={`p-6 border-2 transition-all duration-500 ${
                isReady 
                  ? "translate-y-0 opacity-100" 
                  : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center text-teal">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Process Overview */}
        <Card className="p-8 bg-gradient-to-r from-teal/5 to-navy/5 border-2 border-teal/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Here's how it works:</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Answer questions about your expertise and experience</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Our AI generates your professional bio and pitch angles</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Review and customize your media kit</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Start landing podcast interviews!</span>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center pt-8">
          <Button 
            size="lg" 
            onClick={onComplete}
            className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-navy to-teal hover:from-navy-700 hover:to-teal-700"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Your progress is automatically saved
          </p>
        </div>
      </div>
    </div>
  );
}