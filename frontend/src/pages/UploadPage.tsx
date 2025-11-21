import { useState, useEffect } from 'react';
import { useRequireAuth } from '../auth/useRequireAuth';
import ImageDropzone from '../components/upload/ImageDropzone';
import ComicMetadataForm, { ComicMetadata } from '../components/upload/ComicMetadataForm';
import ThumbnailSelector from '../components/upload/ThumbnailSelector';
import './UploadPage.css';

type UploadStep = 'files' | 'metadata' | 'reorder' | 'publish';

const STEP_LABELS: Record<UploadStep, string> = {
  files: 'Select Images',
  metadata: 'Add Details',
  reorder: 'Arrange Panels',
  publish: 'Review & Publish',
};

function UploadPage() {
  const { isLoading } = useRequireAuth();
  const [currentStep, setCurrentStep] = useState<UploadStep>('files');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<ComicMetadata | null>(null);
  const [isMetadataValid, setIsMetadataValid] = useState(false);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
              fileCount: selectedFiles.length,
            })
          );
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [metadata, selectedThumbnailIndex, selectedFiles.length]);

  // Create preview URLs when files change
  useEffect(() => {
    // Revoke old URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    // Create new URLs
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup on unmount
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
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

  const canProceedToNextStep = (): { canProceed: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (currentStep) {
      case 'files':
        if (selectedFiles.length === 0) {
          errors.push('Please select at least one image');
        }
        break;
      case 'metadata':
        if (!isMetadataValid) {
          errors.push('Please fix validation errors in the form');
        }
        break;
      case 'reorder':
        // No validation needed - this step is optional
        break;
      case 'publish':
        if (selectedFiles.length === 0) {
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
      setCurrentStep(steps[currentIndex + 1]);
      setValidationErrors([]);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    const steps: UploadStep[] = ['files', 'metadata', 'reorder', 'publish'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      setValidationErrors([]);
      window.scrollTo(0, 0);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setMetadata(null);
      setIsMetadataValid(false);
      setSelectedThumbnailIndex(0);
      setCurrentStep('files');
      setValidationErrors([]);
      localStorage.removeItem('comic-upload-draft');
    }
  };

  const handleSkipReorder = () => {
    setCurrentStep('publish');
    window.scrollTo(0, 0);
  };

  const handlePublish = async () => {
    // TODO: Implement actual publishing logic in UPLOAD-008, UPLOAD-009, UPLOAD-010
    console.log('Publishing comic...', {
      files: selectedFiles,
      metadata,
      thumbnailIndex: selectedThumbnailIndex,
    });
    alert(
      'Publishing functionality will be implemented in future tasks (UPLOAD-008 through UPLOAD-010)'
    );
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
              {selectedFiles.length > 0 && (
                <div className="upload-page__thumbnail-section">
                  <ThumbnailSelector
                    images={selectedFiles}
                    previewUrls={previewUrls}
                    selectedIndex={selectedThumbnailIndex}
                    onSelect={handleThumbnailSelect}
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 'reorder' && (
            <div className="upload-page__step">
              <h2>Arrange Panels</h2>
              <p className="upload-page__step-description">
                Drag and drop to reorder your comic panels (optional)
              </p>
              <div className="upload-page__reorder-placeholder">
                <p>Panel reordering interface will be implemented in UPLOAD-007</p>
                <p>Current order: {selectedFiles.length} images</p>
                <div className="upload-page__preview-grid">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="upload-page__reorder-preview">
                      <img src={url} alt={`Panel ${index + 1}`} />
                      <span className="upload-page__reorder-number">{index + 1}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="upload-page__skip-button"
                  onClick={handleSkipReorder}
                >
                  Skip Reordering
                </button>
              </div>
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
                  <h3>Images ({selectedFiles.length})</h3>
                  <div className="upload-page__preview-grid">
                    {previewUrls.map((url, index) => (
                      <div
                        key={index}
                        className={`upload-page__review-image ${
                          index === selectedThumbnailIndex ? 'thumbnail' : ''
                        }`}
                      >
                        <img src={url} alt={`Panel ${index + 1}`} />
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
