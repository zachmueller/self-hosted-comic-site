import React from 'react';
import './ThumbnailSelector.css';

interface ThumbnailSelectorProps {
  images: File[];
  previewUrls: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({
  images,
  previewUrls,
  selectedIndex,
  onSelect,
}) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="thumbnail-selector">
      <div className="thumbnail-selector-header">
        <h3 className="thumbnail-selector-title">Select Thumbnail</h3>
        <p className="thumbnail-selector-description">
          Choose which image will represent this comic in the listing
        </p>
      </div>

      <div className="thumbnail-grid">
        {previewUrls.map((url, index) => (
          <button
            key={index}
            type="button"
            className={`thumbnail-option ${index === selectedIndex ? 'thumbnail-selected' : ''}`}
            onClick={() => onSelect(index)}
            aria-label={`Select panel ${index + 1} as thumbnail`}
            aria-pressed={index === selectedIndex}
          >
            <div className="thumbnail-image-container">
              <img
                src={url}
                alt={`Panel ${index + 1}`}
                className="thumbnail-image"
              />
              {index === selectedIndex && (
                <div className="thumbnail-selected-overlay">
                  <span className="thumbnail-checkmark">✓</span>
                </div>
              )}
            </div>
            <div className="thumbnail-label">
              Panel {index + 1}
              {index === selectedIndex && (
                <span className="selected-badge">Selected</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="thumbnail-preview-section">
        <div className="thumbnail-preview-label">
          Selected Thumbnail Preview:
        </div>
        <div className="thumbnail-preview-card">
          <div className="thumbnail-preview-image">
            <img
              src={previewUrls[selectedIndex]}
              alt={`Selected thumbnail - Panel ${selectedIndex + 1}`}
            />
          </div>
          <div className="thumbnail-preview-info">
            <div className="preview-title">How it will appear:</div>
            <div className="preview-details">
              <span className="preview-panel-number">Panel {selectedIndex + 1}</span>
              <span className="preview-filename">{images[selectedIndex].name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="thumbnail-help">
        <span className="help-icon">ℹ️</span>
        <span className="help-text">
          The thumbnail will be displayed in the comic listing page. Choose an image that best represents your comic.
          {images.length === 1 && ' (Only one image - automatically selected)'}
        </span>
      </div>
    </div>
  );
};

export default ThumbnailSelector;
