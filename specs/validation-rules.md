# Validation Rules for Self-Hosted Comic Site

This document describes the validation rules and requirements for all data structures in the comic site application.

## Comic Metadata Validation

### Required Fields

All comics must include these required fields:

- **id**: Unique identifier (UUID v4 format)
- **title**: Comic title (1-200 characters)
- **slug**: URL-safe unique identifier
- **caption**: Comic description or text content
- **images**: Array of comic images (minimum 1, maximum 20)
- **happenedOnDate**: Date when comic events occurred (ISO 8601 date format)
- **postedTimestamp**: When comic was posted (ISO 8601 datetime format)
- **uploadDate**: When comic was uploaded (auto-generated, ISO 8601 datetime format)

### Field Specifications

#### ID Field
- **Format**: UUID version 4
- **Pattern**: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` where x is hex digit, y is 8,9,A,or B
- **Example**: `550e8400-e29b-41d4-a716-446655440000`
- **Validation**: Must match UUID v4 pattern exactly

#### Title Field
- **Length**: 1-200 characters
- **Content**: Any text, but will be sanitized for display
- **Usage**: Used to generate slug if slug not provided
- **Validation**: Cannot be empty, cannot exceed 200 characters

#### Slug Field
- **Format**: URL-safe lowercase string
- **Pattern**: Lowercase letters, numbers, and hyphens only
- **Length**: 1-100 characters
- **Format**: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- **Examples**: `my-first-comic`, `adventure-in-space`, `comic-123`
- **Invalid Examples**: `My-Comic` (uppercase), `comic_with_underscore`, `comic@special`
- **Validation**: Must be unique across all comics

#### Caption Field
- **Content**: Any text content describing the comic
- **Length**: No specific limit, but will be sanitized
- **Usage**: Displayed as comic description
- **Validation**: Cannot be null/undefined

#### Images Array
- **Size**: 1-20 images required
- **Structure**: Array of ComicImage objects
- **Validation**: Must contain at least one image, cannot exceed 20 images

##### ComicImage Structure
- **key** (required): S3 object key
  - Length: 1-1024 characters
  - Pattern: `^[a-zA-Z0-9/_.-]+$`
  - Examples: `comics/2023/my-comic.jpg`, `images/panels/panel-01.png`
- **altText** (optional): Accessibility description
  - Length: 0-500 characters
  - Usage: Screen reader accessibility
- **order** (optional): Display order
  - Type: Non-negative integer
  - Usage: Explicit ordering (defaults to array index)

#### Tags Array (Optional)
- **Size**: 0-50 tags maximum
- **Tag Format**: 1-100 characters each
- **Pattern**: `^[a-zA-Z0-9\s-_]+$` (letters, numbers, spaces, hyphens, underscores)
- **Examples**: `humor`, `cats and dogs`, `sci-fi`, `adventure_story`
- **Invalid Examples**: `tag@special`, `tag#hash`, `tag%percent`
- **Validation**: Must be unique within the array
- **Normalization**: Converted to lowercase, spaces normalized

#### Date Fields

##### happenedOnDate
- **Format**: ISO 8601 date (YYYY-MM-DD)
- **Example**: `2023-10-15`
- **Validation**: Must be valid date, can be in past or future
- **Business Logic**: Warning if in future

##### postedTimestamp
- **Format**: ISO 8601 datetime with timezone
- **Example**: `2023-10-16T10:30:00.000Z`
- **Validation**: Must be valid datetime
- **Business Logic**: Warning if in future

##### uploadDate
- **Format**: ISO 8601 datetime with timezone
- **Generation**: Auto-generated on upload
- **Example**: `2023-10-16T10:31:15.234Z`
- **Validation**: Must be valid datetime

#### Scroll Style (Optional)
- **Values**: `standard` or `long`
- **Default**: `standard`
- **Usage**: Determines comic display style

#### Integrations Array (Optional)
- **Size**: No limit
- **Structure**: Array of Integration objects

##### Integration Structure
- **type** (required): Integration category
  - Values: `social`, `analytics`, `syndication`
- **use** (required): Whether integration is enabled
  - Type: Boolean
- **config** (optional): Integration-specific settings
  - Type: Object with any properties

## API Response Validation

### ComicsResponse Structure
- **items**: Array of Comic objects (validated per comic rules)
- **page**: Current page number (minimum 1)
- **hasNextPage**: Boolean indicating if more pages exist
- **tag** (optional): Tag filter applied (1-100 characters, same pattern as comic tags)

### ErrorResponse Structure
- **error**: Error message or code (required, minimum 1 character)
- **details** (optional): Additional error information
- **timestamp**: When error occurred (ISO 8601 datetime, auto-generated)

## Configuration Validation

### AppConfig Structure
- **userPoolId**: Cognito User Pool ID
  - Pattern: `^[a-z0-9-]+_[a-zA-Z0-9]+$`
  - Example: `us-west-2_abc123DEF`
- **clientId**: Cognito App Client ID
  - Length: 20-30 characters
  - Example: `1234567890abcdef12345678`
- **identityPoolId**: Cognito Identity Pool ID
  - Pattern: `^[a-z0-9-]+:[a-f0-9-]+$`
  - Example: `us-west-2:12345678-1234-1234-1234-123456789012`
- **region**: AWS region
  - Pattern: `^[a-z0-9-]+$`
  - Example: `us-west-2`, `eu-central-1`
- **bucketName**: S3 bucket name
  - Length: 3-63 characters
  - Pattern: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`
  - Example: `my-comic-site-bucket`
- **cognitoDomain**: Cognito authentication domain
  - Format: Valid URI
  - Example: `https://my-comic-site.auth.us-west-2.amazoncognito.com`

### CacheConfig Structure
- **pageSize**: Comics per page
  - Range: 1-100
  - Default: 10
  - Performance Warning: Values > 50 may impact performance
- **ttl**: Cache TTL in minutes
  - Range: 1-10080 (1 week)
  - Default: 60
  - Performance Warning: Values < 5 may cause excessive invalidation
- **invalidationPaths**: CloudFront paths to invalidate
  - Format: Array of strings starting with `/`
  - Example: `["/api/comics", "/comics/*", "/tags/*"]`

## Validation Error Codes

The system uses standardized error codes for validation failures:

- `INVALID_UUID`: UUID format is incorrect
- `INVALID_TITLE`: Title validation failed (length, content)
- `INVALID_SLUG`: Slug format is incorrect
- `INVALID_CAPTION`: Caption validation failed
- `INVALID_IMAGES`: Images array validation failed
- `INVALID_TAG`: Tag format or content is incorrect
- `INVALID_DATE`: Date format is incorrect (ISO 8601)
- `INVALID_DATETIME`: Datetime format is incorrect (ISO 8601)
- `INVALID_SCROLL_STYLE`: Scroll style not in allowed values
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `FIELD_TOO_LONG`: Field exceeds maximum length
- `FIELD_TOO_SHORT`: Field is below minimum length
- `INVALID_FORMAT`: General format validation failure
- `DUPLICATE_VALUES`: Duplicate values where uniqueness required

## Business Logic Warnings

In addition to validation errors, the system may issue warnings for:

- Slug doesn't match auto-generated slug from title
- Mixed image ordering (some images have explicit order, others don't)
- Future dates in `happenedOnDate` or `postedTimestamp`
- `happenedOnDate` is after `postedTimestamp`
- S3 keys that may be missing file extensions
- Performance concerns (page size > 50, cache TTL < 5 minutes)

## Data Processing Rules

### Upload Processing
1. Validate upload metadata against `UploadMetadata` schema
2. Generate `uploadDate` timestamp
3. Normalize tags (lowercase, trim whitespace)
4. Ensure slug is URL-safe (regenerate from title if needed)
5. Apply default values (`scrollStyle` defaults to `standard`)
6. Create full `Comic` object with auto-generated fields

### API Response Processing
1. Sanitize all user-generated content for XSS prevention
2. Validate all comics in response array
3. Ensure page number is at least 1
4. Sanitize tag filter if present

### Configuration Processing
1. Validate all AWS resource identifiers
2. Check URI format for Cognito domain
3. Verify S3 bucket naming conventions
4. Validate performance-related settings with warnings

## Testing Guidelines

Use the provided test fixtures to validate:

- **Valid Data**: `test/fixtures/valid-comics.json`, `test/fixtures/valid-responses.json`
- **Invalid Data**: `test/fixtures/invalid-comics.json`

Each invalid test case includes a description of what validation rule it violates, making it easy to verify that validation is working correctly.

## Integration with Existing Code

These validation rules should be integrated with:

1. **Lambda Functions**: Add validation to upload processing and API responses
2. **Frontend Code**: Client-side validation before submission
3. **CDK Stack**: Configuration validation during deployment
4. **Database Operations**: Validation before DynamoDB writes
5. **S3 Operations**: Key format validation before storage

The validation utilities in `specs/validation.ts` provide ready-to-use functions for implementing these rules throughout the application.
