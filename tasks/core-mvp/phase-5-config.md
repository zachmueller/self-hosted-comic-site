# Phase 5: Color Palette Configuration

**Status:** ⏳ 0% Complete (0/5 tasks)  
**Dependencies:** [Phase 4: Reader Experience - Comic Display](./phase-4-reader.md)  
**Next Phase:** [Phase 6: API Implementation](./phase-6-api.md)

## Overview

This phase implements the color palette customization system, allowing artists to personalize their site's appearance through a configuration interface.

## Tasks

### CONFIG-001: Configuration Data Model ✅ COMPLETE
**Description:** DynamoDB table and types for site configuration  
**Files:** `lib/self-hosted-comic-site-stack.ts`, `frontend/src/types/config.ts`, `shared/data/config.repository.ts`  
**Dependencies:** DATA-004  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Cost-Conscious: Single configuration item, minimal storage cost
- Serverless-First: Uses existing DynamoDB table or new config table

**Acceptance Criteria:**
- [ ] Configuration DynamoDB table or item in main table
- [ ] Configuration interface: primary, secondary, highlight, text, textSecondary colors
- [ ] CRUD operations in config.repository.ts
- [ ] Default color values defined
- [ ] TypeScript types for color palette

**Implementation Notes:**
- Consider using main DynamoDB table with id: 'CONFIG' instead of separate table
- Default color palette should be defined in CDK for initial deployment
- Color values should be hex format (#RRGGBB)

---

### CONFIG-002: Color Palette Editor UI ✅ COMPLETE
**Description:** Artist-facing interface to customize colors  
**Files:** `frontend/src/pages/ConfigPage.tsx`, `frontend/src/components/config/ColorPaletteEditor.tsx`, `frontend/src/components/config/ColorPicker.tsx`, `frontend/src/components/config/ContrastWarning.tsx`, `frontend/src/utils/contrastChecker.ts`, CSS files, `frontend/src/App.tsx`, `frontend/src/components/NavBar.tsx`  
**Dependencies:** CONFIG-001, AUTH-003  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Artist can customize site appearance

**Acceptance Criteria:**
- [x] ConfigPage protected by authentication
- [x] ColorPaletteEditor with five color inputs
- [x] ColorPicker using HTML5 color input
- [x] Hex validation for color values
- [x] Live preview of color changes
- [x] Reset to defaults button
- [x] Save button to persist changes
- [x] Mobile-responsive interface
- [x] Touch-friendly for iPad
- [x] Contrast warnings with WCAG compliance checking
- [x] Route added to App.tsx
- [x] Navigation link added to NavBar

**Implementation Notes:**
- Create new /config route in App.tsx
- Use HTML5 `<input type="color">` for color picker
- Implement live preview by temporarily applying CSS variables
- Show before/after comparison

---

### CONFIG-003: Lambda Functions for Config ⏳ TODO
**Description:** API endpoints to read and write configuration  
**Files:** `lambda/getConfig/index.ts`, `lambda/updateConfig/index.ts`  
**Dependencies:** CONFIG-001, INFRA-002  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- getConfig should be publicly accessible (no auth required)
- updateConfig must require Cognito authentication
- Add routes to API Gateway for both functions
- Consider caching config response for cost efficiency

---

### CONFIG-004: CSS Variable Injection System ⏳ TODO
**Description:** Load color palette and apply to CSS custom properties  
**Files:** `frontend/src/styles/theme.ts`, `frontend/src/App.tsx`  
**Dependencies:** CONFIG-003  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Load config in App.tsx useEffect
- Store in context or state management solution
- Update CSS variables dynamically via document.documentElement.style
- Define fallback colors in global CSS

---

### CONFIG-005: Accessibility Contrast Validation ⏳ TODO [P]
**Description:** Validate color contrast ratios for WCAG compliance  
**Files:** `frontend/src/utils/contrastChecker.ts`, `frontend/src/components/config/ContrastWarning.tsx`  
**Dependencies:** CONFIG-004  
**Status:** ⏳ TODO

**Constitutional Compliance:**
- Artist-First: Help artist choose accessible colors with warnings, not restrictions

**Acceptance Criteria:**
- [ ] Calculate contrast ratio between text and background colors
- [ ] Warn if contrast ratio below WCAG AA threshold (4.5:1)
- [ ] Display warning in ColorPaletteEditor
- [ ] Suggest adjustments for better contrast
- [ ] Allow artist to override warning (their choice)
- [ ] Show contrast ratio numbers in editor

**Implementation Notes:**
- Use WCAG contrast formula: (L1 + 0.05) / (L2 + 0.05)
- Calculate relative luminance from RGB values
- Show warnings but don't block saving
- Provide helpful suggestions like "lighten background" or "darken text"

**Note:** [P] indicates this task can be executed in parallel with other tasks

---

## Phase Summary

### Completion Status
🔄 2/5 tasks complete (40%)

### Key Features
- Artist-customizable color palette
- Live preview of color changes
- Accessibility contrast validation
- CSS variable system for theme consistency
- Protected configuration endpoints

### Implementation Approach
1. Data layer: Configuration storage in DynamoDB
2. Backend: Lambda functions for CRUD operations
3. Frontend: Color palette editor with live preview
4. Integration: CSS variable injection system
5. Polish: Accessibility validation and warnings

### Parallel Execution Notes
- CONFIG-002 and CONFIG-003 could be executed in parallel after CONFIG-001
- CONFIG-005 can be executed in parallel with CONFIG-004

### Dependencies on Other Phases
- Requires Phase 2 (Auth) for protected configuration pages
- Requires Phase 1 (Data Layer) for repository pattern
- API Gateway configuration from Phase 2 needed for Lambda endpoints

### Next Phase
Once Phase 5 is complete, proceed to [Phase 6: API Implementation](./phase-6-api.md) (which is already partially complete) to finalize API caching and performance optimization.

### Estimated Time to Complete Phase 5
- CONFIG-001: Data model and types (~2-3 hours)
- CONFIG-002: Color editor UI (~4-5 hours)
- CONFIG-003: Lambda functions (~3-4 hours)
- CONFIG-004: CSS variable system (~2-3 hours)
- CONFIG-005: Contrast validation (~2-3 hours)
- **Total:** ~3-4 days of focused work

### Priority Note
This phase is lower priority than completing Phase 3 (Upload) and Phase 4 (Reader Experience). Consider implementing after core functionality is working.
