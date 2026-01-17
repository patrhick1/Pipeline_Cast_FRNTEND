import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { SendingAccountStats } from '@/services/adminSendingAccounts';

interface SendingAccountsStatsProps {
  stats: SendingAccountStats;
}

export function SendingAccountsStats({ stats }: SendingAccountsStatsProps) {
  // Handle null or undefined stats
  const activeAccounts = stats?.active_accounts ?? 0;
  const totalSendsToday = stats?.total_sends_today ?? 0;
  const totalDailyCapacity = stats?.total_daily_capacity ?? 0;
  const accountsNearLimit = stats?.accounts_near_limit ?? 0;

  const usagePercentage = totalDailyCapacity > 0
    ? (totalSendsToday / totalDailyCapacity) * 100
    : 0;

  const statsCards = [
    {
      title: 'Active Accounts',
      value: activeAccounts.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Today\'s Usage',
      value: `${totalSendsToday} / ${totalDailyCapacity}`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      showProgress: true,
      progress: usagePercentage
    },
    {
      title: 'Total Capacity',
      value: totalDailyCapacity.toLocaleString(),
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Near Limit',
      value: accountsNearLimit.toString(),
      icon: AlertTriangle,
      color: accountsNearLimit > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: accountsNearLimit > 0 ? 'bg-orange-100' : 'bg-gray-100',
      warning: accountsNearLimit > 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={stat.warning ? 'border-orange-200' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.showProgress && (
                <div className="mt-3 space-y-1">
                  <Progress value={stat.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {usagePercentage.toFixed(1)}% of daily capacity used
                  </p>
                </div>
              )}
              {stat.warning && (
                <p className="text-xs text-orange-600 mt-2">
                  Accounts approaching daily send limit
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}