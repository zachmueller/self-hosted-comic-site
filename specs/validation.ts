/**
 * Comprehensive validation utilities for the Self-Hosted Comic Site
 * Provides schema-based validation using AJV and custom validation logic
 */

import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import {
  Comic,
  UploadMetadata,
  ComicImage,
  Integration,
  ComicsResponse,
  ErrorResponse,
  AppConfig,
  CacheConfig,
  ValidationResult,
  ValidationErrorCode,
  VALIDATION_CONSTANTS,
  DEFAULT_VALUES,
  generateSlugFromTitle,
  normalizeTag,
  sanitizeUserInput,
  isValidUUID,
  isValidSlug,
  isValidTag,
  isValidISO8601Date,
  isValidISO8601DateTime,
} from './data-schemas';
const dataSchemas = require('./data-schemas.json');

/**
 * Central validation class using AJV for JSON schema validation
 */
export class SchemaValidator {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true, 
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
    });
    addFormats(this.ajv);
    this.setupSchemas();
  }

  private setupSchemas(): void {
    try {
      // Add the main schema document
      this.ajv.addSchema(dataSchemas, 'comic-site-schemas');
      
      // Compile validators for each definition by referencing the main schema
      Object.keys(dataSchemas.definitions).forEach(name => {
        try {
          // Create a validator that references the definition in the main schema
          const refSchema = {
            $ref: `comic-site-schemas#/definitions/${name}`
          };
          
          const validator = this.ajv.compile(refSchema);
          this.validators.set(name, validator);
        } catch (error: any) {
          console.error(`Failed to compile schema for ${name}:`, error);
        }
      });
    } catch (error: any) {
      console.error('Failed to setup schemas:', error);
    }
  }

  /**
   * Validate data against a specific schema
   */
  validate<T>(schemaName: string, data: unknown): ValidationResult {
    const validator = this.validators.get(schemaName);
    if (!validator) {
      return {
        isValid: false,
        errors: [`Unknown schema: ${schemaName}`],
      };
    }

    const isValid = validator(data);
    const errors: string[] = [];
    
    if (!isValid && validator.errors) {
      validator.errors.forEach(error => {
        const field = error.instancePath || error.schemaPath;
        const message = error.message || 'Validation failed';
        errors.push(`${field}: ${message}`);
      });
    }

    return { isValid, errors };
  }

  /**
   * Get a compiled validator for a schema
   */
  getValidator(schemaName: string): ValidateFunction | undefined {
    return this.validators.get(schemaName);
  }
}

/**
 * Specialized validator for comic metadata
 */
export class ComicValidator {
  private schemaValidator: SchemaValidator;

  constructor() {
    this.schemaValidator = new SchemaValidator();
  }

  /**
   * Validate complete comic metadata
   */
  validateComic(comic: unknown): ValidationResult {
    const result = this.schemaValidator.validate('Comic', comic);
    
    if (!result.isValid) {
      return result;
    }

    // Additional business logic validation
    const typedComic = comic as Comic;
    const warnings: string[] = [];

    // Check for potential slug conflicts
    if (typedComic.slug !== generateSlugFromTitle(typedComic.title)) {
      warnings.push('Slug does not match generated slug from title');
    }

    // Validate image ordering
    const imageOrders = typedComic.images
      .map(img => img.order)
      .filter(order => order !== undefined) as number[];
    
    if (imageOrders.length > 0 && imageOrders.length < typedComic.images.length) {
      warnings.push('Some images have explicit ordering while others do not');
    }

    return {
      isValid: true,
      errors: [],
      warnings,
    };
  }

  /**
   * Validate upload metadata (excludes auto-generated fields)
   */
  validateUploadMetadata(metadata: unknown): ValidationResult {
    const result = this.schemaValidator.validate('UploadMetadata', metadata);
    
    if (!result.isValid) {
      return result;
    }

    const typedMetadata = metadata as UploadMetadata;
    const warnings: string[] = [];

    // Check for future dates
    const happenedDate = new Date(typedMetadata.happenedOnDate);
    const postedDate = new Date(typedMetadata.postedTimestamp);
    const now = new Date();

    if (happenedDate > now) {
      warnings.push('happenedOnDate is in the future');
    }

    if (postedDate > now) {
      warnings.push('postedTimestamp is in the future');
    }

    if (happenedDate > postedDate) {
      warnings.push('happenedOnDate is after postedTimestamp');
    }

    return {
      isValid: true,
      errors: result.errors,
      warnings,
    };
  }

  /**
   * Validate and normalize comic images
   */
  validateComicImages(images: unknown): ValidationResult {
    if (!Array.isArray(images)) {
      return {
        isValid: false,
        errors: ['Images must be an array'],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    images.forEach((image, index) => {
      const imageResult = this.schemaValidator.validate('ComicImage', image);
      if (!imageResult.isValid) {
        imageResult.errors.forEach(error => {
          errors.push(`Image ${index}: ${error}`);
        });
      }

      // Check for potential S3 key issues
      const typedImage = image as ComicImage;
      if (typedImage.key && !typedImage.key.includes('.')) {
        warnings.push(`Image ${index}: S3 key may be missing file extension`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate and validate a slug from title
   */
  generateAndValidateSlug(title: string, existingSlugs: string[] = []): { slug: string; isUnique: boolean } {
    const baseSlug = generateSlugFromTitle(title);
    let slug = baseSlug;
    let counter = 1;
    let isUnique = !existingSlugs.includes(slug);

    while (!isUnique) {
      slug = `${baseSlug}-${counter}`;
      isUnique = !existingSlugs.includes(slug);
      counter++;
    }

    return { slug, isUnique: slug === baseSlug };
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    error: string, 
    details?: string, 
    timestamp?: string
  ): ErrorResponse {
    return {
      error: sanitizeUserInput(error),
      details: details ? sanitizeUserInput(details) : undefined,
      timestamp: timestamp || new Date().toISOString(),
    };
  }

  /**
   * Create validation error response
   */
  static createValidationErrorResponse(
    validationResult: ValidationResult
  ): ErrorResponse {
    const errorMessage = validationResult.errors.length > 0 
      ? validationResult.errors[0]
      : 'Validation failed';
    
    const details = validationResult.errors.length > 1
      ? validationResult.errors.slice(1).join('; ')
      : undefined;

    return this.createErrorResponse(
      `Validation Error: ${errorMessage}`,
      details
    );
  }

  /**
   * Map validation errors to specific error codes
   */
  static mapValidationError(error: string): ValidationErrorCode {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('uuid')) return ValidationErrorCode.INVALID_UUID;
    if (errorLower.includes('title')) return ValidationErrorCode.INVALID_TITLE;
    if (errorLower.includes('slug')) return ValidationErrorCode.INVALID_SLUG;
    if (errorLower.includes('caption')) return ValidationErrorCode.INVALID_CAPTION;
    if (errorLower.includes('images')) return ValidationErrorCode.INVALID_IMAGES;
    if (errorLower.includes('tag')) return ValidationErrorCode.INVALID_TAG;
    if (errorLower.includes('date')) return ValidationErrorCode.INVALID_DATE;
    if (errorLower.includes('datetime')) return ValidationErrorCode.INVALID_DATETIME;
    if (errorLower.includes('required')) return ValidationErrorCode.MISSING_REQUIRED_FIELD;
    if (errorLower.includes('maxlength')) return ValidationErrorCode.FIELD_TOO_LONG;
    if (errorLower.includes('minlength')) return ValidationErrorCode.FIELD_TOO_SHORT;
    
    return ValidationErrorCode.INVALID_FORMAT;
  }
}

/**
 * Utility functions for data processing and validation
 */
export class DataProcessor {
  /**
   * Process and validate upload metadata before saving
   */
  static processUploadMetadata(rawMetadata: unknown): {
    processedData: Comic | null;
    validationResult: ValidationResult;
  } {
    const validator = new ComicValidator();
    const validationResult = validator.validateUploadMetadata(rawMetadata);
    
    if (!validationResult.isValid) {
      return { processedData: null, validationResult };
    }

    const metadata = rawMetadata as UploadMetadata;
    
    // Add auto-generated fields
    const processedData: Comic = {
      ...metadata,
      uploadDate: new Date().toISOString(),
      // Normalize tags
      tags: metadata.tags?.map(tag => normalizeTag(tag)),
      // Ensure slug is valid
      slug: generateSlugFromTitle(metadata.title),
      // Apply defaults
      scrollStyle: metadata.scrollStyle || DEFAULT_VALUES.SCROLL_STYLE,
    };

    return { processedData, validationResult };
  }

  /**
   * Prepare comic data for API response
   */
  static prepareComicForResponse(comic: Comic): Comic {
    return {
      ...comic,
      caption: sanitizeUserInput(comic.caption),
      title: sanitizeUserInput(comic.title),
      tags: comic.tags?.map(tag => sanitizeUserInput(tag)),
    };
  }

  /**
   * Validate and prepare comics response
   */
  static prepareComicsResponse(
    comics: Comic[],
    page: number,
    hasNextPage: boolean,
    tag?: string
  ): ComicsResponse {
    return {
      items: comics.map(comic => this.prepareComicForResponse(comic)),
      page: Math.max(1, page),
      hasNextPage: Boolean(hasNextPage),
      tag: tag ? sanitizeUserInput(tag) : undefined,
    };
  }
}

/**
 * Configuration validator
 */
export class ConfigValidator {
  private schemaValidator: SchemaValidator;

  constructor() {
    this.schemaValidator = new SchemaValidator();
  }

  /**
   * Validate application configuration
   */
  validateAppConfig(config: unknown): ValidationResult {
    return this.schemaValidator.validate('AppConfig', config);
  }

  /**
   * Validate cache configuration
   */
  validateCacheConfig(config: unknown): ValidationResult {
    const result = this.schemaValidator.validate('CacheConfig', config);
    
    if (result.isValid) {
      const typedConfig = config as CacheConfig;
      const warnings: string[] = [];

      // Check for potential performance issues
      if (typedConfig.pageSize > 50) {
        warnings.push('Page size > 50 may impact performance');
      }

      if (typedConfig.ttl < 5) {
        warnings.push('TTL < 5 minutes may cause excessive cache invalidation');
      }

      return { ...result, warnings };
    }

    return result;
  }
}

// Singleton instances for easy access
export const schemaValidator = new SchemaValidator();
export const comicValidator = new ComicValidator();
export const configValidator = new ConfigValidator();
