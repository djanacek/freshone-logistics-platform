// Direct test of NextBillion.ai API to debug 400 error
import fs from 'fs';

// Read .env file manually
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

console.log('🔍 Testing NextBillion.ai API directly...\n');

if (!NEXTBILLION_API_KEY || NEXTBILLION_API_KEY === '[YOUR_NEXTBILLION_API_KEY_HERE]') {
  console.log('❌ API key not configured');
  process.exit(1);
}

console.log('✅ API key configured');

// Create a minimal test payload based on the Fast API structure
const testPayload = {
  locations: {
    id: 1,
    location: "27.9506,-82.4572|27.9506,-82.4500|27.9400,-82.4600"  // Pipe-separated string format
  },
  jobs: [
    {
      id: 1,
      location_index: 1,
      delivery: [2],
      service: 600,
      time_windows: [[Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + (8 * 60 * 60)]]
    },
    {
      id: 2,
      location_index: 2,
      delivery: [3],
      service: 900,
      time_windows: [[Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + (8 * 60 * 60)]]
    }
  ],
  vehicles: [
    {
      id: 1,
      start_index: 0,
      end_index: 0,
      capacity: [20],
      max_travel_time: 660
    }
  ],
  options: {
    objective: {
      type: "min",
      value: "duration"
    }
  }
};

console.log('📋 Test Payload:');
console.log('- Locations:', testPayload.locations.length);
console.log('- Jobs:', testPayload.jobs.length);
console.log('- Vehicles:', testPayload.vehicles.length);
console.log('- Vehicle constraints:', {
  max_travel_time: testPayload.vehicles[0].max_travel_time,
  max_distance: testPayload.vehicles[0].max_distance
});

console.log('\n🚀 Calling NextBillion.ai API...');

try {
  const response = await fetch(`https://api.nextbillion.io/optimise-mvrp?key=${NEXTBILLION_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });

  console.log('📥 Response status:', response.status);
  console.log('📥 Response status text:', response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.log('\n❌ API Error Details:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Error Data:', JSON.stringify(errorData, null, 2));
    
    // Log the headers too
    console.log('\n📋 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`- ${key}: ${value}`);
    }
    
    console.log('\n📋 Request Payload that failed:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    process.exit(1);
  }

  const result = await response.json();
  console.log('\n✅ API Success!');
  console.log('- Routes returned:', result.routes?.length || 0);
  console.log('- Unassigned jobs:', result.unassigned?.length || 0);
  
  if (result.routes) {
    result.routes.forEach((route, i) => {
      const hours = (route.duration / 3600).toFixed(2);
      const distance = (route.distance / 1000).toFixed(2);
      const stops = route.steps?.filter(s => s.type === 'job').length || 0;
      console.log(`- Route ${i + 1}: ${hours} hours, ${distance} km, ${stops} stops`);
    });
  }

} catch (error) {
  console.error('❌ Network Error:', error.message);
  process.exit(1);
}