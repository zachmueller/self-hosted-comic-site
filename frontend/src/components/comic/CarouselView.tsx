import { useState, useEffect, useCallback } from 'react';
import './CarouselView.css';

interface CarouselViewProps {
  imageUrls: string[];
  altTexts?: Record<number, string>;
  title: string;
}

export function CarouselView({
  imageUrls,
  altTexts = {},
  title,
}: CarouselViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const totalImages = imageUrls.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

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

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious]);

  // Touch/swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swiped left, go to next
          goToNext();
        } else {
          // Swiped right, go to previous
          goToPrevious();
        }
      }
    };

    const carousel = document.querySelector('.carousel-view');
    if (carousel) {
      carousel.addEventListener('touchstart', handleTouchStart as EventListener);
      carousel.addEventListener('touchend', handleTouchEnd as EventListener);

      return () => {
        carousel.removeEventListener('touchstart', handleTouchStart as EventListener);
        carousel.removeEventListener('touchend', handleTouchEnd as EventListener);
      };
    }
  }, [goToNext, goToPrevious]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
    if (index === currentIndex) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loadedImages.has(currentIndex)) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [currentIndex, loadedImages]);

  const currentAltText = altTexts[currentIndex] || `${title} - Panel ${currentIndex + 1}`;

  return (
    <div className="carousel-view">
      <div className="carousel-view__container">
        {isLoading && (
          <div className="carousel-view__loading">
            <div className="carousel-view__spinner" aria-label="Loading image" />
          </div>
        )}

        <img
          src={imageUrls[currentIndex]}
          alt={currentAltText}
          className={`carousel-view__image ${isLoading ? 'carousel-view__image--loading' : ''}`}
          onLoad={() => handleImageLoad(currentIndex)}
        />

        {totalImages > 1 && (
          <>
            <button
              className="carousel-view__button carousel-view__button--prev"
              onClick={goToPrevious}
              aria-label="Previous panel"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              className="carousel-view__button carousel-view__button--next"
              onClick={goToNext}
              aria-label="Next panel"
            >
              <svg
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
          </>
        )}
      </div>

      {totalImages > 1 && (
        <div className="carousel-view__controls">
          <div className="carousel-view__counter">
            Panel {currentIndex + 1} of {totalImages}
          </div>

          <div className="carousel-view__dots">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                className={`carousel-view__dot ${
                  index === currentIndex ? 'carousel-view__dot--active' : ''
                }`}
                onClick={() => goToIndex(index)}
                aria-label={`Go to panel ${index + 1}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hint for desktop */}
      {totalImages > 1 && (
        <div className="carousel-view__hint">
          Use ← → arrow keys or swipe to navigate
        </div>
      )}
    </div>
  );
}
