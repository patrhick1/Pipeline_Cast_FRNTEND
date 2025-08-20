import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Rocket, Sparkles, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter'; // For redirection

const leadMagnetFormSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  bio: z.string().min(30, "Please tell us a bit about yourself (at least 30 characters).").max(750, "Bio should be concise (max 750 characters)."),
  expertise_topics: z.string().min(15, "Please list some key expertise or topics (at least 15 characters).").max(2000, "Expertise/topics too long (max 2000 characters)."),
  achievements: z.string().max(2000, "Achievements too long (max 2000 chars).").optional().default(""),
});
type LeadMagnetFormData = z.infer<typeof leadMagnetFormSchema>;

interface LeadMagnetSubmissionResponse {
    person_id: number;
    campaign_id: string;
    media_kit_slug: string;
    message: string;
}

async function submitLeadMagnetData(formData: LeadMagnetFormData): Promise<LeadMagnetSubmissionResponse> {
    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      questionnaire_data: {
        bio: formData.bio,
        expertise_topics: formData.expertise_topics,
        achievements: formData.achievements,
      },
    };
    const response = await apiRequest("POST", '/public/lead-magnet/submit', payload);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Submission failed. Please try again." }));
      throw new Error(errorData.detail);
    }
    return response.json();
}

export default function LeadMagnetQuestionnaire() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LeadMagnetFormData>({
    resolver: zodResolver(leadMagnetFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      bio: "",
      expertise_topics: "",
      achievements: "",
    },
  });

  const submitLeadMagnetMutation = useMutation<LeadMagnetSubmissionResponse, Error, LeadMagnetFormData>({
    mutationFn: submitLeadMagnetData,
    onSuccess: (data: LeadMagnetSubmissionResponse) => {
      toast({ title: "Success!", description: data.message || "Your media kit preview is being generated!" });
      setLocation(`/media-kit/${data.media_kit_slug}`);
    },
    onError: (error: Error) => {
      if (error.message && error.message.toLowerCase().includes("account with this email already exists")) {
          toast({ 
              title: "Email Already Registered", 
              description: "An account with this email already exists. Please log in to access your dashboard or use a different email for a new preview.", 
              variant: "destructive",
              duration: 7000,
          });
      } else {
          toast({ title: "Submission Error", description: error.message || "Could not submit your information. Please try again.", variant: "destructive" });
      }
    },
  });

  const onSubmit = (data: LeadMagnetFormData) => {
    submitLeadMagnetMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl shadow-2xl bg-white/90 backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary p-3 rounded-full w-fit mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">Create Your Media Kit Preview</CardTitle>
          <CardDescription className="text-md text-gray-600">
            Answer a few quick questions to generate a shareable media kit preview and see how PGL CRM can elevate your podcast presence!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Dr. Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Your Bio / About You</FormLabel><FormControl><Textarea placeholder="Briefly introduce yourself, your background, and what you do..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="expertise_topics" render={({ field }) => (<FormItem><FormLabel>Key Expertise / Main Topics</FormLabel><FormControl><Textarea placeholder="List 3-5 key areas you speak about or are known for (e.g., AI in Healthcare, Sustainable Living, Startup Funding)..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="achievements" render={({ field }) => (<FormItem><FormLabel>Notable Achievements (Optional)</FormLabel><FormControl><Textarea placeholder="Mention 1-2 key achievements or publications (e.g., Bestselling Author of 'X', Speaker at TEDx, Founder of Y Corp)..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={submitLeadMagnetMutation.status === 'pending'}>
                {submitLeadMagnetMutation.status === 'pending' ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Rocket className="mr-2 h-5 w-5" />} 
                {submitLeadMagnetMutation.status === 'pending' ? "Generating Preview..." : "Generate My Media Kit Preview"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-slate-400 mt-8">
        By submitting, you agree to our Terms of Service and Privacy Policy (links to be added).
      </p>
    </div>
  );
} 