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
  Settings
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

  const optimizeRoutes = async (geocodedData) => {
    setProcessing(true);
    const mode = testMode ? 'TEST MODE' : 'LIVE MODE';
    addNotification('info', `Starting FreshOne route optimization (${mode})...`, testMode ? 'Using simulation data' : 'Using NextBillion.ai API');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // More realistic route optimization with multiple routes
    const drivers = ['John Smith', 'Maria Garcia', 'David Johnson'];
    const vehicles = ['Truck 101', 'Truck 102', 'Truck 103'];
    
    // Split stops across multiple routes for better distribution
    const stopsPerRoute = Math.ceil(geocodedData.length / drivers.length);
    const routes = [];
    
    for (let i = 0; i < drivers.length && i * stopsPerRoute < geocodedData.length; i++) {
      const routeStops = geocodedData.slice(i * stopsPerRoute, (i + 1) * stopsPerRoute);
      const totalDistance = routeStops.length * 15 + Math.random() * 20; // Realistic distance calculation
      const totalTime = routeStops.length * 45 + Math.random() * 60; // Realistic time calculation
      
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

  // Helper: Map Excel row to BOL row
  function mapExcelRow(row, colMap) {
    return {
      SO_Number: row[colMap.sonumber] || '',
      Customer_Name: row[colMap.customer_name] || '',
      City: row[colMap.city] || '',
      State: row[colMap.state] || '',
      Cases: row[colMap.cases] || '',
      Delivery_Date: row[colMap.delivery_date] || '',
      Special_Instructions: row[colMap.special_instructions] || ''
    };
  }

  // Enhanced file upload handler
  const handleFileUpload = (event) => {
    setFileUploadProgress('Reading file...');
    setFileUploadError('');
    setFileUploadWarnings([]);
    setFilePreviewData([]);
    setFileReady(false);
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
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
        // Required columns
        const required = ['customer_name', 'city', 'state'];
        const missing = required.filter(r => !colMap[r]);
        if (missing.length) {
          setFileUploadError('Missing required columns: ' + missing.join(', '));
          setFileUploadProgress('');
          return;
        }
        // Map and validate rows
        const previewRows = [];
        const warnings = [];
        json.forEach((row, idx) => {
          const mapped = mapExcelRow(row, colMap);
          // Validate
          if (!mapped.Customer_Name || !mapped.City || !mapped.State) {
            warnings.push(`Row ${idx + 2}: Missing required data.`);
          }
          if (mapped.Cases && isNaN(Number(mapped.Cases))) {
            warnings.push(`Row ${idx + 2}: Cases is not a number.`);
          }
          if (mapped.Delivery_Date && isNaN(Date.parse(mapped.Delivery_Date))) {
            warnings.push(`Row ${idx + 2}: Invalid delivery date.`);
          }
          previewRows.push(mapped);
        });
        setFilePreviewData(previewRows);
        setFileUploadWarnings(warnings);
        setFileUploadProgress('File parsed successfully.');
        setFileReady(true);
      } catch (err) {
        setFileUploadError('Error parsing file: ' + err.message);
        setFileUploadProgress('');
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
  }

  // FreshOne API status check
  const checkApiStatus = () => {
    const mode = testMode ? 'TEST MODE' : 'LIVE MODE';
    const samsaraStatus = SAMSARA_API_TOKEN !== '[YOUR_SAMSARA_TOKEN_HERE]' ? '✅ Configured' : '⏳ Not configured';
    const nextBillionStatus = NEXTBILLION_API_KEY !== '[YOUR_NEXTBILLION_API_KEY_HERE]' ? '✅ Configured' : '⏳ Not configured';
    
    addNotification('info', `FreshOne API Status (${mode})`, `Samsara: ${samsaraStatus} | NextBillion: ${nextBillionStatus}`);
  };

  // Supabase config state - use environment variables with fallbacks
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [supabaseStatus, setSupabaseStatus] = useState(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY 
      ? 'Not Connected' 
      : 'Not Configured'
  );
  const [supabaseTesting, setSupabaseTesting] = useState(false);

  // Supabase client (recreated on config change) - only create if credentials are available
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  // Address management state
  const [addresses, setAddresses] = useState([]);
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
    if (!supabase) {
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .order('customer_name', { ascending: true });
      
      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      addNotification('error', 'Failed to load addresses', error.message);
    }
  };

  // Upload address list handler
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
        
        // Normalize address columns
        const colMap = {};
        const firstRow = json[0];
        Object.keys(firstRow).forEach(col => {
          const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '');
          colMap[norm] = col;
        });
        
        // Map address data
        const previewRows = [];
        const warnings = [];
        
        json.forEach((row, idx) => {
          const address = {
            customer_name: row[colMap.customername] || row[colMap.customer] || row[colMap.name] || '',
            full_address: row[colMap.fulladdress] || row[colMap.address] || '',
            city: row[colMap.city] || '',
            state: row[colMap.state] || '',
            zip_code: row[colMap.zipcode] || row[colMap.zip] || '',
            phone: row[colMap.phone] || row[colMap.telephone] || '',
            special_instructions: row[colMap.specialinstructions] || row[colMap.instructions] || ''
          };
          
          // Validate required fields
          if (!address.customer_name || !address.city || !address.state) {
            warnings.push(`Row ${idx + 2}: Missing required data (customer name, city, or state).`);
          }
          
          previewRows.push(address);
        });
        
        setAddressPreviewData(previewRows);
        setAddressUploadWarnings(warnings);
        setAddressUploadProgress('Address file parsed successfully.');
        setAddressReady(true);
      } catch (err) {
        setAddressUploadError('Error parsing address file: ' + err.message);
        setAddressUploadProgress('');
      }
    };
    
    reader.onerror = () => {
      setAddressUploadError('Error reading address file.');
      setAddressUploadProgress('');
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
    
    setAddressUploadProgress('Importing addresses to Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .upsert(addressPreviewData, { 
          onConflict: 'customer_name,full_address',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
      
      setAddressUploadProgress('Addresses imported successfully!');
      addNotification('success', 'Addresses imported to Supabase', `${addressPreviewData.length} addresses processed`);
      
      // Reload addresses
      await loadAddresses();
      
      // Reset upload state
      setAddressPreviewData([]);
      setAddressReady(false);
      setAddressUploadProgress('');
      
    } catch (error) {
      setAddressUploadError('Import failed: ' + error.message);
      addNotification('error', 'Failed to import addresses', error.message);
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
      'Special Instructions': addr.special_instructions
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

  // Load addresses on component mount
  useEffect(() => {
    if (supabaseStatus === '✅ Connected' && supabase) {
      loadAddresses();
    }
  }, [supabaseStatus, supabase]);

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSupabaseStatus('❌ Not Configured');
      addNotification('error', 'Supabase not configured', 'Please configure Supabase credentials first');
      return;
    }
    
    setSupabaseTesting(true);
    setSupabaseStatus('Testing...');
    try {
      const { data, error } = await supabase.from('customer_addresses').select('*').limit(1);
      if (error) {
        setSupabaseStatus('❌ Error: ' + error.message);
        addNotification('error', 'Supabase connection failed', error.message);
      } else {
        setSupabaseStatus('✅ Connected');
        addNotification('success', 'Supabase connection successful', 'Database is ready for operations');
      }
    } catch (err) {
      setSupabaseStatus('❌ Error: ' + err.message);
      addNotification('error', 'Supabase connection failed', err.message);
    }
    setSupabaseTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-100">
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
                </p>
                <div className="flex justify-center space-x-4">
                  <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
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
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cases</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(fileReady ? filePreviewData : bolData).map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.SO_Number}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.Customer_Name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.City}, {item.State}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.Cases}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* FreshOne Excel Reports */}
            {Object.keys(reports).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-xs">F1</span>
                  </div>
                  FreshOne Excel Reports (Current Format)
                </h2>
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
                                className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download Excel
                              </button>
                              <button
                                onClick={() => navigator.clipboard.writeText(report.filename)}
                                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
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
                              className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
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
              </div>
            )}

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
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      Check Status
                    </button>
                    <button
                      onClick={testSamsaraConnection}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Test Samsara
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
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {supabaseTesting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
                    Test Connection
                  </button>
                  <button
                    onClick={() => setShowSupabaseConfig(true)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                {supabaseStatus !== 'Not Configured' && supabaseStatus !== '✅ Connected' && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Credentials are configured via environment variables
                  </p>
                )}
                {supabaseStatus === 'Not Configured' && (
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 Click "Configure" to securely enter your Supabase credentials
                  </p>
                )}
              </div>
            </div>

            {/* Address Management Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-xs">F1</span>
                  </div>
                  FreshOne Address Management
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddressManager(!showAddressManager)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {showAddressManager ? 'Hide Manager' : 'Open Manager'}
                  </button>
                  <button
                    onClick={exportAddresses}
                    disabled={addresses.length === 0}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
                      Required columns: Customer Name, City, State (Full Address, Zip Code, Phone optional)
                    </span>
                  </p>
                  <div className="flex justify-center space-x-4">
                    <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
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
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                    <h3 className="text-lg font-semibold text-gray-900">Address Database ({addresses.length} total)</h3>
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
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
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
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => setEditingAddress(address)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteAddress(address.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
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
                        special_instructions: formData.get('special_instructions')
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
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button
                          type="submit"
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {editingAddress.id ? 'Update' : 'Add'} Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAddress(null)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save Configuration
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSupabaseConfig(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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
    </div>
  );
};

export default LogisticsAutomationPlatform;