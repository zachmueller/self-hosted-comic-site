# Self-Hosted Comic Site - Newsletter System

**Created:** November 8, 2025
**Status:** Draft
**Related Specs:** 
- [Reader Login System](reader-login-spec.md) - Prerequisites for reader authentication and approval
- [Enhanced Features](enhanced-features-spec.md) - Integrates with management interface
- [Core MVP](core-mvp-spec.md) - Comic publishing and display functionality

## Overview
Email newsletter system that allows comic artists to engage with their reader community through periodic newsletters and automated daily digests. The system enables artists to curate content from both published and unpublished comics, include custom commentary, and maintain regular communication with interested readers. Readers can opt-in to newsletters and daily comic notifications, with clear subscription management and privacy controls.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- Artist has complete control over newsletter content, timing, and recipient selection
- Newsletter creation interface optimized for comic curation and custom messaging
- Artists can include exclusive unpublished content to incentivize newsletter subscriptions
- Manual newsletter sending allows artists to maintain authentic voice and timing
- Integration with existing comic management workflow minimizes context switching
- Subscriber management tools help artists understand and engage their audience

### Cost Impact Assessment
**Estimated cost implications:**
- AWS SES email sending: ~$0.10 per 1,000 emails (very low cost for indie comic readership)
- Additional DynamoDB storage for subscriptions and newsletters: ~$0.25-0.50/month
- Lambda execution for email processing and daily digests: ~$0.25-0.50/month
- **Total monthly cost impact: $0.60-1.10/month for typical usage**
- **Validation: Total system cost remains well under $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- AWS SES for cost-effective email delivery with built-in bounce and complaint handling
- Lambda functions for email processing, template rendering, and daily digest generation
- DynamoDB for newsletter subscription data and email campaign tracking
- CloudWatch Events for scheduled daily digest processing
- Extends existing serverless infrastructure without additional components

### Deployment Simplicity
**Deployment approach:**
- Newsletter system deployable via existing `cdk deploy` command
- SES configuration handled automatically via CDK (requires domain verification)
- Email templates and processing logic deployed as part of standard Lambda functions
- Subscription management integrated into existing reader authentication system

## User Stories
- As a comic reader, I want to subscribe to newsletters so that I can receive curated content from my favorite artist
- As a comic reader, I want to receive daily email notifications for new comics so that I don't miss any updates
- As a comic reader, I want to manage my email preferences so that I can control what communications I receive
- As a comic reader, I want to see exclusive unpublished content in newsletters so that I have incentive to subscribe
- As a comic artist, I want to create newsletters with selected comics so that I can share curated collections with subscribers
- As a comic artist, I want to include custom commentary in newsletters so that I can provide context and connect with readers
- As a comic artist, I want to send exclusive previews to newsletter subscribers so that I can reward engaged readers
- As a comic artist, I want automated daily digests for new publications so that subscribers stay updated without manual work
- As a comic artist, I want to see newsletter analytics so that I can understand subscriber engagement

## Functional Requirements

### FR-N1: Reader Newsletter Subscription Management
**Description:** Reader-controlled subscription system integrated with account creation and management
**Acceptance Criteria:**
- **Subscription Preferences Entity:**
  - `readerId` (string): Reader account identifier
  - `newsletterSubscribed` (boolean): Opt-in status for periodic newsletters
  - `dailyDigestSubscribed` (boolean): Opt-in status for daily comic notifications
  - `subscriptionDate` (timestamp): When reader first subscribed
  - `lastUpdated` (timestamp): Most recent preference change
  - `emailPreferences` (object): Detailed email preferences and frequency
- Newsletter subscription options presented during reader account creation with clear value proposition
- Toast notification during signup highlighting newsletter benefits (exclusive content, updates)
- Subscription preferences accessible through reader account settings interface
- One-click unsubscribe functionality in all newsletter emails
- Double opt-in verification for new subscriptions to ensure email deliverability
- Subscription status synced with reader account approval (pending readers can subscribe but don't receive content until approved)

### FR-N2: Artist Newsletter Creation Interface
**Description:** Artist-focused interface for creating and sending curated newsletters
**Acceptance Criteria:**
- **Newsletter Entity:**
  - `newsletterId` (string): Unique newsletter identifier
  - `artistId` (string): Creating artist identifier
  - `title` (string): Newsletter subject line
  - `customContent` (string): Artist's written commentary/message
  - `selectedComics` (array): Comic IDs to include in newsletter
  - `includesUnpublished` (boolean): Whether newsletter contains exclusive content
  - `status` (string): 'draft', 'sent', 'scheduled'
  - `createdDate` (timestamp): Newsletter creation date
  - `sentDate` (timestamp, optional): When newsletter was sent
  - `recipientCount` (number, optional): Number of recipients when sent
- Newsletter creation interface accessible from artist management dashboard
- Comic selection interface allows browsing both published and unpublished comics
- Visual comic thumbnails with metadata for easy artist selection
- Preview functionality shows newsletter appearance before sending
- Draft saving enables multi-session newsletter creation
- Send confirmation with recipient count and delivery estimation
- Archive of sent newsletters for artist reference and subscriber access

### FR-N3: Daily Digest Automation System
**Description:** Automated email system for newly published comics with intelligent batching
**Acceptance Criteria:**
- **Daily Digest Processing Rules:**
  - Automated daily scan for comics published in previous 24 hours
  - Single daily email per subscriber maximum (no multiple emails per day)
  - Comics published on same day combined into single digest email
  - Maximum 5 comics per digest (ordered by earliest publication timestamp)
  - Digest processing scheduled for consistent daily time (configurable by artist)
- **Digest Email Content:**
  - Subject line indicates number of new comics and date range
  - Each comic includes thumbnail, title, caption preview, and direct link
  - Unsubscribe and preference management links in every digest
  - Artist branding and custom footer message (configurable)
- Digest only sent to approved readers with dailyDigestSubscribed preference enabled
- No digest sent on days with zero new publications
- Processing uses scheduled Lambda function with CloudWatch Events trigger
- Digest delivery tracking and basic analytics (open rates, unsubscribes)

### FR-N4: Exclusive Content and Preview System
**Description:** Capability for artists to include unpublished comics in newsletters for subscriber exclusivity
**Acceptance Criteria:**
- Newsletter creation interface clearly distinguishes published vs. unpublished comics
- Artists can select unpublished comics for newsletter inclusion with clear "exclusive content" labeling
- Newsletter recipients receive special access to unpublished comic content via secure, time-limited URLs
- Exclusive content access limited to newsletter recipients and expires after reasonable timeframe (7-14 days)
- Clear messaging to readers about exclusive content value and limited availability
- Analytics tracking for exclusive content engagement (views, time spent)
- Exclusive content does not appear in regular comic browsing until officially published
- Artists can preview exclusive content rendering in newsletter before sending

### FR-N5: Email Template System and Delivery
**Description:** Professional email templates and reliable delivery infrastructure
**Acceptance Criteria:**
- **Email Template Components:**
  - Artist branding customization (logo, colors, footer content)
  - Responsive design optimized for mobile and desktop email clients
  - Comic display templates with thumbnail, title, caption, and action buttons
  - Newsletter-specific templates supporting custom content and multiple comics
  - Daily digest templates optimized for batch comic presentation
- AWS SES integration with domain authentication for improved deliverability
- Bounce and complaint handling with automatic unsubscribe for invalid emails
- Delivery status tracking (sent, delivered, bounced, complained)
- Rate limiting to comply with SES sending limits and avoid spam classification
- Fallback text versions for all HTML email templates
- Email personalization with reader name and subscription preferences

### FR-N6: Subscription Analytics and Management
**Description:** Artist tools for understanding newsletter performance and subscriber engagement
**Acceptance Criteria:**
- **Newsletter Analytics Dashboard:**
  - Subscriber growth tracking over time
  - Newsletter open rates and click-through rates
  - Most popular comic content in newsletters
  - Unsubscribe rates and feedback collection
  - Daily digest engagement metrics
- **Subscriber Management Tools:**
  - List of all subscribers with subscription date and preferences
  - Bulk operations for subscriber communication
  - Export functionality for subscriber data (CSV format)
  - Segmentation options for targeted newsletter sending
- Analytics integrated into existing artist management interface
- Privacy-compliant data collection with reader consent
- Cost-conscious analytics using DynamoDB queries and basic SES metrics
- Mobile-optimized dashboard for artist convenience

### FR-N7: Reader Newsletter Experience
**Description:** Reader-facing interfaces for newsletter interaction and management
**Acceptance Criteria:**
- **Newsletter Signup Flow:**
  - Clear value proposition during account creation (exclusive content, updates)
  - Toast notification highlighting newsletter benefits without being intrusive
  - Immediate confirmation email with preference management links
  - Option to subscribe during comic browsing with context-appropriate prompts
- **Newsletter Email Experience:**
  - Professional appearance consistent with artist branding
  - Easy comic access with direct links to site content
  - Clear unsubscribe and preference management options
  - Mobile-optimized layout for smartphone email reading
- **Preference Management Interface:**
  - Simple toggle controls for newsletter and daily digest subscriptions
  - Frequency preferences where applicable
  - Immediate effect of preference changes with confirmation
  - Access from both email links and account settings

## Non-Functional Requirements

### NFR-N1: Email Deliverability and Compliance
**Description:** Newsletter system must maintain high deliverability rates and comply with email regulations
**Acceptance Criteria:**
- SES domain authentication (SPF, DKIM, DMARC) configured automatically via CDK
- Bounce rate maintained below 5% through list hygiene and validation
- Complaint rate maintained below 0.1% through quality content and easy unsubscribe
- CAN-SPAM compliance with clear sender identification and unsubscribe mechanisms
- Double opt-in for new subscriptions to ensure consent and reduce spam reports
- Automatic handling of bounces and complaints with subscriber list updates

### NFR-N2: Performance and Cost Efficiency
**Description:** Newsletter processing optimized for cost-conscious operation and reasonable performance
**Acceptance Criteria:**
- Newsletter sending completes within 15 minutes for typical subscriber lists (500-1000 readers)
- Daily digest processing completes within 5 minutes of scheduled trigger time
- Email template rendering optimized for minimal Lambda execution time
- SES costs remain under $1/month for typical indie comic site usage patterns
- Subscriber data queries designed for cost-effective DynamoDB usage
- Image thumbnails in emails served from existing CDN infrastructure

### NFR-N3: Reliability and Error Handling
**Description:** Robust newsletter system behavior with graceful failure handling
**Acceptance Criteria:**
- Failed email sends automatically retried up to 3 times with exponential backoff
- System gracefully handles SES rate limits and service interruptions
- Newsletter creation preserves all data during system failures or network issues
- Daily digest processing continues despite individual email failures
- Subscriber preference changes take effect immediately with proper validation
- Comprehensive logging for troubleshooting delivery issues

## User Scenarios & Testing

### Newsletter Subscription Flow
1. New reader creates account on comic site and sees onboarding toast about newsletter benefits
2. Reader opts into newsletter during account creation with clear understanding of exclusive content value
3. Reader receives confirmation email and clicks to verify subscription
4. Reader's first newsletter arrives with curated comics and artist commentary
5. Reader enjoys exclusive unpublished preview included in newsletter
6. Reader uses preference management link to adjust subscription frequency

### Artist Newsletter Creation Flow
1. Artist accesses newsletter creation from management dashboard
2. Artist selects mix of recently published comics and exclusive unpublished preview
3. Artist writes custom commentary explaining comic selection and current projects
4. Artist previews newsletter appearance and makes final adjustments
5. Artist sends newsletter to subscribers and receives delivery confirmation
6. Artist reviews engagement analytics to understand reader response

### Daily Digest Automation Flow
1. Artist publishes 3 new comics throughout the day at different times
2. Daily digest system detects new publications during scheduled evening processing
3. System generates single digest email combining all 3 comics
4. Digest sent to subscribers who opted in for daily notifications
5. Readers receive consolidated update rather than multiple separate emails
6. System tracks digest performance and updates subscriber engagement metrics

### Exclusive Content Access Flow
1. Newsletter subscriber receives email containing exclusive unpublished comic preview
2. Reader clicks to view exclusive content and accesses special preview page
3. Preview page displays unpublished comic with clear "exclusive to newsletter" messaging
4. Reader enjoys early access to content before general publication
5. Exclusive access expires after set timeframe, encouraging timely engagement
6. Comic later publishes normally with readers having context from newsletter preview

## Success Criteria
- Newsletter subscription rate of 20%+ among approved readers
- Daily digest automation reduces artist workload while maintaining subscriber engagement
- Email deliverability rate above 95% with bounce rate below 5%
- Newsletter creation workflow completable in under 15 minutes including content selection
- Exclusive content feature drives measurable increase in newsletter subscriptions
- System costs remain under $1.10/month for typical usage patterns
- Reader preference management achieves 95%+ success rate for subscription changes

## Key Entities

### Newsletter Subscription Entity
- **Attributes:**
  - `readerId` (string): Reader account identifier (FK to reader accounts)
  - `newsletterSubscribed` (boolean): Periodic newsletter opt-in status
  - `dailyDigestSubscribed` (boolean): Daily update opt-in status
  - `subscriptionDate` (timestamp): Initial subscription timestamp
  - `lastUpdated` (timestamp): Most recent preference change
  - `emailVerified` (boolean): Double opt-in verification status
  - `unsubscribeToken` (string): Unique token for one-click unsubscribe
- **Primary Key:** readerId
- **Validation:** Subscription preferences must be boolean, dates must be valid timestamps
- **Relationships:** Belongs to reader account, associated with newsletter delivery records

### Newsletter Entity
- **Attributes:**
  - `newsletterId` (string): Unique newsletter identifier (UUID)
  - `artistId` (string): Creating artist identifier
  - `title` (string): Newsletter subject line (max 200 characters)
  - `customContent` (string): Artist commentary (max 5000 characters)
  - `selectedComics` (array): Array of comic IDs to include
  - `includesUnpublished` (boolean): Contains exclusive content flag
  - `status` (string): 'draft', 'sent', 'scheduled'
  - `createdDate` (timestamp): Newsletter creation timestamp
  - `sentDate` (timestamp, optional): Delivery timestamp
  - `recipientCount` (number, optional): Actual recipient count
  - `templateData` (object): Rendered template data for email
- **Primary Key:** newsletterId
- **Validation:** Title and custom content within character limits, selectedComics must be valid comic IDs
- **Relationships:** Created by artist, references multiple comics, has delivery records

### Daily Digest Record Entity
- **Attributes:**
  - `digestDate` (string): Date of digest (YYYY-MM-DD format)
  - `comicsIncluded` (array): Comic IDs included in digest
  - `recipientCount` (number): Number of subscribers who received digest
  - `processedTimestamp` (timestamp): When digest was generated and sent
  - `status` (string): 'processed', 'skipped', 'failed'
- **Primary Key:** digestDate
- **Validation:** Date must be valid format, status must be valid enum
- **Relationships:** References comics included in digest

### Email Delivery Record Entity
- **Attributes:**
  - `deliveryId` (string): Unique delivery record identifier
  - `readerId` (string): Recipient reader identifier
  - `emailType` (string): 'newsletter', 'daily_digest', 'confirmation'
  - `newsletterId` (string, optional): Source newsletter if applicable
  - `sentTimestamp` (timestamp): When email was sent
  - `deliveryStatus` (string): 'sent', 'delivered', 'bounced', 'complained'
  - `sesMessageId` (string): AWS SES message identifier for tracking
- **Primary Key:** deliveryId
- **Validation:** Email type must be valid enum, delivery status must be valid enum
- **Relationships:** Associated with reader and optionally with specific newsletter

## Integration Points

### Reader Login System Integration
- Newsletter subscription options integrated into reader account creation flow
- Subscription preferences managed through existing reader account settings
- Newsletter access restricted to approved readers only
- Unsubscribe functionality updates reader account preferences

### Enhanced Features Integration
- Newsletter creation interface accessible from artist management dashboard
- Newsletter analytics included in artist engagement metrics
- Exclusive content management integrated with publish status controls
- Newsletter subscriber data included in bulk export operations

### Core MVP Integration
- Newsletter content selection uses existing comic browsing and filtering
- Comic thumbnails and metadata reused from existing image optimization
- Newsletter emails link back to individual comic pages on site
- Daily digest automation triggered by comic publication events

## Technical Architecture

### Email Processing Pipeline
- Newsletter composition and sending handled by Lambda functions
- SES integration with automatic bounce and complaint processing
- Email template rendering using server-side template engine
- Image optimization for email thumbnails using existing CDN infrastructure

### Subscription Management
- DynamoDB storage for subscription preferences with efficient querying
- Real-time subscription updates with immediate preference application
- Secure unsubscribe tokens to prevent unauthorized subscription changes
- Integration with Cognito user management for account lifecycle

### Daily Digest Automation
- CloudWatch Events trigger daily processing Lambda function
- Comic publication detection through DynamoDB change streams or scheduled queries
- Intelligent batching logic to combine multiple comics into single email
- Error handling and retry logic for failed digest processing

## Out of Scope
- Advanced email marketing features (A/B testing, advanced segmentation, etc.)
- Integration with external email marketing platforms
- Advanced analytics requiring third-party services
- Social media integration or cross-platform content syndication
- Complex email automation workflows beyond basic daily digests
- Multi-language email templates or internationalization
- Advanced personalization beyond basic reader name inclusion

## Dependencies
- **Required:** Reader Login System must be implemented for subscription management
- **Required:** Core MVP functionality for comic content and metadata
- **Recommended:** Enhanced Features management interface for optimal newsletter creation experience
- **Infrastructure:** AWS SES setup and domain verification (documented process)
- **Configuration:** Email templates and branding customization via artist preferences

## Security and Privacy Considerations
- Newsletter subscriber data encrypted at rest and in transit
- Unsubscribe tokens cryptographically secure to prevent tampering
- Email content sanitization to prevent injection attacks
- Compliance with email privacy regulations (CAN-SPAM, GDPR considerations)
- Secure handling of exclusive content URLs with time-limited access
- Audit trail for newsletter sending and subscriber management actions

## Implementation Notes

### Constitutional Compliance Validation
- **Artist-First Design:** All newsletter features prioritize artist control and workflow efficiency over automated marketing features
- **Cost-Conscious Implementation:** AWS SES chosen for extremely low cost per email, DynamoDB usage optimized for minimal charges
- **Serverless Architecture:** Complete implementation using Lambda, SES, DynamoDB, and CloudWatch without additional infrastructure
- **Deployment Simplicity:** Full newsletter system deployable via CDK with minimal manual SES configuration

### Email Deliverability Best Practices
- Domain authentication setup automated through CDK deployment
- List hygiene practices built into subscription management
- Content quality guidelines integrated into newsletter creation interface
- Monitoring and alerting for deliverability metrics through CloudWatch

### Performance Optimization
- Email template caching to reduce Lambda execution time
- Batch processing for large subscriber lists to manage SES rate limits
- Optimized database queries for subscription management and analytics
- CDN utilization for email images to reduce costs and improve loading times
