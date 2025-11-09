# Social Media Integration

**Created:** November 8, 2025
**Status:** Draft
**Related Specs:** 
- [Core MVP](core-mvp-spec.md) - Updates comic metadata schema
- [Enhanced Features](enhanced-features-spec.md) - Complements publishing features

## Overview
Enables automatic cross-posting of published comics to Instagram and Facebook accounts, allowing comic artists to maintain their social media presence while driving traffic to their self-hosted comic site. This feature integrates with the comic publishing workflow to automatically share content across platforms with customizable per-comic controls.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- Seamless integration with existing upload workflow eliminates double-posting effort
- Per-comic platform selection gives artists full control over social media strategy
- Automatic link-back generation drives followers from social platforms to artist's self-hosted site
- Error handling preserves comic publication even if social media posting fails
- Artist maintains ownership and control of primary content on their own domain

### Cost Impact Assessment
**Estimated cost implications:**
- Lambda execution for social media API calls: ~$0.25-0.50/month
- DynamoDB storage for integration credentials and status: ~$0.10-0.25/month
- AWS Secrets Manager for social media API credentials: ~$0.40/month per secret
- **Total monthly cost impact: $1.15-1.65**
- **Validation: Well within $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- AWS Lambda for social media API integration logic
- DynamoDB for integration configuration and posting status tracking
- AWS Secrets Manager for secure credential storage
- EventBridge for handling retry logic and scheduling
- AWS Systems Manager Parameter Store for non-sensitive configuration

### Deployment Simplicity
**Deployment approach:**
- CDK deployment includes all social media integration infrastructure
- Artist configures social media credentials via secure admin interface
- Integration activation controlled through simple configuration flags
- No manual server setup or external service configuration required

## User Stories
- As a comic artist, I want my published comics to automatically post to Instagram so that my social media followers see new content without manual effort
- As a comic artist, I want my published comics to automatically post to Facebook so that I can maintain presence across multiple platforms
- As a comic artist, I want to choose per-comic whether to post to each social platform so that I can control my social media strategy for different types of content
- As a comic artist, I want social media posts to include a link back to my comic site so that followers are directed to my self-hosted content
- As a comic artist, I want to see the status of social media posts so that I know if content was successfully shared
- As a comic artist, I want comic publication to succeed even if social media posting fails so that technical issues don't prevent content publication
- As a comic artist, I want to configure my social media accounts once and have the integration work automatically so that ongoing maintenance is minimal
- As a social media follower, I want to see the artist's comics in my Instagram/Facebook feed so that I don't miss new content
- As a social media follower, I want to easily access the full comic experience on the artist's website so that I can engage with the complete content

## Functional Requirements

### FR-1: Enhanced Comic Metadata Schema
**Description:** Extend core MVP comic metadata to include per-comic social media integration controls
**Acceptance Criteria:**
- **Extended Comic Entity Schema:**
  - Existing core attributes: `id`, `images`, `title`, `slug`, `caption`, `tags`, `happenedOnDate`, `scrollStyle`, `postedTimestamp`, `relationships`
  - **New attribute:** `integrations` (array of objects)
    - Each integration object contains:
      - `type` (string): Platform identifier (`"instagram"`, `"facebook"`)
      - `use` (boolean): Whether to post to this platform for this comic
    - Default value: `[{"type": "instagram", "use": true}, {"type": "facebook", "use": true}]`
    - Artist can modify `use` values during upload to control per-comic posting
- Integration configuration validates supported platform types and boolean values
- Backward compatibility: existing comics without `integrations` attribute use default values
- Upload interface includes integration toggle controls for each supported platform

### FR-2: Social Media Platform Configuration
**Description:** Secure credential management and platform configuration for Instagram and Facebook APIs
**Acceptance Criteria:**
- **Instagram Integration Configuration:**
  - Instagram Basic Display API integration for personal account posting
  - Secure storage of Instagram access tokens in AWS Secrets Manager
  - Support for Instagram image posting with caption text
  - Link inclusion in caption text where Instagram permits
- **Facebook Integration Configuration:**
  - Facebook Graph API integration for page or personal posting
  - Secure storage of Facebook access tokens and page IDs in AWS Secrets Manager  
  - Support for Facebook image posting with description text
  - Link inclusion in post description
- Artist configuration interface for one-time credential setup
- Token refresh handling for long-lived access tokens
- Graceful degradation when platforms are not configured or credentials expire

### FR-3: Automatic Cross-Posting Workflow
**Description:** Seamless integration with comic publishing to automatically share content across configured social platforms
**Acceptance Criteria:**
- **Publishing Workflow Integration:**
  - Social media posting triggered after successful comic publication to self-hosted site
  - Asynchronous processing ensures comic publication completes regardless of social media status
  - Per-comic integration settings respected during posting process
- **Content Mapping:**
  - Comic `caption` field used as social media post text/description
  - Comic `title` field used as post title where platform supports it (Facebook)
  - Multi-panel comics: all images posted in same order as comic display
  - Single-panel comics: single image with caption and link
- **Link-Back Generation:**
  - Automatic generation of links to specific comic pages on self-hosted site
  - Link format: `{site-domain}/comic/{slug}` included in post text where platform permits
  - Link placement optimized for each platform's display characteristics
- **Error Handling and Resilience:**
  - Comic publication succeeds even if all social media posting fails
  - Individual platform failures don't prevent posting to other platforms
  - Automatic retry mechanism for transient API failures
  - Artist notification of posting status via admin interface

### FR-4: Multi-Platform Image Handling
**Description:** Optimized image processing and posting for different social media platform requirements
**Acceptance Criteria:**
- **Instagram Image Requirements:**
  - Support for Instagram's aspect ratio requirements (1:1 to 4:5 portrait, 16:9 landscape max)
  - Multi-image posts as Instagram carousel (up to 10 images)
  - Image format conversion to platform-supported formats (JPG, PNG)
  - Image processing for platform file size limits using original images
- **Facebook Image Requirements:**  
  - Support for Facebook's image posting specifications
  - Multi-image posts as Facebook album or individual posts based on configuration
  - Optimal image sizing for Facebook display
- **Image Processing Pipeline:**
  - Automatic image processing to meet platform requirements while preserving original quality
  - Preservation of original image quality while meeting platform constraints
  - Batch processing for multi-panel comics
  - Fallback handling for images that cannot meet platform requirements

### FR-5: Integration Status Tracking and Management
**Description:** Artist-accessible interface for monitoring and managing social media integration status
**Acceptance Criteria:**
- **Status Tracking:**
  - Per-comic posting status for each configured platform
  - Status values: `pending`, `success`, `failed`, `skipped`, `disabled`
  - Timestamp tracking for posting attempts and completions
  - Error message storage for failed posting attempts
- **Artist Management Interface:**
  - View posting status for recent comics
  - Retry failed posts manually
  - Configure default integration settings for new comics
  - Enable/disable integration for specific platforms
- **Credential Management:**
  - Interface for updating expired social media credentials
  - Status indicators for credential validity
  - Test posting functionality to verify configuration

### FR-6: Platform-Specific Optimization
**Description:** Tailored posting behavior optimized for each social media platform's characteristics and best practices
**Acceptance Criteria:**
- **Instagram-Specific Features:**
  - Caption text optimized for Instagram's character limits and hashtag culture
  - Automatic hashtag generation from comic tags where appropriate
  - Link placement in Instagram bio reference when direct linking not available
  - Instagram Stories posting option for immediate engagement
- **Facebook-Specific Features:**
  - Post description optimized for Facebook's text display
  - Link preview optimization for comic page sharing
  - Facebook page posting vs personal profile posting configuration
  - Optimal posting time scheduling based on platform recommendations
- **Cross-Platform Consistency:**
  - Consistent branding and messaging across platforms
  - Unified link-back strategy driving traffic to self-hosted site
  - Artist control over platform-specific customizations

## Non-Functional Requirements

### NFR-1: Performance and Reliability
**Description:** Social media integration must not impact core comic site performance or reliability
**Acceptance Criteria:**
- Social media posting completes within 30 seconds of comic publication
- Comic publication workflow unaffected by social media API latency or failures
- Retry logic handles temporary platform outages gracefully
- Integration processing uses minimal Lambda execution time to control costs

### NFR-2: Cost Efficiency  
**Description:** Social media integration designed to minimize additional hosting costs
**Acceptance Criteria:**
- Lambda functions optimized for minimal execution time and memory usage
- API call batching where platforms support it to reduce execution costs
- Intelligent retry logic prevents excessive failed API calls
- Credential storage uses cost-effective AWS Secrets Manager pricing tier

### NFR-3: Security and Privacy
**Description:** Secure handling of social media credentials and artist data
**Acceptance Criteria:**
- Social media access tokens encrypted at rest in AWS Secrets Manager
- No sensitive credentials stored in application code or configuration
- API calls use secure HTTPS connections with proper authentication
- Artist retains full control over social media account access and permissions

### NFR-4: Constitutional Compliance Maintenance
**Description:** Integration maintains all constitutional principles while adding functionality
**Acceptance Criteria:**
- Artist workflow remains primary focus with social media as secondary benefit
- Deployment simplicity preserved with single CDK command deployment
- Cost impact stays well within constitutional $10/month target
- Serverless architecture maintained with no additional server management required

## User Scenarios & Testing

### Primary Flow: Comic with Social Media Cross-Posting
1. Artist uploads new comic through existing upload interface
2. Artist reviews default integration settings (Instagram: enabled, Facebook: enabled)
3. Artist optionally modifies integration settings for this specific comic
4. Artist publishes comic to self-hosted site
5. **Automatic:** System triggers social media posting workflow
6. **Automatic:** Comic images and caption posted to Instagram as carousel with link back
7. **Automatic:** Comic images and caption posted to Facebook with link in description
8. Artist receives confirmation of successful posting to both platforms
9. Social media followers see comic content with links directing to self-hosted site
10. Artist can view posting status in admin interface

### Alternative Flows
- **Selective Platform Posting:** Artist disables Instagram for specific comic, only Facebook posting occurs
- **Platform Failure Handling:** Instagram API fails but Facebook succeeds, comic still published with partial social media success
- **Multi-Panel Comic Optimization:** Five-panel comic automatically formatted as Instagram carousel and Facebook album
- **Credential Expiry Recovery:** Artist receives notification of expired Facebook token, updates credentials, retries failed posts
- **Link-Back Traffic:** Social media followers click through to self-hosted site, generating traffic and engagement

### Error Scenarios
- Social media API rate limiting: System queues posts for retry during next available window
- Invalid credentials: Comic publishes successfully, artist notified to update social media configuration
- Image format incompatibility: System attempts automatic conversion, falls back to text-only post if necessary
- Platform outage: Posts queued for retry, artist notified of temporary delays

## Success Criteria
Measurable outcomes aligned with constitutional principles:
- Comic publication success rate: 100% regardless of social media posting status
- Social media posting success rate: 95%+ when platforms and credentials are properly configured
- Artist workflow impact: Zero additional time required for social media posting (fully automated)
- Cross-platform traffic generation: Measurable increase in self-hosted site visits from social media links
- Cost impact: Social media integration adds less than $2/month to hosting costs
- Configuration simplicity: Artist can configure social media integration in under 10 minutes
- Deployment simplicity: Social media integration deploys with single CDK command alongside core features

## Key Entities

### Enhanced Comic Entity
- **Updated Attributes:** All existing core MVP attributes plus:
  - `integrations` (array): Per-comic social media platform controls
    - Each integration: `{type: string, use: boolean}`
    - Supported types: `"instagram"`, `"facebook"`
    - Default: Both platforms enabled for new comics

### Social Media Integration Configuration
- **Attributes:** platformType, credentialsSecretArn, isEnabled, defaultSettings, lastSuccessfulPost
- **Validation:** Required valid platform type and encrypted credentials
- **Relationships:** Associated with artist configuration

### Social Media Posting Status
- **Attributes:** comicId, platformType, status, attemptTimestamp, completionTimestamp, errorMessage, retryCount
- **Validation:** Valid status values and timestamp consistency
- **Relationships:** Links to specific comic and integration configuration

## Assumptions
- Artist has existing Instagram and Facebook accounts with API access permissions
- Artist comfortable with one-time social media app configuration process
- Social media platforms maintain current API structures and access patterns
- Artists primarily interested in driving traffic to self-hosted site rather than building platform-native presence
- Typical posting volume stays within free tier limits of social media APIs

## Out of Scope
Features explicitly excluded to maintain constitutional compliance:
- Multi-artist social media account management
- Advanced social media analytics and engagement tracking
- Automated hashtag generation or social media optimization algorithms
- Integration with additional platforms beyond Instagram and Facebook
- Social media content scheduling or delayed posting features
- Complex image editing or filter application for social media processing

## Implementation Notes

### API Integration Requirements
- **Instagram Basic Display API:** Requires Facebook Developer account and app approval for production use
- **Facebook Graph API:** Uses same Facebook Developer ecosystem as Instagram
- **Authentication Flow:** OAuth 2.0 flow for obtaining long-lived access tokens
- **Rate Limiting:** Respect platform API rate limits with appropriate backoff strategies

### Deployment Dependencies
- AWS Secrets Manager for credential storage
- Additional IAM permissions for Lambda functions to access social media APIs
- EventBridge rules for retry scheduling and error handling
- Additional DynamoDB tables for integration status tracking

### Constitutional Compliance Notes
- **Artist-First:** Integration enhances artist workflow without adding complexity to core publishing
- **Cost-Conscious:** API calls and Lambda execution optimized for minimal cost impact
- **Serverless-First:** All integration components use managed AWS services
- **Deployment Simplicity:** Complete integration deployable via existing CDK infrastructure
