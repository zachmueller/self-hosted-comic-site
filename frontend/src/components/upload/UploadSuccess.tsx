import React from 'react';
import { Link } from 'react-router-dom';
import './UploadSuccess.css';

interface UploadSuccessProps {
  comicSlug: string;
  comicTitle: string;
  onUploadAnother: () => void;
}

export const UploadSuccess: React.FC<UploadSuccessProps> = ({
  comicSlug,
  comicTitle,
  onUploadAnother,
}) => {
  return (
    <div className="upload-success">
      <div className="success-icon">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h2 className="success-title">Comic Published Successfully!</h2>
      <p className="success-subtitle">"{comicTitle}"</p>

      <div className="success-message">
        <p>
          Your comic has been published and will be visible to readers shortly. Due to CloudFront
          caching, it may take approximately <strong>5 minutes</strong> for your comic to appear
          on the homepage and in search results.
        </p>
      </div>

      <div className="success-actions">
        <Link to={`/comic/${comicSlug}`} className="view-comic-button">
          View Published Comic
        </Link>
        <button type="button" onClick={onUploadAnother} className="upload-another-button">
          Upload Another Comic
        </button>
        <Link to="/" className="home-button">
          Return to Homepage
        </Link>
      </div>

      <div className="cache-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-text">
          <strong>Note about caching:</strong> If you don't see your comic immediately, please
          wait a few minutes and refresh the page. CloudFront's content delivery network caches
          content for optimal performance, which means changes may take a few minutes to propagate
          globally.
        </div>
      </div>
    </div>
  );
};
