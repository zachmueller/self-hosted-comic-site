import React from 'react';
import { Link } from 'react-router-dom';
import './ComicCard.css';

interface ComicCardProps {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  postedDate: string;
  tags: string[];
}

export const ComicCard: React.FC<ComicCardProps> = ({
  slug,
  title,
  thumbnailUrl,
  postedDate,
  tags,
}) => {
  const formattedDate = new Date(postedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={`/comic/${slug}`} className="comic-card">
      <div className="comic-card__image-container">
        <img
          src={thumbnailUrl}
          alt={title}
          className="comic-card__image"
          loading="lazy"
        />
      </div>
      <div className="comic-card__content">
        <h3 className="comic-card__title">{title}</h3>
        <time className="comic-card__date" dateTime={postedDate}>
          {formattedDate}
        </time>
        {tags.length > 0 && (
          <div className="comic-card__tags">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="comic-card__tag">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="comic-card__tag-more">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
