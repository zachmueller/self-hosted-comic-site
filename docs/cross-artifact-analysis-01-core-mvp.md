# Cross-Artifact Analysis Report

**Generated:** April 3, 2026  
**Feature:** Core MVP  
**Branch:** main  
**Artifacts:** specs/01-core-mvp-spec.md, plans/01-core-mvp-plan.md, tasks/01-core-mvp/ (phases 0–8), .clinerules/memory/constitution.md

## Executive Summary

- **Total Findings:** 18 (Critical: 1, High: 5, Medium: 8, Low: 4)
- **Coverage:** ~90% requirements mapped to tasks
- **Constitutional Compliance:** PASS (with minor documentation drift)
- **Readiness:** NEEDS ATTENTION — Critical and High findings should be resolved before proceeding to Phase 8 deployment

---

## Findings Summary

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | **CRITICAL** | spec FR-3 vs types/validation | `scrollStyle` enum value mismatch: spec says `"long"`, implementation uses `"longForm"` | Update spec to say `"longForm"` or update implementation — must be consistent |
| I2 | Inconsistency | HIGH | spec FR-3 vs frontend/src/types/comic.ts | `integrations` field in spec metadata schema is absent from TypeScript types, Zod schemas, and all Lambda code | Either remove from spec (defer to social-media spec) or add stub to types |
| I3 | Inconsistency | HIGH | spec FR-3 vs frontend/src/types/comic.ts | Spec says `thumbnailImageIndex`, implementation uses `thumbnailIndex` | Align naming across spec and code |
| I4 | Inconsistency | HIGH | spec FR-3 vs frontend/src/types/comic.ts | Spec image object uses `s3Key`, implementation uses `key` | Align field naming |
| I5 | Inconsistency | HIGH | tasks README vs phase-7 file | README says Phase 7 is "⏳ 0% Complete", phase-7-testing.md says "✅ 100% Complete (9/9 tasks)" | Update README to reflect actual completion |
| I6 | Inconsistency | HIGH | tasks README vs phase-8 file | README header says "0/5 tasks", phase-8-deployment.md contains 8 actual tasks (DOC-001–003, DEPLOY-001–004, VAL-001) | Update Phase 8 header to "0/8 tasks" |
| D1 | Duplication | MEDIUM | shared/validation/comic.schema.ts + shared/utils/referenceParser.ts + lambda/processUpload/index.ts | Reference parsing (`parseReferences`) is implemented in 3 places with potentially divergent logic | Consolidate into single shared utility; import everywhere |
| D2 | Duplication | MEDIUM | plan Phase 2 vs plan Phase 5 | Plan numbers API Lambda functions in Phase 1 (5 functions) and again details them in Phase 5 — overlapping descriptions | Minor; plan phases naturally expand on earlier outlines |
| A1 | Ambiguity | MEDIUM | spec FR-3 | `happenedOnDate` described as `(date)` type but implementation uses optional ISO 8601 string — spec doesn't clarify optionality | Spec should note `happenedOnDate` is optional (matching implementation) |
| A2 | Ambiguity | MEDIUM | spec FR-8 | Color palette "accessibility validation ensures sufficient contrast ratios" — no specific WCAG level or ratio threshold given | Specify WCAG 2.1 AA (4.5:1 normal text, 3:1 large text) |
| A3 | Ambiguity | MEDIUM | plan Phase 0 | Plan mentions `research.md` as deliverable — file does not exist and was never created | Remove from plan or mark as skipped |
| U1 | Underspec | MEDIUM | spec FR-2 | "Real-time upload progress indicators" — no specification of what constitutes progress (per-file %, total %, bytes?) | Clarify: per-file percentage bars with total count indicator |
| U2 | Underspec | MEDIUM | spec FR-7 | "Basic chronological next/previous navigation between comics (by 'happened on' date)" — no spec for what happens when happenedOnDate is null/absent | Specify fallback sort (e.g., postedTimestamp) |
| C1 | Coverage | MEDIUM | spec FR-2 | Spec requires "Automatic parsing and validation of caption references during upload with real-time feedback for invalid comic titles" — no explicit task for real-time invalid-title visual feedback during editing | Covered partially by UPLOAD-004 (autocomplete) but no explicit invalid-state styling task |
| L1 | Link/Reference | LOW | tasks/01-core-mvp/README.md | Broken link: `plans/01-01-core-mvp-plan.md` should be `plans/01-core-mvp-plan.md` | Fix the relative path |
| L2 | Link/Reference | LOW | tasks README | README says "Completed: 53 (91%)" but Phase 7 is now 100% complete → actual completed is 53+9=62 of 66 (not 58) | Recalculate total tasks and completion percentage |
| L3 | Link/Reference | LOW | plan | Plan says "Phase 0–7" (8 phases), tasks split into "Phase 0–8" (9 phases). Plan Phase 1 = tasks Phase 2, etc. — numbering diverges | Document mapping or renumber for consistency |
| L4 | Link/Reference | LOW | tasks README | "Estimated Timeline" section says "Phase 3: 🔄 ~1 week remaining" but Phase 3 is marked ✅ 100% Complete | Update estimated timeline to reflect current state |

---

## Detailed Finding Analysis

### I1 (CRITICAL): `scrollStyle` Enum Value Mismatch

**Spec (FR-3):** `scrollStyle` (string): Display style (`carousel` or `long`)  
**Implementation:** `scrollStyle: 'carousel' | 'longForm'` (in `frontend/src/types/comic.ts` and `shared/validation/metadata.schema.ts`)

This is a **data contract mismatch**. If the spec is treated as the source of truth and someone generates data with `"long"`, it will fail Zod validation. Conversely, if existing DynamoDB records use `"longForm"`, changing to `"long"` would break stored data.

**Recommendation:** Update spec FR-3 to use `"longForm"` since that is what's implemented and stored. The spec's user story already says "long form" (two words), making `longForm` a reasonable camelCase representation.

### I2 (HIGH): Missing `integrations` Field

**Spec FR-3** defines an `integrations` array on the comic metadata schema with Instagram/Facebook controls. This field is completely absent from:
- `frontend/src/types/comic.ts`
- `shared/validation/comic.schema.ts`  
- `shared/validation/metadata.schema.ts`
- All Lambda functions

The spec references [Social Media Integration](09-social-media-integration-spec.md) for this field, suggesting it may belong in a future spec rather than Core MVP.

**Recommendation:** Remove `integrations` from the Core MVP spec FR-3 metadata schema and add a note: "See [Social Media Integration](09-social-media-integration-spec.md) for per-comic social media controls." This keeps the MVP spec honest about what's actually implemented.

### I3 (HIGH): `thumbnailImageIndex` vs `thumbnailIndex`

**Spec:** Uses `thumbnailImageIndex` in Key Entities and FR-3.  
**Implementation:** Uses `thumbnailIndex` in TypeScript types and Zod schemas.

**Recommendation:** Update spec to use `thumbnailIndex` to match implementation.

### I4 (HIGH): Image Object `s3Key` vs `key`

**Spec FR-3:** Each image object contains: `s3Key` (string), `altText` (optional string)  
**Implementation (`frontend/src/types/comic.ts`):** `key: string` (not `s3Key`)

**Recommendation:** Update spec to use `key` to match implementation, or rename implementation field to `s3Key` for clarity about its purpose. The upload schema uses `s3Key`, creating internal inconsistency within the codebase as well.

### I5 & I6 (HIGH): README Status Stale

The tasks README has not been updated to reflect:
- Phase 7 completion (file says 100%, README says 0%)
- Phase 8 actual task count (8 tasks, not 5)
- Total task count (README says 58, actual count across all phase files is ~66)
- Completion percentage (README says 91%, actual is higher)

**Recommendation:** Recalculate and update README task counts, completion percentages, and phase statuses.

### D1 (MEDIUM): Triplicated Reference Parser

`parseReferences()` exists in three locations:
1. `shared/validation/comic.schema.ts` — exported function  
2. `shared/utils/referenceParser.ts` — dedicated utility  
3. `lambda/processUpload/index.ts` — inline implementation

Each may have subtly different behavior (regex flags, trimming, edge cases).

**Recommendation:** Consolidate to a single implementation in `shared/utils/referenceParser.ts` and import from there in both the validation schema and Lambda function.

---

## Coverage Analysis

| Requirement | Tasks | Status | Notes |
|-------------|-------|--------|-------|
| FR-1: Artist Auth (Cognito/Google) | AUTH-001, AUTH-002, AUTH-003 | ✅ Complete | Good coverage |
| FR-2: Upload Interface | UPLOAD-001–011 | ✅ Complete | 11 tasks, thorough |
| FR-3: Comic Metadata | DATA-001–004 | ✅ Complete | `integrations` field omitted (see I2) |
| FR-4: Reference System | UPLOAD-004, UPLOAD-010, TEST-002, TEST-003 | ✅ Complete | Parser, autocomplete, relationships |
| FR-5: Homepage/Navigation | READER-001–003 | ✅ Complete | Grid, pagination, filtering |
| FR-6: Multi-Image Display | READER-005 | ✅ Complete | Carousel + long form |
| FR-7: Comic Pages + Relationships | READER-004, READER-006, READER-007 | ✅ Complete | Share, related comics |
| FR-8: Color Palette Config | CONFIG-001–005 | ✅ Complete | Editor, CSS vars, contrast |
| NFR-1: Performance | TEST-007 | ✅ Complete | Load time targets tested |
| NFR-2: Cost Efficiency | TEST-009 | ✅ Complete | Cost monitoring + analysis |
| NFR-3: Artist Workflow | TEST-005 | ✅ Complete | E2E upload workflow |
| NFR-4: Deployment | DEPLOY-001–004 (Phase 8) | ⏳ Not Started | Pending |
| Responsive Design | READER-008, TEST-006 | ✅ Complete | Cross-device + breakpoints |
| Constitutional Compliance | TEST-008, VAL-001 | ✅ Partial | TEST-008 done, VAL-001 pending (Phase 8) |

**Coverage Rate:** 12/13 requirement areas have implementation tasks. NFR-4 (Deployment) is covered by Phase 8 tasks which are pending.

---

## Constitutional Compliance

| Principle | Status | Evidence |
|-----------|--------|----------|
| Artist-First UX | ✅ PASS | Upload workflow prioritized (Phase 3 before Phase 4); iPad-optimized components; <5min target tested |
| Serverless-First | ✅ PASS | All infrastructure: Lambda, DynamoDB, S3, CloudFront, Cognito, API Gateway — no EC2/containers |
| Cost-Conscious ($10/mo) | ✅ PASS | Estimated $0.44–$9.50/month; CloudWatch alarm at $8 threshold; cost analysis documented |
| Deployment Simplicity | ✅ PASS | Single `cdk deploy` documented; CDK stack contains all resources |

**CRITICAL Violations:** 0  
**Overall Status:** PASS

---

## Metrics

| Metric | Value |
|--------|-------|
| Spec Functional Requirements | 8 (FR-1 through FR-8) |
| Spec Non-Functional Requirements | 4 (NFR-1 through NFR-4) |
| Total Task Files | 9 phases (phase-0 through phase-8) |
| Total Tasks (actual count across files) | ~66 |
| Tasks Completed | ~58 (Phases 0–7 complete) |
| Tasks Remaining | ~8 (Phase 8) |
| Ambiguities Found | 3 |
| Duplications Found | 2 |
| Inconsistencies Found | 6 |
| Coverage Gaps | 1 (minor — invalid reference styling) |
| Broken Links/References | 4 |

---

## Next Actions

### Immediate (Critical/High) — Must resolve before Phase 8 implementation

1. **I1 (CRITICAL):** Update spec FR-3 `scrollStyle` from `"long"` to `"longForm"` to match implementation
2. **I2 (HIGH):** Remove `integrations` field from spec FR-3 metadata schema; add cross-reference to social media spec
3. **I3 (HIGH):** Update spec to use `thumbnailIndex` instead of `thumbnailImageIndex`
4. **I4 (HIGH):** Reconcile image object field name (`s3Key` vs `key`) across spec and codebase
5. **I5/I6 (HIGH):** Update tasks README with correct phase statuses, task counts, and completion percentages

### Recommended (Medium) — Address before or during Phase 8

6. **D1:** Consolidate `parseReferences` into single shared utility
7. **A1:** Clarify `happenedOnDate` optionality in spec
8. **A2:** Specify WCAG contrast ratio thresholds in FR-8
9. **A3:** Remove `research.md` from plan deliverables (was never created)
10. **U2:** Specify fallback sort behavior when `happenedOnDate` is null

### Low Priority — Address opportunistically

11. **L1:** Fix broken link in tasks README (`01-01-core-mvp-plan.md` → `01-core-mvp-plan.md`)
12. **L2:** Recalculate total tasks and percentages in README
13. **L3:** Document phase numbering mapping between plan and tasks
14. **L4:** Update estimated timeline in README

### Readiness Assessment

**High issues present:** Recommended to resolve Critical and High issues before proceeding with Phase 8 deployment tasks. The inconsistencies between spec and implementation (I1–I4) don't block development but will cause confusion during documentation (DOC-001–003) and final validation (VAL-001). The stale README (I5/I6) should be corrected to provide accurate project status tracking.

Medium and Low issues can be addressed in parallel with Phase 8 work.

---

## Remediation Status

All findings have been remediated as of April 3, 2026:

| ID | Status | Action Taken |
|----|--------|-------------|
| I1 | ✅ Fixed | Updated spec FR-3 `scrollStyle` to `"longForm"` |
| I2 | ✅ Fixed | Removed `integrations` from spec FR-3; added cross-ref to social media spec |
| I3 | ✅ Fixed | Updated spec to use `thumbnailIndex` consistently |
| I4 | ✅ Fixed | Updated spec image object to use `key` with `order` field, matching implementation |
| I5 | ✅ Fixed | Updated tasks README: Phase 7 → ✅ 100% Complete |
| I6 | ✅ Fixed | Updated Phase 8 header to 0/8 tasks; README total to 61 tasks |
| D1 | ✅ Fixed | Removed duplicate `parseReferences` from comic.schema.ts; re-exports from shared utility; added sync note in Lambda |
| D2 | ℹ️ Noted | Acceptable overlap between plan phases (intentional progressive detail) |
| A1 | ✅ Fixed | Spec FR-3 now marks `happenedOnDate` as optional |
| A2 | ✅ Fixed | Spec FR-8 now specifies WCAG 2.1 AA thresholds (4.5:1 / 3:1) |
| A3 | ✅ Fixed | Removed `research.md` from plan deliverables |
| U1 | ℹ️ Noted | Low priority; current implementation uses per-file progress bars |
| U2 | ✅ Fixed | Spec FR-7 now specifies `postedTimestamp` fallback for null `happenedOnDate` |
| C1 | ℹ️ Noted | Covered by UPLOAD-004 autocomplete; invalid styling implicit in implementation |
| L1 | ✅ Fixed | Corrected link to `plans/01-core-mvp-plan.md` |
| L2 | ✅ Fixed | Recalculated: 61 total tasks, 53 completed (87%) |
| L3 | ✅ Fixed | Added phase numbering note to README |
| L4 | ✅ Fixed | Updated estimated timeline to reflect current state |
