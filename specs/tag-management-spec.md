# Self-Hosted Comic Site - Tag Management

**Created:** November 8, 2025
**Status:** Draft
**Derived From:** Original monolithic comic site specification (refactored November 2025)
**Related Specs:** 
- [Core MVP](core-mvp-spec.md) - Prerequisites
- [Raw Sketches](raw-sketches-spec.md) 
- [Enhanced Features](enhanced-features-spec.md)

## Overview
Comprehensive tag management functionality that extends the base tag system to provide enhanced metadata and organization capabilities. This includes both regular tags and series (which are special types of tags) with proper ordering, navigation, and display metadata. This builds upon the Core MVP's tag functionality to enable artists to organize and present their comics with rich categorization while maintaining the same underlying technical architecture.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- Tag management integrated into existing workflow (no separate complex interface)
- Simple metadata enhancement system allows artists to add names, captions, and ordering to tags
- Automatic tag ordering based on comic publication dates reduces manual management
- Series designation maintains artist's intended reading order
- Rich tag presentation improves reader experience without complicating artist workflow

### Cost Impact Assessment
**Estimated cost implications:**
- No additional AWS services required - uses existing DynamoDB and Lambda infrastructure
- Minimal additional storage for tag metadata (name, caption, order)
- **Total monthly cost impact: <$0.10**
- **Validation: Well within $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- Extends existing DynamoDB schema with tag metadata
- Uses existing Lambda functions with enhanced logic
- No additional infrastructure components required

### Deployment Simplicity
**Deployment approach:**
- Enhanced tag functionality deployable via existing `cdk deploy` command
- Database schema update handled automatically via CDK
- No manual migration steps required

## User Stories
- As a comic artist, I want to add display names and descriptions to my tags so that readers better understand the categorization
- As a comic artist, I want to control whether tag pages show comics in chronological or reverse-chronological order
- As a comic artist, I want to organize related comics into series so that readers can follow story arcs chronologically
- As a comic artist, I want to flag existing tags as series without recreating content organization
- As a comic reader, I want to see meaningful tag names and descriptions when browsing categories
- As a comic reader, I want to browse comics within tags/series in the artist's intended order
- As a comic reader, I want to see series grouped separately from regular tags in navigation

## Functional Requirements

### FR-T1: Enhanced Tag Metadata System
**Description:** Extension of existing tag system to support rich metadata for display and organization
**Acceptance Criteria:**
- Artists can add a **Name** field to any tag for display as title on tag list pages (e.g., `/tags/{tag}/`)
- Artists can add a **Caption** field to any tag for display as description below title on tag list pages
- Artists can set an **Order** field (reverse-chronological or forward-chronological) to control comic sorting within tag
- **Default Order:** All tags default to reverse-chronological order based on `happenedOnDate`
- Tag metadata stored as tag attributes within existing DynamoDB structure
- Tags without custom Name use the tag key as display name
- Tags without custom Caption display no description
- Enhanced metadata can be added/removed without affecting comic associations or URLs

### FR-T2: Series Tag Extension System
**Description:** Extension of tag metadata system to support series designation and management
**Acceptance Criteria:**
- Artists can flag any existing tag as a "series" through management interface
- Series-flagged tags function identically to regular tags for comic association and URL rendering
- Series inherit all tag metadata capabilities (Name, Caption, Order)
- Series flags can be added/removed without affecting comic relationships and URLs
- Tag-to-series conversion preserves all existing comic associations and URLs

### FR-T3: Enhanced Navigation Interface
**Description:** Enhanced navigation that distinguishes between series and regular tags with proper metadata display
**Acceptance Criteria:**
- Navigation interface groups tags into two sections: "Series" and "Tags"
- Series-flagged tags appear under "Series" header with chronological comic count
- **Series List Ordering:** All series ordered reverse-chronologically based on the most recent `happenedOn` date from comics within each series
- Regular tags appear under "Tags" header with standard functionality
- Each tag appears in only one navigation section (either Series or Tags, never both)
- Tag display shows custom Name (if set) or falls back to tag key
- Series display shows comic count and latest publication date
- Series with more recent comics appear higher in the series list

### FR-T4: Tag-Specific Comic Ordering
**Description:** Configurable chronological ordering of comics within tags based on happenedOnDate and Order metadata
**Acceptance Criteria:**
- Comics within a tag automatically ordered by `happenedOnDate` according to tag's Order setting
- **Reverse-chronological order (default):** Most recent `happenedOnDate` appears first
- **Forward-chronological order:** Earliest `happenedOnDate` appears first
- Tag ordering calculation performed at query time using existing DynamoDB capabilities
- **Implementation Note:** Tag ordering within DynamoDB requires further architectural debate to determine optimal approach (GSI vs. query patterns)
- Tag order maintained consistently across all browsing contexts (homepage filtering, tag pages, individual comic navigation)

### FR-T5: Tag-Specific URL Structure and Display
**Description:** URL routing and display that utilizes enhanced tag metadata while maintaining existing architecture
**Acceptance Criteria:**
- Tag URLs maintain same pattern: `/tags/{tag-key}/` (using original tag key, not display Name)
- Tag list pages display custom Name as title if set, otherwise use tag key
- Tag list pages display custom Caption below title if set
- Individual comics accessible via tag context maintain tag-filtered URL structure
- Tag-based next/previous navigation respects tag's Order setting (reverse or forward chronological)
- Direct comic URLs (`/comic/{slug}`) remain unchanged and functional

### FR-T6: Tag Context Navigation
**Description:** Enhanced comic navigation that respects tag-specific chronological ordering
**Acceptance Criteria:**
- When browsing comics via tag context, next/previous buttons follow tag's Order setting
- Tag-filtered URLs maintain browsing context for reader navigation
- Comics belonging to multiple tags maintain separate navigation contexts
- Tag navigation shows position within tag (e.g., "Comic 3 of 15 in Tag Name")
- Related comics suggestions prioritize other comics from same tag
- Series navigation functions identically to tag navigation but with series-specific context

## Non-Functional Requirements

### NFR-T1: Performance with Enhanced Tags
**Description:** Performance requirements that maintain MVP targets with enhanced tag functionality
**Acceptance Criteria:**
- Tag browsing pages load in under 3 seconds with metadata display
- Tag navigation queries complete within existing 2-second pagination target
- Homepage tag filtering performs within existing performance constraints
- DynamoDB query patterns for tag ordering remain cost-effective

### NFR-T2: Backward Compatibility
**Description:** Enhanced tag functionality must not break existing MVP functionality
**Acceptance Criteria:**
- Existing tag-based URLs continue to function without modification
- Comics without enhanced tag metadata display and navigate normally using defaults
- Tag system performance unaffected by metadata extensions
- Existing comic metadata remains valid and functional

## User Scenarios & Testing

### Primary Tag Enhancement Flow
1. Artist uploads several comics using existing tag system (e.g., tag: "origin-story")
2. Artist accesses management interface and enhances tag with:
   - Name: "Origin Story Arc"
   - Caption: "How our hero discovered their powers"
   - Order: Forward-chronological (for proper story sequence)
3. Tag automatically orders comics by happenedOnDate in forward-chronological order
4. Readers see "Origin Story Arc" title and description on `/tags/origin-story/` page
5. Navigation respects forward-chronological ordering for proper story flow

### Series Management Flow
1. Artist enhances tag as above, then flags "origin-story" tag as a series
2. Series appears under "Series" section in navigation, no longer under "Tags"
3. Series inherits all tag metadata (Name, Caption, Order)
4. Readers can browse "Origin Story Arc" series with chronological navigation
5. Series context maintained throughout browsing session

### Tag Metadata Migration Flow
1. Artist has existing tags without metadata
2. Tag pages display using tag key as title, no caption
3. Comics within tags default to reverse-chronological order
4. Artist can gradually enhance tags with metadata as needed
5. Enhanced tags immediately benefit from improved display and navigation

## Success Criteria
- Tag metadata enhancement completable in under 2 minutes via management interface
- Tag browsing maintains same performance as current tag browsing
- Tag navigation preserves configured order (reverse/forward chronological) across all contexts
- Zero impact on existing tag functionality and URLs
- Enhanced tag functionality deployable without service interruption
- Series creation and management completable in under 2 minutes via tag enhancement + series flagging

## Key Entities

### Enhanced Tag Entity
- **Core Attributes (existing):** `tagKey` (string): Original tag identifier used in URLs and associations
- **New Metadata Attributes:** 
  - `name` (string, optional): Display name for tag pages and navigation (falls back to tagKey if not set)
  - `caption` (string, optional): Brief description displayed below name on tag list pages
  - `order` (enum): "reverse-chronological" | "forward-chronological" (defaults to "reverse-chronological")
  - `isSeries` (boolean): Flag indicating if tag represents a series (defaults to false)
  - `seriesCreatedDate` (timestamp, optional): When tag was flagged as series
- **Validation:** All metadata can be modified without affecting comic associations or URLs
- **Relationships:** Same as existing tag relationships, with enhanced ordering and display logic

### Tag Metadata (Computed)
- **Attributes:** comicCount, chronologicalOrder, latestComicDate, earliestComicDate, displayName, hasCaption
- **Validation:** Computed at query time from associated comics and tag metadata
- **Relationships:** Derived from comics sharing the tag and tag's metadata settings

## Implementation Notes

### Technical Architecture Decisions
- Enhanced tags implemented as additional tag attributes to maintain existing URL structure and data relationships
- Tag ordering requires DynamoDB architectural discussion for optimal query patterns
- No new AWS services required - extends existing DynamoDB and Lambda infrastructure
- Enhanced tag functionality backward-compatible with all existing MVP features
- Series functionality implemented as subset of enhanced tag functionality

### Tag Display Logic
- **Name Display:** Use tag.name if set, otherwise use tag.tagKey
- **Caption Display:** Show tag.caption if set, otherwise display nothing
- **Order Logic:** Use tag.order setting ("reverse-chronological" or "forward-chronological") to determine comic sorting
- **Navigation Grouping:** Show series-flagged tags under "Series", all others under "Tags"

### URL and Routing Consistency
- All tag URLs continue to use original tagKey: `/tags/{tagKey}/`
- Display names only affect visual presentation, not URL structure
- This ensures existing bookmarks and links remain functional
- SEO and sharing URLs remain stable regardless of Name changes

## Out of Scope
- Manual tag/series ordering (automatic happenedOnDate ordering only)
- Complex tag relationships (hierarchical tags, tag dependencies)
- Tag-specific styling or themes beyond Name and Caption
- Advanced tag analytics or statistics
- Cross-tag navigation or recommendations
- Tag aliases or redirects

## Dependencies
- **Required:** Core MVP functionality must be implemented first
- **Database:** Extends existing DynamoDB schema with tag metadata
- **API:** Enhances existing tag-based API endpoints with metadata support
- **UI:** Builds upon existing tag browsing interface with metadata display

## Migration Strategy
- Existing tags automatically gain default metadata (no Name/Caption, reverse-chronological order)
- Artists can enhance tags incrementally without affecting existing functionality
- No data migration required - new metadata fields are optional
- Graceful fallbacks ensure compatibility with tags lacking enhanced metadata
