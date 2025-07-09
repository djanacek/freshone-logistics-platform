#!/usr/bin/env node

// Test script to verify NextBillion.ai API compliance parameters
// This test doesn't need external dependencies and uses Node.js built-in fetch

const NEXTBILLION_API_KEY = process.env.VITE_NEXTBILLION_API_KEY;

if (!NEXTBILLION_API_KEY || NEXTBILLION_API_KEY === '[YOUR_NEXTBILLION_API_KEY_HERE]') {
  console.error('Error: NextBillion API key not configured in environment');
  console.error('Please set VITE_NEXTBILLION_API_KEY environment variable');
  process.exit(1);
}

console.log('Testing NextBillion.ai API with USDOT Compliance Parameters...\n');

// Test payload with USDOT compliance parameters
const testPayload = {
  locations: [
    {
      id: "warehouse",
      location: [27.921497, -82.459263] // Tampa warehouse
    },
    {
      id: "stop_1",
      location: [27.950575, -82.457508] // Downtown Tampa
    },
    {
      id: "stop_2",
      location: [27.964783, -82.452649] // North Tampa
    },
    {
      id: "stop_3",
      location: [27.933952, -82.451935] // South Tampa
    }
  ],
  jobs: [
    {
      id: "job_1",
      location_index: 1,
      delivery: [2], // 2 pallets
      service: 600, // 10 minutes
      time_windows: [[
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (14 * 3600)
      ]],
      priority: 50
    },
    {
      id: "job_2",
      location_index: 2,
      delivery: [3], // 3 pallets
      service: 900, // 15 minutes
      time_windows: [[
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (14 * 3600)
      ]],
      priority: 50
    },
    {
      id: "job_3",
      location_index: 3,
      delivery: [1], // 1 pallet
      service: 300, // 5 minutes
      time_windows: [[
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (14 * 3600)
      ]],
      priority: 50
    }
  ],
  vehicles: [
    {
      id: "test_vehicle_1",
      start_index: 0,
      end_index: 0,
      capacity: [14], // 14 pallet capacity
      time_window: [
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (14 * 3600) // 14 hours max working time
      ],
      max_working_time: 50400, // 14 hours (USDOT compliance)
      max_travel_time: 39600, // 11 hours (USDOT compliance)
      drive_time_layover_config: {
        max_continuous_driving: 28800 // 8 hours (USDOT compliance)
      },
      breaks: [{
        id: 1,
        time_windows: [[
          Math.floor(Date.now() / 1000) + (4 * 3600), // After 4 hours
          Math.floor(Date.now() / 1000) + (5 * 3600)  // Within 5 hours
        ]],
        duration: 1800 // 30 minutes
      }]
    }
  ],
  options: {
    objective: {
      type: "min",
      value: "duration"
    }
  }
};

console.log('Test Configuration:');
console.log('- Locations:', testPayload.locations.length);
console.log('- Jobs:', testPayload.jobs.length);
console.log('- Vehicles:', testPayload.vehicles.length);
console.log('\nUSDOT Compliance Parameters:');
console.log('- max_working_time:', testPayload.vehicles[0].max_working_time / 3600, 'hours');
console.log('- max_travel_time:', testPayload.vehicles[0].max_travel_time / 3600, 'hours');
console.log('- max_continuous_driving:', testPayload.vehicles[0].drive_time_layover_config.max_continuous_driving / 3600, 'hours');
console.log('- mandatory break:', testPayload.vehicles[0].breaks[0].duration / 60, 'minutes after 4-5 hours');

console.log('\nSending request to NextBillion.ai...');

try {
  const response = await fetch(`https://api.nextbillion.io/optimization/v2?key=${NEXTBILLION_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
  }

  const result = await response.json();
  
  console.log('\n✅ SUCCESS! NextBillion.ai Response:');
  console.log('- Status:', result.status || 'completed');
  console.log('- Routes:', result.routes?.length || 0);
  
  if (result.routes && result.routes.length > 0) {
    result.routes.forEach((route, index) => {
      console.log(`\nRoute ${index + 1}:`);
      console.log('- Vehicle:', route.vehicle);
      console.log('- Total distance:', (route.distance / 1000).toFixed(2), 'km');
      console.log('- Total time:', (route.duration / 3600).toFixed(2), 'hours');
      console.log('- Number of stops:', route.steps?.filter(s => s.type === 'job').length || 0);
      
      // Check if route respects USDOT compliance
      const routeHours = route.duration / 3600;
      if (routeHours > 11) {
        console.log('⚠️  WARNING: Route exceeds 11-hour travel time limit!');
      } else {
        console.log('✅ Route complies with 11-hour travel time limit');
      }
      
      if (routeHours > 14) {
        console.log('⚠️  WARNING: Route exceeds 14-hour working time limit!');
      } else {
        console.log('✅ Route complies with 14-hour working time limit');
      }
    });
  }
  
  console.log('\n📋 Full API Response:');
  console.log(JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}

console.log('\n✅ Test completed successfully!');