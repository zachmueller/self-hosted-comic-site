import { useState, useEffect } from 'react';
import { ComicGrid } from '../components/comic/ComicGrid';
import { Pagination } from '../components/comic/Pagination';
import { TagFilter } from '../components/comic/TagFilter';
import { usePagination } from '../hooks/usePagination';
import { useTagFilter } from '../hooks/useTagFilter';
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
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pagination = usePagination({ itemsPerPage: 20 });
  const { selectedTag } = useTagFilter();

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query params with pagination and tag filter
        const params = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: pagination.itemsPerPage.toString(),
        });

        if (selectedTag) {
          params.set('tag', selectedTag);
        }

        const response = await fetch(`/api/getComics?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch comics');
        }

        const data = await response.json();
        setComics(data.items || []);
        
        // Extract unique tags from comics for the filter
        const tags = new Set<string>();
        data.items?.forEach((comic: Comic) => {
          comic.tags?.forEach((tag: string) => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
        
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
  }, [pagination.currentPage, selectedTag]); // Re-fetch when page or tag changes

  return (
    <div className="home-page">
      <div className="home-page__header">
        <h1 className="home-page__title">
          {selectedTag ? `Comics tagged: ${selectedTag}` : 'Latest Comics'}
        </h1>
        <p className="home-page__subtitle">
          {selectedTag 
            ? `Showing comics with the "${selectedTag}" tag`
            : 'Explore the comic collection'}
        </p>
      </div>

      <TagFilter availableTags={availableTags} isLoading={isLoading} />

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
