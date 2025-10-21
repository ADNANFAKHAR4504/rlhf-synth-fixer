const AWS = require('aws-sdk');

// Initialize X-Ray tracing
const AWSXRay = require('aws-xray-sdk-core');
const aws = AWSXRay.captureAWS(AWS);

const dynamodb = new aws.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Create X-Ray subsegment for Lambda@Edge function
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('PersonalizationEdgeFunction');
    
    try {
        const request = event.Records[0].cf.request;
        const headers = request.headers;
        
        // Extract user ID from headers
        const userId = headers['x-user-id'] ? headers['x-user-id'][0].value : 'anonymous';
        
        subsegment.addAnnotation('userId', userId);
        subsegment.addMetadata('requestHeaders', headers);
        
        // For non-anonymous users, try to fetch preferences
        if (userId !== 'anonymous') {
            try {
                // For Lambda@Edge, we need to construct table name from context
                // This would typically be passed via headers in a real implementation
                const userPreferencesTableName = 'TapStack' + (process.env.ENVIRONMENT_SUFFIX || 'dev') + '-UserPreferencesTable';
                
                if (userPreferencesTableName) {
                    const dynamoSubsegment = subsegment.addNewSubsegment('DynamoDB-GetUserPreferences');
                    
                    try {
                        const params = {
                            TableName: userPreferencesTableName,
                            Key: {
                                userId: userId
                            }
                        };
                        
                        const result = await dynamodb.get(params).promise();
                        dynamoSubsegment.addAnnotation('userFound', !!result.Item);
                        
                        if (result.Item) {
                            // Add personalization headers based on preferences
                            const preferences = result.Item;
                            subsegment.addMetadata('userPreferences', preferences);
                            
                            if (preferences.category) {
                                request.headers['x-preferred-category'] = [{
                                    key: 'X-Preferred-Category', 
                                    value: preferences.category
                                }];
                            }
                            
                            if (preferences.language) {
                                request.headers['x-preferred-language'] = [{
                                    key: 'X-Preferred-Language', 
                                    value: preferences.language
                                }];
                            }
                        }
                        
                        dynamoSubsegment.close();
                    } catch (dynamoError) {
                        console.error('DynamoDB query failed:', dynamoError);
                        dynamoSubsegment.addError(dynamoError);
                        dynamoSubsegment.close();
                        // Continue without preferences - graceful degradation
                    }
                }
            } catch (error) {
                console.error('Error fetching user preferences:', error);
                subsegment.addError(error);
                // Continue without preferences - graceful degradation
            }
        }
        
        // Always set personalized user header
        request.headers['x-personalized-user'] = [{
            key: 'X-Personalized-User', 
            value: userId
        }];
        
        subsegment.addAnnotation('success', true);
        subsegment.close();
        
        return request;
        
    } catch (error) {
        console.error('PersonalizationEdgeFunction error:', error);
        subsegment.addError(error);
        subsegment.close();
        
        // Return the original request on any error to ensure content delivery continues
        return event.Records[0].cf.request;
    }
};