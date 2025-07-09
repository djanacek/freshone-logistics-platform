// Complete end-to-end test of NextBillion.ai API with USDOT compliance
import fs from 'fs';

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const NEXTBILLION_API_KEY = env.VITE_NEXTBILLION_API_KEY;

console.log('🧪 COMPLETE NEXTBILLION.AI INTEGRATION TEST\n');

if (!NEXTBILLION_API_KEY) {
  console.log('❌ API key not found');
  process.exit(1);
}

// Test payload matching the app's structure exactly
const testPayload = {
  locations: {
    id: 1,
    location: "27.9506,-82.4572|27.9600,-82.4600|27.9700,-82.4700|27.9800,-82.4800|27.9900,-82.4900"
  },
  jobs: [
    { id: 1, location_index: 1, delivery: [2], service: 600, time_windows: [[Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + (8 * 60 * 60)]] },
    { id: 2, location_index: 2, delivery: [3], service: 900, time_windows: [[Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + (8 * 60 * 60)]] },
    { id: 3, location_index: 3, delivery: [2], service: 600, time_windows: [[Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + (8 * 60 * 60)]] },
    { id: 4, location_index: 4, delivery: [4], service: 1200, time_windows: [[Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + (8 * 60 * 60)]] }
  ],
  vehicles: [
    {
      id: 1,
      start_index: 0,
      end_index: 0,
      capacity: [20],
      max_travel_time: 660 // 11 hours in minutes - USDOT compliance
    }
  ],
  options: {
    objective: {
      type: "min",
      value: "duration"
    }
  }
};

console.log('📋 Test Payload Summary:');
console.log(`- Locations: ${testPayload.locations.location.split('|').length}`);
console.log(`- Jobs: ${testPayload.jobs.length}`);
console.log(`- Vehicles: ${testPayload.vehicles.length}`);
console.log(`- USDOT max_travel_time: ${testPayload.vehicles[0].max_travel_time} minutes\n`);

async function pollForResult(jobId, maxAttempts = 20) {
  console.log(`🔄 Polling for job result: ${jobId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`📊 Poll attempt ${attempt}/${maxAttempts}`);
    
    const response = await fetch(`https://api.nextbillion.io/optimise-mvrp/result?id=${jobId}&key=${NEXTBILLION_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Poll failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`📥 Status: ${result.status}`);
    
    // Check if result has routes (completed)
    if (result.routes && result.routes.length > 0) {
      console.log(`✅ Found ${result.routes.length} routes - optimization completed!`);
      return result;
    } else if (result.status === 'FAILED' || result.error) {
      throw new Error(`Optimization failed: ${result.message || result.error || 'Unknown error'}`);
    } else if (result.status === 'Ok' || result.status === 'PROCESSING') {
      // Still processing, continue polling
      if (attempt === maxAttempts) {
        console.log('⚠️ Final attempt - logging full result:', JSON.stringify(result, null, 2));
      }
    } else {
      console.log(`⚠️ Unknown status: ${result.status} - Full result:`, JSON.stringify(result, null, 2));
    }
    
    // Wait 2 seconds before next poll
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Polling timed out');
}

async function testOptimization() {
  try {
    console.log('🚀 Step 1: Submitting optimization job...');
    
    const submitResponse = await fetch(`https://api.nextbillion.io/optimise-mvrp?key=${NEXTBILLION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📥 Submit response: ${submitResponse.status} ${submitResponse.statusText}`);
    
    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => null);
      console.log('❌ Submit failed:', JSON.stringify(errorData, null, 2));
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }
    
    const submitResult = await submitResponse.json();
    console.log('✅ Job submitted successfully');
    console.log(`📋 Job ID: ${submitResult.id}`);
    console.log(`💬 Message: ${submitResult.message}\n`);
    
    console.log('🔄 Step 2: Polling for results...');
    const optimizationResult = await pollForResult(submitResult.id);
    
    console.log('\n✅ Step 3: Optimization completed!');
    console.log(`📊 Routes generated: ${optimizationResult.routes?.length || 0}`);
    console.log(`⚠️ Unassigned jobs: ${optimizationResult.unassigned?.length || 0}`);
    
    if (optimizationResult.routes && optimizationResult.routes.length > 0) {
      console.log('\n📋 ROUTE ANALYSIS:');
      
      optimizationResult.routes.forEach((route, i) => {
        const hours = (route.duration / 3600).toFixed(2);
        const minutes = Math.round(route.duration / 60);
        const distance = (route.distance / 1000).toFixed(2);
        const stops = route.steps?.filter(s => s.type === 'job').length || 0;
        const violatesDOT = minutes > 660; // 11 hours = 660 minutes
        
        console.log(`Route ${i + 1}:`);
        console.log(`  - Duration: ${hours} hours (${minutes} minutes)`);
        console.log(`  - Distance: ${distance} km`);
        console.log(`  - Stops: ${stops}`);
        console.log(`  - DOT Compliance: ${violatesDOT ? '❌ VIOLATION' : '✅ COMPLIANT'}`);
        
        if (violatesDOT) {
          console.log(`  - ⚠️ EXCEEDS LIMIT BY: ${minutes - 660} minutes`);
        }
        console.log('');
      });
      
      // Overall compliance check
      const violations = optimizationResult.routes.filter(r => (r.duration / 60) > 660);
      if (violations.length > 0) {
        console.log(`❌ USDOT COMPLIANCE FAILED: ${violations.length}/${optimizationResult.routes.length} routes violate 11-hour limit`);
        console.log('🔧 This indicates NextBillion.ai is not enforcing max_travel_time constraint properly');
      } else {
        console.log('✅ USDOT COMPLIANCE PASSED: All routes respect 11-hour limit');
      }
      
    } else {
      console.log('⚠️ No routes generated - check unassigned jobs and constraints');
      
      if (optimizationResult.unassigned && optimizationResult.unassigned.length > 0) {
        console.log('\n📋 UNASSIGNED JOBS:');
        optimizationResult.unassigned.slice(0, 3).forEach((job, i) => {
          console.log(`  ${i + 1}: ${JSON.stringify(job)}`);
        });
      }
    }
    
    return optimizationResult;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

console.log('🧪 Starting NextBillion.ai integration test...\n');
testOptimization()
  .then(() => {
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY');
  })
  .catch(error => {
    console.error('\n💥 TEST FAILED:', error.message);
    process.exit(1);
  });