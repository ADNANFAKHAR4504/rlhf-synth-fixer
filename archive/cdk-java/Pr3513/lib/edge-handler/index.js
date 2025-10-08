exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    try {
        // Extract geographic information from CloudFront headers
        const country = headers['cloudfront-viewer-country'] ? headers['cloudfront-viewer-country'][0].value : 'unknown';
        const city = headers['cloudfront-viewer-city'] ? headers['cloudfront-viewer-city'][0].value : 'unknown';
        const timeZone = headers['cloudfront-viewer-time-zone'] ? headers['cloudfront-viewer-time-zone'][0].value : 'unknown';

        // Extract device information
        const isMobile = headers['cloudfront-is-mobile-viewer'] ? headers['cloudfront-is-mobile-viewer'][0].value === 'true' : false;
        const isDesktop = headers['cloudfront-is-desktop-viewer'] ? headers['cloudfront-is-desktop-viewer'][0].value === 'true' : false;
        const isTablet = headers['cloudfront-is-tablet-viewer'] ? headers['cloudfront-is-tablet-viewer'][0].value === 'true' : false;

        // Prepare analytics data for downstream processing
        const analyticsData = {
            timestamp: new Date().toISOString(),
            uri: request.uri,
            country: country,
            city: city,
            timeZone: timeZone,
            device: {
                isMobile: isMobile,
                isDesktop: isDesktop,
                isTablet: isTablet
            },
            userAgent: headers['user-agent'] ? headers['user-agent'][0].value : 'unknown',
            referer: headers['referer'] ? headers['referer'][0].value : 'direct'
        };

        // Add custom headers for downstream processing
        // Analytics data will be logged by CloudWatch Logs
        request.headers['x-viewer-country'] = [{
            key: 'X-Viewer-Country',
            value: country
        }];

        request.headers['x-viewer-city'] = [{
            key: 'X-Viewer-City',
            value: city
        }];

        request.headers['x-viewer-timezone'] = [{
            key: 'X-Viewer-Timezone',
            value: timeZone
        }];

        request.headers['x-analytics-data'] = [{
            key: 'X-Analytics-Data',
            value: Buffer.from(JSON.stringify(analyticsData)).toString('base64')
        }];

        // Log analytics for CloudWatch processing
        console.log('Analytics:', JSON.stringify(analyticsData));

    } catch (error) {
        console.error('Error in edge function:', error);
        // Don't fail the request on error
    }

    return request;
};