# Self-Hosted Comic Site - Core MVP

**Created:** November 8, 2025
**Status:** Draft
**Derived From:** Original monolithic comic site specification (refactored November 2025)
**Related Specs:** 
- [Series Management](series-management-spec.md)
- [Raw Sketches](raw-sketches-spec.md) 
- [Enhanced Features](enhanced-features-spec.md)

## Overview
Core MVP functionality for a CDK-based package that enables individual comic artists to easily deploy and manage their own AWS-hosted comic website. This spec covers the essential features needed for a functional comic site with artist upload capabilities and reader browsing.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- iPad-optimized upload interface for artists who prefer mobile content creation
- Single-artist authentication model eliminates complex user management
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
- Self-contained deployment with no manual infrastructure setup

## User Stories
- As a comic artist, I want to easily upload my comics from my iPad so that I can publish content anywhere without requiring a computer
- As a comic artist, I want to authenticate using my Google account so that I don't need to manage separate login credentials
- As a comic artist, I want to organize my comics with tags so that readers can discover related content
- As a comic reader, I want to see the latest comics on the homepage so that I can quickly access new content
- As a comic reader, I want to browse comics by tags so that I can find content that matches my interests  
- As a comic reader, I want to view multi-image comics in a carousel format so that I can easily navigate through comic sequences
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
- Drag-and-drop file upload supports multiple comic images in JPG, PNG, and WebP formats
- File size validation enforces 20MB maximum per image with clear error messaging
- Touch-friendly form controls for comic metadata entry
- Real-time upload progress indicators for large image files
- Form validation provides clear error messages for missing required fields

### FR-3: Core Comic Metadata Management
**Description:** Essential metadata system supporting basic artist content organization and reader discovery
**Acceptance Criteria:**
- **Core Metadata Schema per Post:**
  - `id` (string): Unique identifier serving as DynamoDB partition key
  - `images` (array): Ordered list of comic panel images with S3 keys
  - `title` (string): Display title for the post
  - `slug` (string): URL slug portion specific to this post
  - `caption` (string): Text displayed below each comic
  - `tags` (array of strings): List of tags applied to comic
  - `happenedOnDate` (date): Date when comic situation occurred
  - `scrollStyle` (string): Display style (`carousel` or `long`)
  - `postedTimestamp` (timestamp): Publication date
- Tag system supports reader filtering and content discovery with case-insensitive matching
- Comic slugs generated from titles for SEO-friendly URLs with duplicate detection requiring artist resolution

### FR-4: Reader Homepage and Basic Navigation
**Description:** Reader-facing homepage displaying latest comics with basic filtering
**Acceptance Criteria:**
- Homepage displays 10 most recent comics ordered by "happened on" date (descending)
- Pagination system for browsing complete comic history
- Tag-based filtering system for content discovery
- Responsive design supports mobile and desktop readers

### FR-5: Multi-Image Comic Display
**Description:** Configurable display system allowing artists to choose between carousel and long form presentation
**Acceptance Criteria:**
- Artist can select display style per comic: carousel (default) or long form
- Single-image comics display normally without carousel controls regardless of chosen style
- Carousel mode: Multi-image comics enable carousel navigation with touch/swipe gestures and keyboard arrow key support
- Long form mode: Multi-image comics display all images vertically in sequence
- Image preloading optimizes performance for both display styles

### FR-6: Individual Comic Pages
**Description:** Dedicated page view for single comics with basic metadata and navigation
**Acceptance Criteria:**
- URL structure: `/comic/{slug}` for direct comic access
- Full comic metadata display including tags
- Basic next/previous navigation between comics
- Related comics suggestions based on tags

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
2. Artist selects multiple comic image files using native file picker
3. Artist fills out comic metadata (title, happened-on date, tags)
4. Artist initiates upload and receives real-time progress feedback
5. Artist reviews uploaded comic in preview mode and publishes
6. Comic appears on homepage within 30 seconds of publication

### Alternative Flows
- Content modification: Artist updates existing comic metadata or replaces images
- Error recovery: Artist resumes interrupted upload after network disconnection
- Reader browsing: Reader discovers comics via tag filtering

## Success Criteria
Measurable, constitutional-principle-aligned outcomes:
- Artist upload workflow completion time: under 5 minutes from login to published comic
- Monthly hosting costs: under $7.50 contributing to $10 total constitutional target
- Deployment time: under 15 minutes using CDK commands for complete site setup
- Reader homepage load time: under 3 seconds on standard connections
- System availability: 99.5% uptime using serverless architecture auto-scaling
- Mobile usability: 100% upload workflow completion rate on iPad devices

## Key Entities

### Comic Entity (MVP)
- **Attributes:** id, title, caption, happenedOnDate, postedTimestamp, imageUrls, tags, slug, scrollStyle
- **Validation:** Required title and happenedOnDate, at least one image required
- **Relationships:** Has multiple tags

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
- Advanced image optimization and responsive variants (see [Enhanced Features](enhanced-features-spec.md))
- Publish/unpublish controls (see [Enhanced Features](enhanced-features-spec.md))

## Implementation Notes

### Clarifications from Original Spec
- Image format restrictions: JPG, PNG, WebP with 20MB per image limit
- Authentication: AWS Cognito's built-in Google federation (not direct OAuth)
- Image storage: Store original images as-is to preserve artist's intended quality
- URL structure: `/comic/{slug}` for individual comics
- Upload failures: Simple restart for image uploads, cache metadata in browser
- Slug conflicts: Require artist to manually resolve during upload
- Tag matching: Case-insensitive matching while preserving original case display
