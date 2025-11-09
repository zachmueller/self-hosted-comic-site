# Self-Hosted Comic Site - Enhanced Features

**Created:** November 8, 2025
**Status:** Draft
**Derived From:** Original monolithic comic site specification (refactored November 2025)
**Related Specs:** 
- [Core MVP](core-mvp-spec.md) - Prerequisites
- [Series Management](series-management-spec.md) 
- [Raw Sketches](raw-sketches-spec.md)
- [Reader Login System](reader-login-spec.md) - Integrates with management interface

## Overview
Advanced functionality that enhances the core comic site with one-time migration capabilities, advanced management features, thumbnail generation, and improved user experience. These features build upon the MVP foundation to provide a more robust and feature-rich comic publishing platform.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- One-time bulk migration enables efficient import of existing comic collections
- Advanced management interface reduces time spent on repetitive tasks
- Publish/unpublish controls provide flexible content management
- Error recovery features minimize frustration during upload workflows
- CSV-based migration system supports artists transferring complete comic libraries from other platforms

### Cost Impact Assessment
**Estimated cost implications:**
- Additional Lambda execution for thumbnail processing: ~$0.25-0.50/month
- Additional S3 storage for thumbnail images: ~$0.25-0.50/month
- CloudFront bandwidth for thumbnail delivery: ~$0.25/month
- **Total monthly cost impact: $0.75-1.25**
- **Validation: Total system cost still under $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- Enhanced Lambda functions for image processing and migration operations
- Extends existing DynamoDB schema with additional management metadata
- Uses existing S3 and CloudFront infrastructure with optimized delivery
- No additional infrastructure components required

### Deployment Simplicity
**Deployment approach:**
- Enhanced features deployable via existing `cdk deploy` command
- Thumbnail processing pipeline configured automatically via CDK
- No manual setup required for thumbnail generation

## User Stories
- As a comic artist, I want to perform a one-time bulk import of my existing comic backlog using CSV metadata so that I can efficiently migrate my complete comic history to my new site
- As a comic artist, I want to set custom publication dates for historical comics so that I can import my existing collection chronologically
- As a comic artist, I want to unpublish comics temporarily so that I can make corrections without permanent deletion
- As a comic artist, I want thumbnails generated automatically so that homepage and navigation areas load quickly
- As a comic artist, I want advanced error recovery so that interrupted uploads don't lose my work
- As a comic artist, I want to edit comic metadata after publication so that I can make corrections and improvements
- As a comic reader, I want fast-loading thumbnails for browsing so that I can quickly preview content
- As a site administrator (artist), I want to use a custom domain so that my site has professional branding

## Functional Requirements

### FR-E1: CSV-Based Batch Migration System
**Description:** Two-stage CSV-based system for one-time migration of existing comic backlogs, optimized for artists with large collections published elsewhere
**Acceptance Criteria:**
- **Stage 1 - Image Bulk Upload:**
  - System-appropriate file upload interface supports selecting and uploading 50+ comic images in single batch (drag-and-drop from file explorer on desktop systems, native file picker on mobile platforms)
  - System processes each image through thumbnail generation pipeline
  - Upon completion, system generates downloadable CSV mapping original filename to assigned UUID
  - Artist filenames must be unique (system validates and provides clear error messaging)
  - Upload progress tracking shows processing status of each image file
  - Failed image processing doesn't affect successfully processed images in batch
- **Stage 2 - Metadata CSV Import:**
  - Artist provides CSV with comic metadata (title, description, tags, series, publishDate, etc.)
  - Each row represents one comic with ordered reference to image filenames from Stage 1
  - Backend Lambda function joins metadata CSV with filename-to-UUID mapping from Stage 1
  - System validates all referenced filenames exist in processed image collection
  - Bulk comic creation respects artist-specified publication dates for chronological import
  - Error handling provides detailed feedback on CSV format or missing image references
- **Migration Workflow Features:**
  - Clear UX messaging explains two-stage process and filename uniqueness requirement
  - CSV template generation with proper column headers and example data
  - Comprehensive validation before final import commit with preview functionality
  - Support for both final comic images and sketch images when raw sketch functionality enabled

### FR-E2: Publish Status Management
**Description:** Advanced publication controls for content lifecycle management
**Acceptance Criteria:**
- **Extended Comic Metadata:**
  - `publishStatus` (string): Values include 'published', 'unpublished', 'draft'
  - `publishDate` (timestamp): Scheduled publication date (future dates for scheduling)
  - `lastModified` (timestamp): Track content update history
- Artists can unpublish comics to temporarily hide content without deletion
- Draft status allows saving work-in-progress without making content visible to readers
- Scheduled publishing enables setting future publication dates
- Unpublished comics remain accessible to artist in management interface
- Reader-facing interfaces only display comics with 'published' status

### FR-E3: Thumbnail Generation
**Description:** Automated thumbnail generation for homepage and navigation areas
**Acceptance Criteria:**
- Automatic generation of thumbnail images (300px width) for use in listing and navigation contexts
- Original full-size images preserved and served for all comic viewing
- Thumbnail processing handled via Lambda functions during upload
- Generated thumbnails stored with systematic S3 key naming for efficient retrieval
- Fallback to original images if thumbnail generation fails
- Both final comic images and sketch images processed for thumbnail generation

### FR-E4: Advanced Error Handling and Recovery
**Description:** Robust error handling that preserves user work and enables recovery from failures
**Acceptance Criteria:**
- Form data persistence in browser localStorage during upload failures
- Partial upload recovery: successfully uploaded images preserved during batch failures  
- Network interruption recovery maintains upload progress where possible
- Clear error reporting with actionable guidance for resolution
- Upload retry mechanisms for transient failures (network, service availability)
- Metadata validation prevents common data entry errors before upload
- Session timeout handling preserves work and prompts for reauthentication

### FR-E5: Advanced Management Interface
**Description:** Enhanced content management tools for published comic administration
**Acceptance Criteria:**
- Comic listing interface with sorting, filtering, and search capabilities
- Bulk metadata editing for multiple comics (tags, series, publish status)
- Comic analytics: view counts, popular content identification (cost-conscious implementation)
- Quick actions: bulk publish/unpublish, bulk tag management
- Content preview before publication with mobile/desktop view simulation
- Image replacement functionality for updating published comics
- **Thumbnail Selection for Published Comics:** Artists can change thumbnail selection for any published comic:
  - Comic edit interface displays all images from the comic with current thumbnail highlighted
  - Artist can select any image as the new thumbnail via click (desktop) or touch (mobile) interface
  - Thumbnail preview shows how selected image appears in listing contexts before saving changes
  - Changes apply immediately across homepage, tag pages, and related comic displays
  - Selection interface matches upload workflow design for consistency
- Management interface optimized for both desktop and iPad usage
- **Tag Management Interface:** Comprehensive tag administration including:
  - View all tags used across comics with usage counts
  - Edit tag names and descriptions for consistency
  - Designate tags as series (toggle series status for existing tags)
  - **Control navigation tag highlighting:** Toggle whether individual tags are highlighted on the Tags navigation page (similar to Series designation)
  - Merge duplicate or similar tags with bulk reassignment
  - Delete unused tags with confirmation workflow
  - Tag categorization and organization tools
  - Navigation highlighting management: artists control which tags are featured in reader-facing tag navigation
- **Reader Engagement Integration:** Access point to reader moderation dashboard when reader login system is deployed (see [Reader Login System](reader-login-spec.md))
- **Engagement Analytics Integration:** Comic performance metrics include reader reaction and comment data when available

### FR-E6: Custom Domain Configuration
**Description:** Support for custom domain setup with manual DNS configuration to maintain cost efficiency
**Acceptance Criteria:**
- CDK deployment generates CloudFront distribution with custom domain support
- Manual DNS setup documentation with specific CNAME configuration instructions
- SSL certificate provisioning via AWS Certificate Manager
- Domain validation process integrated into deployment workflow
- Custom domain configuration via CDK context variables
- Automatic redirect from default CloudFront domain to custom domain
- Cost-conscious approach: manual CNAME setup avoids Route 53 charges

### FR-E7: Panel Reordering System
**Description:** Comprehensive panel reordering functionality for both comic images and raw sketches, integrated into upload workflow and available for post-publication editing
**Acceptance Criteria:**
- **Upload Workflow Integration:**
  - Panel reordering step appears after image upload but before final publication in new comic creation flow
  - Artist can reorder both final comic images and raw sketch images independently using drag-and-drop interface on desktop and touch-based reordering on mobile devices
  - Visual preview shows current panel order with thumbnail representations of each image
  - Reordering interface works seamlessly on both desktop (mouse-based) and iPad (touch-based) platforms
  - Artist can skip reordering step to maintain original upload order, or actively reorder panels before publication
  - Changes to panel order are reflected immediately in preview without requiring form resubmission
- **Post-Publication Management:**
  - Panel reordering available through enhanced management interface for any published comic
  - Artist can access reordering interface from comic edit/management screen at any time after publication
  - Separate reordering interfaces for final comic images and raw sketch images when both are present
  - Changes to panel order update live content immediately without affecting other comic metadata
  - Reordering preserves all existing image metadata including alt text and S3 storage keys
- **Technical Implementation:**
  - Panel order stored as array indices in comic metadata (`images` and `sketchImages` arrays)
  - Drag-and-drop interface supports both mouse interactions (desktop) and touch gestures (mobile/tablet)
  - Real-time preview updates show how reordered panels will appear in both carousel and long-form display modes
  - Undo/redo functionality allows artist to revert reordering changes during editing session
  - Auto-save preserves reordering changes without requiring explicit save action
- **Constitutional Compliance:**
  - Panel reordering prioritizes artist creative control over reader convenience
  - No additional AWS infrastructure costs - uses existing DynamoDB array ordering
  - Feature deployable via existing CDK deployment process without manual setup

### FR-E8: Configurable Site Footer Management
**Description:** Artist-configurable footer component with customizable content and external links for professional site branding
**Acceptance Criteria:**
- **Footer Configuration Interface:**
  - Artist-accessible footer editor available in management dashboard when authenticated
  - Rich text editor for footer content with basic formatting (bold, italic, links)
  - Multiple external link configuration with title and URL fields
  - Preview functionality shows footer appearance before saving changes
  - Mobile-responsive preview for both desktop and mobile footer layouts
- **Footer Content Management:**
  - Footer text content supports artist bio, contact information, and call-to-action messaging
  - External link management allows adding links to other websites (portfolio, social media, shop, etc.)
  - Link validation ensures URLs are properly formatted before saving
  - Footer content updates apply immediately across all site pages
  - Content length limits prevent footer from overwhelming page layout
- **Footer Display Features:**
  - Footer appears consistently across all reader-facing pages (homepage, comic pages, search results)
  - Responsive design ensures footer readability on all device sizes
  - Professional styling matches overall site aesthetic
  - External links open in new tabs/windows to retain reader on comic site
  - Footer remains accessible but unobtrusive to comic content focus
- **Constitutional Compliance:**
  - Footer configuration prioritizes artist's professional needs and branding goals
  - No additional infrastructure costs - uses existing DynamoDB for configuration storage
  - Simple CDK deployment includes footer functionality without additional manual setup

## Non-Functional Requirements

### NFR-E1: Enhanced Performance
**Description:** Performance optimizations that build upon MVP targets with advanced features
**Acceptance Criteria:**
- Thumbnails improve loading times: thumbnails under 500ms, original images serve at full quality
- Bulk upload processing completes within reasonable timeframes (10 comics under 15 minutes)
- Management interface operations (filtering, sorting, editing) complete under 1 second
- Image processing pipeline completes within 2 minutes of upload completion
- CDN cache optimization reduces bandwidth costs while maintaining performance

### NFR-E2: Scalability and Cost Control
**Description:** Enhanced features designed to scale efficiently within cost constraints
**Acceptance Criteria:**
- Image processing costs scale predictably with upload volume
- Thumbnail storage overhead remains under 25% of original image storage costs
- Migration operations optimized for minimal Lambda execution time
- Management interface queries designed for cost-effective DynamoDB usage
- Cost monitoring includes enhanced features in budget tracking and alerting

### NFR-E3: Reliability and Data Integrity
**Description:** Robust system behavior with advanced functionality
**Acceptance Criteria:**
- Migration uploads maintain data consistency even with partial failures
- Image processing failures don't affect comic publication (fallback to originals)
- Publish status changes maintain referential integrity across all interfaces
- Error recovery preserves all user-entered data during system failures
- Backup and recovery procedures account for enhanced metadata and thumbnail images

## User Scenarios & Testing

### CSV-Based Historical Comics Migration Flow
1. Artist prepares 50 historical comic images with unique filenames for import
2. **Stage 1:** Artist accesses image bulk upload interface and uploads all comic files
3. System processes each image (thumbnail generation) with progress tracking
4. Upon completion, artist downloads CSV file mapping original filename to system UUID
5. **Stage 2:** Artist creates metadata CSV using downloaded template, referencing original filenames
6. Artist uploads metadata CSV - system validates and shows preview of comic creation
7. Artist confirms import - backend Lambda joins metadata with image UUIDs and creates comics
8. All comics published with correct chronological ordering and complete metadata

### Advanced Content Management Flow
1. Artist reviews published comics in management interface
2. Artist identifies comics needing tag updates and selects them for bulk editing
3. Artist applies new tags across selected comics in single operation
4. Artist temporarily unpublishes one comic for content revision
5. Artist updates comic content and republishes with preserved metadata
6. All changes reflected immediately across reader-facing interfaces

### Panel Reordering Workflow Integration
1. Artist uploads multiple comic images during new comic creation
2. Upload completes and artist proceeds to panel reordering step
3. **Upload Integration:** Artist sees thumbnail preview of all uploaded panels in current order
4. Artist uses drag-and-drop (desktop) or touch gestures (iPad) to reorder panels
5. **Real-time Preview:** Changes reflect immediately in preview showing both carousel and long-form layouts
6. Artist confirms panel order or skips to maintain upload order
7. Artist completes publication with finalized panel sequence
8. **Post-Publication Management:** Artist later accesses comic management interface
9. Artist opens panel reordering tool for published comic from edit screen
10. Artist reorders panels using same drag-and-drop interface with undo/redo support
11. Changes auto-save and update live content immediately without affecting other metadata

### Thumbnail and Full Image Delivery Flow
1. Reader visits comic site on mobile device with slow connection
2. System serves thumbnail images for homepage browsing (fast loading)
3. Reader opens specific comic - system serves full-resolution original images
4. Reader later visits same site on desktop - system serves same full-resolution original images
5. CDN caching ensures subsequent visits load even faster
6. Original image quality preserved for all readers regardless of device

## Success Criteria
- CSV-based migration of 50+ comics completable in under 2 hours end-to-end (both stages)
- Stage 1 image processing completes within 1 minute per image on average
- Stage 2 metadata import validates and creates comics from CSV within 5 minutes
- Thumbnails improve homepage browsing performance with fast loading times
- Management interface operations provide sub-second response for all actions
- Enhanced features add less than $1.25/month to hosting costs
- Error recovery preserves 100% of user-entered metadata during failures
- Custom domain setup completable in under 30 minutes with provided documentation
- **Panel Reordering Success Metrics:**
  - Panel reordering interface loads and displays thumbnails within 2 seconds
  - Drag-and-drop reordering operations complete with immediate visual feedback (under 100ms response)
  - Panel reordering workflow adds less than 1 minute to overall upload process when used
  - Real-time preview updates complete within 500ms of reordering action
  - Auto-save functionality preserves panel order changes without data loss
  - Cross-device compatibility: 95%+ success rate for reordering on both desktop and iPad platforms
  - Post-publication panel reordering changes reflect in live content within 30 seconds

## Key Entities

### Enhanced Comic Entity
- **Additional Attributes:**
  - `publishStatus` (string): Publication status ('published', 'unpublished', 'draft')
  - `publishDate` (timestamp): Scheduled or actual publication date
  - `lastModified` (timestamp): Content update tracking
  - `thumbnailUrls` (object): Generated thumbnail image URLs for listing contexts
  - `sketchThumbnailUrls` (object): Thumbnail URLs for sketch images (if raw sketches enabled)
  - `viewCount` (number, optional): Simple view tracking for analytics
- **Validation:** Enhanced validation for publish status workflows and scheduling
- **Relationships:** Same as MVP with additional management metadata

### Migration Operation Entity
- **Attributes:** migrationId, operationType, status, progress, itemCount, failureCount, createdDate
- **Validation:** Tracks one-time migration operation progress and results
- **Relationships:** Associated with multiple comics via migration processing

### Thumbnail Entity
- **Attributes:** originalKey, thumbnailKey, processingStatus, createdDate
- **Validation:** Ensures thumbnails properly generated and accessible
- **Relationships:** Associated with parent comic images (final or sketch)

## Implementation Notes

### Technical Architecture Decisions
- Thumbnail generation uses AWS Lambda with image processing libraries
- Migration operations implemented as asynchronous processes with progress tracking
- Publish status leverages DynamoDB GSI for efficient status-based queries
- Custom domain configuration integrated into existing CDK stack
- Error recovery utilizes browser localStorage and server-side transaction handling

### Clarifications from Original Spec
- Image processing: Generate thumbnails for listing contexts while preserving original full-size images for viewing
- Custom domain: Manual DNS setup to save costs - artist configures CNAME records pointing to CloudFront distribution
- **CSV-based bulk migration:** Two-stage process optimized for one-time backlog import rather than regular batch operations
  - Stage 1: Bulk image upload and processing with filename-to-UUID mapping generation
  - Stage 2: CSV metadata import with backend joining of datasets via Lambda function
- Publish controls: Immediate publish/unpublish capabilities and draft status management
- **Migration workflow:** Designed specifically for artists moving existing comic collections from other platforms

### Integration with Other Features
- Compatible with series management - migration operations respect series ordering and assignment
- Integrates with raw sketches - thumbnail generation applies to both final and sketch content
- Extends MVP authentication and upload workflows without disrupting existing functionality
- **Reader Login System Integration:** Management interface provides access to reader engagement dashboard and includes reader interaction analytics in comic performance metrics
- Migration operations can include reader engagement data when exporting analytics or managing content with high reader interaction

## Out of Scope
- Advanced analytics requiring third-party services or complex infrastructure
- Multi-user collaboration or workflow management
- Advanced SEO optimization beyond basic thumbnails and custom domains
- Complex content versioning or revision history beyond basic edit tracking
- Advanced image editing or manipulation beyond responsive sizing

## Dependencies
- **Required:** Core MVP functionality must be implemented and operational
- **Recommended:** Raw sketches spec implementation enhances migration operations
- **Optional:** Series management functionality benefits from migration tagging operations
- **Infrastructure:** Builds upon existing AWS services without additional components
- **Migration:** Enhanced metadata fields require database schema updates deployable via CDK
