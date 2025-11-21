import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UsePaginationOptions {
  initialPage?: number;
  itemsPerPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  setHasNextPage: (hasNext: boolean) => void;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { initialPage = 1, itemsPerPage = 20 } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasNextPage, setHasNextPage] = useState(false);

  // Read current page from URL parameters
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(urlPage) || urlPage < 1 ? initialPage : urlPage;

  // Update URL when page changes
  const goToPage = useCallback((page: number) => {
    if (page < 1) return;
    
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', page.toString());
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, hasNextPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const isFirstPage = currentPage === 1;
  const isLastPage = !hasNextPage;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (event.key === 'ArrowLeft' && !isFirstPage) {
        event.preventDefault();
        goToPreviousPage();
      } else if (event.key === 'ArrowRight' && !isLastPage) {
        event.preventDefault();
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFirstPage, isLastPage, goToNextPage, goToPreviousPage]);

  return {
    currentPage,
    itemsPerPage,
    hasNextPage,
    setHasNextPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    isFirstPage,
    isLastPage,
  };
}
