# Self-Hosted Comic Site - Core MVP

**Created:** November 8, 2025
**Status:** Draft
**Derived From:** Original monolithic comic site specification (refactored November 2025)
**Related Specs:** 
- [Series Management](series-management-spec.md)
- [Raw Sketches](raw-sketches-spec.md) 
- [Enhanced Features](enhanced-features-spec.md)
- [Reader Login System](reader-login-spec.md) - Optional engagement features

## Overview
Core MVP functionality for a CDK-based package that enables individual comic artists to easily deploy and manage their own AWS-hosted comic website. This spec covers the essential features needed for a functional comic site with artist upload capabilities and reader browsing.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- iPad-optimized upload interface for artists who prefer mobile content creation
- Single-artist authentication model with optional reader engagement features 
- Artist-centric content management with immediate publish capabilities
- Upload workflow designed for minimal technical knowledge requirements

### Cost Impact Assessment
**Estimated cost implications:**
- S3 storage for comic images: ~$2-4/month (depending on volume)
- CloudFront CDN for content delivery: ~$1-2/month  
- DynamoDB for metadata storage: ~$0.50-1/month
- Lambda execution costs: ~$0.25-0.50/month
- **Total monthly cost impact: $3.75-7.50**
- **Validation: Well within $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- AWS Lambda for API endpoints and content processing
- DynamoDB for comic metadata and configuration storage
- S3 for static comic image storage
- CloudFront for content delivery and caching
- API Gateway for RESTful endpoints
- Cognito for artist authentication (Google SSO integration)

### Deployment Simplicity
**Deployment approach:**
- Single CDK command: `cdk deploy` creates entire infrastructure
- Environment-specific configuration via CDK context
- Minor manual steps for DNS record updates (domain managed by external registrar)
- Self-contained deployment with minimal manual infrastructure setup

## User Stories
- As a comic artist, I want to easily upload my comics from my iPad so that I can publish content anywhere without requiring a computer
- As a comic artist, I want to authenticate using my Google account so that I don't need to manage separate login credentials
- As a comic artist, I want to organize my comics with tags so that readers can discover related content
- As a comic artist, I want to reference other comics within my captions using simple link syntax so that readers can discover related content naturally within the context of my writing
- As a comic artist, I want to define for each comic post whether its multiple images are shown in carousel form or simple long form so that I control the presentation of my content
- As a comic artist, I want to optionally provide alt text descriptions for my comic images so that readers using screen readers and assistive technology can understand my visual content
- As a comic artist, I want to reorder the panels of my comics during the upload process so that I can confirm the correct sequence before publication (see [Enhanced Features](enhanced-features-spec.md) for full panel reordering functionality)
- As a comic reader, I want to see the latest comics on the homepage so that I can quickly access new content
- As a comic reader, I want to browse comics by tags so that I can find content that matches my interests  
- As a comic reader, I want to see explicitly related comics on individual comic pages so that I can follow artist-intended connections and storylines
- As a comic reader, I want to view multi-image comics in a carousel format so that I can easily navigate through comic sequences
- As a comic reader, I want the entire site layout to adapt responsively to my device (desktop, tablet, mobile) so that I have an optimal viewing experience regardless of screen size
- As a comic reader, I want comics and navigation elements to be appropriately sized and positioned for my device context so that I can comfortably read and browse on any screen
- As a comic reader, I want touch-friendly controls on mobile devices and mouse-friendly controls on desktop so that interaction methods match my device capabilities
- As a comic reader, I want to access all content anonymously so that I can enjoy comics without requiring account creation (Note: Optional reader login system available for enhanced engagement - see [Reader Login System](reader-login-spec.md))
- As a site administrator (artist), I want simple CDK-based deployment so that I can maintain my site without complex server management

## Functional Requirements

### FR-1: Artist Authentication and Access Control
**Description:** Single-artist authentication system using AWS Cognito with Google federation for content management access
**Acceptance Criteria:**
- Artist can authenticate using AWS Cognito's Google identity provider federation
- Cognito user pool configuration supports Google sign-in with minimal manual setup
- Only authenticated artist has access to upload and management interfaces
- Reader access requires no authentication for published content
- Session management maintains artist login across upload sessions using Cognito tokens
- Secure logout functionality terminates artist sessions and invalidates Cognito tokens

### FR-2: Basic Comic Upload Interface  
**Description:** Mobile-friendly upload interface optimized for iPad usage and artist workflow, with desktop Chrome support
**Acceptance Criteria:**
- Upload interface renders properly on iPad Safari and Chrome browsers, with full functionality on desktop Chrome
- System-appropriate file upload interface: drag-and-drop from file explorer on desktop systems, native file picker on mobile platforms for multiple comic images in JPG, PNG, and WebP formats
- File size validation enforces 20MB maximum per image with clear error messaging
- Touch-friendly form controls for comic metadata entry including relationship selection and accessibility options
- **Date Field Pre-population:** `happenedOnDate` field automatically pre-populates with today's date for artist convenience
- **Accessibility Features:** Optional alt text input field for each uploaded image to support screen readers and assistive technology
- Real-time upload progress indicators for large image files
- Form validation provides clear error messages for missing required fields
- **Caption Reference System:** Support for linking to other comics within caption text using bracket syntax (e.g., "This continues from [[Previous Comic Title]]")
- Automatic parsing and validation of caption references during upload with real-time feedback for invalid comic titles
- Live autocomplete suggestions when typing comic references in caption field

### FR-3: Core Comic Metadata Management
**Description:** Essential metadata system supporting basic artist content organization and reader discovery
**Acceptance Criteria:**
- **Core Metadata Schema per Post:**
  - `id` (string): Unique identifier serving as DynamoDB partition key
  - `images` (array): Ordered list of comic panel images with metadata objects
    - Each image object contains: `s3Key` (string), `altText` (optional string)
    - Alt text provides accessibility description for screen readers and assistive technology
  - `title` (string): Display title for the post
  - `slug` (string): URL slug portion specific to this post
  - `caption` (string): Text displayed below each comic
  - `tags` (array of strings): List of tags applied to comic
  - `happenedOnDate` (date): Date when comic situation occurred
  - `scrollStyle` (string): Display style (`carousel` or `long`)
  - `postedTimestamp` (timestamp): Publication date
  - `derivedRelationships` (array): Automatically generated bidirectional connections from caption references
      - Each relationship contains: `targetComicId` (string), `sourceType` ('caption'|'series'|'tag')
      - Relationships automatically created/updated when caption references are parsed
      - Bidirectional relationships maintained automatically across referenced comics
  - `integrations` (array): Per-comic social media platform controls (see [Social Media Integration](social-media-integration-spec.md))
    - Each integration object contains: `type` (string), `use` (boolean)
    - Supported types: `instagram`, `facebook`
    - Default value: `[{"type": "instagram", "use": true}, {"type": "facebook", "use": true}]`
    - Artist can modify `use` values during upload to control per-comic social media posting
- Tag system supports reader filtering and content discovery with case-insensitive matching
- Comic slugs generated from titles for SEO-friendly URLs with duplicate detection requiring artist resolution
- Relationship system supports bidirectional connections with automatic inverse relationship creation

### FR-4: Caption-Based Comic Reference System
**Description:** Automatic relationship derivation from caption references using simple bracket syntax for natural comic linking
**Acceptance Criteria:**
- **Caption Reference Syntax:** Support for [[Comic Title]] syntax within caption text to create automatic links
- **Real-time Reference Validation:** During caption editing, system validates referenced comic titles and provides autocomplete suggestions
- **Automatic Relationship Derivation:** System parses caption text on save/publish and creates bidirectional relationships for all valid references
- **Bidirectional Maintenance:** When Comic A references Comic B in caption, both comics automatically show each other in derived relationships
- **Reference Cleanup:** When artist edits caption and removes a [[Comic Title]] reference, corresponding bidirectional relationships are automatically removed
- **Multiple References:** Single caption can contain multiple comic references, all creating separate bidirectional relationships
- **Reference Validation:** Invalid comic titles in brackets are highlighted with error messaging and don't create relationships
- **Case-Insensitive Matching:** Comic title matching for references is case-insensitive but preserves original display case

### FR-5: Reader Homepage and Basic Navigation
**Description:** Reader-facing homepage displaying latest comics with basic filtering, accessible to all visitors without authentication
**Acceptance Criteria:**
- Homepage displays 10 most recent comics ordered by publish date (descending)
- Pagination system for browsing complete comic history
- Tag-based filtering system for content discovery
- **Comprehensive Responsive Design:**
  - Mobile-first responsive layout adapts seamlessly to screen sizes from 320px to 1920px+ width
  - Comic thumbnails and grid layouts automatically adjust for optimal viewing on each device type
  - Navigation elements scale appropriately and remain easily accessible on all screen sizes
  - Touch targets meet minimum 44px size requirements on mobile devices
  - Typography scales responsively while maintaining readability across all devices
  - Filtering and pagination controls adapt to touch interaction on mobile and mouse interaction on desktop
- Anonymous access to all published content (no authentication required for basic reading experience)
- Optional integration points for reader engagement features (see [Reader Login System](reader-login-spec.md))

### FR-6: Multi-Image Comic Display
**Description:** Configurable display system allowing artists to choose between carousel and long form presentation with responsive layout adaptation
**Acceptance Criteria:**
- Artist can select display style per comic: carousel (default) or long form
- Single-image comics display normally without carousel controls regardless of chosen style
- **Carousel Mode with Responsive Behavior:**
  - Multi-image comics enable carousel navigation with touch/swipe gestures on mobile and keyboard arrow key support on desktop
  - Carousel controls (next/previous buttons) sized appropriately for device type (larger touch targets on mobile)
  - Image scaling maintains aspect ratio while fitting optimally within device viewport
  - Carousel indicators and navigation adapt to screen size constraints
- **Long Form Mode with Responsive Behavior:**
  - Multi-image comics display all images vertically in sequence with responsive sizing
  - Images scale to fit screen width while maintaining readability on all devices
  - Vertical spacing between images adjusts based on screen size and device type
- Image preloading optimizes performance for both display styles across all device types

### FR-7: Individual Comic Pages with Explicit Relationships
**Description:** Dedicated page view for single comics with comprehensive metadata and artist-defined relationship navigation, fully responsive across all device types
**Acceptance Criteria:**
- URL structure: `/comic/{slug}` for direct comic access
- Full comic metadata display including tags and explicit relationships with responsive layout adaptation
- **Related Comics Display with Responsive Design:**
  - Single "Related Comics" section with prioritized relationship display in the following order:
    1. **Explicit Relationships:** Comics referenced in caption text (derived from [[Comic Title]] syntax)
    2. **Series Relationships:** Other comics in the same Series (when Series system is implemented)  
    3. **Tag Relationships:** Comics sharing the same non-Series tags
  - Each relationship type clearly separated with appropriate headings
  - Clickable links to related comics with responsive thumbnail display
  - Caption-derived relationships show snippet of referencing text for context
  - **Device-Adaptive Navigation:** Related comic thumbnails and links resize and reflow for optimal display on mobile, tablet, and desktop
  - Touch-friendly interface on mobile devices with appropriate spacing and target sizes
- **Responsive Navigation Controls:**
  - Basic chronological next/previous navigation between comics (by "happened on" date) with device-appropriate button sizing
  - Navigation controls positioned optimally for each device type (bottom on mobile, sides on desktop)
- **Share Functionality with Cross-Device Support:**
  - Share button beneath each comic that copies the direct comic URL to clipboard
  - Simple one-click sharing without requiring external service integration
  - Visual feedback confirms successful URL copy (toast notification or button state change)
  - **Device-Optimized Positioning:** Share button positioned and sized appropriately for touch on mobile and mouse on desktop
  - Fallback behavior for browsers without clipboard API support across all device types

## Non-Functional Requirements

### NFR-1: Performance
**Description:** Performance targets appropriate for independent comic sites without expensive infrastructure, optimized across all device types and network conditions
**Acceptance Criteria:**
- Homepage loads in under 3 seconds on standard broadband connections across all device types
- Comic images load in under 2 seconds via CloudFront CDN
- Upload interface responds to user actions in under 1 second on both mobile and desktop platforms
- Pagination and filtering operations complete in under 2 seconds across all screen sizes
- **Cross-Device Performance Standards:**
  - Mobile performance maintained across iOS Safari and Android Chrome with 3G network simulation
  - Tablet performance optimized for both portrait and landscape orientations
  - Desktop performance leverages larger screens without sacrificing mobile experience
  - Responsive image loading adapts to device capabilities and network conditions
  - Layout reflow and responsive breakpoint changes complete in under 500ms

### NFR-2: Cost Efficiency  
**Description:** Architecture designed to stay well within $10/month hosting budget
**Acceptance Criteria:**
- CDN caching configured to minimize data transfer costs
- Lambda functions optimized for minimal execution time and memory usage
- DynamoDB queries designed for cost-effective read/write patterns
- Cost monitoring and alerting configured for budget threshold warnings

### NFR-3: Artist Workflow Optimization
**Description:** User experience requirements prioritizing comic artist productivity and ease of use
**Acceptance Criteria:**
- Complete upload workflow (login to published comic) completable in under 5 minutes
- Error recovery preserves user-entered metadata in browser storage during upload failures
- Mobile-first design ensures full functionality on artist's preferred devices

### NFR-4: Deployment and Maintenance
**Description:** Simple deployment and minimal ongoing maintenance requirements
**Acceptance Criteria:**
- Complete site deployment achievable via single `cdk deploy` command
- Infrastructure updates deployable without content loss or downtime
- Automatic SSL certificate management and renewal
- Built-in monitoring and error alerting for critical system components

## User Scenarios & Testing

### Primary Flow: Artist Comic Upload
1. Artist opens upload interface on iPad and authenticates via Google
2. Artist selects multiple comic image files using system-appropriate method (native file picker on mobile, drag-and-drop or file picker on desktop)
3. Artist fills out comic metadata (title, happened-on date, tags)
4. **Optional:** Artist includes references to existing comics in caption text:
   - Types caption text with comic references using [[Comic Title]] syntax
   - System provides real-time autocomplete suggestions for comic titles
   - System validates references and highlights any invalid comic titles
   - Can include multiple comic references within single caption
5. Artist initiates upload and receives real-time progress feedback
6. **Optional Panel Reordering:** Artist proceeds to panel reordering step (see [Enhanced Features](enhanced-features-spec.md) for full functionality):
   - System displays thumbnail preview of uploaded panels in current order
   - Artist can reorder panels using drag-and-drop (desktop) or touch gestures (iPad)
   - Real-time preview shows how reordered panels appear in both carousel and long-form modes
   - Artist can skip this step to maintain original upload order
7. Artist reviews uploaded comic in preview mode, including parsed caption references and final panel order
8. Artist publishes comic with all metadata, caption references, and confirmed panel sequence
9. Comic appears on homepage within 30 seconds of publication
10. **Automatic:** System parses caption references and creates bidirectional relationships

### Alternative Flows
- **Comic Upload with Caption References:** Artist includes [[Comic Title]] references in caption, system automatically creates bidirectional relationships
- **Relationship Discovery:** Reader finds new comic through relationship link on related comic's page, with context from original referencing caption
- **Caption Reference Network:** Artist creates multiple interconnected comics through natural caption references
- **Reference Editing:** Artist updates caption text and removes/adds comic references, system automatically maintains bidirectional relationships
- Content modification: Artist updates existing comic metadata, caption references, or replaces images
- Error recovery: Artist resumes interrupted upload after network disconnection, with caption text preserved in browser cache
- Reader browsing: Reader discovers comics via caption-derived relationships, series connections, and tag filtering

## Success Criteria
Measurable, constitutional-principle-aligned outcomes:
- Artist upload workflow completion time: under 5 minutes from login to published comic (including optional relationship creation)
- **Relationship functionality success metrics:**
  - Comic relationship creation success rate: 95%+ on mobile devices
  - Relationship search response time: under 1 second for live search results
  - Bidirectional relationship creation accuracy: 100% (no orphaned relationships)
  - Reader relationship navigation success rate: 95%+ click-through rate on relationship links
- **Responsive Design Success Metrics:**
  - Layout functionality verified across minimum 5 device breakpoints (320px, 768px, 1024px, 1440px, 1920px)
  - Touch interaction success rate: 95%+ on mobile devices for all primary functions
  - Cross-device consistency: Visual and functional parity maintained within 5% variance across device types
  - Responsive performance: Layout adaptation completes in under 500ms during orientation changes
  - Accessibility compliance: Responsive design meets WCAG 2.1 AA standards across all device types
- Monthly hosting costs: under $7.50 contributing to $10 total constitutional target
- Deployment time: under 15 minutes using CDK commands for complete site setup
- Reader homepage load time: under 3 seconds on standard connections across all device types
- System availability: 99.5% uptime using serverless architecture auto-scaling
- Mobile usability: 100% upload workflow completion rate on iPad devices
- **Cross-Device Reader Experience:** 90%+ user satisfaction scores for reading experience on mobile, tablet, and desktop devices

## Key Entities

### Comic Entity (MVP)
- **Attributes:** id, title, caption, happenedOnDate, postedTimestamp, images (with s3Key and optional altText), tags, slug, scrollStyle, derivedRelationships
- **Validation:** Required title and happenedOnDate, at least one image required, altText optional but recommended for accessibility
- **Caption Processing:** System automatically parses caption text for [[Comic Title]] references to derive relationships
- **Relationships:** 
  - Has multiple tags for discovery
  - Has multiple automatically-derived bidirectional relationships to other comics from caption references
  - Each relationship includes: targetComicId (string), sourceType ('caption'|'series'|'tag')
  - Each image includes: s3Key (required), altText (optional for accessibility)

### Comic Derived Relationship Entity
- **Attributes:** targetComicId (string), sourceType ('caption'|'series'|'tag')
- **Validation:** Valid targetComicId must reference existing comic, sourceType must be one of allowed values
- **Business Rules:** No self-references allowed, duplicate relationships to same target prevented within same sourceType, all relationships are bidirectional and automatically managed
- **Caption Source:** When sourceType is 'caption', relationship is derived from [[Comic Title]] syntax in caption text

### Artist Configuration
- **Attributes:** siteTitle, siteDescription, googleAuthConfig
- **Validation:** Required site title
- **Relationships:** Single artist per deployment model

## Assumptions
- Individual comic artists with basic technical skills and AWS account access
- Typical usage patterns: 1-10 new comics per month, 100-1000 total comics
- iPad as primary upload device with Safari or Chrome browser
- AWS infrastructure availability and current pricing structure
- Single-artist deployment model (not multi-tenant architecture)
- Standard web browser capabilities for readers (ES6+ JavaScript support)

## Out of Scope for MVP
Features explicitly excluded from MVP (see related specs):
- Series management and navigation (see [Series Management](series-management-spec.md))
- Raw sketch upload and display functionality (see [Raw Sketches](raw-sketches-spec.md))
- Bulk upload operations and advanced management (see [Enhanced Features](enhanced-features-spec.md))
- Advanced thumbnail generation (see [Enhanced Features](enhanced-features-spec.md))
- Publish/unpublish controls (see [Enhanced Features](enhanced-features-spec.md))
- Reader authentication, comments, and engagement features (see [Reader Login System](reader-login-spec.md))

## Implementation Notes

### Clarifications from Original Spec
- Image format restrictions: JPG, PNG, WebP with 20MB per image limit
- Authentication: AWS Cognito's built-in Google federation (not direct OAuth)
- Image storage: Store original images as-is to preserve artist's intended quality
- URL structure: `/comic/{slug}` for individual comics
- Upload failures: Simple restart for image uploads, cache metadata in browser
- Slug conflicts: Require artist to manually resolve during upload
- Tag matching: Case-insensitive matching while preserving original case display
