import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Mail, TrendingUp, AlertCircle } from 'lucide-react';
import {
  adminSendingAccountsService,
  SendingAccount,
  SendingAccountStats
} from '@/services/adminSendingAccounts';
import { SendingAccountsTable } from '@/components/admin/SendingAccountsTable';
import { SendingAccountsStats } from '@/components/admin/SendingAccountsStats';

export default function SendingAccountsDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<SendingAccount[]>([]);
  const [stats, setStats] = useState<SendingAccountStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  useEffect(() => {
    loadData();
    handleOAuthCallback();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [accountsData, statsData] = await Promise.all([
        adminSendingAccountsService.getAllAccounts(),
        adminSendingAccountsService.getStatistics()
      ]);

      setAccounts(accountsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading sending accounts data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = () => {
    // Parse URL parameters manually from the location
    const searchParams = new URLSearchParams(window.location.search);
    const newAccount = searchParams.get('new_account');
    const error = searchParams.get('error');

    if (newAccount) {
      toast({
        title: "Success",
        description: `Successfully added new sending account: ${newAccount}`
      });
      // Clean up URL params by navigating to the clean URL
      setLocation('/admin/sending-accounts');
      loadData(); // Refresh data to show new account
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'account_exists': 'This email account has already been added.',
        'oauth_failed': 'Failed to authenticate with email provider.',
        'invalid_account': 'Invalid account configuration.'
      };

      toast({
        title: "Error",
        description: errorMessages[error] || 'Failed to add account',
        variant: "destructive"
      });
      // Clean up URL params by navigating to the clean URL
      setLocation('/admin/sending-accounts');
    }
  };

  const handleAddAccount = async () => {
    try {
      setIsAddingAccount(true);
      console.log('Initiating OAuth flow for adding new sending account...');
      const authUrl = await adminSendingAccountsService.initiateOAuthFlow();
      console.log('Received authorization URL:', authUrl);

      if (authUrl) {
        // Redirect to the OAuth authorization URL
        window.location.href = authUrl;
      } else {
        throw new Error('No authorization URL received from server');
      }
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to start account connection. Please check if the backend service is running.",
        variant: "destructive"
      });
      setIsAddingAccount(false);
    }
  };

  const handleToggleStatus = async (account: SendingAccount) => {
    try {
      const updatedAccount = await adminSendingAccountsService.toggleAccountStatus(
        account.id,
        !account.is_active
      );

      setAccounts(prev => prev.map(acc =>
        acc.id === account.id ? updatedAccount : acc
      ));

      // Reload stats as active count may have changed
      const newStats = await adminSendingAccountsService.getStatistics();
      setStats(newStats);
    } catch (error) {
      console.error('Error toggling account status:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      await adminSendingAccountsService.deleteAccount(accountId);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));

      // Reload stats as counts have changed
      const newStats = await adminSendingAccountsService.getStatistics();
      setStats(newStats);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sending Accounts Dashboard</h1>
        <p className="text-muted-foreground">
          Manage shared email accounts for sending pitches on behalf of premium clients
        </p>
      </div>

      {/* Statistics Header */}
      {stats ? (
        <SendingAccountsStats stats={stats} />
      ) : (
        <SendingAccountsStats stats={{
          active_accounts: 0,
          total_sends_today: 0,
          total_daily_capacity: 0,
          accounts_near_limit: 0
        }} />
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Accounts</h2>
        <Button
          onClick={handleAddAccount}
          disabled={isAddingAccount}
        >
          {isAddingAccount ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add New Account
            </>
          )}
        </Button>
      </div>

      {/* Accounts Table */}
      <SendingAccountsTable
        accounts={accounts}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteAccount}
      />

      {accounts.length === 0 && (
        <Card className="p-12 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Sending Accounts</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first shared sending account
          </p>
          <Button onClick={handleAddAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Account
          </Button>
        </Card>
      )}
    </div>
  );
}