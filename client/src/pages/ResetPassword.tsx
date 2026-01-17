import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import logoWordmark from "@/img/pipeline icon and wordmark.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get token from URL parameters
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token");

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // If no token is provided, redirect to login with error
    if (!token) {
      toast({
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [token, navigate, toast]);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("token", token);
      formData.append("new_password", data.new_password);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Password reset failed. Please try again." }));
        throw new Error(errorData.detail || "Password reset failed");
      }

      const responseData = await response.json();
      
      setIsSuccess(true);
      toast({ 
        title: "Password Reset Successful", 
        description: "Your password has been reset successfully. You can now log in with your new password." 
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no token
  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-navy-800">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <img src={logoWordmark} alt="PipelineCast" className="h-12 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
                <p className="text-gray-600">Enter your new password below</p>
              </div>

              {isSuccess ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-green-600 text-2xl h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Password Reset Successful!</h2>
                  <p className="text-gray-600">Your password has been updated. You will be redirected to the login page shortly.</p>
                  <Link href="/login">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Go to Login Now
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-6">
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative mt-1">
                      <Input 
                        id="new_password" 
                        type={showPassword ? "text" : "password"}
                        {...form.register("new_password")}
                        placeholder="Enter your new password" 
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {form.formState.errors.new_password && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.new_password.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative mt-1">
                      <Input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"}
                        {...form.register("confirmPassword")}
                        placeholder="Confirm your new password" 
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base"
                  >
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                    Back to Sign In
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