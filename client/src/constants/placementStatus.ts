// client/src/constants/placementStatus.ts

import {
  Clock, MessageSquare, Eye, Calendar, PlayCircle,
  CheckCircle, ExternalLink, X, AlertCircle, Phone
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Placement status types
 */
export type PlacementStatus =
  | 'pending'
  | 'responded'
  | 'follow_up'
  | 'interested'
  | 'scheduled'
  | 'recorded'
  | 'published'
  | 'paid'
  | 'rejected'
  | 'client_rejected'
  | 'cancelled';

/**
 * Status configuration for UI display
 */
export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  dotColor: string;
}

/**
 * All available placement statuses with their UI configuration
 */
export const PLACEMENT_STATUSES = {
  PENDING: 'pending',
  RESPONDED: 'responded',
  FOLLOW_UP: 'follow_up',
  INTERESTED: 'interested',
  SCHEDULED: 'scheduled',
  RECORDED: 'recorded',
  PUBLISHED: 'published',
  PAID: 'paid',
  REJECTED: 'rejected',
  CLIENT_REJECTED: 'client_rejected',
  CANCELLED: 'cancelled',
} as const;

/**
 * Human-readable labels for each status
 */
export const STATUS_LABELS: Record<PlacementStatus, string> = {
  pending: 'Pending',
  responded: 'Responded',
  follow_up: 'Follow Up',
  interested: 'Interested',
  scheduled: 'Scheduled',
  recorded: 'Recorded',
  published: 'Published',
  paid: 'Paid',
  rejected: 'Host Declined',
  client_rejected: 'Client Rejected',
  cancelled: 'Cancelled',
};

/**
 * Tailwind color classes for each status
 */
export const STATUS_COLORS: Record<PlacementStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  responded: 'bg-blue-100 text-blue-800',
  follow_up: 'bg-yellow-100 text-yellow-800',
  interested: 'bg-green-100 text-green-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  recorded: 'bg-pink-100 text-pink-800',
  published: 'bg-teal-100 text-teal-800',
  paid: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  client_rejected: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

/**
 * Dot/badge colors for timeline visualization
 */
export const STATUS_DOT_COLORS: Record<PlacementStatus, string> = {
  pending: 'bg-gray-500',
  responded: 'bg-blue-500',
  follow_up: 'bg-yellow-500',
  interested: 'bg-green-500',
  scheduled: 'bg-indigo-500',
  recorded: 'bg-pink-500',
  published: 'bg-teal-500',
  paid: 'bg-emerald-500',
  rejected: 'bg-red-500',
  client_rejected: 'bg-orange-500',
  cancelled: 'bg-gray-500',
};

/**
 * Icons for each status
 */
export const STATUS_ICONS: Record<PlacementStatus, LucideIcon> = {
  pending: Clock,
  responded: MessageSquare,
  follow_up: Phone,
  interested: Eye,
  scheduled: Calendar,
  recorded: PlayCircle,
  published: ExternalLink,
  paid: CheckCircle,
  rejected: X,
  client_rejected: X,
  cancelled: X,
};

/**
 * Complete status configuration combining all properties
 */
export const statusConfig: Record<PlacementStatus | 'default', StatusConfig> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-500'
  },
  responded: {
    label: 'Responded',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500'
  },
  follow_up: {
    label: 'Follow Up',
    icon: Phone,
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  },
  interested: {
    label: 'Interested',
    icon: Eye,
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  scheduled: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-800',
    dotColor: 'bg-indigo-500'
  },
  recorded: {
    label: 'Recorded',
    icon: PlayCircle,
    color: 'bg-pink-100 text-pink-800',
    dotColor: 'bg-pink-500'
  },
  published: {
    label: 'Published',
    icon: ExternalLink,
    color: 'bg-teal-100 text-teal-800',
    dotColor: 'bg-teal-500'
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800',
    dotColor: 'bg-emerald-500'
  },
  rejected: {
    label: 'Host Declined',
    icon: X,
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  },
  client_rejected: {
    label: 'Client Rejected',
    icon: X,
    color: 'bg-orange-100 text-orange-800',
    dotColor: 'bg-orange-500'
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-500'
  },
  default: {
    label: 'Unknown',
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-400'
  },
};

/**
 * Typical status progression (main flow)
 */
export const STATUS_PROGRESSION: PlacementStatus[] = [
  'responded',
  'follow_up',
  'interested',
  'scheduled',
  'recorded',
  'published',
  'paid',
];

/**
 * Terminal/alternative statuses (exit states)
 */
export const TERMINAL_STATUSES: PlacementStatus[] = [
  'rejected',
  'client_rejected',
  'cancelled',
  'paid',
];

/**
 * Statuses that indicate active progress
 */
export const ACTIVE_STATUSES: PlacementStatus[] = [
  'responded',
  'follow_up',
  'interested',
  'scheduled',
  'recorded',
  'published',
];

/**
 * Statuses that are considered successful outcomes
 */
export const SUCCESS_STATUSES: PlacementStatus[] = [
  'recorded',
  'published',
  'paid',
];

/**
 * Get the next logical status in the progression
 */
export function getNextStatus(currentStatus: PlacementStatus): PlacementStatus | null {
  const currentIndex = STATUS_PROGRESSION.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === STATUS_PROGRESSION.length - 1) {
    return null;
  }
  return STATUS_PROGRESSION[currentIndex + 1];
}

/**
 * Get the previous status in the progression
 */
export function getPreviousStatus(currentStatus: PlacementStatus): PlacementStatus | null {
  const currentIndex = STATUS_PROGRESSION.indexOf(currentStatus);
  if (currentIndex <= 0) {
    return null;
  }
  return STATUS_PROGRESSION[currentIndex - 1];
}

/**
 * Check if a status represents a successful outcome
 */
export function isSuccessStatus(status: PlacementStatus): boolean {
  return SUCCESS_STATUSES.includes(status);
}

/**
 * Check if a status is terminal (end state)
 */
export function isTerminalStatus(status: PlacementStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Check if a status indicates active progress
 */
export function isActiveStatus(status: PlacementStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}
