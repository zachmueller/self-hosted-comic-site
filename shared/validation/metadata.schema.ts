/**
 * Zod validation schemas for comic metadata (shared between client and server)
 */

import { z } from 'zod'

/**
 * UUID v4 validation pattern
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Slug validation pattern (lowercase, numbers, hyphens)
 */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Tag validation pattern (letters, numbers, spaces, hyphens, underscores)
 */
const TAG_REGEX = /^[a-zA-Z0-9\s\-_]+$/

/**
 * S3 key validation pattern
 */
const S3_KEY_REGEX = /^[a-zA-Z0-9/_.-]+$/

/**
 * Hex color validation pattern
 */
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

/**
 * UUID v4 schema
 */
export const uuidSchema = z
  .string()
  .regex(UUID_V4_REGEX, 'Must be a valid UUID v4')

/**
 * Slug schema (URL-safe identifier)
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug cannot exceed 100 characters')
  .regex(
    SLUG_REGEX,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  )

/**
 * Title schema
 */
export const titleSchema = z
  .string()
  .min(1, 'Title cannot be empty')
  .max(200, 'Title cannot exceed 200 characters')

/**
 * Caption schema
 */
export const captionSchema = z.string().min(1, 'Caption cannot be empty')

/**
 * ISO 8601 date schema (YYYY-MM-DD)
 */
export const isoDateSchema = z.string().refine(
  (date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(date)
  },
  { message: 'Must be a valid ISO 8601 date (YYYY-MM-DD)' }
)

/**
 * ISO 8601 datetime schema with timezone
 */
export const isoDateTimeSchema = z.string().refine(
  (datetime) => {
    const parsed = new Date(datetime)
    return !isNaN(parsed.getTime())
  },
  { message: 'Must be a valid ISO 8601 datetime' }
)

/**
 * Tag schema
 */
export const tagSchema = z
  .string()
  .min(1, 'Tag cannot be empty')
  .max(100, 'Tag cannot exceed 100 characters')
  .regex(TAG_REGEX, 'Tag must contain only letters, numbers, spaces, hyphens, or underscores')
  .transform((tag) => tag.toLowerCase().trim())

/**
 * Tags array schema (0-50 unique tags)
 */
export const tagsArraySchema = z
  .array(tagSchema)
  .max(50, 'Cannot exceed 50 tags')
  .refine((tags) => new Set(tags).size === tags.length, {
    message: 'Tags must be unique',
  })
  .optional()

/**
 * Scroll style schema
 */
export const scrollStyleSchema = z.enum(['carousel', 'longForm'], {
  message: 'Scroll style must be "carousel" or "longForm"',
})

/**
 * S3 key schema
 */
export const s3KeySchema = z
  .string()
  .min(1, 'S3 key cannot be empty')
  .max(1024, 'S3 key cannot exceed 1024 characters')
  .regex(S3_KEY_REGEX, 'S3 key must contain only letters, numbers, /, _, ., or -')

/**
 * Alt text schema (optional, max 500 chars)
 */
export const altTextSchema = z
  .string()
  .max(500, 'Alt text cannot exceed 500 characters')
  .optional()

/**
 * Hex color schema
 */
export const hexColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, 'Must be a valid hex color (e.g., #FF5733)')

/**
 * Comic image schema
 */
export const comicImageSchema = z.object({
  key: s3KeySchema,
  altText: altTextSchema,
  order: z.number().int().nonnegative('Order must be a non-negative integer'),
})

/**
 * Images array schema (1-20 images required)
 */
export const imagesArraySchema = z
  .array(comicImageSchema)
  .min(1, 'At least one image is required')
  .max(20, 'Cannot exceed 20 images')

/**
 * Thumbnail index schema
 */
export const thumbnailIndexSchema = z
  .number()
  .int()
  .nonnegative('Thumbnail index must be non-negative')

/**
 * Derived relationship schema
 */
export const derivedRelationshipSchema = z.object({
  targetComicId: uuidSchema,
  sourceType: z.enum(['caption', 'series', 'tag']),
  context: z.string().optional(),
})

/**
 * Color palette schema
 */
export const colorPaletteSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  highlight: hexColorSchema,
  text: hexColorSchema,
  textSecondary: hexColorSchema,
})
