import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, FileText, Sparkles, Info, Loader2 } from 'lucide-react';

interface PitchTemplate {
  template_id: string;
  display_name: string;
  description: string;
  use_case: string;
  tone: string;
  preview?: string;
  sort_order: number;
}

interface PitchTemplatePreview {
  subject: string;
  body: string;
  template_used: string;
}

interface PitchTemplateSelectorProps {
  matchId: number;
  mediaName?: string;
  campaignName?: string;
  onSuccess: (pitchGenId: number) => void;
}

export function PitchTemplateSelector({ matchId, mediaName, campaignName, onSuccess }: PitchTemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<PitchTemplatePreview | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const { toast } = useToast();

  // Fetch available templates
  const { data: templates = [], isLoading: isLoadingTemplates, error: templatesError } = useQuery<PitchTemplate[]>({
    queryKey: ['/pitches/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/pitches/templates');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch templates' }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Auto-select first template when loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].template_id);
    }
  }, [templates, selectedTemplateId]);

  // Handle template preview
  const handlePreview = async () => {
    if (!selectedTemplateId || !matchId) return;
    
    setIsPreviewing(true);
    try {
      const response = await apiRequest('POST', '/pitches/templates/preview', {
        match_id: matchId,
        template_id: selectedTemplateId
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to preview template' }));
        throw new Error(errorData.detail);
      }
      
      const data = await response.json();
      setPreview(data);
      setShowPreview(true);
    } catch (error: any) {
      toast({
        title: 'Preview Failed',
        description: error.message || 'Failed to preview template',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  // Handle pitch creation
  const handleCreatePitch = async () => {
    if (!selectedTemplateId || !matchId) return;
    
    setIsCreating(true);
    try {
      const response = await apiRequest('POST', '/pitches/create-manual', {
        match_id: matchId,
        template_id: selectedTemplateId,
        pitch_type: 'initial'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create pitch' }));
        throw new Error(errorData.detail);
      }
      
      const data = await response.json();
      
      toast({
        title: 'Pitch Created Successfully',
        description: 'Your pitch has been created using the selected template and is ready to send.',
      });
      
      // Call success callback with the pitch_gen_id
      if (data.pitch_gen_id) {
        onSuccess(data.pitch_gen_id);
      }
      
      // Close preview if open
      setShowPreview(false);
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create pitch',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Get tone color for badges
  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'professional':
        return 'bg-blue-100 text-blue-700';
      case 'friendly':
        return 'bg-green-100 text-green-700';
      case 'casual':
        return 'bg-yellow-100 text-yellow-700';
      case 'enthusiastic':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoadingTemplates) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (templatesError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load email templates. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (templates.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No email templates available at the moment. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Select Email Template
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose a professionally crafted template for {mediaName || 'this podcast'}
        </p>
      </div>

      {/* Template Selection */}
      <RadioGroup value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
        <div className="space-y-3">
          {templates.map((template) => (
            <Card 
              key={template.template_id}
              className={`cursor-pointer transition-all ${
                selectedTemplateId === template.template_id 
                  ? 'border-primary shadow-md' 
                  : 'hover:shadow-sm'
              }`}
              onClick={() => setSelectedTemplateId(template.template_id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value={template.template_id} id={template.template_id} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={template.template_id} className="cursor-pointer font-semibold">
                        {template.display_name}
                      </Label>
                      <Badge variant="secondary" className={`text-xs ${getToneColor(template.tone)}`}>
                        {template.tone}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Best for: </span>
                    <span className="text-gray-600">{template.use_case}</span>
                  </div>
                  {template.preview && (
                    <div className="bg-gray-50 rounded-md p-3 mt-2">
                      <p className="text-xs text-gray-600 font-mono line-clamp-3">
                        {template.preview}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handlePreview}
          disabled={!selectedTemplateId || isPreviewing}
          variant="outline"
          className="flex-1"
        >
          {isPreviewing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Preview...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Preview Email
            </>
          )}
        </Button>
        <Button
          onClick={handleCreatePitch}
          disabled={!selectedTemplateId || isCreating}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Pitch...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Create Pitch
            </>
          )}
        </Button>
      </div>

      {/* Info Box */}
      <Alert className="bg-blue-50 border-blue-200">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Free Plan Feature:</strong> Templates provide a professional foundation for your pitches. While our smart mail merge fills in your campaign details automatically, you may need to personalize certain sections (like host names or specific topics) before sending for best results.
        </AlertDescription>
      </Alert>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          
          {preview && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">To:</h4>
                <p className="text-sm bg-gray-50 p-2 rounded">{mediaName || 'Podcast Host'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Subject:</h4>
                <p className="text-sm bg-gray-50 p-2 rounded">{preview.subject}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Message:</h4>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-sm font-mono">
                  {preview.body}
                </div>
              </div>
              
              <Alert className="bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  This preview shows how your actual data will be merged into the template.
                  The final email will include your real information.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
            <Button
              onClick={handleCreatePitch}
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Pitch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}