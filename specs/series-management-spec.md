# Self-Hosted Comic Site - Series Management

**Created:** November 8, 2025
**Status:** Draft
**Derived From:** Original monolithic comic site specification (refactored November 2025)
**Related Specs:** 
- [Core MVP](core-mvp-spec.md) - Prerequisites
- [Raw Sketches](raw-sketches-spec.md) 
- [Enhanced Features](enhanced-features-spec.md)

## Overview
Series management functionality that extends the base tag system to provide organized comic series with proper ordering and navigation. This builds upon the Core MVP's tag functionality to enable artists to group related comics into series while maintaining the same underlying technical architecture.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- Series management integrated into existing tag workflow (no separate complex interface)
- Simple series flagging system allows artists to designate which tags represent series
- Automatic series ordering based on comic publication dates reduces manual management
- Series navigation maintains artist's intended reading order

### Cost Impact Assessment
**Estimated cost implications:**
- No additional AWS services required - uses existing DynamoDB and Lambda infrastructure
- Minimal additional storage for series metadata flags
- **Total monthly cost impact: <$0.10**
- **Validation: Well within $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- Extends existing DynamoDB schema with series flags
- Uses existing Lambda functions with enhanced logic
- No additional infrastructure components required

### Deployment Simplicity
**Deployment approach:**
- Series functionality deployable via existing `cdk deploy` command
- Database schema update handled automatically via CDK
- No manual migration steps required

## User Stories
- As a comic artist, I want to organize related comics into series so that readers can follow story arcs chronologically
- As a comic artist, I want to flag existing tags as series without recreating content organization
- As a comic artist, I want series to automatically order by publication date so I don't need manual ordering
- As a comic reader, I want to browse comics within a series in chronological order
- As a comic reader, I want to see series grouped separately from regular tags in navigation
- As a comic reader, I want next/previous navigation within series to follow the intended reading order

## Functional Requirements

### FR-S1: Series Tag Extension System
**Description:** Extension of existing tag system to support series designation and management
**Acceptance Criteria:**
- Artists can flag any existing tag as a "series" through management interface
- Series-flagged tags function identically to regular tags for comic association and URL rendering
- Series metadata stored as tag attributes within existing DynamoDB structure
- Series flags can be added/removed without affecting comic associations
- Tag-to-series conversion preserves all existing comic relationships and URLs

### FR-S2: Series Navigation Interface
**Description:** Enhanced navigation that distinguishes between series and regular tags with reverse-chronological series ordering
**Acceptance Criteria:**
- Navigation interface groups tags into two sections: "Series" and "Tags"
- Series-flagged tags appear under "Series" header with chronological comic count
- **Series List Ordering:** All series ordered reverse-chronologically based on the most recent `happenedOn` date from comics within each series
- Regular tags appear under "Tags" header with standard functionality
- Each tag appears in only one navigation section (either Series or Tags, never both)
- Series display shows comic count and latest publication date
- Series with more recent comics appear higher in the series list

### FR-S3: Series-Based Comic Ordering
**Description:** Automatic chronological ordering of comics within series based on happenedOnDate
**Acceptance Criteria:**
- Comics within a series automatically ordered by `happenedOnDate` (ascending for chronological reading)
- Series ordering calculation performed at query time using existing DynamoDB capabilities
- **Implementation Note:** Series ordering within DynamoDB requires further architectural debate to determine optimal approach (GSI vs. query patterns)
- Series order maintained consistently across all browsing contexts (homepage filtering, series pages, individual comic navigation)

### FR-S4: Series-Specific URL Structure
**Description:** URL routing that maintains series context while using existing tag-based architecture
**Acceptance Criteria:**
- Series URLs use same pattern as tag URLs: `/tags/{series-name}/{slug}`
- Series browsing pages function identically to tag filtering pages
- Individual comics accessible via series context maintain tag-filtered URL structure
- Series-based next/previous navigation preserves chronological order within series
- Direct comic URLs (`/comic/{slug}`) remain unchanged and functional

### FR-S5: Series Context Navigation
**Description:** Enhanced comic navigation that respects series chronological ordering
**Acceptance Criteria:**
- When browsing comics via series context, next/previous buttons follow chronological series order
- Series-filtered URLs maintain browsing context for reader navigation
- Comics belonging to multiple series maintain separate navigation contexts
- Series navigation shows position within series (e.g., "Comic 3 of 15 in Series Name")
- Related comics suggestions prioritize other comics from same series

## Non-Functional Requirements

### NFR-S1: Performance with Series
**Description:** Performance requirements that maintain MVP targets with series functionality
**Acceptance Criteria:**
- Series browsing pages load in under 3 seconds (same as tag browsing)
- Series navigation queries complete within existing 2-second pagination target
- Homepage series filtering performs within existing performance constraints
- DynamoDB query patterns for series ordering remain cost-effective

### NFR-S2: Backward Compatibility
**Description:** Series functionality must not break existing MVP functionality
**Acceptance Criteria:**
- Existing tag-based URLs continue to function without modification
- Comics without series associations display and navigate normally
- Tag system performance unaffected by series extensions
- Existing comic metadata remains valid and functional

## User Scenarios & Testing

### Primary Series Management Flow
1. Artist uploads several related comics using existing tag system (e.g., tag: "origin-story")
2. Artist accesses management interface and flags "origin-story" tag as a series
3. Series automatically orders comics by happenedOnDate
4. Readers can now browse "origin-story" as a series with chronological navigation
5. Series appears under "Series" section in navigation, no longer under "Tags"

### Series Navigation Flow
1. Reader visits homepage and sees series listed separately from tags
2. Reader clicks on a series name to browse series chronologically
3. Reader navigates through series using next/previous buttons in intended order
4. Reader can access individual comics via `/tags/{series-name}/{slug}` URLs
5. Series context maintained throughout browsing session

## Success Criteria
- Series creation and management completable in under 2 minutes via tag flagging
- Series browsing maintains same performance as regular tag browsing
- Series navigation preserves chronological order across all contexts
- Zero impact on existing tag functionality and URLs
- Series functionality deployable without service interruption

## Key Entities

### Series Extension to Tag Entity
- **Additional Attributes:** 
  - `isSeries` (boolean): Flag indicating if tag represents a series
  - `seriesDescription` (string, optional): Series-specific description
  - `seriesCreatedDate` (timestamp): When tag was flagged as series
- **Validation:** Series flag can be toggled without affecting comic associations
- **Relationships:** Same as existing tag relationships, with enhanced ordering logic

### Series Metadata (Computed)
- **Attributes:** comicCount, chronologicalOrder, latestComicDate, earliestComicDate
- **Validation:** Computed at query time from associated comics
- **Relationships:** Derived from comics sharing the series-flagged tag

## Implementation Notes

### Technical Architecture Decisions
- Series implemented as tag attributes to maintain existing URL structure and data relationships
- Series ordering requires DynamoDB architectural discussion for optimal query patterns
- No new AWS services required - extends existing DynamoDB and Lambda infrastructure
- Series functionality backward-compatible with all existing MVP features

### Clarifications from Original Spec
- Series ordering: Automatic ordering based on 'happened on' date within the series
- Series navigation: Functions identically to tag-based browsing with enhanced chronological order
- Series UI: Navigation groups series-flagged tags under "Series" header, regular tags under "Tags"
- Series URLs: Use existing tag URL pattern `/tags/{series-name}/{slug}` for consistency

## Out of Scope
- Manual series ordering (automatic happenedOnDate ordering only)
- Complex series relationships (series of series, sub-series)
- Series-specific metadata beyond basic description
- Advanced series analytics or statistics
- Cross-series navigation or recommendations

## Dependencies
- **Required:** Core MVP functionality must be implemented first
- **Database:** Extends existing DynamoDB schema
- **API:** Enhances existing tag-based API endpoints
- **UI:** Builds upon existing tag browsing interface
