/**
 * API request and response types for comic site
 */

import { Comic, ComicListItem, ComicWithRelationships } from './comic';

/**
 * Request to upload a new comic
 */
export interface UploadComicRequest {
  title: string;
  caption: string;
  happenedOnDate: string; // ISO 8601 date
  postedTimestamp: string; // ISO 8601 datetime
  tags?: string[];
  scrollStyle: 'carousel' | 'longForm';
  images: UploadImageMetadata[];
  thumbnailIndex: number;
}

/**
 * Image metadata for upload
 */
export interface UploadImageMetadata {
  s3Key: string; // S3 key after presigned URL upload
  altText?: string;
  order: number;
}

/**
 * Response from comic upload
 */
export interface UploadComicResponse {
  id: string;
  slug: string;
  message: string;
}

/**
 * Request for presigned URL generation
 */
export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

/**
 * Response with presigned URL for S3 upload
 */
export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresIn: number; // seconds
}

/**
 * Response for paginated comic list
 */
export interface GetComicsResponse {
  items: ComicListItem[];
  page: number;
  hasNextPage: boolean;
  tag?: string; // If filtered by tag
}

/**
 * Query parameters for getting comics
 */
export interface GetComicsParams {
  page?: number;
  tag?: string;
}

/**
 * Response for single comic with relationships
 */
export interface GetComicResponse {
  comic: ComicWithRelationships;
}

/**
 * Search request for comic title autocomplete
 */
export interface SearchTitlesRequest {
  query: string;
  limit?: number;
}

/**
 * Search result item for autocomplete
 */
export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  happenedOnDate?: string;
}

/**
 * Response for title search
 */
export interface SearchTitlesResponse {
  results: SearchResult[];
}

/**
 * Request to update site configuration
 */
export interface UpdateConfigRequest {
  colorPalette: ColorPalette;
}

/**
 * Response from config update
 */
export interface UpdateConfigResponse {
  success: boolean;
  message: string;
}

/**
 * Color palette configuration
 */
export interface ColorPalette {
  primary: string; // Hex color
  secondary: string; // Hex color
  highlight: string; // Hex color
  text: string; // Hex color
  textSecondary: string; // Hex color
}

/**
 * Response for getting site configuration
 */
export interface GetConfigResponse {
  colorPalette: ColorPalette;
}

/**
 * Standard error response
 */
export interface ApiError {
  error: string;
  details?: string;
  timestamp: string;
}

/**
 * API client configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}
