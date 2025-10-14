import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, CheckCircle2, Eye, EyeOff } from "lucide-react";

const emailChangeSchema = z.object({
  current_password: z.string().min(1, "Password is required"),
  new_email: z.string().email("Please enter a valid email address"),
});

type EmailChangeFormData = z.infer<typeof emailChangeSchema>;

interface EmailChangeFormProps {
  currentEmail: string;
}

export function EmailChangeForm({ currentEmail }: EmailChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();

  const form = useForm<EmailChangeFormData>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      current_password: "",
      new_email: "",
    },
  });

  const onSubmit = async (data: EmailChangeFormData) => {
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const response = await apiRequest("POST", "/users/me/request-email-change", {
        current_password: data.current_password,
        new_email: data.new_email,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to request email change"
        }));
        throw new Error(errorData.detail || "Failed to request email change");
      }

      const result = await response.json();

      setSuccessMessage(
        result.message ||
        `Verification email sent to ${data.new_email}. Please check your inbox and click the verification link to complete the email change.`
      );

      // Clear form
      form.reset();

      toast({
        title: "Verification Email Sent",
        description: `Please check ${data.new_email} for the verification link.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request email change. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <Label className="text-sm font-medium text-gray-700">Current Email</Label>
        <p className="text-base text-gray-900 mt-1">{currentEmail}</p>
      </div>

      {successMessage ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 ml-2">
            {successMessage}
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative mt-1">
              <Input
                id="current_password"
                type={showPassword ? "text" : "password"}
                {...form.register("current_password")}
                placeholder="Enter your current password"
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
            {form.formState.errors.current_password && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.current_password.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="new_email">New Email Address</Label>
            <Input
              id="new_email"
              type="email"
              {...form.register("new_email")}
              placeholder="Enter your new email address"
              className="mt-1"
            />
            {form.formState.errors.new_email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.new_email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              "Sending Verification Email..."
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Request Email Change
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500">
            A verification link will be sent to your new email address. You must click the link to complete the email change.
          </p>
        </form>
      )}
    </div>
  );
}
