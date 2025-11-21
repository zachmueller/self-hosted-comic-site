import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ComicHeader } from '../components/comic/ComicHeader';
import './ComicPage.css';

interface Comic {
  id: string;
  slug: string;
  title: string;
  caption?: string;
  postedTimestamp: string;
  happenedOnDate?: string;
  tags: string[];
  scrollStyle: 'carousel' | 'long-form';
  imageUrls: string[];
  thumbnailUrl: string;
  altTexts?: Record<number, string>;
  derivedRelationships?: Array<{
    targetId: string;
    sourceType: 'caption' | 'series' | 'tag';
    context?: string;
  }>;
}

function ComicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [comic, setComic] = useState<Comic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComic = async () => {
      if (!slug) {
        setError('No comic specified');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/getComic?slug=${encodeURIComponent(slug)}`);

        if (response.status === 404) {
          setError('Comic not found');
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch comic');
        }

        const data = await response.json();
        setComic(data);
      } catch (err) {
        console.error('Error fetching comic:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comic');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComic();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="comic-page">
        <div className="comic-page__loading">
          <div className="comic-page__spinner" aria-label="Loading comic" />
          <p>Loading comic...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comic-page">
        <div className="comic-page__error">
          <h2 className="comic-page__error-title">
            {error === 'Comic not found' ? 'Comic Not Found' : 'Error Loading Comic'}
          </h2>
          <p className="comic-page__error-message">
            {error === 'Comic not found'
              ? 'The comic you\'re looking for doesn\'t exist or has been removed.'
              : error}
          </p>
          <Link to="/" className="comic-page__error-button">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="comic-page">
        <div className="comic-page__error">
          <h2 className="comic-page__error-title">Comic Not Available</h2>
          <p className="comic-page__error-message">
            Unable to load comic data. Please try again later.
          </p>
          <Link to="/" className="comic-page__error-button">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="comic-page">
      <ComicHeader
        title={comic.title}
        postedTimestamp={comic.postedTimestamp}
        happenedOnDate={comic.happenedOnDate}
        tags={comic.tags}
      />

      {/* Placeholder for READER-005: Comic Images Component */}
      <div className="comic-page__images-placeholder">
        <p className="comic-page__placeholder-text">
          Comic images will be displayed here ({comic.scrollStyle} mode)
        </p>
        <p className="comic-page__placeholder-info">
          {comic.imageUrls.length} image{comic.imageUrls.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Placeholder for READER-006: Caption and Relationships */}
      {comic.caption && (
        <div className="comic-page__caption-placeholder">
          <h3 className="comic-page__placeholder-heading">Caption</h3>
          <p className="comic-page__placeholder-text">{comic.caption}</p>
        </div>
      )}

      {/* Placeholder for READER-007: Share Button */}
      <div className="comic-page__share-placeholder">
        <p className="comic-page__placeholder-text">Share button will appear here</p>
      </div>
    </div>
  );
}

export default ComicPage;
