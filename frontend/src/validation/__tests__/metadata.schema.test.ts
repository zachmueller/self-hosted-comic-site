import { describe, it, expect } from 'vitest'
import {
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
} from '../metadata.schema'

describe('uuidSchema', () => {
  it('should validate valid UUID v4', () => {
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      '123e4567-e89b-42d3-a456-426614174000',
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    ]
    validUUIDs.forEach((uuid) => {
      const result = uuidSchema.safeParse(uuid)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid UUID format', () => {
    const invalidUUIDs = [
      'not-a-uuid',
      '550e8400-e29b-31d4-a716-446655440000', // wrong version (3 instead of 4)
      '550e8400e29b41d4a716446655440000', // missing dashes
      '550e8400-e29b-41d4-a716', // incomplete
    ]
    invalidUUIDs.forEach((uuid) => {
      const result = uuidSchema.safeParse(uuid)
      expect(result.success).toBe(false)
    })
  })
})

describe('slugSchema', () => {
  it('should validate valid slugs', () => {
    const validSlugs = [
      'my-first-comic',
      'adventure-in-space',
      'comic-123',
      'a',
      'test-slug-with-many-hyphens',
    ]
    validSlugs.forEach((slug) => {
      const result = slugSchema.safeParse(slug)
      expect(result.success).toBe(true)
    })
  })

  it('should reject slugs with uppercase letters', () => {
    const result = slugSchema.safeParse('My-Comic')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('lowercase')
    }
  })

  it('should reject slugs with special characters', () => {
    const invalidSlugs = [
      'comic_with_underscore',
      'comic@special',
      'comic#hash',
      'comic with spaces',
    ]
    invalidSlugs.forEach((slug) => {
      const result = slugSchema.safeParse(slug)
      expect(result.success).toBe(false)
    })
  })

  it('should reject empty slug', () => {
    const result = slugSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('should reject slug exceeding 100 characters', () => {
    const longSlug = 'a'.repeat(101)
    const result = slugSchema.safeParse(longSlug)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100')
    }
  })
})

describe('titleSchema', () => {
  it('should validate valid titles', () => {
    const validTitles = ['My Comic', 'A', 'Title with numbers 123', 'Special!@# Title']
    validTitles.forEach((title) => {
      const result = titleSchema.safeParse(title)
      expect(result.success).toBe(true)
    })
  })

  it('should reject empty title', () => {
    const result = titleSchema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('empty')
    }
  })

  it('should reject title exceeding 200 characters', () => {
    const longTitle = 'a'.repeat(201)
    const result = titleSchema.safeParse(longTitle)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('200')
    }
  })

  it('should validate title at exactly 200 characters', () => {
    const maxTitle = 'a'.repeat(200)
    const result = titleSchema.safeParse(maxTitle)
    expect(result.success).toBe(true)
  })
})

describe('captionSchema', () => {
  it('should validate non-empty caption', () => {
    const result = captionSchema.safeParse('This is a caption')
    expect(result.success).toBe(true)
  })

  it('should reject empty caption', () => {
    const result = captionSchema.safeParse('')
    expect(result.success).toBe(false)
  })
})

describe('isoDateSchema', () => {
  it('should validate valid ISO 8601 dates', () => {
    const validDates = ['2023-10-15', '2024-01-01', '2020-12-31']
    validDates.forEach((date) => {
      const result = isoDateSchema.safeParse(date)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid date formats', () => {
    const invalidDates = [
      '10/15/2023',
      '2023-10-15T10:30:00',
      '2023-13-01', // invalid month
      '2023-10-32', // invalid day
      '23-10-15', // wrong year format
    ]
    invalidDates.forEach((date) => {
      const result = isoDateSchema.safeParse(date)
      expect(result.success).toBe(false)
    })
  })
})

describe('isoDateTimeSchema', () => {
  it('should validate valid ISO 8601 datetimes', () => {
    const validDateTimes = [
      '2023-10-16T10:30:00.000Z',
      '2024-01-01T00:00:00Z',
      '2020-12-31T23:59:59.999Z',
    ]
    validDateTimes.forEach((datetime) => {
      const result = isoDateTimeSchema.safeParse(datetime)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid datetime formats', () => {
    const invalidDateTimes = ['not-a-datetime', 'invalid-date-string']
    invalidDateTimes.forEach((datetime) => {
      const result = isoDateTimeSchema.safeParse(datetime)
      expect(result.success).toBe(false)
    })
  })
})

describe('tagSchema', () => {
  it('should validate and normalize valid tags', () => {
    const result = tagSchema.safeParse('  Test Tag  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('test tag')
    }
  })

  it('should accept tags with hyphens and underscores', () => {
    const validTags = ['sci-fi', 'web_comics', 'action-adventure']
    validTags.forEach((tag) => {
      const result = tagSchema.safeParse(tag)
      expect(result.success).toBe(true)
    })
  })

  it('should reject tags with special characters', () => {
    const invalidTags = ['tag@special', 'tag#hash', 'tag%percent']
    invalidTags.forEach((tag) => {
      const result = tagSchema.safeParse(tag)
      expect(result.success).toBe(false)
    })
  })

  it('should reject empty tag', () => {
    const result = tagSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('should reject tag exceeding 100 characters', () => {
    const longTag = 'a'.repeat(101)
    const result = tagSchema.safeParse(longTag)
    expect(result.success).toBe(false)
  })
})

describe('tagsArraySchema', () => {
  it('should validate array with unique tags', () => {
    const result = tagsArraySchema.safeParse(['humor', 'cats', 'adventure'])
    expect(result.success).toBe(true)
  })

  it('should reject array with duplicate tags', () => {
    const result = tagsArraySchema.safeParse(['humor', 'cats', 'humor'])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('unique')
    }
  })

  it('should reject array exceeding 50 tags', () => {
    const tags = Array.from({ length: 51 }, (_, i) => `tag-${i}`)
    const result = tagsArraySchema.safeParse(tags)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('50')
    }
  })

  it('should accept exactly 50 tags', () => {
    const tags = Array.from({ length: 50 }, (_, i) => `tag-${i}`)
    const result = tagsArraySchema.safeParse(tags)
    expect(result.success).toBe(true)
  })

  it('should accept empty array (optional)', () => {
    const result = tagsArraySchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })
})

describe('scrollStyleSchema', () => {
  it('should validate carousel', () => {
    const result = scrollStyleSchema.safeParse('carousel')
    expect(result.success).toBe(true)
  })

  it('should validate longForm', () => {
    const result = scrollStyleSchema.safeParse('longForm')
    expect(result.success).toBe(true)
  })

  it('should reject invalid scroll style', () => {
    const result = scrollStyleSchema.safeParse('invalid')
    expect(result.success).toBe(false)
  })
})

describe('s3KeySchema', () => {
  it('should validate valid S3 keys', () => {
    const validKeys = [
      'comics/2023/panel-01.jpg',
      'images/test.png',
      'uploads/my-file_v2.webp',
      'a/b/c/d/e.jpg',
    ]
    validKeys.forEach((key) => {
      const result = s3KeySchema.safeParse(key)
      expect(result.success).toBe(true)
    })
  })

  it('should reject S3 keys with special characters', () => {
    const invalidKeys = [
      'comics/test@special.jpg',
      'comics/test#hash.jpg',
      'comics/test!bang.jpg',
    ]
    invalidKeys.forEach((key) => {
      const result = s3KeySchema.safeParse(key)
      expect(result.success).toBe(false)
    })
  })

  it('should reject empty S3 key', () => {
    const result = s3KeySchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('should reject S3 key exceeding 1024 characters', () => {
    const longKey = 'a'.repeat(1025)
    const result = s3KeySchema.safeParse(longKey)
    expect(result.success).toBe(false)
  })
})

describe('altTextSchema', () => {
  it('should validate alt text', () => {
    const result = altTextSchema.safeParse('A cat sitting on a windowsill')
    expect(result.success).toBe(true)
  })

  it('should accept undefined (optional)', () => {
    const result = altTextSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it('should reject alt text exceeding 500 characters', () => {
    const longAltText = 'a'.repeat(501)
    const result = altTextSchema.safeParse(longAltText)
    expect(result.success).toBe(false)
  })

  it('should accept alt text at exactly 500 characters', () => {
    const maxAltText = 'a'.repeat(500)
    const result = altTextSchema.safeParse(maxAltText)
    expect(result.success).toBe(true)
  })
})

describe('hexColorSchema', () => {
  it('should validate valid hex colors', () => {
    const validColors = ['#FF5733', '#000000', '#FFFFFF', '#abc123']
    validColors.forEach((color) => {
      const result = hexColorSchema.safeParse(color)
      expect(result.success).toBe(true)
    })
  })

  it('should reject hex color without hash', () => {
    const result = hexColorSchema.safeParse('FF5733')
    expect(result.success).toBe(false)
  })

  it('should reject short hex color (#FFF)', () => {
    const result = hexColorSchema.safeParse('#FFF')
    expect(result.success).toBe(false)
  })

  it('should reject invalid hex characters', () => {
    const result = hexColorSchema.safeParse('#GGGGGG')
    expect(result.success).toBe(false)
  })
})

describe('comicImageSchema', () => {
  it('should validate valid comic image', () => {
    const image = {
      key: 'comics/2023/test.jpg',
      altText: 'Test image',
      order: 0,
    }
    const result = comicImageSchema.safeParse(image)
    expect(result.success).toBe(true)
  })

  it('should validate image without alt text', () => {
    const image = {
      key: 'comics/2023/test.jpg',
      order: 0,
    }
    const result = comicImageSchema.safeParse(image)
    expect(result.success).toBe(true)
  })

  it('should reject negative order', () => {
    const image = {
      key: 'comics/2023/test.jpg',
      order: -1,
    }
    const result = comicImageSchema.safeParse(image)
    expect(result.success).toBe(false)
  })
})

describe('imagesArraySchema', () => {
  it('should validate array with 1 image', () => {
    const images = [{ key: 'comics/test.jpg', order: 0 }]
    const result = imagesArraySchema.safeParse(images)
    expect(result.success).toBe(true)
  })

  it('should validate array with 20 images', () => {
    const images = Array.from({ length: 20 }, (_, i) => ({
      key: `comics/img-${i}.jpg`,
      order: i,
    }))
    const result = imagesArraySchema.safeParse(images)
    expect(result.success).toBe(true)
  })

  it('should reject empty array', () => {
    const result = imagesArraySchema.safeParse([])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one')
    }
  })

  it('should reject array with 21 images', () => {
    const images = Array.from({ length: 21 }, (_, i) => ({
      key: `comics/img-${i}.jpg`,
      order: i,
    }))
    const result = imagesArraySchema.safeParse(images)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('20')
    }
  })
})

describe('thumbnailIndexSchema', () => {
  it('should validate zero', () => {
    const result = thumbnailIndexSchema.safeParse(0)
    expect(result.success).toBe(true)
  })

  it('should validate positive numbers', () => {
    const result = thumbnailIndexSchema.safeParse(5)
    expect(result.success).toBe(true)
  })

  it('should reject negative numbers', () => {
    const result = thumbnailIndexSchema.safeParse(-1)
    expect(result.success).toBe(false)
  })

  it('should reject decimal numbers', () => {
    const result = thumbnailIndexSchema.safeParse(1.5)
    expect(result.success).toBe(false)
  })
})

describe('derivedRelationshipSchema', () => {
  it('should validate caption relationship', () => {
    const rel = {
      targetComicId: '550e8400-e29b-41d4-a716-446655440000',
      sourceType: 'caption' as const,
      context: 'Referenced in caption',
    }
    const result = derivedRelationshipSchema.safeParse(rel)
    expect(result.success).toBe(true)
  })

  it('should validate series relationship', () => {
    const rel = {
      targetComicId: '550e8400-e29b-41d4-a716-446655440000',
      sourceType: 'series' as const,
    }
    const result = derivedRelationshipSchema.safeParse(rel)
    expect(result.success).toBe(true)
  })

  it('should validate tag relationship', () => {
    const rel = {
      targetComicId: '550e8400-e29b-41d4-a716-446655440000',
      sourceType: 'tag' as const,
    }
    const result = derivedRelationshipSchema.safeParse(rel)
    expect(result.success).toBe(true)
  })

  it('should reject invalid sourceType', () => {
    const rel = {
      targetComicId: '550e8400-e29b-41d4-a716-446655440000',
      sourceType: 'invalid',
    }
    const result = derivedRelationshipSchema.safeParse(rel)
    expect(result.success).toBe(false)
  })

  it('should reject invalid UUID in targetComicId', () => {
    const rel = {
      targetComicId: 'not-a-uuid',
      sourceType: 'caption' as const,
    }
    const result = derivedRelationshipSchema.safeParse(rel)
    expect(result.success).toBe(false)
  })
})

describe('colorPaletteSchema', () => {
  it('should validate complete color palette', () => {
    const palette = {
      primary: '#FF5733',
      secondary: '#33FF57',
      highlight: '#3357FF',
      text: '#000000',
      textSecondary: '#666666',
    }
    const result = colorPaletteSchema.safeParse(palette)
    expect(result.success).toBe(true)
  })

  it('should reject palette with invalid color', () => {
    const palette = {
      primary: 'not-a-color',
      secondary: '#33FF57',
      highlight: '#3357FF',
      text: '#000000',
      textSecondary: '#666666',
    }
    const result = colorPaletteSchema.safeParse(palette)
    expect(result.success).toBe(false)
  })

  it('should reject incomplete palette', () => {
    const palette = {
      primary: '#FF5733',
      secondary: '#33FF57',
    }
    const result = colorPaletteSchema.safeParse(palette)
    expect(result.success).toBe(false)
  })
})

describe('uploadFileSchema', () => {
  it('should validate JPEG file under 20MB', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }) // 10MB
    const result = uploadFileSchema.safeParse(file)
    expect(result.success).toBe(true)
  })

  it('should validate PNG file under 20MB', () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB
    const result = uploadFileSchema.safeParse(file)
    expect(result.success).toBe(true)
  })

  it('should validate WebP file under 20MB', () => {
    const file = new File(['test'], 'test.webp', { type: 'image/webp' })
    Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 }) // 1MB
    const result = uploadFileSchema.safeParse(file)
    expect(result.success).toBe(true)
  })

  it('should reject file exceeding 20MB', () => {
    const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 21 * 1024 * 1024 }) // 21MB
    const result = uploadFileSchema.safeParse(file)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('20MB')
    }
  })

  it('should reject unsupported file type', () => {
    const file = new File(['test'], 'test.gif', { type: 'image/gif' })
    Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })
    const result = uploadFileSchema.safeParse(file)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('JPG, PNG, or WebP')
    }
  })
})

describe('uploadFilesArraySchema', () => {
  it('should validate array with 1 file', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })
    const result = uploadFilesArraySchema.safeParse([file])
    expect(result.success).toBe(true)
  })

  it('should validate array with 20 files', () => {
    const files = Array.from({ length: 20 }, (_, i) => {
      const file = new File(['test'], `test-${i}.jpg`, { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })
      return file
    })
    const result = uploadFilesArraySchema.safeParse(files)
    expect(result.success).toBe(true)
  })

  it('should reject empty array', () => {
    const result = uploadFilesArraySchema.safeParse([])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one')
    }
  })

  it('should reject array with 21 files', () => {
    const files = Array.from({ length: 21 }, (_, i) => {
      const file = new File(['test'], `test-${i}.jpg`, { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })
      return file
    })
    const result = uploadFilesArraySchema.safeParse(files)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('20')
    }
  })
})
