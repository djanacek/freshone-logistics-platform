import { chromium } from '@playwright/test';

async function debugRouteOptimization() {
  console.log('🔍 Starting Playwright debug of route optimization...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 1000 // Slow down for debugging
  });
  
  try {
    const page = await browser.newPage();
    
    // Intercept API calls to see what's being sent
    let apiPayload = null;
    let apiResponse = null;
    
    page.on('request', request => {
      if (request.url().includes('optimization/v2')) {
        console.log('📤 API Request intercepted:', request.url());
        try {
          apiPayload = JSON.parse(request.postData() || '{}');
          console.log('📋 API Payload vehicles:', apiPayload.vehicles?.slice(0, 2)); // Show first 2 vehicles
        } catch (e) {
          console.log('❌ Could not parse API payload');
        }
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('optimization/v2')) {
        console.log('📥 API Response received:', response.status());
        try {
          apiResponse = await response.json();
          console.log('📊 API Response routes:', apiResponse.routes?.length);
          if (apiResponse.routes) {
            apiResponse.routes.forEach((route, i) => {
              const hours = (route.duration / 3600).toFixed(2);
              const distance = (route.distance / 1000).toFixed(2);
              console.log(`Route ${i + 1}: ${hours} hours, ${distance} km, ${route.steps?.filter(s => s.type === 'job').length} stops`);
            });
          }
        } catch (e) {
          console.log('❌ Could not parse API response');
        }
      }
    });
    
    console.log('🌐 Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    console.log('🔄 Checking if app loaded...');
    await page.waitForSelector('h1:has-text("FreshOne Logistics")', { timeout: 5000 });
    
    console.log('✅ App loaded successfully');
    
    // Create test CSV data
    const testCSV = `Customer_Name,Address,City,State,Zip,Cases,SO_Number
Walmart Store #1,1234 Main St,Tampa,FL,33610,40,SO001
Target Store #2,5678 Oak Ave,Tampa,FL,33611,80,SO002
Publix #3,9012 Pine St,Tampa,FL,33612,60,SO003
Winn-Dixie #4,3456 Elm Dr,Tampa,FL,33613,120,SO004
CVS Pharmacy #5,7890 Maple Ave,Tampa,FL,33614,30,SO005
Walgreens #6,2345 Cedar St,Tampa,FL,33615,50,SO006
Kroger #7,6789 Birch Rd,Tampa,FL,33616,90,SO007
Home Depot #8,4567 Ash Ln,Tampa,FL,33617,70,SO008
Lowe's #9,8901 Willow Dr,Tampa,FL,33618,110,SO009
Best Buy #10,1357 Spruce St,Tampa,FL,33619,45,SO010`;
    
    console.log('📄 Creating test file...');
    const fileContent = new Blob([testCSV], { type: 'text/csv' });
    
    console.log('📤 Uploading test file...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-orders.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(testCSV)
    });
    
    console.log('🔄 Processing BOL...');
    await page.click('button:has-text("Process BOL")');
    
    // Wait for processing
    await page.waitForTimeout(5000);
    
    console.log('🚛 Looking for optimize button...');
    const optimizeButton = page.locator('button:has-text("Optimize Routes")');
    
    if (await optimizeButton.isVisible()) {
      console.log('✅ Optimize button found, clicking...');
      await optimizeButton.click();
      
      console.log('⏱️ Waiting for optimization to complete...');
      await page.waitForTimeout(10000);
      
      console.log('📊 Checking results...');
      
      // Check for route cards
      const routeCards = page.locator('[data-testid="route-card"]');
      const routeCount = await routeCards.count();
      console.log(`📈 Found ${routeCount} route cards`);
      
      if (routeCount > 0) {
        for (let i = 0; i < routeCount; i++) {
          const card = routeCards.nth(i);
          const cardText = await card.textContent();
          console.log(`Route ${i + 1}: ${cardText.substring(0, 100)}...`);
        }
      }
      
      // Log final API payload analysis
      if (apiPayload) {
        console.log('\n📋 API Payload Analysis:');
        console.log('- Total vehicles:', apiPayload.vehicles?.length);
        console.log('- Total jobs:', apiPayload.jobs?.length);
        console.log('- Vehicle constraints:');
        if (apiPayload.vehicles?.[0]) {
          const v = apiPayload.vehicles[0];
          console.log('  - max_travel_time:', v.max_travel_time);
          console.log('  - max_distance:', v.max_distance);
          console.log('  - time_window:', v.time_window);
        }
      }
      
      if (apiResponse) {
        console.log('\n📥 API Response Analysis:');
        console.log('- Status:', apiResponse.status);
        console.log('- Routes returned:', apiResponse.routes?.length);
        console.log('- Unassigned jobs:', apiResponse.unassigned?.length);
      }
      
    } else {
      console.log('❌ Optimize button not found');
    }
    
    console.log('\n🎯 Debug complete. Check the output above for issues.');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugRouteOptimization().catch(console.error);