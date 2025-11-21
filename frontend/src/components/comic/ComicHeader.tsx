import { Link } from 'react-router-dom';
import './ComicHeader.css';

interface ComicHeaderProps {
  title: string;
  postedTimestamp: string;
  happenedOnDate?: string;
  tags: string[];
}

export function ComicHeader({
  title,
  postedTimestamp,
  happenedOnDate,
  tags,
}: ComicHeaderProps) {
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const postedDate = formatDate(postedTimestamp);
  const happenedDate = happenedOnDate ? formatDate(happenedOnDate) : null;

  return (
    <header className="comic-header">
      <h1 className="comic-header__title">{title}</h1>

      <div className="comic-header__metadata">
        <div className="comic-header__dates">
          <span className="comic-header__date comic-header__date--posted">
            <span className="comic-header__date-label">Posted:</span>
            <time dateTime={postedTimestamp}>{postedDate}</time>
          </span>

          {happenedDate && (
            <span className="comic-header__date comic-header__date--happened">
              <span className="comic-header__date-label">Story date:</span>
              <time dateTime={happenedOnDate}>{happenedDate}</time>
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="comic-header__tags">
            <span className="comic-header__tags-label">Tags:</span>
            <ul className="comic-header__tag-list">
              {tags.map((tag) => (
                <li key={tag} className="comic-header__tag-item">
                  <Link
                    to={`/?tag=${encodeURIComponent(tag)}`}
                    className="comic-header__tag-link"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
