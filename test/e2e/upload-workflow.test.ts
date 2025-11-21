import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * E2E tests for the complete upload workflow
 * Constitutional Compliance: Artist-First - validates complete artist workflow meets <5min target
 */

// Mock authentication for tests
test.beforeEach(async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Mock authentication tokens
  await page.evaluate(() => {
    localStorage.setItem('idToken', 'mock-id-token');
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
  });
  
  // Navigate to upload page
  await page.goto('/upload');
});

test.describe('Upload Workflow - Complete Flow', () => {
  test('should complete full upload workflow within 5 minutes', async ({ page }) => {
    const startTime = Date.now();
    
    // Step 1: Upload files
    await test.step('Upload comic image files', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([
        {
          name: 'panel-1.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data-1'),
        },
        {
          name: 'panel-2.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data-2'),
        },
        {
          name: 'panel-3.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data-3'),
        },
      ]);
      
      // Wait for upload preview
      await expect(page.locator('[data-testid="image-preview"]')).toHaveCount(3);
    });
    
    // Step 2: Fill in metadata
    await test.step('Enter comic metadata', async () => {
      // Title
      await page.fill('[data-testid="title-input"]', 'Test Comic Title');
      
      // Caption with references
      await page.fill('[data-testid="caption-input"]', 'This comic references [[Previous Comic]] and [[Another Comic]]');
      
      // Series (optional)
      await page.fill('[data-testid="series-input"]', 'Test Series');
      
      // Tags
      await page.fill('[data-testid="tags-input"]', 'tag1, tag2, test-tag');
      
      // Publish date
      await page.fill('[data-testid="publish-date"]', '2025-01-15');
      
      // Scroll style
      await page.selectOption('[data-testid="scroll-style"]', 'carousel');
    });
    
    // Step 3: Reorder panels
    await test.step('Reorder image panels', async () => {
      // Get panel elements
      const panels = page.locator('[data-testid="image-panel"]');
      
      // Drag panel 3 to position 1
      const panel3 = panels.nth(2);
      const panel1 = panels.nth(0);
      
      await panel3.dragTo(panel1);
      
      // Verify new order
      await expect(panels.nth(0)).toContainText('panel-3.jpg');
    });
    
    // Step 4: Select thumbnail
    await test.step('Select thumbnail image', async () => {
      // Click on second panel to set as thumbnail
      await page.click('[data-testid="image-panel"]:nth-child(2) [data-testid="set-thumbnail"]');
      
      // Verify thumbnail selected
      await expect(page.locator('[data-testid="thumbnail-indicator"]')).toBeVisible();
    });
    
    // Step 5: Add alt text to images
    await test.step('Add alt text to images', async () => {
      // Click on first image
      await page.click('[data-testid="image-panel"]:nth-child(1)');
      
      // Fill alt text
      await page.fill('[data-testid="alt-text-input"]', 'Hero discovering their powers');
      
      // Click on second image
      await page.click('[data-testid="image-panel"]:nth-child(2)');
      await page.fill('[data-testid="alt-text-input"]', 'Villain appears in shadows');
      
      // Click on third image
      await page.click('[data-testid="image-panel"]:nth-child(3)');
      await page.fill('[data-testid="alt-text-input"]', 'Epic confrontation scene');
    });
    
    // Step 6: Test caption reference autocomplete
    await test.step('Test caption reference autocomplete', async () => {
      const captionInput = page.locator('[data-testid="caption-input"]');
      
      // Click in caption to trigger autocomplete
      await captionInput.click();
      await captionInput.press('End'); // Move to end
      await captionInput.type(' [[');
      
      // Wait for autocomplete dropdown
      await expect(page.locator('[data-testid="autocomplete-dropdown"]')).toBeVisible();
      
      // Verify suggestions appear
      await expect(page.locator('[data-testid="autocomplete-option"]')).toHaveCount(2); // Previous and Another Comic
    });
    
    // Step 7: Submit upload
    await test.step('Submit comic upload', async () => {
      // Click publish button
      await page.click('[data-testid="publish-button"]');
      
      // Wait for success message
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    });
    
    // Step 8: Verify relationships created
    await test.step('Verify bidirectional relationships', async () => {
      // Navigate to the newly created comic
      await page.click('[data-testid="view-comic-link"]');
      
      // Verify related comics section exists
      await expect(page.locator('[data-testid="related-comics"]')).toBeVisible();
      
      // Verify caption references are rendered as links
      await expect(page.locator('a:has-text("Previous Comic")')).toBeVisible();
      await expect(page.locator('a:has-text("Another Comic")')).toBeVisible();
    });
    
    // Measure workflow time
    const endTime = Date.now();
    const workflowTime = (endTime - startTime) / 1000; // Convert to seconds
    const workflowMinutes = workflowTime / 60;
    
    console.log(`Upload workflow completed in ${workflowMinutes.toFixed(2)} minutes`);
    
    // Constitutional requirement: workflow should complete in <5 minutes
    expect(workflowMinutes).toBeLessThan(5);
  });
});

test.describe('Upload Workflow - Validation Errors', () => {
  test('should show validation error for missing title', async ({ page }) => {
    // Try to submit without title
    await page.click('[data-testid="publish-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Title is required');
  });
  
  test('should show validation error for title too long', async ({ page }) => {
    // Enter title exceeding 200 characters
    const longTitle = 'A'.repeat(201);
    await page.fill('[data-testid="title-input"]', longTitle);
    
    await page.click('[data-testid="publish-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('must be at most 200 characters');
  });
  
  test('should show validation error for invalid file type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload unsupported file type
    await fileInput.setInputFiles([
      {
        name: 'document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fake-pdf-data'),
      },
    ]);
    
    // Should show error message
    await expect(page.locator('[data-testid="file-error"]')).toContainText('Only JPEG, PNG, and WebP images are supported');
  });
  
  test('should show validation error for file too large', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload file >20MB
    const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21MB
    await fileInput.setInputFiles([
      {
        name: 'huge-image.jpg',
        mimeType: 'image/jpeg',
        buffer: largeBuffer,
      },
    ]);
    
    // Should show error message
    await expect(page.locator('[data-testid="file-error"]')).toContainText('exceeds 20MB limit');
  });
  
  test('should show validation error for too many images', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload 21 images (max is 20)
    const files = Array.from({ length: 21 }, (_, i) => ({
      name: `panel-${i + 1}.jpg`,
      mimeType: 'image/jpeg',
      buffer: Buffer.from(`fake-image-data-${i + 1}`),
    }));
    
    await fileInput.setInputFiles(files);
    
    // Should show error message
    await expect(page.locator('[data-testid="file-error"]')).toContainText('Maximum 20 images allowed');
  });
  
  test('should show validation error for invalid tag characters', async ({ page }) => {
    // Upload a valid file first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'panel-1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      },
    ]);
    
    // Fill valid title
    await page.fill('[data-testid="title-input"]', 'Test Comic');
    
    // Enter invalid tags
    await page.fill('[data-testid="tags-input"]', 'valid-tag, invalid@tag, another#tag');
    
    await page.click('[data-testid="publish-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Tags can only contain letters, numbers, hyphens, and underscores');
  });
});

test.describe('Upload Workflow - Network Failure Recovery', () => {
  test('should handle network failure gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true);
    
    // Try to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'panel-1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      },
    ]);
    
    await page.fill('[data-testid="title-input"]', 'Test Comic');
    await page.click('[data-testid="publish-button"]');
    
    // Should show network error
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('network error');
    
    // Restore connection
    await page.context().setOffline(false);
    
    // Retry button should be available
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Click retry
    await page.click('[data-testid="retry-button"]');
    
    // Should eventually succeed
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
  });
  
  test('should preserve form data after network failure', async ({ page }) => {
    // Fill form
    await page.fill('[data-testid="title-input"]', 'My Comic Title');
    await page.fill('[data-testid="caption-input"]', 'A story about heroes');
    await page.fill('[data-testid="series-input"]', 'Hero Series');
    
    // Simulate network failure
    await page.context().setOffline(true);
    await page.click('[data-testid="publish-button"]');
    
    // Wait for error
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    
    // Verify form data is still there
    await expect(page.locator('[data-testid="title-input"]')).toHaveValue('My Comic Title');
    await expect(page.locator('[data-testid="caption-input"]')).toHaveValue('A story about heroes');
    await expect(page.locator('[data-testid="series-input"]')).toHaveValue('Hero Series');
  });
});

test.describe('Upload Workflow - Panel Reordering', () => {
  test('should allow drag-and-drop reordering of panels', async ({ page }) => {
    // Upload 4 panels
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: 'panel-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-1') },
      { name: 'panel-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-2') },
      { name: 'panel-3.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-3') },
      { name: 'panel-4.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-4') },
    ]);
    
    // Wait for all panels to appear
    await expect(page.locator('[data-testid="image-panel"]')).toHaveCount(4);
    
    // Get initial order
    const initialOrder = await page.locator('[data-testid="image-panel"] [data-testid="filename"]').allTextContents();
    expect(initialOrder).toEqual(['panel-1.jpg', 'panel-2.jpg', 'panel-3.jpg', 'panel-4.jpg']);
    
    // Drag panel-4 to position 1
    const panel4 = page.locator('[data-testid="image-panel"]:has-text("panel-4.jpg")');
    const panel1 = page.locator('[data-testid="image-panel"]:has-text("panel-1.jpg")');
    await panel4.dragTo(panel1);
    
    // Verify new order
    const newOrder = await page.locator('[data-testid="image-panel"] [data-testid="filename"]').allTextContents();
    expect(newOrder[0]).toBe('panel-4.jpg');
  });
  
  test('should allow removing individual panels', async ({ page }) => {
    // Upload panels
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: 'panel-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-1') },
      { name: 'panel-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-2') },
      { name: 'panel-3.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-3') },
    ]);
    
    await expect(page.locator('[data-testid="image-panel"]')).toHaveCount(3);
    
    // Remove middle panel
    await page.click('[data-testid="image-panel"]:nth-child(2) [data-testid="remove-panel"]');
    
    // Should have 2 panels remaining
    await expect(page.locator('[data-testid="image-panel"]')).toHaveCount(2);
    
    // Verify correct panels remain
    const remainingFiles = await page.locator('[data-testid="image-panel"] [data-testid="filename"]').allTextContents();
    expect(remainingFiles).toEqual(['panel-1.jpg', 'panel-3.jpg']);
  });
});

test.describe('Upload Workflow - Alt Text', () => {
  test('should allow adding alt text to each image', async ({ page }) => {
    // Upload panels
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: 'panel-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-1') },
      { name: 'panel-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-2') },
    ]);
    
    await expect(page.locator('[data-testid="image-panel"]')).toHaveCount(2);
    
    // Add alt text to first panel
    await page.click('[data-testid="image-panel"]:nth-child(1)');
    await page.fill('[data-testid="alt-text-input"]', 'Description of first panel');
    
    // Add alt text to second panel
    await page.click('[data-testid="image-panel"]:nth-child(2)');
    await page.fill('[data-testid="alt-text-input"]', 'Description of second panel');
    
    // Verify alt text is saved
    await page.click('[data-testid="image-panel"]:nth-child(1)');
    await expect(page.locator('[data-testid="alt-text-input"]')).toHaveValue('Description of first panel');
  });
  
  test('should validate alt text length', async ({ page }) => {
    // Upload panel
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: 'panel-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-1') },
    ]);
    
    // Try to add alt text exceeding 500 characters
    const longAltText = 'A'.repeat(501);
    await page.click('[data-testid="image-panel"]:nth-child(1)');
    await page.fill('[data-testid="alt-text-input"]', longAltText);
    
    // Should show validation error
    await expect(page.locator('[data-testid="alt-text-error"]')).toContainText('must be at most 500 characters');
  });
});

test.describe('Upload Workflow - Thumbnail Selection', () => {
  test('should allow selecting any panel as thumbnail', async ({ page }) => {
    // Upload panels
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: 'panel-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-1') },
      { name: 'panel-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-2') },
      { name: 'panel-3.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-3') },
    ]);
    
    // Select panel 2 as thumbnail
    await page.click('[data-testid="image-panel"]:nth-child(2) [data-testid="set-thumbnail"]');
    
    // Verify thumbnail indicator appears on panel 2
    await expect(page.locator('[data-testid="image-panel"]:nth-child(2) [data-testid="thumbnail-indicator"]')).toBeVisible();
    
    // Change to panel 3
    await page.click('[data-testid="image-panel"]:nth-child(3) [data-testid="set-thumbnail"]');
    
    // Verify thumbnail indicator moved to panel 3
    await expect(page.locator('[data-testid="image-panel"]:nth-child(3) [data-testid="thumbnail-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-panel"]:nth-child(2) [data-testid="thumbnail-indicator"]')).not.toBeVisible();
  });
  
  test('should default to first panel as thumbnail', async ({ page }) => {
    // Upload panels
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: 'panel-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-1') },
      { name: 'panel-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('data-2') },
    ]);
    
    // First panel should have thumbnail indicator by default
    await expect(page.locator('[data-testid="image-panel"]:nth-child(1) [data-testid="thumbnail-indicator"]')).toBeVisible();
  });
});
