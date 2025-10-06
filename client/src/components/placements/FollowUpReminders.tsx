// client/src/components/placements/FollowUpReminders.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import { useFollowUpReminders } from "@/hooks/useFollowUpReminders";
import { formatRelativeDateTime, getDateTimeDescription } from "@/lib/timezone";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface FollowUpRemindersProps {
  /** Optional filter to show only overdue or upcoming */
  filter?: 'overdue' | 'upcoming' | 'all';
  /** Maximum number of items to display */
  maxItems?: number;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Compact mode for dashboard widgets */
  compact?: boolean;
}

/**
 * FollowUpReminders component
 * Displays placements that need follow-up attention
 */
export const FollowUpReminders: React.FC<FollowUpRemindersProps> = ({
  filter = 'all',
  maxItems = 5,
  showRefresh = true,
  compact = false,
}) => {
  const { reminders, isLoading, error, refetch } = useFollowUpReminders();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Follow-up Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Follow-up Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Failed to load follow-up reminders</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine which items to show based on filter
  let itemsToDisplay = [...reminders.overdue, ...reminders.upcoming];
  if (filter === 'overdue') {
    itemsToDisplay = reminders.overdue;
  } else if (filter === 'upcoming') {
    itemsToDisplay = reminders.upcoming;
  }

  // Limit number of items
  const displayedItems = itemsToDisplay.slice(0, maxItems);
  const hasMore = itemsToDisplay.length > maxItems;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Follow-up Reminders
            {reminders.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {reminders.total}
              </Badge>
            )}
          </CardTitle>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!compact && reminders.total > 0 && (
          <div className="flex gap-3 mt-2">
            {reminders.overdueCount > 0 && (
              <div className="text-sm">
                <span className="font-semibold text-red-600">{reminders.overdueCount}</span>
                <span className="text-gray-600 ml-1">overdue</span>
              </div>
            )}
            {reminders.upcomingCount > 0 && (
              <div className="text-sm">
                <span className="font-semibold text-blue-600">{reminders.upcomingCount}</span>
                <span className="text-gray-600 ml-1">upcoming</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {reminders.total === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No follow-ups scheduled</p>
            <p className="text-xs text-gray-500 mt-1">
              Follow-up dates will appear here when set
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedItems.map((placement) => {
              const isOverdue = reminders.overdue.includes(placement);

              return (
                <div
                  key={placement.placement_id}
                  className={`p-3 rounded-lg border ${
                    isOverdue
                      ? 'border-red-200 bg-red-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {placement.media_name || `Media ${placement.media_id}`}
                      </h4>
                      {placement.campaign_name && (
                        <p className="text-xs text-gray-600 truncate">
                          {placement.campaign_name}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                        <span className={`text-xs font-medium ${isOverdue ? 'text-red-700' : 'text-blue-700'}`}>
                          {getDateTimeDescription(placement.follow_up_date)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({formatRelativeDateTime(placement.follow_up_date)})
                        </span>
                      </div>

                      {placement.outreach_topic && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          Topic: {placement.outreach_topic}
                        </p>
                      )}
                    </div>

                    <Link href="/placements">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="text-center pt-2">
                <Link href="/placements">
                  <Button variant="link" size="sm">
                    View all {itemsToDisplay.length} follow-ups →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
