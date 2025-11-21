import { useState, KeyboardEvent } from 'react';
import './TagInput.css';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

function TagInput({ tags, onChange, error }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const validateTag = (tag: string): string | null => {
    if (!tag) return 'Tag cannot be empty';
    if (tag.length > 50) return 'Tag must be 50 characters or less';
    if (!/^[a-z0-9-]+$/.test(tag)) {
      return 'Tag must contain only lowercase letters, numbers, and hyphens';
    }
    if (tags.includes(tag)) return 'Tag already exists';
    return null;
  };

  const addTag = () => {
    const trimmedTag = inputValue.trim().toLowerCase();
    const validationError = validateTag(trimmedTag);
    
    if (validationError) {
      setInputError(validationError);
      return;
    }

    onChange([...tags, trimmedTag]);
    setInputValue('');
    setInputError('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setInputValue(value);
    setInputError('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="tag-input">
      <div className={`tag-container ${error || inputError ? 'error' : ''}`}>
        {tags.map((tag, index) => (
          <div key={`${tag}-${index}`} className="tag">
            <span className="tag-text">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="tag-remove"
              aria-label={`Remove tag ${tag}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="tag-input-field"
          placeholder={tags.length === 0 ? "Type tag and press Enter" : "Add tag..."}
          maxLength={50}
        />
      </div>
      <div className="tag-input-actions">
        <button
          type="button"
          onClick={addTag}
          className="add-tag-button"
          disabled={!inputValue.trim()}
        >
          Add Tag
        </button>
      </div>
      {inputError && (
        <div className="error-message">{inputError}</div>
      )}
      {error && !inputError && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
}

export default TagInput;
