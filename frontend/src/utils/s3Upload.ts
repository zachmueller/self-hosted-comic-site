/**
 * S3 Upload Utilities
 * Handles direct browser-to-S3 uploads using presigned URLs
 */

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';
  error?: string;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  s3Key: string;
  expiresIn: number;
  fields: {
    'Content-Type': string;
  };
}

/**
 * Request a presigned URL from the Lambda function
 */
export async function requestPresignedUrl(
  file: File,
  apiEndpoint: string,
  authToken: string
): Promise<PresignedUrlResponse> {
  const response = await fetch(`${apiEndpoint}/generate-presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get presigned URL');
  }

  return response.json();
}

/**
 * Upload a file directly to S3 using a presigned URL
 */
export async function uploadToS3(
  file: File,
  presignedUrl: string,
  contentType: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
    }

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = (event.loaded / event.total) * 100;
        onProgress(percentage);
      }
    });

    // Handle successful upload
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Start upload
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

/**
 * Upload a single file with retry logic
 */
export async function uploadFileWithRetry(
  file: File,
  apiEndpoint: string,
  authToken: string,
  onProgress?: (progress: UploadProgress) => void,
  maxRetries = 3,
  signal?: AbortSignal
): Promise<string> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check if cancelled
      if (signal?.aborted) {
        throw new Error('Upload cancelled');
      }

      // Update status
      onProgress?.({
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: attempt === 0 ? 'pending' : 'uploading',
      });

      // Get presigned URL
      const { presignedUrl, s3Key, fields } = await requestPresignedUrl(
        file,
        apiEndpoint,
        authToken
      );

      // Update status to uploading
      onProgress?.({
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading',
      });

      // Upload to S3
      await uploadToS3(
        file,
        presignedUrl,
        fields['Content-Type'],
        (percentage) => {
          onProgress?.({
            fileName: file.name,
            loaded: (file.size * percentage) / 100,
            total: file.size,
            percentage,
            status: 'uploading',
          });
        },
        signal
      );

      // Success
      onProgress?.({
        fileName: file.name,
        loaded: file.size,
        total: file.size,
        percentage: 100,
        status: 'success',
      });

      return s3Key;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry if cancelled or if it's an auth error
      if (
        signal?.aborted ||
        lastError.message.includes('Unauthorized') ||
        lastError.message.includes('cancelled')
      ) {
        onProgress?.({
          fileName: file.name,
          loaded: 0,
          total: file.size,
          percentage: 0,
          status: 'cancelled',
          error: lastError.message,
        });
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  const error = lastError || new Error('Upload failed after retries');
  onProgress?.({
    fileName: file.name,
    loaded: 0,
    total: file.size,
    percentage: 0,
    status: 'error',
    error: error.message,
  });
  throw error;
}

/**
 * Upload multiple files concurrently with a concurrency limit
 */
export async function uploadMultipleFiles(
  files: File[],
  apiEndpoint: string,
  authToken: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void,
  concurrency = 3,
  signal?: AbortSignal
): Promise<string[]> {
  const results: string[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  // Create a queue of upload tasks
  const queue = files.map((file, index) => ({ file, index }));
  const inProgress = new Set<Promise<void>>();

  while (queue.length > 0 || inProgress.size > 0) {
    // Check if cancelled
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    // Start new uploads up to concurrency limit
    while (queue.length > 0 && inProgress.size < concurrency) {
      const item = queue.shift()!;
      const { file, index } = item;

      const uploadPromise = uploadFileWithRetry(
        file,
        apiEndpoint,
        authToken,
        (progress) => onProgress?.(index, progress),
        3,
        signal
      )
        .then((s3Key) => {
          results[index] = s3Key;
        })
        .catch((error) => {
          errors.push({ index, error });
        })
        .finally(() => {
          inProgress.delete(uploadPromise);
        });

      inProgress.add(uploadPromise);
    }

    // Wait for at least one upload to complete
    if (inProgress.size > 0) {
      await Promise.race(inProgress);
    }
  }

  // If any uploads failed, throw an error
  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => `File ${e.index + 1}: ${e.error.message}`)
      .join('; ');
    throw new Error(`Upload failed for ${errors.length} file(s): ${errorMessages}`);
  }

  return results;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate estimated time remaining
 */
export function calculateTimeRemaining(
  loaded: number,
  total: number,
  startTime: number
): string {
  const elapsed = Date.now() - startTime;
  const rate = loaded / elapsed; // bytes per millisecond
  const remaining = total - loaded;
  const estimatedMs = remaining / rate;

  if (!isFinite(estimatedMs) || estimatedMs < 0) {
    return 'Calculating...';
  }

  const seconds = Math.floor(estimatedMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
