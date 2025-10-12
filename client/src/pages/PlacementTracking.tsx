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
  Eye, Share2, MessageSquare, Search, Filter, Plus, Edit, CheckCircle, Clock, AlertCircle, Check, X, Trash2, AlertTriangle, ChevronLeft, ChevronRight, History, LayoutGrid, List, Target, Award, FileText
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
import { PlacementEditDialog } from "@/components/placements/PlacementEditDialog";
import { PlacementTimeline } from "@/components/placements/PlacementTimeline";
import { ClientPlacementCard } from "@/components/placements/ClientPlacementCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlacementAnalyticsDashboard from "@/components/analytics/PlacementAnalyticsDashboard";
import PitchAnalyticsDashboard from "@/components/analytics/PitchAnalyticsDashboard";
import PlacementStatusAnalytics from "@/components/analytics/PlacementStatusAnalytics";
import { PodcastDetailsModal } from "@/components/modals/PodcastDetailsModal";
import { statusConfig, type PlacementStatus } from "@/constants/placementStatus";
import { DateTimePicker } from "@/components/DateTimePicker";
import { formatDateTime, isUpcoming, utcToDatetimeLocal, datetimeLocalToUTC } from "@/lib/timezone";

// --- Interfaces (align with backend schemas) ---
interface Placement { // Matches PlacementInDB from backend
  placement_id: number;
  campaign_id: string;
  media_id: number;
  current_status?: string | null;
  status_ts?: string | null;
  meeting_date?: string | null; // ISO 8601 DateTime string
  call_date?: string | null; // ISO 8601 DateTime string
  recording_date?: string | null; // ISO 8601 DateTime string
  go_live_date?: string | null; // ISO 8601 DateTime string
  follow_up_date?: string | null; // ISO 8601 DateTime string - NEW
  outreach_topic?: string | null;
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
  // DateTime fields - ISO 8601 format
  meeting_date: z.string().nullable().optional(),
  call_date: z.string().nullable().optional(),
  recording_date: z.string().nullable().optional(),
  go_live_date: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(), // NEW
  outreach_topic: z.string().optional(),
  episode_link: z.string().url("Invalid URL").optional().or(z.literal("")).nullable(),
  notes: z.string().optional(),
  pitch_id: z.coerce.number().int().positive().optional().nullable(),
});
type PlacementFormData = z.infer<typeof placementFormSchema>;


// statusConfig is now imported from @/constants/placementStatus


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
      meeting_date: null,
      call_date: null,
      recording_date: null,
      go_live_date: null,
      follow_up_date: null,
      outreach_topic: "",
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
          meeting_date: placement.meeting_date || null,
          call_date: placement.call_date || null,
          recording_date: placement.recording_date || null,
          go_live_date: placement.go_live_date || null,
          follow_up_date: placement.follow_up_date || null,
          outreach_topic: placement.outreach_topic || "",
          episode_link: placement.episode_link || "",
          notes: placement.notes || "",
          pitch_id: placement.pitch_id ?? undefined,
        });
      } else {
        form.reset({
          campaign_id: campaigns.length > 0 ? (campaigns[0].campaign_id || "") : "",
          media_id: mediaItems.length > 0 ? (mediaItems[0].media_id || 0) : 0,
          current_status: "pending",
          meeting_date: null,
          call_date: null,
          recording_date: null,
          go_live_date: null,
          follow_up_date: null,
          outreach_topic: "",
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
        follow_up_date: data.follow_up_date || null,
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
                <FormItem>
                  <DateTimePicker
                    label="Meeting Date"
                    value={field.value}
                    onChange={field.onChange}
                    helpText="Pre-interview or prep call"
                  />
                  <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="follow_up_date" render={({ field }) => (
                <FormItem>
                  <DateTimePicker
                    label="Follow-up Date"
                    value={field.value}
                    onChange={field.onChange}
                    helpText="When to check in about status"
                  />
                  <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="recording_date" render={({ field }) => (
                <FormItem>
                  <DateTimePicker
                    label="Recording Date"
                    value={field.value}
                    onChange={field.onChange}
                    helpText="Actual podcast recording"
                  />
                  <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="go_live_date" render={({ field }) => (
                <FormItem>
                  <DateTimePicker
                    label="Go Live Date"
                    value={field.value}
                    onChange={field.onChange}
                    helpText="Episode publication date"
                  />
                  <FormMessage />
                </FormItem>
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

// --- Placement Table with Inline Editing ---
function PlacementTable({
  placements,
  onEdit,
  onDelete,
  onStatusChange,
  userRole,
  onBatchUpdate,
  onViewDetails
}: {
  placements: Placement[];
  onEdit: (placement: Placement) => void;
  onDelete: (placementId: number) => void;
  onStatusChange: (placement: Placement) => void;
  userRole?: string | null;
  onBatchUpdate?: (updates: Map<number, Partial<Placement>>) => void;
  onViewDetails?: (mediaId: number) => void;
}) {
  const [editedPlacements, setEditedPlacements] = useState<Map<number, Partial<Placement>>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (placementId: number, field: keyof Placement, value: any) => {
    const newEdits = new Map(editedPlacements);
    const currentEdits = newEdits.get(placementId) || {};
    newEdits.set(placementId, { ...currentEdits, [field]: value });
    setEditedPlacements(newEdits);
    setHasChanges(newEdits.size > 0);
  };

  const handleSaveChanges = () => {
    if (onBatchUpdate && editedPlacements.size > 0) {
      onBatchUpdate(editedPlacements);
      setEditedPlacements(new Map());
      setHasChanges(false);
    }
  };

  const handleCancelChanges = () => {
    setEditedPlacements(new Map());
    setHasChanges(false);
  };

  const getFieldValue = (placement: Placement, field: keyof Placement) => {
    const edits = editedPlacements.get(placement.placement_id);
    if (edits && field in edits) {
      const editedValue = edits[field];
      // If it's a datetime-local string (not ISO 8601), return as-is
      if (typeof editedValue === 'string' && editedValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        return editedValue;
      }
      // If it's ISO 8601, convert to datetime-local
      if (typeof editedValue === 'string' && editedValue.includes('Z')) {
        return utcToDatetimeLocal(editedValue);
      }
      return editedValue;
    }
    // For DateTime fields, convert UTC ISO 8601 to datetime-local format (YYYY-MM-DDTHH:mm)
    const dateTimeFields: Array<keyof Placement> = ['meeting_date', 'call_date', 'recording_date', 'go_live_date', 'follow_up_date'];
    if (dateTimeFields.includes(field) && placement[field]) {
      const dateValue = placement[field] as string;
      return utcToDatetimeLocal(dateValue);
    }
    return placement[field];
  };
  return (
    <div className="space-y-4">
      {hasChanges && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <AlertCircle className="w-4 h-4" />
            <span>You have unsaved changes</span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancelChanges}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveChanges}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Podcast</TableHead>
            <TableHead>Client/Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Follow-up</TableHead>
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
              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
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
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary hover:underline"
                    onClick={() => {
                      if (onViewDetails && placement.media_id) {
                        onViewDetails(placement.media_id);
                      }
                    }}
                  >
                    View Details <ExternalLink className="inline h-3 w-3 ml-1"/>
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{placement.client_name || 'Unknown Client'}</div>
                    <div className="text-gray-500">{placement.campaign_name || 'No Campaign'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={getFieldValue(placement, 'current_status') as string || 'pending'}
                    onValueChange={(value) => handleFieldChange(placement.placement_id, 'current_status', value)}
                  >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig)
                          .filter(([key]) => key !== 'default')
                          .map(([key, conf]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center">
                                <conf.icon className="w-3 h-3 mr-1.5" />
                                {conf.label}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="datetime-local"
                    className="w-[160px] h-8 text-xs"
                    value={getFieldValue(placement, 'follow_up_date') as string || ''}
                    onChange={(e) => handleFieldChange(placement.placement_id, 'follow_up_date', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="datetime-local"
                    className="w-[160px] h-8 text-xs"
                    value={getFieldValue(placement, 'meeting_date') as string || ''}
                    onChange={(e) => handleFieldChange(placement.placement_id, 'meeting_date', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="datetime-local"
                    className="w-[160px] h-8 text-xs"
                    value={getFieldValue(placement, 'recording_date') as string || ''}
                    onChange={(e) => handleFieldChange(placement.placement_id, 'recording_date', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="datetime-local"
                    className="w-[160px] h-8 text-xs"
                    value={getFieldValue(placement, 'go_live_date') as string || ''}
                    onChange={(e) => handleFieldChange(placement.placement_id, 'go_live_date', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="url"
                    placeholder="Episode URL"
                    className="w-[140px] h-8 text-xs"
                    value={getFieldValue(placement, 'episode_link') as string || ''}
                    onChange={(e) => handleFieldChange(placement.placement_id, 'episode_link', e.target.value || null)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {/* Edit button for detailed editing */}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onEdit(placement)} 
                      title="Edit Placement"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {userRole?.toLowerCase() === 'admin' && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => onDelete(placement.placement_id)} 
                        title="Delete Placement"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const pageSize = 20;

  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Use my-placements endpoint for clients, regular endpoint for staff/admin
  const isClient = user?.role === 'client';
  const placementsEndpoint = isClient ? "/placements/my-placements" : "/placements/";
  
  const placementsQueryKey = [placementsEndpoint, { 
    campaign_id: campaignFilter === "all" ? undefined : campaignFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    page: currentPage,
    size: pageSize,
  }];

  const { data: placementsData, isLoading: isLoadingPlacements, error: placementsError } = useQuery<{items: Placement[], total: number, pages: number}>({
    queryKey: placementsQueryKey,
    queryFn: async ({ queryKey }) => {
        const [endpoint, params] = queryKey as [string, any];
        const queryParams = new URLSearchParams();
        
        if (params.campaign_id) queryParams.append("campaign_id", params.campaign_id);
        if (params.status) queryParams.append("status", params.status);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.size) queryParams.append("size", params.size.toString());
        
        const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;
        const response = await apiRequest("GET", url);
        if (!response.ok) throw new Error("Failed to fetch placements");
        return response.json();
    },
    enabled: !authLoading && !!user,
  });
  const placements = placementsData?.items || [];
  const totalPlacements = placementsData?.total || 0;
  const totalPages = placementsData?.pages || 1;

  // Fetch campaigns with subscription info for filtering
  const { data: allCampaignsData = [], isLoading: isLoadingCampaignsForFilter } = useQuery<ClientCampaign[]>({
    queryKey: ['/campaigns/with-subscriptions', user?.role],
    queryFn: async () => {
      const response = await apiRequest('GET', '/campaigns/with-subscriptions');
      if (!response.ok) {
        // Fallback to regular campaigns endpoint
        const fallbackResponse = await apiRequest('GET', '/campaigns/');
        if (!fallbackResponse.ok) throw new Error('Failed to fetch campaigns');
        const campaigns = await fallbackResponse.json();
        // Return campaigns without subscription data
        return campaigns.map((c: any) => ({ ...c, subscription_plan: 'free' }));
      }
      return response.json();
    },
    enabled: !authLoading && !!user,
  });

  // Filter campaigns for admin/staff to only show paid_premium
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
  const campaignsForFilter = isStaffOrAdmin
    ? allCampaignsData.filter((c: any) => c.subscription_plan === 'paid_premium')
    : allCampaignsData;
  
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

  // Batch update mutation for inline editing
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: Map<number, Partial<Placement>>) => {
      const updatePromises = Array.from(updates.entries()).map(([placementId, changes]) => {
        const payload: any = { ...changes };

        // Convert datetime-local format to UTC ISO 8601 for API
        const dateFields = ['meeting_date', 'call_date', 'recording_date', 'go_live_date', 'follow_up_date'];
        dateFields.forEach(field => {
          if (field in changes) {
            const value = changes[field as keyof Placement];
            if (value === '' || value === null || value === undefined) {
              payload[field] = null;
            } else if (typeof value === 'string') {
              // If it's datetime-local format (YYYY-MM-DDTHH:mm), convert to UTC ISO 8601
              if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                payload[field] = datetimeLocalToUTC(value);
              }
              // If it's already ISO 8601 (contains Z), pass through
              else if (value.includes('Z')) {
                payload[field] = value;
              }
            }
          }
        });

        if ('episode_link' in payload) {
          payload.episode_link = payload.episode_link === '' ? null : payload.episode_link;
        }

        return apiRequest("PATCH", `/placements/${placementId}`, payload);
      });

      return Promise.all(updatePromises);
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "All placement changes have been saved successfully." 
      });
      tanstackQueryClient.invalidateQueries({ queryKey: placementsQueryKey });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save some placement changes.", 
        variant: "destructive" 
      });
    }
  });

  const handleBatchUpdate = (updates: Map<number, Partial<Placement>>) => {
    batchUpdateMutation.mutate(updates);
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

  // Fetch analytics summary
  const { data: analyticsSummary, isLoading: summaryLoading } = useQuery<{
    active_campaigns: number;
    total_pitches_sent: number;
    placements_secured: number;
    upcoming_recordings: number;
    pending_reviews: number;
  }>({
    queryKey: ['/analytics/summary'],
  });

  if (authLoading) {
      return <div className="p-6 text-center">Authenticating...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Placements & Analytics</h1>
            <p className="text-gray-600">Track your podcast placements and analyze performance metrics.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {user?.role !== 'client' && (
            <Button onClick={handleCreateNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Placement
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Campaigns</p>
                <div className="text-xl font-bold">{campaignsForFilter?.length || 0}</div>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Pitches</p>
                <div className="text-xl font-bold">
                  {summaryLoading ? <Skeleton className="h-6 w-12"/> : (analyticsSummary?.total_pitches_sent || 0)}
                </div>
              </div>
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Placements</p>
                <div className="text-xl font-bold">{isLoadingPlacements ? <Skeleton className="h-6 w-12"/> : stats.total}</div>
              </div>
              <PodcastIcon className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Live Episodes</p>
                <div className="text-xl font-bold text-green-600">{isLoadingPlacements ? <Skeleton className="h-6 w-12"/> : stats.live}</div>
              </div>
              <PlayCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Upcoming</p>
                <div className="text-xl font-bold">
                  {summaryLoading ? <Skeleton className="h-6 w-12"/> : (analyticsSummary?.upcoming_recordings || 0)}
                </div>
              </div>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs defaultValue="placements" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="status-analytics">Status Flow</TabsTrigger>
          <TabsTrigger value="analytics">Metrics</TabsTrigger>
          <TabsTrigger value="insights">Pitch Insights</TabsTrigger>
        </TabsList>

        {/* Placements Tab - Existing placement tracking functionality */}
        <TabsContent value="placements" className="space-y-4">
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
            </div>

            <div className="flex items-center gap-2 mt-2 md:mt-0">
              {/* View toggle for clients */}
              {isClient && (
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "table" | "cards")}>
                  <ToggleGroupItem value="table" aria-label="Table view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="cards" aria-label="Card view">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
              
              {!isClient && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
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
          {/* Show cards for clients in card view, table otherwise */}
          {isClient && viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlacements.map((placement) => (
                <ClientPlacementCard
                  key={placement.placement_id}
                  placement={placement}
                  onUpdate={() => {
                    tanstackQueryClient.invalidateQueries({ queryKey: placementsQueryKey });
                  }}
                />
              ))}
            </div>
          ) : (
            <PlacementTable
              placements={filteredPlacements}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              userRole={user?.role}
              onBatchUpdate={handleBatchUpdate}
              onViewDetails={(mediaId) => {
                setSelectedMediaId(mediaId);
                setIsPodcastModalOpen(true);
              }}
            />
          )}
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
        </TabsContent>

        {/* Status Analytics Tab - Placement status flow analytics */}
        <TabsContent value="status-analytics" className="space-y-6">
          <PlacementStatusAnalytics 
            campaignId={campaignFilter === 'all' ? undefined : campaignFilter}
            days={selectedDays}
          />
        </TabsContent>

        {/* Metrics Tab - Placement metrics dashboard */}
        <TabsContent value="analytics" className="space-y-6">
          <PlacementAnalyticsDashboard 
            campaignId={campaignFilter === 'all' ? undefined : campaignFilter}
            days={selectedDays}
          />
        </TabsContent>

        {/* Insights Tab - Pitch analytics dashboard */}
        <TabsContent value="insights" className="space-y-6">
          <PitchAnalyticsDashboard 
            campaignId={campaignFilter === 'all' ? undefined : campaignFilter}
            days={selectedDays}
          />
        </TabsContent>
      </Tabs>

      {/* Show PlacementEditDialog for clients, PlacementFormDialog for staff/admin */}
      {isFormOpen && isClient && editingPlacement && (
        <PlacementEditDialog
          placement={editingPlacement}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={() => {
            tanstackQueryClient.invalidateQueries({ queryKey: placementsQueryKey });
            setEditingPlacement(null);
          }}
          userRole={user?.role}
        />
      )}
      
      {isFormOpen && !isClient && (
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

      {/* Podcast Details Modal */}
      {selectedMediaId && (
        <PodcastDetailsModal
          isOpen={isPodcastModalOpen}
          onClose={() => {
            setIsPodcastModalOpen(false);
            setSelectedMediaId(null);
          }}
          mediaId={selectedMediaId}
        />
      )}
    </div>
  );
}