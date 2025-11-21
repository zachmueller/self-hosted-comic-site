import { Link } from 'react-router-dom';
import './ComicCaption.css';

interface Reference {
  targetTitle: string;
  targetSlug: string;
  alias?: string;
  startIndex: number;
  endIndex: number;
}

interface ComicCaptionProps {
  caption: string;
  references?: Reference[];
}

export function ComicCaption({ caption, references = [] }: ComicCaptionProps) {
  if (!caption) {
    return null;
  }

  // Parse caption and convert [[references]] to links
  const renderCaption = () => {
    if (references.length === 0) {
      return <p className="comic-caption__text">{caption}</p>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    // Sort references by startIndex to process them in order
    const sortedRefs = [...references].sort((a, b) => a.startIndex - b.startIndex);

    sortedRefs.forEach((ref, index) => {
      // Add text before the reference
      if (ref.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {caption.substring(lastIndex, ref.startIndex)}
          </span>
        );
      }

      // Add the reference as a link
      parts.push(
        <Link
          key={`ref-${index}`}
          to={`/comic/${ref.targetSlug}`}
          className="comic-caption__link"
        >
          {ref.alias || ref.targetTitle}
        </Link>
      );

      lastIndex = ref.endIndex;
    });

    // Add remaining text after last reference
    if (lastIndex < caption.length) {
      parts.push(
        <span key="text-end">{caption.substring(lastIndex)}</span>
      );
    }

    return <p className="comic-caption__text">{parts}</p>;
  };

  return (
    <div className="comic-caption">
      <h2 className="comic-caption__heading">Caption</h2>
      {renderCaption()}
    </div>
  );
}
