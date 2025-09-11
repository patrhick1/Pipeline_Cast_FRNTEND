import * as React from "react"
import { cn } from "@/lib/utils"

export interface AutoTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  minRows?: number;
}

const AutoTextarea = React.forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  ({ className, value, onChange, maxRows = 10, minRows = 2, style, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;
        if (ref) {
          if (typeof ref === 'function') {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      },
      [ref]
    );

    // Calculate line height (approximate)
    const lineHeight = 24; // Approximate line height in pixels
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;

    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate new height
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
        
        // Set the new height
        textarea.style.height = `${newHeight}px`;
      }
    }, [value, minHeight, maxHeight]);

    return (
      <textarea
        ref={combinedRef}
        value={value}
        onChange={onChange}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none overflow-y-auto transition-all duration-150",
          className
        )}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          ...style
        }}
        rows={minRows}
        {...props}
      />
    )
  }
)
AutoTextarea.displayName = "AutoTextarea"

export { AutoTextarea }