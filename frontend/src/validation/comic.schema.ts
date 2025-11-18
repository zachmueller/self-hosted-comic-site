/**
 * Zod validation schemas for Comic entities and API operations
 */

import { z } from 'zod'
import {
  uuidSchema,
  slugSchema,
  titleSchema,
  captionSchema,
  isoDateSchema,
  isoDateTimeSchema,
  tagsArraySchema,
  scrollStyleSchema,
  imagesArraySchema,
  thumbnailIndexSchema,
  derivedRelationshipSchema,
  colorPaletteSchema,
  uploadFilesArraySchema,
  s3KeySchema,
  altTextSchema,
} from './metadata.schema'

/**
 * Complete Comic entity schema
 */
export const comicSchema = z.object({
  id: uuidSchema,
  postedTimestamp: isoDateTimeSchema,
  title: titleSchema,
  slug: slugSchema,
  scrollStyle: scrollStyleSchema,
  caption: captionSchema.optional(),
  happenedOnDate: isoDateSchema.optional(),
  tags: tagsArraySchema,
  images: imagesArraySchema,
  thumbnailIndex: thumbnailIndexSchema,
  derivedRelationships: z.array(derivedRelationshipSchema).optional(),
})

/**
 * Comic list item schema (minimal data for grid display)
 */
export const comicListItemSchema = z.object({
  id: uuidSchema,
  title: titleSchema,
  slug: slugSchema,
  postedTimestamp: isoDateTimeSchema,
  thumbnailUrl: z.string().url('Must be a valid URL'),
  tags: tagsArraySchema,
})

/**
 * Related comic reference schema
 */
export const relatedComicSchema = z.object({
  id: uuidSchema,
  title: titleSchema,
  slug: slugSchema,
  thumbnailUrl: z.string().url('Must be a valid URL'),
  sourceType: z.enum(['caption', 'series', 'tag']),
  context: z.string().optional(),
})

/**
 * Comic with relationships schema (for single comic display)
 */
export const comicWithRelationshipsSchema = comicSchema.extend({
  relatedComics: z.array(relatedComicSchema),
})

/**
 * Comic draft schema (for localStorage persistence)
 */
export const comicDraftSchema = z.object({
  title: titleSchema.optional(),
  caption: captionSchema.optional(),
  happenedOnDate: isoDateSchema.optional(),
  tags: tagsArraySchema,
  scrollStyle: scrollStyleSchema.optional(),
  images: uploadFilesArraySchema.optional(),
  thumbnailIndex: thumbnailIndexSchema.optional(),
  altTexts: z.record(z.number(), z.string().max(500)).optional(),
})

/**
 * Upload comic request schema
 */
export const uploadComicRequestSchema = z.object({
  title: titleSchema,
  caption: captionSchema,
  happenedOnDate: isoDateSchema,
  postedTimestamp: isoDateTimeSchema,
  tags: tagsArraySchema,
  scrollStyle: scrollStyleSchema,
  images: z.array(
    z.object({
      s3Key: s3KeySchema,
      altText: altTextSchema,
      order: z.number().int().nonnegative(),
    })
  ).min(1).max(20),
  thumbnailIndex: thumbnailIndexSchema,
})

/**
 * Upload comic response schema
 */
export const uploadComicResponseSchema = z.object({
  id: uuidSchema,
  slug: slugSchema,
  message: z.string(),
})

/**
 * Presigned URL request schema
 */
export const presignedUrlRequestSchema = z.object({
  fileName: z.string().min(1, 'File name cannot be empty'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    message: 'Content type must be image/jpeg, image/png, or image/webp',
  }),
  fileSize: z
    .number()
    .int()
    .positive('File size must be positive')
    .max(20 * 1024 * 1024, 'File size cannot exceed 20MB'),
})

/**
 * Presigned URL response schema
 */
export const presignedUrlResponseSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  key: s3KeySchema,
  expiresIn: z.number().int().positive('Expiration must be positive'),
})

/**
 * Get comics query parameters schema
 */
export const getComicsParamsSchema = z.object({
  page: z.number().int().positive('Page must be positive').optional(),
  tag: z.string().min(1).max(100).optional(),
})

/**
 * Get comics response schema
 */
export const getComicsResponseSchema = z.object({
  items: z.array(comicListItemSchema),
  page: z.number().int().positive('Page must be positive'),
  hasNextPage: z.boolean(),
  tag: z.string().optional(),
})

/**
 * Get single comic response schema
 */
export const getComicResponseSchema = z.object({
  comic: comicWithRelationshipsSchema,
})

/**
 * Search titles request schema
 */
export const searchTitlesRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  limit: z.number().int().positive().max(50).optional(),
})

/**
 * Search result schema
 */
export const searchResultSchema = z.object({
  id: uuidSchema,
  title: titleSchema,
  slug: slugSchema,
  happenedOnDate: isoDateSchema.optional(),
})

/**
 * Search titles response schema
 */
export const searchTitlesResponseSchema = z.object({
  results: z.array(searchResultSchema),
})

/**
 * Update config request schema
 */
export const updateConfigRequestSchema = z.object({
  colorPalette: colorPaletteSchema,
})

/**
 * Update config response schema
 */
export const updateConfigResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

/**
 * Get config response schema
 */
export const getConfigResponseSchema = z.object({
  colorPalette: colorPaletteSchema,
})

/**
 * API error response schema
 */
export const apiErrorSchema = z.object({
  error: z.string().min(1, 'Error message cannot be empty'),
  details: z.string().optional(),
  timestamp: isoDateTimeSchema,
})

/**
 * Reference syntax validation for Obsidian-style links
 * Matches [[Title]] or [[Title|Alias]] patterns
 */
export const referencePattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

/**
 * Parse caption for reference syntax
 */
export function parseReferences(caption: string): Array<{
  fullMatch: string
  title: string
  alias?: string
  index: number
}> {
  const references: Array<{
    fullMatch: string
    title: string
    alias?: string
    index: number
  }> = []
  
  let match: RegExpExecArray | null
  
  while ((match = referencePattern.exec(caption)) !== null) {
    references.push({
      fullMatch: match[0],
      title: match[1].trim(),
      alias: match[2]?.trim(),
      index: match.index,
    })
  }
  
  return references
}

/**
 * Validate that references in caption can be resolved
 * This would typically call the search API to verify titles exist
 */
export function validateReferences(
  references: Array<{ title: string }>
): z.ZodType<Array<{ title: string; exists: boolean }>> {
  return z.array(
    z.object({
      title: z.string(),
      exists: z.boolean(),
    })
  )
}
