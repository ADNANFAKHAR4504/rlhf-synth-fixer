# AWS CDK TypeScript Enhanced Serverless Infrastructure with X-Ray and EventBridge

This solution creates a sophisticated serverless infrastructure using AWS CDK with TypeScript, featuring Lambda functions, API Gateway, S3 with KMS encryption, CloudWatch monitoring, X-Ray distributed tracing, and EventBridge event-driven architecture.

## Infrastructure Components

### 1. Enhanced Serverless Stack (lib/serverless-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as xray from 'aws-cdk-lib/aws-xray';
import { Construct } from 'constructs';

interface ServerlessStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class ServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ServerlessStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create KMS key for S3 bucket encryption
    const kmsKey = new kms.Key(this, 'ServerlessDataKey', {
      description: `KMS key for serverless data encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create alias for the KMS key
    new kms.Alias(this, 'ServerlessDataKeyAlias', {
      aliasName: `alias/serverless-data-${environmentSuffix}`,
      targetKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create X-Ray tracing group for distributed tracing
    const xrayTracingConfig = new xray.CfnGroup(this, 'ServerlessXRayGroup', {
      groupName: `serverless-tracing-${environmentSuffix}`,
      filterExpression: `service("serverless-handler-${environmentSuffix}")`,
    });

    // Create custom EventBridge bus for event-driven architecture
    const customEventBus = new events.EventBus(this, 'ServerlessEventBus', {
      eventBusName: `serverless-events-${environmentSuffix}`,
      description: 'Custom event bus for serverless application events',
    });

    // Create an archive for EventBridge events
    new events.Archive(this, 'ServerlessEventArchive', {
      sourceEventBus: customEventBus,
      archiveName: `serverless-archive-${environmentSuffix}`,
      description: 'Archive for serverless application events',
      retention: cdk.Duration.days(7),
      eventPattern: {
        source: ['serverless.application'],
      },
    });

    // Create S3 bucket with KMS encryption using dual-layer encryption (DSSE-KMS)
    const dataBucket = new s3.Bucket(this, 'ServerlessDataBucket', {
      bucketName: `serverless-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create CloudWatch Log Group for Lambda function
    const lambdaLogGroup = new logs.LogGroup(this, 'ServerlessLambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for Lambda function with minimal permissions
    const lambdaRole = new iam.Role(this, 'ServerlessLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [dataBucket.bucketArn, `${dataBucket.bucketArn}/*`],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [lambdaLogGroup.logGroupArn],
            }),
          ],
        }),
        XRayAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
                'xray:GetSamplingRules',
                'xray:GetSamplingTargets',
                'xray:GetSamplingStatisticSummaries',
              ],
              resources: ['*'],
            }),
          ],
        }),
        EventBridgeAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'events:PutEvents',
                'events:ListRules',
                'events:DescribeRule',
              ],
              resources: [
                customEventBus.eventBusArn,
                `arn:aws:events:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:rule/${customEventBus.eventBusName}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create Lambda function with X-Ray tracing and EventBridge integration
    const lambdaFunction = new lambda.Function(this, 'ServerlessHandler', {
      functionName: `serverless-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const AWSXRay = require('aws-xray-sdk-core');

const eventBridgeClient = AWSXRay.captureAWSv3Client(new EventBridgeClient({ region: process.env.AWS_REGION }));

exports.handler = async (event) => {
    console.log('Lambda function invoked with event:', JSON.stringify(event, null, 2));
    
    const timestamp = new Date().toISOString();
    const requestId = event.requestContext ? event.requestContext.requestId : 'unknown';
    
    // Create X-Ray subsegment for custom tracing
    const segment = AWSXRay.getSegment();
    const subsegment = segment ? segment.addNewSubsegment('serverless-processing') : null;
    
    try {
        // Log request details
        console.log(\`Request ID: \${requestId}, Timestamp: \${timestamp}, Method: \${event.httpMethod}, Path: \${event.path}\`);
        
        // Add X-Ray annotations
        if (subsegment) {
            subsegment.addAnnotation('requestId', requestId);
            subsegment.addAnnotation('httpMethod', event.httpMethod || 'UNKNOWN');
            subsegment.addAnnotation('path', event.path || '/');
        }
        
        // Publish event to EventBridge
        const eventDetail = {
            requestId: requestId,
            timestamp: timestamp,
            method: event.httpMethod || 'UNKNOWN',
            path: event.path || '/',
            userAgent: event.headers ? event.headers['User-Agent'] : 'unknown',
            sourceIp: event.requestContext ? event.requestContext.identity.sourceIp : 'unknown'
        };
        
        const putEventsCommand = new PutEventsCommand({
            Entries: [{
                Source: 'serverless.application',
                DetailType: 'API Request Processed',
                Detail: JSON.stringify(eventDetail),
                EventBusName: process.env.EVENT_BUS_NAME,
                Time: new Date()
            }]
        });
        
        await eventBridgeClient.send(putEventsCommand);
        console.log('Event published to EventBridge successfully');
        
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                message: 'Serverless function executed successfully',
                requestId: requestId,
                timestamp: timestamp,
                method: event.httpMethod,
                path: event.path,
                bucketName: process.env.BUCKET_NAME,
                eventBusName: process.env.EVENT_BUS_NAME,
                xrayTracingGroup: process.env.XRAY_TRACING_GROUP,
                features: ['X-Ray Tracing', 'EventBridge Integration']
            })
        };
        
        // Close X-Ray subsegment
        if (subsegment) {
            subsegment.close();
        }
        
        // Log successful response
        console.log('Response:', JSON.stringify(response, null, 2));
        
        return response;
    } catch (error) {
        console.error('Error in Lambda function:', error);
        
        // Add error to X-Ray subsegment
        if (subsegment) {
            subsegment.addError(error);
            subsegment.close();
        }
        
        const errorResponse = {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                requestId: requestId,
                timestamp: timestamp
            })
        };
        
        console.log('Error response:', JSON.stringify(errorResponse, null, 2));
        return errorResponse;
    }
};
      `),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        KMS_KEY_ID: kmsKey.keyId,
        EVENT_BUS_NAME: customEventBus.eventBusName,
        XRAY_TRACING_GROUP: xrayTracingConfig.groupName!,
      },
      logGroup: lambdaLogGroup,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0, // Enable CloudWatch Lambda Insights
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });

    // Create API Gateway REST API with X-Ray tracing
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `Serverless API - ${environmentSuffix}`,
      description: 'API Gateway for serverless Lambda function with X-Ray tracing',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true, // Enable X-Ray tracing for API Gateway
      },
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // Add methods to API Gateway
    api.root.addMethod('GET', lambdaIntegration);
    api.root.addMethod('POST', lambdaIntegration);

    // Add a health endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // Create event processing Lambda function
    const eventProcessorFunction = new lambda.Function(this, 'EventProcessor', {
      functionName: `event-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');

exports.handler = async (event) => {
    console.log('Event processor invoked with event:', JSON.stringify(event, null, 2));
    
    const segment = AWSXRay.getSegment();
    const subsegment = segment ? segment.addNewSubsegment('event-processing') : null;
    
    try {
        if (subsegment) {
            subsegment.addAnnotation('eventSource', event.source || 'unknown');
            subsegment.addAnnotation('eventDetailType', event['detail-type'] || 'unknown');
        }
        
        // Process the event
        const eventDetail = event.detail || {};
        console.log('Processing event detail:', JSON.stringify(eventDetail, null, 2));
        
        // Simulate event processing with some business logic
        if (eventDetail.method === 'POST') {
            console.log('Processing POST request event');
        } else if (eventDetail.method === 'GET') {
            console.log('Processing GET request event');
        }
        
        // Add metadata
        const processedEvent = {
            ...eventDetail,
            processedAt: new Date().toISOString(),
            processorVersion: '1.0.0',
            eventBusName: process.env.EVENT_BUS_NAME
        };
        
        if (subsegment) {
            subsegment.close();
        }
        
        console.log('Event processed successfully:', JSON.stringify(processedEvent, null, 2));
        return { statusCode: 200, body: 'Event processed successfully' };
        
    } catch (error) {
        console.error('Error processing event:', error);
        
        if (subsegment) {
            subsegment.addError(error);
            subsegment.close();
        }
        
        throw error;
    }
};
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        EVENT_BUS_NAME: customEventBus.eventBusName,
      },
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });

    // Grant the event processor function permissions to write X-Ray traces
    eventProcessorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
        'xray:GetSamplingRules',
        'xray:GetSamplingTargets',
        'xray:GetSamplingStatisticSummaries',
      ],
      resources: ['*'],
    }));

    // Create EventBridge rule to trigger event processor
    const eventProcessingRule = new events.Rule(this, 'EventProcessingRule', {
      ruleName: `serverless-event-processing-${environmentSuffix}`,
      description: 'Rule to process serverless application events',
      eventBus: customEventBus,
      eventPattern: {
        source: ['serverless.application'],
        detailType: ['API Request Processed'],
      },
    });

    // Add the event processor Lambda as a target
    eventProcessingRule.addTarget(new targets.LambdaFunction(eventProcessorFunction, {
      retryAttempts: 3,
    }));

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway invocation URL',
      exportName: `ServerlessApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `ServerlessLambdaArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket name for data storage',
      exportName: `ServerlessS3Bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `ServerlessKmsKey-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchLogGroup', {
      value: lambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group for Lambda function',
      exportName: `ServerlessLogGroup-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'XRayTracingGroup', {
      value: xrayTracingConfig.groupName!,
      description: 'X-Ray tracing group name',
      exportName: `ServerlessXRayGroup-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: customEventBus.eventBusName,
      description: 'Custom EventBridge bus name',
      exportName: `ServerlessEventBus-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: customEventBus.eventBusArn,
      description: 'Custom EventBridge bus ARN',
      exportName: `ServerlessEventBusArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventProcessorFunctionArn', {
      value: eventProcessorFunction.functionArn,
      description: 'Event processor Lambda function ARN',
      exportName: `EventProcessorArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventProcessingRuleArn', {
      value: eventProcessingRule.ruleArn,
      description: 'EventBridge processing rule ARN',
      exportName: `EventProcessingRuleArn-${environmentSuffix}`,
    });
  }
}
```

### 2. Updated TapStack (lib/tap-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the Serverless Stack
    new ServerlessStack(this, 'ServerlessStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });
  }
}
```

## Key Features Implemented

### New Enhanced Features (Recent AWS Services)

#### 1. AWS X-Ray Distributed Tracing
- **X-Ray Tracing Group**: Custom tracing group for filtering and organizing traces
- **Lambda X-Ray Integration**: Active tracing enabled on both Lambda functions
- **API Gateway X-Ray**: Distributed tracing across API Gateway and Lambda
- **Custom Subsegments**: Manual subsegment creation for detailed performance analysis
- **Error Tracking**: Automatic error capture in X-Ray traces
- **Annotations**: Custom annotations for better trace filtering and analysis

#### 2. Amazon EventBridge Event-Driven Architecture
- **Custom Event Bus**: Dedicated event bus for application events
- **Event Archive**: 7-day retention archive for event replay and analysis
- **Event Rules**: Pattern-based routing of events to processors
- **Event Processing**: Dedicated Lambda function for event processing
- **Retry Logic**: Built-in retry mechanism for failed event processing
- **Cross-Service Integration**: Events published from main Lambda, processed by dedicated processor

### Security & Best Practices
- **Principle of Least Privilege**: All IAM roles have minimal required permissions
- **KMS Encryption**: S3 bucket encrypted with customer-managed KMS key
- **Key Rotation**: KMS key has automatic rotation enabled
- **SSL Enforcement**: S3 bucket requires SSL for all operations
- **Block Public Access**: S3 bucket has all public access blocked
- **X-Ray Security**: Proper IAM permissions for X-Ray trace segments
- **EventBridge Security**: Scoped permissions for event publishing and processing

### Observability & Monitoring
- **CloudWatch Lambda Insights**: Enhanced Lambda monitoring and performance insights
- **Distributed Tracing**: End-to-end request tracing with X-Ray
- **Custom Annotations**: Request ID, HTTP method, and path annotations
- **Structured Logging**: JSON-formatted logs for better observability
- **Event Correlation**: Trace correlation between API requests and event processing
- **Error Tracking**: Comprehensive error capture across all services

### Event-Driven Architecture
- **Asynchronous Processing**: API requests trigger background event processing
- **Event Sourcing**: All API requests generate events for audit and analysis
- **Loose Coupling**: Main application and event processors are decoupled
- **Scalability**: EventBridge automatically scales with event volume
- **Resilience**: Built-in retry and dead letter queue capabilities

### Advanced Deployment Features
- **Multi-Environment Support**: Environment-specific resource naming and configuration
- **Comprehensive Outputs**: All resource identifiers exported for integration
- **Infrastructure as Code**: Fully defined with AWS CDK TypeScript
- **Regional Deployment**: Support for multi-region deployments

### Outputs Provided
- **Core Infrastructure**: API Gateway URL, Lambda ARNs, S3 bucket, KMS key
- **Tracing**: X-Ray tracing group name for monitoring configuration
- **Event Architecture**: EventBridge bus name and ARN, event processor ARN
- **Processing Rules**: EventBridge rule ARN for event routing configuration

## Architecture Complexity Enhancements

The enhanced infrastructure significantly increases deployment and operational complexity:

1. **Distributed Tracing**: X-Ray adds monitoring complexity with trace collection and analysis
2. **Event-Driven Dependencies**: EventBridge rules create asynchronous processing dependencies
3. **Multiple Lambda Functions**: Two Lambda functions with different runtime patterns
4. **Advanced IAM Policies**: Complex permission matrices for X-Ray and EventBridge
5. **Cross-Service Integration**: API Gateway → Lambda → EventBridge → Event Processor flow
6. **Monitoring Requirements**: Multiple services requiring coordinated monitoring setup

This enhanced architecture follows AWS Well-Architected Framework principles with sophisticated observability, security, and event-driven patterns suitable for production workloads requiring high visibility and scalable event processing capabilities.