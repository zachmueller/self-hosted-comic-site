/**
 * Central export file for all Zod validation schemas
 */

// Export all metadata schemas
export {
  uuidSchema,
  slugSchema,
  titleSchema,
  captionSchema,
  isoDateSchema,
  isoDateTimeSchema,
  tagSchema,
  tagsArraySchema,
  scrollStyleSchema,
  s3KeySchema,
  altTextSchema,
  hexColorSchema,
  comicImageSchema,
  imagesArraySchema,
  thumbnailIndexSchema,
  derivedRelationshipSchema,
  colorPaletteSchema,
  uploadFileSchema,
  uploadFilesArraySchema,
} from './metadata.schema'

// Export all comic schemas
export {
  comicSchema,
  comicListItemSchema,
  relatedComicSchema,
  comicWithRelationshipsSchema,
  comicDraftSchema,
  uploadComicRequestSchema,
  uploadComicResponseSchema,
  presignedUrlRequestSchema,
  presignedUrlResponseSchema,
  getComicsParamsSchema,
  getComicsResponseSchema,
  getComicResponseSchema,
  searchTitlesRequestSchema,
  searchResultSchema,
  searchTitlesResponseSchema,
  updateConfigRequestSchema,
  updateConfigResponseSchema,
  getConfigResponseSchema,
  apiErrorSchema,
  referencePattern,
  parseReferences,
  validateReferences,
} from './comic.schema'
