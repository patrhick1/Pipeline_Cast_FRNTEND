/**
 * Timezone utility functions for converting between UTC and user's local timezone
 *
 * This module provides comprehensive DateTime handling with timezone conversion
 * for the Placements API which uses ISO 8601 DateTime strings (YYYY-MM-DDTHH:mm:ss.sssZ)
 */

import { format, parseISO, formatISO, isValid, addDays, differenceInDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Get the user's current timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get the user's timezone offset in minutes from UTC
 */
export const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Convert a UTC date string from the backend to user's local timezone
 * @param utcDate - ISO date string in UTC from backend
 * @returns Date object in user's local timezone
 */
export const utcToLocal = (utcDate: string | Date | null | undefined): Date | null => {
  if (!utcDate) return null;
  
  // If it's already a Date object, ensure it's treated as UTC
  if (utcDate instanceof Date) {
    return new Date(utcDate.toISOString());
  }
  
  // Handle ISO string from backend (assumed to be in UTC)
  const date = new Date(utcDate);
  if (isNaN(date.getTime())) return null;
  
  return date;
};

/**
 * Convert a local date to UTC string for sending to backend
 * @param localDate - Date in user's local timezone
 * @returns ISO string in UTC for backend
 */
export const localToUTC = (localDate: Date | string | null | undefined): string | null => {
  if (!localDate) return null;
  
  const date = localDate instanceof Date ? localDate : new Date(localDate);
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString();
};

/**
 * Format a UTC date string from backend to display in user's local timezone
 * @param utcDate - ISO date string in UTC from backend
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in user's local timezone
 */
export const formatUTCToLocal = (
  utcDate: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  return localDate.toLocaleString(undefined, options || defaultOptions);
};

/**
 * Format a UTC date for display without time
 * @param utcDate - ISO date string in UTC from backend
 * @returns Formatted date string without time in user's local timezone
 */
export const formatUTCDateOnly = (utcDate: string | Date | null | undefined): string => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return '';
  
  return localDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a UTC date for display with time only
 * @param utcDate - ISO date string in UTC from backend
 * @returns Formatted time string in user's local timezone
 */
export const formatUTCTimeOnly = (utcDate: string | Date | null | undefined): string => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return '';
  
  return localDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get relative time from a UTC date (e.g., "2 hours ago", "in 3 days")
 * @param utcDate - ISO date string in UTC from backend
 * @returns Relative time string
 */
export const getRelativeTime = (utcDate: string | Date | null | undefined): string => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - localDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (Math.abs(diffSecs) < 60) {
    return diffSecs > 0 ? `${diffSecs} seconds ago` : `in ${Math.abs(diffSecs)} seconds`;
  } else if (Math.abs(diffMins) < 60) {
    return diffMins > 0 ? `${diffMins} minutes ago` : `in ${Math.abs(diffMins)} minutes`;
  } else if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `${diffHours} hours ago` : `in ${Math.abs(diffHours)} hours`;
  } else if (Math.abs(diffDays) < 30) {
    return diffDays > 0 ? `${diffDays} days ago` : `in ${Math.abs(diffDays)} days`;
  } else {
    return formatUTCDateOnly(utcDate);
  }
};

/**
 * Check if a UTC date is in the past
 * @param utcDate - ISO date string in UTC from backend
 * @returns true if the date is in the past
 */
export const isPastDate = (utcDate: string | Date | null | undefined): boolean => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return false;

  return localDate < new Date();
};

/**
 * Convert a UTC time string (HH:MM) to local time string
 * @param utcTime - Time string in HH:MM format (24-hour) in UTC
 * @returns Time string in HH:MM format in local timezone
 */
export const utcTimeToLocal = (utcTime: string | null | undefined): string => {
  if (!utcTime) return '09:00'; // Default fallback

  // Create a date object with the UTC time today
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDate = new Date();
  utcDate.setUTCHours(hours, minutes, 0, 0);

  // Format to local time
  return utcDate.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Convert a local time string (HH:MM) to UTC time string
 * @param localTime - Time string in HH:MM format (24-hour) in local timezone
 * @returns Time string in HH:MM format in UTC
 */
export const localTimeToUTC = (localTime: string | null | undefined): string => {
  if (!localTime) return '09:00'; // Default fallback

  // Create a date object with the local time today
  const [hours, minutes] = localTime.split(':').map(Number);
  const localDate = new Date();
  localDate.setHours(hours, minutes, 0, 0);

  // Format to UTC time
  const utcHours = localDate.getUTCHours().toString().padStart(2, '0');
  const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0');
  return `${utcHours}:${utcMinutes}`;
};

/**
 * Check if a UTC date is today in user's timezone
 * @param utcDate - ISO date string in UTC from backend
 * @returns true if the date is today
 */
export const isToday = (utcDate: string | Date | null | undefined): boolean => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return false;
  
  const today = new Date();
  return (
    localDate.getDate() === today.getDate() &&
    localDate.getMonth() === today.getMonth() &&
    localDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Convert form input datetime-local value to UTC for backend
 * @param datetimeLocal - Value from datetime-local input (in user's timezone)
 * @returns ISO string in UTC for backend
 */
export const datetimeLocalToUTC = (datetimeLocal: string): string | null => {
  if (!datetimeLocal) return null;
  
  // datetime-local format is "YYYY-MM-DDTHH:mm"
  // This is interpreted as local time by the Date constructor
  const localDate = new Date(datetimeLocal);
  if (isNaN(localDate.getTime())) return null;
  
  return localDate.toISOString();
};

/**
 * Convert UTC date to datetime-local input value
 * @param utcDate - ISO date string in UTC from backend
 * @returns String formatted for datetime-local input
 */
export const utcToDatetimeLocal = (utcDate: string | Date | null | undefined): string => {
  const localDate = utcToLocal(utcDate);
  if (!localDate) return '';

  // Format as "YYYY-MM-DDTHH:mm" for datetime-local input
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// ============================================================================
// NEW DateTime API Functions (for Placements API with DateTime support)
// ============================================================================

/**
 * Convert a Date object to ISO 8601 DateTime string for API submission
 * @param date - Date object to convert
 * @returns ISO 8601 string in UTC (YYYY-MM-DDTHH:mm:ss.sssZ) or null
 */
export function toAPIDateTime(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null;
  return formatISO(date); // Returns: "2025-10-06T14:30:00.000Z"
}

/**
 * Parse ISO 8601 DateTime string from API to Date object
 * @param isoString - ISO 8601 DateTime string from API
 * @returns Date object in local timezone or null
 */
export function fromAPIDateTime(isoString: string | null | undefined): Date | null {
  if (!isoString) return null;
  try {
    const date = parseISO(isoString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Format DateTime for display in user's timezone
 * @param isoString - ISO 8601 DateTime string from API
 * @param formatStr - date-fns format string (default: "PPp" = "Oct 6, 2025, 2:30 PM")
 * @returns Formatted DateTime string in user's local timezone
 */
export function formatDateTime(
  isoString: string | null | undefined,
  formatStr: string = 'PPp' // "Oct 6, 2025, 2:30 PM"
): string {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    return isValid(date) ? format(date, formatStr) : '—';
  } catch {
    return '—';
  }
}

/**
 * Format DateTime for specific timezone
 * @param isoString - ISO 8601 DateTime string from API
 * @param timeZone - IANA timezone string (e.g., "America/New_York")
 * @param formatStr - date-fns format string
 * @returns Formatted DateTime string in specified timezone
 */
export function formatDateTimeInZone(
  isoString: string | null | undefined,
  timeZone: string,
  formatStr: string = 'PPp'
): string {
  if (!isoString) return '—';
  try {
    return formatInTimeZone(parseISO(isoString), timeZone, formatStr);
  } catch {
    return '—';
  }
}

/**
 * Format DateTime with full timezone context
 * @param isoString - ISO 8601 DateTime string from API
 * @returns Formatted string like "Oct 6, 2025, 2:30 PM EDT"
 */
export function formatDateTimeWithTimezone(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return '—';

    return formatInTimeZone(
      date,
      getUserTimezone(),
      'PPp zzz' // "Oct 6, 2025, 2:30 PM EDT"
    );
  } catch {
    return '—';
  }
}

/**
 * Check if a DateTime is in the past
 * @param isoString - ISO 8601 DateTime string from API
 * @returns true if the DateTime is in the past
 */
export function isPast(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  const date = fromAPIDateTime(isoString);
  return date ? date < new Date() : false;
}

/**
 * Check if a DateTime is upcoming (within next N days)
 * @param isoString - ISO 8601 DateTime string from API
 * @param days - Number of days to check ahead (default: 7)
 * @returns true if the DateTime is between now and N days from now
 */
export function isUpcoming(isoString: string | null | undefined, days: number = 7): boolean {
  if (!isoString) return false;
  const date = fromAPIDateTime(isoString);
  if (!date) return false;

  const now = new Date();
  const future = addDays(now, days);

  return date >= now && date <= future;
}

/**
 * Get the number of days between now and a DateTime
 * @param isoString - ISO 8601 DateTime string from API
 * @returns Number of days (positive for future, negative for past)
 */
export function daysUntil(isoString: string | null | undefined): number | null {
  if (!isoString) return null;
  const date = fromAPIDateTime(isoString);
  if (!date) return null;

  return differenceInDays(date, new Date());
}

/**
 * Format DateTime relative to now (e.g., "in 3 days", "2 hours ago")
 * @param isoString - ISO 8601 DateTime string from API
 * @returns Human-readable relative time string
 */
export function formatRelativeDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '';

  const date = fromAPIDateTime(isoString);
  if (!date) return '';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSecs = Math.floor(Math.abs(diffMs) / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDaysCalc = Math.floor(diffHours / 24);

  const isPastDate = diffMs < 0;

  if (diffSecs < 60) {
    return isPastDate ? 'just now' : 'in a moment';
  } else if (diffMins < 60) {
    const unit = diffMins === 1 ? 'minute' : 'minutes';
    return isPastDate ? `${diffMins} ${unit} ago` : `in ${diffMins} ${unit}`;
  } else if (diffHours < 24) {
    const unit = diffHours === 1 ? 'hour' : 'hours';
    return isPastDate ? `${diffHours} ${unit} ago` : `in ${diffHours} ${unit}`;
  } else if (diffDaysCalc < 30) {
    const unit = diffDaysCalc === 1 ? 'day' : 'days';
    return isPastDate ? `${diffDaysCalc} ${unit} ago` : `in ${diffDaysCalc} ${unit}`;
  } else {
    return formatDateTime(isoString, 'PP'); // Fallback to date only
  }
}

/**
 * Check if a DateTime is today in user's timezone
 * @param isoString - ISO 8601 DateTime string from API
 * @returns true if the DateTime is today
 */
export function isDateTimeToday(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  const date = fromAPIDateTime(isoString);
  if (!date) return false;

  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Get a user-friendly description of when a DateTime occurs
 * @param isoString - ISO 8601 DateTime string from API
 * @returns String like "Today at 2:30 PM", "Tomorrow at 10:00 AM", or full date
 */
export function getDateTimeDescription(isoString: string | null | undefined): string {
  if (!isoString) return '';

  const date = fromAPIDateTime(isoString);
  if (!date) return '';

  const now = new Date();
  const daysDiff = differenceInDays(date, now);

  if (daysDiff === 0) {
    return `Today at ${format(date, 'p')}`;
  } else if (daysDiff === 1) {
    return `Tomorrow at ${format(date, 'p')}`;
  } else if (daysDiff === -1) {
    return `Yesterday at ${format(date, 'p')}`;
  } else if (daysDiff > 1 && daysDiff < 7) {
    return format(date, 'EEEE \'at\' p'); // "Monday at 2:30 PM"
  } else {
    return formatDateTime(isoString); // Full date and time
  }
}