import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, CheckCircle, Info, BrainCircuit } from 'lucide-react';

interface Provenance {
  source: string;
  confidence: number;
  updated_at: string;
}

interface ProvenanceFieldProps {
  mediaId: number;
  fieldName: string;
  label: string;
  value?: string | null;
  provenance?: Provenance | null;
}

const sourceInfo: { [key: string]: { icon: React.ReactNode; text: string; color: string } } = {
  'manual': { icon: <CheckCircle className="h-4 w-4" />, text: 'Manually Verified', color: 'text-green-600' },
  'api_listennotes': { icon: <Info className="h-4 w-4" />, text: 'From Listen Notes API', color: 'text-blue-600' },
  'llm_discovery': { icon: <BrainCircuit className="h-4 w-4" />, text: 'AI Discovered', color: 'text-teal' },
};

export function ProvenanceField({ mediaId, fieldName, label, value, provenance }: ProvenanceFieldProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const mutation = useMutation<any, Error, { [key: string]: string }>({
    mutationFn: async (data) => {
      const response = await apiRequest("PUT", `/media/${mediaId}`, { body: data });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update field" }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: `${label} updated successfully.` });
      queryClient.invalidateQueries({ queryKey: ["/media/", mediaId] });
      setOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ [fieldName]: editValue });
  };

  const currentSourceInfo = provenance ? sourceInfo[provenance.source] || { icon: <Info className="h-4 w-4" />, text: `Source: ${provenance.source}`, color: 'text-gray-500' } : null;
  const isManual = provenance?.source === 'manual';

  return (
    <div>
      <div className={`flex items-center gap-2 mt-1 p-2 border rounded-md ${isManual ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`cursor-pointer ${currentSourceInfo?.color}`}>
                {currentSourceInfo?.icon || <Info className="h-4 w-4 text-gray-400" />}
              </span>
            </TooltipTrigger>
            {provenance && currentSourceInfo && (
              <TooltipContent>
                <p>{currentSourceInfo.text}</p>
                <p>Confidence: {Math.round(provenance.confidence * 100)}%</p>
                <p>Last Updated: {new Date(provenance.updated_at).toLocaleString()}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <span id={fieldName} className="flex-grow text-sm truncate" title={value || ''}>{value || 'N/A'}</span>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-auto flex-shrink-0">
              <Edit3 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {label}</DialogTitle>
              <DialogDescription>
                Manually overriding this value will mark it as verified and lock it from automatic updates.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label htmlFor={`edit-${fieldName}`}>{label}</Label>
                <Input
                  id={`edit-${fieldName}`}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 