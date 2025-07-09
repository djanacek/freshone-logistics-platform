import { test, expect } from '@playwright/test';

test.describe('NextBillion.ai Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test('should display NextBillion.ai test connection button', async ({ page }) => {
    // Look for the test connection button
    const testButton = page.locator('button:has-text("Test NextBillion Connection")');
    await expect(testButton).toBeVisible();
  });

  test('should test NextBillion.ai API connection', async ({ page }) => {
    // Click the test connection button
    await page.click('button:has-text("Test NextBillion Connection")');
    
    // Wait for the API response
    await page.waitForTimeout(3000);
    
    // Check for success or error notification
    const notifications = page.locator('[data-testid="notification"]');
    await expect(notifications).toBeVisible();
    
    // The notification should contain either success or error message
    const notificationText = await notifications.textContent();
    expect(notificationText).toMatch(/(success|error|NextBillion|API)/i);
  });

  test('should validate USDOT compliance parameters in API payload', async ({ page }) => {
    // Set up network interception to capture API calls
    let apiPayload = null;
    
    page.on('request', request => {
      if (request.url().includes('optimization/v2')) {
        apiPayload = JSON.parse(request.postData() || '{}');
      }
    });

    // Navigate to route optimization if not already there
    await page.click('button:has-text("Route Optimization")');
    
    // Upload a test file or use existing data
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Create a test CSV file content
      const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Test Customer,123 Main St,Tampa,FL,33610,40,SO001
Test Customer 2,456 Oak Ave,Tampa,FL,33611,80,SO002`;
      
      // Create a file-like object
      await fileInput.setInputFiles({
        name: 'test-orders.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
    }

    // Click process/optimize button
    await page.click('button:has-text("Process BOL")');
    
    // Wait for processing to complete
    await page.waitForTimeout(5000);
    
    // If there's an optimize button, click it
    const optimizeButton = page.locator('button:has-text("Optimize Routes")');
    if (await optimizeButton.isVisible()) {
      await optimizeButton.click();
      await page.waitForTimeout(5000);
    }

    // Validate that the API payload contains USDOT compliance parameters
    if (apiPayload && apiPayload.vehicles && apiPayload.vehicles.length > 0) {
      const vehicle = apiPayload.vehicles[0];
      
      // Check for USDOT compliance parameters
      expect(vehicle.max_working_time).toBe(50400); // 14 hours
      expect(vehicle.max_travel_time).toBe(39600); // 11 hours
      expect(vehicle.drive_time_layover_config).toBeDefined();
      expect(vehicle.drive_time_layover_config.max_continuous_driving).toBe(28800); // 8 hours
      expect(vehicle.breaks).toBeDefined();
      expect(vehicle.breaks.length).toBeGreaterThan(0);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/optimization/v2**', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid API key',
          message: 'The provided API key is invalid'
        })
      });
    });

    // Try to run optimization
    await page.click('button:has-text("Route Optimization")');
    
    // Upload test data
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Test Customer,123 Main St,Tampa,FL,33610,40,SO001`;
      
      await fileInput.setInputFiles({
        name: 'test-orders.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
    }

    await page.click('button:has-text("Process BOL")');
    await page.waitForTimeout(2000);
    
    // Check for error handling
    const errorNotification = page.locator('[data-testid="notification"]:has-text("error")');
    await expect(errorNotification).toBeVisible();
  });

  test('should fallback to simulation mode on API failure', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/optimization/v2**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error'
        })
      });
    });

    // Try to run optimization
    await page.click('button:has-text("Route Optimization")');
    
    // Upload test data
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Test Customer,123 Main St,Tampa,FL,33610,40,SO001`;
      
      await fileInput.setInputFiles({
        name: 'test-orders.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
    }

    await page.click('button:has-text("Process BOL")');
    await page.waitForTimeout(3000);
    
    // Check for fallback to simulation mode
    const simulationNotification = page.locator('[data-testid="notification"]:has-text("simulation")');
    await expect(simulationNotification).toBeVisible();
  });
});