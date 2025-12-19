### Reasoning Trace

---

The user wants a serverless data processing pipeline on AWS with the following requirements:

1. Region: us-east-1
2. Components:
   - S3 bucket (encrypted with AES-256) for incoming data files
   - Lambda functions (5-minute timeout) to process data
   - API Gateway to trigger Lambda functions
   - SNS for notifications when processing is complete
   - CloudWatch for logging

3. Security requirements:
   - No public access to S3 or Lambda
   - IAM roles for access control
   - VPC endpoints for added security

4. Performance:
   - Handle 100,000 requests/month
   - Consider Lambda SnapStart for Java or response streaming

5. Additional:
   - All resources tagged with Environment: Production
   - Complete infrastructure as code using AWS CDK with TypeScript

I'll create a comprehensive CDK stack that includes:

- S3 bucket with encryption and no public access
- Lambda function with appropriate IAM roles
- API Gateway with Lambda integration
- SNS topic for notifications
- CloudWatch logging
- VPC and VPC endpoints for enhanced security
- Proper tagging

Let me structure this properly with TypeScript and AWS CDK v2.

### Answer

---

I'll help you build a comprehensive serverless data processing pipeline using AWS CDK with TypeScript. This solution will include all the security, performance, and monitoring features you've requested.

## Project Structure

First, let's set up the project structure:

```typescript
// package.json
{
  "name": "serverless-data-pipeline",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy": "cdk deploy --all"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/node": "^20.5.0",
    "aws-cdk": "^2.100.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "aws-sdk": "^2.1450.0",
    "constructs": "^10.2.69"
  }
}
```

## CDK Stack Implementation

```typescript
// lib/serverless-data-pipeline-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ServerlessDataPipelineStackProps extends cdk.StackProps {
  notificationEmail?: string;
}

export class ServerlessDataPipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ServerlessDataPipelineStackProps
  ) {
    super(scope, id, props);

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');

    // Create VPC for enhanced security
    const vpc = new ec2.Vpc(this, 'DataPipelineVPC', {
      maxAzs: 2,
      natGateways: 0, // No NAT gateways needed for serverless
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create VPC endpoints for AWS services
    vpc.addInterfaceEndpoint('S3Endpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.S3,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    vpc.addInterfaceEndpoint('SNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    // Create S3 bucket with encryption
    const dataBucket = new s3.Bucket(this, 'DataProcessingBucket', {
      bucketName: `data-pipeline-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Remove for production
    });

    // Create SNS topic for notifications
    const notificationTopic = new sns.Topic(
      this,
      'ProcessingNotificationTopic',
      {
        topicName: 'data-processing-notifications',
        displayName: 'Data Processing Notifications',
      }
    );

    // Add email subscription if provided
    if (props.notificationEmail) {
      notificationTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Create CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'DataProcessingLogs', {
      logGroupName: '/aws/lambda/data-processing',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda execution role with minimal permissions
    const lambdaRole = new iam.Role(this, 'DataProcessingLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        DataProcessingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [dataBucket.arnForObjects('*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [notificationTopic.topicArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Create Lambda layer for shared dependencies (optional)
    const dependencyLayer = new lambda.LayerVersion(this, 'DependencyLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../layers/dependencies')
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared dependencies for data processing',
    });

    // Create main processing Lambda function
    const dataProcessor = new lambda.Function(this, 'DataProcessor', {
      functionName: 'data-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda/data-processor')
      ),
      timeout: cdk.Duration.minutes(5),
      memorySize: 3008, // Maximum memory for better performance
      role: lambdaRole,
      layers: [dependencyLayer],
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
        NODE_OPTIONS: '--enable-source-maps', // Better debugging
      },
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      logRetention: logs.RetentionDays.ONE_MONTH,
      reservedConcurrentExecutions: 100, // Limit concurrent executions
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'DataProcessingAPI', {
      restApiName: 'Data Processing API',
      description: 'API for triggering data processing',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false, // Don't log request/response data
        metricsEnabled: true,
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.NO_ORIGINS, // No CORS - internal use only
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(this.account)],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/*/*'],
          }),
        ],
      }),
    });

    // Create API resource and method
    const processResource = api.root.addResource('process');

    // Create request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: api,
        requestValidatorName: 'request-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Define request model
    const requestModel = api.addModel('ProcessRequestModel', {
      contentType: 'application/json',
      modelName: 'ProcessRequest',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'processRequest',
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          fileName: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
          },
          processingType: {
            type: apigateway.JsonSchemaType.STRING,
            enum: ['standard', 'priority', 'batch'],
          },
        },
        required: ['fileName', 'processingType'],
      },
    });

    // Add POST method with Lambda integration
    processResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(dataProcessor, {
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      }),
      {
        requestValidator,
        requestModels: {
          'application/json': requestModel,
        },
        authorizationType: apigateway.AuthorizationType.IAM,
      }
    );

    // Create S3 trigger Lambda (for processing files on upload)
    const s3TriggerFunction = new lambda.Function(this, 'S3TriggerFunction', {
      functionName: 's3-trigger-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/s3-trigger')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      environment: {
        PROCESSOR_FUNCTION_NAME: dataProcessor.functionName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
    });

    // Grant S3 trigger function permission to invoke main processor
    dataProcessor.grantInvoke(s3TriggerFunction);

    // Add S3 event notification
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(s3TriggerFunction),
      { suffix: '.json' }
    );

    // Create CloudWatch dashboard
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      'DataProcessingDashboard',
      {
        dashboardName: 'data-processing-pipeline',
        widgets: [
          [
            new cdk.aws_cloudwatch.GraphWidget({
              title: 'Lambda Invocations',
              left: [dataProcessor.metricInvocations()],
              right: [dataProcessor.metricErrors()],
            }),
            new cdk.aws_cloudwatch.GraphWidget({
              title: 'Lambda Duration',
              left: [dataProcessor.metricDuration()],
            }),
          ],
          [
            new cdk.aws_cloudwatch.GraphWidget({
              title: 'API Gateway Requests',
              left: [
                new cdk.aws_cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Count',
                  dimensionsMap: {
                    ApiName: api.restApiName,
                  },
                }),
              ],
            }),
          ],
        ],
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket name for data uploads',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN for notifications',
    });
  }
}
```

## Lambda Function Implementation

### Main Data Processor

```typescript
// lambda/data-processor/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Readable } from 'stream';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const bucketName = process.env.BUCKET_NAME!;
const snsTopicArn = process.env.SNS_TOPIC_ARN!;

interface ProcessRequest {
  fileName: string;
  processingType: 'standard' | 'priority' | 'batch';
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const request: ProcessRequest = JSON.parse(event.body || '{}');

    // Validate request
    if (!request.fileName || !request.processingType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Process the data
    const result = await processData(request);

    // Send notification
    await sendNotification(request.fileName, result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processing completed successfully',
        result,
      }),
    };
  } catch (error) {
    console.error('Processing error:', error);

    // Send error notification
    await sendErrorNotification(error as Error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function processData(request: ProcessRequest): Promise<any> {
  const { fileName, processingType } = request;

  try {
    // Get object from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const response = await s3Client.send(getCommand);

    // Read the data
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

    // Process based on type
    let processedData;
    switch (processingType) {
      case 'priority':
        processedData = await processPriority(data);
        break;
      case 'batch':
        processedData = await processBatch(data);
        break;
      default:
        processedData = await processStandard(data);
    }

    // Save processed data
    const outputKey = `processed/${fileName}`;
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: outputKey,
      Body: JSON.stringify(processedData),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
      Metadata: {
        processedAt: new Date().toISOString(),
        processingType,
      },
    });

    await s3Client.send(putCommand);

    return {
      outputKey,
      recordsProcessed: processedData.length,
      processingType,
    };
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
}

async function processStandard(data: any): Promise<any> {
  // Implement standard processing logic
  return data.map((item: any) => ({
    ...item,
    processed: true,
    timestamp: new Date().toISOString(),
  }));
}

async function processPriority(data: any): Promise<any> {
  // Implement priority processing logic
  return data.map((item: any) => ({
    ...item,
    processed: true,
    priority: true,
    timestamp: new Date().toISOString(),
  }));
}

async function processBatch(data: any): Promise<any> {
  // Implement batch processing logic
  const batchSize = 100;
  const results = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const processedBatch = batch.map((item: any) => ({
      ...item,
      processed: true,
      batchId: Math.floor(i / batchSize),
      timestamp: new Date().toISOString(),
    }));
    results.push(...processedBatch);
  }

  return results;
}

async function sendNotification(fileName: string, result: any): Promise<void> {
  const message = {
    fileName,
    result,
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
  };

  const command = new PublishCommand({
    TopicArn: snsTopicArn,
    Subject: 'Data Processing Completed',
    Message: JSON.stringify(message, null, 2),
    MessageAttributes: {
      fileName: {
        DataType: 'String',
        StringValue: fileName,
      },
      status: {
        DataType: 'String',
        StringValue: 'SUCCESS',
      },
    },
  });

  await snsClient.send(command);
}

async function sendErrorNotification(error: Error): Promise<void> {
  const message = {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    status: 'ERROR',
  };

  const command = new PublishCommand({
    TopicArn: snsTopicArn,
    Subject: 'Data Processing Failed',
    Message: JSON.stringify(message, null, 2),
    MessageAttributes: {
      status: {
        DataType: 'String',
        StringValue: 'ERROR',
      },
    },
  });

  try {
    await snsClient.send(command);
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
  }
}
```

### S3 Trigger Function

```typescript
// lambda/s3-trigger/index.ts
import { S3Event, Context } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
const processorFunctionName = process.env.PROCESSOR_FUNCTION_NAME!;

export const handler = async (
  event: S3Event,
  context: Context
): Promise<void> => {
  console.log('S3 event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName.startsWith('ObjectCreated:')) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' ')
      );

      console.log(
        `Processing new file: ${objectKey} from bucket: ${bucketName}`
      );

      try {
        // Determine processing type based on file path or metadata
        const processingType = determineProcessingType(objectKey);

        // Invoke main processor function
        const payload = {
          body: JSON.stringify({
            fileName: objectKey,
            processingType,
          }),
        };

        const command = new InvokeCommand({
          FunctionName: processorFunctionName,
          InvocationType: 'Event', // Async invocation
          Payload: JSON.stringify(payload),
        });

        await lambdaClient.send(command);

        console.log(`Successfully triggered processing for ${objectKey}`);
      } catch (error) {
        console.error(`Error processing ${objectKey}:`, error);
        throw error;
      }
    }
  }
};

function determineProcessingType(
  objectKey: string
): 'standard' | 'priority' | 'batch' {
  if (objectKey.includes('/priority/')) {
    return 'priority';
  } else if (objectKey.includes('/batch/')) {
    return 'batch';
  }
  return 'standard';
}
```

## App Entry Point

```typescript
// bin/app.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessDataPipelineStack } from '../lib/serverless-data-pipeline-stack';

const app = new cdk.App();

new ServerlessDataPipelineStack(app, 'ServerlessDataPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  notificationEmail: process.env.NOTIFICATION_EMAIL, // Optional: Set this env var for email notifications
  description: 'Serverless data processing pipeline with enhanced security',
});
```

## CDK Configuration

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": ["README.md", "cdk*.json", "**/*.d.ts", "node_modules", "test"]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true
  }
}
```

## Deployment Instructions

1. **Install dependencies:**

```bash
npm install
```

2. **Build the TypeScript code:**

```bash
npm run build
```

3. **Deploy the stack:**

```bash
# First time deployment
npx cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1

# Deploy the stack
npm run deploy

# Or with email notifications
NOTIFICATION_EMAIL=your-email@example.com npm run deploy
```

## Key Features Implemented

1. **Security:**
   - VPC with isolated subnets
   - VPC endpoints for S3, SNS, and CloudWatch
   - No public access to S3 or Lambda
   - IAM roles with minimal permissions
   - API Gateway with IAM authentication

2. **Performance:**
   - Lambda with 3GB memory for optimal performance
   - Reserved concurrency to handle load
   - Response streaming capability ready (for Node.js 18.x)

3. **Monitoring:**
   - CloudWatch logs with retention
   - X-Ray tracing enabled
   - CloudWatch dashboard for metrics
   - SNS notifications for success/failure

4. **Scalability:**
   - Handles 100,000+ requests/month
   - API Gateway throttling configured
   - S3 lifecycle policies for cost optimization

5. **Best Practices:**
   - All resources tagged for cost tracking
   - Structured logging
   - Error handling and notifications
   - Request validation
   - Modular architecture

This solution provides a robust, secure, and scalable serverless data processing pipeline that meets all your requirements.
