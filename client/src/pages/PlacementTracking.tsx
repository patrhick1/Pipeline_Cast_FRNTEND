// client/src/pages/PlacementTracking.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as appQueryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, Calendar, Users, PlayCircle, BarChart3, Download, ExternalLink, Podcast as PodcastIcon, 
  Eye, Share2, MessageSquare, Search, Filter, Plus, Edit, CheckCircle, Clock, AlertCircle, Check, X, Trash2, AlertTriangle, ChevronLeft, ChevronRight, History
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Interfaces (align with backend schemas) ---
interface Placement { // Matches PlacementInDB from backend
  placement_id: number;
  campaign_id: string;
  media_id: number;
  current_status?: string | null;
  status_ts?: string | null;
  meeting_date?: string | null; // Expect ISO date string YYYY-MM-DD from API
  call_date?: string | null;    // Expect ISO date string YYYY-MM-DD from API
  outreach_topic?: string | null;
  recording_date?: string | null; // Expect ISO date string YYYY-MM-DD from API
  go_live_date?: string | null;   // Expect ISO date string YYYY-MM-DD from API
  episode_link?: string | null;
  notes?: string | null;
  pitch_id?: number | null;
  created_at: string;
  // Enriched fields from backend router
  campaign_name?: string | null;
  client_name?: string | null;
  media_name?: string | null;
  media_website?: string | null;
}

interface ClientCampaign {
  campaign_id: string;
  campaign_name: string;
}
interface MediaItem {
    media_id: number;
    name: string | null;
}

// --- Zod Schemas for Forms ---
const placementFormSchema = z.object({
  campaign_id: z.string().uuid({ message: "Please select a valid campaign." }),
  media_id: z.coerce.number({invalid_type_error: "Please select a valid podcast."}).int().positive("Media ID is required"),
  current_status: z.string().optional().default("pending"),
  meeting_date: z.string().optional().nullable().refine(val => {
    if (val === "" || val === null || val === undefined) return true; 
    return /^\d{4}-\d{2}-\d{2}$/.test(val); 
  }, { message: "Invalid date format (YYYY-MM-DD)" }),
  call_date: z.string().optional().nullable().refine(val => {
    if (val === "" || val === null || val === undefined) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, { message: "Invalid date format (YYYY-MM-DD)" }),
  outreach_topic: z.string().optional(),
  recording_date: z.string().optional().nullable().refine(val => {
    if (val === "" || val === null || val === undefined) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, { message: "Invalid date format (YYYY-MM-DD)" }),
  go_live_date: z.string().optional().nullable().refine(val => {
    if (val === "" || val === null || val === undefined) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, { message: "Invalid date format (YYYY-MM-DD)" }),
  episode_link: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  notes: z.string().optional(),
  pitch_id: z.coerce.number().int().positive().optional().nullable(),
});
type PlacementFormData = z.infer<typeof placementFormSchema>;


const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; dotColor: string }> = {
  // Initial stages
  initial_reply: { label: "Initial Reply", icon: MessageSquare, color: "bg-blue-100 text-blue-800", dotColor: "bg-blue-500" },
  in_discussion: { label: "In Discussion", icon: MessageSquare, color: "bg-yellow-100 text-yellow-800", dotColor: "bg-yellow-500" },
  
  // Interest/Confirmation stages
  confirmed_interest: { label: "Confirmed Interest", icon: Eye, color: "bg-teal-100 text-teal-800", dotColor: "bg-teal-500" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-cyan-100 text-cyan-800", dotColor: "bg-cyan-500" },
  
  // Scheduling stages
  scheduling: { label: "Scheduling", icon: Calendar, color: "bg-purple-100 text-purple-800", dotColor: "bg-purple-500" },
  scheduled: { label: "Scheduled", icon: Calendar, color: "bg-indigo-100 text-indigo-800", dotColor: "bg-indigo-500" },
  recording_booked: { label: "Recording Booked", icon: Calendar, color: "bg-indigo-100 text-indigo-800", dotColor: "bg-indigo-500" },
  
  // Production stages
  recorded: { label: "Recorded", icon: PlayCircle, color: "bg-pink-100 text-pink-800", dotColor: "bg-pink-500" },
  live: { label: "Live", icon: ExternalLink, color: "bg-green-100 text-green-800", dotColor: "bg-green-500" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-emerald-100 text-emerald-800", dotColor: "bg-emerald-500" },
  
  // Other statuses
  needs_info: { label: "Needs Info", icon: AlertCircle, color: "bg-orange-100 text-orange-800", dotColor: "bg-orange-500" },
  declined: { label: "Declined", icon: X, color: "bg-red-100 text-red-800", dotColor: "bg-red-500" },
  cancelled: { label: "Cancelled", icon: X, color: "bg-gray-100 text-gray-700", dotColor: "bg-gray-500" },
  rejected: { label: "Rejected", icon: X, color: "bg-red-100 text-red-800", dotColor: "bg-red-500" },
  
  // Default fallback
  default: { label: "Unknown", icon: AlertCircle, color: "bg-gray-100 text-gray-700", dotColor: "bg-gray-400" },
};


// --- Placement Form Dialog (Create/Edit) ---
function PlacementFormDialog({
  placement, open, onOpenChange, onSuccess, campaigns, mediaItems
}: {
  placement?: Placement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  campaigns: ClientCampaign[];
  mediaItems: MediaItem[];
}) {
  const { toast } = useToast();
  const form = useForm<PlacementFormData>({
    resolver: zodResolver(placementFormSchema),
    defaultValues: { 
      campaign_id: undefined, 
      media_id: undefined,    
      current_status: "pending",
      meeting_date: "", 
      call_date: "",
      outreach_topic: "",
      recording_date: "",
      go_live_date: "",
      episode_link: "",
      notes: "",
      pitch_id: undefined,
    },
  });

  useEffect(() => {
    if (open) { 
      if (placement) { 
        form.reset({
          campaign_id: placement.campaign_id, 
          media_id: placement.media_id,       
          current_status: placement.current_status || "pending",
          meeting_date: placement.meeting_date ? placement.meeting_date.split('T')[0] : "",
          call_date: placement.call_date ? placement.call_date.split('T')[0] : "",
          outreach_topic: placement.outreach_topic || "",
          recording_date: placement.recording_date ? placement.recording_date.split('T')[0] : "",
          go_live_date: placement.go_live_date ? placement.go_live_date.split('T')[0] : "",
          episode_link: placement.episode_link || "",
          notes: placement.notes || "",
          pitch_id: placement.pitch_id ?? undefined,
        });
      } else { 
        form.reset({
          campaign_id: campaigns.length > 0 ? (campaigns[0].campaign_id || "") : "", 
          media_id: mediaItems.length > 0 ? (mediaItems[0].media_id || 0) : 0,    
          current_status: "pending",
          meeting_date: "", 
          call_date: "", 
          outreach_topic: "", 
          recording_date: "",
          go_live_date: "", 
          episode_link: "", 
          notes: "", 
          pitch_id: undefined, 
        });
      }
    }
  }, [placement, open, form, campaigns, mediaItems]);

  const mutation = useMutation({
    mutationFn: (data: PlacementFormData) => {
      const payload = {
        ...data,
        meeting_date: data.meeting_date || null,
        call_date: data.call_date || null,
        recording_date: data.recording_date || null,
        go_live_date: data.go_live_date || null,
        episode_link: data.episode_link || null,
        pitch_id: data.pitch_id || null, 
      };
      if (placement?.placement_id) {
        return apiRequest("PUT", `/placements/${placement.placement_id}`, payload);
      }
      return apiRequest("POST", "/placements/", payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: `Placement ${placement ? 'updated' : 'created'} successfully.` });
      onOpenChange(false); onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || `Failed to ${placement ? 'update' : 'create'} placement.`, variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{placement ? "Edit Placement" : "Create New Placement"}</DialogTitle>
          <DialogDescription>
            {placement ? `Update details for placement on ${placement.media_name || 'podcast'}.` : "Log a new podcast placement."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <FormField control={form.control} name="campaign_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={!!placement || campaigns.length === 0}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {campaigns.map(c => <SelectItem key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="media_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Podcast (Media) *</FormLabel>
                 <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""} disabled={!!placement || mediaItems.length === 0}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select podcast" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {mediaItems.map(m => <SelectItem key={m.media_id} value={m.media_id.toString()}>{m.name || `ID: ${m.media_id}`}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="current_status" render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "pending"}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(statusConfig)
                        .filter(([key]) => key !== 'default') 
                        .map(([key, conf]) => (
                            <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="meeting_date" render={({ field }) => (
                <FormItem><FormLabel>Meeting Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="recording_date" render={({ field }) => (
                <FormItem><FormLabel>Recording Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="go_live_date" render={({ field }) => (
                <FormItem><FormLabel>Go Live Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="pitch_id" render={({ field }) => (
                <FormItem><FormLabel>Associated Pitch ID</FormLabel><FormControl><Input type="number" placeholder="Enter Pitch ID" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="outreach_topic" render={({ field }) => (
              <FormItem><FormLabel>Outreach Topic</FormLabel><FormControl><Input placeholder="Topic discussed" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="episode_link" render={({ field }) => (
              <FormItem><FormLabel>Episode Link</FormLabel><FormControl><Input type="url" placeholder="https://link.to/episode" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any relevant notes..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {mutation.isPending ? "Saving..." : (placement ? "Update Placement" : "Create Placement")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// --- Status Change Dialog ---
function StatusChangeDialog({ 
  placement, 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  placement: Placement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [newStatus, setNewStatus] = useState(placement?.current_status || 'pending');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async () => {
      if (!placement) return;
      return apiRequest('PUT', `/placements/${placement.placement_id}`, {
        current_status: newStatus,
        notes: placement.notes ? `${placement.notes}\n\n[Status Change Note]: ${notes}` : notes
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Status Updated", 
        description: `Placement status changed to ${statusConfig[newStatus]?.label || newStatus}. This change has been logged in the status history.` 
      });
      onOpenChange(false);
      onSuccess();
      setNotes('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update status.", 
        variant: "destructive" 
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Placement Status</DialogTitle>
          <DialogDescription>
            Update the status for {placement?.media_name || 'this placement'}. This will be tracked in the status history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig)
                  .filter(([key]) => key !== 'default')
                  .map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center">
                        <config.icon className="w-4 h-4 mr-2" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <History className="w-4 h-4 mr-2" />
            This change will be recorded in the placement's status history
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Placement Table ---
function PlacementTable({ 
  placements, 
  onEdit, 
  onDelete, 
  onStatusChange,
  userRole 
}: { 
  placements: Placement[]; 
  onEdit: (placement: Placement) => void;
  onDelete: (placementId: number) => void;
  onStatusChange: (placement: Placement) => void;
  userRole?: string | null;
}) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Podcast</TableHead>
            <TableHead>Client/Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Meeting</TableHead>
            <TableHead>Recording</TableHead>
            <TableHead>Go Live</TableHead>
            <TableHead>Episode Link</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {placements.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                No placements found.
              </TableCell>
            </TableRow>
          )}
          {placements.map((placement) => {
            const currentStatusKey = placement.current_status || 'default';
            const config = statusConfig[currentStatusKey] || statusConfig.default;
            const StatusIcon = config.icon;
            return (
              <TableRow key={placement.placement_id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-gray-900">
                    {placement.media_name || `Media ID: ${placement.media_id}`}
                  </div>
                  {placement.media_website && (
                    <a 
                      href={placement.media_website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-primary hover:underline"
                    >
                      Website <ExternalLink className="inline h-3 w-3"/>
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{placement.client_name || 'Unknown Client'}</div>
                    <div className="text-gray-500">{placement.campaign_name || 'No Campaign'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {userRole === 'client' ? (
                    <Badge className={`${config.color} font-medium text-xs`}>
                      <StatusIcon className="w-3 h-3 mr-1.5" />
                      {config.label}
                    </Badge>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0">
                          <Badge className={`${config.color} font-medium text-xs cursor-pointer hover:opacity-80`}>
                            <StatusIcon className="w-3 h-3 mr-1.5" />
                            {config.label}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(statusConfig)
                          .filter(([key]) => key !== 'default' && key !== currentStatusKey)
                          .map(([key, conf]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => {
                                const updatedPlacement = { ...placement, current_status: key };
                                onStatusChange(updatedPlacement);
                              }}
                            >
                              <conf.icon className="w-4 h-4 mr-2" />
                              {conf.label}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
                <TableCell>{placement.meeting_date ? new Date(placement.meeting_date + 'T00:00:00').toLocaleDateString() : "-"}</TableCell>
                <TableCell>{placement.recording_date ? new Date(placement.recording_date + 'T00:00:00').toLocaleDateString() : "-"}</TableCell>
                <TableCell>{placement.go_live_date ? new Date(placement.go_live_date + 'T00:00:00').toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  {placement.episode_link ? (
                    <a 
                      href={placement.episode_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline text-sm"
                    >
                      <PlayCircle className="inline h-4 w-4 mr-1"/> Listen
                    </a>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {userRole !== 'client' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onEdit(placement)} 
                          title="Edit Placement"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {userRole === 'admin' && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => onDelete(placement.placement_id)} 
                            title="Delete Placement"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    )}
                    {placement.episode_link && (
                      <Button size="sm" variant="outline" asChild>
                        <a 
                          href={placement.episode_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Open Episode"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}



export default function PlacementTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState<string | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<Placement | null>(null);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [placementForStatusChange, setPlacementForStatusChange] = useState<Placement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const placementsQueryKey = ["/placements/", { 
    campaign_id: campaignFilter === "all" ? undefined : campaignFilter, 
    person_id: user?.role === 'client' ? user.person_id : undefined,
    page: currentPage,
    size: pageSize,
  }];

  const { data: placementsData, isLoading: isLoadingPlacements, error: placementsError } = useQuery<{items: Placement[], total: number, pages: number}>({
    queryKey: placementsQueryKey,
    queryFn: async ({ queryKey }) => {
        const params = queryKey[1] as any;
        let url = "/placements/?";
        const queryParams = new URLSearchParams();
        if (params.campaign_id) queryParams.append("campaign_id", params.campaign_id);
        if (params.person_id) queryParams.append("person_id", params.person_id.toString());
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.size) queryParams.append("size", params.size.toString());
        
        const response = await apiRequest("GET", url + queryParams.toString());
        if (!response.ok) throw new Error("Failed to fetch placements");
        return response.json();
    },
    enabled: !authLoading && !!user,
  });
  const placements = placementsData?.items || [];
  const totalPlacements = placementsData?.total || 0;
  const totalPages = placementsData?.pages || 1;

  const campaignsQueryKey = ["clientCampaignsForFilter", user?.person_id, user?.role];
  const { data: campaignsForFilter = [], isLoading: isLoadingCampaignsForFilter } = useQuery<ClientCampaign[]>({
    queryKey: campaignsQueryKey,
    queryFn: async ({ queryKey }) => {
      const [, personId, role] = queryKey as [string, number | undefined, string | undefined];
      
      // For clients, they automatically see only their own campaigns
      // For staff/admin, they see all campaigns
      const response = await apiRequest("GET", "/campaigns/");
      if (!response.ok) throw new Error("Failed to fetch campaigns for filter");
      return response.json();
    },
    enabled: !authLoading && !!user,
  });
  
  const { data: mediaItemsForForm = [], isLoading: isLoadingMediaForForm } = useQuery<MediaItem[]>({
    queryKey: ["allMediaForForm"],
    queryFn: async () => {
        const response = await apiRequest("GET", "/media/?limit=1000");
        if(!response.ok) throw new Error("Failed to fetch media items");
        return response.json();
    },
    staleTime: 1000 * 60 * 10 
  });


  const deletePlacementMutation = useMutation({
    mutationFn: (placementId: number) => apiRequest("DELETE", `/placements/${placementId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Placement deleted successfully." });
      tanstackQueryClient.invalidateQueries({ queryKey: ["/placements/"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete placement.", variant: "destructive" });
    }
  });

  const handleDelete = (placementId: number) => {
    if (window.confirm("Are you sure you want to delete this placement record?")) {
      deletePlacementMutation.mutate(placementId);
    }
  };

  const handleEdit = (placement: Placement) => {
    setEditingPlacement(placement);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPlacement(null);
    setIsFormOpen(true);
  };

  const handleStatusChange = (placement: Placement) => {
    setPlacementForStatusChange(placement);
    setStatusChangeDialogOpen(true);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, campaignFilter]);

  const filteredPlacements = placements.filter((placement: Placement) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
        (placement.media_name && placement.media_name.toLowerCase().includes(searchTermLower)) ||
        (placement.client_name && placement.client_name.toLowerCase().includes(searchTermLower)) ||
        (placement.campaign_name && placement.campaign_name.toLowerCase().includes(searchTermLower)) ||
        (placement.outreach_topic && placement.outreach_topic.toLowerCase().includes(searchTermLower));
    const matchesStatus = statusFilter === "all" || placement.current_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: totalPlacements,
    paid: placements.filter((p: Placement) => p.current_status === 'paid').length,
    live: placements.filter((p: Placement) => p.current_status === 'live').length,
    scheduled: placements.filter((p: Placement) => ['scheduled', 'recording_booked'].includes(p.current_status || '')).length
  };

  if (authLoading) {
      return <div className="p-6 text-center">Authenticating...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Placement Tracking</h1>
            <p className="text-gray-600">Monitor the status and performance of your podcast placements.</p>
        </div>
        {user?.role !== 'client' && (
            <Button onClick={handleCreateNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Add New Placement
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Placements</p>
                <p className="text-xl font-bold">{isLoadingPlacements ? <Skeleton className="h-6 w-12"/> : stats.total}</p>
              </div>
              <PodcastIcon className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Live Episodes</p>
                <p className="text-xl font-bold text-green-600">{isLoadingPlacements ? <Skeleton className="h-6 w-12"/> : stats.live}</p>
              </div>
              <PlayCircle className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Scheduled</p>
                <p className="text-xl font-bold text-blue-600">{isLoadingPlacements ? <Skeleton className="h-6 w-12"/> : stats.scheduled}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Paid/Completed</p>
                <p className="text-xl font-bold text-emerald-600">{isLoadingPlacements ? <Skeleton className="h-6 w-12"/> : stats.paid}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
              <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search podcast, client, campaign..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).filter(([k])=>k!=='default').map(([key, conf]) => (
                    <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {user?.role !== 'client' && (
                <Select value={campaignFilter} onValueChange={setCampaignFilter} disabled={isLoadingCampaignsForFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] text-sm">
                    <SelectValue placeholder="Filter by campaign" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaignsForFilter.map(c => (
                        <SelectItem key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
              )}
            </div>

            {user?.role !== 'client' && (
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoadingPlacements ? (
        <div className="text-center py-12">
          <Skeleton className="h-10 w-1/2 mx-auto mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : placementsError ? (
         <div className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md text-center">
            <AlertTriangle className="inline h-5 w-5 mr-2" />
            Error loading placements: {(placementsError as Error).message}
        </div>
      ) : filteredPlacements.length === 0 ? (
        <div className="text-center py-12">
          <PodcastIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No placements found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms. {user?.role !== 'client' && "Or add a new placement."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {Math.min(pageSize, filteredPlacements.length)} of {totalPlacements} placements
            </p>
          </div>
          <PlacementTable 
            placements={filteredPlacements} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            userRole={user?.role}
          />
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* Show first page */}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(1)}
                      isActive={currentPage === 1}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  
                  {/* Show ellipsis if needed */}
                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Show pages around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page > 1 && page < totalPages && Math.abs(page - currentPage) <= 1)
                    .map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  
                  {/* Show ellipsis if needed */}
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Show last page if more than 1 page */}
                  {totalPages > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        isActive={currentPage === totalPages}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {isFormOpen && (user?.role !== 'client') && (
        <PlacementFormDialog
          placement={editingPlacement}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={() => {
            tanstackQueryClient.invalidateQueries({ queryKey: placementsQueryKey });
            setEditingPlacement(null);
          }}
          campaigns={campaignsForFilter}
          mediaItems={mediaItemsForForm}
        />
      )}

      <StatusChangeDialog
        placement={placementForStatusChange}
        open={statusChangeDialogOpen}
        onOpenChange={setStatusChangeDialogOpen}
        onSuccess={() => {
          tanstackQueryClient.invalidateQueries({ queryKey: placementsQueryKey });
          setPlacementForStatusChange(null);
        }}
      />
    </div>
  );
}