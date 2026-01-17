import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2,
  ExternalLink,
  Copy,
  Rocket,
  Share2,
  BarChart3,
  Calendar,
  ArrowRight,
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

interface OnboardingCompleteProps {
  campaignId: string;
  onComplete: () => void;
}

export default function OnboardingComplete({ campaignId, onComplete }: OnboardingCompleteProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [mediaKitWindow, setMediaKitWindow] = useState<Window | null>(null);
  const [autoOpenAttempted, setAutoOpenAttempted] = useState(false);

  // Fetch campaign and media kit data
  const { data: campaign } = useQuery({
    queryKey: ["campaign-complete", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/campaigns/${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch campaign");
      return response.json();
    },
  });

  const { data: mediaKit } = useQuery({
    queryKey: ["media-kit-complete", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/campaigns/${campaignId}/media-kit`);
      if (!response.ok) throw new Error("Failed to fetch media kit");
      return response.json();
    },
  });

  // Auto-open media kit in new tab when ready
  useEffect(() => {
    if (mediaKit?.public_slug && !autoOpenAttempted) {
      setAutoOpenAttempted(true);
      
      // Open media kit in new tab after a short delay
      const timer = setTimeout(() => {
        const url = `${window.location.origin}/media-kit/${mediaKit.public_slug}`;
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
          setMediaKitWindow(newWindow);
          toast({
            title: "Media Kit Opened",
            description: "Your media kit has been opened in a new tab. You can also access it anytime from the View button.",
            duration: 5000
          });
        } else {
          // If popup was blocked, show a more prominent message
          toast({
            title: "Ready to View Your Media Kit!",
            description: "Click the 'View' button below to see your professional media kit.",
            duration: 8000
          });
        }
      }, 2000); // Wait 2 seconds for the user to see the completion screen
      
      return () => clearTimeout(timer);
    }
  }, [mediaKit, autoOpenAttempted, toast]);

  // Trigger celebration animation
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }));
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const copyMediaKitLink = () => {
    if (mediaKit?.public_slug) {
      const url = `${window.location.origin}/media-kit/${mediaKit.public_slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Your media kit link is ready to share.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextSteps = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Browse Podcasts",
      description: "Explore podcasts that match your expertise",
      action: "/approvals"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Schedule Outreach",
      description: "Start pitching to your dream podcasts",
      action: "/pitch-outreach"
    },
    {
      icon: <Share2 className="h-5 w-5" />,
      title: "Share Your Profile",
      description: "Send your media kit to podcast hosts",
      action: null // Will handle with copy
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy/5 via-teal/5 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in duration-1000">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-teal to-navy rounded-full mb-4 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900">
            Congratulations! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your professional podcast guest profile is ready. You're all set to start landing amazing podcast interviews!
          </p>
        </div>

        {/* Profile Summary */}
        <Card className="p-6 bg-white/80 backdrop-blur border-2 border-teal/20">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">Your Profile Summary</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-navy/10 rounded-lg">
                <div className="text-2xl font-bold text-navy">1</div>
                <div className="text-sm text-gray-600 mt-1">Professional Bio</div>
              </div>
              <div className="text-center p-4 bg-teal/10 rounded-lg">
                <div className="text-2xl font-bold text-teal">
                  {(() => {
                    if (!campaign?.campaign_angles) return "10+";
                    // Check if it's a URL
                    if (typeof campaign.campaign_angles === 'string' && campaign.campaign_angles.startsWith('http')) {
                      return "10+"; // Default count for Google Docs links
                    }
                    try {
                      const angles = JSON.parse(campaign.campaign_angles);
                      return Array.isArray(angles) ? angles.length : "10+";
                    } catch {
                      return "10+";
                    }
                  })()}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pitch Angles</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {campaign?.campaign_keywords?.length || "15+"}
                </div>
                <div className="text-sm text-gray-600 mt-1">Keywords</div>
              </div>
            </div>

            {/* Media Kit Link */}
            {mediaKit?.public_slug && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Your Media Kit Link</p>
                    <p className="text-sm text-gray-600 break-all">
                      {window.location.origin}/media-kit/{mediaKit.public_slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyMediaKitLink}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/media-kit/${mediaKit.public_slug}`, '_blank')}
                      className="flex items-center gap-2 animate-pulse bg-blue-50 hover:bg-blue-100 border-blue-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Media Kit
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Next Steps */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What's Next?</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {nextSteps.map((step, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => step.action ? navigate(step.action) : copyMediaKitLink()}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-navy/10 to-teal/10 rounded-lg flex items-center justify-center text-navy">
                    {step.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Button
            size="lg"
            onClick={onComplete}
            className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-navy to-teal hover:from-navy-700 hover:to-teal-700"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Go to Dashboard
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Your journey to podcast stardom begins now!
          </p>
        </div>
      </div>
    </div>
  );
}