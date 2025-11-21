/**
 * React Hook for S3 Upload
 * Provides upload functionality with progress tracking for React components
 */

import { useState, useCallback, useRef } from 'react';
import {
  uploadMultipleFiles,
  UploadProgress,
  formatBytes,
  calculateTimeRemaining,
} from '../utils/s3Upload';

export interface UseS3UploadOptions {
  apiEndpoint: string;
  authToken: string;
  concurrency?: number;
  onSuccess?: (s3Keys: string[]) => void;
  onError?: (error: Error) => void;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: Map<number, UploadProgress>;
  overallProgress: number;
  error: Error | null;
  s3Keys: string[] | null;
  startTime: number | null;
}

export function useS3Upload(options: UseS3UploadOptions) {
  const { apiEndpoint, authToken, concurrency = 3, onSuccess, onError } = options;

  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: new Map(),
    overallProgress: 0,
    error: null,
    s3Keys: null,
    startTime: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Calculate overall upload progress
   */
  const calculateOverallProgress = useCallback((progressMap: Map<number, UploadProgress>) => {
    if (progressMap.size === 0) return 0;

    let totalLoaded = 0;
    let totalSize = 0;

    progressMap.forEach((progress) => {
      totalLoaded += progress.loaded;
      totalSize += progress.total;
    });

    return totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0;
  }, []);

  /**
   * Upload files to S3
   */
  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        throw new Error('No files to upload');
      }

      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Initialize progress map
      const initialProgress = new Map<number, UploadProgress>();
      files.forEach((file, index) => {
        initialProgress.set(index, {
          fileName: file.name,
          loaded: 0,
          total: file.size,
          percentage: 0,
          status: 'pending',
        });
      });

      setState({
        isUploading: true,
        progress: initialProgress,
        overallProgress: 0,
        error: null,
        s3Keys: null,
        startTime: Date.now(),
      });

      try {
        const s3Keys = await uploadMultipleFiles(
          files,
          apiEndpoint,
          authToken,
          (fileIndex, progress) => {
            setState((prev) => {
              const newProgress = new Map(prev.progress);
              newProgress.set(fileIndex, progress);
              const overallProgress = calculateOverallProgress(newProgress);

              return {
                ...prev,
                progress: newProgress,
                overallProgress,
              };
            });
          },
          concurrency,
          abortControllerRef.current.signal
        );

        setState((prev) => ({
          ...prev,
          isUploading: false,
          s3Keys,
          overallProgress: 100,
        }));

        onSuccess?.(s3Keys);
        return s3Keys;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');

        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: err,
        }));

        onError?.(err);
        throw err;
      }
    },
    [apiEndpoint, authToken, concurrency, onSuccess, onError, calculateOverallProgress]
  );

  /**
   * Cancel ongoing upload
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: new Map(),
      overallProgress: 0,
      error: null,
      s3Keys: null,
      startTime: null,
    });
    abortControllerRef.current = null;
  }, []);

  /**
   * Get formatted progress information for a specific file
   */
  const getFileProgress = useCallback(
    (fileIndex: number) => {
      const progress = state.progress.get(fileIndex);
      if (!progress) return null;

      return {
        ...progress,
        loadedFormatted: formatBytes(progress.loaded),
        totalFormatted: formatBytes(progress.total),
        timeRemaining:
          state.startTime && progress.status === 'uploading'
            ? calculateTimeRemaining(progress.loaded, progress.total, state.startTime)
            : null,
      };
    },
    [state.progress, state.startTime]
  );

  /**
   * Get overall upload statistics
   */
  const getOverallStats = useCallback(() => {
    let totalFiles = state.progress.size;
    let completedFiles = 0;
    let failedFiles = 0;
    let uploadingFiles = 0;
    let totalLoaded = 0;
    let totalSize = 0;

    state.progress.forEach((progress) => {
      totalLoaded += progress.loaded;
      totalSize += progress.total;

      if (progress.status === 'success') completedFiles++;
      else if (progress.status === 'error') failedFiles++;
      else if (progress.status === 'uploading') uploadingFiles++;
    });

    return {
      totalFiles,
      completedFiles,
      failedFiles,
      uploadingFiles,
      pendingFiles: totalFiles - completedFiles - failedFiles - uploadingFiles,
      totalLoadedFormatted: formatBytes(totalLoaded),
      totalSizeFormatted: formatBytes(totalSize),
      overallPercentage: state.overallProgress,
      timeRemaining:
        state.startTime && state.isUploading
          ? calculateTimeRemaining(totalLoaded, totalSize, state.startTime)
          : null,
      isComplete: completedFiles === totalFiles && totalFiles > 0,
      hasErrors: failedFiles > 0,
    };
  }, [state.progress, state.overallProgress, state.isUploading, state.startTime]);

  return {
    // State
    isUploading: state.isUploading,
    progress: state.progress,
    overallProgress: state.overallProgress,
    error: state.error,
    s3Keys: state.s3Keys,

    // Methods
    upload,
    cancel,
    reset,

    // Helpers
    getFileProgress,
    getOverallStats,
  };
}
