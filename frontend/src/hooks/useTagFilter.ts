import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UseTagFilterReturn {
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  clearFilter: () => void;
  isTagSelected: (tag: string) => boolean;
}

export function useTagFilter(): UseTagFilterReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTag = searchParams.get('tag');

  const setSelectedTag = useCallback((tag: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (tag) {
      newParams.set('tag', tag);
      // Reset to page 1 when filtering
      newParams.delete('page');
    } else {
      newParams.delete('tag');
    }
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const clearFilter = useCallback(() => {
    setSelectedTag(null);
  }, [setSelectedTag]);

  const isTagSelected = useCallback((tag: string): boolean => {
    return selectedTag === tag;
  }, [selectedTag]);

  return {
    selectedTag,
    setSelectedTag,
    clearFilter,
    isTagSelected,
  };
}
