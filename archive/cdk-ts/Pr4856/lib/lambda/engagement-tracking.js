const AWS = require('aws-sdk');

// Initialize X-Ray tracing
const AWSXRay = require('aws-xray-sdk-core');
const aws = AWSXRay.captureAWS(AWS);

const dynamodb = new aws.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Create X-Ray subsegment for Lambda@Edge function
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('EngagementTrackingEdgeFunction');
    
    try {
        const response = event.Records[0].cf.response;
        const request = event.Records[0].cf.request;
        
        // Extract tracking information from request headers
        const userId = request.headers['x-personalized-user'] ? 
            request.headers['x-personalized-user'][0].value : 'anonymous';
        const contentPath = request.uri;
        const timestamp = Date.now();
        
        subsegment.addAnnotation('userId', userId);
        subsegment.addAnnotation('contentPath', contentPath);
        subsegment.addMetadata('responseStatus', response.status);
        
        // Track engagement for successful content delivery (2xx responses)
        if (response.status.startsWith('2') && userId !== 'anonymous') {
            try {
                // For Lambda@Edge, we need to construct table name from context
                // This would typically be passed via headers in a real implementation
                const engagementTableName = 'TapStack' + (process.env.ENVIRONMENT_SUFFIX || 'dev') + '-EngagementTrackingTable';
                
                if (engagementTableName) {
                    const dynamoSubsegment = subsegment.addNewSubsegment('DynamoDB-TrackEngagement');
                    
                    try {
                        // Extract content ID from path (e.g., /articles/123.html -> 123)
                        const contentIdMatch = contentPath.match(/\/([^\/]+)\.(html|json|xml)$/);
                        const contentId = contentIdMatch ? contentIdMatch[1] : 'unknown';
                        
                        const engagementRecord = {
                            TableName: engagementTableName,
                            Item: {
                                userId: userId,
                                timestamp: timestamp,
                                contentId: contentId,
                                contentPath: contentPath,
                                responseStatus: response.status,
                                userAgent: request.headers['user-agent'] ? 
                                    request.headers['user-agent'][0].value : 'unknown',
                                cloudFrontEdgeLocation: response.headers['x-amz-cf-pop'] ? 
                                    response.headers['x-amz-cf-pop'][0].value : 'unknown'
                            }
                        };
                        
                        await dynamodb.put(engagementRecord).promise();
                        
                        dynamoSubsegment.addAnnotation('engagementTracked', true);
                        dynamoSubsegment.addMetadata('contentId', contentId);
                        dynamoSubsegment.close();
                        
                    } catch (dynamoError) {
                        console.error('DynamoDB put failed:', dynamoError);
                        dynamoSubsegment.addError(dynamoError);
                        dynamoSubsegment.close();
                        // Continue with response - don't block content delivery
                    }
                }
            } catch (error) {
                console.error('Error tracking engagement:', error);
                subsegment.addError(error);
                // Continue with response - don't block content delivery
            }
        }
        
        // Always add engagement tracking header
        response.headers['x-engagement-tracked'] = [{
            key: 'X-Engagement-Tracked', 
            value: 'true'
        }];
        
        // Add cache performance header
        response.headers['x-edge-location'] = [{
            key: 'X-Edge-Location',
            value: response.headers['x-amz-cf-pop'] ? 
                response.headers['x-amz-cf-pop'][0].value : 'unknown'
        }];
        
        subsegment.addAnnotation('success', true);
        subsegment.close();
        
        return response;
        
    } catch (error) {
        console.error('EngagementTrackingEdgeFunction error:', error);
        subsegment.addError(error);
        subsegment.close();
        
        // Return the original response on any error to ensure content delivery continues
        return event.Records[0].cf.response;
    }
};