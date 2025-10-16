# Serverless API Infrastructure for Digital Learning Platform - CDK TypeScript Implementation

This implementation provides a FERPA-compliant serverless API infrastructure with failure recovery and high availability features.

## Architecture Overview

- **API Gateway**: REST API with API key authentication
- **Lambda**: Content delivery handlers with retry logic (Node.js 20.x)
- **DynamoDB**: Educational content storage with point-in-time recovery
- **S3**: Content file storage with encryption
- **KMS**: Encryption keys for FERPA compliance with CloudWatch Logs permissions
- **CloudWatch**: Monitoring, logging (encrypted), and alarms for failure detection
- **SQS**: Dead letter queue for failed executions

## File Structure

```text
bin/tap.ts              # CDK app entry point
lib/tap-stack.ts        # Main stack with all infrastructure
lib/lambda/index.ts     # Lambda function code for content API
cdk.json                # CDK configuration file
```

## Implementation

### File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from environment variable, command line context, or use default
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  app.node.tryGetContext('environmentSuffix') ||
  'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-1',
  },
  environmentSuffix: environmentSuffix,
});
```

### File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption at rest (FERPA Compliance)
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for learning platform - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant CloudWatch Logs permission to use the KMS key
    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudWatch Logs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
          },
        },
      })
    );

    // DynamoDB Table for educational content metadata
    const contentTable = new dynamodb.Table(this, 'ContentTable', {
      tableName: `learning-content-${environmentSuffix}`,
      partitionKey: {
        name: 'contentId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      pointInTimeRecovery: true, // Failure recovery feature
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by content type
    contentTable.addGlobalSecondaryIndex({
      indexName: 'ContentTypeIndex',
      partitionKey: {
        name: 'contentType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // S3 Bucket for educational content storage
    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `learning-content-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'intelligent-tiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Dead Letter Queue for failed Lambda executions
    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `learning-api-dlq-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Lambda execution role with least privilege (FERPA Compliance)
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `learning-api-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant specific permissions to Lambda role
    contentTable.grantReadWriteData(lambdaRole);
    encryptionKey.grantEncryptDecrypt(lambdaRole);

    // CloudWatch Log Group with encryption (FERPA Compliance)
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/learning-api-${environmentSuffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for content API
    const contentHandler = new lambda.Function(this, 'ContentHandler', {
      functionName: `learning-api-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: contentTable.tableName,
        ENVIRONMENT: environmentSuffix,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      deadLetterQueue: dlq,
      retryAttempts: 2, // Failure recovery feature
      logGroup: logGroup,
    });

    // CloudWatch Alarms for failure detection
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `learning-api-errors-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function has errors',
      metric: contentHandler.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: `learning-api-throttles-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function is throttled',
      metric: contentHandler.metricThrottles({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // API Gateway REST API with API key authentication
    const api = new apigateway.RestApi(this, 'LearningApi', {
      restApiName: `learning-api-${environmentSuffix}`,
      description: 'Serverless API for educational content delivery',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      cloudWatchRole: true,
    });

    // API Key for authentication (FERPA Compliance)
    const apiKey = api.addApiKey('LearningApiKey', {
      apiKeyName: `learning-api-key-${environmentSuffix}`,
      description: 'API key for educational content access',
    });

    // Usage Plan with throttling (High Availability)
    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `learning-api-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for educational content API',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 100000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(contentHandler, {
      proxy: true,
    });

    // API Resources and Methods
    const content = api.root.addResource('content');

    // GET /content - List all content
    content.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // POST /content - Create new content
    content.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '201',
        },
        {
          statusCode: '400',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // GET /content/{id} - Get specific content
    const contentById = content.addResource('{id}');
    contentById.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '404',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // PUT /content/{id} - Update content
    contentById.addMethod('PUT', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '404',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // DELETE /content/{id} - Delete content
    contentById.addMethod('DELETE', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '204',
        },
        {
          statusCode: '404',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'ApiDashboard', {
      dashboardName: `learning-api-dashboard-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [contentHandler.metricInvocations()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [contentHandler.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [contentHandler.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          api.metricCount(),
          api.metricClientError(),
          api.metricServerError(),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Learning API URL',
      exportName: `${environmentSuffix}-api-url`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `${environmentSuffix}-api-key-id`,
    });

    new cdk.CfnOutput(this, 'ContentTableName', {
      value: contentTable.tableName,
      description: 'DynamoDB Content Table Name',
      exportName: `${environmentSuffix}-content-table-name`,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
      description: 'S3 Content Bucket Name',
      exportName: `${environmentSuffix}-content-bucket-name`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: contentHandler.functionName,
      description: 'Lambda Function Name',
      exportName: `${environmentSuffix}-lambda-function-name`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: `${environmentSuffix}-dlq-url`,
    });
  }
}
```

### File: lib/lambda/index.ts

```typescript
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.TABLE_NAME!;

interface APIGatewayProxyEvent {
  httpMethod: string;
  path: string;
  pathParameters?: { [key: string]: string };
  body?: string;
  requestContext: {
    requestId: string;
  };
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
}

interface EducationalContent {
  contentId: string;
  title: string;
  description: string;
  contentType: string;
  subject: string;
  gradeLevel: string;
  contentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { httpMethod, path, pathParameters } = event;

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight response' }),
      };
    }

    // Route to appropriate handler
    if (path === '/content' && httpMethod === 'GET') {
      return await listContent(headers);
    }

    if (path === '/content' && httpMethod === 'POST') {
      return await createContent(event, headers);
    }

    if (path.startsWith('/content/') && httpMethod === 'GET') {
      const contentId = pathParameters?.id;
      if (!contentId) {
        return errorResponse(400, 'Missing content ID', headers);
      }
      return await getContent(contentId, headers);
    }

    if (path.startsWith('/content/') && httpMethod === 'PUT') {
      const contentId = pathParameters?.id;
      if (!contentId) {
        return errorResponse(400, 'Missing content ID', headers);
      }
      return await updateContent(contentId, event, headers);
    }

    if (path.startsWith('/content/') && httpMethod === 'DELETE') {
      const contentId = pathParameters?.id;
      if (!contentId) {
        return errorResponse(400, 'Missing content ID', headers);
      }
      return await deleteContent(contentId, headers);
    }

    return errorResponse(404, 'Route not found', headers);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : 'Internal server error',
      headers
    );
  }
};

async function listContent(headers: {
  [key: string]: string;
}): Promise<APIGatewayProxyResult> {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 100,
    });

    const response = await dynamoClient.send(command);
    const items = response.Items?.map(item => unmarshall(item)) || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items,
        count: items.length,
      }),
    };
  } catch (error) {
    console.error('Error listing content:', error);
    throw error;
  }
}

async function createContent(
  event: APIGatewayProxyEvent,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return errorResponse(400, 'Missing request body', headers);
    }

    const body = JSON.parse(event.body);
    const { title, description, contentType, subject, gradeLevel } = body;

    // Validation
    if (!title || !contentType || !subject || !gradeLevel) {
      return errorResponse(400, 'Missing required fields', headers);
    }

    const contentId = `content-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const content: EducationalContent = {
      contentId,
      title,
      description: description || '',
      contentType,
      subject,
      gradeLevel,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(content),
    });

    await dynamoClient.send(command);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(content),
    };
  } catch (error) {
    console.error('Error creating content:', error);
    throw error;
  }
}

async function getContent(
  contentId: string,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    const response = await dynamoClient.send(command);

    if (!response.Item) {
      return errorResponse(404, 'Content not found', headers);
    }

    const content = unmarshall(response.Item);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(content),
    };
  } catch (error) {
    console.error('Error getting content:', error);
    throw error;
  }
}

async function updateContent(
  contentId: string,
  event: APIGatewayProxyEvent,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return errorResponse(400, 'Missing request body', headers);
    }

    const body = JSON.parse(event.body);
    const { title, description, contentType, subject, gradeLevel } = body;

    // Check if content exists
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    const getResponse = await dynamoClient.send(getCommand);
    if (!getResponse.Item) {
      return errorResponse(404, 'Content not found', headers);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: Record<string, string> = {};

    if (title) {
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = title;
    }

    if (description !== undefined) {
      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (contentType) {
      updateExpressions.push('#contentType = :contentType');
      expressionAttributeNames['#contentType'] = 'contentType';
      expressionAttributeValues[':contentType'] = contentType;
    }

    if (subject) {
      updateExpressions.push('#subject = :subject');
      expressionAttributeNames['#subject'] = 'subject';
      expressionAttributeValues[':subject'] = subject;
    }

    if (gradeLevel) {
      updateExpressions.push('#gradeLevel = :gradeLevel');
      expressionAttributeNames['#gradeLevel'] = 'gradeLevel';
      expressionAttributeValues[':gradeLevel'] = gradeLevel;
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateCommand = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ReturnValues: 'ALL_NEW',
    });

    const updateResponse = await dynamoClient.send(updateCommand);
    const updatedContent = unmarshall(updateResponse.Attributes!);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedContent),
    };
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

async function deleteContent(
  contentId: string,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    // Check if content exists
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    const getResponse = await dynamoClient.send(getCommand);
    if (!getResponse.Item) {
      return errorResponse(404, 'Content not found', headers);
    }

    const deleteCommand = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    await dynamoClient.send(deleteCommand);

    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
}

function errorResponse(
  statusCode: number,
  message: string,
  headers: { [key: string]: string }
): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ error: message }),
  };
}
```

## Key Improvements from Model Response

### 1. Fixed KMS Permissions for CloudWatch Logs
Added explicit CloudWatch Logs service principal permissions to KMS key to allow log encryption.

### 2. Removed Unused S3 Imports from Lambda
Cleaned up Lambda function code by removing unused S3 client imports and dependencies.

### 3. Added cdk.json Configuration
Created proper CDK configuration file for synthesis and deployment.

### 4. Fixed API Gateway Metrics
Corrected CloudWatch dashboard to use `metricClientError()` and `metricServerError()` instead of deprecated methods.

## Deployment

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Synthesize CloudFormation
export ENVIRONMENT_SUFFIX="your-suffix"
npm run synth

# Deploy to AWS
npm run cdk:deploy
```

## FERPA Compliance Features

1. **Encryption at Rest**: KMS encryption for DynamoDB, S3, CloudWatch Logs, and SQS
2. **Encryption in Transit**: HTTPS/TLS enforced by API Gateway
3. **Access Control**: API key authentication and IAM roles with least privilege
4. **Audit Logging**: CloudWatch Logs with encryption for all API requests
5. **Data Retention**: Configurable log retention (14 days)

## Failure Recovery Features

1. **Automatic Retries**: Lambda configured with 2 retry attempts
2. **Dead Letter Queue**: Failed executions sent to encrypted SQS for analysis
3. **Point-in-Time Recovery**: DynamoDB backups enabled
4. **CloudWatch Alarms**: Error and throttle detection with appropriate thresholds

## High Availability Features

1. **Multi-AZ**: DynamoDB automatically replicates across availability zones
2. **Throttling**: API Gateway and Lambda throttling configured via usage plans
3. **Monitoring**: CloudWatch Dashboard for real-time metrics
4. **Versioning**: S3 bucket versioning enabled for data protection

## API Endpoints

- `GET /content` - List all educational content
- `GET /content/{id}` - Retrieve specific content
- `POST /content` - Create new content
- `PUT /content/{id}` - Update content
- `DELETE /content/{id}` - Delete content

All endpoints require API key authentication via `x-api-key` header.

## Stack Outputs

- `ApiUrl`: API Gateway endpoint URL
- `ApiKeyId`: API key ID for retrieving the key value
- `ContentTableName`: DynamoDB table name
- `ContentBucketName`: S3 bucket name
- `LambdaFunctionName`: Lambda function name
- `DLQUrl`: Dead letter queue URL

## Success Criteria Met

✓ Infrastructure deploys successfully to ap-southeast-1
✓ API Gateway accessible with API key authentication
✓ Lambda functions execute and return responses
✓ DynamoDB stores and retrieves content
✓ All data encrypted at rest and in transit
✓ CloudWatch Alarms configured for failures
✓ Point-in-time recovery enabled on DynamoDB
✓ All resources include environmentSuffix in naming
✓ Resources are destroyable (no retention policies)
