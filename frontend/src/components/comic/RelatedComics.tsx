import { Link } from 'react-router-dom';
import './RelatedComics.css';

interface RelatedComic {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  sourceType: 'caption' | 'series' | 'tag';
  context?: string;
}

interface RelatedComicsProps {
  relationships: RelatedComic[];
}

export function RelatedComics({ relationships }: RelatedComicsProps) {
  if (!relationships || relationships.length === 0) {
    return null;
  }

  // Group relationships by sourceType
  const grouped = relationships.reduce((acc, comic) => {
    if (!acc[comic.sourceType]) {
      acc[comic.sourceType] = [];
    }
    acc[comic.sourceType].push(comic);
    return acc;
  }, {} as Record<string, RelatedComic[]>);

  const getSectionTitle = (type: string): string => {
    switch (type) {
      case 'caption':
        return 'Referenced in Caption';
      case 'series':
        return 'Part of Series';
      case 'tag':
        return 'Related by Tags';
      default:
        return 'Related Comics';
    }
  };

  return (
    <div className="related-comics">
      <h2 className="related-comics__heading">Related Comics</h2>

      {Object.entries(grouped).map(([sourceType, comics]) => (
        <section key={sourceType} className="related-comics__section">
          <h3 className="related-comics__section-title">
            {getSectionTitle(sourceType)}
          </h3>

          <div className="related-comics__grid">
            {comics.map((comic) => (
              <Link
                key={comic.id}
                to={`/comic/${comic.slug}`}
                className="related-comics__card"
              >
                <div className="related-comics__thumbnail-wrapper">
                  <img
                    src={comic.thumbnailUrl}
                    alt={comic.title}
                    className="related-comics__thumbnail"
                    loading="lazy"
                  />
                </div>
                <div className="related-comics__info">
                  <h4 className="related-comics__title">{comic.title}</h4>
                  {comic.context && sourceType === 'caption' && (
                    <p className="related-comics__context">{comic.context}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
