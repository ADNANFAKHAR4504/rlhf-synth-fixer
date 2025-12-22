// lambda/index.js

exports.handler = async (event, context) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    
    try {
        // Extract request information
        const httpMethod = event.requestContext?.http?.method || 'UNKNOWN';
        const path = event.requestContext?.http?.path || '/';
        const sourceIp = event.requestContext?.http?.sourceIp || 'unknown';
        
        // Simulate data processing
        const processingStart = Date.now();
        
        // Your core data processing logic goes here
        const responseData = {
            message: 'Request processed successfully',
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId,
            method: httpMethod,
            path: path,
            sourceIp: sourceIp,
            processingTime: Date.now() - processingStart,
            environment: process.env.NODE_ENV || 'development'
        };
        
        // Log successful processing
        console.log(`Successfully processed ${httpMethod} request to ${path} in ${responseData.processingTime}ms`);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify(responseData)
        };
        
    } catch (error) {
        console.error('Error processing request:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message,
                requestId: context.awsRequestId,
                timestamp: new Date().toISOString()
            })
        };
    }
};