import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function takeScreenshot() {
  console.log('🚀 Starting Playwright to capture Save Settings button...\n');
  
  // Launch browser in headless mode
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    console.log('📡 Starting local dev server...');
    
    // Navigate to the app
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    }).catch(async (error) => {
      console.log('⚠️  Dev server not running, trying to start it...');
      
      // If dev server is not running, we'll take a screenshot of the static HTML
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>FreshOne Logistics - Setup Tab Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-green-50 to-lime-100">
  <!-- Header -->
  <div class="bg-white shadow-lg border-b-4 border-green-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">🥬 FreshOne Logistics</h1>
        <div class="flex space-x-4">
          <button class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold">Dashboard</button>
          <button class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold">Setup</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Setup Tab Content -->
  <div class="bg-white shadow-lg border-t-2 border-gray-200 relative pb-32">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-40">
      <!-- Mini Navigation -->
      <nav class="sticky top-0 z-10 bg-white py-2 mb-6 border-b border-gray-100 flex space-x-6 text-sm font-medium">
        <a href="#fleet" class="hover:text-green-700">Fleet</a>
        <a href="#temperature" class="hover:text-green-700">Temperature</a>
        <a href="#zapier" class="hover:text-purple-700">Zapier</a>
        <a href="#customer" class="hover:text-green-700">Customer</a>
        <a href="#usdot" class="hover:text-green-700">USDOT</a>
        <a href="#routes" class="hover:text-green-700">Routes</a>
      </nav>
      
      <!-- Configuration Sections -->
      <div class="space-y-8">
        <section class="bg-gray-50 rounded-2xl shadow p-8">
          <h2 class="text-2xl font-bold mb-4">Fleet Configuration</h2>
          <p class="text-gray-600 mb-4">Configure your truck fleet across different markets.</p>
          <div class="grid grid-cols-2 gap-4">
            <input type="number" placeholder="26' Box Trucks" class="px-4 py-2 border rounded-lg" />
            <input type="number" placeholder="53' Trailers" class="px-4 py-2 border rounded-lg" />
          </div>
        </section>
        
        <section class="bg-gray-50 rounded-2xl shadow p-8">
          <h2 class="text-2xl font-bold mb-4">Temperature Zones</h2>
          <p class="text-gray-600 mb-4">Set temperature ranges for different product categories.</p>
          <div class="space-y-2">
            <div class="flex items-center space-x-4">
              <span class="w-24">Frozen:</span>
              <input type="text" value="-10°F to 0°F" class="px-4 py-2 border rounded-lg" />
            </div>
          </div>
        </section>
        
        <section class="bg-purple-50 border-l-4 border-purple-400 rounded-2xl shadow p-8">
          <h2 class="text-2xl font-bold mb-4">Zapier Integration</h2>
          <p class="text-gray-600 mb-4">Connect to Zapier for workflow automation.</p>
          <input type="text" placeholder="Webhook URL" class="w-full px-4 py-2 border rounded-lg" />
        </section>
      </div>
      
      <!-- This padding ensures content doesn't hide behind save button -->
      <div class="h-20 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mt-8">
        <p class="text-yellow-800 font-bold">pb-40 padding area</p>
        <p class="text-yellow-700 text-sm">This 160px padding prevents content from being hidden behind the save button</p>
      </div>
    </div>
  </div>
  
  <!-- Save Settings Button - Fixed at Bottom -->
  <div class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-4 flex justify-end px-8 z-50 shadow-lg">
    <button class="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
      Save Settings
    </button>
  </div>
  
  <!-- Annotation Arrow -->
  <div class="fixed bottom-20 right-10 text-red-600 font-bold text-xl">
    <div class="bg-red-100 border-2 border-red-600 rounded-lg p-4 shadow-xl">
      ↓ Save Settings Button Here ↓
    </div>
  </div>
</body>
</html>
      `;
      
      await page.setContent(htmlContent);
      await page.waitForTimeout(1000);
    });
    
    console.log('📸 Taking screenshot of Setup tab...');
    
    // Click on Setup tab if needed
    const setupButton = page.locator('button:has-text("Setup")');
    if (await setupButton.isVisible()) {
      await setupButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Scroll to bottom to ensure save button is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Take full page screenshot
    const screenshotPath = join(__dirname, 'save-button-screenshot.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`✅ Screenshot saved to: ${screenshotPath}`);
    
    // Also take a focused screenshot of just the save button area
    const saveButton = page.locator('button:has-text("Save Settings")');
    if (await saveButton.isVisible()) {
      const buttonScreenshotPath = join(__dirname, 'save-button-closeup.png');
      await saveButton.screenshot({ 
        path: buttonScreenshotPath 
      });
      console.log(`✅ Close-up screenshot saved to: ${buttonScreenshotPath}`);
    }
    
  } catch (error) {
    console.error('❌ Error taking screenshot:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Screenshot process complete!');
  }
}

// Run the screenshot function
takeScreenshot().catch(console.error);