import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  isLoading?: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export function Pagination({
  currentPage,
  hasNextPage,
  isLoading = false,
  onPreviousPage,
  onNextPage,
  isFirstPage,
  isLastPage,
}: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Comic pagination">
      <button
        className="pagination__button pagination__button--prev"
        onClick={onPreviousPage}
        disabled={isFirstPage || isLoading}
        aria-label="Previous page"
      >
        <svg
          className="pagination__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="pagination__button-text">Previous</span>
      </button>

      <div className="pagination__info">
        <span className="pagination__page-number">
          Page {currentPage}
        </span>
        {isLoading && (
          <span className="pagination__loading" aria-live="polite">
            Loading...
          </span>
        )}
      </div>

      <button
        className="pagination__button pagination__button--next"
        onClick={onNextPage}
        disabled={isLastPage || isLoading}
        aria-label="Next page"
      >
        <span className="pagination__button-text">Next</span>
        <svg
          className="pagination__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  );
}
