import React from 'react';
import './AltTextInput.css';

interface AltTextInputProps {
  imageFile: File;
  imageIndex: number;
  value: string;
  onChange: (imageIndex: number, altText: string) => void;
  previewUrl: string;
}

export const AltTextInput: React.FC<AltTextInputProps> = ({
  imageFile,
  imageIndex,
  value,
  onChange,
  previewUrl,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(imageIndex, e.target.value);
  };

  return (
    <div className="alt-text-input">
      <div className="alt-text-header">
        <div className="alt-text-image-preview">
          <img src={previewUrl} alt={`Panel ${imageIndex + 1}`} />
          <div className="image-number">Panel {imageIndex + 1}</div>
        </div>
        <div className="alt-text-info">
          <label htmlFor={`alt-text-${imageIndex}`} className="alt-text-label">
            Alt Text (Optional)
          </label>
          <p className="alt-text-description">
            Describe this image for screen readers and accessibility
          </p>
        </div>
      </div>

      <textarea
        id={`alt-text-${imageIndex}`}
        className="alt-text-textarea"
        value={value}
        onChange={handleChange}
        placeholder={`Describe panel ${imageIndex + 1}... (e.g., "Character standing in doorway, looking surprised")`}
        rows={3}
        maxLength={500}
      />

      <div className="alt-text-footer">
        <span className="character-count">
          {value.length}/500 characters
        </span>
        {value.length === 0 && (
          <span className="optional-badge">Optional</span>
        )}
      </div>

      <div className="alt-text-help">
        <span className="help-icon">💡</span>
        <span className="help-text">
          Good alt text is concise and descriptive. Focus on what's important to understand the comic's story.
        </span>
      </div>
    </div>
  );
};

export default AltTextInput;
