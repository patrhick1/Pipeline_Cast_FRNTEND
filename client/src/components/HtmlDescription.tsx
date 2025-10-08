import { containsHtml, sanitizeHtml } from '@/lib/htmlUtils';
import { cn } from '@/lib/utils';

interface HtmlDescriptionProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * Component to safely render text that may contain HTML
 * - Detects if content has HTML tags
 * - If HTML: sanitizes and renders with proper formatting
 * - If plain text: renders normally
 */
export function HtmlDescription({ content, className }: HtmlDescriptionProps) {
  if (!content) return null;

  const hasHtml = containsHtml(content);

  if (hasHtml) {
    const sanitized = sanitizeHtml(content);

    return (
      <div
        className={cn('text-gray-600 prose prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  // Plain text - render normally
  return <p className={cn('text-gray-600', className)}>{content}</p>;
}
