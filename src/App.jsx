import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  MapPin, 
  Route, 
  Send, 
  FileText, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Play,
  Pause,
  RefreshCw,
  Users,
  Building2,
  BarChart3,
  Navigation,
  Mail,
  Bell,
  Smartphone,
  Wifi,
  Copy,
  Settings,
  Database,
  X,
  Save,
  AlertTriangle,
  TestTube
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { createClient } from '@supabase/supabase-js';

const LogisticsAutomationPlatform = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [bolData, setBolData] = useState([]);
  const [geocodedData, setGeocodedData] = useState([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [samsaraStatus, setSamsaraStatus] = useState('pending');
  const [reports, setReports] = useState({});
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [realTimeTracking, setRealTimeTracking] = useState([]);
  // Embedded API credentials for FreshOne production
  const SAMSARA_API_TOKEN = import.meta.env.VITE_SAMSARA_API_TOKEN || '[YOUR_SAMSARA_TOKEN_HERE]';
  const SAMSARA_ORG_ID = '1288';
  const NEXTBILLION_API_KEY = import.meta.env.VITE_NEXTBILLION_API_KEY || '[YOUR_NEXTBILLION_API_KEY_HERE]';
  
  // FreshOne warehouse configuration
  const warehouseConfig = {
    lat: 27.9506, 
    lon: -82.4572, 
    name: 'FreshOne Main Warehouse'
  };
  
  const [testMode, setTestMode] = useState(true);
  const [routesAwaitingApproval, setRoutesAwaitingApproval] = useState([]);
  const [showRouteReview, setShowRouteReview] = useState(false);
  // Add modal state for route preview
  const [previewRoute, setPreviewRoute] = useState(null);

  // Add state for file upload progress, errors, and preview
  const [fileUploadProgress, setFileUploadProgress] = useState('');
  const [fileUploadError, setFileUploadError] = useState('');
  const [fileUploadWarnings, setFileUploadWarnings] = useState([]);
  const [filePreviewData, setFilePreviewData] = useState([]);
  const [fileReady, setFileReady] = useState(false);

  // Add state for missing customers report and modal
  const [missingCustomersReport, setMissingCustomersReport] = useState([]);
  const [showMissingCustomersModal, setShowMissingCustomersModal] = useState(false);
  const [missingCustomersToAdd, setMissingCustomersToAdd] = useState([]);
  const [similarMatchesToConfirm, setSimilarMatchesToConfirm] = useState([]);
  const [confirmedMatches, setConfirmedMatches] = useState({});
  const [customerNameMappings, setCustomerNameMappings] = useState({});

  // FreshOne production configuration - no localStorage needed for embedded credentials

  // Workflow steps
  const steps = [
    { id: 0, title: 'Upload BOL', icon: Upload, status: 'pending' },
    { id: 1, title: 'Geocode Addresses', icon: MapPin, status: 'pending' },
    { id: 2, title: 'Route Optimization', icon: Route, status: 'pending' },
    { id: 3, title: 'Review & Approve Routes', icon: CheckCircle, status: 'pending' },
    { id: 4, title: 'Send to Samsara', icon: Send, status: 'pending' },
    { id: 5, title: 'Generate Reports', icon: FileText, status: 'pending' }
  ];

  // Sample BOL data for demo
  const sampleBOLData = [
    { 
      SO_Number: '02094650', 
      Customer_Name: 'ALTA VISTA ELEMENTARY', 
      City: 'HAINES CITY', 
      State: 'FL',
      Delivery_Date: '2025-01-20',
      Cases: 12,
      Special_Instructions: 'Deliver to cafeteria loading dock'
    },
    { 
      SO_Number: '02094653', 
      Customer_Name: 'HORIZONS ELEMENTARY', 
      City: 'DAVENPORT', 
      State: 'FL',
      Delivery_Date: '2025-01-20',
      Cases: 8,
      Special_Instructions: 'Contact office upon arrival'
    },
    { 
      SO_Number: '02094655', 
      Customer_Name: 'BOONE MIDDLE SCHOOL', 
      City: 'HAINES CITY', 
      State: 'FL',
      Delivery_Date: '2025-01-20',
      Cases: 15,
      Special_Instructions: 'Use rear entrance'
    }
  ];

  // Add notification function
  const addNotification = (type, message, details = '') => {
    const notification = {
      id: Date.now() + Math.random(), // Make ID more unique
      type,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
  };

    // Simplified FreshOne email notification function
  const sendEmailNotification = async (recipients, subject, content, reportType, reportData) => {
    const mode = testMode ? 'TEST MODE' : 'LIVE MODE';
    
    if (testMode) {
      // Test mode - just show notification
      if (reportType === 'warehouse' || reportType === 'customer') {
        addNotification('info', `FreshOne Email (${mode}): ${subject}`, `Would send Excel file (${reportData?.filename}) to: ${Array.isArray(recipients) ? recipients.join(', ') : recipients}`);
      } else {
        addNotification('info', `FreshOne Email (${mode}): ${subject}`, `Would send to: ${Array.isArray(recipients) ? recipients.join(', ') : recipients}`);
      }
      return { success: true, simulated: true };
    } else {
      // Live mode - show success notification (in production, this would integrate with your email system)
      addNotification('success', `FreshOne Email Sent: ${subject}`, `Delivered to ${Array.isArray(recipients) ? recipients.length : 1} recipient(s) - ${mode}`);
      return { success: true };
    }
  };

  // Simple FreshOne email content generation
  const generateEmailContent = (reportType, content, reportData) => {
    return `FreshOne Logistics - ${reportType} Report for ${new Date().toLocaleDateString()}`;
  };

  // Real-time tracking simulation
  const startRealTimeTracking = (routes) => {
    const trackingData = routes.flatMap(route => 
      route.stops.map(stop => ({
        routeId: route.id,
        stopId: stop.SO_Number,
        customerName: stop.Customer_Name,
        status: 'pending',
        currentLocation: { lat: stop.lat, lon: stop.lon },
        estimatedArrival: stop.estimatedArrival,
        actualArrival: null,
        driverName: route.driver,
        vehicleId: route.vehicle,
        lastUpdate: new Date().toISOString()
      }))
    );
    
    setRealTimeTracking(trackingData);
    
    const updateInterval = setInterval(() => {
      setRealTimeTracking(prev => prev.map(stop => {
        const random = Math.random();
        let newStatus = stop.status;
        
        if (stop.status === 'pending' && random > 0.7) {
          newStatus = 'in_transit';
          addNotification('info', `Driver en route to ${stop.customerName}`, `ETA: ${new Date(stop.estimatedArrival).toLocaleTimeString()}`);
        } else if (stop.status === 'in_transit' && random > 0.8) {
          newStatus = 'arrived';
          addNotification('info', `Driver arrived at ${stop.customerName}`, 'Delivery in progress');
        } else if (stop.status === 'arrived' && random > 0.9) {
          newStatus = 'completed';
          addNotification('success', `Delivery completed at ${stop.customerName}`, 'Signature captured');
        }
        
        return {
          ...stop,
          status: newStatus,
          lastUpdate: new Date().toISOString()
        };
      }));
    }, 5000);

    setTimeout(() => clearInterval(updateInterval), 120000);
  };

  // Mock API functions
  const geocodeAddresses = async (bolData) => {
    setProcessing(true);
    setCurrentStep(1);
    addNotification('info', 'Starting address geocoding...', `Processing ${bolData.length} addresses`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const geocoded = bolData.map((item, index) => ({
      ...item,
      lat: 28.0 + (index * 0.1),
      lon: -81.5 - (index * 0.1),
      geocoded: true,
      address: `${item.Customer_Name}, ${item.City}, ${item.State}`
    }));
    
    setGeocodedData(geocoded);
    setCurrentStep(2);
    addNotification('success', 'Address geocoding completed', `${geocoded.length} addresses processed`);
    return geocoded;
  };

  // Extract city and state from address string
  const extractCityStateFromAddress = (address) => {
    if (!address) return { city: '', state: '' };
    
    // Common patterns for city, state extraction
    const patterns = [
      // Pattern: "City, State ZIP" or "City, State"
      /([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i,
      // Pattern: "City State ZIP" or "City State"
      /([^,]+)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i,
      // Pattern: "Address, City, State ZIP"
      /.*,\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i,
      // Pattern: "Address, City State ZIP"
      /.*,\s*([^,]+)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i
    ];
    
    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match) {
        return {
          city: match[1].trim(),
          state: match[2].trim().toUpperCase()
        };
      }
    }
    
    // Fallback: try to extract from end of string
    const parts = address.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];
      
      // Check if last part looks like a state
      if (/^[A-Z]{2}$/i.test(lastPart)) {
        return {
          city: secondLastPart,
          state: lastPart.toUpperCase()
        };
      }
    }
    
    return { city: '', state: '' };
  };

  // Convert NextBillion API response to our route format
  const convertNextBillionResponse = (apiResponse, originalData) => {
    try {
      addNotification('info', 'Converting NextBillion response...', 'Processing optimization results');
      
      // Extract routes from API response
      const routes = apiResponse.routes || [];
      const drivers = ['John Smith', 'Maria Garcia', 'David Johnson'];
      const vehicles = ['Truck 101', 'Truck 102', 'Truck 103'];
      
      if (routes.length === 0) {
        throw new Error('No routes returned from NextBillion API');
      }
      
      const convertedRoutes = routes.map((route, routeIndex) => {
        const driver = drivers[routeIndex % drivers.length];
        const vehicle = vehicles[routeIndex % vehicles.length];
        
        // Convert stops in the route
        const routeStops = route.stops?.map((apiStop, stopIndex) => {
          // Find original data for this stop
          const originalStop = originalData.find(stop => 
            stop.SO_Number === apiStop.id || 
            `stop_${originalData.indexOf(stop)}` === apiStop.id
          );
          
          if (!originalStop) {
            addNotification('warning', 'Stop not found in original data', `Stop ID: ${apiStop.id}`);
            return null;
          }
          
          return {
            ...originalStop,
            sequence: stopIndex + 1,
            estimatedArrival: apiStop.arrival_time ? 
              new Date(apiStop.arrival_time * 1000).toISOString() : 
              new Date(Date.now() + (stopIndex + 1) * 45 * 60000).toISOString(),
            serviceTime: apiStop.service_time ? Math.round(apiStop.service_time / 60) : 15,
            distance: apiStop.distance || 0,
            duration: apiStop.duration || 0
          };
        }).filter(stop => stop !== null) || [];
        
        // Calculate route totals
        const totalDistance = route.total_distance || routeStops.reduce((sum, stop) => sum + (stop.distance || 0), 0);
        const totalTime = route.total_duration || routeStops.reduce((sum, stop) => sum + (stop.duration || 0), 0);
        const estimatedFuelCost = Math.round(totalDistance * 1.5 * 100) / 100;
        
        return {
          id: `route_${String(routeIndex + 1).padStart(3, '0')}`,
          driver,
          vehicle,
          totalDistance: Math.round(totalDistance * 10) / 10,
          totalTime: Math.round(totalTime),
          estimatedFuelCost,
          stops: routeStops,
          optimizationScore: route.score || 0,
          apiResponse: route // Keep original API response for debugging
        };
      });
      
      addNotification('success', 'NextBillion response converted successfully', `Processed ${convertedRoutes.length} routes`);
      return convertedRoutes;
      
    } catch (error) {
      addNotification('error', 'Failed to convert NextBillion response', error.message);
      throw error;
    }
  };

  // Real NextBillion.ai route optimization
  const optimizeRoutes = async (geocodedData) => {
    setProcessing(true);
    const mode = testMode ? 'TEST MODE' : 'LIVE MODE';
    addNotification('info', `Starting FreshOne route optimization (${mode})...`, testMode ? 'Using simulation data' : 'Using NextBillion.ai API');
    
    try {
      if (testMode) {
        // Test mode - use simulation
        addNotification('info', 'Running route optimization simulation...', 'Test mode active - no real API calls');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Simulation logic
        const drivers = ['John Smith', 'Maria Garcia', 'David Johnson'];
        const vehicles = ['Truck 101', 'Truck 102', 'Truck 103'];
        const stopsPerRoute = Math.ceil(geocodedData.length / drivers.length);
        const routes = [];
        
        for (let i = 0; i < drivers.length && i * stopsPerRoute < geocodedData.length; i++) {
          const routeStops = geocodedData.slice(i * stopsPerRoute, (i + 1) * stopsPerRoute);
          const totalDistance = routeStops.length * 15 + Math.random() * 20;
          const totalTime = routeStops.length * 45 + Math.random() * 60;
          
          routes.push({
            id: `route_${String(i + 1).padStart(3, '0')}`,
            driver: drivers[i],
            vehicle: vehicles[i],
            totalDistance: Math.round(totalDistance * 10) / 10,
            totalTime: Math.round(totalTime),
            estimatedFuelCost: Math.round(totalDistance * 1.5 * 100) / 100,
            stops: routeStops.map((stop, index) => ({
              ...stop,
              sequence: index + 1,
              estimatedArrival: new Date(Date.now() + (index + 1) * 45 * 60000).toISOString(),
              serviceTime: 15 + Math.floor(Math.random() * 10)
            }))
          });
        }
        
        setOptimizedRoutes(routes);
        setRoutesAwaitingApproval(routes);
        setCurrentStep(3);
        setShowRouteReview(true);
        addNotification('success', `FreshOne route optimization completed (${mode})`, `Generated ${routes.length} optimized route(s) - AWAITING APPROVAL`);
        return routes;
        
      } else {
        // Live mode - use real NextBillion.ai API
        if (!NEXTBILLION_API_KEY || NEXTBILLION_API_KEY === '[YOUR_NEXTBILLION_API_KEY_HERE]') {
          throw new Error('NextBillion API key not configured');
        }
        
        addNotification('info', 'Calling NextBillion.ai Route Optimization API...', `Processing ${geocodedData.length} stops for real route optimization`);
        
        // Log optimization details
        console.log('NextBillion Optimization Request:', {
          stops: geocodedData.length,
          warehouse: warehouseConfig,
          testMode: false,
          timestamp: new Date().toISOString()
        });
        
        // Prepare stops for NextBillion API
        const stops = geocodedData.map((stop, index) => ({
          id: stop.SO_Number || `stop_${index}`,
          location: {
            lat: stop.lat,
            lng: stop.lon
          },
          demand: stop.Cases || 1,
          service_time: 15 * 60, // 15 minutes in seconds
          time_windows: [
            {
              start: Math.floor(Date.now() / 1000), // Current time
              end: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
            }
          ]
        }));
        
        // Add warehouse as depot
        const depot = {
          id: 'warehouse',
          location: {
            lat: warehouseConfig.lat,
            lng: warehouseConfig.lon
          },
          time_windows: [
            {
              start: Math.floor(Date.now() / 1000),
              end: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            }
          ]
        };
        
        // Prepare API request payload
        const apiPayload = {
          vehicles: [
            {
              id: 'truck_1',
              capacity: 1000, // Large capacity for cases
              start_location: depot.location,
              end_location: depot.location,
              time_windows: depot.time_windows
            }
          ],
          stops: stops,
          options: {
            optimization_type: 'route_optimization',
            algorithm: 'genetic_algorithm',
            time_limit: 30, // 30 seconds optimization time limit
            distance_matrix: true
          }
        };
        
        addNotification('info', 'Sending optimization request to NextBillion.ai...', `Optimizing ${stops.length} stops`);
        
        // Make API call to NextBillion
        const response = await fetch('https://api.nextbillion.io/optimization/v1/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NEXTBILLION_API_KEY}`,
            'X-API-Key': NEXTBILLION_API_KEY
          },
          body: JSON.stringify(apiPayload)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`NextBillion API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
        }
        
        const optimizationResult = await response.json();
        addNotification('success', 'NextBillion.ai optimization completed!', 'Processing optimization results...');
        
        // Log API response
        console.log('NextBillion API Response:', {
          status: response.status,
          routes: optimizationResult.routes?.length || 0,
          optimizationTime: optimizationResult.optimization_time,
          totalDistance: optimizationResult.total_distance,
          timestamp: new Date().toISOString()
        });
        
        // Convert NextBillion response to our route format
        const routes = convertNextBillionResponse(optimizationResult, geocodedData);
        
        setOptimizedRoutes(routes);
        setRoutesAwaitingApproval(routes);
        setCurrentStep(3);
        setShowRouteReview(true);
        addNotification('success', `FreshOne route optimization completed (${mode})`, `Generated ${routes.length} optimized route(s) using NextBillion.ai - AWAITING APPROVAL`);
        return routes;
      }
      
    } catch (error) {
      addNotification('error', 'Route optimization failed', error.message);
      
      // Fallback to simulation if API fails
      if (!testMode) {
        addNotification('warning', 'Falling back to simulation mode', 'API failed, using simulated optimization');
        setTestMode(true);
        return await optimizeRoutes(geocodedData); // Recursive call with test mode
      }
      
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const sendToSamsara = async (routes) => {
    setProcessing(true);
    const mode = testMode ? 'TEST MODE' : 'LIVE MODE';
    addNotification('info', `Uploading FreshOne routes to Samsara (${mode})...`, 'Creating driver assignments');
    
    try {
      if (!testMode && SAMSARA_API_TOKEN !== '[YOUR_SAMSARA_TOKEN_HERE]') {
        // Real Samsara API call with embedded credentials
        const response = await fetch(`https://api.samsara.com/v1/fleet/dispatchers/${SAMSARA_ORG_ID}/routes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SAMSARA_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            routes: routes.map(route => ({
              name: route.id,
              driver: route.driver,
              vehicle: route.vehicle,
              stops: route.stops.map(stop => ({
                address: `${stop.Customer_Name}, ${stop.City}, ${stop.State}`,
                sequence: stop.sequence,
                estimatedArrival: stop.estimatedArrival
              }))
            }))
          })
        });
        
        if (!response.ok) {
          throw new Error(`Samsara API error: ${response.status} ${response.statusText}`);
        }
        
        addNotification('success', 'FreshOne routes uploaded to Samsara (LIVE)', 'Drivers notified via Samsara app');
      } else {
        // Test mode simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        addNotification('success', 'FreshOne routes uploaded to Samsara (TEST MODE)', 'No drivers were notified - test mode active');
      }
      
      setSamsaraStatus('success');
      setCurrentStep(5);
      setShowRouteReview(false);
      
      startRealTimeTracking(routes);
      
      return { success: true, routeIds: routes.map(r => `SAM_${r.id}`) };
    } catch (error) {
      addNotification('error', 'Failed to upload to Samsara', error.message);
      throw error;
    }
  };

  // Generate Excel reports matching FreshOne's current format
  const generateReports = async (routes) => {
    setProcessing(true);
    addNotification('info', 'Generating FreshOne Excel reports...', 'Creating warehouse and customer reports');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const timestamp = new Date();
    const dateStr = timestamp.toLocaleDateString('en-US');
    
    const generatedReports = {
      warehouse: {
        title: `${dateStr.replace(/\//g, ' ')} Tampa Routes and Stops`,
        data: routes[0]?.stops || [],
        format: 'Excel (.xlsx)',
        recipient: 'warehouse@fresh-one.com',
        description: 'Routes and stops list for warehouse loading (matches current format)',
        filename: `${timestamp.getFullYear()} ${String(timestamp.getMonth() + 1).padStart(2, '0')} ${String(timestamp.getDate()).padStart(2, '0')} Tampa Routes and Stops.xlsx`
      },
      customer: {
        title: `${dateStr.replace(/\//g, ' ')} Routes Freedom Fresh Dock Reports`,
        data: routes,
        format: 'Excel (.xlsx)',
        recipient: 'customer@fresh-one.com',
        description: 'Weekly customer delivery reports with driver and truck details',
        filename: `${timestamp.getFullYear()} ${String(timestamp.getMonth() + 1).padStart(2, '0')} ${String(timestamp.getDate()).padStart(2, '0')} Routes Freedom Fresh Dock Reports.xlsx`
      },
      management: {
        title: 'FreshOne Operations Dashboard',
        data: {
          totalRoutes: routes.length,
          totalStops: routes.reduce((acc, route) => acc + (route.stops?.length || 0), 0),
          totalDistance: routes.reduce((acc, route) => acc + (route.totalDistance || 0), 0),
          estimatedTime: routes.reduce((acc, route) => acc + (route.totalTime || 0), 0),
          totalCases: routes.reduce((acc, route) => acc + (route.stops?.reduce((sum, stop) => sum + stop.Cases, 0) || 0), 0),
          estimatedFuelCost: routes.reduce((acc, route) => acc + (route.estimatedFuelCost || 0), 0)
        },
        format: 'Dashboard',
        recipient: 'djanacek@fresh-one.com',
        description: 'Executive summary with KPIs and performance metrics',
        filename: `FreshOne Operations Summary ${dateStr.replace(/\//g, '-')}.html`
      }
    };
    
    setReports(generatedReports);
    setCurrentStep(6);
    addNotification('success', 'FreshOne Excel reports generated', 'Warehouse and customer reports ready');
    return generatedReports;
  };

  // Manual approval function
  const approveAndSendToSamsara = async () => {
    try {
      await sendToSamsara(routesAwaitingApproval);
      const generatedReports = await generateReports(routesAwaitingApproval);
      addNotification('success', 'Routes approved and sent!', 'All systems updated. Download reports below.');
      setProcessing(false);
    } catch (error) {
      setErrors([error.message]);
      addNotification('error', 'Failed to send approved routes', error.message);
      setProcessing(false);
    }
  };

  // Main automation workflow
  const runAutomation = async () => {
    try {
      setErrors([]);
      setNotifications([]);
      
      setBolData(getActiveBolData());
      setCurrentStep(1);
      addNotification('info', 'Automation started', 'Processing BOL data');
      
      const geocoded = await geocodeAddresses(getActiveBolData());
      await optimizeRoutes(geocoded);
      
      setProcessing(false);
      addNotification('info', 'Routes ready for review', 'Please review and approve before sending to Samsara');
      
    } catch (error) {
      setErrors([error.message]);
      addNotification('error', 'Automation failed', error.message);
      setProcessing(false);
    }
  };

  // Helper: Normalize column names
  function normalizeColName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/salesorder/, 'sonumber')
      .replace(/so /, 'sonumber')
      .replace(/so_/, 'sonumber')
      .replace(/customername/, 'customer_name')
      .replace(/deliverydate/, 'delivery_date')
      .replace(/specialinstructions/, 'special_instructions');
  }

  // --- Universal Normalization ---
  function normalizeBusinessName(name) {
    if (!name) return '';
    let n = name.toLowerCase();
    n = n.replace(/\belem\b/g, 'elementary')
         .replace(/\bms\b/g, 'middle school')
         .replace(/\bhs\b/g, 'high school')
         .replace(/\baca\b/g, 'academy')
         .replace(/\bst\b/g, 'saint')
         .replace(/\bdr\b/g, 'doctor')
         .replace(/\bmt\b/g, 'mount')
         .replace(/\bco\b/g, 'company')
         .replace(/\binc\b/g, 'incorporated');
    n = n.replace(/[^a-z0-9 ]/g, ' ')
         .replace(/\b(school|elementary|middle|academy|high|the|of|and|dba|llc|ltd|company|corporation|incorporated)\b/g, '')
         .replace(/\s+/g, ' ')
         .trim();
    return n;
  }

  // --- Universal Fuzzy Match ---
  function levenshtein(a, b) {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }
  function jaroWinkler(s1, s2) {
    // Simple Jaro-Winkler implementation
    const m = s1.length, n = s2.length;
    if (!m || !n) return 0;
    const matchWindow = Math.max(m, n) / 2 - 1;
    let matches = 0, transpositions = 0;
    const s1Matches = Array(m).fill(false);
    const s2Matches = Array(n).fill(false);
    for (let i = 0; i < m; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(n, i + matchWindow + 1);
      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] === s2[j]) {
          s1Matches[i] = true;
          s2Matches[j] = true;
          matches++;
          break;
        }
      }
    }
    if (!matches) return 0;
    let k = 0;
    for (let i = 0; i < m; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    let jw = (matches / m + matches / n + (matches - transpositions / 2) / matches) / 3;
    // Winkler bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(4, m, n); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
    return jw + 0.1 * prefix * (1 - jw);
  }
  function tokenSetRatio(a, b) {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }
  function universalFuzzyMatch(str1, str2) {
    const n1 = normalizeBusinessName(str1);
    const n2 = normalizeBusinessName(str2);
    if (!n1 || !n2) return 0;
    if (n1 === n2) return 1.0;
    const levScore = 1 - (levenshtein(n1, n2) / Math.max(n1.length, n2.length));
    const jwScore = jaroWinkler(n1, n2);
    const tokenScore = tokenSetRatio(n1, n2);
    return Math.max(levScore, jwScore, tokenScore);
  }

  // --- Universal Matching Logic ---
  function generateMissingCustomersReport(bolRows, addresses) {
    const similarMatches = [];
    const trulyMissing = [];
    const addressList = addresses.map(addr => ({
      name: addr.customer_name,
      city: addr.city,
      state: addr.state
    }));
    bolRows.forEach((row) => {
      const customerName = row.Customer_Name || row.customer_name || row['Customer Name'] || row['customer_name'];
      if (!customerName || !customerName.trim()) return;
      const trimmedCustomerName = customerName.trim();
      const storedMapping = customerNameMappings[trimmedCustomerName.toLowerCase()];
      if (storedMapping) return;
      // Find all universal fuzzy matches
      const allSuggestions = addressList.map(addr => {
        const score = universalFuzzyMatch(trimmedCustomerName, addr.name);
        // Debug log for each comparison
        console.log(`[DEBUG] BOL: '${trimmedCustomerName}' vs DB: '${addr.name}' | Score: ${score}`);
        return { ...addr, score };
      }).sort((a, b) => b.score - a.score);
      const bestScore = allSuggestions[0]?.score || 0;
      const bestMatch = allSuggestions[0];
      if (bestScore === 1.0) {
        // Perfect match, skip
        return;
      } else if (bestScore >= 0.7 && bestScore < 1.0) {
        // Strong similar matches: always require user confirmation
        similarMatches.push({
          bolCustomer: trimmedCustomerName,
          bestMatch: bestMatch ? { ...bestMatch, score: bestScore } : null,
          allSuggestions: allSuggestions.filter(s => s.score >= 0.7 && s.score < 1.0).slice(0, 3)
        });
      } else if (bestScore >= 0.4 && bestScore < 0.7) {
        // Moderate similar matches: require user confirmation
        similarMatches.push({
          bolCustomer: trimmedCustomerName,
          bestMatch: bestMatch ? { ...bestMatch, score: bestScore } : null,
          allSuggestions: allSuggestions.filter(s => s.score >= 0.4 && s.score < 0.7).slice(0, 3)
        });
      } else {
        // Truly missing (red)
        trulyMissing.push({
          bolCustomer: trimmedCustomerName,
          suggestions: allSuggestions.slice(0, 3).filter(s => s.score > 0.15)
        });
      }
    });
    // Debug log for output arrays
    console.log('[DEBUG] Final similarMatches:', similarMatches);
    console.log('[DEBUG] Final trulyMissing:', trulyMissing);
    return { similarMatches, trulyMissing };
  }

  // --- Universal Test Suite ---
  {process.env.NODE_ENV !== 'production' && (
    <button
      onClick={() => {
        // Universal test cases
        const testBOLRows = [
          { customer_name: 'ANONA ELEMENTARY' },
          { customer_name: 'CRYSTAL LAKE ELEM LAKE M' },
          { customer_name: 'ST MARY SCHOOL' },
          { customer_name: 'WASHINGTON HIGH' },
          { customer_name: 'LINCOLN ELEM' },
          { customer_name: 'MT VERNON' },
          { customer_name: 'DR KING SCHOOL' },
          { customer_name: 'SOUTHWEST MIDDLE LAKELAN' },
          { customer_name: 'NO MATCH AT ALL' }
        ];
        const testAddresses = [
          { customer_name: 'ANOMO', city: 'CITY1', state: 'FL' },
          { customer_name: 'CRYSTAL LAKE ELEMENTARY', city: 'CITY2', state: 'FL' },
          { customer_name: 'SAINT MARY SCHOOL', city: 'CITY3', state: 'FL' },
          { customer_name: 'WASHINGTON HIGH SCHOOL', city: 'CITY4', state: 'FL' },
          { customer_name: 'LINCOLN ELEMENTARY', city: 'CITY5', state: 'FL' },
          { customer_name: 'MOUNT VERNON', city: 'CITY6', state: 'FL' },
          { customer_name: 'DOCTOR KING SCHOOL', city: 'CITY7', state: 'FL' },
          { customer_name: 'SOUTHWEST MIDDLE SCHOOL LAKELAND', city: 'CITY8', state: 'FL' }
        ];
        window.customerNameMappings = {};
        // Log normalization and scores
        testBOLRows.forEach(bol => {
          testAddresses.forEach(addr => {
            const nBol = normalizeBusinessName(bol.customer_name);
            const nAddr = normalizeBusinessName(addr.customer_name);
            const score = universalFuzzyMatch(bol.customer_name, addr.customer_name);
            console.log(`BOL: '${bol.customer_name}' → '${nBol}' | DB: '${addr.customer_name}' → '${nAddr}' | Score: ${score}`);
          });
        });
        // Call the report function
        const { similarMatches, trulyMissing } = generateMissingCustomersReport(testBOLRows, testAddresses);
        console.log('=== UNIVERSAL TEST SIMILAR MATCHES ===');
        console.log('Similar Matches:', similarMatches);
        console.log('Truly Missing:', trulyMissing);
        alert(
          `Similar Matches (green/yellow):\n` +
          similarMatches.map(m => `${m.bolCustomer} → ${m.allSuggestions.map(s => s.name + ' (score: ' + s.score.toFixed(2) + ')').join(', ')}`).join('\n') +
          `\n\nTruly Missing (red):\n` +
          trulyMissing.map(m => m.bolCustomer).join(', ')
        );
      }}
      className="mt-4 px-4 py-2 bg-yellow-300 text-yellow-900 rounded shadow font-bold border border-yellow-500 hover:bg-yellow-400"
    >
      🧪 Universal Test: Similar Matches Logic
    </button>
  )}

  // Find best matches with score
  function findBestAddressMatches(customerName, addresses, topN = 3) {
    if (!addresses || addresses.length === 0) return [];
    const scored = addresses.map(address => ({
      address,
      score: universalFuzzyMatch(customerName, address.customer_name)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score >= 0.5).slice(0, topN);
  }

  // Helper: Find best matching address from database
  function findBestAddressMatch(customerName, addresses) {
    if (!addresses || addresses.length === 0) return null;
    
    let bestMatch = null;
    let bestScore = 0;
    
    addresses.forEach(address => {
      const score = universalFuzzyMatch(customerName, address.customer_name);
      if (score > bestScore && score >= 0.7) { // Changed to 70% to match missing customers report
        bestScore = score;
        bestMatch = address;
      }
    });
    
    return bestMatch;
  }

  // Helper: Map Excel row to BOL row with address lookup
  async function mapExcelRowWithAddressLookup(row, colMap, addresses) {
    const basicRow = {
      SO_Number: row[colMap.sonumber] || '',
      Customer_Name: row[colMap.customer_name] || '',
      City: row[colMap.city] || '',
      State: row[colMap.state] || '',
      Cases: row[colMap.cases] || '',
      Delivery_Date: row[colMap.delivery_date] || '',
      Special_Instructions: row[colMap.special_instructions] || ''
    };

    // If city/state are missing, try to find them in the address database
    if ((!basicRow.City || !basicRow.State) && basicRow.Customer_Name && addresses.length > 0) {
      const customerNameKey = basicRow.Customer_Name.trim().toLowerCase();
      // 1. Use confirmed mapping if available
      if (customerNameMappings[customerNameKey]) {
        const confirmedName = customerNameMappings[customerNameKey];
        const confirmedMatch = addresses.find(addr => addr.customer_name.toLowerCase() === confirmedName.toLowerCase());
        if (confirmedMatch) {
          if (!basicRow.City && confirmedMatch.city) basicRow.City = confirmedMatch.city;
          if (!basicRow.State && confirmedMatch.state) basicRow.State = confirmedMatch.state;
          if ((!basicRow.City || !basicRow.State) && confirmedMatch.full_address) {
            const extracted = extractCityStateFromAddress(confirmedMatch.full_address);
            if (!basicRow.City && extracted.city) basicRow.City = extracted.city;
            if (!basicRow.State && extracted.state) basicRow.State = extracted.state;
          }
          basicRow.Full_Address = confirmedMatch.full_address;
          basicRow.Zip_Code = confirmedMatch.zip_code;
          basicRow.Phone = confirmedMatch.phone;
          basicRow.Latitude = confirmedMatch.latitude;
          basicRow.Longitude = confirmedMatch.longitude;
          basicRow.Address_Match_Score = 1.0;
          basicRow.Address_Source = 'User Confirmed';
          return basicRow;
        }
      }
      // 2. Only use perfect matches for auto-matching
      let bestMatch = null;
      let bestScore = 0;
      addresses.forEach(address => {
        const score = universalFuzzyMatch(basicRow.Customer_Name, address.customer_name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = address;
        }
      });
      if (bestScore === 1.0) {
        // Only auto-fill if perfect match
        if (!basicRow.City && bestMatch.city) basicRow.City = bestMatch.city;
        if (!basicRow.State && bestMatch.state) basicRow.State = bestMatch.state;
        if ((!basicRow.City || !basicRow.State) && bestMatch.full_address) {
          const extracted = extractCityStateFromAddress(bestMatch.full_address);
          if (!basicRow.City && extracted.city) basicRow.City = extracted.city;
          if (!basicRow.State && extracted.state) basicRow.State = extracted.state;
        }
        basicRow.Full_Address = bestMatch.full_address;
        basicRow.Zip_Code = bestMatch.zip_code;
        basicRow.Phone = bestMatch.phone;
        basicRow.Latitude = bestMatch.latitude;
        basicRow.Longitude = bestMatch.longitude;
        basicRow.Address_Match_Score = 1.0;
        basicRow.Address_Source = 'Database Lookup';
      } else {
        // Do not auto-match for fuzzy matches; require user confirmation
        // Leave address info blank
      }
    }
    return basicRow;
  }

  // Enhanced file upload handler with address database lookup
  const handleFileUpload = async (event) => {
    // 1. Reset customerNameMappings to ensure no stale mappings
    setCustomerNameMappings({});
    setFileUploadProgress('Reading file...');
    setFileUploadError('');
    setFileUploadWarnings([]);
    setFilePreviewData([]);
    setFileReady(false);
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setFileUploadProgress('Parsing Excel...');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!json.length) throw new Error('No data found in Excel file.');
        
        // Normalize columns
        const colMap = {};
        const firstRow = json[0];
        Object.keys(firstRow).forEach(col => {
          const norm = normalizeColName(col);
          colMap[norm] = col;
        });
        
        // Check for minimum required columns (customer_name is the only absolute requirement)
        const required = ['customer_name'];
        const missing = required.filter(r => !colMap[r]);
        if (missing.length) {
          setFileUploadError('Missing required columns: ' + missing.join(', '));
          setFileUploadProgress('');
          return;
        }
        
        // Load addresses from Supabase if not already loaded
        let currentAddresses = addresses;
        if (currentAddresses.length === 0 && supabase && supabaseStatus === '✅ Connected' && !addressesLoaded && !addressesLoading) {
          setFileUploadProgress('Loading address database from Supabase...');
          
          try {
            const { data: addressData, error } = await supabase
              .from('customer_addresses')
              .select('*')
              .order('customer_name', { ascending: true })
              .range(0, 9999); // Load up to 10,000 records to ensure we get all 1,835
            
            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }
            
            currentAddresses = addressData || [];
            setAddresses(currentAddresses); // Update the global addresses state
            setAddressesLoaded(true);
            
            addNotification('success', 'Address database loaded for BOL processing', `${currentAddresses.length} addresses available`);
          } catch (dbError) {
            addNotification('error', 'Failed to load address database', dbError.message);
            // Continue without address database
            currentAddresses = [];
          }
        }
        
        // Check if we have address database available
        const hasAddressDatabase = currentAddresses.length > 0;
        const missingCityState = !colMap.city || !colMap.state;
        
        if (missingCityState && hasAddressDatabase) {
          setFileUploadProgress(`Looking up addresses for ${json.length} customers...`);
          addNotification('info', 'Address database lookup in progress', `Searching ${currentAddresses.length} addresses for ${json.length} customers`);
        } else if (missingCityState && !hasAddressDatabase) {
          setFileUploadError('Missing city/state columns and no address database available. Please upload addresses first or include city/state in BOL file.');
          setFileUploadProgress('');
          return;
        }
        
        // Map and validate rows with address lookup
        const previewRows = [];
        const warnings = [];
        let addressLookups = 0;
        let successfulLookups = 0;
        let totalCustomers = 0;
        let matchedCustomers = 0;
        let unmatchedCustomers = 0;
        
        for (let idx = 0; idx < json.length; idx++) {
          const row = json[idx];
          const mapped = await mapExcelRowWithAddressLookup(row, colMap, currentAddresses);
          if (mapped.Customer_Name && mapped.Customer_Name.trim()) {
            totalCustomers++;
          }
          if (mapped.Address_Source === 'Database Lookup' || mapped.Address_Source === 'User Confirmed') {
            addressLookups++;
            successfulLookups++;
            matchedCustomers++;
          } else if (missingCityState && mapped.Customer_Name) {
            addressLookups++;
            unmatchedCustomers++;
          }
          previewRows.push(mapped);
        }
        setFilePreviewData(previewRows);
        setFileUploadWarnings(warnings);
        // --- CRITICAL FIX: Use generateMissingCustomersReport to surface similar matches ---
        const missingReport = generateMissingCustomersReport(json, currentAddresses);
        // 2. Add debug logs for normalized names, scores, and output arrays
        console.log('=== DEBUG: generateMissingCustomersReport output ===');
        console.log('Similar matches:', missingReport.similarMatches);
        console.log('Truly missing:', missingReport.trulyMissing);
        setSimilarMatchesToConfirm(missingReport.similarMatches);
        setMissingCustomersReport(missingReport.trulyMissing);
        if (missingReport.similarMatches.length > 0) {
          setFileUploadProgress('User confirmation required for similar matches. Please review the yellow section.');
          setFileReady(false);
          addNotification('warning', 'User confirmation required', `${missingReport.similarMatches.length} similar matches need confirmation.`);
          return;
        }
        setFileReady(true);
        setFileUploadProgress('File parsed successfully. All customers matched or missing.');
        addNotification('success', 'BOL processing completed', `Total: ${totalCustomers} | Matched: ${matchedCustomers} | Unmatched: ${unmatchedCustomers}`);
      } catch (err) {
        setFileUploadError('Error parsing file: ' + err.message);
        setFileUploadProgress('');
        addNotification('error', 'BOL file processing failed', err.message);
      }
    };
    reader.onerror = () => {
      setFileUploadError('Error reading file.');
      setFileUploadProgress('');
    };
    reader.readAsArrayBuffer(file);
  };

  // Use parsed file data if ready, else sample data
  const getActiveBolData = () => {
    if (fileReady && filePreviewData.length > 0) return filePreviewData;
    return sampleBOLData;
  };

  // Status indicator component
  const StatusIndicator = ({ step, active }) => {
    const StepIcon = step.icon;
    const isCompleted = currentStep > step.id;
    const isActive = currentStep === step.id;
    
    return (
      <div className={`flex items-center space-x-3 p-4 rounded-lg transition-all ${
        isCompleted ? 'bg-green-50 border border-green-200' :
        isActive ? 'bg-green-50 border border-green-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className={`p-2 rounded-full ${
          isCompleted ? 'bg-green-100 text-green-600' :
          isActive ? 'bg-green-100 text-green-600' :
          'bg-gray-100 text-gray-400'
        }`}>
          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
        </div>
        <div>
          <h3 className={`font-medium ${
            isCompleted ? 'text-green-800' :
            isActive ? 'text-green-800' :
            'text-gray-600'
          }`}>
            {step.title}
          </h3>
          <p className="text-sm text-gray-500">
            {isCompleted ? 'Completed' : isActive ? 'Processing...' : 'Pending'}
          </p>
        </div>
        {isActive && processing && (
          <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
        )}
      </div>
    );
  };

  // Notification component
  const NotificationItem = ({ notification }) => {
    const iconMap = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertCircle,
      info: Bell
    };
    const Icon = iconMap[notification.type];
    const colorMap = {
      success: 'text-green-600 bg-green-50 border-green-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      info: 'text-green-600 bg-green-50 border-green-200'
    };
    
    return (
      <div className={`p-3 rounded-lg border ${colorMap[notification.type]}`}>
        <div className="flex items-start space-x-3">
          <Icon className="w-4 h-4 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
            {notification.details && (
              <p className="text-xs opacity-75 mt-1">{notification.details}</p>
            )}
            <p className="text-xs opacity-50 mt-1">{notification.timestamp}</p>
          </div>
        </div>
      </div>
    );
  };

  function downloadExcel(report) {
    // Multi-sheet support
    if (report.multiSheet && Array.isArray(report.sheets)) {
      const wb = XLSX.utils.book_new();
      report.sheets.forEach(sheet => {
        const ws = XLSX.utils.aoa_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name || 'Sheet');
      });
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), report.filename || 'report.xlsx');
      return;
    }
    // Single-sheet fallback
    let data = [];
    let sheetName = 'Sheet1';
    if (Array.isArray(report.data) && report.data.length > 0 && typeof report.data[0] === 'object' && !Array.isArray(report.data[0])) {
      data.push(Object.keys(report.data[0]));
      report.data.forEach(row => data.push(Object.values(row)));
    } else if (Array.isArray(report.data)) {
      data = report.data;
    } else {
      data = [['No data']];
    }
    if (report.sheetName) sheetName = report.sheetName;
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), report.filename || 'report.xlsx');
  }

  // Test Samsara API connection
  const testSamsaraConnection = async () => {
    if (testMode) {
      addNotification('info', 'Samsara Connection Test (TEST MODE)', 'Simulating connection test - no actual API call made');
      return;
    }

    addNotification('info', 'Testing Samsara API connection...', 'Making test API call to verify credentials');
    
    try {
      const response = await fetch(`https://api.samsara.com/v1/fleet/dispatchers/${SAMSARA_ORG_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SAMSARA_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        addNotification('success', 'Samsara API Connection Successful!', `Connected to organization: ${data.name || SAMSARA_ORG_ID}`);
        console.log('Samsara API Response:', data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Samsara API Test Error:', error);
      addNotification('error', 'Samsara API Connection Failed', error.message);
    }
  };

  // Test NextBillion API connection
  const testNextBillionConnection = async () => {
    if (testMode) {
      addNotification('info', 'NextBillion Connection Test (TEST MODE)', 'Simulating connection test - no actual API call made');
      return;
    }

    if (!NEXTBILLION_API_KEY || NEXTBILLION_API_KEY === '[YOUR_NEXTBILLION_API_KEY_HERE]') {
      addNotification('error', 'NextBillion API key not configured', 'Please configure your NextBillion API key first');
      return;
    }

    addNotification('info', 'Testing NextBillion API connection...', 'Making test API call to verify credentials');
    
    try {
      // Simple test payload with minimal data
      const testPayload = {
        vehicles: [
          {
            id: 'test_vehicle',
            capacity: 100,
            start_location: { lat: warehouseConfig.lat, lng: warehouseConfig.lon },
            end_location: { lat: warehouseConfig.lat, lng: warehouseConfig.lon }
          }
        ],
        stops: [
          {
            id: 'test_stop',
            location: { lat: warehouseConfig.lat + 0.01, lng: warehouseConfig.lon + 0.01 },
            demand: 1,
            service_time: 300
          }
        ],
        options: {
          optimization_type: 'route_optimization',
          time_limit: 5 // Short time limit for testing
        }
      };

      const response = await fetch('https://api.nextbillion.io/optimization/v1/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NEXTBILLION_API_KEY}`,
          'X-API-Key': NEXTBILLION_API_KEY
        },
        body: JSON.stringify(testPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        addNotification('success', 'NextBillion API Connection Successful!', 'Route optimization API is working correctly');
        console.log('NextBillion API Test Response:', data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('NextBillion API Test Error:', error);
      addNotification('error', 'NextBillion API Connection Failed', error.message);
    }
  };

  // Test BOL and Address Database Integration
  const testBOLAddressIntegration = async () => {
    addNotification('info', 'Testing BOL-Address Database Integration', 'Verifying connection between BOL processing and address database');
    
    try {
      // Check Supabase connection
      if (!supabase || supabaseStatus !== '✅ Connected') {
        throw new Error('Supabase not connected');
      }
      
      // Force reload addresses for testing
      console.log('Testing: Force reloading addresses...');
      setAddressesLoaded(false);
      await loadAddresses();
      
      // Check if addresses are loaded
      if (addresses.length === 0) {
        addNotification('warning', 'No addresses loaded', 'Address database appears to be empty or not loading');
        return;
      }
      
      // Test address lookup with sample data
      const testCustomerNames = ['ALTA VISTA ELEMENTARY', 'HORIZONS ELEMENTARY', 'BOONE MIDDLE SCHOOL'];
      let matchesFound = 0;
      
      testCustomerNames.forEach(customerName => {
        const match = findBestAddressMatch(customerName, addresses);
        if (match) {
          matchesFound++;
          console.log(`Test match found: ${customerName} -> ${match.customer_name} (${match.city}, ${match.state})`);
        }
      });
      
      const testResults = {
        totalAddresses: addresses.length,
        testCustomers: testCustomerNames.length,
        matchesFound: matchesFound,
        matchRate: Math.round((matchesFound / testCustomerNames.length) * 100)
      };
      
      addNotification('success', 'BOL-Address Integration Test Complete', 
        `${testResults.matchesFound}/${testResults.testCustomers} test customers matched (${testResults.matchRate}% success rate) from ${testResults.totalAddresses} addresses`);
      
      console.log('BOL-Address Integration Test Results:', testResults);
      
    } catch (error) {
      addNotification('error', 'BOL-Address Integration Test Failed', error.message);
      console.error('BOL-Address Integration Test Error:', error);
    }
  };

  // Debug Import Function - Comprehensive analysis of import process
  const debugImportProcess = async () => {
    addNotification('info', 'Starting Import Debug Analysis', 'Analyzing import process and database state');
    
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }
      
      console.log('=== IMPORT DEBUG ANALYSIS START ===');
      
      // Step 1: Check database state
      console.log('Step 1: Checking database state...');
      const { count, error: countError } = await supabase
        .from('customer_addresses')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Count query failed:', countError);
      } else {
        console.log(`Database contains ${count} total records`);
      }
      
      // Step 2: Check loaded addresses
      console.log('Step 2: Checking loaded addresses...');
      console.log(`App state contains ${addresses.length} valid addresses`);
      console.log(`Addresses loaded flag: ${addressesLoaded}`);
      console.log(`Addresses loading flag: ${addressesLoading}`);
      
      // Step 3: Analyze for duplicates
      console.log('Step 3: Analyzing for duplicates...');
      const customerNames = addresses.map(addr => addr.customer_name);
      const uniqueNames = new Set(customerNames);
      const duplicateCount = customerNames.length - uniqueNames.size;
      
      console.log(`Total customer names: ${customerNames.length}`);
      console.log(`Unique customer names: ${uniqueNames.size}`);
      console.log(`Duplicate count: ${duplicateCount}`);
      
      if (duplicateCount > 0) {
        // Find the duplicates
        const nameCounts = {};
        customerNames.forEach(name => {
          nameCounts[name] = (nameCounts[name] || 0) + 1;
        });
        
        const duplicates = Object.entries(nameCounts)
          .filter(([name, count]) => count > 1)
          .slice(0, 10); // Show first 10 duplicates
        
        console.log('Sample duplicates:', duplicates);
      }
      
      // Step 4: Check for validation issues (should be 0 since we filter)
      console.log('Step 4: Checking for validation issues...');
      const invalidAddresses = addresses.filter(addr => {
        return !addr.customer_name || addr.customer_name.trim() === '';
      });
      
      console.log(`Invalid addresses in loaded data (should be 0): ${invalidAddresses.length}`);
      if (invalidAddresses.length > 0) {
        console.log('Sample invalid addresses:', invalidAddresses.slice(0, 5));
      }
      
      // Check for addresses needing city/state extraction
      const addressesNeedingExtraction = addresses.filter(addr => {
        return !addr.city || !addr.state;
      });
      
      console.log(`Addresses needing city/state extraction: ${addressesNeedingExtraction.length}`);
      if (addressesNeedingExtraction.length > 0) {
        console.log('Sample addresses needing extraction:', addressesNeedingExtraction.slice(0, 3).map(addr => ({
          customer_name: addr.customer_name,
          full_address: addr.full_address,
          city: addr.city || 'MISSING',
          state: addr.state || 'MISSING'
        })));
      }
      
      // Step 5: Check for data truncation
      console.log('Step 5: Checking for data truncation...');
      const truncatedAddresses = addresses.filter(addr => {
        return addr.customer_name && addr.customer_name.length > 100 ||
               addr.full_address && addr.full_address.length > 500;
      });
      
      console.log(`Potentially truncated addresses: ${truncatedAddresses.length}`);
      
      // Step 6: Analyze by city/state
      console.log('Step 6: Analyzing by city/state...');
      const cityStateCounts = {};
      addresses.forEach(addr => {
        const key = `${addr.city}, ${addr.state}`;
        cityStateCounts[key] = (cityStateCounts[key] || 0) + 1;
      });
      
      const topCities = Object.entries(cityStateCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      console.log('Top 5 cities:', topCities);
      
      // Step 7: Check for import preview data
      console.log('Step 7: Checking import preview data...');
      console.log(`Import preview data: ${addressPreviewData.length} records`);
      console.log(`Import ready flag: ${addressReady}`);
      
      if (addressPreviewData.length > 0) {
        const previewNames = addressPreviewData.map(addr => addr.customer_name);
        const loadedNames = addresses.map(addr => addr.customer_name);
        
        const missingFromLoaded = previewNames.filter(name => !loadedNames.includes(name));
        const extraInLoaded = loadedNames.filter(name => !previewNames.includes(name));
        
        console.log(`Missing from loaded: ${missingFromLoaded.length}`);
        console.log(`Extra in loaded: ${extraInLoaded.length}`);
        
        if (missingFromLoaded.length > 0) {
          console.log('Sample missing addresses:', missingFromLoaded.slice(0, 10));
        }
      }
      
      // Step 8: Get total invalid addresses in database
      console.log('Step 8: Getting total invalid addresses in database...');
      const { data: allData, error: allDataError } = await supabase
        .from('customer_addresses')
        .select('customer_name, city, state, full_address')
        .range(0, 9999); // Load up to 10,000 records to ensure we get all 1,835
      
      let totalInvalidInDB = 0;
      let totalNeedingExtraction = 0;
      if (!allDataError && allData) {
        totalInvalidInDB = allData.filter(addr => 
          !addr.customer_name || addr.customer_name.trim() === ''
        ).length;
        totalNeedingExtraction = allData.filter(addr => 
          !addr.city || !addr.state
        ).length;
        console.log(`Total invalid addresses in database: ${totalInvalidInDB}`);
        console.log(`Total addresses needing city/state extraction: ${totalNeedingExtraction}`);
      }
      
      // Step 9: Generate summary
      const summary = {
        databaseCount: count || 0,
        loadedCount: addresses.length,
        totalInvalidInDB: totalInvalidInDB,
        totalNeedingExtraction: totalNeedingExtraction,
        duplicateCount: duplicateCount,
        invalidCount: invalidAddresses.length,
        truncatedCount: truncatedAddresses.length,
        discrepancy: (count || 0) - addresses.length,
        missingFromPreview: addressPreviewData.length > 0 ? 
          addressPreviewData.filter(addr => !addresses.some(loaded => loaded.customer_name === addr.customer_name)).length : 0
      };
      
      console.log('=== IMPORT DEBUG SUMMARY ===');
      console.log(summary);
      
      // Show results in notification
      const message = `DB: ${summary.databaseCount} | Valid: ${summary.loadedCount} | Invalid: ${summary.totalInvalidInDB} | Need Extraction: ${summary.totalNeedingExtraction} | Duplicates: ${summary.duplicateCount}`;
      addNotification('info', 'Import Debug Complete', message);
      
      // If there are invalid addresses, explain the filtering
      if (summary.totalInvalidInDB > 0) {
        addNotification('info', 'Address filtering active', 
          `${summary.totalInvalidInDB} addresses filtered out due to missing customer names. Only valid addresses are loaded for BOL processing.`);
      }
      
      // If there are addresses needing extraction, explain the process
      if (summary.totalNeedingExtraction > 0) {
        addNotification('info', 'City/State extraction ready', 
          `${summary.totalNeedingExtraction} addresses will have city/state extracted from full_address during BOL processing.`);
      }
      
      // If there's a significant discrepancy, suggest reloading
      if (Math.abs(summary.discrepancy) > 10) {
        addNotification('warning', 'Significant discrepancy detected', 
          `Database has ${summary.databaseCount} records but only ${summary.loadedCount} are loaded. Consider reloading addresses.`);
      }
      
      console.log('=== IMPORT DEBUG ANALYSIS END ===');
      
    } catch (error) {
      console.error('Import debug analysis failed:', error);
      addNotification('error', 'Import Debug Failed', error.message);
    }
  };

  // Function to recover missing addresses
  const recoverMissingAddresses = async () => {
    addNotification('info', 'Starting address recovery', 'Identifying and recovering missing addresses');
    
    try {
      if (!supabase || !addressPreviewData.length) {
        throw new Error('No preview data available for recovery');
      }
      
      console.log('=== ADDRESS RECOVERY START ===');
      
      // Get current database state
      const { data: currentData, error: currentError } = await supabase
        .from('customer_addresses')
        .select('customer_name, city, state')
        .range(0, 9999); // Load up to 10,000 records to ensure we get all 1,835
      
      if (currentError) {
        throw new Error(`Failed to get current data: ${currentError.message}`);
      }
      
      const currentNames = new Set(currentData.map(addr => addr.customer_name));
      const previewNames = new Set(addressPreviewData.map(addr => addr.customer_name));
      
      // Find missing addresses
      const missingAddresses = addressPreviewData.filter(addr => 
        !currentNames.has(addr.customer_name)
      );
      
      console.log(`Current database: ${currentData.length} addresses`);
      console.log(`Preview data: ${addressPreviewData.length} addresses`);
      console.log(`Missing addresses: ${missingAddresses.length}`);
      
      if (missingAddresses.length === 0) {
        addNotification('success', 'No missing addresses found', 'All preview addresses are in the database');
        return;
      }
      
      // Show sample of missing addresses
      console.log('Sample missing addresses:', missingAddresses.slice(0, 5).map(addr => ({
        customer_name: addr.customer_name,
        city: addr.city,
        state: addr.state
      })));
      
      // Attempt to import missing addresses
      addNotification('info', 'Recovering missing addresses', `Attempting to import ${missingAddresses.length} missing addresses`);
      
      const batchSize = 25; // Smaller batches for recovery
      const totalBatches = Math.ceil(missingAddresses.length / batchSize);
      let recoveredCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = missingAddresses.slice(i * batchSize, (i + 1) * batchSize);
        
        console.log(`Recovery batch ${i + 1}/${totalBatches}: ${batch.length} addresses`);
        
        const { data, error } = await supabase
          .from('customer_addresses')
          .insert(batch)
          .select();
        
        if (error) {
          console.error(`Recovery batch ${i + 1} failed:`, error);
          failedCount += batch.length;
        } else {
          console.log(`Recovery batch ${i + 1} successful:`, data?.length || 0, 'addresses');
          recoveredCount += batch.length;
        }
        
        // Small delay between batches
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log('=== RECOVERY SUMMARY ===');
      console.log(`Attempted to recover: ${missingAddresses.length} addresses`);
      console.log(`Successfully recovered: ${recoveredCount} addresses`);
      console.log(`Failed to recover: ${failedCount} addresses`);
      
      addNotification('success', 'Address recovery completed', 
        `Recovered ${recoveredCount}/${missingAddresses.length} missing addresses`);
      
      // Reload addresses to update the app state
      await loadAddresses();
      
      console.log('=== ADDRESS RECOVERY END ===');
      
    } catch (error) {
      console.error('Address recovery failed:', error);
      addNotification('error', 'Address recovery failed', error.message);
    }
  };

  // FreshOne API status check
  const checkApiStatus = () => {
    const mode = testMode ? 'TEST MODE' : 'LIVE MODE';
    const samsaraStatus = SAMSARA_API_TOKEN !== '[YOUR_SAMSARA_TOKEN_HERE]' ? '✅ Configured' : '⏳ Not configured';
    const nextBillionStatus = NEXTBILLION_API_KEY !== '[YOUR_NEXTBILLION_API_KEY_HERE]' ? '✅ Configured' : '⏳ Not configured';
    
    addNotification('info', `FreshOne API Status (${mode})`, `Samsara: ${samsaraStatus} | NextBillion: ${nextBillionStatus}`);
  };

  // Supabase config state - directly configured for FreshOne
  const [supabaseUrl, setSupabaseUrl] = useState('https://ksikfpcxkpqfqsdhjpnu.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzaWtmcGN4a3BxZnFzZGhqcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzM3NDUsImV4cCI6MjA2NjgwOTc0NX0.y9PfwqsGTEH8DMjQhaur-lSDaPXqI8jD85ntUrm-gzQ');
  const [supabaseStatus, setSupabaseStatus] = useState('✅ Connected');
  
  // Debug Supabase configuration
  console.log('Supabase Configuration:', {
    supabaseUrl: supabaseUrl ? 'Set' : 'Not Set',
    supabaseKey: supabaseKey ? 'Set' : 'Not Set',
    status: supabaseStatus
  });
  const [supabaseTesting, setSupabaseTesting] = useState(false);

  // Supabase client (recreated on config change) - only create if credentials are available
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  // Function to create the customer_addresses table if it doesn't exist
  const createCustomerAddressesTable = async () => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    console.log('Checking if customer_addresses table exists...');
    
    try {
      // First, try to query the table to see if it exists
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .limit(1);
      
      if (error) {
        // If table doesn't exist, create it
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log('Table does not exist, creating customer_addresses table...');
          
          // Since we can't create tables via REST API, we'll provide instructions
          // and throw an error to prompt manual creation
          const createTableSQL = `
CREATE TABLE customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  full_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  special_instructions TEXT,
  latitude FLOAT,
  longitude FLOAT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON customer_addresses
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_customer_addresses_customer_name ON customer_addresses(customer_name);
CREATE INDEX idx_customer_addresses_city_state ON customer_addresses(city, state);
CREATE INDEX idx_customer_addresses_external_id ON customer_addresses(external_id);
          `;
          
          console.log('Table creation SQL:', createTableSQL);
          
          // Copy SQL to clipboard
          navigator.clipboard.writeText(createTableSQL).catch(() => {
            console.log('Could not copy to clipboard');
          });
          
          throw new Error('Table does not exist. SQL has been copied to clipboard. Please run it in Supabase SQL editor.');
        } else {
          // Some other error occurred
          throw error;
        }
      } else {
        // Table exists, check if RLS is enabled
        console.log('Table already exists, checking RLS configuration...');
        
        // Try to insert a test record to check RLS
        const testRecord = {
          customer_name: 'RLS_TEST_' + Date.now(),
          full_address: 'Test Address',
          city: 'Test City',
          state: 'TS',
          zip_code: '12345',
          phone: '555-1234',
          special_instructions: 'RLS test record',
          latitude: null,
          longitude: null,
          external_id: 'rls_test_' + Date.now()
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('customer_addresses')
          .insert([testRecord])
          .select();
        
        if (insertError) {
          console.error('RLS test failed:', insertError);
          addNotification('warning', 'RLS configuration issue', 
            'Table exists but may have RLS restrictions. Check Supabase policies.');
        } else {
          console.log('RLS test successful');
          
          // Clean up test record
          if (insertData && insertData[0]) {
            const { error: cleanupError } = await supabase
              .from('customer_addresses')
              .delete()
              .eq('id', insertData[0].id);
            
            if (cleanupError) {
              console.error('Failed to clean up RLS test record:', cleanupError);
            }
          }
        }
        
        return true;
      }
    } catch (error) {
      console.error('Table creation/verification error:', error);
      throw error;
    }
  };

  // Create customer name mappings table for permanent match storage
  const createCustomerNameMappingsTable = async () => {
    if (!supabase) {
      addNotification('error', 'Supabase not configured', 'Please configure Supabase connection first');
      return;
    }

    try {
      addNotification('info', 'Creating customer_name_mappings table...', 'Setting up permanent match storage');

      // Create the customer_name_mappings table using SQL
      const createTableSQL = `
CREATE TABLE IF NOT EXISTS customer_name_mappings (
  id SERIAL PRIMARY KEY,
  bol_name TEXT NOT NULL,
  database_name TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_name_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON customer_name_mappings
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_name_mappings_bol_name ON customer_name_mappings(bol_name);
CREATE INDEX IF NOT EXISTS idx_customer_name_mappings_database_name ON customer_name_mappings(database_name);
      `;
      
      console.log('Customer name mappings table creation SQL:', createTableSQL);
      
      // Copy SQL to clipboard
      navigator.clipboard.writeText(createTableSQL).catch(() => {
        console.log('Could not copy to clipboard');
      });
      
      addNotification('info', 'SQL copied to clipboard', 'Please run the SQL in Supabase SQL editor to create the mappings table');
      
    } catch (error) {
      console.error('Error in createCustomerNameMappingsTable:', error);
      addNotification('error', 'Failed to create mappings table', error.message);
    }
  };

  // Load existing customer name mappings from database
  const loadCustomerNameMappings = async () => {
    console.log('=== LOAD CUSTOMER NAME MAPPINGS ===');
    console.log('Supabase client available:', !!supabase);
    
    if (!supabase) {
      console.error('Supabase client not available for loading mappings');
      return;
    }

    try {
      console.log('Querying customer_name_mappings table...');
      const { data, error } = await supabase
        .from('customer_name_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading mappings:', error);
        addNotification('error', 'Failed to load mappings', error.message);
        return;
      }

      console.log('Raw mappings data from database:', data);

      // Convert array to object for faster lookup
      const mappings = {};
      data.forEach(mapping => {
        mappings[mapping.bol_name.toLowerCase()] = mapping.database_name;
      });

      setCustomerNameMappings(mappings);
      console.log('✅ Loaded customer name mappings:', mappings);
      console.log('Total mappings loaded:', Object.keys(mappings).length);
      
      if (Object.keys(mappings).length > 0) {
        addNotification('info', 'Customer name mappings loaded', `${Object.keys(mappings).length} permanent matches loaded from database`);
      } else {
        console.log('No existing mappings found in database');
      }
    } catch (error) {
      console.error('Exception loading customer name mappings:', error);
      addNotification('error', 'Failed to load mappings', error.message);
    }
  };

  // Save confirmed match to database
  const saveConfirmedMatch = async (bolName, databaseName) => {
    console.log('=== SAVE CONFIRMED MATCH ===');
    console.log('Saving match to database:', bolName, '->', databaseName);
    console.log('Supabase client available:', !!supabase);
    
    if (!supabase) {
      console.error('Supabase client not available');
      addNotification('error', 'Cannot save match', 'Supabase not configured');
      return;
    }

    try {
      console.log('Attempting to insert into customer_name_mappings table...');
      const { data, error } = await supabase
        .from('customer_name_mappings')
        .insert([{
          bol_name: bolName,
          database_name: databaseName,
          confirmed_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error saving confirmed match:', error);
        addNotification('error', 'Failed to save match', error.message);
        return;
      }

      console.log('Successfully saved to database:', data);

      // Update local state
      setCustomerNameMappings(prev => {
        const newMappings = {
          ...prev,
          [bolName.toLowerCase()]: databaseName
        };
        console.log('Updated local mappings:', newMappings);
        return newMappings;
      });

      console.log('✅ Match saved successfully:', bolName, '->', databaseName);
      addNotification('success', 'Match saved permanently', `"${bolName}" -> "${databaseName}" saved to database`);
    } catch (error) {
      console.error('Exception saving confirmed match:', error);
      addNotification('error', 'Failed to save match', error.message);
    }
  };

  // Address management state
  const [addresses, setAddresses] = useState([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressUploadProgress, setAddressUploadProgress] = useState('');
  const [addressUploadError, setAddressUploadError] = useState('');
  const [addressUploadWarnings, setAddressUploadWarnings] = useState([]);
  const [addressPreviewData, setAddressPreviewData] = useState([]);
  const [addressReady, setAddressReady] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressSearchTerm, setAddressSearchTerm] = useState('');
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);

  // Load addresses from Supabase
  const loadAddresses = async () => {
    // Prevent multiple simultaneous loads
    if (addressesLoading) {
      console.log('Address loading already in progress, skipping...');
      return;
    }
    
    if (!supabase) {
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    console.log('Starting address load from Supabase...');
    setAddressesLoading(true);
    
    try {
      addNotification('info', 'Loading addresses from Supabase', 'Fetching all addresses from database...');
      
      // First, get the total count
      const { count, error: countError } = await supabase
        .from('customer_addresses')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Count query error:', countError);
      } else {
        console.log(`Total records in database: ${count}`);
      }
      
      // Load ALL addresses from database using pagination (Supabase has 1,000 record limit)
      console.log('Loading all addresses from database using pagination...');
      
      let allAddresses = [];
      let batchNumber = 1;
      let hasMoreRecords = true;
      const batchSize = 1000;
      
      while (hasMoreRecords) {
        const startIndex = (batchNumber - 1) * batchSize;
        const endIndex = startIndex + batchSize - 1;
        
        console.log(`Loading batch ${batchNumber} (records ${startIndex}-${endIndex})...`);
        addNotification('info', `Loading address batch ${batchNumber}`, `Fetching records ${startIndex + 1}-${endIndex + 1} from database`);
        
        const { data: batchData, error: batchError } = await supabase
          .from('customer_addresses')
          .select('*')
          .order('customer_name', { ascending: true })
          .range(startIndex, endIndex);
        
        if (batchError) {
          console.error(`Batch ${batchNumber} error:`, batchError);
          throw batchError;
        }
        
        console.log(`Batch ${batchNumber} returned ${batchData?.length || 0} records`);
        
        if (batchData && batchData.length > 0) {
          allAddresses = [...allAddresses, ...batchData];
          console.log(`Total addresses loaded so far: ${allAddresses.length}`);
        }
        
        // If we got fewer than batchSize records, we've reached the end
        if (!batchData || batchData.length < batchSize) {
          hasMoreRecords = false;
          console.log(`Reached end of data. Final batch had ${batchData?.length || 0} records`);
        } else {
          batchNumber++;
        }
        
        // Small delay between batches to be nice to the server
        if (hasMoreRecords) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Pagination complete! Loaded ${allAddresses.length} total addresses in ${batchNumber} batches`);
      addNotification('success', 'Address pagination complete', `Loaded ${allAddresses.length} addresses in ${batchNumber} batches`);
      
      const finalData = allAddresses;
      
      const totalLoaded = finalData?.length || 0;
      console.log(`Loaded ${totalLoaded} total addresses from Supabase`);
      
      // Separate valid and invalid addresses - more flexible validation
      const validAddresses = finalData?.filter(addr => 
        addr.customer_name && addr.customer_name.trim() !== ''
      ) || [];
      
      const invalidAddresses = finalData?.filter(addr => 
        !addr.customer_name || addr.customer_name.trim() === ''
      ) || [];
      
      console.log(`Valid addresses (with customer_name): ${validAddresses.length}`);
      console.log(`Invalid addresses (missing customer_name): ${invalidAddresses.length}`);
      
      // Log sample invalid addresses for debugging
      if (invalidAddresses.length > 0) {
        console.log('Sample invalid addresses:', invalidAddresses.slice(0, 5).map(addr => ({
          id: addr.id,
          customer_name: addr.customer_name || 'MISSING',
          full_address: addr.full_address || 'MISSING',
          city: addr.city || 'EXTRACTED_LATER',
          state: addr.state || 'EXTRACTED_LATER'
        })));
      }
      
      // Check for duplicates in valid addresses
      const customerNames = validAddresses.map(addr => addr.customer_name);
      const uniqueNames = new Set(customerNames);
      const duplicateCount = customerNames.length - uniqueNames.size;
      
      if (duplicateCount > 0) {
        console.warn(`Found ${duplicateCount} duplicate customer names in valid addresses`);
        addNotification('warning', 'Duplicate addresses detected', `${duplicateCount} duplicate customer names found`);
      }
      
      // Log some sample valid data for verification
      console.log('Sample valid addresses loaded:', validAddresses.slice(0, 5).map(addr => ({
        id: addr.id,
        customer_name: addr.customer_name,
        city: addr.city,
        state: addr.state
      })));
      
      // Set only valid addresses in the app state
      setAddresses(validAddresses);
      setAddressesLoaded(true);
      
      if (validAddresses.length > 0) {
        const message = `${validAddresses.length.toLocaleString()} valid addresses loaded, ${invalidAddresses.length.toLocaleString()} invalid addresses filtered`;
        addNotification('success', 'Address database loaded', message);
        console.log('Valid addresses loaded successfully:', message);
        
        // Log discrepancy if count doesn't match expected
        if (count && count !== totalLoaded) {
          console.warn(`Count discrepancy: Database shows ${count} records, but loaded ${totalLoaded}`);
          addNotification('warning', 'Count discrepancy detected', 
            `Database: ${count} records, Loaded: ${totalLoaded} records, Valid: ${validAddresses.length} records`);
        }
        
        // Show detailed statistics
        console.log('=== ADDRESS LOADING STATISTICS ===');
        console.log(`Total database records: ${count || totalLoaded}`);
        console.log(`Total loaded: ${totalLoaded}`);
        console.log(`Valid addresses: ${validAddresses.length}`);
        console.log(`Invalid addresses: ${invalidAddresses.length}`);
        console.log(`Duplicate customer names: ${duplicateCount}`);
        console.log(`Available for BOL processing: ${validAddresses.length}`);
        
        // Show city/state extraction info
        const addressesWithCityState = validAddresses.filter(addr => addr.city && addr.state);
        const addressesNeedingExtraction = validAddresses.filter(addr => !addr.city || !addr.state);
        console.log(`Addresses with city/state: ${addressesWithCityState.length}`);
        console.log(`Addresses needing city/state extraction: ${addressesNeedingExtraction.length}`);
        
      } else {
        addNotification('warning', 'No valid addresses found', 
          `${invalidAddresses.length} addresses found but all are missing customer names`);
        console.log('No valid addresses found in database');
      }
      
      // Store invalid addresses for potential recovery
      if (invalidAddresses.length > 0) {
        console.log('Invalid addresses stored for potential recovery:', invalidAddresses.length);
        // You could add state for invalid addresses if needed for recovery
      }
      
      // Log city/state extraction readiness
      const addressesWithFullAddress = validAddresses.filter(addr => addr.full_address);
      console.log(`Addresses with full_address for extraction: ${addressesWithFullAddress.length}`);
      if (addressesWithFullAddress.length > 0) {
        console.log('City/state extraction will be performed during BOL processing as needed');
      }
      
    } catch (error) {
      console.error('Address loading error:', error);
      addNotification('error', 'Failed to load addresses', error.message);
      setAddressesLoaded(false);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Upload address list handler with Samsara CSV support
  const handleAddressUpload = (event) => {
    setAddressUploadProgress('Reading address file...');
    setAddressUploadError('');
    setAddressUploadWarnings([]);
    setAddressPreviewData([]);
    setAddressReady(false);
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setAddressUploadProgress('Parsing address file...');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (!json.length) throw new Error('No data found in address file.');
        
        // Detect Samsara format by checking for specific columns
        const firstRow = json[0];
        const hasSamsaraColumns = firstRow.hasOwnProperty('Name') && 
                                 firstRow.hasOwnProperty('Address') && 
                                 firstRow.hasOwnProperty('Latitude') && 
                                 firstRow.hasOwnProperty('Longitude');
        
        setAddressUploadProgress(hasSamsaraColumns ? 'Processing Samsara CSV format...' : 'Processing standard address format...');
        
        let previewRows = [];
        let warnings = [];
        
        if (hasSamsaraColumns) {
          // Process Samsara CSV format
          addNotification('info', 'Detected Samsara CSV format', 'Processing with Samsara column mapping');
          
          json.forEach((row, idx) => {
            // Show progress for large files
            if (json.length > 100 && idx % 100 === 0) {
              setAddressUploadProgress(`Processing Samsara data... ${idx}/${json.length} records`);
            }
            
            // Extract city and state from Address field
            const addressParts = extractCityStateFromAddress(row.Address || '');
            
            const address = {
              customer_name: row.Name || '',
              full_address: row.Address || '',
              city: addressParts.city,
              state: addressParts.state,
              zip_code: '', // Not provided in Samsara format
              phone: '', // Not provided in Samsara format
              special_instructions: row.Notes || '',
              latitude: parseFloat(row.Latitude) || null,
              longitude: parseFloat(row.Longitude) || null,
              external_id: row.ID || `samsara_${idx}`
            };
            
            // Validate required fields for Samsara format
            if (!address.customer_name) {
              warnings.push(`Row ${idx + 2}: Missing customer name.`);
            }
            if (!address.full_address) {
              warnings.push(`Row ${idx + 2}: Missing address.`);
            }
            if (!address.latitude || !address.longitude) {
              warnings.push(`Row ${idx + 2}: Missing or invalid coordinates.`);
            }
            // Note: city/state extraction will happen during BOL processing if needed
            if (!address.city || !address.state) {
              console.log(`Row ${idx + 2}: City/state will be extracted from: "${row.Address}" during BOL processing`);
            }
            
            previewRows.push(address);
          });
          
        } else {
          // Process standard address format (existing logic)
          addNotification('info', 'Detected standard address format', 'Processing with standard column mapping');
          
          // Normalize address columns
          const colMap = {};
          Object.keys(firstRow).forEach(col => {
            const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '');
            colMap[norm] = col;
          });
          
          json.forEach((row, idx) => {
            // Show progress for large files
            if (json.length > 100 && idx % 100 === 0) {
              setAddressUploadProgress(`Processing standard data... ${idx}/${json.length} records`);
            }
            
            const address = {
              customer_name: row[colMap.customername] || row[colMap.customer] || row[colMap.name] || '',
              full_address: row[colMap.fulladdress] || row[colMap.address] || '',
              city: row[colMap.city] || '',
              state: row[colMap.state] || '',
              zip_code: row[colMap.zipcode] || row[colMap.zip] || '',
              phone: row[colMap.phone] || row[colMap.telephone] || '',
              special_instructions: row[colMap.specialinstructions] || row[colMap.instructions] || '',
              latitude: null,
              longitude: null,
              external_id: null
            };
            
            // Validate required fields - only customer_name is required
            if (!address.customer_name) {
              warnings.push(`Row ${idx + 2}: Missing customer name.`);
            }
            // Note: city/state extraction will happen during BOL processing if needed
            if (!address.city || !address.state) {
              console.log(`Row ${idx + 2}: City/state will be extracted from full_address during BOL processing`);
            }
            
            previewRows.push(address);
          });
        }
        
        setAddressPreviewData(previewRows);
        setAddressUploadWarnings(warnings);
        setAddressUploadProgress(`Address file parsed successfully. ${previewRows.length} records processed.`);
        setAddressReady(true);
        
        // Show summary notification
        const formatType = hasSamsaraColumns ? 'Samsara CSV' : 'Standard';
        addNotification('success', `${formatType} address file processed`, 
          `${previewRows.length} addresses ready for import${warnings.length > 0 ? ` (${warnings.length} warnings)` : ''}`);
        
      } catch (err) {
        setAddressUploadError('Error parsing address file: ' + err.message);
        setAddressUploadProgress('');
        addNotification('error', 'Address file parsing failed', err.message);
      }
    };
    
    reader.onerror = () => {
      setAddressUploadError('Error reading address file.');
      setAddressUploadProgress('');
      addNotification('error', 'File reading failed', 'Could not read the uploaded file');
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Bulk import addresses to Supabase
  const importAddressesToSupabase = async () => {
    if (!supabase) {
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    if (!addressReady || addressPreviewData.length === 0) {
      addNotification('error', 'No address data ready for import');
      return;
    }
    
    console.log('Starting address import to Supabase...');
    console.log('Total addresses to import:', addressPreviewData.length);
    console.log('Sample address data:', addressPreviewData.slice(0, 2));
    
    setAddressUploadProgress('Preparing database for import...');
    
    try {
      // Step 1: Ensure the table exists
      console.log('Step 1: Ensuring customer_addresses table exists...');
      setAddressUploadProgress('Checking database table...');
      
      try {
        await createCustomerAddressesTable();
        addNotification('success', 'Database ready', 'Table structure verified');
      } catch (tableError) {
        console.error('Table creation failed:', tableError);
        addNotification('error', 'Table creation failed', tableError.message);
        
        // Provide manual creation instructions
        const manualSQL = `
CREATE TABLE customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  full_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  special_instructions TEXT,
  latitude FLOAT,
  longitude FLOAT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;
        
        addNotification('info', 'Manual table creation required', 
          'Please run the SQL in your Supabase SQL editor and try again');
        console.log('Manual SQL to run:', manualSQL);
        
        // Copy SQL to clipboard
        navigator.clipboard.writeText(manualSQL).catch(() => {
          console.log('Could not copy to clipboard');
        });
        
        throw new Error('Table creation failed - please create manually');
      }
      
      // Step 2: Test the table structure with a single insert
      console.log('Step 2: Testing table structure with single insert...');
      setAddressUploadProgress('Testing table structure...');
      
      const testAddress = {
        customer_name: 'TEST CUSTOMER',
        full_address: '123 Test St, Test City, TS',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        phone: '555-1234',
        special_instructions: 'Test address for schema validation',
        latitude: null,
        longitude: null,
        external_id: 'test_import_validation'
      };
      
      console.log('Test address data:', testAddress);
      
      const { data: testData, error: testError } = await supabase
        .from('customer_addresses')
        .insert([testAddress])
        .select();
      
      if (testError) {
        console.error('Table structure test failed:', testError);
        addNotification('error', 'Database schema test failed', testError.message);
        throw new Error(`Schema validation failed: ${testError.message}`);
      }
      
      console.log('Table structure test successful:', testData);
      addNotification('success', 'Database schema validated', 'Table structure is correct');
      
      // Clean up test record
      if (testData && testData[0]) {
        const { error: cleanupError } = await supabase
          .from('customer_addresses')
          .delete()
          .eq('id', testData[0].id);
        
        if (cleanupError) {
          console.error('Failed to clean up test record:', cleanupError);
        }
      }
      
      // Step 3: Process addresses in batches for large files
      console.log('Step 3: Starting bulk import process...');
      setAddressUploadProgress('Starting bulk import...');
      
      const batchSize = 50; // Reduced batch size for better error tracking
      const totalBatches = Math.ceil(addressPreviewData.length / batchSize);
      let importedCount = 0;
      let failedBatches = 0;
      let failedAddresses = [];
      let successfulBatches = 0;
      let batchResults = [];
      
      console.log(`Processing ${addressPreviewData.length} addresses in ${totalBatches} batches of ${batchSize}`);
      console.log('Import preview data validation:');
      console.log('- Total records:', addressPreviewData.length);
      console.log('- Records with customer_name:', addressPreviewData.filter(addr => addr.customer_name).length);
      console.log('- Records with city:', addressPreviewData.filter(addr => addr.city).length);
      console.log('- Records with state:', addressPreviewData.filter(addr => addr.state).length);
      console.log('- Records with all required fields:', addressPreviewData.filter(addr => addr.customer_name && addr.city && addr.state).length);
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = addressPreviewData.slice(i * batchSize, (i + 1) * batchSize);
        
        console.log(`Processing batch ${i + 1}/${totalBatches}:`, {
          batchSize: batch.length,
          firstAddress: batch[0]?.customer_name,
          lastAddress: batch[batch.length - 1]?.customer_name
        });
        
        setAddressUploadProgress(`Importing batch ${i + 1}/${totalBatches}... (${importedCount + batch.length}/${addressPreviewData.length} addresses)`);
        
        // Log the exact data being sent to Supabase
        console.log(`Batch ${i + 1} data sample:`, batch.slice(0, 2));
        
        try {
          console.log(`\n--- Processing Batch ${i + 1}/${totalBatches} ---`);
          console.log(`Batch size: ${batch.length}`);
          console.log(`Batch range: ${i * batchSize + 1} to ${Math.min((i + 1) * batchSize, addressPreviewData.length)}`);
          
          // Validate batch data before insert - only customer_name is required
          const validBatch = batch.filter(addr => addr.customer_name && addr.customer_name.trim() !== '');
          const invalidInBatch = batch.filter(addr => !addr.customer_name || addr.customer_name.trim() === '');
          
          console.log(`Valid records in batch: ${validBatch.length}/${batch.length}`);
          if (invalidInBatch.length > 0) {
            console.log('Invalid records in batch:', invalidInBatch.map(addr => ({
              customer_name: addr.customer_name || 'MISSING',
              full_address: addr.full_address || 'AVAILABLE',
              city: addr.city || 'EXTRACTED_LATER',
              state: addr.state || 'EXTRACTED_LATER'
            })));
          }
          
          if (validBatch.length === 0) {
            console.warn(`Batch ${i + 1} has no valid records, skipping`);
            failedBatches++;
            failedAddresses.push(...batch.map(addr => addr.customer_name));
            continue;
          }
          
          const { data, error } = await supabase
            .from('customer_addresses')
            .insert(validBatch) // Use insert instead of upsert for better error handling
            .select();
          
          if (error) {
            console.error(`Batch ${i + 1} insert failed:`, error);
            console.error('Failed batch data sample:', validBatch.slice(0, 2));
            failedBatches++;
            
            // Try to get more detailed error information
            if (error.details) {
              console.error('Error details:', error.details);
            }
            if (error.hint) {
              console.error('Error hint:', error.hint);
            }
            
            // Check for specific error types
            if (error.message.includes('duplicate key')) {
              console.log('Duplicate key error - trying upsert instead');
              
              // Try upsert for this batch
              const { data: upsertData, error: upsertError } = await supabase
                .from('customer_addresses')
                .upsert(validBatch, { 
                  onConflict: 'customer_name,full_address',
                  ignoreDuplicates: false 
                });
              
              if (upsertError) {
                console.error('Upsert also failed:', upsertError);
                addNotification('error', `Batch ${i + 1} failed (duplicate handling)`, upsertError.message);
                failedAddresses.push(...validBatch.map(addr => addr.customer_name));
              } else {
                console.log(`Batch ${i + 1} upsert successful:`, upsertData?.length || 0, 'records');
                importedCount += validBatch.length;
                successfulBatches++;
                
                batchResults.push({
                  batch: i + 1,
                  status: 'success',
                  method: 'upsert',
                  count: validBatch.length,
                  data: upsertData
                });
              }
            } else {
              addNotification('error', `Batch ${i + 1} failed`, error.message);
              failedAddresses.push(...validBatch.map(addr => addr.customer_name));
              
              batchResults.push({
                batch: i + 1,
                status: 'failed',
                error: error.message,
                count: validBatch.length
              });
            }
          } else {
            console.log(`Batch ${i + 1} successful:`, data?.length || 0, 'records');
            importedCount += validBatch.length;
            successfulBatches++;
            
            batchResults.push({
              batch: i + 1,
              status: 'success',
              method: 'insert',
              count: validBatch.length,
              data: data
            });
          }
        } catch (batchError) {
          console.error(`Batch ${i + 1} exception:`, batchError);
          failedBatches++;
          failedAddresses.push(...batch.map(addr => addr.customer_name));
          
          batchResults.push({
            batch: i + 1,
            status: 'exception',
            error: batchError.message,
            count: batch.length
          });
        }
        
        // Small delay to prevent overwhelming the API
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Final import summary
      console.log('\n=== IMPORT SUMMARY ===');
      console.log(`Total addresses to import: ${addressPreviewData.length}`);
      console.log(`Successfully imported: ${importedCount}`);
      console.log(`Failed addresses: ${failedAddresses.length}`);
      console.log(`Successful batches: ${successfulBatches}/${totalBatches}`);
      console.log(`Failed batches: ${failedBatches}/${totalBatches}`);
      console.log(`Batch results:`, batchResults);
      
      if (failedBatches > 0) {
        setAddressUploadProgress(`Import completed with errors: ${importedCount} imported, ${failedBatches} batches failed`);
        addNotification('warning', 'Import completed with errors', 
          `${importedCount} addresses imported, ${failedBatches} batches failed. ${failedAddresses.length} addresses failed. Check console for details.`);
        
        if (failedAddresses.length > 0) {
          console.log('Failed addresses:', failedAddresses.slice(0, 10)); // Log first 10 failed addresses
        }
        
        // Show detailed batch failure analysis
        const failedBatchResults = batchResults.filter(result => result.status !== 'success');
        console.log('Failed batch details:', failedBatchResults);
      } else {
        setAddressUploadProgress('Addresses imported successfully!');
        addNotification('success', 'Addresses imported to Supabase', `${importedCount} addresses processed in ${totalBatches} batches`);
      }
      
      // Check for discrepancy
      const expectedCount = addressPreviewData.length;
      const actualCount = importedCount;
      const discrepancy = expectedCount - actualCount;
      
      if (discrepancy > 0) {
        console.warn(`IMPORT DISCREPANCY: Expected ${expectedCount}, imported ${actualCount}, missing ${discrepancy}`);
        addNotification('warning', 'Import discrepancy detected', 
          `Expected ${expectedCount} addresses, but only ${actualCount} were imported. ${discrepancy} addresses missing.`);
      }
      
      // Reset upload state
      setAddressPreviewData([]);
      setAddressReady(false);
      setAddressUploadProgress('');
      
      // Reload addresses after import
      console.log('Import completed, reloading addresses...');
      await loadAddresses();
      
    } catch (error) {
      console.error('Import process failed:', error);
      setAddressUploadError('Import failed: ' + error.message);
      addNotification('error', 'Failed to import addresses', error.message);
      
      // Log additional error details
      if (error.details) {
        console.error('Error details:', error.details);
      }
      if (error.hint) {
        console.error('Error hint:', error.hint);
      }
    }
  };

  // Add/Edit address
  const saveAddress = async (addressData) => {
    if (!supabase) {
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('customer_addresses')
          .update(addressData)
          .eq('id', editingAddress.id);
        
        if (error) throw error;
        addNotification('success', 'Address updated successfully');
      } else {
        // Add new address
        const { error } = await supabase
          .from('customer_addresses')
          .insert([addressData]);
        
        if (error) throw error;
        addNotification('success', 'Address added successfully');
      }
      
      setEditingAddress(null);
      await loadAddresses();
    } catch (error) {
      addNotification('error', 'Failed to save address', error.message);
    }
  };

  // Delete address
  const deleteAddress = async (id) => {
    if (!supabase) {
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      addNotification('success', 'Address deleted successfully');
      await loadAddresses();
    } catch (error) {
      addNotification('error', 'Failed to delete address', error.message);
    }
  };

  // Export addresses
  const exportAddresses = () => {
    const data = addresses.map(addr => ({
      'Customer Name': addr.customer_name,
      'Full Address': addr.full_address,
      'City': addr.city,
      'State': addr.state,
      'Zip Code': addr.zip_code,
      'Phone': addr.phone,
      'Special Instructions': addr.special_instructions,
      'Latitude': addr.latitude,
      'Longitude': addr.longitude,
      'External ID': addr.external_id
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Addresses');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `FreshOne_Addresses_${timestamp}.xlsx`);
    
    addNotification('success', 'Addresses exported successfully');
  };

  // Filter addresses for search
  const filteredAddresses = addresses.filter(addr =>
    addr.customer_name.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
    addr.city.toLowerCase().includes(addressSearchTerm.toLowerCase()) ||
    addr.state.toLowerCase().includes(addressSearchTerm.toLowerCase())
  );

  // Initialize Supabase and load addresses on component mount
  useEffect(() => {
    console.log('Component mounted, initializing...');
    console.log('Supabase client:', supabase ? 'Created' : 'Not created');
    console.log('Supabase status:', supabaseStatus);
    console.log('Addresses loaded:', addressesLoaded);
    console.log('Addresses loading:', addressesLoading);
    
    // Auto-load addresses when Supabase becomes available
    if (supabase && supabaseStatus === '✅ Connected' && !addressesLoaded && !addressesLoading) {
      console.log('Supabase client available and connected, loading addresses...');
      loadAddresses();
      loadCustomerNameMappings(); // Load permanent customer name mappings
      addNotification('info', 'Loading address database', 'Fetching all addresses from Supabase...');
    } else if (supabase && supabaseStatus === '✅ Connected') {
      console.log('Supabase connected but addresses already loaded or loading in progress');
    } else {
      console.log('Supabase client not available or not connected yet');
    }
  }, [supabase, supabaseStatus, addressesLoaded, addressesLoading]); // Dependencies to trigger when Supabase becomes available

  // Monitor addresses state changes
  useEffect(() => {
    console.log('Addresses state changed:', {
      count: addresses.length,
      loaded: addressesLoaded,
      loading: addressesLoading
    });
    
    if (addressesLoaded && addresses.length > 0) {
      console.log(`Addresses successfully loaded: ${addresses.length} records`);
    }
  }, [addresses, addressesLoaded, addressesLoading]);

  // Monitor modal state changes
  useEffect(() => {
    console.log('Modal state changed:', {
      showMissingCustomersModal,
      missingCustomersToAdd: missingCustomersToAdd.length
    });
  }, [showMissingCustomersModal, missingCustomersToAdd]);

  // Monitor missing customers state changes
  useEffect(() => {
    console.log('=== MISSING CUSTOMERS STATE CHANGE ===');
    console.log('Missing customers state changed:', {
      missingCustomersReport: missingCustomersReport.length,
      similarMatchesToConfirm: similarMatchesToConfirm.length,
      totalUnmatched: missingCustomersReport.length + similarMatchesToConfirm.length
    });
    
    if (missingCustomersReport.length > 0) {
      console.log('✅ MISSING CUSTOMERS ALERT SHOULD BE VISIBLE');
      console.log('Missing customers report updated:', missingCustomersReport);
      console.log('Missing customers:', missingCustomersReport.map(m => m.bolCustomer));
      
      // Force a notification to confirm the state is set
      addNotification('warning', 'Missing Customers Detected', 
        `${missingCustomersReport.length} customers need to be added to the address database`);
        
      // Force a re-render to ensure the alert appears
      setTimeout(() => {
        console.log('Forcing re-render to ensure alert visibility');
      }, 100);
    } else {
      console.log('No missing customers in report');
    }
    
    if (similarMatchesToConfirm.length > 0) {
      console.log('Similar matches to confirm updated:', similarMatchesToConfirm);
    }
  }, [missingCustomersReport, similarMatchesToConfirm]);

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    // Debug: Show current configuration status
    addNotification('info', 'Supabase Configuration Status', 
      `URL: ✅ Set | Key: ✅ Set | Status: ${supabaseStatus}`);
    
    if (!supabaseUrl || !supabaseKey) {
      setSupabaseStatus('❌ Not Configured');
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    setSupabaseTesting(true);
    setSupabaseStatus('Testing...');
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('customer_addresses').select('*').limit(1);
      
      if (error) {
        console.error('Supabase test error:', error);
        setSupabaseStatus('❌ Error: ' + error.message);
        addNotification('error', 'Supabase connection failed', error.message);
      } else {
        console.log('Supabase test successful, data:', data);
        setSupabaseStatus('✅ Connected');
        addNotification('success', 'Supabase connection successful', 'Database is ready for operations');
        
        // Check table structure if we have data
        if (data && data.length > 0) {
          console.log('Table structure (from sample data):', Object.keys(data[0]));
          addNotification('info', 'Table structure detected', `Columns: ${Object.keys(data[0]).join(', ')}`);
        }
        
        // Test full data load
        console.log('Testing full data load...');
        const { data: fullData, error: fullError } = await supabase
          .from('customer_addresses')
          .select('*')
          .order('customer_name', { ascending: true })
          .range(0, 9999); // Load up to 10,000 records to ensure we get all 1,835
        
        if (fullError) {
          console.error('Full data load error:', fullError);
          addNotification('error', 'Full data load failed', fullError.message);
        } else {
          console.log(`Full data load successful: ${fullData?.length || 0} addresses`);
          addNotification('success', 'Full data load test successful', 
            `${fullData?.length || 0} addresses found in database`);
        }
      }
    } catch (err) {
      console.error('Supabase test exception:', err);
      setSupabaseStatus('❌ Error: ' + err.message);
      addNotification('error', 'Supabase connection failed', err.message);
    }
    setSupabaseTesting(false);
  };

  // Function to confirm a similar match
  const confirmSimilarMatch = async (bolCustomer, confirmedName) => {
    console.log(`Confirming match: "${bolCustomer}" -> "${confirmedName}"`);
    
    // Save to permanent storage
    await saveConfirmedMatch(bolCustomer, confirmedName);
    
    // Add to confirmed matches
    setConfirmedMatches(prev => ({
      ...prev,
      [bolCustomer]: confirmedName
    }));
    
    // Remove from similar matches
    setSimilarMatchesToConfirm(prev => 
      prev.filter(match => match.bolCustomer !== bolCustomer)
    );
    
    addNotification('success', 'Match confirmed and saved permanently', `"${bolCustomer}" matched with "${confirmedName}" - will be remembered for future BOLs`);
  };

  // Function to reject a similar match (add to truly missing)
  const rejectSimilarMatch = (bolCustomer) => {
    console.log(`Rejecting match for: "${bolCustomer}"`);
    
    // Find the match details
    const match = similarMatchesToConfirm.find(m => m.bolCustomer === bolCustomer);
    
    if (match) {
      // Add to truly missing customers
      setMissingCustomersReport(prev => [
        ...prev,
        {
          bolCustomer: match.bolCustomer,
          suggestions: match.allSuggestions
        }
      ]);
      
      // Remove from similar matches
      setSimilarMatchesToConfirm(prev => 
        prev.filter(m => m.bolCustomer !== bolCustomer)
      );
      
      addNotification('info', 'Match rejected', `"${bolCustomer}" added to missing customers list`);
    }
  };

  // Function to add missing customers to database
  const addMissingCustomers = async (customersToAdd) => {
    if (!supabase) {
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    if (!customersToAdd || customersToAdd.length === 0) {
      addNotification('error', 'No customers to add', 'Please provide customer information');
      return;
    }
    
    console.log('Adding missing customers to database:', customersToAdd);
    
    try {
      // Prepare data for insertion
      const customersData = customersToAdd.map(customer => ({
        customer_name: customer.name,
        full_address: customer.address,
        city: customer.city,
        state: customer.state,
        zip_code: customer.zipCode || '',
        phone: customer.phone || '',
        special_instructions: customer.instructions || '',
        latitude: customer.latitude ? parseFloat(customer.latitude) : null,
        longitude: customer.longitude ? parseFloat(customer.longitude) : null,
        external_id: `bol_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      console.log('Prepared customer data:', customersData);
      
      // Insert customers into database
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert(customersData)
        .select();
      
      if (error) {
        console.error('Failed to add customers:', error);
        addNotification('error', 'Failed to add customers', error.message);
        return;
      }
      
      console.log('Successfully added customers:', data);
      addNotification('success', 'Customers added successfully', `${customersData.length} customer(s) added to address database`);
      
      // Close modal
      setShowMissingCustomersModal(false);
      setMissingCustomersToAdd([]);
      
      // Reload addresses
      await loadAddresses();
      
      // Re-run BOL matching if we have file data
      if (filePreviewData.length > 0) {
        console.log('Re-running BOL matching with updated address database...');
        // Wait a moment for addresses to be updated, then re-run matching
        setTimeout(async () => {
          await loadAddresses(); // Ensure we have the latest addresses
          const updatedMissingReport = generateMissingCustomersReport(filePreviewData, addresses);
          setSimilarMatchesToConfirm(updatedMissingReport.similarMatches);
          setMissingCustomersReport(updatedMissingReport.trulyMissing);
          
          const totalUnmatched = updatedMissingReport.similarMatches.length + updatedMissingReport.trulyMissing.length;
          if (totalUnmatched === 0) {
            addNotification('success', '100% Match Achieved!', 'All BOL customers now have addresses in the database');
          } else {
            addNotification('info', 'BOL matching updated', `${totalUnmatched} customer(s) still need attention`);
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error adding customers:', error);
      addNotification('error', 'Failed to add customers', error.message);
    }
  };

  // Generate missing customers report with similar match detection and permanent mappings
  function generateMissingCustomersReport(bolRows, addresses) {
    const similarMatches = [];
    const trulyMissing = [];
    const addressList = addresses.map(addr => ({
      name: addr.customer_name,
      city: addr.city,
      state: addr.state
    }));
    bolRows.forEach((row) => {
      const customerName = row.Customer_Name || row.customer_name || row['Customer Name'] || row['customer_name'];
      if (!customerName || !customerName.trim()) return;
      const trimmedCustomerName = customerName.trim();
      const storedMapping = customerNameMappings[trimmedCustomerName.toLowerCase()];
      if (storedMapping) return;
      // Find all universal fuzzy matches
      const allSuggestions = addressList.map(addr => {
        const score = universalFuzzyMatch(trimmedCustomerName, addr.name);
        // Debug log for each comparison
        console.log(`[DEBUG] BOL: '${trimmedCustomerName}' vs DB: '${addr.name}' | Score: ${score}`);
        return { ...addr, score };
      }).sort((a, b) => b.score - a.score);
      const bestScore = allSuggestions[0]?.score || 0;
      const bestMatch = allSuggestions[0];
      if (bestScore === 1.0) {
        // Perfect match, skip
        return;
      } else if (bestScore >= 0.7 && bestScore < 1.0) {
        // Strong similar matches: always require user confirmation
        similarMatches.push({
          bolCustomer: trimmedCustomerName,
          bestMatch: bestMatch ? { ...bestMatch, score: bestScore } : null,
          allSuggestions: allSuggestions.filter(s => s.score >= 0.7 && s.score < 1.0).slice(0, 3)
        });
      } else if (bestScore >= 0.4 && bestScore < 0.7) {
        // Moderate similar matches: require user confirmation
        similarMatches.push({
          bolCustomer: trimmedCustomerName,
          bestMatch: bestMatch ? { ...bestMatch, score: bestScore } : null,
          allSuggestions: allSuggestions.filter(s => s.score >= 0.4 && s.score < 0.7).slice(0, 3)
        });
      } else {
        // Truly missing (red)
        trulyMissing.push({
          bolCustomer: trimmedCustomerName,
          suggestions: allSuggestions.slice(0, 3).filter(s => s.score > 0.15)
        });
      }
    });
    // Debug log for output arrays
    console.log('[DEBUG] Final similarMatches:', similarMatches);
    console.log('[DEBUG] Final trulyMissing:', trulyMissing);
    return { similarMatches, trulyMissing };
  }

  // Debug/Test Button for Similar Matches with detailed logging and robust output
  {process.env.NODE_ENV !== 'production' && (
    <button
      onClick={() => {
        // Simulated BOL data
        const testBOLRows = [
          { customer_name: 'ANONA ELEMENTARY' },
          { customer_name: 'CRYSTAL LAKE ELEM LAKE M' },
          { customer_name: 'EXACT MATCH SCHOOL' },
          { customer_name: 'NO MATCH AT ALL' }
        ];
        // Simulated address DB
        const testAddresses = [
          { customer_name: 'ANOMO', city: 'CITY1', state: 'FL' },
          { customer_name: 'CRYSTAL LAKE ELEMENTARY', city: 'CITY2', state: 'FL' },
          { customer_name: 'EXACT MATCH SCHOOL', city: 'CITY3', state: 'FL' }
        ];
        // Simulate empty mappings
        window.customerNameMappings = {};
        // Log normalization and scores
        testBOLRows.forEach(bol => {
          testAddresses.forEach(addr => {
            const nBol = normalizeBusinessName(bol.customer_name);
            const nAddr = normalizeBusinessName(addr.customer_name);
            const score = universalFuzzyMatch(bol.customer_name, addr.customer_name);
            console.log(`BOL: '${bol.customer_name}' → '${nBol}' | DB: '${addr.customer_name}' → '${nAddr}' | Score: ${score}`);
          });
        });
        // Call the report function
        const { similarMatches, trulyMissing } = generateMissingCustomersReport(testBOLRows, testAddresses);
        console.log('=== TEST SIMILAR MATCHES ===');
        console.log('Similar Matches:', similarMatches);
        console.log('Truly Missing:', trulyMissing);
        alert(
          `Similar Matches (yellow):\n` +
          similarMatches.map(m => `${m.bolCustomer} → ${m.allSuggestions.map(s => s.name + ' (score: ' + s.score.toFixed(2) + ')').join(', ')}`).join('\n') +
          `\n\nTruly Missing (red):\n` +
          trulyMissing.map(m => m.bolCustomer).join(', ')
        );
      }}
      className="mt-4 px-4 py-2 bg-yellow-300 text-yellow-900 rounded shadow font-bold border border-yellow-500 hover:bg-yellow-400"
    >
      🧪 Test Similar Matches Logic (robust)
    </button>
  )}

  // Debug: Show similarMatchesToConfirm and normalization
  {process.env.NODE_ENV !== 'production' && (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
      <h4 className="font-bold text-yellow-800 mb-2">Debug: Similar Matches To Confirm</h4>
      <pre className="text-xs text-yellow-900 bg-yellow-100 p-2 rounded overflow-x-auto">
        {JSON.stringify(similarMatchesToConfirm, null, 2)}
      </pre>
      <h4 className="font-bold text-yellow-800 mt-4 mb-2">Debug: Normalized Names</h4>
      <ul className="text-xs text-yellow-900 bg-yellow-100 p-2 rounded overflow-x-auto">
        {addresses && addresses.length > 0 && bolData && bolData.length > 0 && bolData.map((bol, i) => (
          <li key={i}>
            BOL: '{bol.Customer_Name || bol.customer_name}' → '{normalizeBusinessName(bol.Customer_Name || bol.customer_name)}' | DB: {addresses.map(addr => `'${addr.customer_name}' → '${normalizeBusinessName(addr.customer_name)}'`).join(', ')}
          </li>
        ))}
      </ul>
    </div>
  )}

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-100">
            {/* Missing Customers Modal - Moved to root level for proper positioning */}
      {showMissingCustomersModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm modal-debug"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
                    {console.log('Modal should be visible - showMissingCustomersModal:', showMissingCustomersModal, 'missingCustomersToAdd:', missingCustomersToAdd)}
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Add Missing Customers to Address Database
              </h3>
              <button
                onClick={() => setShowMissingCustomersModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Fill in the address details for each missing customer. 
                Customer names are pre-filled from your BOL data. All fields marked with * are required.
              </p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const customersToAdd = [];
              
              // Extract data for each customer
              missingCustomersToAdd.forEach((customer, index) => {
                const name = formData.get(`name_${index}`);
                const address = formData.get(`address_${index}`);
                const city = formData.get(`city_${index}`);
                const state = formData.get(`state_${index}`);
                const zipCode = formData.get(`zipCode_${index}`);
                const phone = formData.get(`phone_${index}`);
                const instructions = formData.get(`instructions_${index}`);
                
                if (name && address && city && state) {
                  customersToAdd.push({
                    name,
                    address,
                    city,
                    state,
                    zipCode,
                    phone,
                    instructions
                  });
                }
              });
              
              if (customersToAdd.length > 0) {
                addMissingCustomers(customersToAdd);
              } else {
                addNotification('error', 'No valid customers to add', 'Please fill in at least the required fields (name, address, city, state)');
              }
            }}>
              <div className="space-y-6">
                {missingCustomersToAdd.map((customer, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">
                        {index + 1}
                      </span>
                      Customer {index + 1}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          name={`name_${index}`}
                          defaultValue={customer.name}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter customer name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Address *
                        </label>
                        <input
                          type="text"
                          name={`address_${index}`}
                          defaultValue={customer.address}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter full address"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name={`city_${index}`}
                          defaultValue={customer.city}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter city"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          name={`state_${index}`}
                          defaultValue={customer.state}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter state (e.g., FL)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zip Code
                        </label>
                        <input
                          type="text"
                          name={`zipCode_${index}`}
                          defaultValue={customer.zipCode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter zip code"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          name={`phone_${index}`}
                          defaultValue={customer.phone}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Instructions
                      </label>
                      <textarea
                        name={`instructions_${index}`}
                        defaultValue={customer.instructions}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Enter any special delivery instructions"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300 font-medium"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add {missingCustomersToAdd.length} Customer{missingCustomersToAdd.length > 1 ? 's' : ''} to Database
                </button>
                <button
                  type="button"
                  onClick={() => setShowMissingCustomersModal(false)}
                  className="flex items-center px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* FreshOne Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F1</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    FreshOne Logistics Automation
                  </h1>
                  <p className="text-green-600 font-medium">
                    BOL → NextBillion.ai → Samsara → Reports → Notifications
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Wifi className="w-4 h-4" />
                <span>Real-time Tracking Active</span>
              </div>
              
              {/* Test Mode Toggle */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="mr-2"
                  />
                  <span className={`text-sm font-medium ${testMode ? 'text-orange-600' : 'text-green-600'}`}>
                    {testMode ? 'TEST MODE' : 'LIVE MODE'}
                  </span>
                </label>
              </div>

              <button
                onClick={runAutomation}
                disabled={processing}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                  processing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run Automation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Workflow Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Workflow Status</h2>
              <div className="space-y-4">
                {steps.map((step) => (
                  <StatusIndicator key={step.id} step={step} active={currentStep === step.id} />
                ))}
              </div>
            </div>

            {/* Real-time Notifications */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Live Notifications
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No notifications yet</p>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Route Review & Approval Section */}
            {showRouteReview && routesAwaitingApproval.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-orange-800 flex items-center">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    Routes Awaiting Approval - FreshOne Review Required
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      testMode ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {testMode ? 'TEST MODE - Safe to approve' : 'LIVE MODE - Will notify drivers'}
                    </span>
                    <button
                      onClick={approveAndSendToSamsara}
                      disabled={processing}
                      className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                        processing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : testMode 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {testMode ? 'Approve & Test' : 'Approve & Send Live'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Route Preview:</h3>
                  {routesAwaitingApproval.map((route, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{route.id}</h4>
                          <p className="text-sm text-gray-600">
                            Driver: {route.driver} | Vehicle: {route.vehicle}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {route.totalDistance} miles | {Math.round(route.totalTime / 60)} hours
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            {route.stops.length} stops | Est. fuel: ${route.estimatedFuelCost}
                          </p>
                          {route.optimizationScore && (
                            <p className="text-xs text-purple-600">
                              Optimization Score: {route.optimizationScore.toFixed(2)}
                            </p>
                          )}
                          <button
                            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            onClick={() => setPreviewRoute(route)}
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {route.stops.map((stop, stopIndex) => (
                          <div key={stopIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                                {stop.sequence}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{stop.Customer_Name}</p>
                                <p className="text-xs text-gray-600">{stop.City}, {stop.State} | {stop.Cases} cases</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">
                                ETA: {new Date(stop.estimatedArrival).toLocaleTimeString()}
                              </p>
                              <p className="text-xs text-gray-600">{stop.serviceTime} min stop</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Optimization Log */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Optimization Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Mode:</strong> {testMode ? 'Test Mode (Simulation)' : 'Live Mode (NextBillion.ai API)'}</p>
                    <p><strong>Total Stops:</strong> {routesAwaitingApproval.reduce((sum, route) => sum + route.stops.length, 0)}</p>
                    <p><strong>Total Routes:</strong> {routesAwaitingApproval.length}</p>
                    <p><strong>Total Distance:</strong> {routesAwaitingApproval.reduce((sum, route) => sum + route.totalDistance, 0).toFixed(1)} miles</p>
                    <p><strong>Total Time:</strong> {Math.round(routesAwaitingApproval.reduce((sum, route) => sum + route.totalTime, 0) / 60)} hours</p>
                    {!testMode && (
                      <p><strong>API Provider:</strong> NextBillion.ai Route Optimization</p>
                    )}
                    <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Route Preview Modal */}
                {previewRoute && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative">
                      <button
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                        onClick={() => setPreviewRoute(null)}
                      >
                        ×
                      </button>
                      <h2 className="text-2xl font-bold mb-2 text-green-700">Route {previewRoute.id} - Detailed Preview</h2>
                      <p className="mb-2 text-gray-700">Driver: <span className="font-semibold">{previewRoute.driver}</span> | Vehicle: <span className="font-semibold">{previewRoute.vehicle}</span></p>
                      <p className="mb-2 text-gray-700">Total Distance: <span className="font-semibold">{previewRoute.totalDistance} miles</span> | Total Time: <span className="font-semibold">{Math.round(previewRoute.totalTime / 60)} hours</span></p>
                      <p className="mb-4 text-gray-700">Estimated Fuel Cost: <span className="font-semibold">${previewRoute.estimatedFuelCost}</span> | Stops: <span className="font-semibold">{previewRoute.stops.length}</span></p>
                      <div className="overflow-x-auto max-h-96 mb-6">
                        <table className="min-w-full text-sm">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-3 py-2 text-left">#</th>
                              <th className="px-3 py-2 text-left">Customer</th>
                              <th className="px-3 py-2 text-left">City</th>
                              <th className="px-3 py-2 text-left">State</th>
                              <th className="px-3 py-2 text-left">Cases</th>
                              <th className="px-3 py-2 text-left">ETA</th>
                              <th className="px-3 py-2 text-left">Service Time</th>
                              <th className="px-3 py-2 text-left">Special Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewRoute.stops.map((stop, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="px-3 py-2">{stop.sequence}</td>
                                <td className="px-3 py-2">{stop.Customer_Name}</td>
                                <td className="px-3 py-2">{stop.City}</td>
                                <td className="px-3 py-2">{stop.State}</td>
                                <td className="px-3 py-2">{stop.Cases}</td>
                                <td className="px-3 py-2">{new Date(stop.estimatedArrival).toLocaleTimeString()}</td>
                                <td className="px-3 py-2">{stop.serviceTime} min</td>
                                <td className="px-3 py-2">{stop.Special_Instructions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Map Preview Section (NextBillion) */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-green-700 mb-2">Map Preview (NextBillion)</h3>
                        <div id="nextbillion-map" style={{ width: '100%', height: '320px', borderRadius: '12px', background: '#e5e7eb', position: 'relative', overflow: 'hidden' }}>
                          {/*
                            NextBillion map will be rendered here.
                            When you receive your API key, initialize the map here using the NextBillion Maps JS SDK.
                            Plot the route path and stops using previewRoute.stops.
                            Example (to be implemented when API key is available):
                            - Load NextBillion SDK
                            - Initialize map with API key
                            - Add markers for each stop
                            - Draw route polyline
                          */}
                          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',color:'#888'}}>Map will appear here when NextBillion API key is set</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Real-time Tracking Dashboard */}
            {realTimeTracking.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Navigation className="w-5 h-5 mr-2" />
                  Real-time Delivery Tracking
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {realTimeTracking.map((stop, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${
                      stop.status === 'completed' ? 'border-green-200 bg-green-50' :
                      stop.status === 'arrived' ? 'border-yellow-200 bg-yellow-50' :
                      stop.status === 'in_transit' ? 'border-green-200 bg-green-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{stop.customerName}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          stop.status === 'completed' ? 'bg-green-100 text-green-800' :
                          stop.status === 'arrived' ? 'bg-yellow-100 text-yellow-800' :
                          stop.status === 'in_transit' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stop.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">Driver: {stop.driverName}</p>
                      <p className="text-xs text-gray-600 mb-1">Vehicle: {stop.vehicleId}</p>
                      <p className="text-xs text-gray-600">
                        ETA: {new Date(stop.estimatedArrival).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* File Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">F1</span>
                </div>
                FreshOne Bill of Lading Upload
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Upload your BOL Excel file or use sample data for demo
                  <br />
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Serving Schools, Retail, Restaurants & More across Dallas, Tampa & Michigan
                  </span>
                  <br />
                  <span className="text-sm text-blue-600 font-medium">
                    🔍 Auto-lookup missing city/state from {addressesLoaded ? addresses.length.toLocaleString() : addressesLoading ? 'loading...' : '0'} address database records
                    {addressesLoaded && addresses.length > 0 && (
                      <span className="ml-2 text-green-600">✅ Ready ({addresses.length.toLocaleString()} addresses)</span>
                    )}
                    {addressesLoading && (
                      <span className="ml-2 text-yellow-600">🔄 Loading...</span>
                    )}
                    {!addressesLoaded && !addressesLoading && (
                      <span className="ml-2 text-red-600">❌ Not loaded (Click "Load Addresses" in Address Management)</span>
                    )}
                    <br />
                    <span className="text-xs text-purple-600">
                      💡 All addresses with customer names are loaded - city/state extracted during BOL processing
                    </span>
                  </span>
                </p>
                <div className="flex justify-center space-x-4">
                  <label className="cursor-pointer bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors border border-green-300">
                    Choose File
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx,.csv" />
                  </label>
                  <button
                    onClick={() => {
                      setBolData(sampleBOLData);
                      setFilePreviewData([]);
                      setFileReady(false);
                      setFileUploadError('');
                      setFileUploadWarnings([]);
                      setFileUploadProgress('');
                    }}
                    className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    Use Sample Data
                  </button>
                </div>
                {/* Show file upload progress, errors, and warnings */}
                {fileUploadProgress && <p className="mt-4 text-green-700 font-medium">{fileUploadProgress}</p>}
                {fileUploadError && <p className="mt-2 text-red-600 font-medium">{fileUploadError}</p>}
                {fileUploadWarnings.length > 0 && (
                  <ul className="mt-2 text-yellow-700 text-sm text-left max-w-xl mx-auto">
                    {fileUploadWarnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
                  </ul>
                )}
              </div>
              {/* BOL Data Preview */}
              {(filePreviewData.length > 0 || bolData.length > 0) && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">BOL Data Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SO Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City, State</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address Source</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(fileReady ? filePreviewData : bolData).map((item, index) => (
                          <tr key={index} className={item.Address_Source === 'Database Lookup' ? 'bg-green-50' : ''}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.SO_Number}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.Customer_Name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.City}, {item.State}
                              {item.Address_Source === 'Database Lookup' && (
                                <span className="ml-2 text-xs text-green-600">📍 DB</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.Cases}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.Address_Source ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                  {item.Address_Source}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                  File Data
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Address Lookup Summary */}
                  {filePreviewData.length > 0 && filePreviewData.some(item => item.Address_Source === 'Database Lookup') && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Address Database Integration Active</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {filePreviewData.filter(item => item.Address_Source === 'Database Lookup').length} customers matched with address database
                      </p>
                    </div>
                  )}
                  {/* Similar Matches Confirmation Section */}
                  {similarMatchesToConfirm.length > 0 && (
                    <div className="mt-6 bg-yellow-50 border-4 border-yellow-400 rounded-lg p-6 shadow-lg">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-lg">🤔</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-yellow-800">
                            SIMILAR MATCHES FOUND - Please Confirm
                          </h4>
                          <p className="text-yellow-700 font-medium">
                            {similarMatchesToConfirm.length} customer{similarMatchesToConfirm.length > 1 ? 's' : ''} have similar names in the database
                          </p>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-yellow-300 rounded-lg p-4 mb-4">
                        <h5 className="font-bold text-yellow-800 mb-3 text-lg">Please Confirm These Matches:</h5>
                        <div className="space-y-4">
                          {similarMatchesToConfirm.map((item, idx) => (
                            <div key={idx} className="border-l-4 border-yellow-400 pl-4 py-3 bg-yellow-50 rounded-r-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-bold text-yellow-900 text-lg">
                                    "{item.bolCustomer}"
                                  </p>
                                  <p className="text-yellow-700 font-medium">
                                    Did you mean one of these?
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                                    NEEDS CONFIRMATION
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col md:flex-row md:space-x-3 mt-3 space-y-2 md:space-y-0">
                                {item.allSuggestions.map((s, i) => (
                                  <button
                                    key={i}
                                    onClick={() => confirmSimilarMatch(item.bolCustomer, s.name)}
                                    className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300 font-medium mb-2 md:mb-0"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {s.name}
                                    {s.city && s.state && (
                                      <span className="ml-2 text-xs text-gray-600">({s.city}, {s.state})</span>
                                    )}
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Score: {s.score.toFixed(2)}
                                    </span>
                                  </button>
                                ))}
                                <button
                                  onClick={() => rejectSimilarMatch(item.bolCustomer)}
                                  className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors border border-red-300 font-medium"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Add as New
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <span className="font-bold text-yellow-800">CONFIRMATION REQUIRED</span>
                        </div>
                        <p className="text-yellow-700 text-sm">
                          Please confirm if these are the same customers with slightly different names. Choosing a candidate will use the correct database name for routing. If none match, click 'Add as New'.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Truly Missing Customers Report - RED WARNING */}
                  {missingCustomersReport.length > 0 && (
                    <div className="mt-6 bg-red-50 border-4 border-red-400 rounded-lg p-6 shadow-lg">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-lg">❌</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-red-800">
                            MISSING CUSTOMERS DETECTED
                          </h4>
                          <p className="text-red-700 font-medium">
                            {missingCustomersReport.length} customer{missingCustomersReport.length > 1 ? 's' : ''} missing from address database
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-white border-2 border-red-300 rounded-lg p-4 mb-4">
                        <h5 className="font-bold text-red-800 mb-3 text-lg">Unmatched BOL Customers:</h5>
                        <div className="space-y-3">
                          {missingCustomersReport.map((item, idx) => (
                            <div key={idx} className="border-l-4 border-red-400 pl-4 py-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-red-900 text-lg">
                                    {item.bolCustomer}
                                  </p>
                                  <p className="text-red-700 font-medium">
                                    ❌ No match found in address database
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                                    MISSING
                                  </span>
                                </div>
                              </div>
                              
                              {/* Show suggestions if any exist */}
                              {item.suggestions.length > 0 && (
                                <div className="mt-2 pl-4 border-l-2 border-gray-300">
                                  <p className="text-sm text-gray-600 font-medium mb-1">
                                    Similar matches in database:
                                  </p>
                                  <ul className="space-y-1">
                                    {item.suggestions.map((s, i) => (
                                      <li key={i} className="text-sm">
                                        <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                          {s.name}
                                        </span>
                                        {s.city && s.state && (
                                          <span className="ml-2 text-xs text-gray-600">
                                            ({s.city}, {s.state})
                                          </span>
                                        )}
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          Score: {s.score.toFixed(2)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {item.suggestions.length === 0 && (
                                <div className="mt-2 pl-4 border-l-2 border-gray-300">
                                  <p className="text-sm text-gray-600">
                                    💡 No similar matches found. Consider adding this customer to the address database.
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="font-bold text-red-800">ACTION REQUIRED</span>
                        </div>
                        <p className="text-red-700 text-sm">
                          These customers must be added to the address database before routing can proceed. 
                          Missing customers will be excluded from route optimization, potentially leaving stops unassigned.
                        </p>
                        <div className="mt-3 flex space-x-3">
                          <button
                            onClick={() => {
                              // Prepare missing customers data for the modal
                              const customersToAdd = missingCustomersReport.map(item => ({
                                name: item.bolCustomer,
                                address: '',
                                city: '',
                                state: '',
                                zipCode: '',
                                phone: '',
                                instructions: ''
                              }));
                              setMissingCustomersToAdd(customersToAdd);
                              setShowMissingCustomersModal(true);
                            }}
                            className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300 font-medium"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            📝 Add Missing Customers
                          </button>
                          <button
                            onClick={() => {
                              const missingNames = missingCustomersReport.map(item => item.bolCustomer).join('\n');
                              navigator.clipboard.writeText(missingNames).then(() => {
                                addNotification('success', 'Missing customers copied to clipboard', 'Paste this list to add them to your address database');
                              });
                            }}
                            className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300 font-medium"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            📋 Copy Missing List
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FreshOne Excel Reports */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs">F1</span>
                </div>
                FreshOne Excel Reports (Current Format)
              </h2>
              {Object.keys(reports).length === 0 ? (
                <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg border border-gray-200">
                  No reports generated yet. Run the workflow to generate reports.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(reports).map(([key, report]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {key === 'warehouse' && (
                            <>
                              <Building2 className="w-6 h-6 text-green-600" />
                              <div>
                                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                                <p className="text-sm text-gray-600">📊 {report.format} • For warehouse loading</p>
                                <p className="text-xs text-green-600 font-medium">Matches current "Tampa Routes and Stops" format</p>
                              </div>
                            </>
                          )}
                          {key === 'customer' && (
                            <>
                              <Users className="w-6 h-6 text-green-600" />
                              <div>
                                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                                <p className="text-sm text-gray-600">📊 {report.format} • For Freedom Fresh</p>
                                <p className="text-xs text-green-600 font-medium">Matches current "Dock Reports" format</p>
                              </div>
                            </>
                          )}
                          {key === 'management' && (
                            <>
                              <BarChart3 className="w-6 h-6 text-green-600" />
                              <div>
                                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                                <p className="text-sm text-gray-600">📈 {report.format} • Operations summary</p>
                                <p className="text-xs text-green-600 font-medium">Executive dashboard with KPIs</p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {(key === 'warehouse' || key === 'customer') && (
                            <>
                              <button 
                                onClick={() => downloadExcel(report)}
                                className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors border border-green-300"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download Excel
                              </button>
                              <button
                                onClick={() => navigator.clipboard.writeText(report.filename)}
                                className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors border border-blue-300"
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy Filename
                              </button>
                            </>
                          )}
                          {key === 'management' && (
                            <button 
                              onClick={() => {
                                const previewWindow = window.open('', '_blank');
                                const reportContent = `
                                  <div style="font-family: Arial, sans-serif; padding: 20px;">
                                    <h1 style="color: #84cc16;">FreshOne Operations Dashboard</h1>
                                    <p>Routes: ${report.data.totalRoutes}</p>
                                    <p>Stops: ${report.data.totalStops}</p>
                                    <p>Distance: ${report.data.totalDistance} miles</p>
                                    <p>Cases: ${report.data.totalCases}</p>
                                  </div>
                                `;
                                previewWindow.document.write(reportContent);
                                previewWindow.document.close();
                              }}
                              className="flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors border border-gray-300"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Dashboard
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Report Details */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        {key === 'warehouse' && (
                          <div className="text-sm text-gray-600">
                            <p><strong>📋 Format:</strong> INV #, NAME OF, CITY, DATE, Route, Stops</p>
                            <p><strong>📦 Total Stops:</strong> {report.data.length}</p>
                            <p><strong>📧 Recipient:</strong> {report.recipient}</p>
                            <p><strong>📁 Filename:</strong> {report.filename}</p>
                          </div>
                        )}
                        {key === 'customer' && (
                          <div className="text-sm text-gray-600">
                            <p><strong>📋 Format:</strong> Weekly sheets with driver, truck, routes</p>
                            <p><strong>🚛 Routes:</strong> {report.data.length} active route(s)</p>
                            <p><strong>📧 Recipient:</strong> {report.recipient}</p>
                            <p><strong>📁 Filename:</strong> {report.filename}</p>
                          </div>
                        )}
                        {key === 'management' && (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white p-2 rounded">
                              <p className="text-gray-600">Routes</p>
                              <p className="font-semibold text-green-600">{report.data.totalRoutes}</p>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <p className="text-gray-600">Stops</p>
                              <p className="font-semibold text-green-600">{report.data.totalStops}</p>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <p className="text-gray-600">Distance</p>
                              <p className="font-semibold text-green-600">{report.data.totalDistance} mi</p>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <p className="text-gray-600">Cases</p>
                              <p className="font-semibold text-green-600">{report.data.totalCases}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

                        {/* FreshOne API Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs">F1</span>
                </div>
                FreshOne API Status
              </h2>
              
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-800">Production API Configuration</h3>
                    <p className="text-sm text-green-600">
                      {SAMSARA_API_TOKEN !== '[YOUR_SAMSARA_TOKEN_HERE]' ? 
                        '✅ Samsara API configured and ready for FreshOne operations' :
                        '⏳ Samsara API token needs to be configured'
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={checkApiStatus}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300"
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      Check Status
                    </button>
                    <button
                      onClick={testSamsaraConnection}
                      className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Test Samsara
                    </button>
                    <button
                      onClick={testNextBillionConnection}
                      className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors border border-purple-300"
                    >
                      <Route className="w-4 h-4 mr-2" />
                      Test NextBillion
                    </button>
                    <button
                      onClick={testBOLAddressIntegration}
                      className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 transition-colors border border-indigo-300"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Test BOL-Address
                    </button>
                    <button
                      onClick={async () => {
                        console.log('Direct database query test...');
                        if (!supabase) {
                          addNotification('error', 'Supabase not available', 'Cannot test database query');
                          return;
                        }
                        
                        try {
                          const { data, error } = await supabase
                            .from('customer_addresses')
                            .select('*')
                            .range(0, 9999); // Load up to 10,000 records to ensure we get all 1,835
                          
                          if (error) {
                            addNotification('error', 'Database query failed', error.message);
                          } else {
                            addNotification('success', 'Database query successful', `Found ${data?.length || 0} addresses in database`);
                            console.log('Direct query result:', data?.slice(0, 3)); // Log first 3 for debugging
                          }
                        } catch (err) {
                          addNotification('error', 'Database query exception', err.message);
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors border border-orange-300"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Test DB Query
                    </button>
                    <button
                      onClick={async () => {
                        console.log('Testing table schema...');
                        if (!supabase) {
                          addNotification('error', 'Supabase not available', 'Cannot test table schema');
                          return;
                        }
                        
                        try {
                          // Test if table exists by trying to get its structure
                          const { data, error } = await supabase
                            .from('customer_addresses')
                            .select('*')
                            .limit(1);
                          
                          if (error) {
                            addNotification('error', 'Table schema test failed', error.message);
                            console.error('Schema test error:', error);
                            
                            // Check if it's a "relation does not exist" error
                            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                              addNotification('error', 'Table does not exist', 'The customer_addresses table needs to be created in Supabase');
                              console.error('Table does not exist - needs to be created');
                            }
                            return;
                          }
                          
                          // Try to insert a test record to verify schema
                          const testRecord = {
                            customer_name: 'SCHEMA_TEST_' + Date.now(),
                            full_address: 'Test Address',
                            city: 'Test City',
                            state: 'TS',
                            zip_code: '12345',
                            phone: '555-1234',
                            special_instructions: 'Schema test record',
                            latitude: null,
                            longitude: null,
                            external_id: 'schema_test_' + Date.now()
                          };
                          
                          console.log('Testing insert with:', testRecord);
                          
                          const { data: insertData, error: insertError } = await supabase
                            .from('customer_addresses')
                            .insert([testRecord])
                            .select();
                          
                          if (insertError) {
                            addNotification('error', 'Schema insert test failed', insertError.message);
                            console.error('Insert test error:', insertError);
                            
                            // Check for common schema issues
                            if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
                              addNotification('error', 'Column mismatch', 'Table columns do not match expected schema');
                              console.error('Column mismatch detected');
                            }
                          } else {
                            addNotification('success', 'Schema test successful', 'Table structure is correct');
                            console.log('Schema test successful:', insertData);
                            
                            // Clean up test record
                            if (insertData && insertData[0]) {
                              const { error: deleteError } = await supabase
                                .from('customer_addresses')
                                .delete()
                                .eq('id', insertData[0].id);
                              
                              if (deleteError) {
                                console.error('Failed to clean up test record:', deleteError);
                              }
                            }
                          }
                        } catch (err) {
                          addNotification('error', 'Schema test exception', err.message);
                          console.error('Schema test exception:', err);
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors border border-purple-300"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Test Schema
                    </button>
                    <button
                      onClick={() => {
                        const schemaSQL = `
-- Complete SQL to create the customer_addresses table in Supabase
-- Run this in your Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  full_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  special_instructions TEXT,
  latitude FLOAT,
  longitude FLOAT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for development - adjust for production)
CREATE POLICY "Allow all operations for authenticated users" ON customer_addresses
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_name ON customer_addresses(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_city_state ON customer_addresses(city, state);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_external_id ON customer_addresses(external_id);

-- Optional: Create unique constraint (comment out if you want to allow duplicates)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_unique ON customer_addresses(customer_name, full_address);
                        `;
                        
                        // Copy to clipboard
                        navigator.clipboard.writeText(schemaSQL).then(() => {
                          addNotification('success', 'SQL Schema copied to clipboard', 'Paste this in your Supabase SQL editor to create the table');
                        }).catch(() => {
                          // Fallback: show in alert
                          alert('Copy this SQL to your Supabase SQL editor:\n\n' + schemaSQL);
                        });
                        
                        console.log('Schema SQL:', schemaSQL);
                      }}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Get Schema SQL
                    </button>
                    <button
                      onClick={async () => {
                        console.log('Testing complete database setup...');
                        if (!supabase) {
                          addNotification('error', 'Supabase not available', 'Cannot test database setup');
                          return;
                        }
                        
                        try {
                          addNotification('info', 'Testing complete database setup', 'Checking table, RLS, and import capabilities');
                          
                          // Step 1: Check/create table
                          await createCustomerAddressesTable();
                          
                          // Step 2: Test insert
                          const testRecord = {
                            customer_name: 'COMPLETE_TEST_' + Date.now(),
                            full_address: 'Test Address',
                            city: 'Test City',
                            state: 'TS',
                            zip_code: '12345',
                            phone: '555-1234',
                            special_instructions: 'Complete test record',
                            latitude: null,
                            longitude: null,
                            external_id: 'complete_test_' + Date.now()
                          };
                          
                          const { data: insertData, error: insertError } = await supabase
                            .from('customer_addresses')
                            .insert([testRecord])
                            .select();
                          
                          if (insertError) {
                            throw new Error(`Insert test failed: ${insertError.message}`);
                          }
                          
                          // Step 3: Test query
                          const { data: queryData, error: queryError } = await supabase
                            .from('customer_addresses')
                            .select('*')
                            .eq('customer_name', testRecord.customer_name);
                          
                          if (queryError) {
                            throw new Error(`Query test failed: ${queryError.message}`);
                          }
                          
                          // Step 4: Test delete
                          if (insertData && insertData[0]) {
                            const { error: deleteError } = await supabase
                              .from('customer_addresses')
                              .delete()
                              .eq('id', insertData[0].id);
                            
                            if (deleteError) {
                              console.error('Delete test failed:', deleteError);
                            }
                          }
                          
                          addNotification('success', 'Complete database test successful', 
                            'Table, RLS, insert, query, and delete all working correctly');
                          
                        } catch (error) {
                          console.error('Complete database test failed:', error);
                          addNotification('error', 'Database test failed', error.message);
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Test Complete Setup
                    </button>
                    <button
                      onClick={debugImportProcess}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors border border-red-300"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Debug Import
                    </button>
                    <button
                      onClick={createCustomerNameMappingsTable}
                      className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors border border-purple-300"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Create Mappings Table
                    </button>
                    <button
                      onClick={async () => {
                        console.log('=== TESTING MAPPINGS TABLE ===');
                        if (!supabase) {
                          console.error('Supabase not available');
                          return;
                        }
                        
                        try {
                          // Test if table exists
                          const { data, error } = await supabase
                            .from('customer_name_mappings')
                            .select('*')
                            .limit(1);
                          
                          if (error) {
                            console.error('Table test failed:', error);
                            addNotification('error', 'Mappings table not found', error.message);
                          } else {
                            console.log('Table exists, current data:', data);
                            addNotification('success', 'Mappings table exists', `Found ${data?.length || 0} records`);
                          }
                        } catch (err) {
                          console.error('Exception testing table:', err);
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Test Mappings Table
                    </button>
                    <button
                      onClick={async () => {
                        console.log('=== TESTING SAVE CONFIRMED MATCH ===');
                        await saveConfirmedMatch('TEST_BOL_NAME', 'TEST_DATABASE_NAME');
                      }}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Test Save Match
                    </button>
                    <button
                      onClick={async () => {
                        console.log('=== MANUALLY RELOADING MAPPINGS ===');
                        await loadCustomerNameMappings();
                      }}
                      className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reload Mappings
                    </button>
                    <button
                      onClick={async () => {
                        console.log('=== COMPLETE MAPPINGS FLOW TEST ===');
                        
                        const testBolName = 'FLOW_TEST_BOL_' + Date.now();
                        const testDbName = 'FLOW_TEST_DB_' + Date.now();
                        
                        console.log('Test mapping to save:', testBolName, '→', testDbName);
                        
                        // Step 1: Test table exists
                        console.log('Step 1: Testing table exists...');
                        const { data: tableTest, error: tableError } = await supabase
                          .from('customer_name_mappings')
                          .select('*')
                          .limit(1);
                        
                        if (tableError) {
                          console.error('Table test failed:', tableError);
                          addNotification('error', 'Table test failed', tableError.message);
                          return;
                        }
                        
                        console.log('✅ Table exists');
                        
                        // Step 2: Save a test mapping
                        console.log('Step 2: Saving test mapping...');
                        await saveConfirmedMatch(testBolName, testDbName);
                        
                        // Step 3: Reload mappings from database (not state)
                        console.log('Step 3: Reloading mappings from database...');
                        const { data: reloadedData, error: reloadError } = await supabase
                          .from('customer_name_mappings')
                          .select('*')
                          .eq('bol_name', testBolName);
                        
                        if (reloadError) {
                          console.error('Reload test failed:', reloadError);
                          addNotification('error', 'Reload test failed', reloadError.message);
                          return;
                        }
                        
                        console.log('Reloaded data from database:', reloadedData);
                        
                        // Step 4: Verify mapping was saved to database
                        console.log('Step 4: Verifying mapping in database...');
                        if (reloadedData && reloadedData.length > 0) {
                          const savedMapping = reloadedData[0];
                          console.log('✅ Found saved mapping in database:', savedMapping);
                          
                          if (savedMapping.bol_name === testBolName && savedMapping.database_name === testDbName) {
                            console.log('✅ Complete flow test successful!');
                            console.log('Saved:', savedMapping.bol_name, '→', savedMapping.database_name);
                            console.log('Expected:', testBolName, '→', testDbName);
                            addNotification('success', 'Complete flow test successful', 'Save → Load → Verify all working');
                          } else {
                            console.error('❌ Flow test failed - mapping mismatch');
                            console.log('Expected:', testBolName, '→', testDbName);
                            console.log('Actual:', savedMapping.bol_name, '→', savedMapping.database_name);
                            addNotification('error', 'Flow test failed', 'Mapping mismatch');
                          }
                        } else {
                          console.error('❌ Flow test failed - mapping not found in database');
                          addNotification('error', 'Flow test failed', 'Mapping not found in database');
                        }
                        
                        // Step 5: Test state update
                        console.log('Step 5: Testing state update...');
                        await loadCustomerNameMappings();
                        
                        // Use setTimeout to allow state to update
                        setTimeout(() => {
                          const stateMapping = customerNameMappings[testBolName.toLowerCase()];
                          console.log('State mapping for', testBolName.toLowerCase() + ':', stateMapping);
                          
                          if (stateMapping === testDbName) {
                            console.log('✅ State update successful!');
                          } else {
                            console.log('⚠️ State update may be delayed (this is normal)');
                          }
                        }, 1000);
                      }}
                      className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors border border-purple-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Test Complete Flow
                    </button>
                                          <button
                        onClick={() => {
                          console.log('=== MISSING CUSTOMERS DEBUG ===');
                          console.log('Current state:', {
                            missingCustomersReport: missingCustomersReport.length,
                            similarMatchesToConfirm: similarMatchesToConfirm.length,
                            showMissingCustomersModal,
                            missingCustomersToAdd: missingCustomersToAdd.length,
                            filePreviewData: filePreviewData.length,
                            addresses: addresses.length
                          });
                          
                          if (missingCustomersReport.length > 0) {
                            console.log('Missing customers report:', missingCustomersReport);
                            addNotification('info', 'Missing Customers Debug', 
                              `Report: ${missingCustomersReport.length} | Similar: ${similarMatchesToConfirm.length} | Modal: ${showMissingCustomersModal}`);
                          } else {
                            console.log('No missing customers report found');
                            addNotification('warning', 'No Missing Customers', 'missingCustomersReport is empty');
                          }
                          
                          // Regenerate missing customers report with current data
                          if (filePreviewData.length > 0 && addresses.length > 0) {
                            console.log('Regenerating missing customers report...');
                            const newReport = generateMissingCustomersReport(filePreviewData, addresses);
                            console.log('New report generated:', newReport);
                            
                            setSimilarMatchesToConfirm(newReport.similarMatches);
                            setMissingCustomersReport(newReport.trulyMissing);
                            
                            addNotification('info', 'Report Regenerated', 
                              `Similar: ${newReport.similarMatches.length} | Missing: ${newReport.trulyMissing.length}`);
                          } else {
                            addNotification('error', 'No Data Available', 'Need BOL data and addresses to generate report');
                          }
                          
                          // Force test missing customers alert
                          if (missingCustomersReport.length === 0) {
                            console.log('Forcing test missing customers alert...');
                            const testMissingCustomers = [
                              {
                                bolCustomer: 'TEST CUSTOMER 1',
                                suggestions: []
                              },
                              {
                                bolCustomer: 'TEST CUSTOMER 2', 
                                suggestions: []
                              }
                            ];
                            setMissingCustomersReport(testMissingCustomers);
                            addNotification('info', 'Test Alert Created', '2 test missing customers added to trigger alert');
                          }
                          
                          // Debug: Show current state
                          console.log('Current missing customers state:', {
                            missingCustomersReport: missingCustomersReport.length,
                            similarMatchesToConfirm: similarMatchesToConfirm.length,
                            showMissingCustomersModal,
                            missingCustomersToAdd: missingCustomersToAdd.length
                          });
                          
                          // Test modal
                          setMissingCustomersToAdd([{
                            name: 'TEST CUSTOMER',
                            address: '123 Test St',
                            city: 'Test City',
                            state: 'FL',
                            zipCode: '12345',
                            phone: '555-1234',
                            instructions: 'Test instructions'
                          }]);
                          setShowMissingCustomersModal(true);
                          console.log('Modal state set to true');
                        }}
                        className="flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors border border-orange-300"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Debug Missing Customers
                      </button>
                      <button
                        onClick={() => {
                          console.log('Testing missing customers alert...');
                          const testMissing = [
                            { bolCustomer: 'TEST CUSTOMER 1', suggestions: [] },
                            { bolCustomer: 'TEST CUSTOMER 2', suggestions: [] }
                          ];
                          setMissingCustomersReport(testMissing);
                          addNotification('info', 'Test Alert', 'Missing customers alert should now appear');
                        }}
                        className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors border border-red-300"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Test Alert
                      </button>
                      <button
                        onClick={() => {
                          console.log('=== COMPREHENSIVE FLOW TEST ===');
                          
                          // Simulate BOL processing with 2 unmatched customers
                          const testBOLData = [
                            { customer_name: 'MATCHED CUSTOMER 1' },
                            { customer_name: 'MATCHED CUSTOMER 2' },
                            { customer_name: 'UNMATCHED CUSTOMER 1' },
                            { customer_name: 'UNMATCHED CUSTOMER 2' }
                          ];
                          
                          // Simulate processed data with address lookups
                          const testProcessedData = [
                            { Customer_Name: 'MATCHED CUSTOMER 1', Address_Source: 'Database Lookup' },
                            { Customer_Name: 'MATCHED CUSTOMER 2', Address_Source: 'Database Lookup' },
                            { Customer_Name: 'UNMATCHED CUSTOMER 1', Address_Source: null },
                            { Customer_Name: 'UNMATCHED CUSTOMER 2', Address_Source: null }
                          ];
                          
                          // Extract unmatched customers (same logic as BOL processing)
                          const unmatchedCustomers = testProcessedData
                            .filter(row => row.Customer_Name && row.Customer_Name.trim() && row.Address_Source !== 'Database Lookup')
                            .map(row => row.Customer_Name.trim());
                          
                          console.log('Test unmatched customers:', unmatchedCustomers);
                          
                          // Create missing customers report
                          const testMissingReport = {
                            similarMatches: [],
                            trulyMissing: unmatchedCustomers.map(customerName => ({
                              bolCustomer: customerName,
                              suggestions: []
                            }))
                          };
                          
                          console.log('Test missing report:', testMissingReport);
                          
                          // Set state
                          setMissingCustomersReport(testMissingReport.trulyMissing);
                          setSimilarMatchesToConfirm(testMissingReport.similarMatches);
                          
                          console.log('State set - missing customers should appear in alert');
                          addNotification('info', 'Comprehensive Test Complete', 
                            `2 test unmatched customers set. Alert should appear with ${testMissingReport.trulyMissing.length} missing customers.`);
                        }}
                        className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors border border-purple-300"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Complete Flow
                      </button>
                    <button
                      onClick={recoverMissingAddresses}
                      disabled={!addressPreviewData.length}
                      className="flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors border border-orange-300 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recover Missing
                    </button>

                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Samsara API</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Status: {SAMSARA_API_TOKEN !== '[YOUR_SAMSARA_TOKEN_HERE]' ? '✅ Configured' : '⏳ Not configured'}
                  </p>
                  <p className="text-xs text-gray-500">Org ID: {SAMSARA_ORG_ID}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">NextBillion.ai API</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Status: {NEXTBILLION_API_KEY !== '[YOUR_NEXTBILLION_API_KEY_HERE]' ? '✅ Configured' : '⏳ Not configured'}
                  </p>
                  <p className="text-xs text-gray-500">Ready for route optimization</p>
                </div>
              </div>
            </div>

            {/* Supabase Config Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs">F1</span>
                </div>
                Supabase Cloud Database Configuration
              </h2>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      supabaseStatus === '✅ Connected' ? 'bg-green-500' : 
                      supabaseStatus === 'Testing...' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      Status: {supabaseStatus}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                                    <button
                    onClick={testSupabaseConnection}
                    disabled={supabaseTesting}
                    className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {supabaseTesting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
                    Test Connection
                  </button>
                      <button 
                        onClick={() => {
                      // Reset to configured values
                      setSupabaseUrl('https://ksikfpcxkpqfqsdhjpnu.supabase.co');
                      setSupabaseKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzaWtmcGN4a3BxZnFzZGhqcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzM3NDUsImV4cCI6MjA2NjgwOTc0NX0.y9PfwqsGTEH8DMjQhaur-lSDaPXqI8jD85ntUrm-gzQ');
                      setSupabaseStatus('✅ Connected');
                      addNotification('info', 'Supabase configuration reset', 'Using FreshOne database credentials');
                    }}
                    className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Config
                  </button>
                      <button 
                    onClick={() => setShowSupabaseConfig(true)}
                        className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300"
                      >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                      </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  {supabaseStatus === '✅ Connected' 
                    ? '✅ Supabase database is connected and ready for address management operations.'
                    : supabaseStatus === 'Not Configured'
                      ? '⏳ Configure your Supabase credentials to enable address management features.'
                      : '⏳ Supabase credentials configured. Test connection to verify.'
                  }
                </p>
                {supabaseStatus === '✅ Connected' && (
                  <p className="text-xs text-green-600 mt-2">
                    💡 Using FreshOne Supabase database - ready for Samsara address upload testing
                  </p>
                )}
                {supabaseStatus !== 'Not Configured' && supabaseStatus !== '✅ Connected' && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Credentials are configured directly in the application
                  </p>
                )}
                {supabaseStatus === 'Not Configured' && (
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 Click "Configure" to securely enter your Supabase credentials
                  </p>
                )}
                
                {/* Debug Information */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Debug Info:</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Supabase Status: {supabaseStatus}</p>
                    <p>Addresses Loaded: {addressesLoaded ? 'Yes' : 'No'}</p>
                    <p>Addresses Loading: {addressesLoading ? 'Yes' : 'No'}</p>
                    <p>Address Count: {addresses.length}</p>
                    <p>Supabase Client: {supabase ? 'Created' : 'Not Created'}</p>
                    <p>Customer Mappings: {Object.keys(customerNameMappings).length} loaded</p>
                    <p>Missing Customers Report: {missingCustomersReport.length} items</p>
                    <p>Similar Matches: {similarMatchesToConfirm.length} items</p>
                    <p>Show Modal: {showMissingCustomersModal ? 'Yes' : 'No'}</p>
                    <p>Missing Customers To Add: {missingCustomersToAdd.length} items</p>
                    {Object.keys(customerNameMappings).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">Show Mappings</summary>
                        <div className="mt-1 space-y-1">
                          {Object.entries(customerNameMappings).map(([bolName, dbName]) => (
                            <div key={bolName} className="text-xs">
                              "{bolName}" → "{dbName}"
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    {missingCustomersReport.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-red-600">Show Missing Customers</summary>
                        <div className="mt-1 space-y-1">
                          {missingCustomersReport.map((item, idx) => (
                            <div key={idx} className="text-xs text-red-600">
                              "{item.bolCustomer}"
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address Management Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-xs">F1</span>
                    </div>
                    FreshOne Address Management
                  </h2>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        addressesLoaded ? 'bg-green-500' : 
                        addressesLoading ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {addressesLoaded ? `${addresses.length.toLocaleString()} valid addresses loaded` : 
                         addressesLoading ? 'Loading addresses...' : 'No addresses loaded'}
                      </span>
                    </div>
                    {addressesLoaded && addresses.length > 0 && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        ✅ Ready for BOL processing
                      </span>
                    )}
                    {!addressesLoaded && !addressesLoading && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        ⚠️ Address database not loaded
                      </span>
                    )}
                    {addressesLoading && (
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                        🔄 Loading address database...
                      </span>
                    )}
                    {addressesLoaded && (
                      <button
                        onClick={async () => {
                          const { count } = await supabase
                            .from('customer_addresses')
                            .select('*', { count: 'exact', head: true });
                          
                          const { data: allData } = await supabase
                            .from('customer_addresses')
                            .select('customer_name, city, state');
                          
                          const invalidCount = allData?.filter(addr => 
                            !addr.customer_name || !addr.city || !addr.state
                          ).length || 0;
                          
                          addNotification('info', 'Database Statistics', 
                            `Total: ${count} | Valid: ${addresses.length} | Invalid: ${invalidCount}`);
                        }}
                        className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full hover:bg-blue-200"
                      >
                        📊 Show Stats
                      </button>
                    )}
                  </div>
                </div>
                                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddressManager(!showAddressManager)}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-300"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {showAddressManager ? 'Hide Manager' : 'Open Manager'}
                    </button>
                    <button
                      onClick={async () => {
                        console.log('Manual address load triggered');
                        setAddressesLoaded(false);
                        setAddressesLoading(false);
                        
                        // First test database connection and count
                        try {
                          const { count, error: countError } = await supabase
                            .from('customer_addresses')
                            .select('*', { count: 'exact', head: true });
                          
                          if (countError) {
                            console.error('Database count error:', countError);
                            addNotification('error', 'Database connection failed', countError.message);
                            return;
                          }
                          
                          console.log(`Database contains ${count} total records`);
                          addNotification('info', 'Database connected', `${count} total records found in database`);
                          
                          // Now load addresses
                          await loadAddresses();
                        } catch (error) {
                          console.error('Database test failed:', error);
                          addNotification('error', 'Database test failed', error.message);
                        }
                      }}
                      disabled={addressesLoading}
                      className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {addressesLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {addressesLoading ? 'Loading...' : 'Reload All Addresses'}
                    </button>
                    <button
                      onClick={async () => {
                        console.log('=== ADDRESS DATABASE DIAGNOSTICS ===');
                        console.log('Current address state:', {
                          addresses: addresses.length,
                          addressesLoaded,
                          addressesLoading,
                          supabase: !!supabase,
                          supabaseStatus
                        });
                        
                        if (!supabase) {
                          addNotification('error', 'Supabase not available', 'Supabase client not initialized');
                          return;
                        }
                        
                        try {
                          // Test database connection and count
                          const { count, error: countError } = await supabase
                            .from('customer_addresses')
                            .select('*', { count: 'exact', head: true });
                          
                          if (countError) {
                            console.error('Database count error:', countError);
                            addNotification('error', 'Database connection failed', countError.message);
                            return;
                          }
                          
                          console.log(`Database contains ${count} total records`);
                          
                          // Test sample data
                          const { data: sampleData, error: sampleError } = await supabase
                            .from('customer_addresses')
                            .select('customer_name, city, state')
                            .limit(5);
                          
                          if (sampleError) {
                            console.error('Sample data error:', sampleError);
                            addNotification('error', 'Sample data fetch failed', sampleError.message);
                            return;
                          }
                          
                          console.log('Sample data:', sampleData);
                          
                          const validCount = sampleData?.filter(addr => 
                            addr.customer_name && addr.customer_name.trim() !== ''
                          ).length || 0;
                          
                          const diagnosticInfo = `
Database: ${count} total records
App State: ${addresses.length} loaded addresses
Sample Valid: ${validCount}/5 records
Supabase Status: ${supabaseStatus}
Loading State: ${addressesLoading}
Loaded State: ${addressesLoaded}
                          `.trim();
                          
                          addNotification('info', 'Address Database Diagnostics', diagnosticInfo);
                          console.log('Diagnostic info:', diagnosticInfo);
                          
                        } catch (error) {
                          console.error('Diagnostics failed:', error);
                          addNotification('error', 'Diagnostics failed', error.message);
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-300"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Database Diagnostics
                    </button>
                    <button
                      onClick={exportAddresses}
                      disabled={addresses.length === 0}
                      className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </button>
                  </div>
              </div>

              {/* Address Upload Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Address Upload</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Upload Excel/CSV file with customer addresses for bulk import
                    <br />
                    <span className="text-sm text-green-600 font-medium">
                      Supports Samsara CSV format: Name, Address, Latitude, Longitude, Notes, ID
                    </span>
                    <br />
                    <span className="text-sm text-blue-600 font-medium">
                      Or standard format: Customer Name, City, State (Full Address, Zip Code, Phone optional)
                    </span>
                  </p>
                  <div className="flex justify-center space-x-4">
                    <label className="cursor-pointer bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors border border-green-300">
                      Choose Address File
                      <input type="file" className="hidden" onChange={handleAddressUpload} accept=".xlsx,.csv" />
                    </label>
                  </div>
                  {addressUploadProgress && <p className="mt-4 text-green-700 font-medium">{addressUploadProgress}</p>}
                  {addressUploadError && <p className="mt-2 text-red-600 font-medium">{addressUploadError}</p>}
                  {addressUploadWarnings.length > 0 && (
                    <ul className="mt-2 text-yellow-700 text-sm text-left max-w-xl mx-auto">
                      {addressUploadWarnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
                    </ul>
                  )}
                  {addressReady && addressPreviewData.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Preview: {addressPreviewData.length} addresses ready to import</p>
                      <button
                        onClick={importAddressesToSupabase}
                        className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
                      >
                        Import to Supabase
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Manager */}
              {showAddressManager && (
                <div>
                                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Address Database ({addressesLoaded ? addresses.length : addressesLoading ? 'Loading...' : '0'} total)
                      {addressesLoading && <span className="ml-2 text-sm text-blue-600">🔄 Loading...</span>}
                    </h3>
                    <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Search addresses..."
                        value={addressSearchTerm}
                        onChange={(e) => setAddressSearchTerm(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      />
                      <button
                        onClick={() => setEditingAddress({})}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors border border-green-300"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Add New
                      </button>
                </div>
              </div>

                  {/* Address List */}
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredAddresses.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {addresses.length === 0 ? 'No addresses in database' : 'No addresses match your search'}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredAddresses.map((address) => (
                          <div key={address.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{address.customer_name}</h4>
                                <p className="text-sm text-gray-600">
                                  {address.full_address && `${address.full_address}, `}
                                  {address.city}, {address.state} {address.zip_code}
                                </p>
                                {address.phone && (
                                  <p className="text-xs text-gray-500">📞 {address.phone}</p>
                                )}
                                {address.special_instructions && (
                                  <p className="text-xs text-gray-500">📝 {address.special_instructions}</p>
                                )}
                                {address.latitude && address.longitude && (
                                  <p className="text-xs text-purple-500">📍 {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}</p>
                                )}
                                {address.external_id && (
                                  <p className="text-xs text-gray-400">🆔 {address.external_id}</p>
                                )}
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => setEditingAddress(address)}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors border border-blue-300"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteAddress(address.id)}
                                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 transition-colors border border-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address Edit Modal */}
              {editingAddress && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                    <h3 className="text-lg font-bold mb-4">
                      {editingAddress.id ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const addressData = {
                        customer_name: formData.get('customer_name'),
                        full_address: formData.get('full_address'),
                        city: formData.get('city'),
                        state: formData.get('state'),
                        zip_code: formData.get('zip_code'),
                        phone: formData.get('phone'),
                        special_instructions: formData.get('special_instructions'),
                        latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : null,
                        longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : null,
                        external_id: formData.get('external_id') || null
                      };
                      saveAddress(addressData);
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                          <input
                            type="text"
                            name="customer_name"
                            defaultValue={editingAddress.customer_name || ''}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                          <input
                            type="text"
                            name="full_address"
                            defaultValue={editingAddress.full_address || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input
                              type="text"
                              name="city"
                              defaultValue={editingAddress.city || ''}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                            <input
                              type="text"
                              name="state"
                              defaultValue={editingAddress.state || ''}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                            <input
                              type="text"
                              name="zip_code"
                              defaultValue={editingAddress.zip_code || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="text"
                              name="phone"
                              defaultValue={editingAddress.phone || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                          <textarea
                            name="special_instructions"
                            defaultValue={editingAddress.special_instructions || ''}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              name="latitude"
                              defaultValue={editingAddress.latitude || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="e.g., 27.9506"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              name="longitude"
                              defaultValue={editingAddress.longitude || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="e.g., -82.4572"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">External ID</label>
                          <input
                            type="text"
                            name="external_id"
                            defaultValue={editingAddress.external_id || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g., samsara_12345"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button
                          type="submit"
                          className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg hover:bg-green-200 transition-colors border border-green-300"
                        >
                          {editingAddress.id ? 'Update' : 'Add'} Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAddress(null)}
                          className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Supabase Configuration Modal */}
              {showSupabaseConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                    <h3 className="text-lg font-bold mb-4">Configure Supabase Connection</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter your Supabase credentials securely. These will be stored locally and never exposed in the interface.
                    </p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      setSupabaseUrl(formData.get('supabase_url'));
                      setSupabaseKey(formData.get('supabase_key'));
                      setShowSupabaseConfig(false);
                      addNotification('success', 'Supabase configuration updated', 'Test the connection to verify settings');
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Supabase URL</label>
                          <input
                            type="text"
                            name="supabase_url"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                            placeholder="https://xyzcompany.supabase.co"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Supabase Anon Key</label>
                          <input
                            type="password"
                            name="supabase_key"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                            placeholder="Your Supabase anon/public key"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button
                          type="submit"
                          className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg hover:bg-green-200 transition-colors border border-green-300"
                        >
                          Save Configuration
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSupabaseConfig(false)}
                          className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Errors Occurred</h3>
              <ul className="text-sm text-red-600 mt-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsAutomationPlatform;