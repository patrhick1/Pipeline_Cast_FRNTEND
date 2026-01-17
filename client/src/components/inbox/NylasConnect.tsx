import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';
import type { NylasAuthStatus } from '@/types/inbox';
import { useToast } from '@/hooks/use-toast';

interface NylasConnectProps {
  status?: NylasAuthStatus | null;
}

export default function NylasConnect({ status }: NylasConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Initialize Nylas connection
  const connectNylasMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/inbox/nylas/connect');
      if (!res.ok) throw new Error('Failed to initialize Nylas connection');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.oauth_url) {
        // Redirect to Nylas OAuth flow
        window.location.href = data.oauth_url;
      } else if (data.auth_url) {
        // Fallback for backward compatibility
        window.location.href = data.auth_url;
      }
    },
    onError: () => {
      toast({
        title: 'Connection failed',
        description: 'Failed to connect to email service. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  });

  // Disconnect Nylas
  const disconnectNylasMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/inbox/nylas/disconnect');
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Disconnected',
        description: 'Your email account has been disconnected.',
      });
      queryClient.invalidateQueries({ queryKey: ['/inbox/nylas-status'] });
    }
  });

  // Resync emails
  const resyncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/inbox/sync');
      if (!res.ok) throw new Error('Failed to sync');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sync started',
        description: 'Your emails are being synced.',
      });
      queryClient.invalidateQueries({ queryKey: ['/inbox/nylas-status'] });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connectNylasMutation.mutate();
  };

  if (status?.connected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Email Connected</CardTitle>
                  <CardDescription>
                    Connected to {status.email} via {status.provider}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resyncMutation.mutate()}
                  disabled={resyncMutation.isPending || status.sync_status === 'syncing'}
                >
                  {status.sync_status === 'syncing' || resyncMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resync
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectNylasMutation.mutate()}
                  disabled={disconnectNylasMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </CardHeader>
          {status.error_message && (
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sync Error</AlertTitle>
                <AlertDescription>{status.error_message}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Main connection card */}
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Email</CardTitle>
          <CardDescription className="text-base mt-2">
            Connect your email account to manage all your podcast outreach from one place
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 rounded-lg h-fit">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Smart Inbox</p>
                <p className="text-xs text-gray-600">
                  AI-powered email classification and smart replies
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-green-100 rounded-lg h-fit">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Unified Outreach</p>
                <p className="text-xs text-gray-600">
                  Send pitches and track responses in one place
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-teal-100 rounded-lg h-fit">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Secure & Private</p>
                <p className="text-xs text-gray-600">
                  OAuth 2.0 authentication with industry-standard security
                </p>
              </div>
            </div>
          </div>

          {/* Connection button */}
          <div className="pt-4">
            <Button 
              size="lg"
              onClick={handleConnect}
              disabled={isConnecting || connectNylasMutation.isPending}
              className="min-w-[200px]"
            >
              {isConnecting || connectNylasMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Email Account
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              Supports Gmail, Outlook, and other major email providers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-base">Your Privacy Matters</CardTitle>
              <CardDescription className="text-sm">
                We use OAuth 2.0 for secure authentication. We never store your email password, 
                and you can revoke access at any time from your email provider's security settings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Help section */}
      <div className="text-center text-sm text-gray-600">
        <p>
          Having trouble connecting?{' '}
          <Button variant="link" className="p-0 h-auto text-sm">
            View troubleshooting guide
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </p>
      </div>
    </div>
  );
}