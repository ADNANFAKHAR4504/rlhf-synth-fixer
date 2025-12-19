// Lambda@Edge function for viewer response
// Adds security headers to all responses

exports.handler = async (event) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;
    
    // Strict-Transport-Security (HSTS)
    // Enforce HTTPS for 1 year, include subdomains
    headers['strict-transport-security'] = [{
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
    }];
    
    // Content-Security-Policy (CSP)
    // Restrict resource loading to prevent XSS attacks
    headers['content-security-policy'] = [{
        key: 'Content-Security-Policy',
        value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:; media-src 'self' https:; object-src 'none'; frame-ancestors 'self'"
    }];
    
    // X-Content-Type-Options
    // Prevent MIME type sniffing
    headers['x-content-type-options'] = [{
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    }];
    
    // X-Frame-Options
    // Prevent clickjacking attacks
    headers['x-frame-options'] = [{
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    }];
    
    // X-XSS-Protection
    // Enable browser XSS protection (legacy browsers)
    headers['x-xss-protection'] = [{
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    }];
    
    // Referrer-Policy
    // Control referrer information sent with requests
    headers['referrer-policy'] = [{
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    }];
    
    // Permissions-Policy
    // Control which browser features can be used
    headers['permissions-policy'] = [{
        key: 'Permissions-Policy',
        value: 'geolocation=(), microphone=(), camera=(), payment=()'
    }];
    
    // Cache-Control for security-sensitive content
    // Add custom cache control if needed
    if (response.status === '200') {
        // Allow caching but require revalidation
        if (!headers['cache-control']) {
            headers['cache-control'] = [{
                key: 'Cache-Control',
                value: 'public, max-age=3600, must-revalidate'
            }];
        }
    }
    
    // Add custom header to identify Lambda@Edge processing
    headers['x-edge-processed'] = [{
        key: 'X-Edge-Processed',
        value: 'true'
    }];
    
    // Add server identification (optional)
    headers['x-powered-by'] = [{
        key: 'X-Powered-By',
        value: 'AWS CloudFront + Lambda@Edge'
    }];
    
    // Log for debugging (CloudWatch Logs)
    console.log(JSON.stringify({
        type: 'viewer-response',
        status: response.status,
        headersAdded: Object.keys(headers).length
    }));
    
    return response;
};

