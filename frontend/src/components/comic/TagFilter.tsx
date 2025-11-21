import { useTagFilter } from '../../hooks/useTagFilter';
import './TagFilter.css';

interface TagFilterProps {
  availableTags: string[];
  isLoading?: boolean;
}

export function TagFilter({ availableTags, isLoading = false }: TagFilterProps) {
  const { selectedTag, setSelectedTag, clearFilter, isTagSelected } = useTagFilter();

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

  return (
    <div className="tag-filter">
      <div className="tag-filter__header">
        <h2 className="tag-filter__title">Filter by Tag</h2>
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

      <div className="tag-filter__tags" role="group" aria-label="Tag filters">
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
