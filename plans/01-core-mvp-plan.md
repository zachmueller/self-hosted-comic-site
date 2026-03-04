# Implementation Plan: Core MVP

**Created:** November 18, 2025
**Specification:** [specs/01-core-mvp-spec.md](../specs/01-core-mvp-spec.md)
**Status:** Planning

## Technical Context

### Architecture Decisions
- **Frontend Framework:** React 18+ with functional components and hooks
- **Backend Technology:** AWS Lambda (Node.js 18.x runtime) for serverless functions
- **Database:** AWS DynamoDB with GSIs for efficient querying
- **Hosting/Deployment:** AWS CloudFront + S3 for static site, Lambda@Edge for API
- **Authentication:** AWS Cognito with Google federation
- **Build System:** Vite (lightweight, fast, minimal configuration)

### Technology Stack Rationale

#### React Migration Decision
- **Decision:** Migrate from vanilla JS to React 18
- **Rationale:** 
  - Component reusability for complex upload interface
  - Better state management for upload workflow and authentication
  - Rich ecosystem for autocomplete, drag-and-drop, and responsive design
  - Easier to maintain as features expand
- **Alternatives Considered:** Vue, Vanilla JS, Svelte
- **Trade-offs:** 
  - Pros: Better developer experience, component isolation, robust tooling
  - Cons: Slightly larger bundle size (mitigated by code splitting), learning curve for future maintainers

#### Vite Build System
- **Decision:** Use Vite for React build tooling
- **Rationale:**
  - Minimal configuration required (aligns with simplicity principle)
  - Fast development server with HMR
  - Optimized production builds with tree-shaking
  - Native ES modules support
  - Built-in React support
- **Alternatives Considered:** Webpack, Create React App, Parcel
- **Trade-offs:**
  - Pros: Fastest build times, simplest configuration, modern tooling
  - Cons: Newer tool (less Stack Overflow answers), but very mature now

#### DynamoDB Schema Design
- **Decision:** Use DynamoDB with composite keys and GSIs
- **Rationale:**
  - Serverless, pay-per-request pricing (cost-conscious)
  - Automatic scaling without management overhead
  - GSIs enable efficient queries for slug, title, and tag lookups
- **Schema:**
  - Primary: `id` (partition) + `postedTimestamp` (sort)
  - GSI-1: `slug` (partition) for direct comic lookups
  - GSI-2: `title` (partition) + `happenedOnDate` (sort) for autocomplete
  - GSI-3: `tag` (partition) + `postedTimestamp` (sort) for tag filtering
- **Trade-offs:**
  - Pros: Cost-effective, no maintenance, auto-scaling
  - Cons: Query pattern planning required, eventual consistency on GSIs

### Integration Points
- **AWS Cognito:** Google OAuth federation for artist authentication
- **AWS S3:** Comic image storage with presigned URL uploads
- **AWS Lambda:** API endpoints and upload processing
- **AWS CloudFront:** CDN for static assets and API caching
- **Third-party Libraries:**
  - React Router v6 for client-side routing
  - AWS SDK for JavaScript v3 for S3/Cognito operations
  - React-dropzone for iPad-friendly file uploads
  - React-beautiful-dnd for panel reordering
  - UUID library for ID generation

## Constitution Compliance Check

### Principle Compliance Review

#### Artist-First User Experience
- **Requirement:** Prioritize comic artist ease of use over reader convenience
- **Plan Alignment:**
  - Upload interface development prioritized in Phase 2
  - iPad-optimized UI components (large touch targets, native file picker)
  - Obsidian-style references streamline artist workflow
  - Panel reordering before publish allows easy corrections
  - Autocomplete reduces typing and errors
  - Upload progress feedback keeps artist informed
  - Reader features (responsive design, share) implemented after artist tools
- **Validation:** User testing with iPad on upload workflow completion time (<5 minutes target)

#### Serverless-First Architecture
- **Requirement:** Prefer managed, serverless AWS services over dedicated servers
- **Plan Alignment:**
  - DynamoDB (serverless database)
  - Lambda functions (serverless compute)
  - S3 (managed storage)
  - CloudFront (managed CDN)
  - Cognito (managed authentication)
  - API Gateway or Lambda@Edge (serverless API)
  - No EC2 instances, no RDS, no containers
- **Validation:** Infrastructure review ensures all components are managed AWS services

#### Cost-Conscious Design
- **Requirement:** Keep total hosting costs under $10/month for typical usage
- **Plan Alignment:**
  - DynamoDB: Pay-per-request pricing (~$1/month for 1M reads)
  - Lambda: Free tier covers typical usage (~$0.50/month)
  - S3: Standard storage for images (~$2-4/month for 100GB)
  - CloudFront: Free tier covers typical traffic (~$1-2/month)
  - Cognito: Free tier covers single artist (~$0)
  - **Estimated Total: $3.50-7.50/month**
- **Validation:** Cost monitoring alerts at $8/month threshold, monthly cost review

#### Deployment Simplicity
- **Requirement:** Simple command-line deployment operations (e.g., CDK commands)
- **Plan Alignment:**
  - Single `cdk deploy` command deploys entire stack
  - Vite build integrated into CDK deployment process
  - Environment configuration via CDK context
  - No manual infrastructure steps (except DNS if custom domain)
  - Automated S3 deployment for React build artifacts
- **Validation:** Fresh deployment test completes in under 15 minutes with single command

### Quality Gates
- [x] All constitutional MUST requirements addressed
- [x] Cost target ($10/month) not exceeded - Estimated $3.50-7.50/month
- [x] Serverless-first architecture maintained - All AWS managed services
- [x] Artist workflow prioritized over reader convenience - Upload features prioritized
- [x] Simple deployment process preserved - Single CDK command deployment

**Gate Evaluation:** PASS - All constitutional principles satisfied

## Phase 0: Project Setup & Foundation

### Technology Setup
- **Initialize React + Vite Project:**
  - Create Vite project with React TypeScript template
  - Configure for S3/CloudFront deployment (index.html fallback)
  - Set up ESLint and Prettier for code quality
  - Configure path aliases for clean imports

- **CDK Stack Restructure:**
  - Keep existing infrastructure definitions (S3, DynamoDB, Cognito, CloudFront)
  - Remove old Lambda function code
  - Add Vite build integration into CDK deployment
  - Configure CloudFront for SPA routing (404 → index.html)

- **Development Environment:**
  - Local development with Vite dev server
  - Environment variable configuration for AWS resources
  - Mock authentication for local development
  - Hot module replacement for fast iteration

### Data Model Implementation
- **DynamoDB Schema Setup:**
  - Update table definition with all required GSIs
  - Create TypeScript interfaces matching validation rules
  - Implement data access layer with query patterns

- **Validation Rules Integration:**
  - Port validation rules from `specs/02-validation-rules.md` to TypeScript
  - Create Zod schemas for runtime validation
  - Implement validation utilities for client and server

### Research Deliverables
- `research.md` - Technology decisions documented with rationale
- Updated `README.md` - Development setup instructions
- `.env.example` - Required environment variables
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration

## Phase 1: Authentication & Core Infrastructure

### Cognito Integration
- **Artist Authentication Flow:**
  - Implement Cognito Hosted UI integration
  - Handle OAuth callback and token exchange
  - Set up AWS credentials for authenticated artist
  - Persist authentication state in React context
  - Implement logout flow

- **Protected Routes:**
  - Create authentication HOC/hook
  - Implement route guards for upload interface
  - Handle authentication errors and redirects
  - Session management and token refresh

### API Layer Foundation
- **Lambda Function Structure:**
  - `GetComicsFunction` - List comics with pagination/filtering
  - `GetComicFunction` - Single comic by slug with relationships
  - `SearchComicTitlesFunction` - Autocomplete for Obsidian references
  - `ProcessUploadFunction` - Handle metadata and trigger processing
  - `GeneratePresignedUrlFunction` - S3 upload URLs for artist

- **API Gateway or Lambda@Edge:**
  - RESTful endpoints matching spec requirements
  - CORS configuration for CloudFront domain
  - Request/response transformation
  - Error handling and logging

### Core React Components
- **Layout Components:**
  - `App.tsx` - Root component with routing
  - `AuthProvider.tsx` - Authentication context
  - `Layout.tsx` - Site header, navigation, footer
  - `ProtectedRoute.tsx` - Authentication wrapper

- **Navigation Components:**
  - `Header.tsx` - Site title, auth status, upload link
  - `NavBar.tsx` - Home, tags, login/logout links

## Phase 2: Artist Upload Workflow (PRIORITY)

### Upload Interface Components
- **File Upload:**
  - `UploadPage.tsx` - Main upload container
  - `ImageDropzone.tsx` - Drag-and-drop + native file picker (iPad-optimized)
  - `ImagePreview.tsx` - Thumbnail previews of selected files
  - File validation (JPG/PNG/WebP, 20MB limit, 1-20 images)
  - Upload progress indicators per file

- **Metadata Form:**
  - `ComicMetadataForm.tsx` - Title, caption, date, tags inputs
  - `DatePicker.tsx` - Pre-populated with today's date
  - `TagInput.tsx` - Add/remove tags with validation
  - `ScrollStyleToggle.tsx` - Carousel vs long form selection
  - Real-time validation feedback
  - Touch-friendly form controls for iPad

- **Accessibility Features:**
  - `AltTextInput.tsx` - Optional alt text per image
  - `ThumbnailSelector.tsx` - Choose thumbnail image
  - Visual indicators for selected thumbnail
  - Preview of how thumbnail appears in listings

### Obsidian-Style Reference System
- **Caption Editor:**
  - `CaptionEditor.tsx` - Text area with reference detection
  - `ReferenceAutocomplete.tsx` - Dropdown for [[Comic Title]] suggestions
  - Real-time parsing of [[Title]] and [[Title|Alias]] syntax
  - Visual highlighting of valid/invalid references
  - Keyboard navigation (arrows, tab, escape)
  - Touch-friendly suggestion selection

- **Reference Processing:**
  - Parse caption on form change
  - Query comic titles via API for autocomplete
  - Validate references before submission
  - Display preview of parsed references

### Panel Reordering
- **Reorder Interface:**
  - `PanelReorderScreen.tsx` - Post-upload reordering step
  - `DraggablePanel.tsx` - Drag-and-drop panel component
  - Touch-gesture support for iPad (drag-and-drop)
  - Visual feedback during drag operations
  - Preview of final order in both carousel and long modes
  - Skip option to maintain upload order

### Upload Processing
- **S3 Upload Flow:**
  - Generate presigned URLs via Lambda
  - Direct browser-to-S3 uploads (no Lambda intermediary)
  - Progress tracking per image
  - Error handling and retry logic
  - Concurrent upload management (3-5 at a time)

- **Metadata Submission:**
  - Compile metadata with ordered image references
  - Parse caption references into `derivedRelationships`
  - Submit metadata to Lambda function
  - Trigger relationship bidirectionality creation
  - DynamoDB write with all validated data

### Upload Success Flow
- **Post-Upload Actions:**
  - Display success confirmation
  - Show link to published comic
  - Option to upload another comic
  - Clear form and reset state
  - Invalidate CloudFront cache

## Phase 3: Reader Experience - Comic Display

### Homepage Components
- **Comic Listing:**
  - `HomePage.tsx` - Main landing page
  - `ComicGrid.tsx` - Responsive grid of comic entries
  - `ComicCard.tsx` - Individual comic preview card
  - Thumbnail display with title and metadata
  - Pagination controls
  - Loading states and error handling

- **Filtering:**
  - `TagFilter.tsx` - Tag-based filtering interface
  - `Pagination.tsx` - Next/previous page navigation
  - URL parameter handling for page and tag
  - Responsive filter controls (desktop + mobile)

### Single Comic Page
- **Comic Display:**
  - `ComicPage.tsx` - Full comic display container
  - `ComicImages.tsx` - Image display component
  - Carousel mode with navigation controls
  - Long form mode with vertical scroll
  - Responsive image sizing
  - Touch gestures for carousel (swipe on mobile)

- **Comic Metadata:**
  - `ComicHeader.tsx` - Title, dates, tags
  - `ComicCaption.tsx` - Caption with parsed references
  - `ShareButton.tsx` - Copy URL to clipboard functionality
  - `RelatedComics.tsx` - Display derived relationships

### Relationship Display
- **Related Comics Section:**
  - Display explicit relationships (caption references)
  - Display series relationships (when series feature added)
  - Display tag-based relationships
  - Hierarchical display with clear separation
  - Context snippets for caption references
  - Clickable links to related comics
  - Responsive thumbnail grid

### Responsive Design Implementation
- **Breakpoint System:**
  - Mobile: 320px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+
  - Fluid layouts between breakpoints

- **Mobile Optimizations:**
  - Stack layouts vertically
  - Full-width images
  - Large touch targets (min 44px)
  - Simplified navigation
  - Bottom-positioned controls
  - Hamburger menu for tags

- **Desktop Optimizations:**
  - Multi-column layouts
  - Sidebar navigation
  - Hover states for clickable elements
  - Keyboard shortcuts support
  - Mouse-optimized controls

## Phase 4: Color Palette Configuration

### Configuration UI
- **Color Management:**
  - `ColorPaletteEditor.tsx` - Artist-facing configuration UI
  - `ColorPicker.tsx` - HTML5 color input with hex validation
  - Five color categories: Primary, Secondary, Highlight, Text, Secondary Text
  - Live preview of color changes
  - Reset to defaults option
  - Mobile-responsive interface

- **Configuration Storage:**
  - Store in DynamoDB configuration table
  - Lambda function for read/write operations
  - Cache configuration in CloudFront
  - Invalidate cache on updates

### Color Application System
- **CSS Variable Injection:**
  - Load color palette on app initialization
  - Inject CSS custom properties into :root
  - Apply colors throughout component tree
  - Default values if config not loaded

- **Color Categories:**
  - `--color-primary`: Buttons, primary links
  - `--color-secondary`: Secondary buttons, accents
  - `--color-highlight`: Tags, labels, emphasis
  - `--color-text`: Body text, headings
  - `--color-text-secondary`: Metadata, captions

### Accessibility Validation
- **Contrast Checking:**
  - Calculate WCAG contrast ratios
  - Warn artist of insufficient contrast
  - Suggest adjustments for accessibility
  - Allow override with warning

## Phase 5: API Implementation

### Lambda Functions

#### GetComicsFunction
- **Functionality:**
  - Query DynamoDB with pagination
  - Optional tag filtering via GSI
  - Return sorted by postedTimestamp (desc)
  - Include hasNextPage flag

- **Response Structure:**
  ```typescript
  {
    items: Comic[],
    page: number,
    hasNextPage: boolean,
    tag?: string
  }
  ```

#### GetComicFunction
- **Functionality:**
  - Query by slug using GSI
  - Include derived relationships
  - Calculate bidirectional relationships
  - Return single comic with related comics

- **Relationship Resolution:**
  - Load target comics for derivedRelationships
  - Group by sourceType (caption, series, tag)
  - Return with context (caption snippets)

#### SearchComicTitlesFunction
- **Functionality:**
  - Search comic titles for autocomplete
  - Case-insensitive matching
  - Return top 10 matches ordered by recency
  - Support prefix and partial matching

- **Response Structure:**
  ```typescript
  {
    suggestions: Array<{
      id: string,
      title: string,
      slug: string,
      happenedOnDate: string
    }>
  }
  ```

#### ProcessUploadFunction
- **Functionality:**
  - Validate metadata against Zod schemas
  - Generate UUID for comic ID
  - Parse caption for [[references]]
  - Create derivedRelationships array
  - Write to DynamoDB
  - Update bidirectional relationships
  - Trigger cache invalidation

- **Relationship Processing:**
  - Extract all [[Title]] and [[Title|Alias]] patterns
  - Query DynamoDB for matching titles
  - Create relationship objects
  - Update target comics with inverse relationships

#### GeneratePresignedUrlFunction
- **Functionality:**
  - Authenticate artist via Cognito
  - Generate S3 presigned URL for PUT
  - Set content type and size limits
  - Return URL with expiration

### CloudFront Integration
- **Caching Strategy:**
  - Static assets: Long cache (1 year)
  - API responses: Short cache (5 minutes)
  - Comic images: Medium cache (1 day)
  - Index.html: No cache (SPA routing)

- **Cache Invalidation:**
  - Invalidate on new comic upload
  - Invalidate on comic updates
  - Invalidate on config changes
  - Batch invalidations for efficiency

## Phase 6: Testing & Quality Assurance

### Validation Testing
- **Schema Validation:**
  - Unit tests for all Zod schemas
  - Test valid and invalid data from `test/fixtures/`
  - Verify error messages are clear
  - Test edge cases (boundary values)

- **API Validation:**
  - Integration tests for Lambda functions
  - Test pagination edge cases
  - Test tag filtering accuracy
  - Test relationship resolution

### Upload Workflow Testing
- **End-to-End Tests:**
  - Complete upload from file selection to publication
  - Test panel reordering functionality
  - Test caption reference autocomplete
  - Test thumbnail selection
  - Test alt text input
  - Verify bidirectional relationships created

- **Error Handling:**
  - Test file size validation
  - Test invalid file types
  - Test network failures during upload
  - Test session expiration during upload
  - Verify error recovery options

### Cross-Device Testing
- **Device Matrix:**
  - Desktop: Chrome, Firefox, Safari, Edge
  - Tablet: iPad Safari (primary test device)
  - Mobile: iOS Safari, Android Chrome

- **Responsive Testing:**
  - Test all breakpoints (320px, 768px, 1024px, 1440px+)
  - Verify touch targets on mobile (min 44px)
  - Test carousel gestures on touch devices
  - Verify keyboard navigation on desktop
  - Test orientation changes (portrait/landscape)

### Performance Testing
- **Load Time Targets:**
  - Homepage: <3s on 3G connection
  - Single comic page: <2s
  - Upload interface: <1s
  - API responses: <500ms

- **Bundle Size Optimization:**
  - Code splitting by route
  - Lazy load upload interface
  - Optimize image loading (lazy + responsive)
  - Tree-shake unused dependencies

### Constitutional Compliance Testing
- **Artist Workflow Test:**
  - Time complete upload workflow on iPad
  - Target: <5 minutes from login to published
  - Identify friction points
  - Optimize based on timing data

- **Cost Monitoring:**
  - Deploy to test AWS account
  - Generate realistic traffic (100 comics, 1000 views/month)
  - Monitor actual costs for 1 month
  - Verify under $10/month target
  - Identify cost optimization opportunities

## Phase 7: Documentation & Deployment

### Developer Documentation
- **Setup Guide:**
  - Update README.md with React setup
  - Document environment variables
  - Explain local development workflow
  - Document deployment process

- **Architecture Documentation:**
  - Component hierarchy diagram
  - Data flow diagrams
  - API endpoint reference
  - DynamoDB query patterns

### Artist Documentation
- **User Guide:**
  - Upload workflow walkthrough
  - Obsidian reference syntax guide
  - Panel reordering instructions
  - Color palette customization
  - Troubleshooting common issues

### Deployment Preparation
- **Production Readiness:**
  - Remove development logging
  - Enable production build optimizations
  - Configure error monitoring
  - Set up cost alerts
  - Document rollback procedures

- **CDK Deployment:**
  - Single `cdk deploy` command
  - Automatic Vite build step
  - S3 deployment of React app
  - CloudFront distribution update
  - Output values for configuration

### Launch Checklist
- [ ] All MVP features implemented and tested
- [ ] Cross-device testing complete
- [ ] Performance targets met
- [ ] Cost monitoring configured
- [ ] Documentation complete
- [ ] Constitutional compliance validated
- [ ] Backup and recovery tested
- [ ] Artist onboarding materials ready

## Risk Assessment

### Technical Risks

#### High Risk: Caption Reference Parsing Performance
- **Risk:** Complex regex parsing of captions with many references could impact upload performance
- **Impact:** Upload times exceed 5-minute target, artist frustration
- **Likelihood:** Medium - depends on caption length and reference count
- **Mitigation:** 
  - Implement efficient parsing algorithm
  - Limit references per caption (e.g., max 20)
  - Use streaming/progressive parsing for long captions
  - Cache parsed results during editing
- **Contingency:** Simplify reference syntax or limit caption length

#### High Risk: iPad Safari Compatibility
- **Risk:** Safari-specific issues with file uploads or touch gestures
- **Impact:** Upload workflow broken on primary artist device
- **Likelihood:** Medium - Safari often has unique behaviors
- **Mitigation:**
  - Test early and often on actual iPad hardware
  - Use feature detection for browser capabilities
  - Implement fallbacks for unsupported features
  - Consider progressive web app features
- **Contingency:** Recommend desktop browser for upload if issues persist

#### Medium Risk: DynamoDB Query Performance
- **Risk:** Complex relationship queries could be slow or expensive
- **Impact:** Slow page loads, increased costs
- **Likelihood:** Low-Medium - depends on comic count and relationship density
- **Mitigation:**
  - Design efficient GSI query patterns
  - Implement pagination for large result sets
  - Cache frequently accessed relationship data
  - Monitor query performance and costs
- **Contingency:** Add ElastiCache layer if needed (increases costs)

#### Medium Risk: CloudFront Cache Invalidation Delays
- **Risk:** Cache invalidation takes 5-10 minutes, delaying comic visibility
- **Impact:** Artist confusion about publication status
- **Likelihood:** High - CloudFront invalidation is inherently slow
- **Mitigation:**
  - Set expectations in UI (e.g., "Comic will appear in ~5 minutes")
  - Provide direct link that bypasses cache
  - Consider cache-busting query parameters
- **Contingency:** Accept delay as acceptable trade-off for cost savings

#### Low Risk: React Bundle Size
- **Risk:** React app too large, impacting load times
- **Impact:** Slower page loads, failed performance targets
- **Likelihood:** Low - with proper code splitting
- **Mitigation:**
  - Implement route-based code splitting
  - Lazy load upload interface (only for authenticated artist)
  - Tree-shake unused dependencies
  - Use production build optimizations
- **Contingency:** Consider Preact or other lighter alternatives

### Dependencies and Assumptions

#### External Dependencies
- **AWS Service Availability:** Assumes AWS us-east-1 region stability
- **Cognito Google Federation:** Depends on Google OAuth availability
- **npm Package Ecosystem:** Relies on React, Vite, and AWS SDK packages
- **Browser Support:** Assumes modern browser with ES6+ support

#### Technical Assumptions
- **Single Artist Usage:** Designed for one artist, not multi-tenant
- **Comic Count:** Assumes <10,000 comics for DynamoDB query efficiency
- **Concurrent Uploads:** Assumes single upload session at a time
- **Image Storage:** Assumes S3 Standard storage class is cost-effective
- **Network Reliability:** Assumes reasonable internet connection for uploads

#### Business Assumptions
- **Artist Device:** Primary device is iPad with Safari or Chrome
- **Upload Frequency:** 1-10 comics per month
- **Traffic Patterns:** 100-1000 page views per month
- **Cost Model:** AWS pricing remains stable and predictable
- **Artist Technical Skill:** Basic computer literacy, can follow documentation

## Next Phase Preparation

### Task Breakdown Readiness
The plan provides sufficient detail for task generation:
- [x] Clear technology choices (React, Vite, TypeScript, DynamoDB)
- [x] Complete component hierarchy identified
- [x] Data model and validation rules defined
- [x] API endpoints specified with request/response formats
- [x] Development environment requirements clear
- [x] Quality standards and testing approach specified
- [x] Integration requirements and dependencies documented

### Implementation Prerequisites
- [x] All technology decisions made and documented
- [x] Technical architecture validated against constitutional principles
- [x] Development environment requirements specified (Node, AWS CDK, React)
- [x] Third-party integrations identified (Cognito, S3, DynamoDB)
- [x] Quality assurance approach defined (unit, integration, e2e testing)
- [x] Constitutional compliance validated and documented

### Ready for Task Breakdown
This plan is ready to be broken down into atomic, actionable tasks. The next step is to create `tasks/core-mvp-tasks.md` following the task template, organizing work into:

1. **Environment Setup Tasks** - Project initialization, CDK updates
2. **Data Layer Tasks** - DynamoDB schema, validation rules
3. **Authentication Tasks** - Cognito integration, protected routes
4. **Upload Workflow Tasks** - UI components, S3 integration, processing
5. **Reader Experience Tasks** - Comic display, responsive design
6. **Configuration Tasks** - Color palette system
7. **API Implementation Tasks** - Lambda functions, CloudFront
8. **Testing Tasks** - Unit, integration, cross-device
9. **Documentation Tasks** - README, user guides
10. **Deployment Tasks** - CDK deployment, production readiness

Each task will include:
- Clear acceptance criteria
- Constitutional compliance notes
- Dependencies on other tasks
- Estimated complexity
- Testing requirements
