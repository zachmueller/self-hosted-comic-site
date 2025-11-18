/**
 * Comic entity type matching DynamoDB schema
 */
export interface Comic {
  // Primary keys
  id: string // UUID
  postedTimestamp: string // ISO 8601 timestamp

  // Required metadata
  title: string
  slug: string // URL-friendly version of title
  scrollStyle: 'carousel' | 'longForm'

  // Optional metadata
  caption?: string
  happenedOnDate?: string // ISO 8601 date
  tags?: string[]

  // Image data
  images: ComicImage[]
  thumbnailIndex: number // Index of image to use as thumbnail (default 0)

  // Relationships
  derivedRelationships?: DerivedRelationship[]
}

/**
 * Individual comic image
 */
export interface ComicImage {
  key: string // S3 key for the image
  altText?: string // Optional accessibility text
  order: number // Display order (0-indexed)
}

/**
 * Derived relationship between comics
 */
export interface DerivedRelationship {
  targetComicId: string
  sourceType: 'caption' | 'series' | 'tag'
  context?: string // For caption references, the surrounding text
}

/**
 * Comic with resolved relationships (for display)
 */
export interface ComicWithRelationships extends Comic {
  relatedComics: RelatedComic[]
}

/**
 * Related comic reference
 */
export interface RelatedComic {
  id: string
  title: string
  slug: string
  thumbnailUrl: string
  sourceType: 'caption' | 'series' | 'tag'
  context?: string
}

/**
 * Comic list item (for grid display)
 */
export interface ComicListItem {
  id: string
  title: string
  slug: string
  postedTimestamp: string
  thumbnailUrl: string
  tags?: string[]
}

/**
 * Upload draft state (stored in localStorage)
 */
export interface ComicDraft {
  title?: string
  caption?: string
  happenedOnDate?: string
  tags?: string[]
  scrollStyle?: 'carousel' | 'longForm'
  images?: File[]
  thumbnailIndex?: number
  altTexts?: Record<number, string>
}
