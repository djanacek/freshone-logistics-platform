import { chromium } from '@playwright/test';

async function debugSetupTab() {
  console.log('🔍 Debugging Setup Tab...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    
    // First, let's create a test HTML file that mimics the React app structure
    const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Debug Setup Tab</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    // Read the actual App.jsx content
    const appCode = ${JSON.stringify(await import('fs').then(fs => fs.promises.readFile('./src/App.jsx', 'utf8')))};
    
    // Extract the Setup tab HTML structure
    const setupTabMatch = appCode.match(/activeTab === 'setup'[\\s\\S]*?\\) : \\(/);
    
    if (setupTabMatch) {
      document.getElementById('root').innerHTML = '<div style="padding: 20px; background: #f0f0f0;"><h1>Setup Tab Structure Found:</h1><pre style="background: white; padding: 10px; overflow: auto;">' + setupTabMatch[0].substring(0, 2000) + '...</pre></div>';
      
      // Check for Save Settings button
      const saveButtonMatch = appCode.match(/Save Settings[\\s\\S]*?<\\/button>/);
      if (saveButtonMatch) {
        document.getElementById('root').innerHTML += '<div style="padding: 20px; background: #e0ffe0;"><h2>Save Button Found:</h2><pre style="background: white; padding: 10px;">' + saveButtonMatch[0] + '</pre></div>';
      } else {
        document.getElementById('root').innerHTML += '<div style="padding: 20px; background: #ffe0e0;"><h2>ERROR: Save Button NOT Found!</h2></div>';
      }
      
      // Check button position in structure
      const buttonLineNumber = appCode.split('\\n').findIndex(line => line.includes('Save Settings')) + 1;
      const setupTabLineNumber = appCode.split('\\n').findIndex(line => line.includes("activeTab === 'setup'")) + 1;
      
      document.getElementById('root').innerHTML += '<div style="padding: 20px;"><h3>Line Numbers:</h3><ul><li>Setup Tab starts at line: ' + setupTabLineNumber + '</li><li>Save Button at line: ' + buttonLineNumber + '</li></ul></div>';
    } else {
      document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;">ERROR: Could not find Setup tab structure!</div>';
    }
  </script>
</body>
</html>`;
    
    await page.setContent(testHtml);
    await page.waitForTimeout(1000);
    
    // Get the page content
    const content = await page.content();
    console.log('Page analysis:', await page.locator('#root').textContent());
    
    // Now let's check the actual running app
    console.log('\n📱 Checking running app at localhost:5173...');
    
    try {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 5000 });
      
      // Click Setup tab
      const setupButton = page.locator('button:has-text("Setup")');
      if (await setupButton.isVisible()) {
        console.log('✅ Found Setup button, clicking...');
        await setupButton.click();
        await page.waitForTimeout(1000);
        
        // Check for save button
        const saveButton = page.locator('button:has-text("Save Settings")');
        const saveButtonExists = await saveButton.count();
        console.log(`Save Settings button count: ${saveButtonExists}`);
        
        if (saveButtonExists > 0) {
          console.log('✅ Save Settings button found!');
          const buttonHTML = await saveButton.evaluate(el => el.outerHTML);
          console.log('Button HTML:', buttonHTML);
        } else {
          console.log('❌ Save Settings button NOT found!');
          
          // Get all buttons on the page
          const allButtons = await page.locator('button').all();
          console.log(`\nTotal buttons on page: ${allButtons.length}`);
          for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
            const text = await allButtons[i].textContent();
            console.log(`Button ${i}: "${text}"`);
          }
        }
        
        // Get the bottom of the page HTML
        const pageBottom = await page.evaluate(() => {
          const elements = document.querySelectorAll('.fixed.bottom-0');
          return Array.from(elements).map(el => el.outerHTML);
        });
        console.log('\nFixed bottom elements:', pageBottom);
        
      } else {
        console.log('❌ Setup button not found!');
      }
      
    } catch (error) {
      console.log('⚠️ Could not connect to dev server:', error.message);
      console.log('Make sure your dev server is running with: npm run dev');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugSetupTab().catch(console.error);