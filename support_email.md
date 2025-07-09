# URGENT: NextBillion.ai Support Email

## 📧 **To**: support@nextbillion.ai
## 📧 **CC**: api-support@nextbillion.ai, help@nextbillion.ai
## 📋 **Subject**: URGENT: API Ignoring All Vehicle Constraints - USDOT Safety Violation

---

## **Email Content:**

**Subject: URGENT: Route Optimization API Completely Ignoring Vehicle Constraints - Safety/Legal Issue**

Dear NextBillion.ai Support Team,

We have a **CRITICAL PRODUCTION ISSUE** with your Route Optimization API v2 that is creating unsafe and illegal routes.

### 🚨 **IMMEDIATE PROBLEM**
Your API is returning routes with:
- **38, 38, and 37 stops per vehicle**
- **Estimated 28+ hours per route**
- **Complete violation of USDOT Hours of Service regulations**

### 📊 **OUR CONSTRAINTS (BEING IGNORED)**
We've set strict limits that the API is completely ignoring:
- `max_travel_time: 21600` (6 hours)
- `time_window: 8 hours maximum`
- Vehicle capacity limits
- Break requirements
- Return to depot requirements

**The API is assigning 6x more stops than our limit and creating impossible routes.**

### 🏢 **COMPANY INFO**
- **Company**: FreshOne
- **API Key**: 9431912d013c4c23930daa935e4db91e
- **Use Case**: Food distribution logistics
- **Urgency**: PRODUCTION BLOCKING

### ❓ **CRITICAL QUESTIONS**
1. **Why is `max_travel_time` being completely ignored?**
2. **What are the correct parameter names for time constraints?**
3. **How do we enforce USDOT Hours of Service compliance?**
4. **Is there a different API endpoint for time-constrained routing?**

### 📋 **WHAT WE'VE TRIED**
- Multiple API payload formats
- Different constraint parameters
- Increased fleet size (35 vehicles available)
- Various optimization objectives
- **NOTHING works - API assigns 37-38 stops per vehicle**

### 🎯 **WHAT WE NEED**
Routes with:
- **Maximum 6-8 stops per vehicle**
- **Maximum 8-11 hours total time**
- **USDOT compliant breaks**
- **Multiple short routes instead of impossible long ones**

### 📎 **ATTACHMENTS**
1. Current API payload showing our constraints
2. API response showing 37-38 stop routes
3. Detailed constraint requirements

### ⏰ **TIMELINE**
This is blocking our production deployment. We need:
- **Immediate response** on correct parameter format
- **Working example** of time-constrained optimization
- **Phone call** if needed to resolve quickly

**Please treat this as URGENT - we cannot deploy routes that violate federal safety regulations.**

Best regards,  
[Your Name]  
[Your Title]  
FreshOne  
[Your Phone]  
[Your Email]

---

**P.S.**: We're willing to upgrade to a premium tier if that provides better constraint enforcement. The current API behavior suggests our constraints aren't being processed at all.

---

## 📞 **ALSO TRY**:
- **LinkedIn**: Message NextBillion.ai company page
- **Their website**: Look for live chat or phone support
- **Documentation**: Check if there's a different API for time-constrained routing
- **GitHub**: See if they have public repos with examples

## 🚨 **BACKUP PLAN**:
If no response in 24 hours, consider:
1. **Different routing provider** (Google Routes API, HERE, Mapbox)
2. **Custom constraint layer** on top of basic routing
3. **Manual route splitting** before sending to API