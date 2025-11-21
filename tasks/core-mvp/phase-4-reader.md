# Phase 4: Reader Experience - Comic Display

**Status:** 🔄 25% Complete (2/8 tasks)  
**Dependencies:** [Phase 3: Artist Upload Workflow](./phase-3-upload.md)  
**Next Phase:** [Phase 5: Color Palette Configuration](./phase-5-config.md)

## Overview

This phase implements the reader-facing comic viewing experience, including homepage, pagination, filtering, and single comic pages with relationship display.

## Tasks

### READER-001: Homepage Components ⏳ TODO
**Description:** Comic listing page with grid layout  
**Files:** `frontend/src/pages/HomePage.tsx`, `frontend/src/components/comic/ComicGrid.tsx`, `frontend/src/components/comic/ComicCard.tsx`  
**Dependencies:** UPLOAD-011, INFRA-002  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Components exist but need API integration with getComics Lambda
- Grid layout is already responsive
- ComicCard structure is complete

---

### READER-002: Pagination Component ⏳ TODO
**Description:** Pagination controls for comic listing  
**Files:** `frontend/src/components/comic/Pagination.tsx`, `frontend/src/hooks/usePagination.ts`  
**Dependencies:** READER-001  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Component structure exists
- usePagination hook is implemented
- Needs connection to getComics API with pagination params

---

### READER-003: Tag Filtering ⏳ TODO
**Description:** Filter comics by tag  
**Files:** `frontend/src/components/comic/TagFilter.tsx`, `frontend/src/hooks/useTagFilter.ts`  
**Dependencies:** READER-002  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Component structure exists
- useTagFilter hook is implemented
- Needs API integration to fetch available tags and filtered results

---

### READER-004: Single Comic Page Structure ⏳ TODO
**Description:** Comic detail page layout and data fetching  
**Files:** `frontend/src/pages/ComicPage.tsx`, `frontend/src/components/comic/ComicHeader.tsx`  
**Dependencies:** READER-003  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- ComicPage exists with basic structure
- ComicHeader component is complete
- Needs API integration with getComic Lambda

---

### READER-005: Comic Image Display ✅ COMPLETE
**Description:** Carousel and long form image display modes  
**Files:** `frontend/src/components/comic/ComicImages.tsx`, `frontend/src/components/comic/CarouselView.tsx`, `frontend/src/components/comic/LongFormView.tsx`  
**Dependencies:** READER-004  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Display respects artist's scrollStyle choice

**Acceptance Criteria:**
- [x] ComicImages switches between carousel and long form based on scrollStyle
- [x] CarouselView with navigation controls (prev/next buttons)
- [x] CarouselView with swipe gestures on mobile
- [x] CarouselView keyboard navigation (arrow keys)
- [x] LongFormView with vertical scroll of all images
- [x] Responsive image sizing
- [x] Image lazy loading for performance
- [x] Alt text support for accessibility

---

### READER-006: Caption and Relationships Display ⏳ TODO
**Description:** Display comic caption with parsed references  
**Files:** `frontend/src/components/comic/ComicCaption.tsx`, `frontend/src/components/comic/RelatedComics.tsx`  
**Dependencies:** READER-005  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Components exist with structure
- Needs API data integration from getComic Lambda (includes resolved relationships)
- Reference parsing for display can reuse caption validation logic

---

### READER-007: Share Functionality ✅ COMPLETE
**Description:** Copy comic URL to clipboard  
**Files:** `frontend/src/components/comic/ShareButton.tsx`, `frontend/src/utils/clipboard.ts`  
**Dependencies:** READER-006  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Simple sharing for artist to promote comics

**Acceptance Criteria:**
- [x] ShareButton component with clipboard icon
- [x] Copy current URL to clipboard on click
- [x] Success feedback (tooltip or toast)
- [x] Fallback for browsers without clipboard API
- [x] Keyboard accessible
- [x] Mobile-friendly touch target

---

### READER-008: Responsive Design Implementation ⏳ TODO [P]
**Description:** Apply responsive breakpoints and mobile optimization  
**Files:** `frontend/src/styles/breakpoints.ts`, CSS modules for all components  
**Dependencies:** READER-007  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Breakpoints utility exists
- Most components have responsive CSS
- Needs comprehensive testing and refinement across devices

**Note:** [P] indicates this task can be executed in parallel with other tasks

---

## Phase Summary

### Completion Status
🔄 2/8 tasks complete (25%)

### Completed Tasks
- ✅ READER-005: Comic Image Display (CarouselView, LongFormView)
- ✅ READER-007: Share Functionality

### TODO (Priority Order)
1. ⏳ READER-001: Homepage Components (API integration)
2. ⏳ READER-002: Pagination Component
3. ⏳ READER-003: Tag Filtering
4. ⏳ READER-004: Single Comic Page Structure
5. ⏳ READER-006: Caption and Relationships Display
6. ⏳ READER-008: Responsive Design Implementation

### Key Achievements
- Image display components complete with both viewing modes
- Carousel with touch gestures and keyboard navigation
- Long form scrolling for comics
- Share button with clipboard functionality
- All reader components have basic structure in place

### Remaining Work

#### High Priority (API Integration)
All reader components need API integration to fetch data:

1. **READER-001**: Connect HomePage to getComics Lambda
   - Fetch paginated comic list
   - Display comics in grid
   - Handle loading and error states

2. **READER-004**: Connect ComicPage to getComic Lambda
   - Fetch single comic by slug
   - Display comic metadata and images
   - Handle 404 and errors

3. **READER-006**: Display relationships from API
   - Parse resolved relationships from getComic response
   - Render reference links in caption
   - Display related comics grid

#### Medium Priority
4. **READER-002**: Add pagination controls
5. **READER-003**: Implement tag filtering

#### Lower Priority
6. **READER-008**: Responsive design polish

### Parallel Execution Notes
- READER-002, READER-004 could be executed in parallel after READER-001
- READER-006, READER-007 could be executed in parallel after READER-005
- READER-008 can be executed in parallel with most reader tasks

### Dependencies on Other Phases
- Requires Phase 6 (API Implementation) for getComics and getComic endpoints to be fully operational
- Phase 3 (Upload) must be complete to test with actual uploaded comics

### Next Phase
Once Phase 4 is complete, proceed to [Phase 5: Color Palette Configuration](./phase-5-config.md) to implement artist color customization.

### Estimated Time to Complete Phase 4
- API integrations (READER-001, 002, 003, 004, 006): ~6-8 hours
- Responsive design polish (READER-008): ~3-4 hours
- **Total:** ~2-3 days of focused work
