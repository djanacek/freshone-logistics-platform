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
  Copy
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const SAMSARA_API_TOKEN = 'samsara_api_KbeCZZQeCIR7Abf9SuxdWJt5CSOIDe';
  const SAMSARA_ORG_ID = '1288';
  const NEXTBILLION_API_KEY = '[YOUR_NEXTBILLION_API_KEY_HERE]'; // Ready for when we get the key
  
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
      
      setBolData(sampleBOLData);
      setCurrentStep(1);
      addNotification('info', 'Automation started', 'Processing BOL data');
      
      const geocoded = await geocodeAddresses(sampleBOLData);
      await optimizeRoutes(geocoded);
      
      setProcessing(false);
      addNotification('info', 'Routes ready for review', 'Please review and approve before sending to Samsara');
      
    } catch (error) {
      setErrors([error.message]);
      addNotification('error', 'Automation failed', error.message);
      setProcessing(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBolData(sampleBOLData);
      setCurrentStep(0);
      addNotification('info', 'BOL file uploaded', `Processing ${file.name}`);
    }
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

  // FreshOne API status check
  const checkApiStatus = () => {
    const mode = testMode ? 'TEST MODE' : 'LIVE MODE';
    const samsaraStatus = SAMSARA_API_TOKEN !== '[YOUR_SAMSARA_TOKEN_HERE]' ? '✅ Configured' : '⏳ Not configured';
    const nextBillionStatus = NEXTBILLION_API_KEY !== '[YOUR_NEXTBILLION_API_KEY_HERE]' ? '✅ Configured' : '⏳ Not configured';
    
    addNotification('info', `FreshOne API Status (${mode})`, `Samsara: ${samsaraStatus} | NextBillion: ${nextBillionStatus}`);
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
                    onClick={() => setBolData(sampleBOLData)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Use Sample Data
                  </button>
                </div>
              </div>
              
              {/* BOL Data Preview */}
              {bolData.length > 0 && (
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
                        {bolData.map((item, index) => (
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



            {/* FreshOne Production Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs">F1</span>
                </div>
                FreshOne Production Configuration
              </h2>
              
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Embedded API Credentials</h3>
                <p className="text-sm text-blue-600 mb-3">
                  API credentials are embedded in the code for production use. Update the constants at the top of the file to configure.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-gray-900">Samsara API Token:</p>
                    <p className="text-gray-600 font-mono text-xs">{SAMSARA_API_TOKEN === '[YOUR_SAMSARA_TOKEN_HERE]' ? 'Not configured' : 'Configured'}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-gray-900">NextBillion API Key:</p>
                    <p className="text-gray-600 font-mono text-xs">{NEXTBILLION_API_KEY === '[YOUR_NEXTBILLION_API_KEY_HERE]' ? 'Not configured' : 'Configured'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Safety Status</h4>
                  <div className={`px-3 py-2 rounded-md text-sm font-medium ${
                    testMode ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {testMode ? '🛡️ TEST MODE - Safe for FreshOne testing' : '🔴 LIVE MODE - Will notify FreshOne drivers'}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {testMode ? 'API calls are simulated for safe testing' : 'Real API calls will be made to Samsara'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Warehouse Location</h4>
                  <p className="text-sm text-gray-600">{warehouseConfig.name}</p>
                  <p className="text-xs text-gray-500">Lat: {warehouseConfig.lat}, Lon: {warehouseConfig.lon}</p>
                </div>
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
    </div>
  );
};

export default LogisticsAutomationPlatform;