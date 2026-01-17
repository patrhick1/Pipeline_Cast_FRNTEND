import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { mockChatAPI, shouldUseMockAPI } from '@/mocks/chatApi';

interface Message {
  id?: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  extracted_data?: any;
  quickReplies?: string[];
}

interface ExtractedData {
  keywords?: {
    explicit: string[];
    implicit: string[];
    contextual: string[];
  };
  entities?: {
    companies: string[];
    roles: string[];
  };
}

interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  progress: number;
  phase: string;
  extractedData: any;
}

export function useConversation(campaignId: string, isOnboarding: boolean = false) {
  const { toast } = useToast();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('introduction');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  const [keywordsCount, setKeywordsCount] = useState(0);
  const [isConversationComplete, setIsConversationComplete] = useState(false);

  // Check for completed conversations first (only in onboarding mode)
  const { data: completedConversation, isLoading: isCheckingCompleted } = useQuery({
    queryKey: ['completed-conversation', campaignId],
    queryFn: async () => {
      if (!isOnboarding) return null;
      
      console.log('Checking for completed conversation for campaign:', campaignId);
      try {
        const response = await apiRequest('GET', `/campaigns/${campaignId}/chatbot/latest-completed`);
        console.log('Completed conversation response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No completed conversation found');
            return null;
          }
          console.error('Failed to fetch completed conversation:', response.status);
          return null;
        }
        
        const data = await response.json();
        console.log('Completed conversation found:', data);
        return data;
      } catch (error) {
        console.error('Error fetching completed conversation:', error);
        return null;
      }
    },
    retry: 1,
    enabled: !!campaignId && isOnboarding,
  });

  // Check for latest resumable conversation
  const { data: latestConversation, isLoading: isCheckingLatest } = useQuery({
    queryKey: ['latest-conversation', campaignId],
    queryFn: async () => {
      console.log('Checking for latest conversation for campaign:', campaignId);
      try {
        const response = await apiRequest('GET', `/campaigns/${campaignId}/chatbot/latest`);
        console.log('Latest conversation response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No resumable conversation found');
            return null;
          }
          console.error('Failed to fetch latest conversation:', response.status);
          return null;
        }
        
        const data = await response.json();
        console.log('Latest conversation found:', data);
        return data;
      } catch (error) {
        console.error('Error fetching latest conversation:', error);
        return null;
      }
    },
    retry: 1,
    enabled: !!campaignId,
  });

  // Initialize with completed or resumable conversation based on mode
  useEffect(() => {
    // For onboarding, check completed conversations first
    if (isOnboarding && isCheckingCompleted) {
      console.log('Still checking for completed conversation...');
      return;
    }
    
    if (isOnboarding && completedConversation?.found) {
      console.log('Found completed conversation in onboarding:', completedConversation);
      setIsConversationComplete(true);
      setConnectionStatus('connected');
      // Don't try to start or resume, just mark as complete
      return;
    }
    
    // If not onboarding or no completed conversation found, check for resumable
    if (isCheckingLatest) {
      console.log('Still checking for latest conversation...');
      return;
    }
    
    if (latestConversation) {
      console.log('Found resumable conversation:', latestConversation);
      // Check if conversation is already complete
      if (latestConversation.is_complete) {
        console.log('Latest conversation is already complete, not resuming');
        setIsConversationComplete(true);
        setConnectionStatus('connected');
        // Don't try to resume a completed conversation
        return;
      }
      // Automatically resume the latest conversation
      resumeConversation.mutate(latestConversation.conversation_id);
    } else {
      console.log('No resumable conversation found, ready to start new');
      // No existing conversations
      setConnectionStatus('connected');
    }
  }, [latestConversation, isCheckingLatest, completedConversation, isCheckingCompleted, isOnboarding]);

  // Start new conversation
  const startConversation = useMutation({
    mutationFn: async () => {
      // Use mock API if configured
      if (shouldUseMockAPI()) {
        return mockChatAPI.startConversation(campaignId);
      }
      
      const response = await apiRequest('POST', `/campaigns/${campaignId}/chatbot/start`, {});
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setConversationId(data.conversation_id);
      setConnectionStatus('connected');
      
      // Add initial bot message
      const welcomeMessage: Message = {
        id: `bot-${Date.now()}`,
        text: data.initial_message || "Hi! I'm here to help you create your podcast guest profile for PipelineCast. Don't worry about getting everything perfect - you'll be able to edit your media kit after I generate it for you. Let's start with your name - what should I call you?",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    },
    onError: () => {
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Unable to start conversation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      if (!conversationId) throw new Error('No active conversation');
      
      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Use mock API if configured
      if (shouldUseMockAPI()) {
        return mockChatAPI.sendMessage(conversationId, text);
      }
      
      // Send to backend
      const response = await apiRequest('POST', `/campaigns/${campaignId}/chatbot/message`, {
        conversation_id: conversationId,
        message: text
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Conversation not found - likely completed
          const errorData = await response.json().catch(() => ({ detail: 'Conversation not found' }));
          throw new Error(`404: ${errorData.detail || 'Conversation not found'}`);
        }
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Add bot response
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: data.bot_message,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: data.quick_replies
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update progress and phase
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      if (data.phase) {
        setPhase(data.phase);
      }
      
      // Check if the conversation is ready for completion
      if (data.ready_for_completion === true) {
        console.log('Backend indicates conversation is ready for completion');
        // Return this flag so the component can handle it
        data._readyForCompletion = true;
      }
      
      // Track keywords and extracted data
      if (data.keywords_found) {
        setKeywordsCount(data.keywords_found);
      }
      if (data.extracted_data) {
        console.log('Extracted data:', data.extracted_data);
      }
      
      // Auto-save progress
      localStorage.setItem(`chat-progress-${campaignId}`, JSON.stringify({
        conversationId,
        progress: data.progress || progress,
        phase: data.phase || phase,
        lastSaved: new Date().toISOString()
      }));
      
      // Check if auto-save needed (every 10 messages or 5 minutes)
      const shouldAutoSave = 
        messages.length % 10 === 9 || 
        Date.now() - lastSaveTime > 5 * 60 * 1000;
        
      if (shouldAutoSave) {
        autoSaveConversation();
      }
      
      // Return the data so it can be used in the component (including ready_for_completion flag)
      return data;
    },
    onError: (error: any) => {
      // Don't show toast for 404 errors - handled in component
      if (error?.message?.includes('404')) {
        return;
      }
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Resume conversation
  const resumeConversation = useMutation({
    mutationFn: async (conversationId?: string) => {
      console.log('Attempting to resume conversation...');
      
      // Use the new simplified resume endpoint
      const body = conversationId ? { conversation_id: conversationId } : {};
      
      const response = await apiRequest('POST', `/campaigns/${campaignId}/chatbot/resume`, body);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to resume conversation:', response.status, errorText);
        
        // Check if error is due to conversation being complete
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail?.includes('already complete') || errorData.detail?.includes('has been completed')) {
            throw new Error('CONVERSATION_ALREADY_COMPLETE');
          }
        } catch (e: any) {
          // If not the specific error, throw generic error
          if (e.message !== 'CONVERSATION_ALREADY_COMPLETE') {
            throw new Error('Failed to resume conversation');
          }
          throw e;
        }
        
        throw new Error('Failed to resume conversation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        console.log('Conversation resumed successfully:', data);
        
        // Check if conversation is marked as complete
        if (data.is_complete) {
          console.log('Conversation is marked as complete');
          setIsConversationComplete(true);
          setConnectionStatus('connected');
          // Don't load messages for a completed conversation
          return;
        }
        
        setConversationId(data.conversation_id);
        
        // Messages are already in the correct format from backend
        const messages = data.messages || [];
        
        // Convert backend message format to frontend format
        const formattedMessages = messages.map((msg: any, index: number) => ({
          id: `msg-${index}-${data.conversation_id}`,
          text: msg.content,
          sender: msg.type === 'user' ? 'user' : 'bot',
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(formattedMessages);
        setProgress(data.progress || 0);
        setPhase(data.phase || 'introduction');
        setConnectionStatus('connected');
        
        // Update keywords count if available
        if (data.extracted_data?.keywords) {
          const totalKeywords = 
            (data.extracted_data.keywords.explicit?.length || 0) +
            (data.extracted_data.keywords.implicit?.length || 0) +
            (data.extracted_data.keywords.contextual?.length || 0);
          setKeywordsCount(totalKeywords);
        }
        
        // Show appropriate toast based on status
        if (data.already_active) {
          toast({
            title: "Continuing conversation",
            description: `${data.message_count} messages loaded`,
          });
        } else {
          toast({
            title: "Conversation resumed",
            description: "Welcome back! Let's continue where we left off.",
          });
        }
        
        console.log(`Loaded ${formattedMessages.length} messages, progress: ${data.progress}%`);
      }
    },
    onError: (error: Error) => {
      console.error('Failed to resume conversation:', error);
      
      // Handle specific error for completed conversations
      if (error.message === 'CONVERSATION_ALREADY_COMPLETE') {
        console.log('Conversation is already complete, cannot resume');
        setIsConversationComplete(true);
        setConnectionStatus('connected');
        // Don't show error toast for completed conversations
        return;
      }
      
      setConnectionStatus('connected'); // Still set to connected to allow new conversation
      toast({
        title: "Resume Failed",
        description: "Could not resume previous conversation. Starting new one.",
        variant: "destructive"
      });
    }
  });

  // Complete conversation
  const completeConversation = useMutation({
    mutationFn: async () => {
      if (!conversationId) throw new Error('No active conversation');
      
      const response = await apiRequest('POST', `/campaigns/${campaignId}/chatbot/complete`, {
        conversation_id: conversationId
      });
      
      if (!response.ok) throw new Error('Failed to complete conversation');
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Complete!",
        description: `Successfully extracted ${data.keywords_extracted} keywords and generated your media kit.`,
      });
      
      // Clear local storage
      localStorage.removeItem(`chat-progress-${campaignId}`);
    }
  });

  // Pause conversation
  const pauseConversation = useMutation({
    mutationFn: async () => {
      if (!conversationId) throw new Error('No active conversation');
      
      console.log('Pausing conversation:', conversationId);
      const response = await apiRequest('POST', `/campaigns/${campaignId}/chatbot/pause?conversation_id=${conversationId}`);
      
      if (!response.ok) throw new Error('Failed to pause conversation');
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Conversation paused:', data);
      
      // Save current state to localStorage
      localStorage.setItem(`chat-paused-${campaignId}`, JSON.stringify({
        conversationId,
        pausedAt: new Date().toISOString(),
        messageCount: messages.length,
        progress
      }));
      
      toast({
        title: "Conversation Paused",
        description: `${messages.length} messages saved. You can resume anytime.`,
      });
    }
  });

  // Get conversation summary
  const getSummary = async () => {
    if (!conversationId) return null;
    
    try {
      const response = await apiRequest('GET', `/campaigns/${campaignId}/chatbot/summary?conversation_id=${conversationId}`);
      if (!response.ok) throw new Error('Failed to get summary');
      
      return response.json();
    } catch (error) {
      console.error('Failed to get summary:', error);
      return null;
    }
  };

  // Restart conversation
  const restartConversation = useMutation({
    mutationFn: async () => {
      console.log('Restarting conversation for campaign:', campaignId);
      
      const response = await apiRequest('POST', `/campaigns/${campaignId}/chatbot/restart`, {});
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to restart conversation:', response.status, errorText);
        throw new Error('Failed to restart conversation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Conversation restarted successfully:', data);
      
      // Clear current state
      setConversationId(data.conversation_id);
      setIsConversationComplete(false);
      setProgress(0);
      setPhase('introduction');
      setKeywordsCount(0);
      
      // Set new initial message
      const welcomeMessage: Message = {
        id: `bot-${Date.now()}`,
        text: data.initial_message || "Hi! I'm here to help you create your podcast guest profile for PipelineCast. Don't worry about getting everything perfect - you'll be able to edit your media kit after I generate it for you. Let's start with your name - what should I call you?",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
      // Clear any saved state
      localStorage.removeItem(`chat-progress-${campaignId}`);
      localStorage.removeItem(`chat-paused-${campaignId}`);
      
      toast({
        title: "New Conversation Started",
        description: "Let's start fresh! Your previous responses have been saved.",
      });
    },
    onError: (error) => {
      console.error('Failed to restart conversation:', error);
      toast({
        title: "Restart Failed",
        description: "Unable to restart the conversation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Auto-save conversation
  const autoSaveConversation = () => {
    setLastSaveTime(Date.now());
    // The actual save happens through the backend's auto-save mechanism
    console.log('Auto-save triggered');
  };

  return {
    conversationId,
    messages,
    progress,
    phase,
    keywordsCount,
    startConversation,
    sendMessage,
    resumeConversation,
    completeConversation,
    pauseConversation,
    restartConversation,
    getSummary,
    isLoading: sendMessage.isPending || startConversation.isPending || completeConversation.isPending || pauseConversation.isPending || restartConversation.isPending,
    connectionStatus,
    isConversationComplete
  };
}