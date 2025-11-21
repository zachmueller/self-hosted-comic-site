import { useState } from 'react';
import './ShareButton.css';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const shareUrl = url || window.location.href;

  const handleShare = async () => {
    try {
      // Try native Web Share API first (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: title,
          url: shareUrl,
        });
        return;
      }

      // Fallback to clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setFeedbackMessage('Link copied to clipboard!');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand('copy');
          setFeedbackMessage('Link copied to clipboard!');
        } catch (err) {
          setFeedbackMessage('Failed to copy link');
        }
        
        document.body.removeChild(textArea);
      }

      // Show feedback
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
    } catch (err) {
      console.error('Error sharing:', err);
      setFeedbackMessage('Failed to share');
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
    }
  };

  return (
    <div className="share-button">
      <button
        onClick={handleShare}
        className="share-button__button"
        aria-label="Share this comic"
      >
        <svg
          className="share-button__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="share-button__text">Share</span>
      </button>

      {showFeedback && (
        <div
          className="share-button__feedback"
          role="status"
          aria-live="polite"
        >
          {feedbackMessage}
        </div>
      )}
    </div>
  );
}
