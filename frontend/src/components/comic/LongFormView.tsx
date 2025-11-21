import { useEffect, useState } from 'react';
import './LongFormView.css';

interface LongFormViewProps {
  imageUrls: string[];
  altTexts?: Record<number, string>;
  title: string;
}

export function LongFormView({
  imageUrls,
  altTexts = {},
  title,
}: LongFormViewProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.01,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const dataSrc = img.getAttribute('data-src');
          if (dataSrc && !img.src) {
            img.src = dataSrc;
          }
        }
      });
    }, options);

    const images = document.querySelectorAll('.long-form-view__image[data-src]');
    images.forEach((img) => observer.observe(img));

    return () => {
      images.forEach((img) => observer.unobserve(img));
    };
  }, [imageUrls]);

  return (
    <div className="long-form-view">
      <div className="long-form-view__container">
        {imageUrls.map((url, index) => {
          const altText = altTexts[index] || `${title} - Panel ${index + 1}`;
          const isLoaded = loadedImages.has(index);

          return (
            <div key={index} className="long-form-view__panel">
              <div className="long-form-view__image-wrapper">
                {!isLoaded && (
                  <div className="long-form-view__loading">
                    <div className="long-form-view__spinner" aria-label="Loading image" />
                  </div>
                )}
                <img
                  data-src={url}
                  alt={altText}
                  className={`long-form-view__image ${
                    isLoaded ? '' : 'long-form-view__image--loading'
                  }`}
                  onLoad={() => handleImageLoad(index)}
                  loading="lazy"
                />
              </div>
              {altTexts[index] && (
                <p className="long-form-view__caption">{altTexts[index]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel count indicator */}
      <div className="long-form-view__info">
        Total panels: {imageUrls.length}
      </div>
    </div>
  );
}
