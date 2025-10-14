// client/src/pages/Settings.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getOAuthProviders, linkOAuthProvider, disconnectOAuthProvider } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { ImageUpload } from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Settings as SettingsIcon, User, Bell, Shield, Download, Save, Trash2, AlertTriangle, Mail,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailChangeForm } from "@/components/EmailChangeForm";
import { AdminSmartSendSettings } from "@/components/pitch/AdminSmartSendSettings";

// --- Placeholder Schemas and Types ---

// User Profile
const userProfileUpdateSchema = z.object({
  full_name: z.string().min(1, "Full name is required").optional(),
  bio: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  location: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  linkedin_profile_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")).nullable(),
  twitter_profile_url: z.string().url("Invalid Twitter/X URL").optional().or(z.literal("")).nullable(),
  instagram_profile_url: z.string().url("Invalid Instagram URL").optional().or(z.literal("")).nullable(),
  tiktok_profile_url: z.string().url("Invalid TikTok URL").optional().or(z.literal("")).nullable(),
  dashboard_username: z.string().min(1, "Dashboard username is required").optional(),
});
type UserProfileUpdateFormData = z.infer<typeof userProfileUpdateSchema>;

// Notification Settings
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  podcastMatches: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});
type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

// Privacy Settings
const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'hosts_only', 'private']).optional(),
  dataSharing: z.boolean().optional(),
  analyticsTracking: z.boolean().optional(),
});
type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;

// Account Deletion
const accountDeletionRequestSchema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion."),
});
type AccountDeletionRequestFormData = z.infer<typeof accountDeletionRequestSchema>;

// --- End Placeholder Schemas ---

interface TimezoneOption {
  value: string;
  label: string;
}

const timezones: TimezoneOption[] = [
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: '(GMT+00:00) London' },
  { value: 'Europe/Berlin', label: '(GMT+01:00) Berlin, Amsterdam, Paris' },
];

function ProfileSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Debug logging for user data
  console.log('👤 Current user data in Settings:', user);
  console.log('🖼️ Profile image URL:', user?.profile_image_url);
  const tanstackQueryClient = useTanstackQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const form = useForm<UserProfileUpdateFormData>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        timezone: user.timezone || "America/New_York",
        linkedin_profile_url: user.linkedin_profile_url || "",
        twitter_profile_url: user.twitter_profile_url || "",
        instagram_profile_url: user.instagram_profile_url || "",
        tiktok_profile_url: user.tiktok_profile_url || "",
        dashboard_username: user.dashboard_username || user.username,
      });
    }
  }, [user, form, isEditing]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfileUpdateFormData) => {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== "" && value !== undefined)
      );
      return apiRequest("PATCH", "/users/me/profile", payload);
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update profile." }));
        throw new Error(errorData.detail);
      }
      await tanstackQueryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      setIsEditing(false);
      toast({ title: "Success", description: "Profile updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    },
  });

  const onSubmit = (data: UserProfileUpdateFormData) => {
    updateProfileMutation.mutate(data);
  };
  
  const getInitials = (fullName?: string | null) => {
    if (!fullName) return user?.username?.[0]?.toUpperCase() || "U";
    const names = fullName.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return names[0][0].toUpperCase();
  };

  if (authLoading) return <Skeleton className="h-96 w-full" />;
  if (!user) return <p>Please log in to view your profile settings.</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5" />Profile Information</CardTitle>
          <CardDescription>Update your personal details and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={user.profile_image_url ? `${user.profile_image_url}?t=${Date.now()}` : undefined} 
                alt={user.full_name || user.username} 
              />
              <AvatarFallback className="bg-gray-300 text-gray-700 text-lg">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{user.full_name || user.username}</h3>
              <p className="text-sm text-gray-600">{user.username}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsUploadDialogOpen(true)}>
                Change Photo
              </Button>
            </div>
          </div>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} disabled={!isEditing} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="dashboard_username" render={({ field }) => (
                <FormItem><FormLabel>Dashboard Username</FormLabel><FormControl><Input {...field} disabled={!isEditing} value={field.value ?? ""} /></FormControl><FormDescription>This is how you log in. Can be different from your email.</FormDescription><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us about yourself..." className="min-h-[100px]" disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://yourwebsite.com" disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="City, Country" disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="timezone" render={({ field }) => (
                <FormItem><FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={!isEditing}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select your timezone" /></SelectTrigger></FormControl>
                    <SelectContent>{timezones.map((tz) => (<SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="linkedin_profile_url" render={({ field }) => (
                  <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="twitter_profile_url" render={({ field }) => (
                  <FormItem><FormLabel>Twitter/X URL</FormLabel><FormControl><Input placeholder="https://x.com/..." disabled={!isEditing} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              {/* Add Instagram and TikTok if desired */}

              <div className="flex justify-end space-x-4 pt-4">
                {isEditing ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => { setIsEditing(false); form.reset(user ? { ...user, full_name: user.full_name || "", dashboard_username: user.dashboard_username || user.username } : {}); }}>Cancel</Button>
                    <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {updateProfileMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">Edit Profile</Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Upload New Profile Picture</DialogTitle>
                <DialogDescription>
                    Choose a new photo to represent you on the dashboard.
                </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
                <ImageUpload 
                    uploadContext="profile_picture"
                    currentImageUrl={user.profile_image_url ?? undefined}
                    onUploadComplete={() => {
                        // Invalidation is handled by the component's mutation, just close the dialog
                        setIsUploadDialogOpen(false);
                    }}
                />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationSettings() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const tanstackQueryClient = useTanstackQueryClient();

  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true, podcastMatches: true, applicationUpdates: true,
      weeklyReports: false, marketingEmails: false,
    },
  });

  useEffect(() => {
    if (user?.notification_settings) {
      form.reset(user.notification_settings);
    }
  }, [user, form]);

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: NotificationSettingsFormData) => apiRequest("PATCH", "/users/me/notification-settings", data),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update settings." }));
        throw new Error(errorData.detail);
      }
      await tanstackQueryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      toast({ title: "Success", description: "Notification preferences updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update preferences.", variant: "destructive" });
    },
  });

  if (authLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" />Notification Preferences</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => updateNotificationsMutation.mutate(data))} className="space-y-6">
            {Object.keys(notificationSettingsSchema.shape).map((key) => (
              <FormField key={key} control={form.control} name={key as keyof NotificationSettingsFormData}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                      <FormDescription>Receive updates for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={updateNotificationsMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {updateNotificationsMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Preferences</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PrivacySettings() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const tanstackQueryClient = useTanstackQueryClient();

  const form = useForm<PrivacySettingsFormData>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: { profileVisibility: "public", dataSharing: false, analyticsTracking: true },
  });

  useEffect(() => {
    if (user?.privacy_settings) {
      form.reset(user.privacy_settings);
    }
  }, [user, form]);

  const updatePrivacyMutation = useMutation({
    mutationFn: (data: PrivacySettingsFormData) => apiRequest("PATCH", "/users/me/privacy-settings", data),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update settings." }));
        throw new Error(errorData.detail);
      }
      await tanstackQueryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      toast({ title: "Success", description: "Privacy settings updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update settings.", variant: "destructive" });
    },
  });
  
  if (authLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center"><Shield className="mr-2 h-5 w-5" />Privacy & Security</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => updatePrivacyMutation.mutate(data))} className="space-y-6">
            <FormField control={form.control} name="profileVisibility" render={({ field }) => (
              <FormItem className="rounded-lg border p-4">
                <FormLabel className="text-base">Profile Visibility</FormLabel>
                <FormDescription>Control who can see your profile information.</FormDescription>
                <Select onValueChange={field.onChange} value={field.value ?? "public"}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="hosts_only">Podcast Hosts Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dataSharing" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><FormLabel className="text-base">Data Sharing</FormLabel><FormDescription>Allow sharing anonymized data for better matching.</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="analyticsTracking" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><FormLabel className="text-base">Analytics Tracking</FormLabel><FormDescription>Help us improve by sharing usage analytics.</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <Button type="submit" disabled={updatePrivacyMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {updatePrivacyMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Settings</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface OAuthProvider {
  provider: string;
  connected: boolean;
  email?: string;
  is_only_auth_method?: boolean;
}

function DataAndAccount() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [disconnectPassword, setDisconnectPassword] = useState("");

  const form = useForm<AccountDeletionRequestFormData>({
    resolver: zodResolver(accountDeletionRequestSchema),
    defaultValues: { password: "" },
  });

  useEffect(() => {
    loadOAuthProviders();
    
    // Check for success message from OAuth linking
    const urlParams = new URLSearchParams(window.location.search);
    const linked = urlParams.get("linked");
    if (linked) {
      toast({
        title: "Account Connected",
        description: `Successfully linked ${linked} account!`,
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const loadOAuthProviders = async () => {
    try {
      const providers = await getOAuthProviders();
      setOauthProviders(providers);
    } catch (error) {
      console.error("Failed to load OAuth providers:", error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleLinkProvider = async (provider: string) => {
    try {
      const result = await linkOAuthProvider(provider);
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      }
    } catch (error: any) {
      toast({
        title: "Link Failed",
        description: error.message || "Failed to link provider",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    const providerData = oauthProviders.find(p => p.provider === provider);
    if (providerData?.is_only_auth_method) {
      setSelectedProvider(provider);
      setShowPasswordModal(true);
    } else {
      try {
        await disconnectOAuthProvider(provider);
        await loadOAuthProviders();
        toast({
          title: "Account Disconnected",
          description: `${provider} account has been disconnected.`,
        });
      } catch (error: any) {
        toast({
          title: "Disconnect Failed",
          description: error.message || "Failed to disconnect provider",
          variant: "destructive",
        });
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    
    try {
      await disconnectOAuthProvider(selectedProvider, disconnectPassword);
      await loadOAuthProviders();
      toast({
        title: "Account Disconnected",
        description: `${selectedProvider} account has been disconnected and password has been set.`,
      });
      setShowPasswordModal(false);
      setDisconnectPassword("");
      setSelectedProvider(null);
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect provider",
        variant: "destructive",
      });
    }
  };

  const exportDataMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/users/export-data"),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to request data export." }));
        throw new Error(errorData.detail);
      }
      toast({ title: "Export Requested", description: "Your data export has been initiated. You will receive an email shortly." });
    },
    onError: (error: any) => {
      toast({ title: "Export Error", description: error.message || "Could not request data export.", variant: "destructive" });
    },
    onSettled: () => setIsExporting(false),
  });

  const deleteAccountRequestMutation = useMutation({
    mutationFn: (data: AccountDeletionRequestFormData) => apiRequest("POST", "/users/delete-account-request", data),
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to request account deletion." }));
        throw new Error(errorData.detail);
      }
      toast({ title: "Deletion Requested", description: "A confirmation email has been sent to you to complete the account deletion." });
      setShowDeleteConfirm(false); form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Deletion Error", description: error.message || "Could not request account deletion.", variant: "destructive" });
    },
    onSettled: () => setIsDeleting(false),
  });

  return (
    <div className="space-y-6">
      {/* Email & Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Email & Security
          </CardTitle>
          <CardDescription>
            Manage your email address and account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && <EmailChangeForm currentEmail={user.username} />}
        </CardContent>
      </Card>

      {/* OAuth Providers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage your linked authentication providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProviders ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {oauthProviders.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {provider.provider === "google" && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    <div>
                      <p className="font-medium capitalize">{provider.provider}</p>
                      {provider.connected && provider.email && (
                        <p className="text-sm text-gray-500">{provider.email}</p>
                      )}
                    </div>
                  </div>
                  
                  {provider.connected ? (
                    <Button
                      onClick={() => handleDisconnectProvider(provider.provider)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleLinkProvider(provider.provider)}
                      variant="outline"
                      size="sm"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center"><Download className="mr-2 h-5 w-5" />Data Export</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Request a copy of all your data.</p>
          <Button onClick={() => { setIsExporting(true); exportDataMutation.mutate(); }} disabled={isExporting} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isExporting ? "Requesting Export..." : <><Download className="mr-2 h-4 w-4" />Request Data Export</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5" />Account Deletion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" />Request Account Deletion
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(data => { setIsDeleting(true); deleteAccountRequestMutation.mutate(data); })} className="space-y-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Enter your password to confirm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex space-x-2">
                  <Button type="submit" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? "Processing..." : "Confirm Deletion Request"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowDeleteConfirm(false); form.reset(); }}>Cancel</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Password Modal for OAuth Disconnect */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Password Before Disconnecting</DialogTitle>
            <DialogDescription>
              You need to set a password before disconnecting your only authentication method.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={disconnectPassword}
                onChange={(e) => setDisconnectPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                minLength={8}
                required
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setDisconnectPassword("");
                  setSelectedProvider(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Set Password & Disconnect
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminSettings() {
  const { user } = useAuth();

  // Only show for admin and staff users
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">You do not have permission to access admin settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSmartSendSettings />
    </div>
  );
}

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Check if user is admin or staff to show the admin tab
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${isAdminOrStaff ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data & Account</TabsTrigger>
          {isAdminOrStaff && <TabsTrigger value="admin">Admin Settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileSettings /></TabsContent>
        <TabsContent value="notifications" className="mt-6"><NotificationSettings /></TabsContent>
        <TabsContent value="privacy" className="mt-6"><PrivacySettings /></TabsContent>
        <TabsContent value="data" className="mt-6"><DataAndAccount /></TabsContent>
        {isAdminOrStaff && <TabsContent value="admin" className="mt-6"><AdminSettings /></TabsContent>}
      </Tabs>
    </div>
  );
}