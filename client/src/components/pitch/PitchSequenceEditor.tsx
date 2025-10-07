import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Clock, Send, Save, FileText, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePitchCapabilities } from '@/hooks/usePitchCapabilities';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface PitchDraft {
  subject: string;
  body: string;
  pitch_type: string;
  delay_days: number;
}

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

interface PitchSequenceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
    match_id: number;
    media_name?: string;
    campaign_name?: string;
  };
  onSuccess: (initialPitchGenId: number) => void;
}

export function PitchSequenceEditor({ isOpen, onClose, match, onSuccess }: PitchSequenceEditorProps) {
  const queryClient = useQueryClient();
  const { isFreePlan } = usePitchCapabilities();
  const { user } = useAuth();
  const [creationMode, setCreationMode] = useState<'template' | 'manual'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pitchDrafts, setPitchDrafts] = useState<PitchDraft[]>([
    {
      subject: '',
      body: '',
      pitch_type: 'initial',
      delay_days: 0
    }
  ]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('0');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { toast } = useToast();

  // Fetch templates for free users
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<PitchTemplate[]>({
    queryKey: ['/pitches/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/pitches/templates');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch templates' }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    enabled: isOpen && isFreePlan,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-select first template when loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId && isFreePlan) {
      setSelectedTemplateId(templates[0].template_id);
    }
  }, [templates, selectedTemplateId, isFreePlan]);

  // Reset to template mode for free users when dialog opens
  useEffect(() => {
    if (isOpen && isFreePlan) {
      setCreationMode('template');
      setPitchDrafts([{
        subject: '',
        body: '',
        pitch_type: 'initial',
        delay_days: 0
      }]);
    }
  }, [isOpen, isFreePlan]);

  // Templates for initial pitch
  const initialPitchTemplates = {
    friendly: {
      subject: `Love what you're doing with ${match.media_name || 'your podcast'}!`,
      body: `Hi [Host Name],

I've been following ${match.media_name || 'your podcast'} and really enjoyed your recent episode about [topic]. Your insights on [specific point] really resonated with me.

[Your introduction and value proposition]

I'd love to share my experience with [your expertise] with your audience.

Best regards,
[Your name]`
    },
    professional: {
      subject: `Partnership Opportunity with ${match.media_name || 'your podcast'}`,
      body: `Dear [Host Name],

I'm reaching out regarding a potential collaboration with ${match.media_name || 'your podcast'}.

[Your credentials and expertise]

I believe I could provide valuable insights on:
• [Topic 1]
• [Topic 2]
• [Topic 3]

Would you be interested in having me as a guest?

Sincerely,
[Your name]`
    },
    value: {
      subject: `Quick idea for ${match.media_name || 'your podcast'}`,
      body: `Hi [Host Name],

Just listened to your episode on [topic] - fantastic discussion!

It got me thinking about [related insight/angle] that your audience might find valuable.

[Brief value proposition]

Happy to share more if you're interested in exploring this for a future episode.

Best,
[Your name]`
    }
  };

  const loadInitialTemplate = (type: keyof typeof initialPitchTemplates) => {
    const template = initialPitchTemplates[type];
    updateDraft(0, 'subject', template.subject);
    updateDraft(0, 'body', template.body);
  };

  const addFollowUp = () => {
    const newFollowUp: PitchDraft = {
      subject: '',
      body: '',
      pitch_type: `follow_up_${pitchDrafts.length}`,
      delay_days: 3 // Default delay
    };
    setPitchDrafts([...pitchDrafts, newFollowUp]);
    setCurrentTab(String(pitchDrafts.length)); // Switch to new tab
  };

  const removeFollowUp = (index: number) => {
    if (index === 0) return; // Can't remove initial pitch
    const newDrafts = pitchDrafts.filter((_, i) => i !== index);
    // Re-index follow-up types
    const reindexedDrafts = newDrafts.map((draft, i) => ({
      ...draft,
      pitch_type: i === 0 ? 'initial' : `follow_up_${i}`
    }));
    setPitchDrafts(reindexedDrafts);
    setCurrentTab(String(Math.max(0, index - 1))); // Switch to previous tab
  };

  const updateDraft = (index: number, field: keyof PitchDraft, value: string | number) => {
    const newDrafts = [...pitchDrafts];
    newDrafts[index] = { ...newDrafts[index], [field]: value };
    setPitchDrafts(newDrafts);
  };

  const validateSequence = (): boolean => {
    for (let i = 0; i < pitchDrafts.length; i++) {
      const draft = pitchDrafts[i];
      if (!draft.subject.trim()) {
        toast({
          title: 'Validation Error',
          description: `${i === 0 ? 'Initial pitch' : `Follow-up ${i}`} is missing a subject line.`,
          variant: 'destructive',
        });
        setCurrentTab(String(i));
        return false;
      }
      if (!draft.body.trim()) {
        toast({
          title: 'Validation Error',
          description: `${i === 0 ? 'Initial pitch' : `Follow-up ${i}`} is missing body content.`,
          variant: 'destructive',
        });
        setCurrentTab(String(i));
        return false;
      }
      if (i > 0 && draft.delay_days < 1) {
        toast({
          title: 'Validation Error',
          description: `Follow-up ${i} must have a delay of at least 1 day.`,
          variant: 'destructive',
        });
        setCurrentTab(String(i));
        return false;
      }
    }
    return true;
  };

  const handleCreateSequence = async () => {
    // For template mode with free users
    if (isFreePlan && creationMode === 'template') {
      if (!selectedTemplateId) {
        toast({
          title: 'Template Required',
          description: 'Please select a template to continue.',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await apiRequest('POST', '/pitches/create-manual', {
          match_id: match.match_id,
          template_id: selectedTemplateId,
          pitch_type: 'initial',
          recipient_email: recipientEmail || undefined
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to create pitch' }));
          throw new Error(errorData.detail);
        }

        const responseData = await response.json();
        
        toast({
          title: 'Pitch Created Successfully',
          description: 'Your pitch has been created using the selected template and is ready to send.',
        });

        // Refresh queries and notify parent
        queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
        queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
        
        onSuccess(responseData.pitch_gen_id);
        onClose();
      } catch (error: any) {
        toast({
          title: 'Creation Failed',
          description: error.message || 'Failed to create pitch.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For manual creation (paid users or when writing from scratch)
    if (!validateSequence()) return;

    setIsSubmitting(true);
    let parentPitchGenId: number | null = null;
    const createdPitchGenIds: number[] = [];

    try {
      for (let index = 0; index < pitchDrafts.length; index++) {
        const draft = pitchDrafts[index];
        const requestBody: any = {
          match_id: match.match_id,
          subject_line: draft.subject,
          body_text: draft.body,
          pitch_type: index === 0 ? 'initial' : `follow_up_${index}`,
          parent_pitch_gen_id: parentPitchGenId,
          follow_up_delay_days: draft.delay_days
        };

        // Only include recipient_email on initial pitch
        if (index === 0 && recipientEmail.trim()) {
          requestBody.recipient_email = recipientEmail;
        }

        const response = await apiRequest('POST', '/pitches/create-manual', requestBody);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: `Failed to create ${index === 0 ? 'initial pitch' : `follow-up ${index}`}` }));
          throw new Error(errorData.detail);
        }

        const responseData = await response.json();
        parentPitchGenId = responseData.pitch_gen_id;
        if (parentPitchGenId) {
          createdPitchGenIds.push(parentPitchGenId);
        }
      }

      toast({
        title: pitchDrafts.length > 1 ? 'Pitch Sequence Created' : 'Pitch Created',
        description: pitchDrafts.length > 1 
          ? `Successfully created ${pitchDrafts.length} pitches (${pitchDrafts.length - 1} follow-up${pitchDrafts.length - 1 !== 1 ? 's' : ''}). Send the initial pitch to activate the sequence.`
          : 'Your pitch has been created successfully and is ready to send.',
      });

      // Refresh all pitch-related queries for immediate updates
      queryClient.invalidateQueries({ queryKey: ["approvedMatchesForPitching"] });
      queryClient.invalidateQueries({ queryKey: ["pitchesReadyToSend"] });
      queryClient.refetchQueries({ queryKey: ["pitchesReadyToSend"] });

      // Reset form
      setPitchDrafts([{
        subject: '',
        body: '',
        pitch_type: 'initial',
        delay_days: 0
      }]);
      setRecipientEmail('');
      setCurrentTab('0');
      
      // Notify parent with the initial pitch ID
      onSuccess(createdPitchGenIds[0]);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create pitch sequence.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Template for follow-ups
  const followUpTemplates = {
    gentle: {
      subject: 'Re: [Previous Subject] - Following up',
      body: `Hi [Host Name],

I wanted to follow up on my previous message about appearing on ${match.media_name || 'your podcast'}.

I understand you're busy, but I'd love to know if you had a chance to consider my proposal.

[Add any new information or value proposition]

Looking forward to hearing from you!

Best,
[Your name]`
    },
    value: {
      subject: 'Quick thought on [Topic] for ${match.media_name || "your podcast"}',
      body: `Hi [Host Name],

Following up on my previous email - I just came across [relevant news/stat/insight] that your audience might find interesting.

[Share the insight]

This aligns perfectly with what I could share as a guest. Would love to discuss how we could create valuable content together.

Best regards,
[Your name]`
    },
    final: {
      subject: 'Last check-in regarding ${match.media_name || "podcast"} appearance',
      body: `Hi [Host Name],

I wanted to reach out one last time regarding a potential guest appearance on ${match.media_name || 'your podcast'}.

If now isn't the right time, I completely understand. Feel free to reach out in the future if things change.

Wishing you continued success with the show!

Best,
[Your name]`
    }
  };

  const loadFollowUpTemplate = (index: number, type: 'gentle' | 'value' | 'final') => {
    const template = followUpTemplates[type];
    updateDraft(index, 'subject', template.subject);
    updateDraft(index, 'body', template.body);
  };

  // Load template preview for free users
  const loadTemplatePreview = async () => {
    if (!selectedTemplateId || !match.match_id) return;
    
    setIsLoadingPreview(true);
    try {
      const response = await apiRequest('POST', '/pitches/templates/preview', {
        match_id: match.match_id,
        template_id: selectedTemplateId
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to preview template' }));
        throw new Error(errorData.detail);
      }
      
      const data: PitchTemplatePreview = await response.json();
      // Update the first draft with the preview data
      setPitchDrafts([{
        subject: data.subject,
        body: data.body,
        pitch_type: 'initial',
        delay_days: 0
      }]);
      
      toast({
        title: 'Template Loaded',
        description: 'Preview loaded with your personalized data.',
      });
    } catch (error: any) {
      toast({
        title: 'Preview Failed',
        description: error.message || 'Failed to load template preview',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pitch</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{match.media_name}</span>
            {match.campaign_name && <span className="text-sm"> • Campaign: {match.campaign_name}</span>}
            <br />
            <span className="text-xs mt-1 inline-block">Create your pitch and optionally add automatic follow-ups</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection for Free Users */}
          {isFreePlan && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Choose Creation Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={creationMode} onValueChange={(v) => setCreationMode(v as 'template' | 'manual')}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="template" id="template-mode" />
                      <div className="flex-1">
                        <Label htmlFor="template-mode" className="font-medium cursor-pointer">
                          <FileText className="inline-block w-4 h-4 mr-1" />
                          Use Email Template (Recommended)
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Select from professionally crafted templates with smart mail merge
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="manual" id="manual-mode" />
                      <div className="flex-1">
                        <Label htmlFor="manual-mode" className="font-medium cursor-pointer">
                          <Edit3 className="inline-block w-4 h-4 mr-1" />
                          Write from Scratch
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Create a completely custom pitch manually
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Template Selection for Free Users */}
          {isFreePlan && creationMode === 'template' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Select Email Template</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTemplates ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : templates.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No templates available. Please contact support.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <RadioGroup value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
                      <div className="space-y-3">
                        {templates.map((template) => (
                          <div key={template.template_id} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <RadioGroupItem value={template.template_id} id={`tpl-${template.template_id}`} />
                              <div className="flex-1">
                                <Label htmlFor={`tpl-${template.template_id}`} className="cursor-pointer">
                                  <div className="font-medium">{template.display_name}</div>
                                  <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-xs">{template.tone}</Badge>
                                    <span className="text-xs text-gray-500">• {template.use_case}</span>
                                  </div>
                                </Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                  {selectedTemplateId && (
                    <Button
                      type="button"
                      onClick={loadTemplatePreview}
                      disabled={isLoadingPreview}
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      {isLoadingPreview ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading Preview...
                        </>
                      ) : (
                        <>Load Template Preview</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Preview Section */}
              {pitchDrafts[0].subject && pitchDrafts[0].body && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Template Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold">Subject:</Label>
                      <p className="text-sm mt-1">{pitchDrafts[0].subject}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Message:</Label>
                      <div className="text-sm mt-1 whitespace-pre-wrap bg-white p-3 rounded border">
                        {pitchDrafts[0].body}
                      </div>
                    </div>
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertDescription className="text-sm text-amber-800">
                        <strong>✏️ Please Review:</strong> While templates provide a great starting point, they may contain placeholder text like "[Host Name]" or "[topic]" that needs your personal touch. You'll have the opportunity to edit and perfect your pitch before sending.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recipient Email (Global) - Only show for admin/staff */}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email (Optional)</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="podcast@example.com (leave blank to use default)"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">This email will be used for all pitches in the sequence</p>
            </div>
          )}

          {/* Pitch Tabs - Show only for manual mode or paid users */}
          {(!isFreePlan || creationMode === 'manual') && (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg border">
              <TabsList className="flex gap-2 bg-white shadow-sm p-1">
                {pitchDrafts.map((draft, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={String(index)} 
                    className="relative data-[state=active]:bg-primary data-[state=active]:text-white min-w-[120px] px-3 py-2"
                  >
                    {index === 0 ? (
                      <div className="flex items-center">
                        <Send className="w-3 h-3 mr-1" />
                        <span>Initial</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Follow-up {index}</span>
                        {draft.delay_days > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs px-1">
                            +{draft.delay_days}d
                          </Badge>
                        )}
                      </div>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFollowUp}
                disabled={isSubmitting || pitchDrafts.length >= 5}
                className="ml-4"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Follow-up
              </Button>
            </div>

            {pitchDrafts.map((draft, index) => (
              <TabsContent key={index} value={String(index)} className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {index === 0 ? 'Initial Pitch' : `Follow-up ${index}`}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {index > 0 && (
                          <>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`delay-${index}`} className="text-sm">Send after</Label>
                              <Input
                                id={`delay-${index}`}
                                type="number"
                                min="1"
                                max="30"
                                value={draft.delay_days}
                                onChange={(e) => updateDraft(index, 'delay_days', parseInt(e.target.value) || 1)}
                                className="w-20"
                                disabled={isSubmitting}
                              />
                              <span className="text-sm text-gray-500">days</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFollowUp(index)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Template suggestions */}
                    {index === 0 ? (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <Label className="text-sm font-medium mb-2 block">Start with a template:</Label>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadInitialTemplate('friendly')}
                          >
                            Friendly Approach
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadInitialTemplate('professional')}
                          >
                            Professional
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadInitialTemplate('value')}
                          >
                            Value-First
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <Label className="text-sm font-medium mb-2 block">Use a template:</Label>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadFollowUpTemplate(index, 'gentle')}
                          >
                            Gentle Reminder
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadFollowUpTemplate(index, 'value')}
                          >
                            Add Value
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadFollowUpTemplate(index, 'final')}
                          >
                            Final Check-in
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Subject Line */}
                    <div className="space-y-2">
                      <Label htmlFor={`subject-${index}`}>Subject Line *</Label>
                      <Input
                        id={`subject-${index}`}
                        placeholder={index === 0 ? "Enter an engaging subject line..." : "Follow-up subject..."}
                        value={draft.subject}
                        onChange={(e) => updateDraft(index, 'subject', e.target.value)}
                        disabled={isSubmitting}
                        maxLength={200}
                      />
                      <p className="text-xs text-gray-500">{draft.subject.length}/200 characters</p>
                    </div>

                    {/* Email Body */}
                    <div className="space-y-2">
                      <Label htmlFor={`body-${index}`}>Email Body *</Label>
                      <Textarea
                        id={`body-${index}`}
                        placeholder={index === 0 ? "Write your initial pitch here..." : "Write your follow-up message..."}
                        value={draft.body}
                        onChange={(e) => updateDraft(index, 'body', e.target.value)}
                        disabled={isSubmitting}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
          )}

          {/* Sequence Summary - Only show if there are follow-ups and in manual mode */}
          {(!isFreePlan || creationMode === 'manual') && pitchDrafts.length > 1 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Sequence Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pitchDrafts.map((draft, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-20 font-medium">
                        {index === 0 ? 'Day 0:' : `Day ${draft.delay_days}:`}
                      </div>
                      <div className="flex-1">
                        {index === 0 ? 'Initial pitch sent' : `Follow-up ${index} sent`}
                        {draft.subject && (
                          <span className="text-xs text-gray-600 ml-2">"{draft.subject.substring(0, 50)}..."</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  <strong>Note:</strong> Follow-ups will only be sent if there's no reply to the previous message.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateSequence}
            disabled={isSubmitting || (isFreePlan && creationMode === 'template' ? !selectedTemplateId : pitchDrafts.some(d => !d.subject.trim() || !d.body.trim()))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Sequence...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isFreePlan && creationMode === 'template' 
                  ? 'Create Pitch from Template' 
                  : pitchDrafts.length === 1 
                    ? 'Save Pitch' 
                    : `Save Pitch Sequence (${pitchDrafts.length} Pitches)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}