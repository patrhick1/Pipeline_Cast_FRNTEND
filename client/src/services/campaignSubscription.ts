import { apiRequest } from '@/lib/queryClient';

export interface CampaignWithSubscription {
  campaign_id: string;
  campaign_name: string;
  person_id: number;
  client_email?: string;
  client_name?: string;
  subscription_plan?: 'free' | 'paid_basic' | 'paid_premium';
}

export async function getCampaignWithSubscription(campaignId: string): Promise<CampaignWithSubscription> {
  try {
    // First get the campaign data
    const campaignResponse = await apiRequest('GET', `/campaigns/${campaignId}`);
    if (!campaignResponse.ok) {
      throw new Error('Failed to fetch campaign');
    }
    const campaign = await campaignResponse.json();

    // Then get the client's subscription data
    const subscriptionResponse = await apiRequest('GET', `/billing/client-subscription/${campaign.person_id}`);

    let subscriptionPlan: 'free' | 'paid_basic' | 'paid_premium' = 'free';

    if (subscriptionResponse.ok) {
      const subscription = await subscriptionResponse.json();
      subscriptionPlan = subscription.plan_type || 'free';
    }

    return {
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      person_id: campaign.person_id,
      client_email: campaign.client_email,
      client_name: campaign.client_name,
      subscription_plan: subscriptionPlan
    };
  } catch (error) {
    console.error('Error fetching campaign subscription:', error);
    throw error;
  }
}

export async function getCampaignsWithSubscriptions(): Promise<CampaignWithSubscription[]> {
  try {
    const response = await apiRequest('GET', '/campaigns/with-subscriptions');
    if (!response.ok) {
      // Fallback to regular campaigns endpoint if enhanced endpoint doesn't exist
      const campaignsResponse = await apiRequest('GET', '/campaigns');
      if (!campaignsResponse.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const campaigns = await campaignsResponse.json();

      // For now, return campaigns without subscription data
      // The backend should ideally provide this data
      return campaigns.map((c: any) => ({
        ...c,
        subscription_plan: 'free' // Default to free if not available
      }));
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching campaigns with subscriptions:', error);
    throw error;
  }
}