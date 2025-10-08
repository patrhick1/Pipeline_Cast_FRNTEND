/**
 * Utility functions for handling HTML content in text
 */

/**
 * Detects if a string contains HTML tags
 */
export function containsHtml(text: string | null | undefined): boolean {
  if (!text) return false;

  // Check for common HTML tags
  const htmlPattern = /<\/?[a-z][\s\S]*>/i;
  return htmlPattern.test(text);
}

/**
 * Strips HTML tags from a string, leaving only plain text
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Create a temporary div element to parse HTML
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Basic HTML sanitization - removes dangerous tags and attributes
 * For production, consider using DOMPurify library for more robust sanitization
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol from href and src
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

  return sanitized;
}
