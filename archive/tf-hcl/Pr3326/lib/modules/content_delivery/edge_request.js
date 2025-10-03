// Lambda@Edge function for request routing and A/B testing

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // A/B Testing: Route 50% of traffic to version B
    const random = Math.random();
    if (random < 0.5) {
        headers['x-app-version'] = [{ key: 'X-App-Version', value: 'B' }];
    } else {
        headers['x-app-version'] = [{ key: 'X-App-Version', value: 'A' }];
    }

    // Add custom headers
    headers['x-edge-location'] = [{ 
        key: 'X-Edge-Location', 
        value: event.Records[0].cf.config.distributionId 
    }];

    // Route based on device type
    const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';
    if (userAgent.match(/mobile/i)) {
        headers['x-device-type'] = [{ key: 'X-Device-Type', value: 'mobile' }];
    } else {
        headers['x-device-type'] = [{ key: 'X-Device-Type', value: 'desktop' }];
    }

    return request;
};
