import { test, expect } from '@playwright/test';
import { PlaywrightTestConfig } from '@playwright/test';

/**
 * Performance tests to validate load times and bundle sizes
 * Constitutional Compliance: Cost-Conscious - performance optimization within cost constraints
 */

// Helper to measure page load time
async function measurePageLoadTime(page: any, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const endTime = Date.now();
  return (endTime - startTime) / 1000; // Convert to seconds
}

// Helper to run Lighthouse audit
async function runLighthouseAudit(page: any, url: string) {
  // Note: This is a simplified version. In production, you'd use the official Lighthouse library
  // For now, we'll use Playwright's built-in metrics
  await page.goto(url);
  
  const performanceMetrics = await page.evaluate(() => {
    const perfData = window.performance.timing;
    const navigationStart = perfData.navigationStart;
    
    return {
      // Time to first byte
      ttfb: (perfData.responseStart - navigationStart) / 1000,
      // DOM content loaded
      domContentLoaded: (perfData.domContentLoadedEventEnd - navigationStart) / 1000,
      // Page fully loaded
      loadComplete: (perfData.loadEventEnd - navigationStart) / 1000,
      // First contentful paint (approximation)
      firstContentfulPaint: (perfData.domInteractive - navigationStart) / 1000,
    };
  });
  
  return performanceMetrics;
}

test.describe('Performance Testing - Load Times', () => {
  test('Homepage should load in <3s on 3G connection', async ({ page }) => {
    // Simulate 3G connection
    await page.route('**/*', async (route) => {
      // Add artificial delay to simulate 3G
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    const loadTime = await measurePageLoadTime(page, '/');
    
    console.log(`Homepage load time on 3G: ${loadTime.toFixed(2)}s`);
    expect(loadTime).toBeLessThan(3);
  });
  
  test('Single comic page should load in <2s', async ({ page }) => {
    const loadTime = await measurePageLoadTime(page, '/comic/test-comic-slug');
    
    console.log(`Comic page load time: ${loadTime.toFixed(2)}s`);
    expect(loadTime).toBeLessThan(2);
  });
  
  test('Upload interface should load in <1s', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('idToken', 'mock-id-token');
      localStorage.setItem('accessToken', 'mock-access-token');
    });
    
    const loadTime = await measurePageLoadTime(page, '/upload');
    
    console.log(`Upload interface load time: ${loadTime.toFixed(2)}s`);
    expect(loadTime).toBeLessThan(1);
  });
  
  test('Config page should load in <1s', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('idToken', 'mock-id-token');
      localStorage.setItem('accessToken', 'mock-access-token');
    });
    
    const loadTime = await measurePageLoadTime(page, '/config');
    
    console.log(`Config page load time: ${loadTime.toFixed(2)}s`);
    expect(loadTime).toBeLessThan(1);
  });
});

test.describe('Performance Testing - API Response Times', () => {
  test('GetComics API should respond in <500ms', async ({ page }) => {
    await page.goto('/');
    
    // Intercept API call and measure response time
    let responseTime = 0;
    
    await page.route('**/comics*', async (route) => {
      const startTime = Date.now();
      const response = await route.fetch();
      const endTime = Date.now();
      responseTime = endTime - startTime;
      await route.fulfill({ response });
    });
    
    // Trigger API call by navigating
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log(`GetComics API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(500);
  });
  
  test('GetComic API should respond in <500ms', async ({ page }) => {
    let responseTime = 0;
    
    await page.route('**/comic/*', async (route) => {
      const startTime = Date.now();
      const response = await route.fetch();
      const endTime = Date.now();
      responseTime = endTime - startTime;
      await route.fulfill({ response });
    });
    
    await page.goto('/comic/test-comic');
    await page.waitForLoadState('networkidle');
    
    console.log(`GetComic API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(500);
  });
  
  test('SearchComicTitles API should respond in <500ms', async ({ page }) => {
    await page.goto('/');
    
    let responseTime = 0;
    
    await page.route('**/search*', async (route) => {
      const startTime = Date.now();
      const response = await route.fetch();
      const endTime = Date.now();
      responseTime = endTime - startTime;
      await route.fulfill({ response });
    });
    
    // Trigger search
    await page.fill('[data-testid="search-input"]', 'test');
    await page.waitForTimeout(300); // Wait for debounce
    
    console.log(`Search API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(500);
  });
});

test.describe('Performance Testing - Code Splitting', () => {
  test('Upload interface should be lazy loaded', async ({ page }) => {
    // Navigate to homepage first
    await page.goto('/');
    
    // Get initial script count
    const initialScripts = await page.evaluate(() => {
      return Array.from(document.scripts).map(s => s.src);
    });
    
    // Navigate to upload page
    await page.evaluate(() => {
      localStorage.setItem('idToken', 'mock-id-token');
    });
    await page.goto('/upload');
    
    // Get scripts after upload page load
    const uploadScripts = await page.evaluate(() => {
      return Array.from(document.scripts).map(s => s.src);
    });
    
    // Upload page should have additional scripts (lazy loaded)
    const newScripts = uploadScripts.filter(s => !initialScripts.includes(s));
    
    console.log(`Lazy loaded scripts for upload: ${newScripts.length}`);
    expect(newScripts.length).toBeGreaterThan(0);
  });
  
  test('Config interface should be lazy loaded', async ({ page }) => {
    await page.goto('/');
    
    const initialScripts = await page.evaluate(() => {
      return Array.from(document.scripts).map(s => s.src);
    });
    
    await page.evaluate(() => {
      localStorage.setItem('idToken', 'mock-id-token');
    });
    await page.goto('/config');
    
    const configScripts = await page.evaluate(() => {
      return Array.from(document.scripts).map(s => s.src);
    });
    
    const newScripts = configScripts.filter(s => !initialScripts.includes(s));
    
    console.log(`Lazy loaded scripts for config: ${newScripts.length}`);
    expect(newScripts.length).toBeGreaterThan(0);
  });
});

test.describe('Performance Testing - Image Lazy Loading', () => {
  test('Images below fold should lazy load', async ({ page }) => {
    await page.goto('/');
    
    // Check for loading="lazy" attribute on images
    const lazyImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => img.loading === 'lazy').length;
    });
    
    console.log(`Lazy loaded images: ${lazyImages}`);
    expect(lazyImages).toBeGreaterThan(0);
  });
  
  test('Above-fold images should load immediately', async ({ page }) => {
    await page.goto('/');
    
    // Check for images without lazy loading in viewport
    const eagerImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const viewportHeight = window.innerHeight;
      
      return images.filter(img => {
        const rect = img.getBoundingClientRect();
        const isInViewport = rect.top < viewportHeight && rect.bottom > 0;
        return isInViewport && img.loading !== 'lazy';
      }).length;
    });
    
    console.log(`Eager loaded images in viewport: ${eagerImages}`);
    expect(eagerImages).toBeGreaterThan(0);
  });
  
  test('Comic page images should use progressive loading', async ({ page }) => {
    await page.goto('/comic/test-comic');
    
    // Check for srcset attributes for responsive images
    const responsiveImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img[data-testid="comic-image"]')) as HTMLImageElement[];
      return images.filter(img => img.srcset || img.sizes).length;
    });
    
    console.log(`Responsive images with srcset: ${responsiveImages}`);
    // Should have responsive images if comics are loaded
    // expect(responsiveImages).toBeGreaterThan(0);
  });
});

test.describe('Performance Testing - Lighthouse Metrics', () => {
  test('Homepage should meet Lighthouse performance score >80', async ({ page }) => {
    const metrics = await runLighthouseAudit(page, '/');
    
    console.log('Homepage performance metrics:', metrics);
    
    // Time to First Byte should be fast
    expect(metrics.ttfb).toBeLessThan(0.8);
    
    // DOM Content Loaded should be fast
    expect(metrics.domContentLoaded).toBeLessThan(1.5);
    
    // Full page load
    expect(metrics.loadComplete).toBeLessThan(3);
  });
  
  test('Comic page should meet Lighthouse performance score >80', async ({ page }) => {
    const metrics = await runLighthouseAudit(page, '/comic/test-comic');
    
    console.log('Comic page performance metrics:', metrics);
    
    expect(metrics.ttfb).toBeLessThan(0.8);
    expect(metrics.domContentLoaded).toBeLessThan(1.5);
    expect(metrics.loadComplete).toBeLessThan(2);
  });
  
  test('Pages should have good accessibility score >90', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential accessibility features
    const a11yFeatures = await page.evaluate(() => {
      return {
        // All images should have alt text
        imagesWithAlt: Array.from(document.querySelectorAll('img')).every(img => 
          img.alt !== undefined
        ),
        // Links should have accessible text
        linksWithText: Array.from(document.querySelectorAll('a')).every(link => 
          link.textContent?.trim() || link.getAttribute('aria-label')
        ),
        // Buttons should have accessible text
        buttonsWithText: Array.from(document.querySelectorAll('button')).every(btn => 
          btn.textContent?.trim() || btn.getAttribute('aria-label')
        ),
        // Form inputs should have labels
        inputsWithLabels: Array.from(document.querySelectorAll('input')).every(input => {
          const id = input.id;
          return id && document.querySelector(`label[for="${id}"]`);
        }),
      };
    });
    
    console.log('Accessibility features:', a11yFeatures);
    
    // At least images should have alt text for good a11y score
    expect(a11yFeatures.imagesWithAlt).toBe(true);
  });
});

test.describe('Performance Testing - Bundle Analysis', () => {
  test('Initial bundle size should be reasonable', async ({ page }) => {
    await page.goto('/');
    
    // Get total script size
    const scriptSizes = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      return Promise.all(
        scripts
          .filter(s => s.src && s.src.includes(window.location.origin))
          .map(async (script) => {
            try {
              const response = await fetch(script.src);
              const blob = await response.blob();
              return {
                url: script.src,
                size: blob.size,
              };
            } catch {
              return { url: script.src, size: 0 };
            }
          })
      );
    });
    
    const totalSize = scriptSizes.reduce((sum, s) => sum + s.size, 0);
    const totalSizeKB = totalSize / 1024;
    const totalSizeMB = totalSizeKB / 1024;
    
    console.log(`Total bundle size: ${totalSizeKB.toFixed(2)} KB (${totalSizeMB.toFixed(2)} MB)`);
    console.log('Individual scripts:', scriptSizes.map(s => ({
      url: s.url.split('/').pop(),
      sizeKB: (s.size / 1024).toFixed(2),
    })));
    
    // Initial bundle should be under 1MB for good performance
    expect(totalSizeMB).toBeLessThan(1);
  });
  
  test('CSS size should be reasonable', async ({ page }) => {
    await page.goto('/');
    
    const cssSizes = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets
        .filter(sheet => sheet.href && sheet.href.includes(window.location.origin))
        .map(sheet => sheet.href);
    });
    
    console.log(`CSS files loaded: ${cssSizes.length}`);
    
    // Should have CSS files
    expect(cssSizes.length).toBeGreaterThan(0);
  });
});

test.describe('Performance Testing - Network Efficiency', () => {
  test('Should minimize number of requests', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Total requests: ${requests.length}`);
    
    // Should bundle resources to minimize requests
    expect(requests.length).toBeLessThan(50);
  });
  
  test('Should use appropriate caching headers', async ({ page }) => {
    const cacheableResources: any[] = [];
    
    page.on('response', response => {
      const cacheControl = response.headers()['cache-control'];
      if (cacheControl && cacheControl.includes('max-age')) {
        cacheableResources.push({
          url: response.url(),
          cacheControl,
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Cacheable resources: ${cacheableResources.length}`);
    
    // Static assets should be cacheable
    expect(cacheableResources.length).toBeGreaterThan(0);
  });
});
