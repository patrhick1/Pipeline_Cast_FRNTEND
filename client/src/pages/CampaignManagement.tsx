// client/src/pages/CampaignManagement.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users as ClientsIcon, Plus, Edit, Trash2, Search, ArrowRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import EditCampaignDialog, { CampaignForEdit } from "@/components/dialogs/EditCampaignDialog";


interface PersonSummaryForCampaignManagement {
  person_id: string;
  full_name: string;
  email: string;
  role?: string;
}

interface CampaignSummaryForManagement extends CampaignForEdit { // Use CampaignForEdit as base
  // Inherits campaign_id, person_id, campaign_name, campaign_type, campaign_keywords, etc.
  embedding_status?: string | null;
  created_at: string;
  client_name?: string; // To be populated client-side
}


export default function CampaignManagement() {
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [editingCampaign, setEditingCampaign] = useState<CampaignSummaryForManagement | null>(null);
  const [isEditCampaignDialogOpen, setIsEditCampaignDialogOpen] = useState(false);

  const { data: peopleData = [], isLoading: isLoadingPeople } = useQuery<PersonSummaryForCampaignManagement[]>({
    queryKey: ["/people/"], // Fetch all people to link names and for dialogs
    queryFn: async () => {
      const response = await apiRequest("GET", "/people/");
      if (!response.ok) throw new Error("Failed to fetch people");
      return response.json();
    }
  });

  const { data: campaignsData = [], isLoading: isLoadingCampaigns, error } = useQuery<CampaignSummaryForManagement[]>({
    queryKey: ["allCampaignsForManagement"],
    queryFn: async () => {
      // Staff/Admin users see all campaigns through this endpoint
      const response = await apiRequest("GET", "/campaigns/"); 
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
  });

  const campaignsWithClientNames = campaignsData.map(campaign => {
    const client = peopleData.find(p => p.person_id === campaign.person_id);
    return { ...campaign, client_name: client?.full_name || `Client ID: ${campaign.person_id}` };
  });

  const filteredCampaigns = campaignsWithClientNames.filter(campaign =>
    campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.client_name && campaign.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    campaign.campaign_id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const deleteCampaignMutation = useMutation<Response, Error, string>({
    mutationFn: (campaignId: string) => apiRequest("DELETE", `/campaigns/${campaignId}`),
    onSuccess: (response, campaignId) => {
      if (!response.ok) { // Check if response is not OK if API might return error details in body
        // Try to parse error if possible, otherwise use a generic message
        response.json().then(err => {
          toast({ title: "Error Deleting Campaign", description: err.detail || `Failed to delete campaign ${campaignId}.`, variant: "destructive" });
        }).catch(() => {
          toast({ title: "Error Deleting Campaign", description: `Failed to delete campaign ${campaignId}. Status: ${response.status}`, variant: "destructive" });
        });
        return; // Important: stop further processing on error
      }
      toast({ title: "Success", description: "Campaign deleted successfully" });
      tanstackQueryClient.invalidateQueries({ queryKey: ["allCampaignsForManagement"] });
    },
    onError: (error: Error, campaignId) => {
      toast({ title: "Error Deleting Campaign", description: `${error.message} (ID: ${campaignId})`, variant: "destructive" });
    }
  });

  const handleDeleteCampaign = (campaignId: string) => {
    if (window.confirm("Are you sure you want to delete this campaign? This action cannot be undone and might affect associated data.")) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleEditCampaign = (campaign: CampaignSummaryForManagement) => {
    setEditingCampaign(campaign);
    setIsEditCampaignDialogOpen(true);
  };
  
  // Copied from AdminPanel for consistency, ensure it matches the backend logic
  const processCampaignContentMutation = useMutation<any, Error, string>({
    mutationFn: async (campaignId: string) => {
      toast({ title: "Task Triggered", description: `Attempting to process content for campaign: ${campaignId}...` });
      const response = await apiRequest("POST", `/tasks/run/process_campaign_content?campaign_id=${campaignId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Failed to trigger content processing for campaign ${campaignId}` }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data, campaignId) => {
      toast({ title: "Task Success", description: data.message || `Campaign content processing initiated for ${campaignId}.` });
      tanstackQueryClient.invalidateQueries({ queryKey: ["allCampaignsForManagement"] });
      tanstackQueryClient.invalidateQueries({ queryKey: ["campaignDetail", campaignId] });
    },
    onError: (error: Error, campaignId) => {
      toast({ title: "Task Failed", description: `Error processing content for campaign '${campaignId}': ${error.message}`, variant: "destructive" });
    },
  });


  if (isLoadingPeople || isLoadingCampaigns) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full mb-4" /> {/* Search bar skeleton */}
        <Skeleton className="h-64 w-full" /> {/* Table skeleton */}
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading campaigns: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClientsIcon className="mr-3 h-6 w-6 text-primary" />
            Client & Campaign Management
          </h1>
          <p className="text-gray-600">Oversee all client campaigns and their progress.</p>
        </div>
        {/* Admin and staff manage campaigns but don't create new ones - campaigns are created for clients */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns by name, client, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-1/2"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Embedding Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-4">No campaigns found.</TableCell></TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.campaign_id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>{campaign.client_name}</TableCell>
                      <TableCell>{campaign.campaign_type || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">{(campaign.campaign_keywords || []).join(', ') || "N/A"}</TableCell>
                      <TableCell>
                        {campaign.embedding_status ? (
                          <Badge 
                            variant={
                              campaign.embedding_status === 'completed' ? 'default' :
                              campaign.embedding_status === 'pending' ? 'outline' :
                              campaign.embedding_status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                            className={`capitalize text-xs ${campaign.embedding_status === 'completed' ? 'bg-green-100 text-green-700' : campaign.embedding_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}`}
                          >
                            {campaign.embedding_status.replace(/_/g, ' ')}
                          </Badge>
                        ) : <Badge variant="secondary" className="text-xs">N/A</Badge>}
                      </TableCell>
                      <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                           <Link href={`/manage/campaigns/${campaign.campaign_id}`}>
                            <Button size="sm" variant="outline" title="View Details">
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => handleEditCampaign(campaign)} title="Edit Campaign">
                            <Edit className="h-3 w-3" />
                          </Button>
                           <Button size="sm" variant="outline" onClick={() => processCampaignContentMutation.mutate(campaign.campaign_id)} title="Re-process Campaign Content & Embedding" disabled={processCampaignContentMutation.isPending && processCampaignContentMutation.variables === campaign.campaign_id}>
                            <RefreshCw className={`h-3 w-3 ${processCampaignContentMutation.isPending && processCampaignContentMutation.variables === campaign.campaign_id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(campaign.campaign_id)} title="Delete Campaign" disabled={deleteCampaignMutation.isPending && deleteCampaignMutation.variables === campaign.campaign_id}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingCampaign && (
        <EditCampaignDialog 
            campaign={editingCampaign} 
            people={peopleData}
            open={isEditCampaignDialogOpen} 
            onOpenChange={setIsEditCampaignDialogOpen} 
            onSuccess={() => {
                tanstackQueryClient.invalidateQueries({ queryKey: ["allCampaignsForManagement"] });
                setEditingCampaign(null); // Clear editing state
            }}
        />
      )}

    </div>
  );
}