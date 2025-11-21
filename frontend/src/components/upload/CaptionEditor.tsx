import React, { useState, useRef, useCallback, useEffect } from 'react';
import './CaptionEditor.css';
import { ReferenceAutocomplete } from './ReferenceAutocomplete';

interface ParsedReference {
  start: number;
  end: number;
  text: string;
  title: string;
  alias?: string;
  isValid?: boolean;
}

interface CaptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onReferencesChange?: (references: ParsedReference[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  value,
  onChange,
  onReferencesChange,
  placeholder = "Write your caption here. Use [[Title]] or [[Title|Alias]] to reference other comics...",
  disabled = false,
}) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [currentReferenceStart, setCurrentReferenceStart] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Parse references from caption text
  const parseReferences = useCallback((text: string): ParsedReference[] => {
    const references: ParsedReference[] = [];
    // Match [[Title]] or [[Title|Alias]]
    const referenceRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let match;

    while ((match = referenceRegex.exec(text)) !== null) {
      const title = match[1].trim();
      const alias = match[2]?.trim();
      references.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        title,
        alias,
        // Validation will be done when we actually search for the comic
        isValid: undefined,
      });
    }

    return references;
  }, []);

  // Update parsed references when value changes
  useEffect(() => {
    const references = parseReferences(value);
    onReferencesChange?.(references);
  }, [value, parseReferences, onReferencesChange]);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check if we should show autocomplete
    const cursorPosition = e.target.selectionStart;
    checkForAutocomplete(newValue, cursorPosition);
  };

  // Check if cursor is in a position to trigger autocomplete
  const checkForAutocomplete = (text: string, cursorPosition: number) => {
    // Look for [[ before cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastOpenBrackets = textBeforeCursor.lastIndexOf('[[');
    const lastCloseBrackets = textBeforeCursor.lastIndexOf(']]');

    // If we found [[ and it's after the last ]]
    if (lastOpenBrackets !== -1 && lastOpenBrackets > lastCloseBrackets) {
      const query = textBeforeCursor.substring(lastOpenBrackets + 2);
      
      // Check if the query contains | (pipe character)
      // If it does, we're in the alias part, don't show autocomplete
      if (!query.includes('|')) {
        setSearchQuery(query);
        setCurrentReferenceStart(lastOpenBrackets);
        setShowAutocomplete(true);
        updateAutocompletePosition();
        return;
      }
    }

    // Hide autocomplete if conditions aren't met
    setShowAutocomplete(false);
    setCurrentReferenceStart(null);
  };

  // Update autocomplete position based on cursor
  const updateAutocompletePosition = () => {
    if (!textareaRef.current || !editorRef.current) return;

    const textarea = textareaRef.current;
    const editor = editorRef.current;
    
    // Get cursor coordinates
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length;
    const currentColumn = lines[lines.length - 1].length;

    // Approximate position (this is a simplification)
    const lineHeight = 24; // Approximate line height in pixels
    const charWidth = 8; // Approximate character width in pixels
    
    const top = currentLine * lineHeight;
    const left = Math.min(currentColumn * charWidth, editor.offsetWidth - 300);

    setAutocompletePosition({ top, left });
  };

  // Handle reference selection from autocomplete
  const handleSelectReference = (comicId: string, comicTitle: string, comicSlug: string) => {
    if (currentReferenceStart === null || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBefore = value.substring(0, currentReferenceStart);
    const textAfter = value.substring(cursorPosition);

    // Insert the reference
    const newValue = `${textBefore}[[${comicTitle}]]${textAfter}`;
    onChange(newValue);

    // Move cursor after the inserted reference
    const newCursorPosition = currentReferenceStart + `[[${comicTitle}]]`.length;
    
    // Hide autocomplete
    setShowAutocomplete(false);
    setCurrentReferenceStart(null);

    // Set cursor position after React updates
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If autocomplete is showing, let it handle arrow keys and enter
    if (showAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
      // These will be handled by the ReferenceAutocomplete component
      return;
    }

    // Handle Tab key for indentation (optional feature)
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  // Render caption with highlighted references
  const renderHighlightedCaption = () => {
    const references = parseReferences(value);
    if (references.length === 0) {
      return <span className="caption-text-empty">{value || '\u00A0'}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    references.forEach((ref, idx) => {
      // Add text before reference
      if (ref.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="caption-text">
            {value.substring(lastIndex, ref.start)}
          </span>
        );
      }

      // Add highlighted reference
      parts.push(
        <span
          key={`ref-${idx}`}
          className={`caption-reference ${ref.isValid === false ? 'caption-reference-invalid' : ''}`}
          title={ref.alias ? `Reference to: ${ref.title} (shown as: ${ref.alias})` : `Reference to: ${ref.title}`}
        >
          {ref.text}
        </span>
      );

      lastIndex = ref.end;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key="text-end" className="caption-text">
          {value.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="caption-editor" ref={editorRef}>
      <div className="caption-editor-container">
        <div className="caption-highlight-layer" aria-hidden="true">
          {renderHighlightedCaption()}
        </div>
        <textarea
          ref={textareaRef}
          className="caption-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={6}
        />
      </div>

      {showAutocomplete && currentReferenceStart !== null && (
        <ReferenceAutocomplete
          searchQuery={searchQuery}
          position={autocompletePosition}
          onSelect={handleSelectReference}
          onClose={() => {
            setShowAutocomplete(false);
            setCurrentReferenceStart(null);
          }}
        />
      )}

      <div className="caption-help-text">
        <span className="help-icon">ℹ️</span>
        Use <code>[[Title]]</code> to reference other comics, or <code>[[Title|Custom Text]]</code> to use custom link text
      </div>
    </div>
  );
};
