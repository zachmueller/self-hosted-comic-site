import { CarouselView } from './CarouselView';
import { LongFormView } from './LongFormView';
import './ComicImages.css';

interface ComicImagesProps {
  imageUrls: string[];
  altTexts?: Record<number, string>;
  scrollStyle: 'carousel' | 'long-form';
  title: string;
}

export function ComicImages({
  imageUrls,
  altTexts = {},
  scrollStyle,
  title,
}: ComicImagesProps) {
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="comic-images__empty">
        <p>No images available for this comic.</p>
      </div>
    );
  }

  return (
    <div className="comic-images">
      {scrollStyle === 'carousel' ? (
        <CarouselView
          imageUrls={imageUrls}
          altTexts={altTexts}
          title={title}
        />
      ) : (
        <LongFormView
          imageUrls={imageUrls}
          altTexts={altTexts}
          title={title}
        />
      )}
    </div>
  );
}
