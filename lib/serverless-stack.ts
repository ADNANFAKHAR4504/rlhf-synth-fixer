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

// LocalStack detection
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');

interface ServerlessStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class ServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ServerlessStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create KMS key for S3 bucket encryption
    const kmsKey = new kms.Key(this, 'ServerlessDataKey', {
      description: `KMS key for srv data encryption - ${environmentSuffix}`,
      enableKeyRotation: !isLocalStack, // Disable key rotation for LocalStack
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create alias for the KMS key
    new kms.Alias(this, 'ServerlessDataKeyAlias', {
      aliasName: `alias/srv-data-${environmentSuffix}`,
      targetKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create X-Ray tracing group for distributed tracing (only if not LocalStack)
    const xrayTracingConfig = isLocalStack ? null : new xray.CfnGroup(this, 'ServerlessXRayGroup', {
      groupName: `srv-trace-${environmentSuffix}`,
      filterExpression: `service("srv-handler-${environmentSuffix}")`,
    });

    // Create custom EventBridge bus for event-driven architecture
    const customEventBus = new events.EventBus(this, 'ServerlessEventBus', {
      eventBusName: `srv-events-${environmentSuffix}`,
      description: 'Custom event bus for serverless application events',
    });

    // Create an archive for EventBridge events
    new events.Archive(this, 'ServerlessEventArchive', {
      sourceEventBus: customEventBus,
      archiveName: `srv-archive-${environmentSuffix}`,
      description: 'Archive for serverless application events',
      retention: cdk.Duration.days(7),
      eventPattern: {
        source: ['serverless.application'],
      },
    });

    // Create S3 bucket with KMS encryption using dual-layer encryption (DSSE-KMS)
    // Note: autoDeleteObjects disabled for LocalStack to avoid custom resource handler asset upload issue
    const dataBucket = new s3.Bucket(this, 'ServerlessDataBucket', {
      bucketName: `srv-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: !isLocalStack, // Disable SSL enforcement for LocalStack
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isLocalStack, // Disable autoDeleteObjects for LocalStack (avoids custom resource asset upload)
    });

    // Create CloudWatch Log Group for Lambda function
    const lambdaLogGroup = new logs.LogGroup(this, 'ServerlessLambdaLogGroup', {
      logGroupName: `/aws/lambda/srv-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for Lambda function with minimal permissions
    // Note: Not using AWS managed policies for LocalStack compatibility
    const lambdaRole = new iam.Role(this, 'ServerlessLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        BasicExecution: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
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

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'ServerlessHandler', {
      functionName: `srv-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
    console.log('Lambda function invoked with event:', JSON.stringify(event, null, 2));
    
    const timestamp = new Date().toISOString();
    const requestId = event.requestContext ? event.requestContext.requestId : 'unknown';
    
    try {
        // Log request details
        console.log('Request ID:', requestId, 'Timestamp:', timestamp, 'Method:', event.httpMethod, 'Path:', event.path);
        
        // Create event detail for EventBridge (would be sent if SDK was available)
        const eventDetail = {
            requestId: requestId,
            timestamp: timestamp,
            method: event.httpMethod || 'UNKNOWN',
            path: event.path || '/',
            userAgent: event.headers ? event.headers['User-Agent'] : 'unknown',
            sourceIp: event.requestContext && event.requestContext.identity ? event.requestContext.identity.sourceIp : 'unknown'
        };
        
        console.log('Event detail prepared for EventBridge:', JSON.stringify(eventDetail, null, 2));
        
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
        
        // Log successful response
        console.log('Response:', JSON.stringify(response, null, 2));
        
        return response;
    } catch (error) {
        console.error('Error in Lambda function:', error);
        
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
        XRAY_TRACING_GROUP: xrayTracingConfig?.groupName || 'not-available',
      },
      logGroup: lambdaLogGroup,
      insightsVersion: isLocalStack ? undefined : lambda.LambdaInsightsVersion.VERSION_1_0_229_0, // Disable Lambda Insights for LocalStack
      tracing: isLocalStack ? lambda.Tracing.DISABLED : lambda.Tracing.ACTIVE, // Disable X-Ray tracing for LocalStack
    });

    // Create API Gateway REST API with X-Ray tracing
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `Serverless API - ${environmentSuffix}`,
      description:
        'API Gateway for serverless Lambda function with X-Ray tracing',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: !isLocalStack, // Disable X-Ray tracing for LocalStack
      },
      cloudWatchRole: !isLocalStack, // Disable for LocalStack (uses AWS managed policy)
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
exports.handler = async (event) => {
    console.log('Event processor invoked with event:', JSON.stringify(event, null, 2));
    
    try {
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
        
        console.log('Event processed successfully:', JSON.stringify(processedEvent, null, 2));
        return { statusCode: 200, body: 'Event processed successfully' };
        
    } catch (error) {
        console.error('Error processing event:', error);
        throw error;
    }
};
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        EVENT_BUS_NAME: customEventBus.eventBusName,
      },
      tracing: isLocalStack ? lambda.Tracing.DISABLED : lambda.Tracing.ACTIVE, // Disable X-Ray tracing for LocalStack
    });

    // Grant the event processor function permissions to write X-Ray traces
    eventProcessorFunction.addToRolePolicy(
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
      })
    );

    // Create EventBridge rule to trigger event processor
    const eventProcessingRule = new events.Rule(this, 'EventProcessingRule', {
      ruleName: `srv-event-proc-${environmentSuffix}`,
      description: 'Rule to process serverless application events',
      eventBus: customEventBus,
      eventPattern: {
        source: ['serverless.application'],
        detailType: ['API Request Processed'],
      },
    });

    // Add the event processor Lambda as a target
    eventProcessingRule.addTarget(
      new targets.LambdaFunction(eventProcessorFunction, {
        retryAttempts: 3,
      })
    );

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

    // X-Ray output only if not LocalStack
    if (xrayTracingConfig) {
      new cdk.CfnOutput(this, 'XRayTracingGroup', {
        value: xrayTracingConfig.groupName!,
        description: 'X-Ray tracing group name',
        exportName: `ServerlessXRayGroup-${environmentSuffix}`,
      });
    }

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
