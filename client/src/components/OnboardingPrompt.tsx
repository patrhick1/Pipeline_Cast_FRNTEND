import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface OnboardingPromptProps {
  onDismiss?: () => void;
}

export function OnboardingPrompt({ onDismiss }: OnboardingPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleRequestOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/auth/request-onboarding");

      if (!response.ok) {
        throw new Error("Failed to generate onboarding link");
      }

      const data = await response.json();
      
      if (data.onboarding_url) {
        // Navigate to the onboarding URL
        window.location.href = data.onboarding_url;
      } else if (data.token) {
        // Fallback: navigate with token
        navigate(`/onboarding?token=${data.token}`);
      } else {
        throw new Error("No onboarding URL or token received");
      }
      
      toast({
        title: "Redirecting to Onboarding",
        description: "Taking you to complete your profile setup...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate onboarding link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 relative">
      <ClipboardList className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800 pr-8">
        Complete Your Profile
      </AlertTitle>
      <AlertDescription className="text-blue-700 space-y-2">
        <p>
          Set up your campaign keywords and ideal podcast description to start discovering podcasts.
        </p>
        
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="default"
            onClick={handleRequestOnboarding}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                Start Onboarding
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
      
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-blue-600 hover:text-blue-800"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}