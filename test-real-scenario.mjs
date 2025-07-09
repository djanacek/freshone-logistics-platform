// Test with 113 stops like the real scenario
import fs from 'fs';

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

console.log('🧪 REAL SCENARIO TEST: 113 Stops, 8 Vehicles\n');

// Create 113 jobs spread around Tampa area (like your real data)
const jobs = [];
const locationCoords = [];

// Warehouse
locationCoords.push("27.9506,-82.4572");

// Generate 113 stops around Tampa area
for (let i = 1; i <= 113; i++) {
  const lat = 27.9 + (Math.random() * 0.3); // Tampa area
  const lon = -82.5 + (Math.random() * 0.3);
  locationCoords.push(`${lat.toFixed(4)},${lon.toFixed(4)}`);
  
  jobs.push({
    id: i,
    location_index: i, // index in locations array
    delivery: [1], // 1 pallet
    service: 600, // 10 minutes service time
    time_windows: [[Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + (8 * 60 * 60)]]
  });
}

// Create 8 vehicles (like your app)
const vehicles = [];
for (let i = 1; i <= 8; i++) {
  vehicles.push({
    id: i,
    start_index: 0, // warehouse
    end_index: 0, // return to warehouse
    capacity: [20], // 20 pallets capacity
    max_travel_time: 660, // 11 hours = 660 minutes (USDOT)
    max_distance: 800 // 800km max
  });
}

const testPayload = {
  locations: {
    id: 1,
    location: locationCoords.join('|')
  },
  jobs: jobs,
  vehicles: vehicles,
  options: {
    objective: {
      type: "min",
      value: "duration"
    }
  }
};

console.log('📋 Real Scenario Test Payload:');
console.log(`- Locations: ${locationCoords.length} (1 warehouse + 113 stops)`);
console.log(`- Jobs: ${jobs.length}`);
console.log(`- Vehicles: ${vehicles.length}`);
console.log(`- Each vehicle max_travel_time: ${vehicles[0].max_travel_time} minutes (11 hours)`);
console.log(`- Each vehicle capacity: ${vehicles[0].capacity[0]} pallets`);
console.log(`- Total demand: ${jobs.length} pallets`);
console.log(`- Theoretical max capacity: ${vehicles.length * vehicles[0].capacity[0]} pallets\n`);

async function testRealScenario() {
  try {
    console.log('🚀 Submitting 113-stop optimization job...');
    
    const submitResponse = await fetch(`https://api.nextbillion.io/optimise-mvrp?key=${NEXTBILLION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => null);
      throw new Error(`Submit failed: ${submitResponse.status} - ${JSON.stringify(errorData)}`);
    }
    
    const submitResult = await submitResponse.json();
    console.log(`✅ Job submitted: ${submitResult.id}\n`);
    
    console.log('🔄 Polling for results (this may take 30+ seconds for 113 stops)...');
    
    for (let attempt = 1; attempt <= 30; attempt++) {
      console.log(`📊 Poll ${attempt}/30`);
      
      const pollResponse = await fetch(`https://api.nextbillion.io/optimise-mvrp/result?id=${submitResult.id}&key=${NEXTBILLION_API_KEY}`);
      const result = await pollResponse.json();
      
      if (result.status === 'Ok' && result.result && result.result.routes) {
        console.log('\n✅ OPTIMIZATION COMPLETED!\n');
        
        const routes = result.result.routes;
        const unassigned = result.result.unassigned || [];
        
        console.log('📊 RESULTS SUMMARY:');
        console.log(`- Routes generated: ${routes.length}`);
        console.log(`- Unassigned jobs: ${unassigned.length}`);
        console.log(`- Jobs assigned: ${jobs.length - unassigned.length}`);
        
        console.log('\n📋 ROUTE ANALYSIS:');
        let violationCount = 0;
        
        routes.forEach((route, i) => {
          const hours = (route.duration / 3600).toFixed(2);
          const minutes = Math.round(route.duration / 60);
          const distance = (route.distance / 1000).toFixed(2);
          const stops = route.steps?.filter(s => s.type === 'job').length || 0;
          const violatesDOT = minutes > 660;
          
          if (violatesDOT) violationCount++;
          
          console.log(`Route ${i + 1}:`);
          console.log(`  - Duration: ${hours} hours (${minutes} minutes)`);
          console.log(`  - Distance: ${distance} km`);
          console.log(`  - Stops: ${stops}`);
          console.log(`  - DOT Status: ${violatesDOT ? '❌ VIOLATES 11-HOUR LIMIT' : '✅ Compliant'}`);
          
          if (violatesDOT) {
            console.log(`  - ⚠️ EXCEEDS BY: ${minutes - 660} minutes`);
          }
          console.log('');
        });
        
        console.log('🚨 USDOT COMPLIANCE ANALYSIS:');
        if (violationCount > 0) {
          console.log(`❌ FAILED: ${violationCount}/${routes.length} routes violate 11-hour limit`);
          console.log('🔧 This confirms the max_travel_time constraint is NOT being enforced properly');
          console.log('💡 Need to investigate why NextBillion.ai ignores the 660-minute limit');
        } else {
          console.log(`✅ PASSED: All ${routes.length} routes respect 11-hour limit`);
        }
        
        return result.result;
      }
      
      // Wait 3 seconds before next poll
      if (attempt < 30) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    throw new Error('Polling timed out after 30 attempts');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testRealScenario()
  .then(() => console.log('\n🎉 REAL SCENARIO TEST COMPLETED'))
  .catch(error => {
    console.error('\n💥 REAL SCENARIO TEST FAILED:', error.message);
    process.exit(1);
  });