import { useState, useEffect } from 'react';
import { ComicGrid } from '../components/comic/ComicGrid';
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

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/getComics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch comics');
        }

        const data = await response.json();
        setComics(data.items || []);
      } catch (err) {
        console.error('Error fetching comics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComics();
  }, []);

  return (
    <div className="home-page">
      <div className="home-page__header">
        <h1 className="home-page__title">Latest Comics</h1>
        <p className="home-page__subtitle">
          Explore the comic collection
        </p>
      </div>

      <ComicGrid comics={comics} isLoading={isLoading} error={error} />
    </div>
  );
}

export default HomePage;
