import React, { useState, useEffect, useRef } from 'react';
import './ReferenceAutocomplete.css';

interface ComicSuggestion {
  id: string;
  title: string;
  slug: string;
  happenedOnDate?: string;
}

interface ReferenceAutocompleteProps {
  searchQuery: string;
  position: { top: number; left: number };
  onSelect: (comicId: string, comicTitle: string, comicSlug: string) => void;
  onClose: () => void;
}

export const ReferenceAutocomplete: React.FC<ReferenceAutocompleteProps> = ({
  searchQuery,
  position,
  onSelect,
  onClose,
}) => {
  const [suggestions, setSuggestions] = useState<ComicSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch suggestions based on search query
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length === 0) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API endpoint when API is implemented
        // For now, use mock data
        const mockSuggestions = getMockSuggestions(searchQuery);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setSuggestions(mockSuggestions);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Error fetching comic suggestions:', err);
        setError('Failed to load suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Mock data function (will be replaced with actual API call)
  const getMockSuggestions = (query: string): ComicSuggestion[] => {
    const mockComics: ComicSuggestion[] = [
      { id: '1', title: 'First Comic Adventure', slug: 'first-comic-adventure', happenedOnDate: '2024-01-15' },
      { id: '2', title: 'Second Chapter', slug: 'second-chapter', happenedOnDate: '2024-02-20' },
      { id: '3', title: 'The Beginning', slug: 'the-beginning', happenedOnDate: '2024-03-10' },
      { id: '4', title: 'Epic Quest', slug: 'epic-quest', happenedOnDate: '2024-04-05' },
      { id: '5', title: 'Final Showdown', slug: 'final-showdown', happenedOnDate: '2024-05-12' },
    ];

    const lowerQuery = query.toLowerCase();
    return mockComics
      .filter(comic => comic.title.toLowerCase().includes(lowerQuery))
      .slice(0, 10);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, suggestions, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  // Handle selection
  const handleSelect = (suggestion: ComicSuggestion) => {
    onSelect(suggestion.id, suggestion.title, suggestion.slug);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.reference-autocomplete')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (suggestions.length === 0 && !loading && !error) {
    return (
      <div
        className="reference-autocomplete reference-autocomplete-empty"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="autocomplete-empty-state">
          {searchQuery.length === 0 ? (
            <>Start typing to search for comics...</>
          ) : (
            <>No comics found matching "{searchQuery}"</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="reference-autocomplete"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {loading && (
        <div className="autocomplete-loading">
          <span className="loading-spinner">⟳</span> Searching...
        </div>
      )}

      {error && (
        <div className="autocomplete-error">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <>
          <div className="autocomplete-header">
            <span className="search-icon">🔍</span>
            <span className="search-query">"{searchQuery}"</span>
            <span className="result-count">({suggestions.length} result{suggestions.length !== 1 ? 's' : ''})</span>
          </div>
          <ul className="autocomplete-list" ref={listRef}>
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className={`autocomplete-item ${index === selectedIndex ? 'autocomplete-item-selected' : ''}`}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="autocomplete-item-content">
                  <div className="autocomplete-item-title">{suggestion.title}</div>
                  {suggestion.happenedOnDate && (
                    <div className="autocomplete-item-date">
                      📅 {formatDate(suggestion.happenedOnDate)}
                    </div>
                  )}
                </div>
                {index === selectedIndex && (
                  <div className="autocomplete-item-hint">
                    <kbd>Enter</kbd>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="autocomplete-footer">
            <span className="keyboard-hint">
              <kbd>↑</kbd> <kbd>↓</kbd> navigate • <kbd>Enter</kbd> select • <kbd>Esc</kbd> close
            </span>
          </div>
        </>
      )}
    </div>
  );
};
