// Lambda@Edge function for viewer request
// Handles content personalization based on user-agent and geolocation

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    
    // Get user-agent for device detection
    const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';
    
    // Get CloudFront-Viewer-Country header for geolocation
    const viewerCountry = headers['cloudfront-viewer-country'] 
        ? headers['cloudfront-viewer-country'][0].value 
        : 'Unknown';
    
    // Device type detection
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
        deviceType = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceType = 'tablet';
    }
    
    // Add custom headers for backend processing
    request.headers['x-device-type'] = [{
        key: 'X-Device-Type',
        value: deviceType
    }];
    
    request.headers['x-viewer-country'] = [{
        key: 'X-Viewer-Country',
        value: viewerCountry
    }];
    
    // Add timestamp for analytics
    request.headers['x-request-timestamp'] = [{
        key: 'X-Request-Timestamp',
        value: new Date().toISOString()
    }];
    
    // Content personalization based on device type
    // Modify URI for device-specific content if needed
    const uri = request.uri;
    
    // Example: Serve optimized images for mobile devices
    if (deviceType === 'mobile' && uri.match(/\.(jpg|jpeg|png)$/i)) {
        // Could redirect to mobile-optimized version
        // request.uri = uri.replace(/\.([^.]+)$/, '-mobile.$1');
    }
    
    // Log for debugging (CloudWatch Logs)
    console.log(JSON.stringify({
        type: 'viewer-request',
        uri: request.uri,
        deviceType: deviceType,
        country: viewerCountry,
        userAgent: userAgent.substring(0, 100)
    }));
    
    return request;
};

