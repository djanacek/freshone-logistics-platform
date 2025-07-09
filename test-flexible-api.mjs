// Test NextBillion.ai Flexible API for 113 stops with USDOT constraints
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

console.log('🧪 TESTING FLEXIBLE API: 113 Stops with USDOT Constraints\n');

// Create 113 jobs around Tampa area
const jobs = [];
const locations = [];

// Add warehouse (index 0)
locations.push([27.9506, -82.4572]);

// Generate 113 delivery locations
for (let i = 1; i <= 113; i++) {
  const lat = 27.9 + (Math.random() * 0.3);
  const lon = -82.5 + (Math.random() * 0.3);
  locations.push([lat, lon]);
  
  jobs.push({
    id: i,
    location_index: i,
    delivery: [1], // 1 pallet delivery
    service: 600, // 10 minutes service time
    time_windows: [[
      Math.floor(Date.now() / 1000), 
      Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12 hour window
    ]]
  });
}

// Create 8 vehicles with USDOT constraints
const vehicles = [];
for (let i = 1; i <= 8; i++) {
  vehicles.push({
    id: i,
    start_index: 0,
    end_index: 0,
    capacity: [20],
    // USDOT Hours of Service constraints
    max_travel_time: 660, // 11 hours max travel time
    max_distance: 800000, // 800km in meters
    time_window: [
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + (14 * 60 * 60) // 14 hour shift
    ]
  });
}

// Flexible API payload format
const flexiblePayload = {
  locations: locations,
  jobs: jobs,
  vehicles: vehicles,
  options: {
    objective: {
      type: "min",
      value: "duration"
    }
  }
};

console.log('📋 Flexible API Test Payload:');
console.log(`- Locations: ${locations.length}`);
console.log(`- Jobs: ${jobs.length}`);
console.log(`- Vehicles: ${vehicles.length}`);
console.log(`- USDOT max_travel_time: ${vehicles[0].max_travel_time} minutes`);
console.log(`- Vehicle capacity: ${vehicles[0].capacity[0]} pallets each`);
console.log(`- Total capacity: ${vehicles.length * vehicles[0].capacity[0]} pallets\n`);

async function testFlexibleAPI() {
  try {
    console.log('🚀 Submitting to Flexible API...');
    
    const response = await fetch(`https://api.nextbillion.io/optimization/v2?key=${NEXTBILLION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flexiblePayload)
    });
    
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.log('❌ Error details:', JSON.stringify(errorData, null, 2));
      throw new Error(`API failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Flexible API SUCCESS!\n');
    
    console.log('📊 RESULTS:');
    console.log(`- Routes: ${result.routes?.length || 0}`);
    console.log(`- Unassigned: ${result.unassigned?.length || 0}`);
    console.log(`- Total distance: ${(result.total_distance / 1000).toFixed(2)} km`);
    console.log(`- Total duration: ${(result.total_duration / 3600).toFixed(2)} hours`);
    
    if (result.routes && result.routes.length > 0) {
      console.log('\n📋 ROUTE ANALYSIS:');
      let violations = 0;
      
      result.routes.forEach((route, i) => {
        const hours = (route.duration / 3600).toFixed(2);
        const minutes = Math.round(route.duration / 60);
        const distance = (route.distance / 1000).toFixed(2);
        const stops = route.steps?.filter(s => s.type === 'job').length || 0;
        const violatesDOT = minutes > 660;
        
        if (violatesDOT) violations++;
        
        console.log(`Route ${i + 1}:`);
        console.log(`  Duration: ${hours} hours (${minutes} min) ${violatesDOT ? '❌ DOT VIOLATION' : '✅ DOT OK'}`);
        console.log(`  Distance: ${distance} km`);
        console.log(`  Stops: ${stops}`);
        
        if (violatesDOT) {
          console.log(`  ⚠️ Exceeds 11-hour limit by ${minutes - 660} minutes`);
        }
        console.log('');
      });
      
      console.log('🚨 USDOT COMPLIANCE SUMMARY:');
      if (violations > 0) {
        console.log(`❌ FAILED: ${violations}/${result.routes.length} routes violate DOT limits`);
        console.log('🔧 USDOT constraints are NOT being enforced properly');
      } else {
        console.log(`✅ PASSED: All routes comply with 11-hour DOT limit`);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Flexible API test failed:', error.message);
    throw error;
  }
}

testFlexibleAPI()
  .then(() => console.log('\n🎉 FLEXIBLE API TEST COMPLETED'))
  .catch(error => {
    console.error('\n💥 FLEXIBLE API TEST FAILED:', error.message);
    process.exit(1);
  });