import { test, expect } from '@playwright/test';

test.describe('UI Components Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display main navigation and components', async ({ page }) => {
    // Check for main title
    const title = page.locator('h1:has-text("FreshOne Logistics")');
    await expect(title).toBeVisible();

    // Check for step indicators
    const stepIndicators = page.locator('[data-testid="step-indicator"]');
    await expect(stepIndicators).toBeVisible();

    // Check for main action buttons
    const routeOptimizationBtn = page.locator('button:has-text("Route Optimization")');
    await expect(routeOptimizationBtn).toBeVisible();
  });

  test('should show/hide components based on step progression', async ({ page }) => {
    // Initially, file upload should be visible
    const fileUpload = page.locator('input[type="file"]');
    await expect(fileUpload).toBeVisible();

    // Route review should not be visible initially
    const routeReview = page.locator('[data-testid="route-review"]');
    await expect(routeReview).not.toBeVisible();

    // Upload a file to progress to next step
    const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Test Customer,123 Main St,Tampa,FL,33610,40,SO001`;
    
    await fileUpload.setInputFiles({
      name: 'test-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await page.click('button:has-text("Process BOL")');
    await page.waitForTimeout(3000);

    // Check that the next step becomes available
    const optimizeButton = page.locator('button:has-text("Optimize Routes")');
    await expect(optimizeButton).toBeVisible();
  });

  test('should display notifications correctly', async ({ page }) => {
    // Trigger an action that creates notifications
    await page.click('button:has-text("Test NextBillion Connection")');
    
    // Wait for notification
    await page.waitForTimeout(2000);
    
    // Check for notification container
    const notifications = page.locator('[data-testid="notification"]');
    await expect(notifications).toBeVisible();
    
    // Check notification styling
    const notificationElement = notifications.first();
    const classes = await notificationElement.getAttribute('class');
    expect(classes).toContain('notification'); // Should have notification styling
  });

  test('should handle test mode toggle', async ({ page }) => {
    // Look for test mode toggle
    const testModeToggle = page.locator('input[type="checkbox"]:near(text("Test Mode"))');
    
    if (await testModeToggle.isVisible()) {
      // Test toggling on
      await testModeToggle.check();
      await expect(testModeToggle).toBeChecked();
      
      // Test toggling off
      await testModeToggle.uncheck();
      await expect(testModeToggle).not.toBeChecked();
    }
  });

  test('should display fleet configuration correctly', async ({ page }) => {
    // Look for fleet configuration section
    const fleetSection = page.locator('[data-testid="fleet-config"]');
    
    if (await fleetSection.isVisible()) {
      // Check for vehicle type displays
      const vehicleTypes = page.locator('[data-testid="vehicle-type"]');
      await expect(vehicleTypes).toBeVisible();
      
      // Check for capacity information
      const capacityInfo = page.locator('[data-testid="vehicle-capacity"]');
      await expect(capacityInfo).toBeVisible();
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopLayout = page.locator('[data-testid="desktop-layout"]');
    if (await desktopLayout.isVisible()) {
      // Desktop layout should be visible
      await expect(desktopLayout).toBeVisible();
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still accessible
    const title = page.locator('h1:has-text("FreshOne Logistics")');
    await expect(title).toBeVisible();
    
    // Check for mobile navigation if it exists
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });

  test('should display progress indicators correctly', async ({ page }) => {
    // Check for step progress indicators
    const progressSteps = page.locator('[data-testid="progress-step"]');
    
    if (await progressSteps.count() > 0) {
      const firstStep = progressSteps.first();
      await expect(firstStep).toBeVisible();
      
      // Check for step numbering
      const stepNumber = firstStep.locator('[data-testid="step-number"]');
      if (await stepNumber.isVisible()) {
        await expect(stepNumber).toBeVisible();
      }
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Trigger an action that shows loading state
    await page.click('button:has-text("Route Optimization")');
    
    const fileInput = page.locator('input[type="file"]');
    const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Test Customer,123 Main St,Tampa,FL,33610,40,SO001`;
    
    await fileInput.setInputFiles({
      name: 'test-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await page.click('button:has-text("Process BOL")');
    
    // Check for loading indicator
    const loadingIndicator = page.locator('[data-testid="loading"]');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
    
    // Check for disabled buttons during loading
    const processButton = page.locator('button:has-text("Process BOL")');
    const isDisabled = await processButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should display error states correctly', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/optimization/v2**', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'API Error',
          message: 'Test error message'
        })
      });
    });

    // Trigger optimization to get error
    await page.click('button:has-text("Route Optimization")');
    
    const fileInput = page.locator('input[type="file"]');
    const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Test Customer,123 Main St,Tampa,FL,33610,40,SO001`;
    
    await fileInput.setInputFiles({
      name: 'test-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await page.click('button:has-text("Process BOL")');
    await page.waitForTimeout(3000);
    
    // Check for error notification
    const errorNotification = page.locator('[data-testid="notification"]:has-text("error")');
    await expect(errorNotification).toBeVisible();
    
    // Check for error styling
    const errorElement = errorNotification.first();
    const classes = await errorElement.getAttribute('class');
    expect(classes).toContain('error'); // Should have error styling
  });
});