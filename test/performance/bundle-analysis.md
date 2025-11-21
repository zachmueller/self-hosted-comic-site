# Bundle Analysis Report

## Overview

This document provides guidelines and results for analyzing the application's bundle size and performance optimizations.

## Constitutional Compliance

**Cost-Conscious Design**: Performance optimization is conducted within cost constraints, ensuring the application remains fast while staying under the $10/month hosting target.

## Analysis Tools

### 1. Vite Build Analysis

Run the production build with analysis:

```bash
cd frontend
npm run build -- --mode production
```

The build output will show:
- Total bundle size
- Individual chunk sizes
- Code splitting effectiveness

### 2. Bundle Visualizer

To visualize the bundle composition:

```bash
cd frontend
npm run build
npx vite-bundle-visualizer
```

This will generate an interactive treemap showing:
- Which packages contribute most to bundle size
- Opportunities for code splitting
- Duplicate dependencies

### 3. Lighthouse Analysis

Use Chrome DevTools Lighthouse or the performance tests:

```bash
npx playwright test test/performance/metrics.test.ts
```

## Bundle Size Targets

### Constitutional Cost-Conscious Targets

| Asset Type | Target | Rationale |
|------------|--------|-----------|
| Initial JS Bundle | <300 KB (gzipped) | Fast initial page load |
| Total JS (all chunks) | <1 MB (gzipped) | Reasonable for comic site |
| CSS | <50 KB (gzipped) | Minimal styling overhead |
| Individual Chunks | <100 KB each | Efficient lazy loading |

### Measured Baselines

Run performance tests to establish baselines:

```bash
npx playwright test test/performance/metrics.test.ts --grep "Bundle Analysis"
```

Results will be logged to console showing:
- Total bundle size in KB/MB
- Individual script sizes
- CSS file sizes

## Code Splitting Strategy

### 1. Route-Based Splitting

**Artist-First Priority**: Upload and config pages are lazy loaded to keep initial bundle small for readers.

```typescript
// Lazy load artist-only routes
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ConfigPage = lazy(() => import('./pages/ConfigPage'));
```

**Benefits**:
- Readers don't download artist tools
- Faster initial page load for public pages
- Artist pages load on-demand

### 2. Component-Level Splitting

Large components should be split:

```typescript
// Heavy editor component
const CaptionEditor = lazy(() => import('./components/upload/CaptionEditor'));

// Color picker UI
const ColorPaletteEditor = lazy(() => import('./components/config/ColorPaletteEditor'));
```

### 3. Library Splitting

Vendor libraries are automatically split by Vite:
- React core → vendor chunk
- AWS SDK → separate chunk (upload/config only)
- UI libraries → separate chunks

## Optimization Strategies

### 1. Tree Shaking

Ensure unused code is eliminated:

```typescript
// ✅ Good: Import only what's needed
import { useState, useEffect } from 'react';

// ❌ Avoid: Import entire library
import * as React from 'react';
```

### 2. Dynamic Imports

Use dynamic imports for conditional features:

```typescript
// Only load if user is authenticated
if (isAuthenticated) {
  const { uploadComic } = await import('./utils/upload');
  await uploadComic(data);
}
```

### 3. Image Optimization

Images are not part of JS bundle but affect performance:
- Use WebP format when supported
- Implement lazy loading (loading="lazy")
- Use srcset for responsive images
- CloudFront handles image optimization

### 4. Dependency Audit

Regularly audit dependencies for size:

```bash
cd frontend
npx bundlephobia <package-name>
```

Common heavy packages to watch:
- date libraries (use native Date or lightweight alternatives)
- icon libraries (import only needed icons)
- AWS SDK (split into separate chunks)

## Performance Budget

### Constitutional Cost Targets

The application should stay within these limits to maintain cost-conscious performance:

| Metric | Target | Impact on Cost |
|--------|--------|----------------|
| First Load JS | <400 KB | CloudFront data transfer |
| Page Load Time | <3s on 3G | User engagement |
| Time to Interactive | <5s on 3G | Artist workflow efficiency |
| Lighthouse Score | >80 | Overall performance indicator |

## Analysis Workflow

### 1. Before Each Release

```bash
# Build production bundle
cd frontend
npm run build

# Analyze bundle size
ls -lh dist/assets/*.js
ls -lh dist/assets/*.css

# Run performance tests
cd ..
npx playwright test test/performance/metrics.test.ts
```

### 2. Review Checklist

- [ ] Initial bundle <300 KB gzipped
- [ ] No duplicate dependencies
- [ ] Code splitting working for routes
- [ ] Lazy loading verified
- [ ] Lighthouse score >80
- [ ] All performance tests passing

### 3. Document Changes

When bundle size changes significantly:
1. Document what changed and why
2. Verify cost impact remains under budget
3. Update baselines if needed
4. Consider optimization if size increased

## Optimization Opportunities

### Current Status

Run tests to identify optimization opportunities:

```bash
npx playwright test test/performance/metrics.test.ts
```

Review console output for:
- Large individual chunks
- Unexpected script loading
- Slow API responses
- Missing lazy loading

### Common Optimizations

1. **Lazy Load Heavy Components**
   - Upload interface components
   - Config editor components
   - Chart/visualization libraries (if added)

2. **Minimize Dependencies**
   - Use native browser APIs when possible
   - Choose lightweight alternatives
   - Remove unused dependencies

3. **Code Split by Route**
   - Each major route in its own chunk
   - Shared components in common chunk
   - Vendor libraries in separate chunk

4. **Optimize Images**
   - Compress comics before upload
   - Use WebP format
   - Implement progressive loading
   - Leverage CloudFront caching

## Cost Impact Analysis

### Data Transfer Costs

**S3 Data Transfer Out to CloudFront**: $0.00/GB (free tier)

**CloudFront Data Transfer Out**:
- First 10 TB/month: $0.085/GB
- Target: <10 GB/month for typical usage

### Calculation Example

Assumptions for typical comic site:
- 100 comics
- Average 500 KB per comic (3-5 images)
- 1000 page views/month
- ~2 MB per page view (HTML + JS + CSS + images)

Monthly data transfer:
- Page views: 1000 × 2 MB = 2 GB
- Direct comic views: 500 × 0.5 MB = 250 MB
- **Total: ~2.25 GB/month**

Cost: 2.25 GB × $0.085/GB = **$0.19/month**

This fits well within the $10/month constitutional target.

### Optimization Impact

Reducing bundle size by 100 KB:
- Saves 100 KB × 1000 views = 100 MB/month
- Cost savings: 0.1 GB × $0.085 = **$0.0085/month**

While individual savings are small, they add up across all users and keep the site fast.

## Monitoring

### Continuous Monitoring

Set up alerts for:
- Bundle size exceeding 400 KB
- Lighthouse score dropping below 80
- Page load time exceeding targets
- Failed performance tests in CI

### Regular Reviews

Schedule quarterly bundle analysis:
1. Run full performance test suite
2. Review bundle composition
3. Identify optimization opportunities
4. Update documentation
5. Validate cost targets

## Tools and Resources

### Analysis Tools

- **Vite Build**: Built-in bundle analysis
- **vite-bundle-visualizer**: Interactive treemap
- **Playwright**: Performance testing framework
- **Lighthouse**: Performance auditing
- **bundlephobia.com**: Package size lookup

### Useful Commands

```bash
# Production build
cd frontend && npm run build

# Bundle analysis
cd frontend && npm run build && npx vite-bundle-visualizer

# Performance tests
npx playwright test test/performance/

# Lighthouse CLI
npx lighthouse http://localhost:5173 --view

# Size comparison
ls -lh frontend/dist/assets/*.js | sort -h
```

## Conclusion

Bundle size optimization is an ongoing process that directly impacts:
1. **User Experience**: Faster page loads, especially for readers
2. **Cost Efficiency**: Lower data transfer costs
3. **Artist Workflow**: Quick load times for upload/management tools
4. **Constitutional Compliance**: Staying within cost and performance targets

Regular monitoring and optimization ensure the site remains fast and cost-effective while prioritizing the artist's needs.
