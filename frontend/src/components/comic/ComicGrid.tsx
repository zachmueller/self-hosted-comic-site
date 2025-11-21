import React from 'react';
import { ComicCard } from './ComicCard';
import './ComicGrid.css';

interface Comic {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  postedTimestamp: string;
  tags: string[];
}

interface ComicGridProps {
  comics: Comic[];
  isLoading?: boolean;
  error?: string | null;
}

export const ComicGrid: React.FC<ComicGridProps> = ({ comics, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="comic-grid__loading">
        <div className="comic-grid__spinner"></div>
        <p>Loading comics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comic-grid__error">
        <p className="comic-grid__error-message">Failed to load comics</p>
        <p className="comic-grid__error-detail">{error}</p>
        <button
          className="comic-grid__retry-button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (comics.length === 0) {
    return (
      <div className="comic-grid__empty">
        <svg
          className="comic-grid__empty-icon"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <h2 className="comic-grid__empty-title">No Comics Yet</h2>
        <p className="comic-grid__empty-message">
          Comics will appear here once they're published.
        </p>
      </div>
    );
  }

  return (
    <div className="comic-grid">
      {comics.map((comic) => (
        <ComicCard
          key={comic.id}
          id={comic.id}
          slug={comic.slug}
          title={comic.title}
          thumbnailUrl={comic.thumbnailUrl}
          postedDate={comic.postedTimestamp}
          tags={comic.tags}
        />
      ))}
    </div>
  );
};
