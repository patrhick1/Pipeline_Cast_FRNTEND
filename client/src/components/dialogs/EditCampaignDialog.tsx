import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// --- Person Interface (simplified for client selection) ---
export interface PersonForClientSelection {
  person_id: number;
  full_name: string | null;
  email: string;
  role?: string | null; // To filter for 'client' role
}

// --- Campaign Interface (for initialData, ensure all relevant fields are present) ---
export interface CampaignForEdit { // Based on Campaign interface in AdminPanel
  campaign_id: string;
  person_id: number;
  campaign_name: string;
  campaign_type?: string | null;
  campaign_keywords?: string[] | null; // Will be transformed from campaign_keywords_str
  mock_interview_trancript?: string | null;
  media_kit_url?: string | null;
  goal_note?: string | null;
  instantly_campaign_id?: string | null;
  ideal_podcast_description?: string | null;
  // Add any other fields the form might interact with or display
}

// --- Campaign Schemas (Copied from AdminPanel.tsx, ensure alignment with backend) ---
const campaignUpdateSchemaContents = {
  person_id: z.coerce.number().int().positive("Client (Person ID) is required").optional(),
  campaign_name: z.string().min(1, "Campaign name is required").optional(),
  campaign_type: z.string().optional().nullable(),
  campaign_keywords_str: z.string().optional().nullable().describe("Comma-separated keywords"),
  ideal_podcast_description: z.string().optional().nullable(),
  mock_interview_trancript: z.string().optional().nullable(),
  media_kit_url: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  goal_note: z.string().optional().nullable(),
  instantly_campaign_id: z.string().optional().nullable(),
};
const campaignUpdateSchema = z.object(campaignUpdateSchemaContents)
  .transform(data => ({
    ...data,
    // Only include campaign_keywords in the payload if campaign_keywords_str was actually provided
    campaign_keywords: data.campaign_keywords_str !== undefined && data.campaign_keywords_str !== null 
                       ? data.campaign_keywords_str.split(',').map((kw: string) => kw.trim()).filter((kw: string) => kw) 
                       : undefined,
  }));

export type CampaignUpdateFormInput = z.input<typeof campaignUpdateSchema>; 
export type CampaignUpdatePayload = z.output<typeof campaignUpdateSchema>;

interface EditCampaignDialogProps {
  campaign: CampaignForEdit | null; // The campaign to edit
  people: PersonForClientSelection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditCampaignDialog({ campaign, people, open, onOpenChange, onSuccess }: EditCampaignDialogProps) {
  const { toast } = useToast();
  const form = useForm<CampaignUpdateFormInput>({
    resolver: zodResolver(campaignUpdateSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (campaign && open) {
      form.reset({
        person_id: campaign.person_id,
        campaign_name: campaign.campaign_name,
        campaign_type: campaign.campaign_type || "",
        campaign_keywords_str: (campaign.campaign_keywords || []).join(', '),
        ideal_podcast_description: campaign.ideal_podcast_description || "",
        mock_interview_trancript: campaign.mock_interview_trancript || "",
        media_kit_url: campaign.media_kit_url || "",
        goal_note: campaign.goal_note || "",
        instantly_campaign_id: campaign.instantly_campaign_id || "",
      });
    }
  }, [campaign, form, open]);

  const editCampaignMutation = useMutation({
    mutationFn: (data: CampaignUpdatePayload) => {
      if (!campaign) throw new Error("No campaign selected for editing.");
      // Use client-specific endpoint for campaign updates
      return apiRequest("PATCH", `/campaigns/me/${campaign.campaign_id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign updated successfully." });
      onOpenChange(false); 
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error Updating Campaign", description: error.message || "Failed to update campaign.", variant: "destructive" });
    }
  });

  const onEditSubmit = (formData: CampaignUpdateFormInput) => {
    editCampaignMutation.mutate(formData as any); // Zod transform handles the type difference
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Campaign: {campaign.campaign_name}</DialogTitle>
          <DialogDescription>Edit the details for this campaign.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <FormField control={form.control} name="person_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client (Person)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {people.filter(p => p.role === 'client').map(p => (
                        <SelectItem key={p.person_id} value={p.person_id.toString()}>{p.full_name} ({p.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="campaign_name" render={({ field }) => (
                <FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="campaign_type" render={({ field }) => (
                <FormItem><FormLabel>Campaign Type</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="campaign_keywords_str" render={({ field }) => (
                <FormItem><FormLabel>Keywords (comma-separated)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ideal_podcast_description" render={({ field }) => (
                <FormItem><FormLabel>Ideal Podcast Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} placeholder="Describe the type of podcasts that would be a good fit for this campaign..." className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mock_interview_trancript" render={({ field }) => (
                <FormItem><FormLabel>Mock Interview Transcript/Link</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="media_kit_url" render={({ field }) => (
                <FormItem><FormLabel>Media Kit URL</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="goal_note" render={({ field }) => (
                <FormItem><FormLabel>Goal/Focus for Campaign</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="instantly_campaign_id" render={({ field }) => (
                <FormItem><FormLabel>Instantly Campaign ID</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={editCampaignMutation.isPending}>
                {editCampaignMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 