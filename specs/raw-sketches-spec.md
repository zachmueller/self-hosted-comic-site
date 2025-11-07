# Self-Hosted Comic Site - Raw Sketches

**Created:** November 8, 2025
**Status:** Draft
**Derived From:** specs/1-cdk-comic-site/spec.md
**Related Specs:** 
- [Core MVP](core-mvp-spec.md) - Prerequisites
- [Series Management](series-management-spec.md) 
- [Enhanced Features](enhanced-features-spec.md)

## Overview
Raw sketch functionality that allows artists to upload sketch versions of their comics alongside final versions, with a global toggle system for readers to switch between viewing modes. This feature enables artists to share their creative process while maintaining the primary focus on finished comics.

## Constitutional Alignment

### Artist-First User Experience
**How this feature prioritizes the comic artist's workflow:**
- Raw sketch upload integrated into existing upload workflow (same form, separate field)
- Artist retains control over what sketch content to share with readers
- Sketch upload optional - artists can publish with final images only, sketches only, or both
- Artist workflow prioritized over reader sketch viewing experience

### Cost Impact Assessment
**Estimated cost implications:**
- Additional S3 storage for sketch images: ~$1-2/month (depending on volume)
- Minimal additional Lambda processing for sketch handling
- No additional AWS services required
- **Total monthly cost impact: $1-2**
- **Validation: Well within $10/month constitutional target**

### Serverless Architecture Compliance
**Serverless services utilized:**
- Uses existing S3 storage with separate sketch image keys
- Extends existing Lambda functions for sketch processing
- Leverages existing DynamoDB schema with sketch metadata fields
- No additional infrastructure components required

### Deployment Simplicity
**Deployment approach:**
- Sketch functionality deployable via existing `cdk deploy` command
- Database schema update handled automatically via CDK
- No manual configuration steps required

## User Stories
- As a comic artist, I want to upload raw sketches alongside my final comics so that readers can see my creative process
- As a comic artist, I want to publish comics with only sketches when I haven't finished the final version
- As a comic artist, I want the sketch upload to be part of the same workflow as final image upload
- As a comic reader, I want to toggle between final comics and raw sketches site-wide to explore the artist's process
- As a comic reader, I want my toggle preference to persist across browsing sessions
- As a comic reader, I want to see sketch-only comics even when toggled to "final" mode since no final version exists

## Functional Requirements

### FR-R1: Raw Sketch Upload Integration
**Description:** Sketch upload functionality integrated into existing comic upload workflow
**Acceptance Criteria:**
- Separate 'Raw Sketches' upload field in same form as final comic images
- Drag-and-drop file upload supports sketch images in JPG, PNG, and WebP formats
- File size validation enforces 20MB maximum per sketch image with clear error messaging
- Comics can be published with only raw sketches, only final images, or both
- Sketch upload validates same image format restrictions as final images
- Sketch images stored with separate S3 key pattern to distinguish from final images

### FR-R2: Extended Comic Metadata for Sketches
**Description:** Enhanced metadata system to support both final and sketch image storage
**Acceptance Criteria:**
- **Extended Metadata Schema per Post:**
  - `images` (array): Ordered list of final comic panel images (existing)
  - `sketchImages` (array): Ordered list of raw sketch images with S3 keys
  - At least one of `images` or `sketchImages` must be provided for valid comic
- Sketch images stored with SHA1-based S3 keys similar to final images
- Sketch image metadata includes same altText support as final images
- Upload validation ensures at least one image type (final or sketch) present

### FR-R3: Global Site-Wide Toggle System
**Description:** Reader interface with global toggle to switch between final and sketch viewing modes
**Acceptance Criteria:**
- Global site-wide toggle in consistent location affects all comic displays
- Toggle positioned prominently but not intrusively across homepage, browse views, and individual comic pages
- Toggle uses artist-customizable icons rather than text labels (specific icons TBD with artist input)
- Toggle state persists across page navigation and browser sessions using localStorage
- Toggle affects all comic displays: homepage listings, tag browsing, series browsing, individual comic pages

### FR-R4: Sketch Display Logic and Mode Switching
**Description:** Intelligent display system that handles sketch-only, final-only, and mixed comic scenarios
**Acceptance Criteria:**
- Comics with only raw sketches (no final version) display sketches in both toggle modes
- Comics with both final and raw images never display both simultaneously
- Toggle controls viewing mode: "Final" shows final images, "Sketch" shows sketch images
- Comics with only final images (no sketches) display final images in both modes
- Clear visual indication when no content available for selected mode

### FR-R5: Position Synchronization Between Modes
**Description:** Smart carousel position management when switching between final and sketch modes
**Acceptance Criteria:**
- Browser state management maintains carousel position when switching between Final and Sketch modes
- Position sync logic: when final and sketch image counts match, carousel position syncs between modes
- Position preservation: when counts differ, switching preserves original mode's position
- Position memory: returning to previously viewed mode restores last position in that mode
- Smooth transitions between modes without jarring position jumps

## Non-Functional Requirements

### NFR-R1: Performance with Sketch Content
**Description:** Performance requirements that maintain MVP targets with additional sketch content
**Acceptance Criteria:**
- Mode switching completes instantly (under 100ms) with preloaded content
- Sketch image loading performs identically to final image loading (under 2 seconds via CDN)
- Toggle state changes do not require server requests (client-side only)
- Homepage and browsing performance unaffected by presence of sketch metadata

### NFR-R2: Storage Efficiency
**Description:** Cost-conscious storage approach for sketch content
**Acceptance Criteria:**
- Sketch images stored with same optimization as final images (original quality preserved)
- Separate S3 key patterns allow independent management of final vs sketch content
- CDN caching configured identically for sketch and final images
- No duplicate storage when sketch and final versions are identical files

## User Scenarios & Testing

### Primary Sketch Upload Flow
1. Artist opens upload interface and uploads both final comic images and raw sketches
2. Artist fills out comic metadata (title, happened-on date, tags)
3. Artist publishes comic with both final and sketch versions available
4. Comic appears on homepage in current toggle mode (default: final images)
5. Readers can toggle to sketch mode to view artist's raw sketches

### Sketch-Only Publishing Flow
1. Artist has sketches ready but final version not complete
2. Artist uploads only raw sketches (no final images)
3. Artist publishes comic with sketch-only content
4. Comic displays for readers in both toggle modes since only sketches exist
5. Artist can later upload final images to same comic post

### Reader Toggle Experience Flow
1. Reader visits site and sees comics in default final mode
2. Reader clicks sketch toggle icon to switch to sketch viewing mode
3. All comics on page switch to show sketches (where available)
4. Reader navigates to individual comic page - sketch mode preserved
5. Reader returns later - toggle preference restored from previous session

### Mixed Content Navigation Flow
1. Reader browses in sketch mode and encounters comic with no sketches
2. Comic displays final images (fallback behavior)
3. Reader continues to next comic which has sketches
4. Comic displays sketch version as expected
5. Position and mode preferences maintained throughout navigation

## Success Criteria
- Sketch upload workflow adds less than 1 minute to existing upload process
- Mode toggle switching completes instantly without loading delays  
- Sketch content storage costs remain under $2/month additional
- Toggle state persistence works reliably across browser sessions
- Zero impact on performance for comics without sketch content

## Key Entities

### Enhanced Comic Entity with Sketches
- **Additional Attributes:**
  - `sketchImages` (array): Ordered list of raw sketch images with S3 keys and altText
  - `hasSketchContent` (boolean, computed): Flag for quick sketch content detection
- **Validation:** At least one of `images` or `sketchImages` arrays must be non-empty
- **Relationships:** Same as existing comic entity with expanded image content

### Toggle State Entity (Client-Side)
- **Attributes:** currentMode ('final' | 'sketch'), lastPosition (per-comic), sessionTimestamp
- **Storage:** Browser localStorage for cross-session persistence
- **Relationships:** Associated with reader's browsing session, not server-side data

## Implementation Notes

### Technical Architecture Decisions
- Sketch images use same S3 storage architecture with distinct key prefixes
- Toggle state managed entirely client-side to avoid authentication requirements for readers
- Sketch metadata integrated into existing DynamoDB comic schema
- Mode switching handled via CSS/JavaScript without server round-trips

### Clarifications from Original Spec
- Sketch upload: Separate 'Raw Sketches' upload field in same form as final comics
- Toggle UI: Uses icons specified later with artist input, not text labels
- Position sync: Toggle controls viewing mode, never showing both together. Browser remembers position when switching modes
- Global toggle: Affects all comic displays across homepage, browse views, and individual comic pages
- Sketch-only behavior: Show sketch-only comics in both modes since they represent the only available version

### Integration Considerations
- Sketch functionality extends MVP upload workflow without disrupting existing flow
- Compatible with series management - sketches respect same chronological ordering
- Works with enhanced features like bulk operations (sketches included in bulk workflows)

## Out of Scope
- Sketch-specific metadata or tagging separate from final comic metadata
- Advanced sketch comparison tools or side-by-side viewing
- Sketch-only browsing modes or filtering
- Social features around sketch sharing or commenting
- Automated sketch-to-final conversion or processing

## Dependencies
- **Required:** Core MVP functionality must be implemented first
- **Database:** Extends existing DynamoDB comic schema with sketch fields
- **Storage:** Uses existing S3 infrastructure with additional key patterns
- **UI:** Builds upon existing upload and viewing interfaces
