import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Edit2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Campaign interface for client editing
export interface CampaignForClientEdit {
  campaign_id: string;
  campaign_name: string;
  goal_note?: string | null;
  ideal_podcast_description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

// Schema for client-editable fields only
const clientCampaignUpdateSchema = z.object({
  campaign_name: z.string().min(1, "Campaign name is required"),
  goal_note: z.string().optional().nullable(),
  ideal_podcast_description: z.string().optional().nullable(),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return data.end_date >= data.start_date;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);

export type ClientCampaignUpdateFormData = z.infer<typeof clientCampaignUpdateSchema>;

interface EditCampaignDialogClientProps {
  campaign: CampaignForClientEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCampaignDialogClient({ campaign, open, onOpenChange }: EditCampaignDialogClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<ClientCampaignUpdateFormData>({
    resolver: zodResolver(clientCampaignUpdateSchema),
    defaultValues: {
      campaign_name: "",
      goal_note: "",
      ideal_podcast_description: "",
      start_date: null,
      end_date: null,
    },
  });

  useEffect(() => {
    if (campaign && open) {
      form.reset({
        campaign_name: campaign.campaign_name,
        goal_note: campaign.goal_note || "",
        ideal_podcast_description: campaign.ideal_podcast_description || "",
        start_date: campaign.start_date ? new Date(campaign.start_date) : null,
        end_date: campaign.end_date ? new Date(campaign.end_date) : null,
      });
    }
  }, [campaign, form, open]);

  const editCampaignMutation = useMutation({
    mutationFn: async (data: ClientCampaignUpdateFormData) => {
      if (!campaign) throw new Error("No campaign selected for editing.");
      
      // Transform dates to ISO strings for API
      const payload = {
        ...data,
        start_date: data.start_date ? data.start_date.toISOString() : null,
        end_date: data.end_date ? data.end_date.toISOString() : null,
      };
      
      const response = await apiRequest("PATCH", `/campaigns/me/${campaign.campaign_id}`, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update campaign." }));
        throw new Error(errorData.detail || "Failed to update campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Campaign Updated", 
        description: "Your campaign details have been successfully updated." 
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["clientCampaignsList"] });
      queryClient.invalidateQueries({ queryKey: ["campaignDetail", campaign?.campaign_id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Update Failed", 
        description: error.message || "Failed to update campaign. Please try again.", 
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (formData: ClientCampaignUpdateFormData) => {
    editCampaignMutation.mutate(formData);
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Campaign Details
          </DialogTitle>
          <DialogDescription>
            Update your campaign information. These changes will help our team better understand your goals.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField 
              control={form.control} 
              name="campaign_name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., Q1 2024 Podcast Tour"
                    />
                  </FormControl>
                  <FormDescription>
                    A clear name helps you identify this campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <FormField
              control={form.control}
              name="goal_note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Goals & Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="What would you like to achieve with this campaign? Any specific topics, target audiences, or objectives?"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Share your objectives and any special requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ideal_podcast_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ideal Podcast Match</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Describe your ideal podcast match (e.g., topics, audience, format)..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    What kind of podcasts are you hoping to be featured on?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When should outreach begin?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.watch("start_date");
                            return date < new Date("1900-01-01") || (startDate ? date < startDate : false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Target completion date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editCampaignMutation.isPending}
              >
                {editCampaignMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}