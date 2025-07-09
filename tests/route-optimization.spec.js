import { test, expect } from '@playwright/test';

test.describe('Route Optimization Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full route optimization workflow', async ({ page }) => {
    // Step 1: Upload BOL file
    await page.click('button:has-text("Route Optimization")');
    
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Create test CSV data
    const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Walmart,1234 Main St,Tampa,FL,33610,40,SO001
Target,5678 Oak Ave,Tampa,FL,33611,80,SO002
Publix,9012 Pine St,Tampa,FL,33612,60,SO003
Winn-Dixie,3456 Elm Dr,Tampa,FL,33613,120,SO004`;
    
    await fileInput.setInputFiles({
      name: 'test-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Step 2: Process BOL
    await page.click('button:has-text("Process BOL")');
    
    // Wait for processing to complete
    await page.waitForTimeout(5000);
    
    // Check for success notification
    const processNotification = page.locator('[data-testid="notification"]');
    await expect(processNotification).toBeVisible();

    // Step 3: Optimize Routes
    const optimizeButton = page.locator('button:has-text("Optimize Routes")');
    if (await optimizeButton.isVisible()) {
      await optimizeButton.click();
      
      // Wait for optimization to complete
      await page.waitForTimeout(10000);
      
      // Check for optimization complete notification
      const optimizeNotification = page.locator('[data-testid="notification"]:has-text("optimization")');
      await expect(optimizeNotification).toBeVisible();
    }

    // Step 4: Review optimized routes
    const routeCards = page.locator('[data-testid="route-card"]');
    await expect(routeCards).toBeVisible();
    
    // Check that routes are displayed
    const routeCount = await routeCards.count();
    expect(routeCount).toBeGreaterThan(0);

    // Step 5: Approve routes
    const approveButton = page.locator('button:has-text("Approve Routes")');
    if (await approveButton.isVisible()) {
      await approveButton.click();
      
      // Wait for approval
      await page.waitForTimeout(2000);
      
      // Check for approval notification
      const approvalNotification = page.locator('[data-testid="notification"]:has-text("approved")');
      await expect(approvalNotification).toBeVisible();
    }
  });

  test('should validate route compliance with USDOT limits', async ({ page }) => {
    // Set up network interception to capture route data
    let routeData = null;
    
    page.on('response', async response => {
      if (response.url().includes('optimization/v2') && response.status() === 200) {
        routeData = await response.json();
      }
    });

    // Upload and process test data
    await page.click('button:has-text("Route Optimization")');
    
    const fileInput = page.locator('input[type="file"]');
    const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Customer1,123 Main St,Tampa,FL,33610,40,SO001
Customer2,456 Oak Ave,Tampa,FL,33611,80,SO002`;
    
    await fileInput.setInputFiles({
      name: 'test-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await page.click('button:has-text("Process BOL")');
    await page.waitForTimeout(5000);
    
    const optimizeButton = page.locator('button:has-text("Optimize Routes")');
    if (await optimizeButton.isVisible()) {
      await optimizeButton.click();
      await page.waitForTimeout(10000);
    }

    // Validate route compliance in UI
    const routeCards = page.locator('[data-testid="route-card"]');
    const routeCount = await routeCards.count();
    
    for (let i = 0; i < routeCount; i++) {
      const routeCard = routeCards.nth(i);
      
      // Check for time display
      const timeInfo = routeCard.locator('[data-testid="route-time"]');
      if (await timeInfo.isVisible()) {
        const timeText = await timeInfo.textContent();
        
        // Parse time and validate it's within USDOT limits
        const hours = parseFloat(timeText.match(/(\d+\.?\d*)\s*hour/i)?.[1] || '0');
        
        // Route should not exceed 11 hours of driving time
        expect(hours).toBeLessThanOrEqual(11);
      }
      
      // Check for distance display
      const distanceInfo = routeCard.locator('[data-testid="route-distance"]');
      if (await distanceInfo.isVisible()) {
        const distanceText = await distanceInfo.textContent();
        const distance = parseFloat(distanceText.match(/(\d+\.?\d*)\s*km/i)?.[1] || '0');
        
        // Distance should be reasonable (not excessive)
        expect(distance).toBeLessThan(500); // 500km max per route
      }
    }
  });

  test('should handle test mode correctly', async ({ page }) => {
    // Enable test mode
    const testModeToggle = page.locator('input[type="checkbox"]:near(text("Test Mode"))');
    if (await testModeToggle.isVisible()) {
      await testModeToggle.check();
    }

    // Run optimization in test mode
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
    
    // Check for test mode notification
    const testModeNotification = page.locator('[data-testid="notification"]:has-text("TEST MODE")');
    await expect(testModeNotification).toBeVisible();
  });

  test('should display route statistics correctly', async ({ page }) => {
    // Complete basic optimization workflow
    await page.click('button:has-text("Route Optimization")');
    
    const fileInput = page.locator('input[type="file"]');
    const csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Customer1,123 Main St,Tampa,FL,33610,40,SO001
Customer2,456 Oak Ave,Tampa,FL,33611,80,SO002
Customer3,789 Pine St,Tampa,FL,33612,60,SO003`;
    
    await fileInput.setInputFiles({
      name: 'test-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    await page.click('button:has-text("Process BOL")');
    await page.waitForTimeout(5000);
    
    const optimizeButton = page.locator('button:has-text("Optimize Routes")');
    if (await optimizeButton.isVisible()) {
      await optimizeButton.click();
      await page.waitForTimeout(10000);
    }

    // Check for route statistics
    const routeCards = page.locator('[data-testid="route-card"]');
    await expect(routeCards).toBeVisible();
    
    const firstRoute = routeCards.first();
    
    // Check for driver assignment
    const driverInfo = firstRoute.locator('[data-testid="driver-name"]');
    await expect(driverInfo).toBeVisible();
    
    // Check for vehicle assignment
    const vehicleInfo = firstRoute.locator('[data-testid="vehicle-name"]');
    await expect(vehicleInfo).toBeVisible();
    
    // Check for stop count
    const stopCount = firstRoute.locator('[data-testid="stop-count"]');
    await expect(stopCount).toBeVisible();
    
    // Check for estimated fuel cost
    const fuelCost = firstRoute.locator('[data-testid="fuel-cost"]');
    await expect(fuelCost).toBeVisible();
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Create a larger test dataset
    let csvContent = `Customer_Name,Address,City,State,Zip,Cases,SO_Number\n`;
    for (let i = 1; i <= 20; i++) {
      csvContent += `Customer${i},${100 + i} Main St,Tampa,FL,3361${i % 10},${20 + (i * 5)},SO${String(i).padStart(3, '0')}\n`;
    }

    await page.click('button:has-text("Route Optimization")');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Set a longer timeout for large dataset processing
    await page.click('button:has-text("Process BOL")');
    await page.waitForTimeout(10000);
    
    // Check that processing completed
    const processNotification = page.locator('[data-testid="notification"]');
    await expect(processNotification).toBeVisible();
    
    // Check for geocoding results
    const geocodedCount = page.locator('[data-testid="geocoded-count"]');
    if (await geocodedCount.isVisible()) {
      const countText = await geocodedCount.textContent();
      expect(countText).toContain('20'); // Should show 20 locations processed
    }
  });
});