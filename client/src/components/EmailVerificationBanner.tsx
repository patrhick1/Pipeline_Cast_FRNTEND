import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface EmailVerificationBannerProps {
  email: string;
  gracePeriodEndDate?: string | null;
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ 
  email, 
  gracePeriodEndDate,
  onDismiss 
}: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await apiRequest("POST", "/auth/resend-verification", {
        email: email.toLowerCase()
      });

      if (!response.ok) {
        throw new Error("Failed to resend verification email");
      }

      const data = await response.json();
      toast({
        title: "Verification Email Sent",
        description: data.message || "Please check your inbox for the verification link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 relative">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 pr-8">
        Email Verification Required
      </AlertTitle>
      <AlertDescription className="text-amber-700 space-y-2">
        <p>
          Please verify your email address to continue using all features.
        </p>
        
        {gracePeriodEndDate && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-amber-100 rounded">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Grace period ends: {format(new Date(gracePeriodEndDate), "MMMM d, yyyy")}
            </span>
          </div>
        )}
        
        {gracePeriodEndDate && (
          <p className="text-sm">
            After this date, you will need to verify your email to log in.
          </p>
        )}
        
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="default"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            <Mail className="h-4 w-4 mr-2" />
            {isResending ? "Sending..." : "Resend Verification Email"}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`mailto:${email}`, '_blank')}
          >
            Check Email
          </Button>
        </div>
      </AlertDescription>
      
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-amber-600 hover:text-amber-800"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}