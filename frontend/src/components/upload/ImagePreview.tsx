import './ImagePreview.css';

interface ImagePreviewProps {
  file: File;
  preview: string;
  onRemove: () => void;
  index: number;
}

function ImagePreview({ file, preview, onRemove, index }: ImagePreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="image-preview">
      <div className="preview-image-container">
        <img src={preview} alt={`Preview ${index + 1}`} className="preview-image" />
        <button
          type="button"
          onClick={onRemove}
          className="remove-button"
          aria-label={`Remove ${file.name}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="preview-index">{index + 1}</div>
      </div>
      <div className="preview-info">
        <div className="preview-filename" title={file.name}>
          {file.name}
        </div>
        <div className="preview-filesize">
          {formatFileSize(file.size)}
        </div>
      </div>
    </div>
  );
}

export default ImagePreview;
