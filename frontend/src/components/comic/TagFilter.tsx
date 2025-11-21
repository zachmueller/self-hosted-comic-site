import { useState } from 'react';
import { useTagFilter } from '../../hooks/useTagFilter';
import './TagFilter.css';

interface TagFilterProps {
  availableTags: string[];
  isLoading?: boolean;
}

export function TagFilter({ availableTags, isLoading = false }: TagFilterProps) {
  const { selectedTag, setSelectedTag, clearFilter, isTagSelected } = useTagFilter();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="tag-filter">
        <div className="tag-filter__loading">Loading tags...</div>
      </div>
    );
  }

  if (availableTags.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="tag-filter">
      <div className="tag-filter__header">
        <button
          className="tag-filter__mobile-toggle"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide tag filters' : 'Show tag filters'}
        >
          <svg
            className="tag-filter__hamburger-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isExpanded ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
          <h2 className="tag-filter__title">Filter by Tag</h2>
          {selectedTag && (
            <span className="tag-filter__active-indicator" aria-label={`Active filter: ${selectedTag}`}>
              ({selectedTag})
            </span>
          )}
        </button>
        
        {selectedTag && (
          <button
            className="tag-filter__clear-button"
            onClick={clearFilter}
            aria-label="Clear tag filter"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div 
        className={`tag-filter__tags ${isExpanded ? 'tag-filter__tags--expanded' : ''}`}
        role="group" 
        aria-label="Tag filters"
      >
        {availableTags.map((tag) => {
          const isSelected = isTagSelected(tag);
          return (
            <button
              key={tag}
              className={`tag-filter__tag ${isSelected ? 'tag-filter__tag--selected' : ''}`}
              onClick={() => setSelectedTag(isSelected ? null : tag)}
              aria-pressed={isSelected}
              aria-label={`Filter by ${tag}`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
