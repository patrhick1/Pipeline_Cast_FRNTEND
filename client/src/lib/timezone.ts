/**
 * Timezone utility functions for converting between UTC and user's local timezone
 */

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