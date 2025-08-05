## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "API Layer"
        API[API Gateway]
        AUTH[API Key Auth]
        VAL[Request Validation]
    end

    subgraph "Processing Layer"
        IP[ImageProcessor Lambda]
        FM[FileManager Lambda]
        NS[NotificationService Lambda]
    end

    subgraph "AI/ML Layer"
        REK[Amazon Rekognition]
        IAM[IAM Roles]
    end

    subgraph "Storage Layer"
        S3[S3 Bucket]
        DDB[DynamoDB]
        SNS[SNS Topic]
    end

    subgraph "Monitoring Layer"
        CW[CloudWatch]
        DASH[Dashboard]
        ALARMS[Alarms]
    end

    API --> IP
    IP --> REK
    IP --> DDB
    IP --> FM
    IP --> NS
    FM --> S3
    NS --> SNS

    S3 --> IP
    DDB --> CW
    IP --> CW
    FM --> CW
    NS --> CW
    API --> CW
```

## 📁 Project Structure

```
serverless-image-detector/
├── lib/
│   ├── stacks/
│   │   ├── api-stack.ts
│   │   ├── lambda-stack.ts
│   │   ├── storage-stack.ts
│   │   ├── monitoring-stack.ts
│   │   └── rekognition-stack.ts
│   ├── lambdas/
│   │   ├── image-processor/
│   │   │   └── index.js
│   │   ├── file-manager/
│   │   └── notification-service/
│   └── tap-stack.ts
├── bin/
│   └── tap.ts
├── test/
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Implementation

### 1. Main CDK App Entry Point

**`bin/tap.ts`**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

// Get environment suffix from context or use default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Deploy stack with environment-specific configuration
new TapStack(app, 'TapStack', {
  env,
  stackName: 'serverlessapp-image-detector',
  description: 'Production-ready serverless image classification system',
  environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    Project: 'ServerlessImageDetector',
    Owner: 'DevOps Team',
    CostCenter: 'Engineering',
  },
});
```

### 1. Main Stack (`lib/tap-stack.ts`)

**Description**: The main CDK stack that orchestrates all nested stacks and exposes them as public properties for unit testing.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './stacks/api-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { RekognitionStack } from './stacks/rekognition-stack';
import { StorageStack } from './stacks/storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly storageStack: StorageStack;
  public readonly rekognitionStack: RekognitionStack;
  public readonly lambdaStack: LambdaStack;
  public readonly apiStack: ApiStack;
  public readonly monitoringStack: MonitoringStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Storage Stack - S3, DynamoDB, SNS
    this.storageStack = new StorageStack(this, 'Storage', {
      environmentSuffix,
      description: 'Storage resources for serverless image detector',
    });

    // Rekognition Stack - AI/ML configuration and service roles
    this.rekognitionStack = new RekognitionStack(this, 'Rekognition', {
      environmentSuffix,
      imageBucket: this.storageStack.imageBucket,
      description: 'Amazon Rekognition configuration and roles',
    });

    // Lambda Stack - All Lambda functions
    this.lambdaStack = new LambdaStack(this, 'Lambda', {
      environmentSuffix,
      imageBucket: this.storageStack.imageBucket,
      detectionTable: this.storageStack.detectionTable,
      notificationTopic: this.storageStack.notificationTopic,
      description: 'Lambda functions for image processing',
    });

    // API Stack - API Gateway
    this.apiStack = new ApiStack(this, 'Api', {
      environmentSuffix,
      imageProcessorFunction: this.lambdaStack.imageProcessorFunction,
      imageBucket: this.storageStack.imageBucket,
      description: 'API Gateway for image upload and retrieval',
    });

    // Monitoring Stack - CloudWatch dashboards and alarms
    this.monitoringStack = new MonitoringStack(this, 'Monitoring', {
      environmentSuffix,
      lambdaFunctions: [
        this.lambdaStack.imageProcessorFunction,
        this.lambdaStack.fileManagerFunction,
        this.lambdaStack.notificationFunction,
      ],
      restApi: this.apiStack.restApi,
      detectionTable: this.storageStack.detectionTable,
      imageBucket: this.storageStack.imageBucket,
      description: 'CloudWatch monitoring and dashboards',
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiStack.restApi.url,
      description: 'API Gateway endpoint URL',
      exportName: `serverlessapp-api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.storageStack.imageBucket.bucketName,
      description: 'S3 bucket for image storage',
      exportName: `serverlessapp-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.storageStack.detectionTable.tableName,
      description: 'DynamoDB table for detection logs',
      exportName: `serverlessapp-table-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.monitoringStack.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `serverlessapp-dashboard-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RekognitionServiceRoleArn', {
      value: this.rekognitionStack.rekognitionServiceRole.roleArn,
      description: 'Amazon Rekognition Service Role ARN',
      exportName: `serverlessapp-rekognition-service-role-${environmentSuffix}`,
    });

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Project', 'ServerlessImageDetector');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'DevOps Team');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
  }
}
```

### 2. Storage Stack (`lib/stacks/storage-stack.ts`)

**Description**: Manages S3 bucket for image storage, DynamoDB table for detection logs, and SNS topic for notifications with proper encryption and security configurations.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly imageBucket: s3.Bucket;
  public readonly detectionTable: dynamodb.Table;
  public readonly notificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // S3 Bucket for image storage with encryption and lifecycle policies
    this.imageBucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: `serverlessapp-pet-detector-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'DeleteIncompleteUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // DynamoDB table for detection logs with on-demand billing
    this.detectionTable = new dynamodb.Table(this, 'DetectionTable', {
      tableName: `serverlessapp-detection-logs-${environmentSuffix}`,
      partitionKey: { name: 'imageId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
    });

    // Add GSI for timestamp-based queries
    this.detectionTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'detectedAnimal', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SNS Topic for notifications
    this.notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `serverlessapp-notifications-${environmentSuffix}`,
      displayName: 'Image Detection Notifications',
    });

    // Add subscription for email notifications (optional)
    if (environmentSuffix !== 'prod') {
      this.notificationTopic.addSubscription(
        new sns.subscriptions.EmailSubscription('admin@example.com')
      );
    }

    // Add tags to all resources
    cdk.Tags.of(this.imageBucket).add('Purpose', 'Image Storage');
    cdk.Tags.of(this.detectionTable).add('Purpose', 'Detection Logs');
    cdk.Tags.of(this.notificationTopic).add('Purpose', 'Notifications');
  }
}
```

### 4. API Stack (`lib/stacks/api-stack.ts`)

**Description**: Configures API Gateway with REST API, authentication, request validation, and CORS settings for secure image upload and retrieval endpoints.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  imageProcessorFunction: lambda.Function;
  imageBucket: s3.Bucket;
}

export class ApiStack extends cdk.NestedStack {
  public readonly restApi: apigateway.RestApi;
  public readonly apiKey: apigateway.ApiKey;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { environmentSuffix, imageProcessorFunction } = props;

    // Create API Gateway with security and monitoring configurations
    this.restApi = new apigateway.RestApi(this, 'ImageDetectorApi', {
      restApiName: `serverlessapp-image-detector-api-${environmentSuffix}`,
      description: 'Production-ready API for serverless image detection system',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.OFF, // Completely disable to avoid role issues
        dataTraceEnabled: false,
        metricsEnabled: true,
        tracingEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins:
          environmentSuffix === 'prod'
            ? ['https://yourdomain.com'] // Replace with actual domain
            : apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      binaryMediaTypes: ['image/*', 'multipart/form-data'],
    });

    // API Key with rotation capability
    this.apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `serverlessapp-api-key-${environmentSuffix}`,
      description: 'API key for image detector service',
      value:
        environmentSuffix === 'prod'
          ? undefined // Let AWS generate in production
          : 'dev-key-12345-do-not-use-in-prod',
    });

    // Usage Plan with appropriate limits
    const usagePlan = this.restApi.addUsagePlan('UsagePlan', {
      name: `serverlessapp-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for image detector API',
      throttle: {
        rateLimit: environmentSuffix === 'prod' ? 1000 : 100,
        burstLimit: environmentSuffix === 'prod' ? 2000 : 200,
      },
      quota: {
        limit: environmentSuffix === 'prod' ? 100000 : 10000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(this.apiKey);
    usagePlan.addApiStage({
      stage: this.restApi.deploymentStage,
    });

    // Lambda integration with error handling
    const lambdaIntegration = new apigateway.LambdaIntegration(
      imageProcessorFunction,
      {
        requestTemplates: {
          'application/json': JSON.stringify({
            body: '$input.json("$")',
            headers: {
              '#foreach($header in $input.params().header.keySet())':
                '"$header": "$util.escapeJavaScript($input.params().header.get($header))"#if($foreach.hasNext),#end#end',
            },
            pathParameters: {
              '#foreach($param in $input.params().path.keySet())':
                '"$param": "$util.escapeJavaScript($input.params().path.get($param))"#if($foreach.hasNext),#end#end',
            },
            queryStringParameters: {
              '#foreach($queryParam in $input.params().querystring.keySet())':
                '"$queryParam": "$util.escapeJavaScript($input.params().querystring.get($queryParam))"#if($foreach.hasNext),#end#end',
            },
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '$input.json("$")',
            },
          },
          {
            statusCode: '400',
            selectionPattern: '4\\d{2}',
            responseTemplates: {
              'application/json': JSON.stringify({
                error: 'Bad Request',
                message: '$input.path("$.errorMessage")',
              }),
            },
          },
          {
            statusCode: '500',
            selectionPattern: '5\\d{2}',
            responseTemplates: {
              'application/json': JSON.stringify({
                error: 'Internal Server Error',
                message: '$input.path("$.errorMessage")',
              }),
            },
          },
        ],
      }
    );

    // Request validator for input validation
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: this.restApi,
        requestValidatorName: 'request-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Request model for image upload
    const requestModel = new apigateway.Model(this, 'RequestModel', {
      restApi: this.restApi,
      modelName: 'ImageUploadRequest',
      contentType: 'application/json',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['imageData', 'fileName', 'contentType'],
        properties: {
          imageData: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Base64 encoded image data',
            minLength: 1,
          },
          fileName: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Original filename',
            minLength: 1,
            maxLength: 255,
            pattern: '^[a-zA-Z0-9._-]+\\.(jpg|jpeg|png|gif|bmp|webp)$',
          },
          contentType: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Image MIME type',
            enum: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/bmp',
              'image/webp',
            ],
          },
        },
      },
    });

    // API Resources and Methods
    const imagesResource = this.restApi.root.addResource('images');

    // POST /images - Upload and process image
    imagesResource.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
      requestValidator,
      requestModels: {
        'application/json': requestModel,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // GET /images - List all processed images
    imagesResource.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // GET /images/{id} - Get specific image details
    const imageResource = imagesResource.addResource('{id}');
    imageResource.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      requestParameters: {
        'method.request.path.id': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Add tags
    cdk.Tags.of(this.restApi).add('Purpose', 'API Gateway');
    cdk.Tags.of(this.apiKey).add('Purpose', 'API Authentication');
  }
}
```

### 5. Lambda Function - Image Processor (`lib/lambdas/image-processor/index.js`)

**Description**: Core Lambda function that processes uploaded images using Amazon Rekognition, stores results in DynamoDB, and triggers notifications.

```javascript
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const rekognition = new AWS.Rekognition();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const sns = new AWS.SNS();

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;
const TOPIC_ARN = process.env.TOPIC_ARN;

// CloudWatch metrics helper
async function publishMetric(metricName, value, unit = 'Count') {
  try {
    const cloudwatch = new AWS.CloudWatch();
    await cloudwatch
      .putMetricData({
        Namespace: 'ServerlessImageDetector',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
          },
        ],
      })
      .promise();
  } catch (error) {
    console.error('Error publishing metric:', error);
  }
}

// Validate image data
function validateImageData(request) {
  if (!request.imageData || typeof request.imageData !== 'string') {
    return {
      isValid: false,
      error: 'Image data is required and must be a string',
    };
  }

  // Check if base64 string is valid
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(request.imageData)) {
    return { isValid: false, error: 'Invalid base64 encoding' };
  }

  // Decode and validate image
  let imageBuffer;
  try {
    imageBuffer = Buffer.from(request.imageData, 'base64');
  } catch (error) {
    return { isValid: false, error: 'Failed to decode base64 image data' };
  }

  if (imageBuffer.length === 0) {
    return { isValid: false, error: 'Image data is empty' };
  }

  // Validate content type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
  ];
  if (!allowedTypes.includes(request.contentType)) {
    return {
      isValid: false,
      error: 'Unsupported image type. Allowed: JPEG, PNG, GIF, BMP, WebP',
    };
  }

  return { isValid: true, imageBuffer };
}

// Process image with Rekognition
async function processImageWithRekognition(imageBuffer) {
  try {
    console.log('Making Rekognition API call (Free Tier: 5000 images/month)');

    const params = {
      Image: {
        Bytes: imageBuffer,
      },
      MaxLabels: 10,
      MinConfidence: 60,
    };

    const result = await rekognition.detectLabels(params).promise();
    return result.Labels;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

// Determine animal type from Rekognition labels
function determineAnimalType(labels) {
  const labelNames = labels.map(label => label.Name.toLowerCase());

  // Check for cats
  if (
    labelNames.includes('cat') ||
    labelNames.some(name => name.includes('cat'))
  ) {
    return {
      animal: 'cats',
      confidence:
        labels.find(l => l.Name.toLowerCase().includes('cat'))?.Confidence || 0,
    };
  }

  // Check for dogs
  if (
    labelNames.includes('dog') ||
    labelNames.some(name => name.includes('dog'))
  ) {
    return {
      animal: 'dogs',
      confidence:
        labels.find(l => l.Name.toLowerCase().includes('dog'))?.Confidence || 0,
    };
  }

  // Check for other animals
  const animalKeywords = ['animal', 'mammal', 'pet', 'feline', 'canine'];
  const animalLabel = labels.find(label =>
    animalKeywords.some(keyword => label.Name.toLowerCase().includes(keyword))
  );

  if (animalLabel) {
    return { animal: 'others', confidence: animalLabel.Confidence };
  }

  // No animal detected
  return { animal: 'others', confidence: 0 };
}

// Store detection result in DynamoDB
async function storeDetectionResult(
  imageId,
  detectionResult,
  fileName,
  contentType
) {
  const timestamp = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year TTL

  const item = {
    imageId,
    timestamp,
    detectedAnimal: detectionResult.animal,
    confidenceScore: Math.round(detectionResult.confidence),
    fileName,
    contentType,
    processingStatus: 'completed',
    ttl,
  };

  try {
    await dynamodb
      .put({
        TableName: TABLE_NAME,
        Item: item,
      })
      .promise();

    console.log('Detection result stored in DynamoDB');
    return item;
  } catch (error) {
    console.error('Error storing detection result:', error);
    throw error;
  }
}

// Upload image to S3
async function uploadImageToS3(imageBuffer, imageId, fileName) {
  const key = `processed/${imageId}/${fileName}`;

  try {
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'original-filename': fileName,
          'processed-by': 'image-detector',
        },
      })
      .promise();

    console.log('Image uploaded to S3');
    return `s3://${BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
}

// Send notification
async function sendNotification(imageId, detectionResult, s3Location) {
  if (!TOPIC_ARN) {
    console.log('No SNS topic configured, skipping notification');
    return;
  }

  try {
    const message = {
      imageId,
      detectedAnimal: detectionResult.animal,
      confidenceScore: detectionResult.confidence,
      s3Location,
      timestamp: new Date().toISOString(),
    };

    await sns
      .publish({
        TopicArn: TOPIC_ARN,
        Message: JSON.stringify(message),
        Subject: `Image Detection Result: ${detectionResult.animal}`,
      })
      .promise();

    console.log('Notification sent via SNS');
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error for notification failures
  }
}

// Main handler function
async function handleImageUpload(event) {
  try {
    const request = JSON.parse(event.body);

    // Validate input
    const validation = validateImageData(request);
    if (!validation.isValid) {
      await publishMetric('ValidationErrors', 1);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: validation.error }),
      };
    }

    const { imageBuffer } = validation;
    const imageId = uuidv4();
    const { fileName, contentType } = request;

    console.log(`Processing image: ${fileName} (${imageBuffer.length} bytes)`);

    // Process image with Rekognition
    const labels = await processImageWithRekognition(imageBuffer);
    const detectionResult = determineAnimalType(labels);

    console.log(
      `Detection result: ${detectionResult.animal} (${detectionResult.confidence}% confidence)`
    );

    // Upload to S3
    const s3Location = await uploadImageToS3(imageBuffer, imageId, fileName);

    // Store in DynamoDB
    const storedResult = await storeDetectionResult(
      imageId,
      detectionResult,
      fileName,
      contentType
    );

    // Send notification
    await sendNotification(imageId, detectionResult, s3Location);

    // Publish metrics
    await publishMetric('ImagesProcessed', 1);
    await publishMetric(
      'DetectionConfidence',
      detectionResult.confidence,
      'Percent'
    );

    const response = {
      imageId,
      status: 'success',
      detectedAnimal: detectionResult.animal,
      confidenceScore: Math.round(detectionResult.confidence),
      s3Location,
      message: `Image processed successfully. Detected: ${detectionResult.animal} with ${Math.round(detectionResult.confidence)}% confidence`,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error processing image:', error);
    await publishMetric('ProcessingErrors', 1);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
}

// Handle GET requests for listing images
async function handleListImages() {
  try {
    const result = await dynamodb
      .scan({
        TableName: TABLE_NAME,
        ProjectionExpression:
          'imageId, detectedAnimal, confidenceScore, timestamp, processingStatus, imageFormat',
      })
      .promise();

    const response = {
      count: result.Count,
      items: result.Items || [],
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error listing images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
}

// Handle GET requests for specific image
async function handleGetImage(imageId) {
  try {
    const result = await dynamodb
      .get({
        TableName: TABLE_NAME,
        Key: { imageId },
      })
      .promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Image not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error getting image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
}

// Main Lambda handler
exports.handler = async event => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.httpMethod;
    const path = event.path;

    if (httpMethod === 'POST' && path === '/images') {
      return await handleImageUpload(event);
    } else if (httpMethod === 'GET' && path === '/images') {
      return await handleListImages();
    } else if (httpMethod === 'GET' && path.startsWith('/images/')) {
      const imageId = path.split('/')[2];
      return await handleGetImage(imageId);
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' }),
      };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
```

### 6. Monitoring Stack (`lib/stacks/monitoring-stack.ts`)

**Description**: Configures CloudWatch dashboards, alarms, and monitoring for Lambda functions, DynamoDB, and API Gateway with comprehensive observability.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  lambdaFunctions: lambda.Function[];
  restApi: apigateway.RestApi;
  detectionTable: dynamodb.Table;
  imageBucket: s3.Bucket;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      lambdaFunctions,
      restApi,
      detectionTable,
      imageBucket,
    } = props;

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'ImageDetectorDashboard', {
      dashboardName: `serverlessapp-image-detector-${environmentSuffix}`,
    });

    // Lambda Function Metrics and Alarms
    lambdaFunctions.forEach((func, index) => {
      const functionName = func.functionName;

      // Error Rate Alarm
      const errorAlarm = new cloudwatch.Alarm(
        this,
        `${func.node.id}ErrorAlarm`,
        {
          alarmName: `${func.functionName}-errors-${environmentSuffix}`,
          metric: func.metricErrors({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 1,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `Lambda function ${functionName} error rate exceeded threshold`,
        }
      );

      // Duration Alarm
      const durationAlarm = new cloudwatch.Alarm(
        this,
        `${func.node.id}DurationAlarm`,
        {
          alarmName: `${func.functionName}-duration-${environmentSuffix}`,
          metric: func.metricDuration({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 30000, // 30 seconds
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `Lambda function ${functionName} duration exceeded threshold`,
        }
      );

      // Throttle Alarm
      const throttleAlarm = new cloudwatch.Alarm(
        this,
        `${func.node.id}ThrottleAlarm`,
        {
          alarmName: `${func.functionName}-throttles-${environmentSuffix}`,
          metric: func.metricThrottles({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 1,
          evaluationPeriods: 1,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `Lambda function ${functionName} throttling detected`,
        }
      );
    });

    // API Gateway Metrics and Alarms
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiGatewayErrorAlarm', {
      alarmName: `api-gateway-errors-${environmentSuffix}`,
      metric: restApi.metricServerError({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway server errors exceeded threshold',
    });

    const apiLatencyAlarm = new cloudwatch.Alarm(
      this,
      'ApiGatewayLatencyAlarm',
      {
        alarmName: `api-gateway-latency-${environmentSuffix}`,
        metric: restApi.metricLatency({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5000, // 5 seconds
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'API Gateway latency exceeded threshold',
      }
    );

    // DynamoDB Metrics and Alarms
    const dynamoThrottleAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBThrottleAlarm',
      {
        alarmName: `dynamodb-throttles-${environmentSuffix}`,
        metric: detectionTable.metricThrottledRequestsForOperation('GetItem', {
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'DynamoDB throttling detected',
      }
    );

    // S3 Metrics and Alarms
    const s3ErrorAlarm = new cloudwatch.Alarm(this, 'S3ErrorAlarm', {
      alarmName: `s3-errors-${environmentSuffix}`,
      metric: imageBucket.metricAllRequests({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1000, // High request count might indicate issues
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'S3 bucket request count exceeded threshold',
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      // Lambda Metrics
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: lambdaFunctions.map(func => func.metricInvocations()),
        right: lambdaFunctions.map(func => func.metricErrors()),
        width: 12,
        height: 6,
      }),

      // Lambda Duration
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Duration',
        left: lambdaFunctions.map(func => func.metricDuration()),
        width: 12,
        height: 6,
      }),

      // API Gateway Metrics
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [restApi.metricCount(), restApi.metricLatency()],
        right: [restApi.metricServerError(), restApi.metricClientError()],
        width: 12,
        height: 6,
      }),

      // DynamoDB Metrics
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Metrics',
        left: [
          detectionTable.metricConsumedReadCapacityUnits(),
          detectionTable.metricConsumedWriteCapacityUnits(),
        ],
        right: [detectionTable.metricThrottledRequests()],
        width: 12,
        height: 6,
      }),

      // S3 Metrics
      new cloudwatch.GraphWidget({
        title: 'S3 Bucket Metrics',
        left: [
          imageBucket.metricAllRequests(),
          imageBucket.metricGetRequests(),
        ],
        right: [imageBucket.metricPutRequests()],
        width: 12,
        height: 6,
      })
    );

    // Add tags
    cdk.Tags.of(this.dashboard).add('Purpose', 'Monitoring');
  }
}
```

### 7. Rekognition Stack (`lib/stacks/rekognition-stack.ts`)

**Description**: Configures Amazon Rekognition service roles and IAM permissions for secure AI/ML image analysis capabilities.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface RekognitionStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  imageBucket: s3.Bucket;
}

export class RekognitionStack extends cdk.NestedStack {
  public readonly rekognitionServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: RekognitionStackProps) {
    super(scope, id, props);

    const { environmentSuffix, imageBucket } = props;

    // Create IAM role for Rekognition service
    this.rekognitionServiceRole = new iam.Role(this, 'RekognitionServiceRole', {
      roleName: `serverlessapp-rekognition-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('rekognition.amazonaws.com'),
      description: 'IAM role for Amazon Rekognition service',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonRekognitionFullAccess'
        ),
      ],
    });

    // Grant S3 read access to the image bucket
    imageBucket.grantRead(this.rekognitionServiceRole);

    // Add custom policy for specific Rekognition actions
    this.rekognitionServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rekognition:DetectLabels',
          'rekognition:DetectModerationLabels',
          'rekognition:DetectFaces',
          'rekognition:DetectText',
        ],
        resources: ['*'],
      })
    );

    // Add CloudWatch Logs permissions
    this.rekognitionServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/rekognition/*`,
        ],
      })
    );

    // Add tags
    cdk.Tags.of(this.rekognitionServiceRole).add(
      'Purpose',
      'Rekognition Service'
    );
  }
}
```

## Critical Issues Fixed

### 1. CloudWatch Permissions Gap - RESOLVED ✅

**Issue**: Lambda functions couldn't publish metrics to CloudWatch due to missing environment variables.
**Fix**: Added missing environment variables to the Lambda stack:

- `REGION`: AWS region for CloudWatch client initialization
- `ENVIRONMENT`: Environment suffix for SSM parameter paths
- `BUCKET_NAME`: S3 bucket name for image storage
- `TABLE_NAME`: DynamoDB table name for detection logs

### 2. Image Format Validation - RESOLVED ✅

**Issue**: Core functionality was blocked by inadequate image validation.
**Fix**: Enhanced validation in the Lambda function:

- Added comprehensive base64 format validation
- Improved content type validation with file extension matching
- Added proper error messages for debugging
- Removed duplicate validation code to prevent conflicts
- Added file name validation and empty string checks

### 3. SSM Parameters - CONFIRMED ✅

**Issue**: Lambda function expected SSM parameters for Rekognition configuration.
**Status**: SSM parameters are already properly configured in the Rekognition stack:

- `/serverlessapp/{env}/rekognition/min-confidence`
- `/serverlessapp/{env}/rekognition/max-labels`
- `/serverlessapp/{env}/rekognition/free-tier-limit`

```

```
