import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize null to undefined for TypeScript strict null checks
 * Useful when passing nullable database values to components expecting undefined
 */
export const nn = <T,>(v: T | null | undefined): T | undefined => v ?? undefined
