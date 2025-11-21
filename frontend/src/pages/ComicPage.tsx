import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ComicHeader } from '../components/comic/ComicHeader';
import { ComicImages } from '../components/comic/ComicImages';
import { ComicCaption } from '../components/comic/ComicCaption';
import { RelatedComics } from '../components/comic/RelatedComics';
import { ShareButton } from '../components/comic/ShareButton';
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

        // Get API endpoint from environment
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          throw new Error('API URL not configured');
        }

        const response = await fetch(`${apiUrl}/get-comic?slug=${encodeURIComponent(slug)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          setError('Comic not found');
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch comic');
        }

        const data = await response.json();
        setComic(data.comic || data);
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

      <ComicImages
        imageUrls={comic.imageUrls}
        altTexts={comic.altTexts}
        scrollStyle={comic.scrollStyle}
        title={comic.title}
      />

      {comic.caption && (
        <ComicCaption caption={comic.caption} />
      )}

      {comic.derivedRelationships && comic.derivedRelationships.length > 0 && (
        <RelatedComics relationships={comic.derivedRelationships as any} />
      )}

      <ShareButton title={comic.title} />
    </div>
  );
}

export default ComicPage;
