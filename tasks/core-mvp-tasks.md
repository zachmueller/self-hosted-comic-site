# Task Breakdown: Core MVP

**Created:** November 18, 2025
**Implementation Plan:** [plans/core-mvp-plan.md](../plans/core-mvp-plan.md)
**Specification:** [specs/core-mvp-spec.md](../specs/core-mvp-spec.md)
**Status:** Planning

## Task Summary

**Total Tasks:** 58
**Phases:** 7 (Setup → Foundation → Upload → Reader → API → Quality → Deployment)
**Estimated Complexity:** High
**Parallel Execution Opportunities:** 12 task groups

## Constitutional Compliance Integration

### Cost-Conscious Task Planning
- [x] All tasks evaluated for cost impact on $10/month target
- [x] Resource-intensive tasks identified and optimized (S3 uploads, DynamoDB queries)
- [x] Serverless-first alternatives used for all infrastructure tasks
- [x] Cost monitoring tasks included in deployment phase (estimated $3.50-7.50/month)

### Artist-First Development Priority
- [x] Artist workflow tasks prioritized over reader experience tasks
- [x] Upload and management interface tasks scheduled in Phase 2 (before reader features)
- [x] Reader-facing tasks scheduled in Phase 3 (after artist tools functional)
- [x] User testing focused on artist ease-of-use (iPad optimization, <5min upload target)

### Deployment Simplicity Validation
- [x] All deployment tasks use CDK or simple command-line operations
- [x] Manual deployment steps minimized (only DNS if custom domain)
- [x] Configuration management automated via CDK context
- [x] Deployment validation tasks included (single command deployment)

## Phase 0: Setup & Environment

### ENV-001: React + Vite Project Initialization ✓ COMPLETE
**Description:** Create new React 18 project with Vite build system and TypeScript
**Files:** `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/index.html`, `frontend/src/main.tsx`
**Dependencies:** None
**Constitutional Compliance:** 
- Deployment Simplicity: Vite requires minimal configuration
- Cost-Conscious: Fast builds reduce development time and costs
**Acceptance Criteria:**
- [x] Vite project created with React TypeScript template
- [x] Dev server runs successfully on localhost
- [x] TypeScript compilation working without errors
- [x] Hot module replacement (HMR) functional
- [x] Project structure created: `src/components/`, `src/pages/`, `src/utils/`, `src/types/`

### ENV-002: Development Tooling Setup ✓ COMPLETE
**Description:** Configure ESLint, Prettier, and code quality tools
**Files:** `frontend/.eslintrc.json`, `frontend/.prettierrc`, `frontend/.eslintignore`, `frontend/.prettierignore`
**Dependencies:** ENV-001
**Constitutional Compliance:**
- Cost-Conscious: Automated code quality reduces debugging time
**Acceptance Criteria:**
- [x] ESLint configured with React and TypeScript rules
- [x] Prettier configured for consistent code formatting
- [x] Pre-commit hooks optional but documented
- [x] npm scripts for linting and formatting

### ENV-003: Path Aliases and Build Configuration ✓ COMPLETE
**Description:** Configure Vite for clean imports and S3 deployment
**Files:** `frontend/vite.config.ts`, `frontend/tsconfig.json`
**Dependencies:** ENV-002
**Constitutional Compliance:**
- Deployment Simplicity: Automated build integration with CDK
**Acceptance Criteria:**
- [x] Path aliases configured (@components, @utils, @types, etc.)
- [x] Build output configured for S3 deployment
- [x] Index.html fallback routing configured for SPA
- [x] Environment variable configuration documented
- [x] Production build optimization enabled

### ENV-004: CDK Stack Restructure ✓ COMPLETE
**Description:** Update CDK stack to support React deployment and remove old Lambda code
**Files:** `lib/self-hosted-comic-site-stack.ts`, `bin/self-hosted-comic-site.ts`
**Dependencies:** ENV-003
**Constitutional Compliance:**
- Serverless-First: Maintains all managed AWS services
- Cost-Conscious: No new expensive services added
**Acceptance Criteria:**
- [x] Existing infrastructure preserved (S3, DynamoDB, Cognito, CloudFront)
- [x] TagIndex GSI added to DynamoDB
- [x] Vite build integration added to CDK deployment
- [x] CloudFront configured for SPA routing (404 → index.html)
- [x] S3 bucket deployment configuration for React build artifacts

### ENV-005 [P]: Development Environment Documentation ✓ COMPLETE
**Description:** Create local development setup instructions
**Files:** `README.md`, `.env.example`, `frontend/README.md`
**Dependencies:** ENV-004
**Constitutional Compliance:**
- Deployment Simplicity: Clear setup instructions reduce friction
**Acceptance Criteria:**
- [x] README updated with React + Vite setup steps
- [x] Environment variables documented in .env.example
- [x] Local development workflow explained (mock auth, API mocking)
- [x] Deployment process documented (cdk deploy command)
- [x] Troubleshooting section for common issues

## Phase 1: Foundation & Data Layer

### DATA-001: TypeScript Type Definitions ✓ COMPLETE
**Description:** Create TypeScript interfaces for all data entities
**Files:** `frontend/src/types/comic.ts`, `frontend/src/types/relationship.ts`, `frontend/src/types/config.ts`, `frontend/src/types/api.ts`
**Dependencies:** ENV-005
**Constitutional Compliance:**
- Artist-First: Type safety improves artist upload experience reliability
**Acceptance Criteria:**
- [x] Comic interface matches DynamoDB schema
- [x] Relationship types defined (caption, series, tag)
- [x] API request/response types defined
- [x] Configuration types defined (color palette)
- [x] All types exported from central index

### DATA-002: Zod Validation Schemas ✓ COMPLETE
**Description:** Port validation rules from spec to Zod schemas
**Files:** `frontend/src/validation/comic.schema.ts`, `frontend/src/validation/metadata.schema.ts`, `shared/validation/` (for Lambda use)
**Dependencies:** DATA-001
**Constitutional Compliance:**
- Artist-First: Clear validation errors improve artist experience
**Acceptance Criteria:**
- [x] All validation rules from specs/validation-rules.md implemented
- [x] Comic metadata validation (title, caption, dates, tags)
- [x] Image validation (file type, size limits)
- [x] Reference syntax validation ([[Title]] and [[Title|Alias]])
- [x] Validation error messages are artist-friendly
- [x] Shared validation schemas for client and server

### DATA-003: DynamoDB Table Updates ✓ COMPLETE
**Description:** Update DynamoDB table definition with all required GSIs
**Files:** `lib/self-hosted-comic-site-stack.ts`
**Dependencies:** DATA-002
**Constitutional Compliance:**
- Cost-Conscious: GSI design minimizes query costs
- Serverless-First: DynamoDB is fully managed
**Acceptance Criteria:**
- [x] Primary key: `id` (partition) + `postedTimestamp` (sort)
- [x] GSI-1: `slug` (partition) for direct comic lookups (SlugIndex)
- [x] GSI-2: `title` (partition) + `happenedOnDate` (sort) for autocomplete (TitleIndex)
- [x] GSI-3: `tag` (partition) + `postedTimestamp` (sort) for tag filtering (TagIndex)
- [x] Pay-per-request billing mode configured
- [x] Table capacity alarms configured (user errors, system errors)

### DATA-004 [P]: Data Access Layer ✓ COMPLETE
**Description:** Create utilities for interacting with DynamoDB from Lambda
**Files:** `shared/data/comic.repository.ts`, `shared/data/config.repository.ts`
**Dependencies:** DATA-003
**Constitutional Compliance:**
- Cost-Conscious: Efficient query patterns reduce costs
**Acceptance Criteria:**
- [x] CRUD operations for comics
- [x] Query by slug, tag, title
- [x] Pagination support for list operations
- [x] Relationship resolution utilities
- [x] Error handling for DynamoDB operations
- [x] TypeScript types for all operations

## Phase 2: Authentication & Core Infrastructure

### AUTH-001: Cognito Hosted UI Integration ✓ COMPLETE
**Description:** Implement Cognito authentication flow with Google federation
**Files:** `frontend/src/auth/AuthContext.tsx`, `frontend/src/auth/cognito.ts`, `frontend/src/auth/useAuth.ts`
**Dependencies:** DATA-004
**Constitutional Compliance:**
- Artist-First: Simple Google login for artist
- Serverless-First: Cognito is fully managed
- Cost-Conscious: Cognito free tier covers single artist
**Acceptance Criteria:**
- [x] Cognito Hosted UI integration implemented
- [x] OAuth callback handling
- [x] Token exchange and storage
- [x] AWS credentials configuration for authenticated artist
- [x] AuthContext provider wraps app
- [x] useAuth hook provides auth state and methods

### AUTH-002: Session Management ✓ COMPLETE
**Description:** Implement session persistence and token refresh
**Files:** `frontend/src/auth/AuthContext.tsx`, `frontend/src/auth/tokenManager.ts`
**Dependencies:** AUTH-001
**Constitutional Compliance:**
- Artist-First: Artist stays logged in between sessions
**Acceptance Criteria:**
- [x] JWT tokens stored securely in sessionStorage
- [x] Automatic token refresh before expiration
- [x] Session validation on app load
- [x] Logout functionality clears all tokens
- [x] Error handling for expired sessions

### AUTH-003: Protected Route Components ✓ COMPLETE
**Description:** Create route guards for artist-only pages
**Files:** `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/auth/useRequireAuth.ts`
**Dependencies:** AUTH-002
**Constitutional Compliance:**
- Artist-First: Upload interface only accessible to artist
**Acceptance Criteria:**
- [x] ProtectedRoute component wraps authenticated routes
- [x] Redirects to login if not authenticated
- [x] useRequireAuth hook for component-level protection
- [x] Loading state during auth check
- [x] Preserves intended destination after login

### INFRA-001 [P]: Lambda Function Stubs ✓ COMPLETE
**Description:** Create Lambda function structure for all API endpoints
**Files:** `lambda/getComics/index.ts`, `lambda/getComic/index.ts`, `lambda/searchTitles/index.ts`, `lambda/processUpload/index.ts`, `lambda/generatePresignedUrl/index.ts`
**Dependencies:** DATA-004
**Constitutional Compliance:**
- Serverless-First: Lambda is fully managed compute
- Cost-Conscious: Lambda free tier covers typical usage
**Acceptance Criteria:**
- [x] Five Lambda functions created with TypeScript
- [x] Basic handler structure for each function
- [x] Shared utilities imported from /shared (ready for use)
- [x] Error handling structure in place
- [x] CloudWatch logging configured
- [ ] Lambda function definitions in CDK stack (INFRA-002)

### INFRA-002 [P]: API Gateway Configuration ✓ COMPLETE
**Description:** Set up API Gateway or Lambda@Edge for API routing
**Files:** `lib/self-hosted-comic-site-stack.ts`
**Dependencies:** INFRA-001
**Constitutional Compliance:**
- Serverless-First: API Gateway is fully managed
- Cost-Conscious: API Gateway free tier covers typical usage
**Acceptance Criteria:**
- [x] API Gateway REST API created or Lambda@Edge configured
- [x] Routes defined for all five endpoints
- [x] CORS configuration for CloudFront domain
- [x] Request/response transformation configured
- [x] Integration with Lambda functions
- [x] API Gateway logging enabled

## Phase 3: Artist Upload Workflow (PRIORITY)

### UPLOAD-001: App Router and Layout ✓ COMPLETE
**Description:** Set up React Router and basic app layout
**Files:** `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/components/Header.tsx`, `frontend/src/components/NavBar.tsx`
**Dependencies:** AUTH-003, INFRA-002
**Constitutional Compliance:**
- Artist-First: Navigation optimized for artist workflow
**Acceptance Criteria:**
- [x] React Router v6 configured with routes
- [x] Layout component with header and navigation
- [x] Header shows auth status and upload link
- [x] NavBar with Home, Tags, Login/Logout links
- [x] Responsive layout for mobile and desktop
- [x] Loading states for route transitions

### UPLOAD-002: Image Dropzone Component ✓ COMPLETE
**Description:** iPad-optimized file upload interface with drag-and-drop
**Files:** `frontend/src/components/upload/ImageDropzone.tsx`, `frontend/src/components/upload/ImagePreview.tsx`
**Dependencies:** UPLOAD-001
**Constitutional Compliance:**
- Artist-First: iPad-optimized is top priority
- Cost-Conscious: Client-side processing reduces Lambda usage
**Acceptance Criteria:**
- [x] React-dropzone integration for file selection
- [x] Native file picker for iPad compatibility
- [x] Drag-and-drop support for desktop
- [x] Large touch targets (min 44px) for iPad
- [x] File type validation (JPG, PNG, WebP)
- [x] File size validation (20MB limit)
- [x] Image count validation (1-20 images)
- [x] Thumbnail previews of selected files
- [x] Remove file functionality
- [x] Visual feedback for valid/invalid files

### UPLOAD-003: Metadata Form Components ✓ COMPLETE
**Description:** Create form inputs for comic metadata
**Files:** `frontend/src/components/upload/ComicMetadataForm.tsx`, `frontend/src/components/upload/DatePicker.tsx`, `frontend/src/components/upload/TagInput.tsx`, `frontend/src/components/upload/ScrollStyleToggle.tsx`
**Dependencies:** UPLOAD-002, DATA-002
**Constitutional Compliance:**
- Artist-First: Pre-filled date, touch-friendly inputs
**Acceptance Criteria:**
- [x] Title input with validation feedback
- [x] DatePicker pre-populated with today's date
- [x] happenedOnDate optional field
- [x] TagInput with add/remove functionality
- [x] Tag validation (lowercase, hyphens only)
- [x] ScrollStyleToggle (carousel vs long form)
- [x] Touch-friendly form controls for iPad
- [x] Real-time validation using Zod schemas
- [x] Clear validation error messages

### UPLOAD-004: Caption Editor with Autocomplete
**Description:** Obsidian-style reference editor with autocomplete
**Files:** `frontend/src/components/upload/CaptionEditor.tsx`, `frontend/src/components/upload/ReferenceAutocomplete.tsx`
**Dependencies:** UPLOAD-003
**Constitutional Compliance:**
- Artist-First: Streamlined reference creation workflow
**Acceptance Criteria:**
- [ ] Textarea for caption input
- [ ] Real-time parsing of [[Title]] and [[Title|Alias]] syntax
- [ ] Visual highlighting of valid/invalid references
- [ ] Trigger autocomplete on [[ input
- [ ] ReferenceAutocomplete dropdown with API integration
- [ ] Keyboard navigation (arrows, tab, enter, escape)
- [ ] Touch-friendly suggestion selection
- [ ] Display happenedOnDate in suggestions
- [ ] Insert selected reference into caption
- [ ] Parse caption references for validation

### UPLOAD-005: Accessibility Features
**Description:** Alt text and thumbnail selection components
**Files:** `frontend/src/components/upload/AltTextInput.tsx`, `frontend/src/components/upload/ThumbnailSelector.tsx`
**Dependencies:** UPLOAD-004
**Constitutional Compliance:**
- Artist-First: Optional alt text, easy thumbnail selection
**Acceptance Criteria:**
- [ ] AltTextInput component per image (optional)
- [ ] ThumbnailSelector with image grid
- [ ] Visual indicator for selected thumbnail
- [ ] Preview of thumbnail in listing context
- [ ] Default to first image if not selected
- [ ] Touch-friendly thumbnail selection

### UPLOAD-006: Upload Page Integration
**Description:** Integrate all upload components into cohesive workflow
**Files:** `frontend/src/pages/UploadPage.tsx`, `frontend/src/utils/uploadState.ts`
**Dependencies:** UPLOAD-005
**Constitutional Compliance:**
- Artist-First: Streamlined upload workflow, <5min target
**Acceptance Criteria:**
- [ ] UploadPage combines all upload components
- [ ] Multi-step form navigation (files → metadata → reorder → publish)
- [ ] State management for form data
- [ ] Form validation before proceeding to next step
- [ ] Progress indicator showing current step
- [ ] Back navigation between steps
- [ ] Save draft functionality (localStorage)
- [ ] Clear all functionality

### UPLOAD-007: Panel Reordering Interface
**Description:** Drag-and-drop panel reordering with touch support
**Files:** `frontend/src/components/upload/PanelReorderScreen.tsx`, `frontend/src/components/upload/DraggablePanel.tsx`
**Dependencies:** UPLOAD-006
**Constitutional Compliance:**
- Artist-First: Easy corrections before publish
**Acceptance Criteria:**
- [ ] React-beautiful-dnd integration for reordering
- [ ] Touch gesture support for iPad
- [ ] Visual feedback during drag operations
- [ ] Preview of final order in carousel mode
- [ ] Preview of final order in long form mode
- [ ] Skip option to maintain upload order
- [ ] Apply order button
- [ ] Large touch targets for panel manipulation

### UPLOAD-008: S3 Presigned URL Generation
**Description:** Lambda function to generate presigned URLs for image upload
**Files:** `lambda/generatePresignedUrl/index.ts`
**Dependencies:** INFRA-002, AUTH-003
**Constitutional Compliance:**
- Cost-Conscious: Direct browser-to-S3 upload reduces Lambda usage
- Serverless-First: Uses S3 managed service
**Acceptance Criteria:**
- [ ] Authenticate artist via Cognito token
- [ ] Generate presigned URL for S3 PUT operation
- [ ] Set content type and size limits
- [ ] Return URL with 15-minute expiration
- [ ] Handle errors (auth failure, S3 errors)
- [ ] CloudWatch logging for monitoring

### UPLOAD-009: S3 Upload Client Logic
**Description:** Client-side S3 upload with progress tracking
**Files:** `frontend/src/utils/s3Upload.ts`, `frontend/src/hooks/useS3Upload.ts`
**Dependencies:** UPLOAD-008
**Constitutional Compliance:**
- Artist-First: Progress feedback keeps artist informed
**Acceptance Criteria:**
- [ ] Request presigned URL from Lambda
- [ ] Upload image directly to S3 using presigned URL
- [ ] Track upload progress per image
- [ ] Display progress bar for each upload
- [ ] Handle concurrent uploads (3-5 at a time)
- [ ] Retry logic for failed uploads
- [ ] Error handling with user-friendly messages
- [ ] Cancel upload functionality

### UPLOAD-010: Process Upload Lambda Function
**Description:** Backend processing of comic metadata and relationships
**Files:** `lambda/processUpload/index.ts`, `shared/utils/referenceParser.ts`, `shared/utils/relationshipBuilder.ts`
**Dependencies:** UPLOAD-009, DATA-004
**Constitutional Compliance:**
- Artist-First: Automated relationship creation reduces artist effort
- Cost-Conscious: Efficient processing reduces Lambda execution time
**Acceptance Criteria:**
- [ ] Validate metadata using Zod schemas
- [ ] Generate UUID for comic ID
- [ ] Parse caption for [[reference]] patterns
- [ ] Query DynamoDB for matching comic titles
- [ ] Create derivedRelationships array with sourceType: 'caption'
- [ ] Write comic metadata to DynamoDB
- [ ] Update target comics with bidirectional relationships
- [ ] Trigger CloudFront cache invalidation
- [ ] Handle errors with clear error messages
- [ ] Return published comic slug and ID

### UPLOAD-011 [P]: Upload Success Screen
**Description:** Post-upload confirmation and next actions
**Files:** `frontend/src/components/upload/UploadSuccess.tsx`
**Dependencies:** UPLOAD-010
**Constitutional Compliance:**
- Artist-First: Clear confirmation and next steps
**Acceptance Criteria:**
- [ ] Success confirmation message
- [ ] Link to published comic page
- [ ] Note about CloudFront cache delay (~5 minutes)
- [ ] "Upload Another Comic" button
- [ ] Clear form state on upload another
- [ ] Error display if cache invalidation fails

## Phase 4: Reader Experience - Comic Display

### READER-001: Homepage Components
**Description:** Comic listing page with grid layout
**Files:** `frontend/src/pages/HomePage.tsx`, `frontend/src/components/comic/ComicGrid.tsx`, `frontend/src/components/comic/ComicCard.tsx`
**Dependencies:** UPLOAD-011, INFRA-002
**Constitutional Compliance:**
- Artist-First: Reader features implemented after artist tools
- Cost-Conscious: Efficient querying and caching
**Acceptance Criteria:**
- [ ] HomePage fetches comics from API
- [ ] ComicGrid displays comics in responsive grid
- [ ] ComicCard shows thumbnail, title, postedDate
- [ ] Loading state during API fetch
- [ ] Error state for failed API calls
- [ ] Empty state when no comics exist
- [ ] Link to single comic page from card

### READER-002: Pagination Component
**Description:** Pagination controls for comic listing
**Files:** `frontend/src/components/comic/Pagination.tsx`, `frontend/src/hooks/usePagination.ts`
**Dependencies:** READER-001
**Constitutional Compliance:**
- Cost-Conscious: Pagination reduces DynamoDB query costs
**Acceptance Criteria:**
- [ ] Next/Previous page buttons
- [ ] Page number display
- [ ] Disable next button on last page
- [ ] URL parameter handling for current page
- [ ] Maintain page state on navigation
- [ ] Keyboard navigation support
- [ ] Loading state during page change

### READER-003: Tag Filtering
**Description:** Filter comics by tag
**Files:** `frontend/src/components/comic/TagFilter.tsx`, `frontend/src/hooks/useTagFilter.ts`
**Dependencies:** READER-002
**Constitutional Compliance:**
- Cost-Conscious: Tag filtering uses efficient GSI queries
**Acceptance Criteria:**
- [ ] Display all available tags
- [ ] Click tag to filter comics
- [ ] Active tag visual indicator
- [ ] Clear filter button
- [ ] URL parameter handling for selected tag
- [ ] Combine with pagination
- [ ] Responsive design (desktop sidebar, mobile dropdown)

### READER-004: Single Comic Page Structure
**Description:** Comic detail page layout and data fetching
**Files:** `frontend/src/pages/ComicPage.tsx`, `frontend/src/components/comic/ComicHeader.tsx`
**Dependencies:** READER-003
**Constitutional Compliance:**
- Artist-First: Reader experience adequate but not prioritized
**Acceptance Criteria:**
- [ ] ComicPage fetches single comic by slug
- [ ] ComicHeader displays title, dates, tags
- [ ] Loading state during API fetch
- [ ] Error state for 404 or failed fetch
- [ ] Metadata display (postedTimestamp, happenedOnDate)
- [ ] Tag list with links to tag filter page
- [ ] Responsive layout

### READER-005: Comic Image Display
**Description:** Carousel and long form image display modes
**Files:** `frontend/src/components/comic/ComicImages.tsx`, `frontend/src/components/comic/CarouselView.tsx`, `frontend/src/components/comic/LongFormView.tsx`
**Dependencies:** READER-004
**Constitutional Compliance:**
- Artist-First: Display respects artist's scrollStyle choice
**Acceptance Criteria:**
- [ ] ComicImages switches between carousel and long form based on scrollStyle
- [ ] CarouselView with navigation controls (prev/next buttons)
- [ ] CarouselView with swipe gestures on mobile
- [ ] CarouselView keyboard navigation (arrow keys)
- [ ] LongFormView with vertical scroll of all images
- [ ] Responsive image sizing
- [ ] Image lazy loading for performance
- [ ] Alt text support for accessibility

### READER-006: Caption and Relationships Display
**Description:** Display comic caption with parsed references
**Files:** `frontend/src/components/comic/ComicCaption.tsx`, `frontend/src/components/comic/RelatedComics.tsx`
**Dependencies:** READER-005
**Constitutional Compliance:**
- Artist-First: Relationships respect artist's Obsidian syntax
**Acceptance Criteria:**
- [ ] ComicCaption displays parsed caption text
- [ ] [[Title]] references rendered as links to target comics
- [ ] [[Title|Alias]] references use alias text for link
- [ ] RelatedComics section below caption
- [ ] Group relationships by sourceType (caption, series, tag)
- [ ] Display context snippets for caption references
- [ ] Thumbnail grid for related comics
- [ ] Clickable links to related comics

### READER-007: Share Functionality
**Description:** Copy comic URL to clipboard
**Files:** `frontend/src/components/comic/ShareButton.tsx`, `frontend/src/utils/clipboard.ts`
**Dependencies:** READER-006
**Constitutional Compliance:**
- Artist-First: Simple sharing for artist to promote comics
**Acceptance Criteria:**
- [ ] ShareButton component with clipboard icon
- [ ] Copy current URL to clipboard on click
- [ ] Success feedback (tooltip or toast)
- [ ] Fallback for browsers without clipboard API
- [ ] Keyboard accessible
- [ ] Mobile-friendly touch target

### READER-008 [P]: Responsive Design Implementation
**Description:** Apply responsive breakpoints and mobile optimization
**Files:** `frontend/src/styles/breakpoints.ts`, CSS modules for all components
**Dependencies:** READER-007
**Constitutional Compliance:**
- Artist-First: Artist's iPad workflow prioritized, reader mobile experience adequate
**Acceptance Criteria:**
- [ ] Breakpoint system defined (320px, 768px, 1024px)
- [ ] Mobile: Stack layouts vertically, full-width images
- [ ] Tablet: Balance between mobile and desktop layouts
- [ ] Desktop: Multi-column layouts, sidebar navigation
- [ ] Large touch targets on mobile (min 44px)
- [ ] Hamburger menu for tags on mobile
- [ ] Hover states for desktop interactions
- [ ] Test on actual devices (iPad, iPhone, Android)

## Phase 5: Color Palette Configuration

### CONFIG-001: Configuration Data Model
**Description:** DynamoDB table and types for site configuration
**Files:** `lib/self-hosted-comic-site-stack.ts`, `frontend/src/types/config.ts`, `shared/data/config.repository.ts`
**Dependencies:** DATA-004
**Constitutional Compliance:**
- Cost-Conscious: Single configuration item, minimal storage cost
- Serverless-First: Uses existing DynamoDB table or new config table
**Acceptance Criteria:**
- [ ] Configuration DynamoDB table or item in main table
- [ ] Configuration interface: primary, secondary, highlight, text, textSecondary colors
- [ ] CRUD operations in config.repository.ts
- [ ] Default color values defined
- [ ] TypeScript types for color palette

### CONFIG-002: Color Palette Editor UI
**Description:** Artist-facing interface to customize colors
**Files:** `frontend/src/pages/ConfigPage.tsx`, `frontend/src/components/config/ColorPaletteEditor.tsx`, `frontend/src/components/config/ColorPicker.tsx`
**Dependencies:** CONFIG-001, AUTH-003
**Constitutional Compliance:**
- Artist-First: Artist can customize site appearance
**Acceptance Criteria:**
- [ ] ConfigPage protected by authentication
- [ ] ColorPaletteEditor with five color inputs
- [ ] ColorPicker using HTML5 color input
- [ ] Hex validation for color values
- [ ] Live preview of color changes
- [ ] Reset to defaults button
- [ ] Save button to persist changes
- [ ] Mobile-responsive interface
- [ ] Touch-friendly for iPad

### CONFIG-003: Lambda Functions for Config
**Description:** API endpoints to read and write configuration
**Files:** `lambda/getConfig/index.ts`, `lambda/updateConfig/index.ts`
**Dependencies:** CONFIG-001, INFRA-002
**Constitutional Compliance:**
- Cost-Conscious: Minimal Lambda invocations (config rarely changes)
**Acceptance Criteria:**
- [ ] getConfig Lambda function to retrieve configuration
- [ ] updateConfig Lambda function with artist authentication
- [ ] Validation of color values (hex format)
- [ ] DynamoDB read/write operations
- [ ] CloudFront cache invalidation on config update
- [ ] Error handling for invalid input
- [ ] CloudWatch logging

### CONFIG-004: CSS Variable Injection System
**Description:** Load color palette and apply to CSS custom properties
**Files:** `frontend/src/styles/theme.ts`, `frontend/src/App.tsx`
**Dependencies:** CONFIG-003
**Constitutional Compliance:**
- Artist-First: Colors apply throughout site automatically
**Acceptance Criteria:**
- [ ] Fetch configuration on app initialization
- [ ] Inject CSS custom properties into :root element
- [ ] Define color variables: --color-primary, --color-secondary, --color-highlight, --color-text, --color-text-secondary
- [ ] Default values if config not loaded
- [ ] Apply colors throughout component CSS
- [ ] Re-apply colors on configuration update
- [ ] Loading state during config fetch

### CONFIG-005 [P]: Accessibility Contrast Validation
**Description:** Validate color contrast ratios for WCAG compliance
**Files:** `frontend/src/utils/contrastChecker.ts`, `frontend/src/components/config/ContrastWarning.tsx`
**Dependencies:** CONFIG-004
**Constitutional Compliance:**
- Artist-First: Help artist choose accessible colors with warnings, not restrictions
**Acceptance Criteria:**
- [ ] Calculate contrast ratio between text and background colors
- [ ] Warn if contrast ratio below WCAG AA threshold (4.5:1)
- [ ] Display warning in ColorPaletteEditor
- [ ] Suggest adjustments for better contrast
- [ ] Allow artist to override warning (their choice)
- [ ] Show contrast ratio numbers in editor

## Phase 6: API Implementation

### API-001: GetComics Lambda Function
**Description:** Paginated comic listing with optional tag filtering
**Files:** `lambda/getComics/index.ts`
**Dependencies:** DATA-004, INFRA-002
**Constitutional Compliance:**
- Cost-Conscious: Pagination and caching reduce query costs
- Serverless-First: Lambda is fully managed
**Acceptance Criteria:**
- [ ] Query DynamoDB with pagination (limit 20 per page)
- [ ] Optional tag filtering via GSI-3
- [ ] Sort by postedTimestamp (descending)
- [ ] Return items array, page number, hasNextPage flag
- [ ] Handle errors gracefully
- [ ] CloudWatch logging
- [ ] Response format matches API types

### API-002: GetComic Lambda Function
**Description:** Single comic retrieval with relationship resolution
**Files:** `lambda/getComic/index.ts`, `shared/utils/relationshipResolver.ts`
**Dependencies:** DATA-004, INFRA-002
**Constitutional Compliance:**
- Artist-First: Relationships automatically resolved for artist
**Acceptance Criteria:**
- [ ] Query by slug using GSI-1
- [ ] Resolve derivedRelationships to full comic objects
- [ ] Group relationships by sourceType
- [ ] Include context snippets for caption references
- [ ] Calculate bidirectional relationships
- [ ] Return 404 if comic not found
- [ ] Handle errors gracefully
- [ ] CloudWatch logging

### API-003: SearchComicTitles Lambda Function
**Description:** Autocomplete search for comic titles
**Files:** `lambda/searchTitles/index.ts`
**Dependencies:** DATA-004, INFRA-002
**Constitutional Compliance:**
- Artist-First: Streamlines Obsidian reference creation
**Acceptance Criteria:**
- [ ] Query DynamoDB GSI-2 for title prefix matching
- [ ] Case-insensitive search
- [ ] Return top 10 matches ordered by recency
- [ ] Include id, title, slug, happenedOnDate in results
- [ ] Support partial matching (not just prefix)
- [ ] Handle empty query gracefully
- [ ] CloudWatch logging

### API-004 [P]: CloudFront Caching Configuration
**Description:** Configure caching strategy for API and assets
**Files:** `lib/self-hosted-comic-site-stack.ts`
**Dependencies:** INFRA-002
**Constitutional Compliance:**
- Cost-Conscious: Caching reduces Lambda invocations and DynamoDB queries
**Acceptance Criteria:**
- [ ] Static assets (JS, CSS, images): 1 year cache
- [ ] API responses: 5 minute cache
- [ ] Comic images in S3: 1 day cache
- [ ] index.html: No cache (SPA routing)
- [ ] Cache-Control headers configured
- [ ] Cache key configuration for query parameters
- [ ] Custom error responses (404 → index.html)

### API-005 [P]: Cache Invalidation Logic
**Description:** Invalidate CloudFront cache on content updates
**Files:** `lambda/processUpload/index.ts`, `lambda/updateConfig/index.ts`, `shared/utils/cacheInvalidation.ts`
**Dependencies:** API-004
**Constitutional Compliance:**
- Artist-First: Automated cache invalidation reduces artist confusion
**Acceptance Criteria:**
- [ ] CloudFront invalidation on new comic upload
- [ ] CloudFront invalidation on config updates
- [ ] Batch invalidations for efficiency (cost optimization)
- [ ] Invalidate paths: `/`, `/comic/*`, `/api/*`
- [ ] Handle invalidation errors gracefully
- [ ] Log invalidation requests
- [ ] Inform artist of ~5 minute cache propagation delay

## Phase 7: Testing & Quality Assurance

### TEST-001: Validation Schema Unit Tests
**Description:** Unit tests for all Zod validation schemas
**Files:** `frontend/src/validation/__tests__/comic.schema.test.ts`, `frontend/src/validation/__tests__/metadata.schema.test.ts`
**Dependencies:** DATA-002
**Constitutional Compliance:**
- Artist-First: Tests ensure validation errors are clear and helpful
**Acceptance Criteria:**
- [ ] Test all validation rules from specs/validation-rules.md
- [ ] Test valid data from test/fixtures/valid-comics.json
- [ ] Test invalid data from test/fixtures/invalid-comics.json
- [ ] Verify error messages are artist-friendly
- [ ] Test boundary values (max lengths, min/max dates)
- [ ] Test reference syntax validation
- [ ] 100% coverage of validation logic

### TEST-002: Reference Parser Unit Tests
**Description:** Test caption reference parsing and autocomplete
**Files:** `shared/utils/__tests__/referenceParser.test.ts`
**Dependencies:** UPLOAD-010
**Constitutional Compliance:**
- Artist-First: Reliable parsing ensures artist references work correctly
**Acceptance Criteria:**
- [ ] Test [[Title]] syntax extraction
- [ ] Test [[Title|Alias]] syntax extraction
- [ ] Test multiple references in single caption
- [ ] Test edge cases (nested brackets, special characters)
- [ ] Test invalid reference patterns
- [ ] Test empty captions
- [ ] Test very long captions with many references

### TEST-003: Relationship Builder Unit Tests
**Description:** Test relationship creation and bidirectional linking
**Files:** `shared/utils/__tests__/relationshipBuilder.test.ts`
**Dependencies:** UPLOAD-010
**Constitutional Compliance:**
- Artist-First: Correct relationships enhance artist's narrative building
**Acceptance Criteria:**
- [ ] Test derivedRelationships array creation
- [ ] Test bidirectional relationship updates
- [ ] Test sourceType assignment (caption, series, tag)
- [ ] Test context snippet extraction
- [ ] Test missing target comic handling
- [ ] Test relationship deduplication
- [ ] Test relationship ordering

### TEST-004: API Integration Tests
**Description:** Integration tests for all Lambda functions
**Files:** `test/integration/api.test.ts`
**Dependencies:** API-003, UPLOAD-010
**Constitutional Compliance:**
- Cost-Conscious: Tests validate efficient query patterns
**Acceptance Criteria:**
- [ ] Test GetComics pagination logic
- [ ] Test GetComics tag filtering accuracy
- [ ] Test GetComic relationship resolution
- [ ] Test SearchComicTitles autocomplete accuracy
- [ ] Test ProcessUpload metadata validation
- [ ] Test GeneratePresignedUrl authentication
- [ ] Test error handling for all endpoints
- [ ] Test with real DynamoDB Local instance

### TEST-005 [P]: Upload Workflow End-to-End Test
**Description:** Complete upload workflow testing from file selection to publication
**Files:** `test/e2e/upload-workflow.test.ts`
**Dependencies:** UPLOAD-011
**Constitutional Compliance:**
- Artist-First: Validates complete artist workflow meets <5min target
**Acceptance Criteria:**
- [ ] Test complete upload flow: files → metadata → reorder → publish
- [ ] Test panel reordering functionality
- [ ] Test caption reference autocomplete
- [ ] Test thumbnail selection
- [ ] Test alt text input
- [ ] Test file validation errors
- [ ] Test metadata validation errors
- [ ] Test network failure recovery
- [ ] Verify bidirectional relationships created
- [ ] Time workflow completion (target <5 minutes)

### TEST-006 [P]: Cross-Device Testing
**Description:** Test on real devices matching artist and reader profiles
**Files:** `test/device-testing-report.md`
**Dependencies:** READER-008, CONFIG-005
**Constitutional Compliance:**
- Artist-First: iPad testing prioritized, reader devices secondary
**Acceptance Criteria:**
- [ ] Test upload workflow on iPad Safari (primary artist device)
- [ ] Test upload workflow on iPad Chrome
- [ ] Test responsive design on iPhone
- [ ] Test responsive design on Android phone
- [ ] Test desktop browsers: Chrome, Firefox, Safari, Edge
- [ ] Verify touch targets >44px on mobile devices
- [ ] Test carousel gestures on touch devices
- [ ] Test orientation changes (portrait/landscape)
- [ ] Document device-specific issues and workarounds

### TEST-007 [P]: Performance Testing
**Description:** Validate load times and bundle sizes meet targets
**Files:** `test/performance/metrics.test.ts`, `test/performance/bundle-analysis.md`
**Dependencies:** API-005, READER-008
**Constitutional Compliance:**
- Cost-Conscious: Performance optimization within cost constraints
**Acceptance Criteria:**
- [ ] Homepage loads <3s on 3G connection
- [ ] Single comic page loads <2s
- [ ] Upload interface loads <1s
- [ ] API responses <500ms
- [ ] Bundle size analysis and optimization
- [ ] Code splitting verification (lazy load upload interface)
- [ ] Image lazy loading verification
- [ ] Lighthouse score: Performance >80, Accessibility >90

### TEST-008: Constitutional Compliance Testing
**Description:** Validate all constitutional principles in implementation
**Files:** `test/constitutional-compliance.test.ts`, `docs/constitutional-compliance-report.md`
**Dependencies:** All FEAT-*, API-*, CONFIG-* tasks
**Constitutional Compliance:**
- All Principles: Comprehensive validation of adherence
**Acceptance Criteria:**
- [ ] Artist workflow prioritization validated (upload before reader features)
- [ ] Cost compliance tested (realistic traffic simulation)
- [ ] Serverless architecture validated (no EC2, containers, or dedicated servers)
- [ ] Deployment simplicity validated (single CDK command)
- [ ] Generate compliance report documenting all validations
- [ ] Identify any constitutional violations and remediation plans

### TEST-009 [P]: Cost Monitoring Setup
**Description:** Deploy to test account and monitor actual costs
**Files:** `lib/self-hosted-comic-site-stack.ts` (cost alarms), `docs/cost-analysis-report.md`
**Dependencies:** TEST-008
**Constitutional Compliance:**
- Cost-Conscious: Actual cost validation against $10/month target
**Acceptance Criteria:**
- [ ] Deploy complete stack to test AWS account
- [ ] Generate realistic traffic (100 comics, 1000 views/month)
- [ ] Monitor costs for 1 week minimum
- [ ] CloudWatch alarms at $8/month threshold
- [ ] Cost breakdown by service (S3, Lambda, DynamoDB, CloudFront, Cognito)
- [ ] Validate estimated $3.50-7.50/month range
- [ ] Document cost optimization opportunities
- [ ] Create monthly cost projection report

## Phase 8: Documentation & Deployment

### DOC-001: Developer Documentation
**Description:** Complete technical documentation for developers
**Files:** `README.md`, `docs/architecture.md`, `docs/api-reference.md`, `docs/development-guide.md`
**Dependencies:** TEST-009
**Constitutional Compliance:**
- Deployment Simplicity: Clear documentation reduces setup friction
**Acceptance Criteria:**
- [ ] README updated with complete setup instructions
- [ ] Architecture documentation with diagrams
- [ ] Component hierarchy diagram
- [ ] Data flow diagrams
- [ ] API endpoint reference with request/response formats
- [ ] DynamoDB query patterns documented
- [ ] Local development workflow explained
- [ ] Troubleshooting guide for common issues

### DOC-002: Artist User Guide
**Description:** Create user-facing documentation for comic artists
**Files:** `docs/artist-guide.md`, `docs/upload-workflow.md`, `docs/obsidian-references.md`, `docs/troubleshooting.md`
**Dependencies:** DOC-001
**Constitutional Compliance:**
- Artist-First: Documentation prioritizes artist onboarding and workflow
**Acceptance Criteria:**
- [ ] Artist onboarding guide (first-time setup)
- [ ] Upload workflow walkthrough with screenshots
- [ ] Obsidian reference syntax guide with examples
- [ ] Panel reordering instructions
- [ ] Color palette customization guide
- [ ] Troubleshooting common issues (upload errors, auth issues)
- [ ] FAQ section
- [ ] Video tutorials (optional but recommended)

### DOC-003: Deployment Guide
**Description:** Step-by-step deployment instructions
**Files:** `docs/deployment-guide.md`, `docs/aws-setup.md`, `docs/configuration.md`
**Dependencies:** DOC-002
**Constitutional Compliance:**
- Deployment Simplicity: Single-command deployment process
**Acceptance Criteria:**
- [ ] AWS account setup instructions
- [ ] CDK prerequisites and installation
- [ ] Environment variable configuration guide
- [ ] Single `cdk deploy` command documentation
- [ ] DNS configuration (optional, for custom domain)
- [ ] Cognito Google OAuth setup
- [ ] Post-deployment verification steps
- [ ] Rollback procedures
- [ ] Update and maintenance procedures

### DEPLOY-001: Production Build Optimization
**Description:** Optimize React build for production deployment
**Files:** `frontend/vite.config.ts`, `frontend/package.json`
**Dependencies:** TEST-007
**Constitutional Compliance:**
- Cost-Conscious: Smaller bundles reduce CloudFront costs
**Acceptance Criteria:**
- [ ] Enable all Vite production optimizations
- [ ] Code splitting by route
- [ ] Lazy load upload interface components
- [ ] Tree-shake unused dependencies
- [ ] Minify JavaScript and CSS
- [ ] Optimize image assets
- [ ] Generate source maps for debugging
- [ ] Verify bundle size meets targets

### DEPLOY-002: CDK Deployment Pipeline
**Description:** Integrate Vite build into CDK deployment process
**Files:** `lib/self-hosted-comic-site-stack.ts`, `scripts/build-and-deploy.sh`
**Dependencies:** DEPLOY-001, DOC-003
**Constitutional Compliance:**
- Deployment Simplicity: Automated build within CDK deployment
**Acceptance Criteria:**
- [ ] Vite build runs automatically before CDK deploy
- [ ] Build artifacts deployed to S3 bucket
- [ ] CloudFront distribution updated
- [ ] Lambda functions deployed with shared code
- [ ] DynamoDB tables created with correct schema
- [ ] Cognito user pool and identity pool configured
- [ ] API Gateway or Lambda@Edge configured
- [ ] Output values for configuration (CloudFront URL, API URL)

### DEPLOY-003: Cost Monitoring and Alerts
**Description:** Configure CloudWatch alarms for cost thresholds
**Files:** `lib/self-hosted-comic-site-stack.ts`
**Dependencies:** DEPLOY-002
**Constitutional Compliance:**
- Cost-Conscious: Proactive cost monitoring prevents overruns
**Acceptance Criteria:**
- [ ] CloudWatch billing alarm at $8/month threshold
- [ ] CloudWatch billing alarm at $10/month threshold
- [ ] SNS topic for cost alert notifications
- [ ] Email subscription for alerts (artist's email)
- [ ] DynamoDB capacity alarms
- [ ] Lambda duration and error rate alarms
- [ ] S3 storage size monitoring
- [ ] CloudFront request count monitoring

### DEPLOY-004 [P]: Production Deployment Validation
**Description:** Validate successful deployment and all features working
**Files:** `test/deployment-validation.md`
**Dependencies:** DEPLOY-003
**Constitutional Compliance:**
- All Principles: Final validation of complete system
**Acceptance Criteria:**
- [ ] Complete deployment with single `cdk deploy` command
- [ ] Verify all AWS resources created correctly
- [ ] Test artist authentication flow
- [ ] Test complete upload workflow
- [ ] Test reader comic viewing
- [ ] Test color palette configuration
- [ ] Verify CloudFront distribution serving content
- [ ] Verify cost alarms configured correctly
- [ ] Document deployment time (<15 minutes target)
- [ ] Create deployment validation checklist

### VAL-001: Constitutional Compliance Final Validation
**Description:** Final validation of all constitutional principles in deployed system
**Files:** `docs/constitutional-compliance-final-report.md`
**Dependencies:** DEPLOY-004
**Constitutional Compliance:**
- All Principles: Comprehensive validation of constitutional adherence
**Acceptance Criteria:**
- [ ] Artist workflow prioritization validated in production
- [ ] Upload workflow completion time <5 minutes on iPad
- [ ] Serverless-first architecture confirmed (no non-managed services)
- [ ] Cost targets met ($3.50-7.50/month measured in test account)
- [ ] Cost monitoring operational and tested
- [ ] Deployment simplicity demonstrated (single CDK command successful)
- [ ] All constitutional quality gates passing
- [ ] Final compliance report documenting all validations
- [ ] Sign-off that project upholds all constitutional principles

## Task Dependencies and Parallelization

### Parallel Execution Groups

**Group 1 (Phase 0):** Can be executed in parallel after ENV-001
- ENV-002, ENV-003

**Group 2 (Phase 1):** Can be executed in parallel after DATA-001
- DATA-002, AUTH-001 (partial)

**Group 3 (Phase 2):** Can be executed in parallel after AUTH-003
- INFRA-001, UPLOAD-001

**Group 4 (Phase 3):** Can be executed in parallel after UPLOAD-003
- UPLOAD-004, UPLOAD-005

**Group 5 (Phase 3):** Can be executed in parallel after UPLOAD-008
- UPLOAD-009, Multiple upload component tests

**Group 6 (Phase 4):** Can be executed in parallel after READER-001
- READER-002, READER-004

**Group 7 (Phase 4):** Can be executed in parallel after READER-005
- READER-006, READER-007

**Group 8 (Phase 5):** Can be executed in parallel after CONFIG-001
- CONFIG-002, CONFIG-003

**Group 9 (Phase 6):** Can be executed in parallel after INFRA-002
- API-001, API-002, API-003

**Group 10 (Phase 7):** Can be executed in parallel after DATA-002
- TEST-001, TEST-002, TEST-003

**Group 11 (Phase 7):** Can be executed in parallel after TEST-005
- TEST-006, TEST-007

**Group 12 (Phase 8):** Can be executed in parallel after TEST-009
- DOC-001, DOC-002, DEPLOY-001

### Critical Path

The critical path for MVP completion is:
1. ENV-001 → ENV-002 → ENV-003 → ENV-004 → ENV-005
2. DATA-001 → DATA-002 → DATA-003 → DATA-004
3. AUTH-001 → AUTH-002 → AUTH-003
4. INFRA-001 → INFRA-002
5. UPLOAD-001 → UPLOAD-002 → UPLOAD-003 → UPLOAD-004 → UPLOAD-005 → UPLOAD-006 → UPLOAD-007
6. UPLOAD-008 → UPLOAD-009 → UPLOAD-010 → UPLOAD-011
7. READER-001 → READER-002 → READER-003 → READER-004 → READER-005 → READER-006 → READER-007 → READER-008
8. CONFIG-001 → CONFIG-002 → CONFIG-003 → CONFIG-004 → CONFIG-005
9. API-001, API-002, API-003 → API-004 → API-005
10. TEST-001 through TEST-009
11. DOC-001 → DOC-002 → DOC-003
12. DEPLOY-001 → DEPLOY-002 → DEPLOY-003 → DEPLOY-004
13. VAL-001

Estimated timeline with parallelization: 6-8 weeks for complete MVP implementation.

## Notes

- Tasks marked with [P] can be executed in parallel with other tasks in the same phase
- All acceptance criteria must be met before marking a task as complete
- Constitutional compliance notes should be validated during task completion
- Update task progress regularly to maintain clear visibility of project status
- Prioritize artist workflow tasks (Phase 3) over reader features (Phase 4)
- Cost monitoring should be ongoing throughout all phases
- Testing should be integrated throughout development, not just in Phase 7
