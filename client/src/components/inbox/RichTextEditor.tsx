import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  Quote,
  Code,
  X,
  Check,
  Eye,
  Edit2,
  Unlink
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type your message...',
  className,
  minHeight = 'min-h-[150px]'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  // Initialize editor with value
  useEffect(() => {
    if (editorRef.current && !editorRef.current.getAttribute('data-initialized')) {
      // Only set initial content once
      if (value) {
        // Ensure line breaks are properly displayed
        editorRef.current.innerHTML = value;
      } else {
        editorRef.current.innerHTML = '';
      }
      editorRef.current.setAttribute('data-initialized', 'true');
    }
  }, []);

  // Update editor when value changes externally (e.g., smart replies)
  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.getAttribute('data-initialized') === 'true' &&
      !editorRef.current.contains(document.activeElement)
    ) {
      // Only update if editor is not focused to avoid conflicts
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== value && value !== undefined) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  // Save selection before losing focus
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setSelectedRange(range);

      // Get selected text for link dialog
      const selectedText = selection.toString();
      if (selectedText) {
        setLinkText(selectedText);
      }
    }
  };

  // Restore selection
  const restoreSelection = () => {
    if (selectedRange && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }
      editorRef.current.focus();
    }
  };

  // Apply formatting using document.execCommand
  const applyFormat = (command: string, value?: string) => {
    if (isPreviewMode) return;

    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    handleContentChange();
  };

  // Insert hyperlink
  const insertLink = () => {
    if (!linkUrl) return;

    restoreSelection();

    // If there's selected text, create a link with that text
    if (selectedRange && !selectedRange.collapsed) {
      document.execCommand('createLink', false, linkUrl);
    } else {
      // Insert new link with text
      const linkHTML = `<a href="${linkUrl}" target="_blank">${linkText || linkUrl}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    }

    handleContentChange();

    // Reset and close dialog
    setLinkUrl('');
    setLinkText('');
    setShowLinkDialog(false);
    setSelectedRange(null);
  };

  // Remove link from selection
  const removeLink = () => {
    if (isPreviewMode) return;
    applyFormat('unlink');
  };

  // Insert list
  const insertList = (ordered: boolean) => {
    if (isPreviewMode) return;
    applyFormat(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;

      // Convert div blocks to line breaks for proper multi-line support
      // Replace div with br tags but preserve the content
      html = html
        .replace(/<div><br><\/div>/g, '<br><br>') // Empty divs = empty lines
        .replace(/<div><br>/g, '<br>') // Div with just br
        .replace(/<div>/g, '<br>') // Start of div = line break
        .replace(/<\/div>/g, ''); // Remove closing divs

      // Handle Firefox which uses <br> for line breaks
      // No conversion needed for <br> tags

      // Remove the first <br> if the content starts with it (first line doesn't need br)
      if (html.startsWith('<br>')) {
        html = html.substring(4);
      }

      // If empty, just set to empty string
      onChange(html === '<br>' || html === '' ? '' : html);
    }
  };

  // Handle paste - clean up pasted content
  const handlePaste = (e: React.ClipboardEvent) => {
    if (isPreviewMode) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');

    if (text) {
      // For plain text, convert line breaks to <br>
      if (!e.clipboardData.getData('text/html')) {
        const htmlText = text.replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, htmlText);
      } else {
        // For HTML, insert as-is but it will be sanitized by the browser
        document.execCommand('insertHTML', false, text);
      }
      handleContentChange();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isPreviewMode) {
      e.preventDefault();
      return;
    }

    // Handle Enter key for line breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      // Let the browser handle Enter naturally for better line break support
      // The handleContentChange will convert it properly
      setTimeout(handleContentChange, 0);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('underline');
          break;
        case 'k':
          e.preventDefault();
          saveSelection();
          setShowLinkDialog(true);
          break;
      }
    }
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Formatting Toolbar */}
      <div className="flex items-center justify-between gap-1 p-2 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={isPreviewMode ? "ghost" : "ghost"}
            size="sm"
            onClick={() => applyFormat('bold')}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('italic')}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('underline')}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => !isPreviewMode && saveSelection()}
                disabled={isPreviewMode}
                className="h-8 w-8 p-0"
                title="Insert Link (Ctrl+K)"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Insert Link</h4>
                <div className="space-y-2">
                  <div>
                    <label htmlFor="link-text" className="text-xs text-gray-600">
                      Link Text (optional)
                    </label>
                    <Input
                      id="link-text"
                      placeholder="Enter link text"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label htmlFor="link-url" className="text-xs text-gray-600">
                      URL *
                    </label>
                    <Input
                      id="link-url"
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowLinkDialog(false);
                      setLinkUrl('');
                      setLinkText('');
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={insertLink}
                    disabled={!linkUrl}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeLink}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertList(false)}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertList(true)}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('formatBlock', 'blockquote')}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat('formatBlock', 'pre')}
            disabled={isPreviewMode}
            className="h-8 w-8 p-0"
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview Toggle */}
        <Button
          type="button"
          variant={isPreviewMode ? "default" : "ghost"}
          size="sm"
          onClick={togglePreviewMode}
          className="h-8 px-2"
          title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
        >
          {isPreviewMode ? (
            <>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!isPreviewMode}
        onInput={handleContentChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        className={cn(
          minHeight,
          'p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
          isPreviewMode ? 'bg-gray-50' : 'bg-white',
          'prose prose-sm max-w-none',
          '[&_a]:text-blue-600 [&_a]:underline',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic',
          '[&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm',
          '[&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-400',
          '[&_br]:leading-normal', // Ensure br tags create proper spacing
          '[&_div]:min-h-[1.2em]' // Ensure divs have minimum height for line spacing
        )}
        data-placeholder={placeholder}
        style={{
          minHeight: '150px',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5' // Better line spacing
        }}
      />

      {/* Help text */}
      <p className="text-xs text-gray-500">
        {isPreviewMode
          ? "Preview mode - Click Edit to make changes"
          : "Tip: Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline, Ctrl+K for links"}
      </p>
    </div>
  );
}