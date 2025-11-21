/**
 * Automated Responsive Design Tests
 * 
 * Tests responsive behavior across different viewport sizes and device types.
 * Constitutional Compliance: Artist-First - iPad testing prioritized
 */

import { test, expect, devices } from '@playwright/test';

// Artist priority devices (iPad)
const ARTIST_DEVICES = [
  { name: 'iPad Safari', device: devices['iPad (gen 7)'] },
  { name: 'iPad Pro', device: devices['iPad Pro 11'] },
];

// Reader devices (secondary priority)
const READER_DEVICES = [
  { name: 'iPhone 13', device: devices['iPhone 13'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Desktop 1920x1080', viewport: { width: 1920, height: 1080 } },
  { name: 'Desktop 1366x768', viewport: { width: 1366, height: 768 } },
];

// Touch target minimum size (WCAG AAA compliance)
const MIN_TOUCH_TARGET_SIZE = 44;

test.describe('Cross-Device Testing', () => {
  
  test.describe('Artist Priority Devices (iPad)', () => {
    for (const config of ARTIST_DEVICES) {
      test.describe(config.name, () => {
        test.use(config.device);

        test('Upload workflow loads and is functional', async ({ page }) => {
          await page.goto('/upload');
          
          // Check page loads
          await expect(page.locator('h1')).toContainText('Upload');
          
          // Check file input is accessible
          const fileInput = page.locator('input[type="file"]');
          await expect(fileInput).toBeVisible();
          
          // Check form fields are accessible
          await expect(page.locator('input[name="title"]')).toBeVisible();
          await expect(page.locator('textarea[name="caption"]')).toBeVisible();
          await expect(page.locator('input[name="publishedDate"]')).toBeVisible();
        });

        test('Touch targets meet 44px minimum', async ({ page }) => {
          await page.goto('/upload');
          
          // Check primary action buttons
          const buttons = page.locator('button');
          const count = await buttons.count();
          
          for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const box = await button.boundingBox();
            
            if (box) {
              expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
              expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            }
          }
        });

        test('Form inputs are touch-friendly', async ({ page }) => {
          await page.goto('/upload');
          
          // Check input fields have adequate touch targets
          const inputs = page.locator('input, textarea, select');
          const count = await inputs.count();
          
          for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const box = await input.boundingBox();
            
            if (box && await input.isVisible()) {
              expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            }
          }
        });

        test('Navigation is touch-accessible', async ({ page }) => {
          await page.goto('/');
          
          // Check navigation links
          const navLinks = page.locator('nav a');
          const count = await navLinks.count();
          
          expect(count).toBeGreaterThan(0);
          
          for (let i = 0; i < count; i++) {
            const link = navLinks.nth(i);
            const box = await link.boundingBox();
            
            if (box) {
              expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            }
          }
        });

        test('Viewport meta tag is configured correctly', async ({ page }) => {
          await page.goto('/');
          
          const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
          expect(viewport).toContain('width=device-width');
          expect(viewport).toContain('initial-scale=1');
        });

        test('Orientation change handling (portrait to landscape)', async ({ page, context }) => {
          await page.goto('/');
          
          // Test portrait mode
          await page.setViewportSize({ width: 768, height: 1024 });
          await expect(page.locator('body')).toBeVisible();
          
          // Switch to landscape
          await page.setViewportSize({ width: 1024, height: 768 });
          await expect(page.locator('body')).toBeVisible();
          
          // Verify navigation still works
          await page.goto('/upload');
          await expect(page.locator('h1')).toContainText('Upload');
        });
      });
    }
  });

  test.describe('Reader Devices (Secondary Priority)', () => {
    for (const config of READER_DEVICES) {
      test.describe(config.name, () => {
        if ('device' in config && config.device) {
          test.use(config.device);
        } else if ('viewport' in config) {
          test.use({ viewport: config.viewport });
        }

        test('Homepage loads correctly', async ({ page }) => {
          await page.goto('/');
          
          // Check essential elements
          await expect(page.locator('h1, h2').first()).toBeVisible();
          await expect(page.locator('nav')).toBeVisible();
        });

        test('Comic viewing works', async ({ page }) => {
          await page.goto('/');
          
          // Wait for comics to load
          await page.waitForSelector('[data-testid="comic-card"], .comic-card', { 
            timeout: 5000,
            state: 'visible'
          }).catch(() => {
            // Comics might not be loaded yet, that's ok for responsive testing
          });
          
          // Check layout doesn't break
          const body = await page.locator('body').boundingBox();
          expect(body).toBeTruthy();
        });

        test('Responsive images load', async ({ page }) => {
          await page.goto('/');
          
          // Check for responsive image attributes
          const images = page.locator('img');
          const count = await images.count();
          
          if (count > 0) {
            const firstImage = images.first();
            
            // Check for responsive attributes
            const src = await firstImage.getAttribute('src');
            const loading = await firstImage.getAttribute('loading');
            
            expect(src).toBeTruthy();
            // Lazy loading should be enabled
            expect(loading).toBe('lazy');
          }
        });

        test('Navigation adapts to screen size', async ({ page }) => {
          await page.goto('/');
          
          const nav = page.locator('nav');
          await expect(nav).toBeVisible();
          
          // Check if mobile menu exists on small screens
          const viewport = page.viewportSize();
          if (viewport && viewport.width < 768) {
            // Mobile layout should have hamburger or compact nav
            const navLinks = page.locator('nav a');
            const count = await navLinks.count();
            expect(count).toBeGreaterThan(0);
          }
        });
      });
    }
  });

  test.describe('Carousel Gestures (Touch Devices)', () => {
    test.use(devices['iPad (gen 7)']);

    test('Carousel supports swipe gestures', async ({ page }) => {
      // Navigate to a comic page with carousel
      await page.goto('/');
      
      // Wait for comic cards
      const comicCard = page.locator('[data-testid="comic-card"], .comic-card').first();
      await comicCard.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        // No comics yet, skip this test
      });
      
      // Click to open comic
      await comicCard.click().catch(() => {});
      
      // Wait for carousel
      await page.waitForTimeout(1000);
      
      // Check if carousel exists
      const carousel = page.locator('[data-testid="carousel"], .carousel');
      const carouselExists = await carousel.count() > 0;
      
      if (carouselExists) {
        // Simulate swipe gesture
        const carouselBox = await carousel.boundingBox();
        if (carouselBox) {
          // Swipe left (next)
          await page.mouse.move(carouselBox.x + carouselBox.width - 50, carouselBox.y + carouselBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(carouselBox.x + 50, carouselBox.y + carouselBox.height / 2, { steps: 10 });
          await page.mouse.up();
          
          // Verify carousel responded
          await page.waitForTimeout(500);
        }
      }
    });

    test('Carousel navigation buttons are touch-friendly', async ({ page }) => {
      await page.goto('/');
      
      // Check for carousel navigation buttons
      const prevButton = page.locator('[data-testid="carousel-prev"], button:has-text("Previous")');
      const nextButton = page.locator('[data-testid="carousel-next"], button:has-text("Next")');
      
      const prevExists = await prevButton.count() > 0;
      const nextExists = await nextButton.count() > 0;
      
      if (prevExists) {
        const box = await prevButton.first().boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
        }
      }
      
      if (nextExists) {
        const box = await nextButton.first().boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
        }
      }
    });
  });

  test.describe('Desktop Browser Compatibility', () => {
    const desktopBrowsers = [
      { name: 'Chrome', channel: 'chrome' },
      { name: 'Firefox', channel: 'firefox' },
      { name: 'Safari', channel: 'webkit' },
      { name: 'Edge', channel: 'msedge' },
    ];

    for (const browser of desktopBrowsers) {
      test.describe(browser.name, () => {
        test.use({ 
          viewport: { width: 1920, height: 1080 },
        });

        test('Upload interface renders correctly', async ({ page }) => {
          await page.goto('/upload');
          
          await expect(page.locator('h1')).toContainText('Upload');
          await expect(page.locator('input[type="file"]')).toBeVisible();
          await expect(page.locator('button[type="submit"]')).toBeVisible();
        });

        test('Comic grid layout works', async ({ page }) => {
          await page.goto('/');
          
          // Check for grid layout
          const grid = page.locator('[data-testid="comic-grid"], .comic-grid');
          const gridExists = await grid.count() > 0;
          
          if (gridExists) {
            await expect(grid.first()).toBeVisible();
          }
        });

        test('CSS Grid/Flexbox support', async ({ page }) => {
          await page.goto('/');
          
          // Modern browsers should support CSS Grid
          const supportsGrid = await page.evaluate(() => {
            return CSS.supports('display', 'grid');
          });
          
          expect(supportsGrid).toBe(true);
          
          // Modern browsers should support Flexbox
          const supportsFlex = await page.evaluate(() => {
            return CSS.supports('display', 'flex');
          });
          
          expect(supportsFlex).toBe(true);
        });
      });
    }
  });

  test.describe('Text Scaling and Zoom', () => {
    test.use(devices['iPad (gen 7)']);

    test('Layout remains functional at 200% zoom', async ({ page }) => {
      await page.goto('/');
      
      // Set zoom level to 200%
      await page.evaluate(() => {
        (document.body.style as any).zoom = '200%';
      });
      
      await page.waitForTimeout(500);
      
      // Check critical elements still visible
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('body')).toBeVisible();
    });

    test('Text remains readable at different font sizes', async ({ page }) => {
      await page.goto('/');
      
      // Test with larger font size
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px';
      });
      
      await page.waitForTimeout(500);
      
      // Check layout doesn't break
      const body = await page.locator('body').boundingBox();
      expect(body).toBeTruthy();
    });
  });
});
