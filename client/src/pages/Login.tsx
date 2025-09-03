// client/src/pages/Landing.tsx
import { useState, useEffect } from "react"; // Added useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter"; // Added Link
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient"; // appQueryClient is not needed, use queryClient directly
import logoName from "@/img/PGL logo name.png";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailVerificationAlert, setShowEmailVerificationAlert] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Get redirect parameters from URL
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get("redirect");
  const campaignId = queryParams.get("campaignId");

  useEffect(() => {
    // Check for OAuth errors in URL params
    const oauthError = queryParams.get("error");
    const linkedProvider = queryParams.get("linked");
    const message = queryParams.get("message");
    
    // Handle success messages
    if (message === "email-verified") {
      setEmailVerified(true);
      toast({
        title: "Email Verified! ✅",
        description: "Your email has been verified. You can now log in.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (message === "check-email") {
      setShowEmailVerificationAlert(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (message === "google-signup-success") {
      toast({
        title: "Welcome to PGL! 🎉",
        description: "Your account has been created. Check your email for an onboarding link to set up your profile.",
        duration: 8000
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (message === "onboarding-link-expired") {
      toast({
        title: "Link Expired",
        description: "Your onboarding link has expired. Please log in to continue.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (oauthError) {
      if (oauthError === "oauth_failed") {
        toast({
          title: "Google Login Failed",
          description: "Please try again or use email/password login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authentication Error",
          description: oauthError,
          variant: "destructive",
        });
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (linkedProvider) {
      // User successfully linked OAuth provider - redirect to settings
      navigate("/settings?linked=" + linkedProvider);
    }

    if (isAuthenticated) {
      // If there's a redirect path, use it; otherwise go to dashboard
      const destinationPath = redirectPath 
        ? (campaignId ? `${redirectPath}?campaignId=${campaignId}` : redirectPath)
        : "/";
      navigate(destinationPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath, campaignId, queryParams, toast]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  // If already authenticated (e.g. due to useEffect not running yet or race condition), redirect
  if (isAuthenticated) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email.toLowerCase()); 
      formData.append("password", password);

      // Assuming VITE_API_BASE_URL = http://localhost:8000
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include", 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Login failed. Please check your credentials." }));
        
        // Check if the error is related to email verification
        if (response.status === 403) {
          // Check headers for verification requirement
          const verificationRequired = response.headers.get('X-Verification-Required');
          if (verificationRequired === 'true' || errorData.detail?.toLowerCase().includes("email")) {
            setShowEmailVerificationAlert(true);
            throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
          }
        }
        
        throw new Error(errorData.detail || "Login failed");
      }
      
      const responseData = await response.json(); // Contains user role, person_id etc.
      console.log("Login successful, response data:", responseData); // For debugging

      // Check for grace period warning
      if (responseData.email_verification_warning) {
        toast({ 
          title: "Email Verification Needed", 
          description: responseData.warning_message || "Please verify your email to continue using all features.",
          duration: 8000
        });
      } else {
        toast({ 
          title: "Login Successful", 
          description: "Redirecting to dashboard...",
          duration: 3000 // Auto-dismiss after 3 seconds
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["/auth/me"] }); // Corrected queryKey
      // The useAuth hook will pick up the new auth state, and App.tsx router will redirect.
      // Explicit navigation might still be good for immediate feedback.
      const destinationPath = redirectPath 
        ? (campaignId ? `${redirectPath}?campaignId=${campaignId}` : redirectPath)
        : "/";
      navigate(destinationPath, { replace: true });

    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsResetLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("email", forgotPasswordEmail.toLowerCase());

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      // The API always returns 202 for security (doesn't reveal if email exists)
      if (response.status === 202) {
        toast({
          title: "Reset Link Sent",
          description: "If an account with this email exists, a password reset link has been sent.",
        });
        setIsForgotPasswordOpen(false);
        setForgotPasswordEmail("");
      } else {
        throw new Error("Failed to send reset email");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/oauth/google/authorize`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to initiate Google login");
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
        title: "Google Login Failed",
        description: "Unable to connect to Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <img src={logoName} alt="Podcast Guest Launch" className="h-12 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                  <p className="text-gray-600">Sign in to your account</p>
                </div>

                {/* Email Verification Alert */}
                {showEmailVerificationAlert && (
                  <Alert className="mb-6 border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">Email Verification Required</AlertTitle>
                    <AlertDescription className="text-orange-700">
                      Please check your email and click the verification link to activate your account. 
                      Once verified, you can log in here.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Email Verified Success Alert */}
                {emailVerified && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Email Verified Successfully!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your email has been verified. You can now log in to your account.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="you@example.com"
                      required 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Your password" 
                        required 
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
                  </div>
                  <Button 
                    type="submit"
                    disabled={isLoading || authLoading} // Disable if auth check is also loading
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base" // Adjusted size
                  >
                    {isLoading ? "Signing In..." : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleLogin}
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

                <div className="mt-6 text-center space-y-3">
                  <button
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-primary hover:text-primary/80 hover:underline"
                  >
                    Forgot your password?
                  </button>
                  
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
                      Sign Up
                    </Link>
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    By logging in, you agree to our{' '}
                    <Link href="/privacy" className="underline hover:text-primary">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Streamline your podcast booking process and grow your audience reach.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary" />
              Reset Your Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotPasswordEmail("");
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResetLoading}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isResetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}