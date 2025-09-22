import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Mail, AlertCircle } from 'lucide-react';
import { SendingAccount } from '@/services/adminSendingAccounts';

interface SendingAccountsTableProps {
  accounts: SendingAccount[];
  onToggleStatus: (account: SendingAccount) => void;
  onDelete: (accountId: string) => void;
}

export function SendingAccountsTable({
  accounts,
  onToggleStatus,
  onDelete
}: SendingAccountsTableProps) {
  const getUsageStatus = (account: SendingAccount) => {
    const usagePercentage = (account.sends_today / account.daily_send_limit) * 100;

    if (usagePercentage >= 90) {
      return { variant: 'destructive' as const, label: 'Near Limit' };
    } else if (usagePercentage >= 70) {
      return { variant: 'warning' as const, label: 'High Usage' };
    } else if (usagePercentage >= 50) {
      return { variant: 'default' as const, label: 'Moderate' };
    } else {
      return { variant: 'secondary' as const, label: 'Low Usage' };
    }
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email Address</TableHead>
            <TableHead>Sending Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usage Today</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const usagePercentage = (account.sends_today / account.daily_send_limit) * 100;
            const usageStatus = getUsageStatus(account);

            return (
              <TableRow key={account.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {account.email}
                  </div>
                </TableCell>

                <TableCell>{account.sending_name}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={account.is_active}
                      onCheckedChange={() => onToggleStatus(account)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {account.sends_today} / {account.daily_send_limit}
                      </span>
                      {usagePercentage >= 90 && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <Progress
                      value={usagePercentage}
                      className="h-2"
                    />
                    <Badge variant={usageStatus.variant} className="text-xs">
                      {usageStatus.label}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  {account.last_used_at ? (
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(account.last_used_at), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Never used</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onToggleStatus(account)}
                      >
                        {account.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDelete(account.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}