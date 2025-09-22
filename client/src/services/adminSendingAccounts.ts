import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface SendingAccount {
  id: string;
  email: string;
  sending_name: string;
  is_active: boolean;
  daily_send_limit: number;
  sends_today: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendingAccountStats {
  active_accounts: number;
  total_sends_today: number;
  total_daily_capacity: number;
  accounts_near_limit: number;
}

export interface AuthorizationResponse {
  authorization_url: string;
}

class AdminSendingAccountsService {
  private baseUrl = '/api/admin/sending-accounts';

  async getStatistics(): Promise<SendingAccountStats> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/statistics`);

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching sending account statistics:', error);
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive"
      });
      throw error;
    }
  }

  async getAllAccounts(): Promise<SendingAccount[]> {
    try {
      const response = await apiRequest('GET', this.baseUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching sending accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive"
      });
      throw error;
    }
  }

  async toggleAccountStatus(accountId: string, isActive: boolean): Promise<SendingAccount> {
    try {
      const response = await apiRequest('PATCH', `${this.baseUrl}/${accountId}`, {
        is_active: isActive
      });

      if (!response.ok) {
        throw new Error('Failed to update account status');
      }

      toast({
        title: "Success",
        description: `Account ${isActive ? 'activated' : 'deactivated'} successfully`
      });

      return response.json();
    } catch (error) {
      console.error('Error updating account status:', error);
      toast({
        title: "Error",
        description: "Failed to update account status",
        variant: "destructive"
      });
      throw error;
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      const response = await apiRequest('DELETE', `${this.baseUrl}/${accountId}`);

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast({
        title: "Success",
        description: "Account deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive"
      });
      throw error;
    }
  }

  async initiateOAuthFlow(): Promise<string> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/nylas/authorize`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to initiate OAuth flow' }));
        throw new Error(errorData.detail || 'Failed to initiate OAuth flow');
      }

      const data: AuthorizationResponse = await response.json();
      return data.authorization_url;
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start account connection",
        variant: "destructive"
      });
      throw error;
    }
  }
}

export const adminSendingAccountsService = new AdminSendingAccountsService();