# Phase 3: Artist Upload Workflow (PRIORITY)

**Status:** 🔄 73% Complete (8/11 tasks)  
**Dependencies:** [Phase 2: Authentication & Core Infrastructure](./phase-2-auth-infra.md)  
**Next Phase:** [Phase 4: Reader Experience - Comic Display](./phase-4-reader.md)

## Overview

This phase implements the complete artist upload workflow, from image selection to publication. This is the highest priority phase as it enables the core artist functionality.

## Tasks

### UPLOAD-001: App Router and Layout ✅ COMPLETE
**Description:** Set up React Router and basic app layout  
**Files:** `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/components/Header.tsx`, `frontend/src/components/NavBar.tsx`  
**Dependencies:** AUTH-003, INFRA-002  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Navigation optimized for artist workflow

**Acceptance Criteria:**
- [x] React Router v6 configured with routes
- [x] Layout component with header and navigation
- [x] Header shows auth status and upload link
- [x] NavBar with Home, Tags, Login/Logout links
- [x] Responsive layout for mobile and desktop
- [x] Loading states for route transitions

---

### UPLOAD-002: Image Dropzone Component ✅ COMPLETE
**Description:** iPad-optimized file upload interface with drag-and-drop  
**Files:** `frontend/src/components/upload/ImageDropzone.tsx`, `frontend/src/components/upload/ImagePreview.tsx`  
**Dependencies:** UPLOAD-001  
**Status:** ✅ COMPLETE

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

---

### UPLOAD-003: Metadata Form Components ✅ COMPLETE
**Description:** Create form inputs for comic metadata  
**Files:** `frontend/src/components/upload/ComicMetadataForm.tsx`, `frontend/src/components/upload/DatePicker.tsx`, `frontend/src/components/upload/TagInput.tsx`, `frontend/src/components/upload/ScrollStyleToggle.tsx`  
**Dependencies:** UPLOAD-002, DATA-002  
**Status:** ✅ COMPLETE

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

---

### UPLOAD-004: Caption Editor with Autocomplete 🔄 IN PROGRESS
**Description:** Obsidian-style reference editor with autocomplete  
**Files:** `frontend/src/components/upload/CaptionEditor.tsx`, `frontend/src/components/upload/ReferenceAutocomplete.tsx`  
**Dependencies:** UPLOAD-003  
**Status:** 🔄 IN PROGRESS

**Constitutional Compliance:**
- Artist-First: Streamlined reference creation workflow

**Acceptance Criteria:**
- [x] Textarea for caption input
- [x] Real-time parsing of [[Title]] and [[Title|Alias]] syntax
- [x] Visual highlighting of valid/invalid references
- [x] Trigger autocomplete on [[ input
- [ ] **TODO:** ReferenceAutocomplete dropdown with API integration (needs searchTitles Lambda connection)

**Remaining Work:**
- Connect ReferenceAutocomplete to searchTitles Lambda endpoint
- Implement keyboard navigation in autocomplete dropdown
- Test autocomplete performance with large comic library

---

### UPLOAD-005: Accessibility Features ✅ COMPLETE
**Description:** Alt text and thumbnail selection components  
**Files:** `frontend/src/components/upload/AltTextInput.tsx`, `frontend/src/components/upload/ThumbnailSelector.tsx`  
**Dependencies:** UPLOAD-004  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Optional alt text, easy thumbnail selection

**Acceptance Criteria:**
- [x] AltTextInput component per image (optional)
- [x] ThumbnailSelector with image grid
- [x] Visual indicator for selected thumbnail
- [x] Preview of thumbnail in listing context
- [x] Default to first image if not selected
- [x] Touch-friendly thumbnail selection

---

### UPLOAD-006: Upload Page Integration ✅ COMPLETE
**Description:** Integrate all upload components into cohesive workflow  
**Files:** `frontend/src/pages/UploadPage.tsx`, `frontend/src/utils/uploadState.ts`  
**Dependencies:** UPLOAD-005  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Streamlined upload workflow, <5min target

**Acceptance Criteria:**
- [x] UploadPage combines all upload components
- [x] Multi-step form navigation (files → metadata → reorder → publish)
- [x] State management for form data
- [x] Form validation before proceeding to next step
- [x] Progress indicator showing current step
- [x] Back navigation between steps
- [x] Save draft functionality (localStorage)
- [x] Clear all functionality

---

### UPLOAD-007: Panel Reordering Interface ✅ COMPLETE
**Description:** Drag-and-drop panel reordering with touch support  
**Files:** `frontend/src/components/upload/PanelReorderScreen.tsx`, `frontend/src/components/upload/DraggablePanel.tsx`  
**Dependencies:** UPLOAD-006  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Easy corrections before publish

**Acceptance Criteria:**
- [x] React-beautiful-dnd integration for reordering (@hello-pangea/dnd)
- [x] Touch gesture support for iPad
- [x] Visual feedback during drag operations
- [x] Preview of final order in carousel mode
- [x] Preview of final order in long form mode
- [x] Skip option to maintain upload order
- [x] Apply order button
- [x] Large touch targets for panel manipulation

---

### UPLOAD-008: S3 Presigned URL Generation ⏳ TODO
**Description:** Lambda function to generate presigned URLs for image upload  
**Files:** `lambda/generatePresignedUrl/index.ts`  
**Dependencies:** INFRA-002, AUTH-003  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Lambda function exists but needs presigned URL generation logic
- Should validate file size and content type before generating URL
- Consider implementing rate limiting to prevent abuse

---

### UPLOAD-009: S3 Upload Client Logic ✅ COMPLETE
**Description:** Client-side S3 upload with progress tracking  
**Files:** `frontend/src/utils/s3Upload.ts`, `frontend/src/hooks/useS3Upload.ts`  
**Dependencies:** UPLOAD-008  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Progress feedback keeps artist informed

**Acceptance Criteria:**
- [x] Request presigned URL from Lambda
- [x] Upload image directly to S3 using presigned URL
- [x] Track upload progress per image
- [x] Display progress bar for each upload
- [x] Handle concurrent uploads (3-5 at a time)
- [x] Retry logic for failed uploads
- [x] Error handling with user-friendly messages
- [x] Cancel upload functionality

---

### UPLOAD-010: Process Upload Lambda Function ⏳ TODO
**Description:** Backend processing of comic metadata and relationships  
**Files:** `lambda/processUpload/index.ts`, `shared/utils/referenceParser.ts`, `shared/utils/relationshipBuilder.ts`  
**Dependencies:** UPLOAD-009, DATA-004  
**Status:** ⏳ TODO

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

**Implementation Notes:**
- Lambda function exists with structure but needs full implementation
- Reference parsing utility needs to be created
- Relationship builder utility needs to be created
- Consider batch writes for efficiency when updating multiple target comics

---

### UPLOAD-011: Upload Success Screen ✅ COMPLETE [P]
**Description:** Post-upload confirmation and next actions  
**Files:** `frontend/src/components/upload/UploadSuccess.tsx`  
**Dependencies:** UPLOAD-010  
**Status:** ✅ COMPLETE

**Constitutional Compliance:**
- Artist-First: Clear confirmation and next steps

**Acceptance Criteria:**
- [x] Success confirmation message
- [x] Link to published comic page
- [x] Note about CloudFront cache delay (~5 minutes)
- [x] "Upload Another Comic" button
- [x] Clear form state on upload another
- [x] Error display if cache invalidation fails (handled in UploadPage)

**Note:** [P] indicates this task can be executed in parallel with other tasks

---

## Phase Summary

### Completion Status
🔄 8/11 tasks complete (73%)

### Completed Tasks
- ✅ UPLOAD-001: App Router and Layout
- ✅ UPLOAD-002: Image Dropzone Component
- ✅ UPLOAD-003: Metadata Form Components
- ✅ UPLOAD-005: Accessibility Features
- ✅ UPLOAD-006: Upload Page Integration
- ✅ UPLOAD-007: Panel Reordering Interface
- ✅ UPLOAD-009: S3 Upload Client Logic
- ✅ UPLOAD-011: Upload Success Screen

### In Progress
- 🔄 UPLOAD-004: Caption Editor Autocomplete (needs API integration)

### TODO (Critical Path)
- ⏳ UPLOAD-008: S3 Presigned URL Generation
- ⏳ UPLOAD-010: Process Upload Lambda Function

### Key Achievements
- Complete upload UI workflow built with iPad optimization
- Multi-step form with validation at each stage
- Drag-and-drop panel reordering with touch support
- S3 upload client with progress tracking and error handling
- Save draft functionality for artist convenience
- All upload components are touch-friendly (44px+ targets)

### Remaining Work

#### High Priority
1. **UPLOAD-008**: Implement presigned URL generation in Lambda
   - Add authentication check
   - Generate S3 presigned URLs with proper permissions
   - Add error handling and logging

2. **UPLOAD-010**: Complete processUpload Lambda implementation
   - Create reference parser utility
   - Create relationship builder utility
   - Implement bidirectional relationship updates
   - Add CloudFront cache invalidation

3. **UPLOAD-004**: Connect autocomplete to searchTitles API
   - Wire up ReferenceAutocomplete to Lambda endpoint
   - Add keyboard navigation
   - Test with various comic library sizes

### Parallel Execution Notes
- UPLOAD-004, UPLOAD-005 could be executed in parallel after UPLOAD-003
- UPLOAD-009 and component tests could be executed in parallel after UPLOAD-008

### Next Phase
Once Phase 3 is complete, proceed to [Phase 4: Reader Experience - Comic Display](./phase-4-reader.md) to build the reader-facing features.

### Estimated Time to Complete Phase 3
- UPLOAD-008: ~2-4 hours
- UPLOAD-010: ~4-6 hours (complex relationship logic)
- UPLOAD-004 API integration: ~2-3 hours
- **Total:** ~1-2 days of focused work
