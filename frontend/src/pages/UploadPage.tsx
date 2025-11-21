import { useState, useEffect } from 'react';
import { useRequireAuth } from '../auth/useRequireAuth';
import { useAuth } from '../auth/useAuth';
import ImageDropzone from '../components/upload/ImageDropzone';
import ComicMetadataForm, { ComicMetadata } from '../components/upload/ComicMetadataForm';
import ThumbnailSelector from '../components/upload/ThumbnailSelector';
import { PanelReorderScreen } from '../components/upload/PanelReorderScreen';
import { UploadSuccess } from '../components/upload/UploadSuccess';
import { useS3Upload } from '../hooks/useS3Upload';
import './UploadPage.css';

type UploadStep = 'files' | 'metadata' | 'reorder' | 'publish' | 'uploading' | 'success';

interface ImageData {
  file: File;
  preview: string;
  altText?: string;
}

const STEP_LABELS: Record<string, string> = {
  files: 'Select Images',
  metadata: 'Add Details',
  reorder: 'Arrange Panels',
  publish: 'Review & Publish',
};

function UploadPage() {
  const { isLoading } = useRequireAuth();
  const { tokens } = useAuth();
  const [currentStep, setCurrentStep] = useState<UploadStep>('files');
  const [images, setImages] = useState<ImageData[]>([]);
  const [metadata, setMetadata] = useState<ComicMetadata | null>(null);
  const [isMetadataValid, setIsMetadataValid] = useState(false);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [publishedComic, setPublishedComic] = useState<{ slug: string; title: string } | null>(
    null
  );
  
  // Get auth token for S3 upload
  const authToken = tokens?.idToken || '';
  const apiEndpoint = '/api/generatePresignedUrl';
  
  const s3Upload = useS3Upload({
    apiEndpoint,
    authToken,
    concurrency: 3,
    onSuccess: (s3Keys) => {
      console.log('Upload complete:', s3Keys);
    },
    onError: (error) => {
      console.error('Upload error:', error);
    },
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('comic-upload-draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.metadata) {
          setMetadata(parsed.metadata);
        }
        if (parsed.thumbnailIndex !== undefined) {
          setSelectedThumbnailIndex(parsed.thumbnailIndex);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (metadata) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(
            'comic-upload-draft',
            JSON.stringify({
              metadata,
              thumbnailIndex: selectedThumbnailIndex,
              fileCount: images.length,
            })
          );
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [metadata, selectedThumbnailIndex, images.length]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const handleFilesChange = (files: File[]) => {
    // Revoke old URLs
    images.forEach((img) => URL.revokeObjectURL(img.preview));

    // Create new image data
    const newImages: ImageData[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: undefined,
    }));

    setImages(newImages);
    setValidationErrors([]);
    // Reset thumbnail index if it's out of bounds
    if (selectedThumbnailIndex >= files.length) {
      setSelectedThumbnailIndex(Math.max(0, files.length - 1));
    }
  };

  const handleMetadataChange = (newMetadata: ComicMetadata) => {
    setMetadata(newMetadata);
  };

  const handleValidationChange = (isValid: boolean) => {
    setIsMetadataValid(isValid);
  };

  const handleThumbnailSelect = (index: number) => {
    setSelectedThumbnailIndex(index);
  };

  const handleReorder = (newOrder: ImageData[]) => {
    setImages(newOrder);
    setCurrentStep('publish');
    window.scrollTo(0, 0);
  };

  const canProceedToNextStep = (): { canProceed: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (currentStep) {
      case 'files':
        if (images.length === 0) {
          errors.push('Please select at least one image');
        }
        break;
      case 'metadata':
        if (!isMetadataValid) {
          errors.push('Please fix validation errors in the form');
        }
        break;
      case 'reorder':
      case 'uploading':
      case 'success':
        // No validation needed
        break;
      case 'publish':
        if (images.length === 0) {
          errors.push('No images to upload');
        }
        if (!metadata) {
          errors.push('Metadata is required');
        }
        break;
    }

    return { canProceed: errors.length === 0, errors };
  };

  const handleNext = () => {
    const validation = canProceedToNextStep();
    if (!validation.canProceed) {
      setValidationErrors(validation.errors);
      return;
    }

    const steps: UploadStep[] = ['files', 'metadata', 'reorder', 'publish'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1] as UploadStep);
      setValidationErrors([]);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    const steps: UploadStep[] = ['files', 'metadata', 'reorder', 'publish'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1] as UploadStep);
      setValidationErrors([]);
      window.scrollTo(0, 0);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      setMetadata(null);
      setIsMetadataValid(false);
      setSelectedThumbnailIndex(0);
      setCurrentStep('files');
      setValidationErrors([]);
      setPublishedComic(null);
      localStorage.removeItem('comic-upload-draft');
    }
  };

  const handleUploadAnother = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setMetadata(null);
    setIsMetadataValid(false);
    setSelectedThumbnailIndex(0);
    setCurrentStep('files');
    setValidationErrors([]);
    setPublishedComic(null);
    localStorage.removeItem('comic-upload-draft');
  };

  const handleSkipReorder = () => {
    setCurrentStep('publish');
    window.scrollTo(0, 0);
  };

  const handlePublish = async () => {
    if (!metadata) {
      setValidationErrors(['Metadata is required']);
      return;
    }

    if (images.length === 0) {
      setValidationErrors(['No images to upload']);
      return;
    }

    setCurrentStep('uploading');
    setValidationErrors([]);

    try {
      // Upload images to S3
      const s3Keys = await s3Upload.upload(images.map((img) => img.file));

      if (!s3Keys) {
        throw new Error('Failed to upload images to S3');
      }

      // Prepare metadata for backend
      const uploadMetadata = {
        title: metadata.title,
        caption: metadata.caption,
        postedDate: metadata.postedDate,
        happenedOnDate: metadata.happenedOnDate,
        tags: metadata.tags,
        scrollStyle: metadata.scrollStyle,
        images: s3Keys.map((s3Key: string, index: number) => ({
          s3Key,
          altText: images[index].altText,
        })),
        thumbnailIndex: selectedThumbnailIndex,
      };

      // Call processUpload Lambda
      const response = await fetch('/api/processUpload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadMetadata),
      });

      if (!response.ok) {
        throw new Error('Failed to publish comic');
      }

      const result = await response.json();

      // Clear draft and move to success screen
      localStorage.removeItem('comic-upload-draft');
      setPublishedComic({
        slug: result.slug,
        title: metadata.title,
      });
      setCurrentStep('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setValidationErrors([
        error instanceof Error ? error.message : 'Failed to publish comic. Please try again.',
      ]);
      setCurrentStep('publish');
    }
  };

  if (isLoading) {
    return (
      <div className="upload-page">
        <div className="upload-page__loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show success screen
  if (currentStep === 'success' && publishedComic) {
    return (
      <div className="upload-page">
        <div className="upload-page__container">
          <UploadSuccess
            comicSlug={publishedComic.slug}
            comicTitle={publishedComic.title}
            onUploadAnother={handleUploadAnother}
          />
        </div>
      </div>
    );
  }

  // Show uploading screen
  if (currentStep === 'uploading') {
    return (
      <div className="upload-page">
        <div className="upload-page__container">
          <div className="upload-page__uploading">
            <h2>Uploading Your Comic...</h2>
            <div className="upload-page__upload-progress">
              {images.map((image, index) => {
                const fileProgress = s3Upload.getFileProgress(index);
                return (
                  <div key={index} className="upload-page__file-progress">
                    <div className="upload-page__file-name">{image.file.name}</div>
                    <div className="upload-page__progress-bar">
                      <div
                        className="upload-page__progress-fill"
                        style={{ width: `${fileProgress?.percentage || 0}%` }}
                      />
                    </div>
                    <div className="upload-page__progress-percent">
                      {fileProgress?.percentage || 0}%
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="upload-page__overall-progress">
              <strong>Overall Progress:</strong> {Math.round(s3Upload.overallProgress)}%
            </div>
            {s3Upload.error && (
              <div className="upload-page__upload-error">
                <p>Upload error: {s3Upload.error.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const steps: UploadStep[] = ['files', 'metadata', 'reorder', 'publish'];
  const currentStepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length;

  return (
    <div className="upload-page">
      <div className="upload-page__container">
        {/* Progress Indicator */}
        <div className="upload-page__progress">
          <div className="upload-page__progress-bar">
            <div
              className="upload-page__progress-fill"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <div className="upload-page__progress-steps">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`upload-page__progress-step ${
                  currentStep === step ? 'active' : ''
                } ${index < currentStepIndex ? 'completed' : ''}`}
              >
                <div className="upload-page__progress-step-number">{index + 1}</div>
                <div className="upload-page__progress-step-label">{STEP_LABELS[step]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="upload-page__errors">
            <h3>Please fix the following errors:</h3>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step Content */}
        <div className="upload-page__content">
          {currentStep === 'files' && (
            <div className="upload-page__step">
              <h2>Select Images</h2>
              <p className="upload-page__step-description">
                Choose the comic images you want to upload (1-20 images, max 20MB each)
              </p>
              <ImageDropzone onFilesChange={handleFilesChange} />
            </div>
          )}

          {currentStep === 'metadata' && (
            <div className="upload-page__step">
              <h2>Add Details</h2>
              <p className="upload-page__step-description">
                Add title, caption, tags, and other metadata for your comic
              </p>
              <ComicMetadataForm
                onMetadataChange={handleMetadataChange}
                onValidationChange={handleValidationChange}
                initialMetadata={metadata || undefined}
              />
              {images.length > 0 && (
                <div className="upload-page__thumbnail-section">
                  <ThumbnailSelector
                    images={images.map((img) => img.file)}
                    previewUrls={images.map((img) => img.preview)}
                    selectedIndex={selectedThumbnailIndex}
                    onSelect={handleThumbnailSelect}
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 'reorder' && metadata && (
            <div className="upload-page__step">
              <PanelReorderScreen
                images={images}
                onReorder={handleReorder}
                onSkip={handleSkipReorder}
                scrollStyle={metadata.scrollStyle}
              />
            </div>
          )}

          {currentStep === 'publish' && metadata && (
            <div className="upload-page__step">
              <h2>Review & Publish</h2>
              <p className="upload-page__step-description">
                Review your comic before publishing
              </p>
              <div className="upload-page__review">
                <div className="upload-page__review-section">
                  <h3>Metadata</h3>
                  <dl>
                    <dt>Title:</dt>
                    <dd>{metadata.title}</dd>
                    {metadata.caption && (
                      <>
                        <dt>Caption:</dt>
                        <dd>{metadata.caption}</dd>
                      </>
                    )}
                    {metadata.happenedOnDate && (
                      <>
                        <dt>Happened On:</dt>
                        <dd>{metadata.happenedOnDate}</dd>
                      </>
                    )}
                    <dt>Display Style:</dt>
                    <dd>{metadata.scrollStyle}</dd>
                    {metadata.tags.length > 0 && (
                      <>
                        <dt>Tags:</dt>
                        <dd>{metadata.tags.join(', ')}</dd>
                      </>
                    )}
                  </dl>
                </div>
                <div className="upload-page__review-section">
                  <h3>Images ({images.length})</h3>
                  <div className="upload-page__preview-grid">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`upload-page__review-image ${
                          index === selectedThumbnailIndex ? 'thumbnail' : ''
                        }`}
                      >
                        <img src={image.preview} alt={`Panel ${index + 1}`} />
                        {index === selectedThumbnailIndex && (
                          <span className="upload-page__thumbnail-badge">Thumbnail</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="upload-page__publish-button"
                  onClick={handlePublish}
                >
                  Publish Comic
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="upload-page__navigation">
          <button
            type="button"
            className="upload-page__nav-button upload-page__nav-button--secondary"
            onClick={handleClearAll}
          >
            Clear All
          </button>
          <div className="upload-page__nav-buttons">
            {currentStep !== 'files' && (
              <button
                type="button"
                className="upload-page__nav-button upload-page__nav-button--secondary"
                onClick={handleBack}
              >
                ← Back
              </button>
            )}
            {currentStep !== 'publish' && (
              <button
                type="button"
                className="upload-page__nav-button upload-page__nav-button--primary"
                onClick={handleNext}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
