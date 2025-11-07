/**
 * TypeScript interface definitions for the Self-Hosted Comic Site
 * Generated from data-schemas.json
 */

/**
 * S3 object representing a comic image
 */
export interface ComicImage {
  /** S3 object key for the image */
  key: string;
  /** Accessibility description for the image */
  altText?: string;
  /** Display order (defaults to array index) */
  order?: number;
}

/**
 * External integration configuration
 */
export interface Integration {
  /** Type of integration */
  type: 'social' | 'analytics' | 'syndication';
  /** Whether this integration is enabled */
  use: boolean;
  /** Integration-specific configuration */
  config?: Record<string, any>;
}

/**
 * Complete comic metadata with all fields
 */
export interface Comic {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Comic title (1-200 characters) */
  title: string;
  /** URL-safe unique identifier */
  slug: string;
  /** Comic description or text content */
  caption: string;
  /** Array of comic images (1-20 items) */
  images: ComicImage[];
  /** Optional tags for categorization (max 50 items) */
  tags?: string[];
  /** Date when the comic events occurred (ISO 8601) */
  happenedOnDate: string;
  /** When the comic was posted (ISO 8601) */
  postedTimestamp: string;
  /** Display style for the comic */
  scrollStyle?: 'long' | 'standard';
  /** External integrations configuration */
  integrations?: Integration[];
  /** When the comic was uploaded (ISO 8601, auto-generated) */
  uploadDate: string;
}

/**
 * Comic metadata for upload (excludes auto-generated fields)
 */
export interface UploadMetadata {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Comic title (1-200 characters) */
  title: string;
  /** URL-safe unique identifier */
  slug: string;
  /** Comic description or text content */
  caption: string;
  /** Array of comic images (1-20 items) */
  images: ComicImage[];
  /** Optional tags for categorization (max 50 items) */
  tags?: string[];
  /** Date when the comic events occurred (ISO 8601) */
  happenedOnDate: string;
  /** When the comic was posted (ISO 8601) */
  postedTimestamp: string;
  /** Display style for the comic */
  scrollStyle?: 'long' | 'standard';
  /** External integrations configuration */
  integrations?: Integration[];
}

/**
 * API response for comic listing endpoints
 */
export interface ComicsResponse {
  /** Array of comics */
  items: Comic[];
  /** Current page number (1-indexed) */
  page: number;
  /** Whether more pages are available */
  hasNextPage: boolean;
  /** Tag filter applied (if any) */
  tag?: string;
}

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  /** Error message or code */
  error: string;
  /** Additional error details */
  details?: string;
  /** When the error occurred (ISO 8601) */
  timestamp: string;
}

/**
 * Application configuration schema
 */
export interface AppConfig {
  /** Cognito User Pool ID */
  userPoolId: string;
  /** Cognito App Client ID */
  clientId: string;
  /** Cognito Identity Pool ID */
  identityPoolId: string;
  /** AWS region */
  region: string;
  /** S3 bucket name */
  bucketName: string;
  /** Cognito domain for authentication */
  cognitoDomain: string;
}

/**
 * Cache configuration settings
 */
export interface CacheConfig {
  /** Number of comics per page (1-100, default: 10) */
  pageSize: number;
  /** Cache TTL in minutes (1-10080, default: 60) */
  ttl: number;
  /** CloudFront paths to invalidate on updates */
  invalidationPaths: string[];
}

/**
 * Result of data validation operations
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Array of validation warnings */
  warnings?: string[];
}

/**
 * Type guards for runtime type checking
 */

export function isComicImage(obj: any): obj is ComicImage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.key === 'string' &&
    obj.key.length > 0 &&
    (obj.altText === undefined || typeof obj.altText === 'string') &&
    (obj.order === undefined || (typeof obj.order === 'number' && obj.order >= 0))
  );
}

export function isIntegration(obj: any): obj is Integration {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ['social', 'analytics', 'syndication'].includes(obj.type) &&
    typeof obj.use === 'boolean'
  );
}

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  return uuidRegex.test(id);
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 100;
}

export function isValidTag(tag: string): boolean {
  const tagRegex = /^[a-zA-Z0-9\s-_]+$/;
  return tagRegex.test(tag) && tag.length >= 1 && tag.length <= 100;
}

export function isValidISO8601Date(date: string): boolean {
  try {
    const parsed = new Date(date);
    return parsed.toISOString().startsWith(date.split('T')[0]);
  } catch {
    return false;
  }
}

export function isValidISO8601DateTime(datetime: string): boolean {
  try {
    const parsed = new Date(datetime);
    return parsed.toISOString() === datetime;
  } catch {
    return false;
  }
}

/**
 * Utility functions for data manipulation
 */

export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase();
}

export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Constants for validation
 */
export const VALIDATION_CONSTANTS = {
  COMIC: {
    TITLE_MIN_LENGTH: 1,
    TITLE_MAX_LENGTH: 200,
    SLUG_MIN_LENGTH: 1,
    SLUG_MAX_LENGTH: 100,
    IMAGES_MIN: 1,
    IMAGES_MAX: 20,
    TAGS_MAX: 50,
    TAG_MAX_LENGTH: 100,
  },
  S3: {
    KEY_MAX_LENGTH: 1024,
    ALT_TEXT_MAX_LENGTH: 500,
  },
  CONFIG: {
    CLIENT_ID_MIN_LENGTH: 20,
    CLIENT_ID_MAX_LENGTH: 30,
    BUCKET_NAME_MIN_LENGTH: 3,
    BUCKET_NAME_MAX_LENGTH: 63,
  },
  CACHE: {
    PAGE_SIZE_MIN: 1,
    PAGE_SIZE_MAX: 100,
    TTL_MIN: 1,
    TTL_MAX: 10080, // 1 week in minutes
  },
} as const;

/**
 * Default values
 */
export const DEFAULT_VALUES = {
  SCROLL_STYLE: 'standard' as const,
  PAGE_SIZE: 10,
  CACHE_TTL: 60, // 1 hour
} as const;

/**
 * Error codes for validation failures
 */
export enum ValidationErrorCode {
  INVALID_UUID = 'INVALID_UUID',
  INVALID_TITLE = 'INVALID_TITLE',
  INVALID_SLUG = 'INVALID_SLUG',
  INVALID_CAPTION = 'INVALID_CAPTION',
  INVALID_IMAGES = 'INVALID_IMAGES',
  INVALID_TAG = 'INVALID_TAG',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_DATETIME = 'INVALID_DATETIME',
  INVALID_SCROLL_STYLE = 'INVALID_SCROLL_STYLE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  FIELD_TOO_LONG = 'FIELD_TOO_LONG',
  FIELD_TOO_SHORT = 'FIELD_TOO_SHORT',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DUPLICATE_VALUES = 'DUPLICATE_VALUES',
}
