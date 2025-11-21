import { useState, useEffect } from 'react';
import DatePicker from './DatePicker';
import TagInput from './TagInput';
import ScrollStyleToggle from './ScrollStyleToggle';
import { CaptionEditor } from './CaptionEditor';
import { 
  titleSchema,
  isoDateSchema,
  tagsArraySchema,
  scrollStyleSchema 
} from '../../validation/metadata.schema';
import { z, ZodError } from 'zod';
import './ComicMetadataForm.css';

export interface ComicMetadata {
  title: string;
  caption?: string;
  postedDate: string;
  happenedOnDate?: string;
  tags: string[];
  scrollStyle: 'carousel' | 'long-form';
}

interface ComicMetadataFormProps {
  onMetadataChange: (metadata: ComicMetadata) => void;
  onValidationChange: (isValid: boolean) => void;
  initialMetadata?: Partial<ComicMetadata>;
}

function ComicMetadataForm({ 
  onMetadataChange, 
  onValidationChange,
  initialMetadata 
}: ComicMetadataFormProps) {
  const [title, setTitle] = useState(initialMetadata?.title || '');
  const [caption, setCaption] = useState(initialMetadata?.caption || '');
  const [postedDate, setPostedDate] = useState(
    initialMetadata?.postedDate || new Date().toISOString().split('T')[0]
  );
  const [happenedOnDate, setHappenedOnDate] = useState(initialMetadata?.happenedOnDate || '');
  const [tags, setTags] = useState<string[]>(initialMetadata?.tags || []);
  const [scrollStyle, setScrollStyle] = useState<'carousel' | 'long-form'>(
    initialMetadata?.scrollStyle || 'carousel'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate and notify parent whenever metadata changes
  useEffect(() => {
    const metadata: ComicMetadata = {
      title,
      caption: caption || undefined,
      postedDate,
      happenedOnDate: happenedOnDate || undefined,
      tags,
      scrollStyle
    };

    // Create a validation schema for the metadata
    const metadataSchema = z.object({
      title: titleSchema,
      caption: z.string().max(10000).optional(),
      postedDate: isoDateSchema,
      happenedOnDate: isoDateSchema.optional(),
      tags: tagsArraySchema,
      scrollStyle: scrollStyleSchema
    });

    try {
      metadataSchema.parse(metadata);
      setErrors({});
      onValidationChange(true);
      onMetadataChange(metadata);
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
        onValidationChange(false);
      }
    }
  }, [title, caption, postedDate, happenedOnDate, tags, scrollStyle, onMetadataChange, onValidationChange]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setTouched({ ...touched, title: true });
  };

  const handleTitleBlur = () => {
    setTouched({ ...touched, title: true });
  };

  const handlePostedDateChange = (date: string) => {
    setPostedDate(date);
    setTouched({ ...touched, postedDate: true });
  };

  const handleHappenedOnDateChange = (date: string) => {
    setHappenedOnDate(date);
    setTouched({ ...touched, happenedOnDate: true });
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    setTouched({ ...touched, tags: true });
  };

  const handleScrollStyleChange = (style: 'carousel' | 'long-form') => {
    setScrollStyle(style);
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    setTouched({ ...touched, caption: true });
  };

  return (
    <div className="comic-metadata-form">
      <div className="form-group">
        <label htmlFor="title" className="form-label required">
          Comic Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          className={`form-input ${touched.title && errors.title ? 'error' : ''}`}
          placeholder="Enter comic title"
          maxLength={200}
        />
        {touched.title && errors.title && (
          <div className="error-message">{errors.title}</div>
        )}
        <div className="field-hint">
          {title.length}/200 characters
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="postedDate" className="form-label required">
            Posted Date
          </label>
          <DatePicker
            id="postedDate"
            value={postedDate}
            onChange={handlePostedDateChange}
            error={touched.postedDate ? errors.postedDate : undefined}
          />
          <div className="field-hint">
            When this comic was/will be published
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="happenedOnDate" className="form-label">
            Happened On Date (Optional)
          </label>
          <DatePicker
            id="happenedOnDate"
            value={happenedOnDate}
            onChange={handleHappenedOnDateChange}
            error={touched.happenedOnDate ? errors.happenedOnDate : undefined}
            allowEmpty
          />
          <div className="field-hint">
            When events in the comic took place
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Caption (Optional)
        </label>
        <CaptionEditor
          value={caption}
          onChange={handleCaptionChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Tags
        </label>
        <TagInput
          tags={tags}
          onChange={handleTagsChange}
          error={touched.tags ? errors.tags : undefined}
        />
        <div className="field-hint">
          Add tags to categorize your comic (lowercase with hyphens)
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Display Style
        </label>
        <ScrollStyleToggle
          value={scrollStyle}
          onChange={handleScrollStyleChange}
        />
        <div className="field-hint">
          Choose how readers will view multiple images
        </div>
      </div>
    </div>
  );
}

export default ComicMetadataForm;
