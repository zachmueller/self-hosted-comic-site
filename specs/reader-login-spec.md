# Self-Hosted Comic Site - Reader Login System

**Created:** November 8, 2025
**Status:** Draft
**Related Specs:** 
- [Core MVP](core-mvp-spec.md) - Prerequisites for basic comic display
- [Enhanced Features](enhanced-features-spec.md) - May integrate with management interface

## Overview
Reader authentication and engagement system that allows comic site visitors to create accounts, react to individual comic panels with emoji reactions, and leave moderated comments on comic posts. This system maintains the artist-first principle by giving artists full control over reader engagement and community moderation.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- Artist has complete control over reader account approval and comment moderation
- Artist dashboard for managing reader engagement consolidates all moderation tasks
- New reader accounts require explicit artist approval before comments become visible
- Artist can approve accounts in bulk to reduce ongoing moderation overhead
- Emoji reactions provide immediate reader feedback without requiring artist intervention
- Comment system designed to enhance artist-reader connection while minimizing moderation burden

### Cost Impact Assessment
**Estimated cost implications:**
- Additional Cognito User Pool for reader accounts: ~$0.50-1/month (for typical indie comic readership)
- DynamoDB storage for reactions and comments: ~$0.25-0.50/month
- Lambda execution for engagement features: ~$0.25-0.50/month
- **Total monthly cost impact: $1-2/month**
- **Validation: Total system cost remains well under $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- AWS Cognito User Pool for reader authentication with Google federation
- DynamoDB for storing reactions, comments, and reader approval status
- Lambda functions for engagement APIs and moderation workflows
- Extends existing API Gateway with new reader-authenticated endpoints
- No additional infrastructure components required

### Deployment Simplicity
**Deployment approach:**
- Reader authentication deployable via existing `cdk deploy` command
- Cognito User Pool configuration handled automatically via CDK
- Google OAuth configuration requires one-time setup (documented process)
- All engagement features integrated into existing deployment workflow

## User Stories
- As a comic reader, I want to sign in with my Google account so that I can engage with comics without creating separate credentials
- As a comic reader, I want to react to individual comic panels with emoji so that I can express my immediate reactions to specific moments
- As a comic reader, I want to leave comments on comics so that I can share my thoughts with the artist and other readers
- As a comic reader, I want to edit or delete my own comments so that I can correct mistakes or change my mind
- As a comic artist, I want to approve new reader accounts so that I can prevent spam and maintain community quality
- As a comic artist, I want to see emoji reactions on each panel so that I can understand which moments resonate most with readers
- As a comic artist, I want to moderate comments easily so that I can maintain a positive community environment
- As a comic artist, I want approved readers to comment freely so that engaged community members don't face unnecessary friction

## Functional Requirements

### FR-R1: Reader Authentication System
**Description:** Cognito-based authentication system for comic site readers using Google federation
**Acceptance Criteria:**
- **Reader User Pool Configuration:**
  - Separate Cognito User Pool for readers (distinct from artist authentication)
  - Google identity provider federation configured for reader sign-up and sign-in
  - User attributes: email, name, approval_status, approved_by, approved_date
  - Account verification via email for security and spam prevention
- Reader registration flow requires Google account authentication
- New reader accounts automatically created with `approval_status: "pending"`
- Reader authentication state persists across browser sessions
- Secure logout functionality invalidates reader sessions
- Reader accounts cannot access artist upload or management interfaces

### FR-R2: Reader Account Approval System
**Description:** Artist-controlled moderation system for new reader accounts
**Acceptance Criteria:**
- **Reader Account States:**
  - `pending`: New account, comments held for moderation, reactions disabled
  - `approved`: Full engagement privileges, comments publish immediately
  - `blocked`: Account disabled, no engagement allowed
- Artist dashboard displays pending reader accounts with basic profile information
- Artist can approve accounts individually or in bulk operations
- Artist can block accounts and hide all their existing comments
- Approved accounts tracked with artist approval metadata (approved_by, approved_date)
- Email notifications to readers when accounts are approved (optional, artist configurable)
- Reader comment history visible to artist during approval process

### FR-R3: Emoji Reactions System
**Description:** Panel-specific emoji reactions allowing readers to respond to individual comic images
**Acceptance Criteria:**
- **Reaction Data Model:**
  - `comicId` (string): Parent comic identifier
  - `imageIndex` (number): Specific image within comic (0-based)
  - `readerId` (string): Reader account identifier
  - `emoji` (string): Selected emoji reaction
  - `timestamp` (timestamp): When reaction was added
  - Composite key: comicId + imageIndex + readerId (prevents duplicate reactions per reader per image)
- **Supported Emoji Set:** 
  - Core emotions: 😍 (love), 😂 (funny), 😢 (sad), 😱 (shocked), 😡 (angry)
  - Comic-specific: 🔥 (epic), ⭐ (favorite), 👏 (applause), 🤔 (thoughtful)
  - Artist can configure available emoji set via dashboard
- Only approved readers can add emoji reactions
- One reaction per reader per comic image (can change existing reaction)
- Reaction counts displayed publicly for each comic panel
- Artist can view detailed reaction analytics (which readers reacted how)
- Real-time reaction updates using optimistic UI with server validation

### FR-R4: Comment System with Moderation
**Description:** Comic-level commenting system with artist approval workflow for new readers
**Acceptance Criteria:**
- **Comment Data Model:**
  - `commentId` (string): Unique comment identifier
  - `comicId` (string): Parent comic identifier
  - `readerId` (string): Comment author identifier
  - `content` (string): Comment text content (max 1000 characters)
  - `status` (string): 'published', 'pending', 'hidden'
  - `createdDate` (timestamp): Original comment timestamp
  - `lastModified` (timestamp): Most recent edit timestamp
  - `editHistory` (array): Track edit timestamps for transparency
- **Comment Visibility Rules:**
  - Comments from approved readers: publish immediately with `status: "published"`
  - Comments from pending readers: saved with `status: "pending"`, not visible to other readers
  - Artist can review pending comments and change status to "published" or "hidden"
- Reader can edit their own comments (updates `lastModified`, appends to `editHistory`)
- Reader can delete their own comments (removes from public display, may preserve for artist records)
- Comments displayed chronologically on individual comic pages
- Comment form only visible to authenticated readers
- Character count and basic content validation (no empty comments, basic spam detection)

### FR-R5: Artist Engagement Dashboard
**Description:** Centralized interface for artists to manage reader engagement and moderation
**Acceptance Criteria:**
- **Reader Account Management:**
  - List of pending reader accounts with approval/block actions
  - Bulk approval operations for efficiency
  - Search and filter readers by approval status, join date, activity level
- **Comment Moderation Interface:**
  - Queue of pending comments from new readers
  - Bulk approve/hide operations for comment moderation
  - Comment history and context for moderation decisions
- **Engagement Analytics:**
  - Emoji reaction summaries per comic and per panel
  - Comment activity trends and popular discussions
  - Reader engagement metrics (approved vs. pending ratios)
- **Moderation Tools:**
  - Block reader accounts and hide all their content
  - Hide individual comments while preserving reader account status
  - Export engagement data for external analysis (CSV format)
- Dashboard accessible from artist management interface, mobile-optimized for iPad

### FR-R6: Reader Engagement Interface
**Description:** Reader-facing interface for authentication, reactions, and commenting
**Acceptance Criteria:**
- **Authentication Interface:**
  - Google sign-in button integrated into comic site header/navigation
  - Clear indication of authentication status and approval status
  - Account pending message for new readers explaining approval process
- **Reaction Interface:**
  - Emoji reaction buttons displayed below each comic image
  - Reaction counts visible to all readers (authenticated and anonymous)
  - Visual feedback when reader adds/changes reactions
  - Hover/touch interaction shows who reacted (for approved readers)
- **Comment Interface:**
  - Comment form at bottom of individual comic pages
  - Character counter and submit/edit controls
  - Comment display with author names and timestamps
  - Edit/delete options for reader's own comments
  - Clear indication when comments are pending approval
- Mobile-responsive design for all reader engagement features
- Graceful degradation: anonymous readers see engagement but cannot participate

## Non-Functional Requirements

### NFR-R1: Performance and Scalability
**Description:** Reader engagement features must perform well within cost constraints
**Acceptance Criteria:**
- Reaction loading and updates complete in under 500ms
- Comment loading for popular comics (50+ comments) completes under 1 second
- Reader authentication flow completes in under 2 seconds
- Emoji reaction updates use optimistic UI for immediate feedback
- Comment pagination for comics with many comments
- Database queries optimized for cost-effective DynamoDB usage patterns

### NFR-R2: Moderation Efficiency
**Description:** Artist moderation workflow optimized for minimal time investment
**Acceptance Criteria:**
- Bulk approval operations handle 10+ accounts in single action
- Pending content review interface shows relevant context for quick decisions
- Notification system alerts artist to pending moderation tasks (configurable frequency)
- Mobile-optimized moderation interface for artist convenience
- One-time account approval eliminates ongoing comment moderation for trusted readers

### NFR-R3: Content Quality and Safety
**Description:** System design prevents spam and maintains content quality
**Acceptance Criteria:**
- New reader approval system acts as primary spam prevention
- Comment character limits prevent excessive content
- Basic content validation prevents empty or malformed submissions
- Rate limiting on reactions and comments prevents abuse
- Clear community guidelines integrated into reader onboarding
- Artist retains complete control over all published reader content

## User Scenarios & Testing

### New Reader Engagement Flow
1. Anonymous reader discovers comic site and enjoys content
2. Reader clicks "Sign in with Google" to create account for engagement
3. Reader account created with pending status, receives welcome message explaining approval process
4. Reader can browse but cannot react or comment during pending period
5. Artist reviews pending account in moderation dashboard and approves
6. Reader receives approval notification and can now fully engage with content
7. Reader adds emoji reactions to favorite comic panels and leaves first comment
8. Future comments from this reader publish immediately without moderation

### Active Reader Interaction Flow
1. Approved reader visits new comic post
2. Reader adds emoji reactions to multiple panels expressing different emotions
3. Reader scrolls to comment section and writes thoughtful response to comic
4. Reader realizes they want to add more detail and edits their comment
5. Other readers see updated comment with edit timestamp
6. Reader engages in discussion by responding to artist or other reader comments
7. Artist sees engagement analytics showing which panels resonated most

### Artist Moderation Flow
1. Artist receives notification of pending reader accounts and comments
2. Artist opens moderation dashboard on iPad during break
3. Artist reviews pending reader profiles and approves several active community members
4. Artist reviews pending comments and approves quality discussions
5. Artist notices spam comment and hides it while leaving reader account approved
6. Artist checks engagement analytics and sees positive reaction to latest comic panels
7. All moderation tasks completed in under 10 minutes of focused attention

### Comment Management Flow  
1. Reader posts comment on comic but notices typo immediately
2. Reader clicks edit button and corrects mistake within edit window
3. Comment updates with "edited" indicator and preserves original timestamp
4. Later, reader changes opinion and edits comment to reflect new perspective
5. Edit history preserved for transparency and potential artist review
6. If needed, reader can delete comment entirely to remove from discussion

## Success Criteria
- Reader account approval workflow completable by artist in under 2 minutes per batch of 10 accounts
- Emoji reaction response time under 500ms for immediate reader feedback
- Comment system supports 50+ comments per comic without performance degradation
- New reader onboarding explains approval process clearly, reducing artist support burden
- Reader engagement features add less than $2/month to hosting costs
- Moderation dashboard usable on iPad for convenient artist workflow
- 95% of approved readers successfully engage with comments and reactions without issues

## Key Entities

### Reader Account Entity
- **Attributes:** 
  - `readerId` (string): Unique reader identifier (Cognito User ID)
  - `email` (string): Reader email from Google authentication
  - `name` (string): Reader display name from Google profile
  - `approvalStatus` (string): 'pending', 'approved', 'blocked'
  - `approvedBy` (string, optional): Artist ID who approved account
  - `approvedDate` (timestamp, optional): When account was approved
  - `createdDate` (timestamp): Account creation timestamp
  - `lastActive` (timestamp): Most recent engagement activity
- **Validation:** Email required, approvalStatus must be valid enum value
- **Relationships:** Has many reactions and comments

### Emoji Reaction Entity
- **Attributes:**
  - `comicId` (string): Parent comic identifier
  - `imageIndex` (number): Specific image within comic (0-based)
  - `readerId` (string): Reader who reacted
  - `emoji` (string): Selected emoji reaction
  - `timestamp` (timestamp): When reaction was added
- **Primary Key:** Composite of comicId + imageIndex + readerId
- **Validation:** imageIndex must be valid for target comic, emoji must be from approved set
- **Relationships:** Belongs to comic and reader account

### Comment Entity
- **Attributes:**
  - `commentId` (string): Unique comment identifier
  - `comicId` (string): Parent comic identifier  
  - `readerId` (string): Comment author identifier
  - `content` (string): Comment text (max 1000 characters)
  - `status` (string): 'published', 'pending', 'hidden'
  - `createdDate` (timestamp): Original comment timestamp
  - `lastModified` (timestamp): Most recent edit timestamp
  - `editHistory` (array): Edit timestamps for transparency
- **Validation:** Content required and within character limits, status must be valid enum
- **Relationships:** Belongs to comic and reader account

### Engagement Analytics Entity
- **Attributes:**
  - `comicId` (string): Target comic
  - `totalReactions` (number): Reaction count across all panels
  - `totalComments` (number): Published comment count
  - `topEmojis` (object): Most popular emoji reactions by panel
  - `engagementScore` (number): Calculated engagement metric
  - `lastUpdated` (timestamp): Analytics refresh timestamp
- **Validation:** Numeric values must be non-negative
- **Relationships:** Associated with comic entity

## Integration Points

### Core MVP Integration
- Extends individual comic pages with reaction and comment interfaces
- Integrates with existing comic entity structure (comicId references)
- Uses existing AWS infrastructure (API Gateway, Lambda, DynamoDB)
- Reader authentication separate from artist authentication system

### Enhanced Features Integration
- Artist engagement dashboard accessible through existing management interface
- Moderation features integrate with advanced management controls
- Engagement analytics complement existing comic analytics
- Bulk operations may include engagement data in exports

## Implementation Notes

### Authentication Architecture
- Separate Cognito User Pool for readers maintains clear separation from artist accounts
- Google OAuth configuration shared between artist and reader authentication
- Reader JWT tokens include approval status for authorization decisions
- Session management handles approval status changes in real-time

### Database Design Considerations
- Reactions use composite primary key for efficient single-reader-per-panel enforcement
- Comment queries optimized for chronological display and moderation workflows
- Global Secondary Index on approval status for efficient pending account queries
- Analytics data calculated asynchronously to minimize real-time performance impact

### Moderation Workflow Design
- Approval system designed for batch operations to minimize artist time investment
- Default to requiring approval maintains artist control and community quality
- Once approved, readers have full privileges to reduce ongoing moderation burden
- Block functionality provides escape hatch for problematic accounts

## Out of Scope
- Advanced comment threading or reply systems (flat comment structure only)
- Social features beyond basic reactions and comments (no user profiles, friend systems, etc.)
- Advanced analytics requiring external services or complex tracking
- Real-time chat or messaging between readers
- Automated content moderation beyond basic validation
- Integration with external social media platforms
- Advanced emoji customization or custom reaction types
- Comment voting or ranking systems

## Dependencies
- **Required:** Core MVP must be implemented for comic display and identification
- **Recommended:** Enhanced Features management interface provides better integration for moderation dashboard
- **Infrastructure:** Builds upon existing AWS Cognito, DynamoDB, Lambda, and API Gateway services
- **Configuration:** Google OAuth application configuration required for reader authentication setup

## Security Considerations
- Reader account data isolated from artist administrative functions
- Comment content validation prevents XSS and injection attacks
- Rate limiting prevents reaction and comment spam
- Email verification required for new reader accounts
- Artist approval system acts as primary security and quality filter
- All reader-generated content can be hidden or removed by artist
