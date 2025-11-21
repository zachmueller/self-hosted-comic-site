import { useState, useEffect } from 'react';
import { ComicGrid } from '../components/comic/ComicGrid';
import { Pagination } from '../components/comic/Pagination';
import { usePagination } from '../hooks/usePagination';
import './HomePage.css';

interface Comic {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  postedTimestamp: string;
  tags: string[];
}

function HomePage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pagination = usePagination({ itemsPerPage: 20 });

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query params with pagination
        const params = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: pagination.itemsPerPage.toString(),
        });

        const response = await fetch(`/api/getComics?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch comics');
        }

        const data = await response.json();
        setComics(data.items || []);
        
        // Update pagination state based on API response
        pagination.setHasNextPage(data.hasNextPage || false);
      } catch (err) {
        console.error('Error fetching comics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComics();
  }, [pagination.currentPage]); // Re-fetch when page changes

  return (
    <div className="home-page">
      <div className="home-page__header">
        <h1 className="home-page__title">Latest Comics</h1>
        <p className="home-page__subtitle">
          Explore the comic collection
        </p>
      </div>

      <ComicGrid comics={comics} isLoading={isLoading} error={error} />

      {!isLoading && !error && comics.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          hasNextPage={pagination.hasNextPage}
          isLoading={isLoading}
          onPreviousPage={pagination.goToPreviousPage}
          onNextPage={pagination.goToNextPage}
          isFirstPage={pagination.isFirstPage}
          isLastPage={pagination.isLastPage}
        />
      )}
    </div>
  );
}

export default HomePage;
