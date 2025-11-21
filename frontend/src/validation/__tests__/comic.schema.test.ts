import { describe, it, expect } from 'vitest'
import {
  comicSchema,
  comicListItemSchema,
  relatedComicSchema,
  comicWithRelationshipsSchema,
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
  parseReferences,
} from '../comic.schema'
import validComics from '../../../../test/fixtures/valid-comics.json'
import invalidComics from '../../../../test/fixtures/invalid-comics.json'

describe('comicSchema', () => {
  describe('valid comics', () => {
    it('should validate all valid comics from fixture', () => {
      validComics.comics.forEach((comic) => {
        const result = comicSchema.safeParse(comic)
        expect(result.success).toBe(true)
      })
    })

    it('should validate comic with all fields', () => {
      const comic = validComics.comics[0]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(comic.id)
        expect(result.data.title).toBe(comic.title)
        expect(result.data.slug).toBe(comic.slug)
      }
    })

    it('should validate comic with minimal fields', () => {
      const comic = validComics.comics[2] // Minimal Comic
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(true)
    })

    it('should validate comic with 20 images (maximum)', () => {
      const comic = validComics.comics[3] // Maximum Comic
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.images.length).toBe(20)
      }
    })

    it('should validate comic with 50 tags (maximum)', () => {
      const comic = validComics.comics[4] // Maximum Tags
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags?.length).toBe(50)
      }
    })

    it('should validate comic with optional caption', () => {
      const comic = validComics.comics[1] // No caption field
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(true)
    })

    it('should validate comic with derivedRelationships', () => {
      const comic = validComics.comics[0]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.derivedRelationships).toBeDefined()
        expect(result.data.derivedRelationships?.length).toBeGreaterThan(0)
      }
    })
  })

  describe('invalid comics', () => {
    it('should reject invalid UUID format', () => {
      const comic = invalidComics.comics[0]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('UUID')
      }
    })

    it('should reject title exceeding 200 characters', () => {
      const comic = invalidComics.comics[1]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200')
      }
    })

    it('should reject empty title', () => {
      const comic = invalidComics.comics[2]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('empty')
      }
    })

    it('should reject slug with uppercase letters', () => {
      const comic = invalidComics.comics[3]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase')
      }
    })

    it('should reject slug with special characters', () => {
      const comic = invalidComics.comics[4]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
    })

    it('should reject slug exceeding 100 characters', () => {
      const comic = invalidComics.comics[5]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100')
      }
    })

    it('should reject invalid scroll style', () => {
      const comic = invalidComics.comics[6]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
    })

    it('should reject invalid date format', () => {
      const comic = invalidComics.comics[7]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 8601')
      }
    })

    it('should reject invalid datetime format', () => {
      const comic = invalidComics.comics[8]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
    })

    it('should reject empty images array', () => {
      const comic = invalidComics.comics[9]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one')
      }
    })

    it('should reject more than 20 images', () => {
      const comic = invalidComics.comics[10]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('20')
      }
    })

    it('should reject alt text exceeding 500 characters', () => {
      const comic = invalidComics.comics[11]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500')
      }
    })

    it('should reject invalid S3 key', () => {
      const comic = invalidComics.comics[12]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
    })

    it('should reject negative image order', () => {
      const comic = invalidComics.comics[13]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-negative')
      }
    })

    it('should reject negative thumbnail index', () => {
      const comic = invalidComics.comics[14]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-negative')
      }
    })

    it('should reject more than 50 tags', () => {
      const comic = invalidComics.comics[15]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50')
      }
    })

    it('should reject tag exceeding 100 characters', () => {
      const comic = invalidComics.comics[16]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100')
      }
    })

    it('should reject tag with invalid characters', () => {
      const comic = invalidComics.comics[17]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
    })

    it('should reject duplicate tags', () => {
      const comic = invalidComics.comics[18]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('unique')
      }
    })

    it('should reject invalid relationship sourceType', () => {
      const comic = invalidComics.comics[19]
      const result = comicSchema.safeParse(comic)
      expect(result.success).toBe(false)
    })
  })
})

describe('comicListItemSchema', () => {
  it('should validate minimal comic list item', () => {
    const item = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Comic',
      slug: 'test-comic',
      postedTimestamp: '2023-10-16T10:30:00.000Z',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      tags: ['humor', 'cats'],
    }
    const result = comicListItemSchema.safeParse(item)
    expect(result.success).toBe(true)
  })

  it('should reject invalid thumbnail URL', () => {
    const item = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Comic',
      slug: 'test-comic',
      postedTimestamp: '2023-10-16T10:30:00.000Z',
      thumbnailUrl: 'not-a-valid-url',
      tags: [],
    }
    const result = comicListItemSchema.safeParse(item)
    expect(result.success).toBe(false)
  })
})

describe('uploadComicRequestSchema', () => {
  it('should validate valid upload request', () => {
    const request = {
      title: 'New Comic',
      caption: 'Test caption',
      happenedOnDate: '2023-10-15',
      postedTimestamp: '2023-10-16T10:30:00.000Z',
      tags: ['humor'],
      scrollStyle: 'carousel' as const,
      images: [
        {
          s3Key: 'comics/2023/test.jpg',
          altText: 'Test image',
          order: 0,
        },
      ],
      thumbnailIndex: 0,
    }
    const result = uploadComicRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it('should reject upload without images', () => {
    const request = {
      title: 'New Comic',
      caption: 'Test caption',
      happenedOnDate: '2023-10-15',
      postedTimestamp: '2023-10-16T10:30:00.000Z',
      tags: [],
      scrollStyle: 'carousel' as const,
      images: [],
      thumbnailIndex: 0,
    }
    const result = uploadComicRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })
})

describe('presignedUrlRequestSchema', () => {
  it('should validate JPEG request', () => {
    const request = {
      fileName: 'test.jpg',
      contentType: 'image/jpeg' as const,
      fileSize: 1024 * 1024, // 1MB
    }
    const result = presignedUrlRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it('should validate PNG request', () => {
    const request = {
      fileName: 'test.png',
      contentType: 'image/png' as const,
      fileSize: 1024 * 1024,
    }
    const result = presignedUrlRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it('should validate WebP request', () => {
    const request = {
      fileName: 'test.webp',
      contentType: 'image/webp' as const,
      fileSize: 1024 * 1024,
    }
    const result = presignedUrlRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it('should reject file exceeding 20MB', () => {
    const request = {
      fileName: 'large.jpg',
      contentType: 'image/jpeg' as const,
      fileSize: 21 * 1024 * 1024, // 21MB
    }
    const result = presignedUrlRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('20MB')
    }
  })

  it('should reject invalid content type', () => {
    const request = {
      fileName: 'test.gif',
      contentType: 'image/gif' as any,
      fileSize: 1024 * 1024,
    }
    const result = presignedUrlRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })
})

describe('getComicsParamsSchema', () => {
  it('should validate params with page and tag', () => {
    const params = {
      page: 2,
      tag: 'humor',
    }
    const result = getComicsParamsSchema.safeParse(params)
    expect(result.success).toBe(true)
  })

  it('should validate params with only page', () => {
    const params = {
      page: 1,
    }
    const result = getComicsParamsSchema.safeParse(params)
    expect(result.success).toBe(true)
  })

  it('should validate empty params', () => {
    const params = {}
    const result = getComicsParamsSchema.safeParse(params)
    expect(result.success).toBe(true)
  })

  it('should reject negative page number', () => {
    const params = {
      page: 0,
    }
    const result = getComicsParamsSchema.safeParse(params)
    expect(result.success).toBe(false)
  })
})

describe('apiErrorSchema', () => {
  it('should validate error with all fields', () => {
    const error = {
      error: 'Not Found',
      details: 'Comic with ID xyz not found',
      timestamp: '2023-10-16T10:30:00.000Z',
    }
    const result = apiErrorSchema.safeParse(error)
    expect(result.success).toBe(true)
  })

  it('should validate error without details', () => {
    const error = {
      error: 'Internal Server Error',
      timestamp: '2023-10-16T10:30:00.000Z',
    }
    const result = apiErrorSchema.safeParse(error)
    expect(result.success).toBe(true)
  })

  it('should reject empty error message', () => {
    const error = {
      error: '',
      timestamp: '2023-10-16T10:30:00.000Z',
    }
    const result = apiErrorSchema.safeParse(error)
    expect(result.success).toBe(false)
  })
})

describe('parseReferences', () => {
  it('should extract simple reference', () => {
    const caption = 'Check out [[Another Comic]] for more!'
    const refs = parseReferences(caption)
    expect(refs.length).toBe(1)
    expect(refs[0].title).toBe('Another Comic')
    expect(refs[0].alias).toBeUndefined()
  })

  it('should extract reference with alias', () => {
    const caption = 'See [[Full Title|Short Name]] here'
    const refs = parseReferences(caption)
    expect(refs.length).toBe(1)
    expect(refs[0].title).toBe('Full Title')
    expect(refs[0].alias).toBe('Short Name')
  })

  it('should extract multiple references', () => {
    const caption =
      'Related to [[Comic A]] and [[Comic B|B]] and [[Comic C]]'
    const refs = parseReferences(caption)
    expect(refs.length).toBe(3)
    expect(refs[0].title).toBe('Comic A')
    expect(refs[1].title).toBe('Comic B')
    expect(refs[1].alias).toBe('B')
    expect(refs[2].title).toBe('Comic C')
  })

  it('should return empty array for caption without references', () => {
    const caption = 'Just a normal caption with no references'
    const refs = parseReferences(caption)
    expect(refs.length).toBe(0)
  })

  it('should handle caption with incomplete reference syntax', () => {
    const caption = 'This has [[incomplete reference'
    const refs = parseReferences(caption)
    expect(refs.length).toBe(0)
  })

  it('should trim whitespace from titles and aliases', () => {
    const caption = '[[  Spaced Title  |  Spaced Alias  ]]'
    const refs = parseReferences(caption)
    expect(refs.length).toBe(1)
    expect(refs[0].title).toBe('Spaced Title')
    expect(refs[0].alias).toBe('Spaced Alias')
  })

  it('should handle empty caption', () => {
    const caption = ''
    const refs = parseReferences(caption)
    expect(refs.length).toBe(0)
  })
})

describe('updateConfigRequestSchema', () => {
  it('should validate valid color palette', () => {
    const request = {
      colorPalette: {
        primary: '#FF5733',
        secondary: '#33FF57',
        highlight: '#3357FF',
        text: '#000000',
        textSecondary: '#666666',
      },
    }
    const result = updateConfigRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it('should reject invalid hex color', () => {
    const request = {
      colorPalette: {
        primary: 'not-a-color',
        secondary: '#33FF57',
        highlight: '#3357FF',
        text: '#000000',
        textSecondary: '#666666',
      },
    }
    const result = updateConfigRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('should reject hex color without hash', () => {
    const request = {
      colorPalette: {
        primary: 'FF5733',
        secondary: '#33FF57',
        highlight: '#3357FF',
        text: '#000000',
        textSecondary: '#666666',
      },
    }
    const result = updateConfigRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })

  it('should reject short hex color', () => {
    const request = {
      colorPalette: {
        primary: '#FFF',
        secondary: '#33FF57',
        highlight: '#3357FF',
        text: '#000000',
        textSecondary: '#666666',
      },
    }
    const result = updateConfigRequestSchema.safeParse(request)
    expect(result.success).toBe(false)
  })
})
