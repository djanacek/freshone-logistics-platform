# NextBillion.ai Support Questions - USDOT Compliance Issue

## Context
We are using the NextBillion.ai Route Optimization API v2 for our logistics operations. Despite setting strict vehicle constraints, the API is returning routes that are 28-29 hours long, which violates USDOT Hours of Service regulations. We need routes limited to 8-11 hours maximum.

## API Details
- **Endpoint**: `https://api.nextbillion.io/optimization/v2`
- **API Key**: 9431912d013c4c23930daa935e4db91e
- **Company**: FreshOne
- **Use Case**: Food distribution with temperature-controlled vehicles

## Specific Questions

### 1. Vehicle Time Constraints Not Being Enforced
We've tried multiple approaches to limit route duration, but the API still returns 28+ hour routes:

**Current vehicle configuration:**
```json
{
  "id": "box26_Tampa_FL_1",
  "capacity": [14],
  "start": "Tampa_FL_warehouse",
  "end": "Tampa_FL_warehouse",
  "time_window": [1735000000, 1735028800],  // 8 hour window
  "max_travel_time": 21600,  // 6 hours
  "breaks": [{
    "id": 1,
    "time_windows": [[1735014400, 1735018000]], 
    "duration": 1800
  }]
}
```

**Question**: What is the correct format to enforce a hard limit of 8 hours maximum per route? The `max_travel_time` parameter doesn't seem to be working.

### 2. USDOT Hours of Service Compliance
We need to enforce:
- Maximum 11 hours driving time
- Maximum 14 hours on-duty time  
- 30-minute break after 8 hours
- Routes must return to depot within shift

**Question**: Does the API support USDOT HOS compliance? What parameters should we use? We've tried:
- `hos_compliance: true`
- `max_driving_time: 39600`
- `max_working_time: 50400`

But these don't appear in your documentation. What are the correct field names?

### 3. API Payload Structure
We've restructured our payload based on documentation, but we're unsure if it's correct:

```json
{
  "locations": [...],
  "jobs": [...],
  "vehicles": [...],
  "options": {
    "objective": {
      "type": "min",
      "value": "duration"
    }
  }
}
```

**Question**: Is this the correct structure? Should we be using a different endpoint or API version for time-constrained routing?

### 4. Force Multiple Shorter Routes
With 100+ stops, we need the optimizer to create multiple 6-8 hour routes instead of three 28-hour routes.

**Current constraints:**
- Max 6 stops per vehicle
- Max 80km per route
- 35 vehicles available

**Question**: How do we force the API to use more vehicles with shorter routes rather than maximizing vehicle utilization with impossible long routes?

### 5. Debug Information
The API returns optimized routes but doesn't indicate why it's ignoring our time constraints.

**Question**: Is there a debug mode or response field that explains why constraints were violated? How can we see what constraints the optimizer is actually applying?

## Current Workaround Attempts
1. Set `max_travel_time: 21600` (6 hours)
2. Set 8-hour `time_window` for vehicles
3. Limited to 6 stops per vehicle
4. Increased fleet size to 35 vehicles
5. Set objective to minimize duration

**None of these prevent 28+ hour routes.**

## Contact Information
- **Company**: FreshOne
- **Technical Contact**: [Your name]
- **Email**: [Your email]
- **Phone**: [Your phone]
- **Urgency**: High - This is blocking our production deployment

## Attachments Needed
1. Example API request payload (full JSON)
2. Example API response showing 28+ hour routes
3. Expected result (multiple 8-hour routes)

Please provide:
1. Correct parameter names and format for time constraints
2. Example payload that enforces USDOT compliance
3. Explanation of why current constraints are being ignored
4. Best practices for multi-vehicle short-route optimization

Thank you for your assistance.