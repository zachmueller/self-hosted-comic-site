/**
 * Unit tests for comic validation schema
 * Tests all validation rules from specs/validation-rules.md
 */

import { describe, it, expect } from 'vitest';
import { comicSchema } from '../comic.schema';
import type { z } from 'zod';

type Comic = z.infer<typeof comicSchema>;

describe('Comic Schema Validation', () => {
  // Valid baseline comic for testing
  const validComic: Comic = {
    id: 'test-comic-123',
    slug: 'test-comic',
    title: 'Test Comic',
    postedTimestamp: '2024-01-15T12:00:00Z',
    happenedOnDate: '2024-01-15',
    images: ['https://example.com/image1.jpg'],
    caption: 'Test caption',
    tags: ['test', 'comic'],
    scrollStyle: 'carousel',
    thumbnailIndex: 0,
    derivedRelationships: [],
  };

  describe('Required Fields', () => {
    it('should accept valid comic with all required fields', () => {
      const result = comicSchema.safeParse(validComic);
      expect(result.success).toBe(true);
    });

    it('should reject comic without id', () => {
      const { id, ...comicWithoutId } = validComic;
      const result = comicSchema.safeParse(comicWithoutId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('id');
      }
    });

    it('should reject comic without slug', () => {
      const { slug, ...comicWithoutSlug } = validComic;
      const result = comicSchema.safeParse(comicWithoutSlug);
      expect(result.success).toBe(false);
    });

    it('should reject comic without title', () => {
      const { title, ...comicWithoutTitle } = validComic;
      const result = comicSchema.safeParse(comicWithoutTitle);
      expect(result.success).toBe(false);
    });

    it('should reject comic without publishDate', () => {
      const { publishDate, ...comicWithoutDate } = validComic;
      const result = comicSchema.safeParse(comicWithoutDate);
      expect(result.success).toBe(false);
    });

    it('should reject comic without images', () => {
      const { images, ...comicWithoutImages } = validComic;
      const result = comicSchema.safeParse(comicWithoutImages);
      expect(result.success).toBe(false);
    });
  });

  describe('Title Validation', () => {
    it('should accept title with minimum length (1 character)', () => {
      const comic = { ...validComic, title: 'A' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept title with maximum length (200 characters)', () => {
      const comic = { ...validComic, title: 'A'.repeat(200) };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject title exceeding 200 characters', () => {
      const comic = { ...validComic, title: 'A'.repeat(201) };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/200|length|long/i);
      }
    });

    it('should reject empty title', () => {
      const comic = { ...validComic, title: '' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should accept title with special characters', () => {
      const comic = { ...validComic, title: 'Comic #1: The Beginning!' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });
  });

  describe('Slug Validation', () => {
    it('should accept valid URL-safe slug', () => {
      const comic = { ...validComic, slug: 'my-comic-2024' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept slug with underscores', () => {
      const comic = { ...validComic, slug: 'my_comic_2024' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject slug with spaces', () => {
      const comic = { ...validComic, slug: 'my comic' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should reject slug with special characters', () => {
      const comic = { ...validComic, slug: 'my-comic!' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should reject empty slug', () => {
      const comic = { ...validComic, slug: '' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });
  });

  describe('Publish Date Validation', () => {
    it('should accept valid ISO date format', () => {
      const comic = { ...validComic, publishDate: '2024-12-25' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept dates from year 2000', () => {
      const comic = { ...validComic, publishDate: '2000-01-01' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept dates up to 10 years in future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 9);
      const comic = { 
        ...validComic, 
        publishDate: futureDate.toISOString().split('T')[0] 
      };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject dates before year 2000', () => {
      const comic = { ...validComic, publishDate: '1999-12-31' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const comic = { ...validComic, publishDate: '12/25/2024' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should reject non-existent dates', () => {
      const comic = { ...validComic, publishDate: '2024-02-30' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });
  });

  describe('Images Array Validation', () => {
    it('should accept single image', () => {
      const comic = { ...validComic, images: ['https://example.com/img.jpg'] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept multiple images (up to 50)', () => {
      const images = Array(50).fill('https://example.com/img.jpg');
      const comic = { ...validComic, images };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject empty images array', () => {
      const comic = { ...validComic, images: [] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 images', () => {
      const images = Array(51).fill('https://example.com/img.jpg');
      const comic = { ...validComic, images };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/50|maximum|limit/i);
      }
    });

    it('should reject invalid URL in images', () => {
      const comic = { ...validComic, images: ['not-a-url'] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });
  });

  describe('Captions Validation', () => {
    it('should accept empty captions (optional)', () => {
      const comic = { ...validComic, captions: [] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept captions matching images count', () => {
      const comic = {
        ...validComic,
        images: ['img1.jpg', 'img2.jpg'],
        captions: ['Caption 1', 'Caption 2'],
      };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept caption with maximum length (1000 characters)', () => {
      const comic = { ...validComic, captions: ['A'.repeat(1000)] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject caption exceeding 1000 characters', () => {
      const comic = { ...validComic, captions: ['A'.repeat(1001)] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should accept caption with reference syntax', () => {
      const comic = { ...validComic, captions: ['This references [[Other Comic]]'] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept multiple references in single caption', () => {
      const comic = { 
        ...validComic, 
        captions: ['References [[Comic A]] and [[Comic B]]'] 
      };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });
  });

  describe('Alt Texts Validation', () => {
    it('should accept empty alt texts (optional)', () => {
      const comic = { ...validComic, altTexts: [] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept alt texts matching images count', () => {
      const comic = {
        ...validComic,
        images: ['img1.jpg', 'img2.jpg'],
        altTexts: ['Alt 1', 'Alt 2'],
      };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept alt text with maximum length (500 characters)', () => {
      const comic = { ...validComic, altTexts: ['A'.repeat(500)] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject alt text exceeding 500 characters', () => {
      const comic = { ...validComic, altTexts: ['A'.repeat(501)] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });
  });

  describe('Tags Validation', () => {
    it('should accept empty tags array', () => {
      const comic = { ...validComic, tags: [] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept multiple tags (up to 20)', () => {
      const tags = Array(20).fill('tag');
      const comic = { ...validComic, tags };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject more than 20 tags', () => {
      const tags = Array(21).fill('tag');
      const comic = { ...validComic, tags };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should accept tag with maximum length (50 characters)', () => {
      const comic = { ...validComic, tags: ['A'.repeat(50)] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject tag exceeding 50 characters', () => {
      const comic = { ...validComic, tags: ['A'.repeat(51)] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });

    it('should normalize tags to lowercase', () => {
      const comic = { ...validComic, tags: ['TestTag', 'ANOTHER'] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['testtag', 'another']);
      }
    });
  });

  describe('Scroll Style Validation', () => {
    it('should accept carousel scroll style', () => {
      const comic = { ...validComic, scrollStyle: 'carousel' as const };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept long-form scroll style', () => {
      const comic = { ...validComic, scrollStyle: 'long-form' as const };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject invalid scroll style', () => {
      const comic = { ...validComic, scrollStyle: 'invalid' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });
  });

  describe('Series Validation', () => {
    it('should accept valid series name', () => {
      const comic = { ...validComic, series: 'My Series' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept undefined series', () => {
      const { series, ...comicWithoutSeries } = validComic;
      const result = comicSchema.safeParse(comicWithoutSeries);
      expect(result.success).toBe(true);
    });

    it('should accept series with maximum length (100 characters)', () => {
      const comic = { ...validComic, series: 'A'.repeat(100) };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should reject series exceeding 100 characters', () => {
      const comic = { ...validComic, series: 'A'.repeat(101) };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });
  });

  describe('References Validation', () => {
    it('should accept empty references array', () => {
      const comic = { ...validComic, references: [] };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept valid reference with all fields', () => {
      const comic = {
        ...validComic,
        references: [{
          targetId: 'other-comic-id',
          targetTitle: 'Other Comic',
          sourceType: 'caption',
          context: 'This references other comic',
        }],
      };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept multiple references', () => {
      const comic = {
        ...validComic,
        references: [
          {
            targetId: 'comic-1',
            targetTitle: 'Comic 1',
            sourceType: 'caption',
            context: 'Context 1',
          },
          {
            targetId: 'comic-2',
            targetTitle: 'Comic 2',
            sourceType: 'series',
            context: 'Context 2',
          },
        ],
      };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(true);
    });

    it('should accept valid sourceType values', () => {
      const sourceTypes = ['caption', 'series', 'tag'] as const;
      sourceTypes.forEach(sourceType => {
        const comic = {
          ...validComic,
          references: [{
            targetId: 'id',
            targetTitle: 'Title',
            sourceType,
            context: 'Context',
          }],
        };
        const result = comicSchema.safeParse(comic);
        expect(result.success).toBe(true);
      });
    });

    it('should reject reference with invalid sourceType', () => {
      const comic = {
        ...validComic,
        references: [{
          targetId: 'id',
          targetTitle: 'Title',
          sourceType: 'invalid',
          context: 'Context',
        }],
      };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide artist-friendly error message for missing required field', () => {
      const { title, ...comic } = validComic;
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message.toLowerCase();
        expect(errorMessage).toMatch(/title|required/i);
      }
    });

    it('should provide clear error for invalid date format', () => {
      const comic = { ...validComic, publishDate: 'invalid-date' };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message.toLowerCase();
        expect(errorMessage).toMatch(/date|format|yyyy-mm-dd/i);
      }
    });

    it('should provide helpful error for exceeding character limits', () => {
      const comic = { ...validComic, title: 'A'.repeat(201) };
      const result = comicSchema.safeParse(comic);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message.toLowerCase();
        expect(errorMessage).toMatch(/200|characters|length/i);
      }
    });
  });
});
