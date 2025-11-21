export type UploadStep = 'files' | 'metadata' | 'reorder' | 'publish';

export interface UploadImage {
  file: File;
  preview: string;
  altText?: string;
  order: number;
}

export interface UploadMetadata {
  title?: string;
  caption?: string;
  postedTimestamp?: number;
  happenedOnDate?: string;
  tags?: string[];
  scrollStyle?: 'carousel' | 'longForm';
}

export interface UploadState {
  step: UploadStep;
  images: UploadImage[];
  metadata: UploadMetadata;
  selectedThumbnailIndex: number;
}

const STORAGE_KEY = 'comic-upload-draft';

export const initialUploadState: UploadState = {
  step: 'files',
  images: [],
  metadata: {
    postedTimestamp: Date.now(),
    scrollStyle: 'carousel',
    tags: [],
  },
  selectedThumbnailIndex: 0,
};

/**
 * Save upload state to localStorage
 */
export function saveUploadDraft(state: UploadState): void {
  try {
    // Don't save file objects or preview URLs (too large for localStorage)
    const draftState = {
      step: state.step,
      metadata: state.metadata,
      selectedThumbnailIndex: state.selectedThumbnailIndex,
      imageCount: state.images.length,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftState));
  } catch (error) {
    console.error('Failed to save upload draft:', error);
  }
}

/**
 * Load upload state from localStorage
 * Note: Images cannot be restored from localStorage
 */
export function loadUploadDraft(): Partial<UploadState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const draft = JSON.parse(stored);
    return {
      metadata: draft.metadata,
      selectedThumbnailIndex: draft.selectedThumbnailIndex,
    };
  } catch (error) {
    console.error('Failed to load upload draft:', error);
    return null;
  }
}

/**
 * Clear upload draft from localStorage
 */
export function clearUploadDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear upload draft:', error);
  }
}

/**
 * Validate that we can proceed to the next step
 */
export function canProceedToNextStep(state: UploadState): { canProceed: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (state.step) {
    case 'files':
      if (state.images.length === 0) {
        errors.push('Please select at least one image');
      }
      if (state.images.length > 20) {
        errors.push('Maximum 20 images allowed per comic');
      }
      break;

    case 'metadata':
      if (!state.metadata.title?.trim()) {
        errors.push('Title is required');
      }
      if (state.metadata.title && state.metadata.title.length > 200) {
        errors.push('Title must be 200 characters or less');
      }
      if (state.metadata.caption && state.metadata.caption.length > 10000) {
        errors.push('Caption must be 10,000 characters or less');
      }
      if (state.metadata.tags && state.metadata.tags.length > 20) {
        errors.push('Maximum 20 tags allowed');
      }
      break;

    case 'reorder':
      // No validation needed - this step is optional
      break;

    case 'publish':
      // Final validation before upload
      if (state.images.length === 0) {
        errors.push('No images to upload');
      }
      if (!state.metadata.title?.trim()) {
        errors.push('Title is required');
      }
      break;
  }

  return {
    canProceed: errors.length === 0,
    errors,
  };
}

/**
 * Get the next step in the workflow
 */
export function getNextStep(currentStep: UploadStep): UploadStep | null {
  const steps: UploadStep[] = ['files', 'metadata', 'reorder', 'publish'];
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex < steps.length - 1) {
    return steps[currentIndex + 1];
  }
  return null;
}

/**
 * Get the previous step in the workflow
 */
export function getPreviousStep(currentStep: UploadStep): UploadStep | null {
  const steps: UploadStep[] = ['files', 'metadata', 'reorder', 'publish'];
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex > 0) {
    return steps[currentIndex - 1];
  }
  return null;
}

/**
 * Get step label for display
 */
export function getStepLabel(step: UploadStep): string {
  const labels: Record<UploadStep, string> = {
    files: 'Select Images',
    metadata: 'Add Details',
    reorder: 'Arrange Panels',
    publish: 'Review & Publish',
  };
  return labels[step];
}

/**
 * Get step number (1-indexed)
 */
export function getStepNumber(step: UploadStep): number {
  const steps: UploadStep[] = ['files', 'metadata', 'reorder', 'publish'];
  return steps.indexOf(step) + 1;
}
