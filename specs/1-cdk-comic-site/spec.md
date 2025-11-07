# Self-Hosted Comic Site

**Created:** November 7, 2025
**Status:** Draft
**Branch:** 1-cdk-comic-site

## Overview
A CDK-based package that enables individual comic artists to easily deploy and manage their own AWS-hosted comic website. The system prioritizes artist workflow efficiency with an iPad-friendly upload interface, while providing readers with an intuitive browsing experience for published comics.

## Clarifications

### Session 2025-11-07
- Q: What are the image format and file size restrictions for comic uploads? → A: Accept common formats (JPG, PNG, WebP) with 20MB per image limit
- Q: How should the system handle Google OAuth configuration - should it require manual Google Cloud Console setup or provide automated configuration? → A: Use AWS Cognito's built-in Google federation instead of direct OAuth
- Q: Should the system automatically compress and optimize uploaded comic images to reduce storage costs and improve performance? → A: No - store original images as-is to preserve artist's intended quality
- Q: What URL structure should be used for individual comics and series pages? → A: Multiple access paths: `/comic/{slug}` for individual comics, `/tags/{tag}/{slug}` for tag-filtered access to same comic
- Q: How should the system handle upload failures and interrupted operations - should it support resume functionality or require complete restart? → A: Simple restart for image uploads, but cache metadata in browser to preserve user-entered form data
- Q: What should happen when two comics would generate the same URL slug from their titles? → A: Require artist to manually resolve conflicts during upload
- Q: Should the tag system be case-sensitive or case-insensitive for filtering and comic organization? → A: Case-insensitive - preserve original case but match regardless (Fantasy matches fantasy)
- Q: How should custom domain setup work for the CDK deployment? → A: Manual DNS setup to save on costs - artist configures CNAME records pointing to CloudFront distribution
- Q: Should the system serve different image sizes for different contexts or always serve original uploaded images? → A: Create responsive image sets (thumbnail, mobile, desktop) for optimal performance while preserving originals
- Q: How should series ordering work when artists add comics to a series? → A: Automatic ordering based on 'happened on' date within the series

### Implementation Gap Analysis 2025-11-07
- Q: Google authentication implementation status vs spec requirements? → A: Keep spec as-is and implement Google federation later
- Q: Responsive image generation implementation vs spec requirements? → A: Keep spec as-is and implement image optimization later
- Q: Series functionality data model and implementation status? → A: Series ordering within DynamoDB needs further implementation debate - specific approach TBD
- Q: Bulk operations implementation vs spec requirements? → A: Keep spec as-is and implement bulk operations later
- Q: Publish status controls implementation vs spec requirements? → A: Keep spec as-is and implement publish controls later

### Raw Sketches Feature Clarification 2025-11-07
- Q: How should artists upload raw sketches in the upload interface - as a separate field during the same upload workflow, or as an optional additional step after uploading final comic images? → A: Separate 'Raw Sketches' upload field in the same form as final comic images
- Q: What should the toggle UI element look like for readers switching between final comics and raw sketches? → A: Use icons specified later with artist input, not text labels
- Q: When a comic has both final images and raw sketches, but they have different counts (e.g., 1 raw sketch vs 3 final panels), how should the reader navigate between them? → A: Toggle controls viewing mode (Final vs Sketch), never showing both together. Browser remembers position when switching modes. Position sync only when sketch and final panel counts match; otherwise switching preserves original mode position
- Q: Should the raw sketch feature impact the homepage and browse views, or should those always show final comics only? → A: Global site-wide toggle in consistent location affects all comic displays across homepage, browse views, and individual comic pages
- Q: When a comic has only raw sketches (no final version), how should it behave with the global toggle - should the sketch be visible in both modes, or only when in sketch mode? → A: Show sketch-only comics in both modes since they represent the only available version

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- iPad-optimized upload interface for artists who prefer mobile content creation
- Single-artist authentication model eliminates complex user management
- Artist-centric content management with immediate publish/unpublish capabilities
- Upload workflow designed for minimal technical knowledge requirements
- Comic management interface prioritized over reader browsing features

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
- **No EC2 instances or managed servers required**

### Deployment Simplicity
**Deployment approach:**
- Single CDK command: `cdk deploy` creates entire infrastructure
- Environment-specific configuration via CDK context
- Automated SSL certificate provisioning for custom domains with manual CNAME configuration
- Self-contained deployment with no manual infrastructure setup

## User Stories
- As a comic artist, I want to easily upload my comics from my iPad so that I can publish content anywhere without requiring a computer
- As a comic artist, I want to authenticate using my Google account so that I don't need to manage separate login credentials
- As a comic artist, I want to organize my comics with tags and series information so that readers can discover related content
- As a comic artist, I want to upload raw sketches alongside my final comics so that readers can see my creative process
- As a comic reader, I want to see the latest comics on the homepage so that I can quickly access new content
- As a comic reader, I want to browse comics by tags so that I can find content that matches my interests  
- As a comic reader, I want to view multi-image comics in a carousel format so that I can easily navigate through comic sequences
- As a comic reader, I want to toggle between final comics and raw sketches site-wide so that I can explore the artist's creative process
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

### FR-2: iPad-Optimized Comic Upload Interface  
**Description:** Mobile-friendly upload interface optimized for iPad usage and artist workflow, with desktop Chrome support
**Acceptance Criteria:**
- Upload interface renders properly on iPad Safari and Chrome browsers, with full functionality on desktop Chrome
- Drag-and-drop file upload supports multiple comic images in JPG, PNG, and WebP formats
- Separate 'Raw Sketches' upload field in same form allows optional sketch upload alongside final comics
- File size validation enforces 20MB maximum per image with clear error messaging for both final and sketch uploads
- Touch-friendly form controls for comic metadata entry
- Real-time upload progress indicators for large image files (both final and sketches)
- Form validation provides clear error messages for missing required fields
- Comics can be published with only raw sketches, only final images, or both

### FR-3: Comic Metadata Management
**Description:** Comprehensive metadata system supporting artist content organization and reader discovery
**Acceptance Criteria:**
- **Metadata Schema per Post:**
  - `id` (string): Unique identifier serving as DynamoDB partition key
  - `images` (array): Ordered list of comic panel images with:
    - `key` (string): Full S3 key derived from SHA1 hash of image contents
    - `altText` (string, optional): Accessibility text included in search functionality
  - `title` (string): Display title for the post
  - `slug` (string): URL slug portion specific to this post
  - `caption` (string): Text displayed below each comic
  - `tags` (array of strings): List of tags applied to comic
  - `happenedOnDate` (date): Date when comic situation occurred
  - `scrollStyle` (string): Display style (`carousel` or `long`)
  - `postedTimestamp` (timestamp): Publication date (artist-selectable in bulk uploads)
- Tag system supports reader filtering and content discovery with case-insensitive matching while preserving original case display
- Series functionality implemented as tag attributes - each tag can optionally be flagged by the artist as a series
- Series-flagged tags function identically to regular tags for URL rendering and comic association
- Series ordering based on 'happened on' date within comics sharing the same series-flagged tag
- **Implementation Note:** Series ordering within DynamoDB requires further architectural debate to determine optimal approach
- Bulk metadata editing for multiple comics with artist-selectable publish dates

### FR-4: Reader Homepage and Navigation
**Description:** Reader-facing homepage displaying latest comics with pagination and filtering
**Acceptance Criteria:**
- Homepage displays 10 most recent comics ordered by "happened on" date (descending)
- Pagination system for browsing complete comic history
- Tag-based filtering system for content discovery
- Series-based browsing functions identically to tag-based browsing (same filtering mechanism)
- Navigation interface groups tags into two sections: "Series" header for series-flagged tags, "Tags" header for regular tags
- Each tag appears in only one navigation section (either Series or Tags, never both)
- Responsive design supports mobile and desktop readers

### FR-5: Multi-Image Comic Display
**Description:** Configurable display system allowing artists to choose between carousel and long form presentation for each comic
**Acceptance Criteria:**
- Artist can select display style per comic: carousel (default) or long form
- Single-image comics display normally without carousel controls regardless of chosen style
- Carousel mode: Multi-image comics enable carousel navigation with touch/swipe gestures and keyboard arrow key support
- Long form mode: Multi-image comics display all images vertically in sequence
- Image preloading optimizes performance for both display styles

### FR-6: Individual Comic Pages
**Description:** Dedicated page view for single comics with full metadata and navigation
**Acceptance Criteria:**
- URL structure supports multiple access patterns: `/comic/{slug}` for direct access and `/tags/{tag}/{slug}` for tag-filtered context
- Comic slugs generated from titles for SEO-friendly URLs with duplicate detection requiring artist resolution during upload
- Full comic metadata display including tags and series information
- Related comics suggestions based on tags or series
- Next/previous navigation buttons for both tag-based and series-based browsing contexts
- Tag-filtered URLs maintain browsing context for reader navigation

### FR-7: Raw Sketches Display System
**Description:** Global toggle system allowing readers to view raw sketches alongside or instead of final comic images
**Acceptance Criteria:**
- Global site-wide toggle in consistent location affects all comic displays across homepage, browse views, and individual comic pages
- Toggle uses artist-customizable icons rather than text labels
- Comics with only raw sketches (no final version) display sketches in both toggle modes
- Comics with both final and raw images never display both simultaneously - toggle controls viewing mode
- Position synchronization: when final and raw sketch counts match, carousel position syncs between modes; otherwise position preserved per mode
- Browser state management maintains carousel position when switching between Final and Sketch modes
- Toggle state persists across page navigation and browser sessions

## Non-Functional Requirements

### NFR-1: Performance
**Description:** Performance targets appropriate for independent comic sites without expensive infrastructure
**Acceptance Criteria:**
- Homepage loads in under 3 seconds on standard broadband connections
- Comic images load in under 2 seconds via CloudFront CDN
- Upload interface responds to user actions in under 1 second
- Pagination and filtering operations complete in under 2 seconds
- Mobile performance maintained across iOS Safari and Android Chrome

### NFR-2: Cost Efficiency  
**Description:** Architecture designed to stay well within $10/month hosting budget
**Acceptance Criteria:**
- Image storage preserves original quality while generating responsive image variants (thumbnail, mobile, desktop) for optimal performance
- CDN caching configured to minimize data transfer costs while serving original images
- Lambda functions optimized for minimal execution time and memory usage
- DynamoDB queries designed for cost-effective read/write patterns
- Cost monitoring and alerting configured for budget threshold warnings

### NFR-3: Artist Workflow Optimization
**Description:** User experience requirements prioritizing comic artist productivity and ease of use
**Acceptance Criteria:**
- Complete upload workflow (login to published comic) completable in under 5 minutes
- Bulk upload operations support uploading 10+ comics efficiently with ability to override publish date for importing historical comics
- Error recovery preserves user-entered metadata in browser storage during upload failures
- Failed image uploads require complete restart but metadata fields remain populated
- Management interface provides quick publish/unpublish toggle functionality
- Mobile-first design ensures full functionality on artist's preferred devices

### NFR-4: Deployment and Maintenance
**Description:** Simple deployment and minimal ongoing maintenance requirements
**Acceptance Criteria:**
- Complete site deployment achievable via single `cdk deploy` command
- Infrastructure updates deployable without content loss or downtime
- Automatic SSL certificate management and renewal
- Built-in monitoring and error alerting for critical system components
- Configuration changes deployable without manual server intervention

## User Scenarios & Testing

### Primary Flow: Artist Comic Upload
1. Artist opens upload interface on iPad and authenticates via Google
2. Artist selects multiple comic image files using native file picker
3. Artist fills out comic metadata (title, happened-on date, tags, series info)
4. Artist initiates upload and receives real-time progress feedback
5. Artist reviews uploaded comic in preview mode and publishes
6. Comic appears on homepage within 30 seconds of publication

### Alternative Flows
- Bulk upload scenario: Artist uploads 5 comics in single session with batch metadata entry
- Content modification: Artist updates existing comic metadata or replaces images
- Series management: Artist organizes related comics into series with proper ordering
- Error recovery: Artist resumes interrupted upload after network disconnection
- Reader browsing: Reader discovers comics via tag filtering and series navigation
- Raw sketch workflow: Artist uploads raw sketches alongside final comics, reader toggles between final and sketch views site-wide
- Sketch-only publishing: Artist uploads only raw sketches with no final version, sketches display in both toggle modes for readers

## Success Criteria
Measurable, constitutional-principle-aligned outcomes:
- Artist upload workflow completion time: under 5 minutes from login to published comic
- Monthly hosting costs: under $7.50 contributing to $10 total constitutional target
- Deployment time: under 15 minutes using CDK commands for complete site setup
- Reader homepage load time: under 3 seconds on standard connections
- System availability: 99.5% uptime using serverless architecture auto-scaling
- Mobile usability: 100% upload workflow completion rate on iPad devices

## Key Entities

### Comic Entity
- **Attributes:** id, title, description, happenedOnDate, publishDate, publishStatus, imageUrls, sketchImageUrls, tags, seriesName, seriesOrder
- **Validation:** Required title and happenedOnDate, at least one of imageUrls or sketchImageUrls must be provided, optional metadata fields
- **Relationships:** Belongs to series (optional), has multiple tags

### Series Entity  
- **Attributes:** name, description, comicCount, lastUpdated
- **Validation:** Unique series names, automatic comic count maintenance
- **Relationships:** Contains multiple comics in order

### Artist Configuration
- **Attributes:** siteTitle, siteDescription, googleAuthConfig, customDomain
- **Validation:** Required site title, valid domain format for custom domains
- **Relationships:** Single artist per deployment model

## Assumptions
- Individual comic artists with basic technical skills and AWS account access
- Typical usage patterns: 1-10 new comics per month, 100-1000 total comics
- iPad as primary upload device with Safari or Chrome browser
- AWS infrastructure availability and current pricing structure
- Single-artist deployment model (not multi-tenant architecture)
- Standard web browser capabilities for readers (ES6+ JavaScript support)

## Out of Scope
Features explicitly excluded to maintain constitutional compliance:
- Multi-artist/multi-tenant functionality or user management systems
- Complex content management systems with advanced editing capabilities  
- Advanced analytics requiring expensive third-party services or dedicated infrastructure
- Real-time commenting systems or social features that prioritize reader interaction
- Manual infrastructure management or complex deployment processes requiring DevOps expertise
- Advanced SEO optimization features that would increase architectural complexity
- Automated social media posting or complex third-party integrations
