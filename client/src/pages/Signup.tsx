// client/src/pages/Signup.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserPlus, Eye, EyeOff, Mail } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoName from "@/img/PGL logo name.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signupSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get query parameters for lead magnet feature
  const queryParams = new URLSearchParams(window.location.search);
  const prospectPersonId = queryParams.get("prospect_person_id");
  const prospectCampaignId = queryParams.get("prospect_campaign_id");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        full_name: data.full_name,
        email: data.email.toLowerCase(),
        password: data.password,
        // Include prospect data if available for lead magnet
        ...(prospectPersonId && { prospect_person_id: parseInt(prospectPersonId) }),
        ...(prospectCampaignId && { prospect_campaign_id: prospectCampaignId }),
        // role: "client" // Backend /auth/register sets role to "client" by default
      };
      // Assuming VITE_API_BASE_URL = http://localhost:8000
      const response = await apiRequest("POST", "/auth/register", payload);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Signup failed. Please try again." }));
        throw new Error(errorData.detail || "Signup failed");
      }

      const responseData = await response.json(); // Contains person_id, campaign_id, and message
      console.log("Signup successful:", responseData); // For debugging

      // Show success message based on whether this was a lead magnet conversion
      const isLeadMagnetConversion = prospectPersonId && prospectCampaignId;
      
      if (isLeadMagnetConversion) {
        toast({ 
          title: "Signup Successful", 
          description: "Your account has been created! You can now access your personalized campaign."
        });
        // For lead magnet conversions, redirect to profile setup with the campaign
        navigate(`/login?redirect=/profile-setup&campaignId=${responseData.campaign_id}`);
      } else {
        // For regular signups, show email verification message
        setRegisteredEmail(data.email);
        setShowVerificationMessage(true);
        toast({ 
          title: "Account Created Successfully! 📧", 
          description: "Please check your email to verify your account.",
          duration: 8000 // Keep it visible longer
        });
        // Don't navigate away immediately, let user see the verification message
        setTimeout(() => {
          navigate("/login?message=check-email");
        }, 3000);
      }

    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/oauth/google/authorize`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to initiate Google signup");
      }

      const data = await response.json();
      
      if (data.authorization_url) {
        // Redirect to Google
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (error: any) {
      toast({
        title: "Google Signup Failed",
        description: "Unable to connect to Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // If verification message should be shown, display it instead of the form
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                    <Mail className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email!</h2>
                  <Alert className="mb-6 border-blue-200 bg-blue-50 text-left">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Verification Email Sent</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      We've sent a verification email to <strong>{registeredEmail}</strong>. 
                      Please click the link in the email to verify your account before logging in.
                    </AlertDescription>
                  </Alert>
                  <p className="text-gray-600 mb-6">
                    Didn't receive the email? Check your spam folder or contact support.
                  </p>
                  <Button 
                    onClick={() => navigate("/login?message=check-email")}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <img src={logoName} alt="Podcast Guest Launch" className="h-12 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h1>
                <p className="text-gray-600">Join thousands getting booked on podcasts</p>
              </div>

              <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-6">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name" 
                    {...form.register("full_name")}
                    placeholder="John Doe" 
                    className="mt-1"
                  />
                  {form.formState.errors.full_name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.full_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    {...form.register("email")}
                    placeholder="you@example.com" 
                    className="mt-1"
                  />
                   {form.formState.errors.email && <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      {...form.register("password")}
                      placeholder="Create a password" 
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                   {form.formState.errors.password && <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      {...form.register("confirmPassword")}
                      placeholder="Confirm your password" 
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                   {form.formState.errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base"
                >
                  {isLoading ? "Creating Account..." : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Sign Up
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignup}
                disabled={isLoading}
                variant="outline"
                className="w-full py-3 text-base flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? "Redirecting..." : "Continue with Google"}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                    Sign In
                  </Link>
                </p>
                
                <p className="text-xs text-gray-500 mt-4">
                  By signing up, you agree to our{' '}
                  <Link href="/privacy" className="underline hover:text-primary">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}