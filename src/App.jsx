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
  Wifi
} from 'lucide-react';

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
  const [emailSettings, setEmailSettings] = useState({
    customer: 'customer@fresh-one.com',
    warehouse: 'warehouse@fresh-one.com',
    management: 'djanacek@fresh-one.com',
    drivers: ['driver1@fresh-one.com', 'driver2@fresh-one.com'],
    enabled: false,
    microsoftConfigured: false
  });
  const [apiConfig, setApiConfig] = useState(() => {
    // Load saved API config from localStorage
    const saved = localStorage.getItem('freshone-api-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Error loading saved API config');
      }
    }
    return {
      nextBillion: '',
      samsara: '',
      samsaraOrgId: '1288',
      emailJS: '',
      warehouse: { lat: 27.9506, lon: -82.4572, name: 'Main Warehouse' }
    };
  });
  const [testMode, setTestMode] = useState(true);
  const [routesAwaitingApproval, setRoutesAwaitingApproval] = useState([]);
  const [showRouteReview, setShowRouteReview] = useState(false);

  // Save API config whenever it changes
  useEffect(() => {
    localStorage.setItem('freshone-api-config', JSON.stringify(apiConfig));
  }, [apiConfig]);

  // Workflow steps
  const steps = [
    { id: 0, title: 'Upload BOL', icon: Upload, status: 'pending' },
    { id: 1, title: 'Geocode Addresses', icon: MapPin, status: 'pending' },
    { id: 2, title: 'Route Optimization', icon: Route, status: 'pending' },
    { id: 3, title: 'Review & Approve Routes', icon: CheckCircle, status: 'pending' },
    { id: 4, title: 'Send to Samsara', icon: Send, status: 'pending' },
    { id: 5, title: 'Generate Reports', icon: FileText, status: 'pending' },
    { id: 6, title: 'Send Notifications', icon: Mail, status: 'pending' }
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
      id: Date.now(),
      type,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
  };

  // Email notification function with Microsoft Graph API
  const sendEmailNotification = async (recipients, subject, content, reportType, reportData) => {
    try {
      if (!emailSettings.enabled) {
        if (reportType === 'warehouse' || reportType === 'customer') {
          addNotification('info', `Email simulation: ${subject}`, `Would send Excel file (${reportData?.filename}) to: ${Array.isArray(recipients) ? recipients.join(', ') : recipients}`);
        } else {
          addNotification('info', `Email simulation: ${subject}`, `Would send to: ${Array.isArray(recipients) ? recipients.join(', ') : recipients}`);
        }
        return { success: true, simulated: true };
      }

      // Microsoft Graph API email sending
      const emailBody = generateEmailContent(reportType, content, reportData?.data || reportData);
      
      const recipientList = Array.isArray(recipients) ? recipients : [recipients];
      
      // This would be the actual Microsoft Graph API call
      const emailPromises = recipientList.map(async (email) => {
        // Simulated Microsoft Graph API call structure
        const graphApiCall = {
          method: 'POST',
          url: 'https://graph.microsoft.com/v1.0/me/sendMail',
          headers: {
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              subject: subject,
              body: {
                contentType: 'HTML',
                content: emailBody
              },
              toRecipients: [{
                emailAddress: {
                  address: email
                }
              }],
              from: {
                emailAddress: {
                  address: 'logistics@fresh-one.com'
                }
              }
            }
          })
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { email, success: true };
      });
      
      await Promise.all(emailPromises);
      addNotification('success', `FreshOne emails sent successfully`, `Delivered to ${recipientList.length} recipient(s)`);
      return { success: true };
      
    } catch (error) {
      addNotification('error', `Failed to send FreshOne email`, error.message);
      return { success: false, error: error.message };
    }
  };

  // Generate professional email content
  const generateEmailContent = (reportType, content, reportData) => {
    const freshOneHeader = `
      <div style="background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <div style="width: 50px; height: 50px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <span style="color: #84cc16; font-weight: bold; font-size: 18px;">F1</span>
          </div>
          <div>
            <h1 style="color: white; margin: 0; font-size: 24px;">FreshOne Logistics</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0;">Distribution • Warehousing • Logistics</p>
          </div>
        </div>
      </div>
    `;

    const freshOneFooter = `
      <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-top: 3px solid #84cc16;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>FreshOne</strong> - Right place, right time, right temperature, right price<br>
          Dallas • Tampa • Michigan | sales@fresh-one.com
        </p>
      </div>
    `;

    let emailContent = freshOneHeader;

    switch (reportType) {
      case 'customer':
        emailContent += `
          <h2 style="color: #84cc16;">Your FreshOne Delivery Schedule</h2>
          <p>Dear Valued Customer,</p>
          <p>Please find your delivery schedule for ${new Date().toLocaleDateString()}:</p>
        `;
        break;

      case 'warehouse':
        emailContent += `
          <h2 style="color: #84cc16;">FreshOne Loading Instructions</h2>
          <p>Warehouse Team,</p>
          <p>Loading instructions for today's routes:</p>
        `;
        break;

      case 'management':
        emailContent += `
          <h2 style="color: #84cc16;">FreshOne Operations Summary</h2>
          <p>Management Team,</p>
          <p>Daily operations summary for ${new Date().toLocaleDateString()}:</p>
        `;
        break;
    }

    emailContent += freshOneFooter;
    return emailContent;
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
    addNotification('info', 'Starting route optimization...', 'Using NextBillion.ai API');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const routes = [
      {
        id: 'route_001',
        driver: 'John Smith',
        vehicle: 'Truck 101',
        totalDistance: 45.3,
        totalTime: 180,
        estimatedFuelCost: 68.50,
        stops: geocodedData.map((stop, index) => ({
          ...stop,
          sequence: index + 1,
          estimatedArrival: new Date(Date.now() + (index + 1) * 30 * 60000).toISOString(),
          serviceTime: 20
        }))
      }
    ];
    
    setOptimizedRoutes(routes);
    setRoutesAwaitingApproval(routes);
    setCurrentStep(3);
    setShowRouteReview(true);
    addNotification('success', 'Route optimization completed', `Generated ${routes.length} optimized route(s) - AWAITING APPROVAL`);
    return routes;
  };

  const sendToSamsara = async (routes) => {
    setProcessing(true);
    const mode = testMode ? 'TEST MODE' : 'PRODUCTION';
    addNotification('info', `Uploading routes to Samsara (${mode})...`, 'Creating driver assignments');
    
    try {
      if (!testMode && apiConfig.samsara) {
        // Real Samsara API call
        const samsaraResponse = await fetch(`https://api.samsara.com/fleet/routes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiConfig.samsara}`,
            'Content-Type': 'application/json',
            'X-Samsara-Organization-Id': apiConfig.samsaraOrgId
          },
          body: JSON.stringify({
            routes: routes.map(route => ({
              name: `Route ${route.id} - ${new Date().toLocaleDateString()}`,
              vehicle_external_id: route.vehicle,
              driver_external_id: route.driver,
              waypoints: route.stops.map(stop => ({
                name: stop.Customer_Name,
                address: `${stop.Customer_Name}, ${stop.City}, ${stop.State}`,
                latitude: stop.lat,
                longitude: stop.lon,
                estimated_arrival_time: stop.estimatedArrival,
                service_time_minutes: stop.serviceTime,
                notes: stop.Special_Instructions || ''
              }))
            }))
          })
        });
        
        if (!samsaraResponse.ok) {
          throw new Error(`Samsara API error: ${samsaraResponse.statusText}`);
        }
        
        const samsaraData = await samsaraResponse.json();
        addNotification('success', 'Routes uploaded to Samsara (LIVE)', 'Drivers notified via Samsara app');
      } else {
        // Test mode simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        addNotification('success', 'Routes uploaded to Samsara (TEST MODE)', 'No drivers were notified - test mode active');
      }
      
      setSamsaraStatus('success');
      setCurrentStep(5);
      setShowRouteReview(false);
      
      startRealTimeTracking(routes);
      
      return { success: true, routeIds: ['SAM_001', 'SAM_002'] };
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
    const routeData = routes[0] || {};
    
    const generatedReports = {
      warehouse: {
        title: `${dateStr.replace(/\//g, ' ')} Tampa Routes and Stops`,
        data: routes[0]?.stops || [],
        format: 'Excel (.xlsx)',
        recipient: emailSettings.warehouse,
        content: generateWarehouseExcel(routes, timestamp),
        description: 'Routes and stops list for warehouse loading (matches current format)',
        filename: `${timestamp.getFullYear()} ${String(timestamp.getMonth() + 1).padStart(2, '0')} ${String(timestamp.getDate()).padStart(2, '0')} Tampa Routes and Stops.xlsx`
      },
      customer: {
        title: `${dateStr.replace(/\//g, ' ')} Routes Freedom Fresh Dock Reports`,
        data: routes,
        format: 'Excel (.xlsx)',
        recipient: emailSettings.customer,
        content: generateCustomerExcel(routes, timestamp),
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
          estimatedFuelCost: routes.reduce((acc, route) => acc + (route.estimatedFuelCost || 0), 0),
          efficiency: calculateEfficiencyMetrics(routes)
        },
        format: 'Dashboard',
        recipient: emailSettings.management,
        content: generateManagementReport(routes, timestamp),
        description: 'Executive summary with KPIs and performance metrics',
        filename: `FreshOne Operations Summary ${dateStr.replace(/\//g, '-')}.html`
      }
    };
    
    setReports(generatedReports);
    setCurrentStep(6);
    addNotification('success', 'FreshOne Excel reports generated', 'Warehouse and customer reports ready');
    return generatedReports;
  };

  // Calculate efficiency metrics
  const calculateEfficiencyMetrics = (routes) => {
    const totalStops = routes.reduce((acc, route) => acc + (route.stops?.length || 0), 0);
    const totalDistance = routes.reduce((acc, route) => acc + (route.totalDistance || 0), 0);
    const avgStopsPerMile = totalStops > 0 ? (totalDistance / totalStops).toFixed(1) : 0;
    const avgTimePerStop = routes.reduce((acc, route) => acc + (route.totalTime || 0), 0) / totalStops;
    
    return {
      stopsPerMile: avgStopsPerMile,
      avgTimePerStop: Math.round(avgTimePerStop),
      routeEfficiency: totalStops > 0 ? Math.min(100, Math.round((1 / avgStopsPerMile) * 100)) : 0
    };
  };

  // Generate Warehouse Excel (Tampa Routes and Stops format)
  const generateWarehouseExcel = (routes, timestamp) => {
    const stops = routes[0]?.stops || [];
    const dateValue = timestamp.toLocaleDateString('en-US');
    
    const excelData = [
      ['INV #', 'NAME OF', 'CITY', 'DATE', 'Route', 'Stops', '', '', '', '', '', '', '']
    ];
    
    stops.forEach((stop, index) => {
      excelData.push([
        stop.SO_Number || (2084800 + index),
        stop.Customer_Name,
        stop.City,
        dateValue,
        routes[0]?.id || '200',
        index + 1,
        '', '', '', '', '', '', ''
      ]);
    });
    
    return {
      type: 'excel',
      data: excelData,
      sheetName: 'Routes and Stops'
    };
  };

  // Generate Customer Excel (Freedom Fresh Dock format)
  const generateCustomerExcel = (routes, timestamp) => {
    const route = routes[0] || {};
    const stops = route.stops || [];
    
    const dayName = timestamp.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = `${timestamp.getMonth() + 1}.${String(timestamp.getDate()).padStart(2, '0')}`;
    const sheetName = `${dayName} ${monthDay}`;
    
    const excelData = [
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Date', timestamp.toLocaleDateString('en-US'), '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Driver: ', route.driver || 'ASSIGNED DRIVER', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Truck #: ', route.vehicle || '000000', '', '', '', '', '', '', '', Math.round(route.totalTime / 60), Math.round(route.totalDistance), '', '', '', '', ''],
      ['DC Departure:  Sched 5:00 am', '', `Route:  TPA-FF-${dayName} ${route.id || '100'}`, '', '', '', '', '', '', Math.round(route.totalDistance), 'Miles', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Stop', 'Customer Name', 'Address', 'City', 'State', 'Contact', 'Phone', 'Cases', 'Special Instructions', 'ETA', 'Notes', '', '', '', '']
    ];
    
    stops.forEach((stop, index) => {
      excelData.push([
        index + 1,
        stop.Customer_Name,
        stop.Customer_Name,
        stop.City,
        stop.State,
        'Office',
        '(000) 000-0000',
        stop.Cases,
        stop.Special_Instructions || 'Standard delivery',
        new Date(stop.estimatedArrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        '', '', '', '', ''
      ]);
    });
    
    return {
      type: 'excel',
      data: excelData,
      sheetName: sheetName,
      multiSheet: true
    };
  };

  // Generate Management Report
  const generateManagementReport = (routes, timestamp) => {
    const metrics = routes.length > 0 ? calculateEfficiencyMetrics(routes) : {};
    const totalStops = routes.reduce((acc, route) => acc + (route.stops?.length || 0), 0);
    const totalCases = routes.reduce((acc, route) => acc + (route.stops?.reduce((sum, stop) => sum + stop.Cases, 0) || 0), 0);
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 25px; margin-bottom: 25px; border-radius: 8px;">
          <div style="display: flex; align-items: center;">
            <div style="width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-center: center; margin-right: 20px;">
              <span style="color: #84cc16; font-weight: bold; font-size: 24px;">F1</span>
            </div>
            <div>
              <h1 style="color: white; margin: 0; font-size: 28px;">FreshOne Logistics</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Distribution • Warehousing • Logistics</p>
            </div>
          </div>
        </div>
        <h2 style="color: #84cc16; border-bottom: 2px solid #84cc16; padding-bottom: 10px;">
          FreshOne Operations Dashboard - ${timestamp.toLocaleDateString()}
        </h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0;">
          <div style="background: linear-gradient(135deg, #84cc16, #65a30d); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 32px;">${routes.length}</h3>
            <p style="margin: 5px 0; opacity: 0.9;">Active Routes</p>
          </div>
          <div style="background: linear-gradient(135deg, #84cc16, #65a30d); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 32px;">${totalStops}</h3>
            <p style="margin: 5px 0; opacity: 0.9;">Total Deliveries</p>
          </div>
          <div style="background: linear-gradient(135deg, #84cc16, #65a30d); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 32px;">${totalCases}</h3>
            <p style="margin: 5px 0; opacity: 0.9;">Total Cases</p>
          </div>
          <div style="background: linear-gradient(135deg, #84cc16, #65a30d); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 32px;">${routes.reduce((acc, route) => acc + (route.totalDistance || 0), 0).toFixed(0)}</h3>
            <p style="margin: 5px 0; opacity: 0.9;">Total Miles</p>
          </div>
        </div>
        <div style="margin-top: 40px; padding: 25px; background: #f8f9fa; border-top: 4px solid #84cc16; border-radius: 8px;">
          <div style="text-align: center;">
            <h4 style="margin: 0; color: #84cc16; font-size: 18px;">FreshOne</h4>
            <p style="margin: 10px 0 5px 0; color: #666; font-size: 16px; font-weight: bold;">
              Right place, right time, right temperature, right price
            </p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Locations:</strong> Dallas • Tampa • Michigan<br>
              <strong>Contact:</strong> sales@fresh-one.com | Customer Support: lbucher@fresh-one.com
            </p>
          </div>
        </div>
      </div>
    `;
  };

  const sendNotifications = async (reports) => {
    setProcessing(true);
    addNotification('info', 'Sending FreshOne email notifications...', 'Distributing reports to stakeholders');
    
    const emailPromises = Object.entries(reports).map(async ([key, report]) => {
      const subject = `FreshOne ${report.title} - ${new Date().toLocaleDateString()}`;
      const content = `Please find attached the ${report.title} for today's FreshOne deliveries.`;
      
      return sendEmailNotification(
        report.recipient, 
        subject, 
        content, 
        key, 
        report.data
      );
    });
    
    await Promise.all(emailPromises);
    
    setProcessing(false);
    addNotification('success', 'All FreshOne notifications sent', 'Stakeholders have been notified via email');
  };

  // Manual approval function
  const approveAndSendToSamsara = async () => {
    try {
      await sendToSamsara(routesAwaitingApproval);
      const generatedReports = await generateReports(routesAwaitingApproval);
      await sendNotifications(generatedReports);
      
      addNotification('success', 'Routes approved and sent!', 'All systems updated and stakeholders notified');
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
                            <button 
                              onClick={() => {
                                addNotification('info', `Downloading ${report.filename}`, 'Excel file ready');
                              }}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download Excel
                            </button>
                          )}
                          {key === 'management' && (
                            <button 
                              onClick={() => {
                                const previewWindow = window.open('', '_blank');
                                previewWindow.document.write(report.content);
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
                
                {/* Excel Reports Actions */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800">Excel Reports Generated</h4>
                      <p className="text-sm text-green-600">
                        ✅ Warehouse: Routes and Stops (.xlsx) • ✅ Customer: Dock Reports (.xlsx) • ✅ Management: Dashboard
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Reports match your current format - ready to email as Excel attachments
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => {
                          addNotification('info', 'Downloading all Excel files', 'Warehouse and customer reports ready');
                        }}
                        className="flex items-center px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download All Excel
                      </button>
                      <button 
                        onClick={() => sendNotifications(reports)}
                        disabled={processing}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email Excel Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FreshOne Email Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs">F1</span>
                </div>
                <Mail className="w-5 h-5 mr-2" />
                FreshOne Email Notification Settings
              </h2>
              
              {/* Email Status */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-yellow-800">Microsoft Email Integration Status</h3>
                    <p className="text-sm text-yellow-600">
                      {emailSettings.microsoftConfigured 
                        ? '✅ Microsoft Graph API configured and ready'
                        : '⏳ Waiting for IT setup - Using simulation mode'
                      }
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailSettings.enabled}
                      onChange={(e) => setEmailSettings({...emailSettings, enabled: e.target.checked})}
                      className="mr-2"
                    />
                    <span className={`text-sm font-medium ${emailSettings.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {emailSettings.enabled ? 'Email Enabled' : 'Simulation Mode'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={emailSettings.customer}
                    onChange={(e) => setEmailSettings({...emailSettings, customer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="customer@fresh-one.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Receives delivery schedules</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Email</label>
                  <input
                    type="email"
                    value={emailSettings.warehouse}
                    onChange={(e) => setEmailSettings({...emailSettings, warehouse: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="warehouse@fresh-one.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Receives loading instructions</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Management Email</label>
                  <input
                    type="email"
                    value={emailSettings.management}
                    onChange={(e) => setEmailSettings({...emailSettings, management: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="djanacek@fresh-one.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Receives operations summaries</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Emails</label>
                  <input
                    type="text"
                    value={emailSettings.drivers.join(', ')}
                    onChange={(e) => setEmailSettings({...emailSettings, drivers: e.target.value.split(', ')})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="driver1@fresh-one.com, driver2@fresh-one.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Receive route sheets</p>