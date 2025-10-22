```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const userPreferencesTable = new dynamodb.Table(
      this,
      'UserPreferencesTable',
      {
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
      }
    );

    userPreferencesTable.addGlobalSecondaryIndex({
      indexName: 'preferenceTypeIndex',
      partitionKey: {
        name: 'preferenceType',
        type: dynamodb.AttributeType.STRING,
      },
    });

    const engagementTrackingTable = new dynamodb.Table(
      this,
      'EngagementTrackingTable',
      {
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
      }
    );

    engagementTrackingTable.addGlobalSecondaryIndex({
      indexName: 'contentIdIndex',
      partitionKey: {
        name: 'contentId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    const personalizationFunction = new cloudfront.experimental.EdgeFunction(
      this,
      'PersonalizationFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'personalization.handler',
        code: lambda.Code.fromAsset('lib/lambda'),
        memorySize: 128,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    personalizationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:GetItem', 'dynamodb:Query'],
        resources: [
          userPreferencesTable.tableArn,
          `${userPreferencesTable.tableArn}/index/*`,
        ],
      })
    );

    personalizationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    const engagementTrackingFunction = new cloudfront.experimental.EdgeFunction(
      this,
      'EngagementTrackingFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'engagement-tracking.handler',
        code: lambda.Code.fromAsset('lib/lambda'),
        memorySize: 128,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    engagementTrackingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
        resources: [engagementTrackingTable.tableArn],
      })
    );

    engagementTrackingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(contentBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        edgeLambdas: [
          {
            functionVersion: personalizationFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          },
          {
            functionVersion: engagementTrackingFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE,
          },
        ],
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    const dashboard = new cloudwatch.Dashboard(this, 'NewsDashboard', {
      dashboardName: `NewsPersonalizationDashboard-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'Requests',
            dimensionsMap: {
              DistributionId: distribution.distributionId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda@Edge Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: personalizationFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: userPreferencesTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      exportName: `${this.stackName}-DistributionDomainName`,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
      exportName: `${this.stackName}-ContentBucketName`,
    });

    new cdk.CfnOutput(this, 'UserPreferencesTableName', {
      value: userPreferencesTable.tableName,
      exportName: `${this.stackName}-UserPreferencesTableName`,
    });

    new cdk.CfnOutput(this, 'EngagementTrackingTableName', {
      value: engagementTrackingTable.tableName,
      exportName: `${this.stackName}-EngagementTrackingTableName`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      exportName: `${this.stackName}-DistributionId`,
    });
  }
}
```

```javascript
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
```

```javascript
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
```

```json
{
  "name": "edge-functions",
  "version": "1.0.0",
  "description": "Lambda@Edge functions for news personalization",
  "dependencies": {
    "aws-sdk": "^2.1496.0",
    "aws-xray-sdk-core": "^3.5.1"
  }
}
```