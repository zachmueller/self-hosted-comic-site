/**
 * Tests for comic schema validation
 */

import { describe, test, expect } from '@jest/globals';
import {
  schemaValidator,
  comicValidator,
  configValidator,
  ErrorHandler,
  DataProcessor,
} from '../../specs/validation';
import {
  Comic,
  UploadMetadata,
  ValidationResult,
  ValidationErrorCode,
} from '../../specs/data-schemas';

// Import test fixtures
const validComics = require('../fixtures/valid-comics.json');
const invalidComics = require('../fixtures/invalid-comics.json');
const validResponses = require('../fixtures/valid-responses.json');

describe('Comic Schema Validation', () => {
  describe('Valid Comics', () => {
    test('should validate all valid comic fixtures', () => {
      validComics.forEach((comic: Comic, index: number) => {
        const result = comicValidator.validateComic(comic);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should validate minimal valid comic', () => {
      const minimalComic = validComics[2]; // "Simple Story" - minimal example
      const result = comicValidator.validateComic(minimalComic);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate complex comic with all fields', () => {
      const complexComic = validComics[3]; // "Multi-Image Epic" - complex example
      const result = comicValidator.validateComic(complexComic);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Invalid Comics', () => {
    test('should reject all invalid comic fixtures', () => {
      invalidComics.forEach((testCase: any, index: number) => {
        const result = comicValidator.validateComic(testCase.data);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject comic with missing required fields', () => {
      const incompleteComic = invalidComics[0].data; // Missing required fields
      const result = comicValidator.validateComic(incompleteComic);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject comic with invalid UUID', () => {
      const invalidUUIDComic = invalidComics[1].data; // Invalid UUID format
      const result = comicValidator.validateComic(invalidUUIDComic);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('pattern'))).toBe(true);
    });

    test('should reject comic with invalid slug format', () => {
      const invalidSlugComic = invalidComics[2].data; // Invalid slug format
      const result = comicValidator.validateComic(invalidSlugComic);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('slug') || error.includes('pattern'))).toBe(true);
    });

    test('should reject comic with title too long', () => {
      const longTitleComic = invalidComics[3].data; // Title too long
      const result = comicValidator.validateComic(longTitleComic);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('maxLength') || error.includes('title'))).toBe(true);
    });

    test('should reject comic with empty images array', () => {
      const noImagesComic = invalidComics[4].data; // Empty images array
      const result = comicValidator.validateComic(noImagesComic);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('minItems') || error.includes('images'))).toBe(true);
    });

    test('should reject comic with too many images', () => {
      const tooManyImagesComic = invalidComics[5].data; // Too many images
      const result = comicValidator.validateComic(tooManyImagesComic);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('maxItems') || error.includes('images'))).toBe(true);
    });
  });

  describe('Upload Metadata Validation', () => {
    test('should validate upload metadata (excluding auto-generated fields)', () => {
      const uploadData: UploadMetadata = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test Upload",
        slug: "test-upload",
        caption: "This is a test upload.",
        images: [
          {
            key: "comics/2023/test-upload.jpg"
          }
        ],
        happenedOnDate: "2023-10-15",
        postedTimestamp: "2023-10-16T10:30:00.000Z"
      };

      const result = comicValidator.validateUploadMetadata(uploadData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should issue warnings for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days in the future
      
      const uploadData: UploadMetadata = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Future Comic",
        slug: "future-comic",
        caption: "This comic is set in the future.",
        images: [
          {
            key: "comics/test.jpg"
          }
        ],
        happenedOnDate: futureDate.toISOString().split('T')[0],
        postedTimestamp: futureDate.toISOString()
      };

      const result = comicValidator.validateUploadMetadata(uploadData);
      expect(result.isValid).toBe(true);
      expect(result.warnings?.some(warning => warning.includes('future'))).toBe(true);
    });
  });

  describe('Image Validation', () => {
    test('should validate comic images', () => {
      const validImages = [
        {
          key: "comics/2023/image1.jpg",
          altText: "Description of image 1"
        },
        {
          key: "comics/2023/image2.png",
          order: 1
        }
      ];

      const result = comicValidator.validateComicImages(validImages);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject non-array images', () => {
      const result = comicValidator.validateComicImages("not-an-array");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Images must be an array');
    });

    test('should warn about missing file extensions', () => {
      const imagesWithoutExtensions = [
        {
          key: "comics/2023/image-without-extension"
        }
      ];

      const result = comicValidator.validateComicImages(imagesWithoutExtensions);
      expect(result.isValid).toBe(true);
      expect(result.warnings?.some(warning => warning.includes('missing file extension'))).toBe(true);
    });
  });

  describe('Slug Generation', () => {
    test('should generate valid slugs from titles', () => {
      const result = comicValidator.generateAndValidateSlug("My Awesome Comic!");
      expect(result.slug).toBe("my-awesome-comic");
      expect(result.isUnique).toBe(true);
    });

    test('should handle slug conflicts', () => {
      const existingSlugs = ["my-comic", "my-comic-1"];
      const result = comicValidator.generateAndValidateSlug("My Comic", existingSlugs);
      expect(result.slug).toBe("my-comic-2");
      expect(result.isUnique).toBe(false);
    });

    test('should handle special characters in titles', () => {
      const result = comicValidator.generateAndValidateSlug("Comic @ #1: The Beginning!");
      expect(result.slug).toBe("comic-1-the-beginning");
      expect(result.isUnique).toBe(true);
    });
  });
});

describe('API Response Validation', () => {
  test('should validate all valid response fixtures', () => {
    validResponses.forEach((responseFixture: any) => {
      const result = schemaValidator.validate('ComicsResponse', responseFixture.data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  test('should validate empty response', () => {
    const emptyResponse = validResponses[1].data; // Empty comics response
    const result = schemaValidator.validate('ComicsResponse', emptyResponse);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Error Handling', () => {
  test('should create standardized error responses', () => {
    const error = ErrorHandler.createErrorResponse(
      'Validation failed',
      'Title is too long',
      '2023-10-16T10:30:00.000Z'
    );

    expect(error.error).toBe('Validation failed');
    expect(error.details).toBe('Title is too long');
    expect(error.timestamp).toBe('2023-10-16T10:30:00.000Z');
  });

  test('should create validation error responses', () => {
    const validationResult: ValidationResult = {
      isValid: false,
      errors: ['Title is required', 'Slug is invalid']
    };

    const error = ErrorHandler.createValidationErrorResponse(validationResult);
    expect(error.error).toContain('Validation Error');
    expect(error.details).toContain('Slug is invalid');
  });

  test('should map validation errors to error codes', () => {
    expect(ErrorHandler.mapValidationError('Invalid UUID format')).toBe(ValidationErrorCode.INVALID_UUID);
    expect(ErrorHandler.mapValidationError('Title is too long')).toBe(ValidationErrorCode.INVALID_TITLE);
    expect(ErrorHandler.mapValidationError('Required field missing')).toBe(ValidationErrorCode.MISSING_REQUIRED_FIELD);
    expect(ErrorHandler.mapValidationError('Unknown error')).toBe(ValidationErrorCode.INVALID_FORMAT);
  });
});

describe('Data Processing', () => {
  test('should process upload metadata correctly', () => {
    const uploadData: UploadMetadata = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test Comic",
      slug: "test-comic",
      caption: "A test comic.",
      images: [
        {
          key: "comics/test.jpg"
        }
      ],
      tags: ["Test", "  SAMPLE  ", "demo"],
      happenedOnDate: "2023-10-15",
      postedTimestamp: "2023-10-16T10:30:00.000Z"
    };

    const result = DataProcessor.processUploadMetadata(uploadData);
    
    expect(result.validationResult.isValid).toBe(true);
    expect(result.processedData).not.toBeNull();
    
    if (result.processedData) {
      expect(result.processedData.uploadDate).toBeDefined();
      expect(result.processedData.tags).toEqual(["test", "sample", "demo"]);
      expect(result.processedData.scrollStyle).toBe("standard");
    }
  });

  test('should prepare comics for API responses', () => {
    const comic = validComics[0];
    const prepared = DataProcessor.prepareComicForResponse(comic);
    
    expect(prepared.id).toBe(comic.id);
    expect(prepared.title).toBeDefined();
    expect(prepared.caption).toBeDefined();
  });

  test('should prepare comics response', () => {
    const comics = [validComics[0]];
    const response = DataProcessor.prepareComicsResponse(comics, 1, true, "humor");
    
    expect(response.items).toHaveLength(1);
    expect(response.page).toBe(1);
    expect(response.hasNextPage).toBe(true);
    expect(response.tag).toBe("humor");
  });
});

describe('Configuration Validation', () => {
  test('should validate app configuration', () => {
    const appConfig = {
      userPoolId: "us-west-2_abc123DEF",
      clientId: "1234567890abcdef12345678",
      identityPoolId: "us-west-2:12345678-1234-1234-1234-123456789012",
      region: "us-west-2",
      bucketName: "my-comic-site-bucket",
      cognitoDomain: "https://my-comic-site.auth.us-west-2.amazoncognito.com"
    };

    const result = configValidator.validateAppConfig(appConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should validate cache configuration', () => {
    const cacheConfig = {
      pageSize: 10,
      ttl: 60,
      invalidationPaths: ["/api/comics", "/comics/*"]
    };

    const result = configValidator.validateCacheConfig(cacheConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should warn about performance issues in cache config', () => {
    const performanceConfig = {
      pageSize: 75, // > 50, should warn
      ttl: 2, // < 5, should warn
      invalidationPaths: ["/api/*"]
    };

    const result = configValidator.validateCacheConfig(performanceConfig);
    expect(result.isValid).toBe(true);
    expect(result.warnings?.some(warning => warning.includes('performance'))).toBe(true);
    expect(result.warnings?.some(warning => warning.includes('invalidation'))).toBe(true);
  });
});
