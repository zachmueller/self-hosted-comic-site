/**
 * Central export file for all TypeScript types
 */

// Comic types
export type {
  Comic,
  ComicImage,
  DerivedRelationship,
  ComicWithRelationships,
  RelatedComic,
  ComicListItem,
  ComicDraft,
} from './comic';

// API types
export type {
  UploadComicRequest,
  UploadImageMetadata,
  UploadComicResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
  GetComicsResponse,
  GetComicsParams,
  GetComicResponse,
  SearchTitlesRequest,
  SearchResult,
  SearchTitlesResponse,
  UpdateConfigRequest,
  UpdateConfigResponse,
  GetConfigResponse,
  ApiError,
  ApiConfig,
} from './api';

// Re-export ColorPalette from api.ts for convenience
export type { ColorPalette } from './api';

// Configuration types
export type {
  CognitoConfig,
  S3Config,
  ApiEndpointConfig,
  CloudFrontConfig,
  AppConfig,
  CacheConfig,
  SiteConfig,
} from './config';

// Export constants from config
export { DEFAULT_COLOR_PALETTE, ENV_KEYS, DEFAULT_CACHE_CONFIG } from './config';
