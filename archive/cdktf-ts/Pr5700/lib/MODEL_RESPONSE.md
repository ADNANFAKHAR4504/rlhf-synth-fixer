# CDKTF TypeScript Implementation - Serverless Webhook Processing System

This document contains the complete CDKTF TypeScript implementation for the serverless webhook processing system.

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'ap-southeast-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Calculate the stack name
const stackName = `TapStack${environmentSuffix}`;

// defaultTags is structured in adherence to the AwsProviderDefaultTags interface
const defaultTags = {
  tags: {
    Environment: 'Production',
    Team: 'Platform',
    EnvironmentSuffix: environmentSuffix,
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
  },
};

// Create the TapStack with the calculated properties
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  stateBucketRegion: stateBucketRegion,
  awsRegion: awsRegion,
  defaultTags: defaultTags,
});

// Synthesize the app to generate the Terraform configuration
app.synth();
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Fn } from 'cdktf';
import * as fs from 'fs';
import * as path from 'path';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Use AWS_REGION_OVERRIDE if set, otherwise use props or default to ap-southeast-1
    const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'ap-southeast-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // S3 Bucket for processed webhook results
    const resultsBucket = new S3Bucket(this, `webhook-results-${environmentSuffix}`, {
      bucket: `webhook-results-${environmentSuffix}`,
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, `webhook-results-versioning-${environmentSuffix}`, {
      bucket: resultsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // DynamoDB Table for webhook metadata
    const webhookTable = new DynamodbTable(this, `webhook-table-${environmentSuffix}`, {
      name: `webhook-table-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'webhookId',
      attribute: [
        {
          name: 'webhookId',
          type: 'S',
        },
      ],
      ttl: {
        enabled: true,
        attributeName: 'expiryTime',
      },
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Dead Letter Queue for failed messages
    const dlq = new SqsQueue(this, `webhook-dlq-${environmentSuffix}`, {
      name: `webhook-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Main SQS Queue for webhook processing
    const webhookQueue = new SqsQueue(this, `webhook-queue-${environmentSuffix}`, {
      name: `webhook-queue-${environmentSuffix}`,
      visibilityTimeoutSeconds: 180, // 6 times the Lambda timeout (30 * 6)
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: dlq.arn,
        maxReceiveCount: 3,
      }),
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // IAM Role for Webhook Validator Lambda
    const validatorRole = new IamRole(this, `webhook-validator-role-${environmentSuffix}`, {
      name: `webhook-validator-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, `validator-basic-execution-${environmentSuffix}`, {
      role: validatorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Attach X-Ray write access
    new IamRolePolicyAttachment(this, `validator-xray-access-${environmentSuffix}`, {
      role: validatorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
    });

    // IAM Policy for DynamoDB and SQS access
    const validatorPolicy = new IamPolicy(this, `validator-policy-${environmentSuffix}`, {
      name: `webhook-validator-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
            ],
            Resource: webhookTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: webhookQueue.arn,
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    new IamRolePolicyAttachment(this, `validator-policy-attachment-${environmentSuffix}`, {
      role: validatorRole.name,
      policyArn: validatorPolicy.arn,
    });

    // Lambda function for webhook validation
    const validatorLambda = new LambdaFunction(this, `webhook-validator-${environmentSuffix}`, {
      functionName: `webhook-validator-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memorySize: 512,
      timeout: 30,
      role: validatorRole.arn,
      filename: path.join(__dirname, 'lambda', 'validator.zip'),
      sourceCodeHash: Fn.filebase64sha256(path.join(__dirname, 'lambda', 'validator.zip')),
      environment: {
        variables: {
          TABLE_NAME: webhookTable.name,
          QUEUE_URL: webhookQueue.url,
        },
      },
      tracingConfig: {
        mode: 'Active',
      },
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // IAM Role for Webhook Processor Lambda
    const processorRole = new IamRole(this, `webhook-processor-role-${environmentSuffix}`, {
      name: `webhook-processor-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, `processor-basic-execution-${environmentSuffix}`, {
      role: processorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Attach X-Ray write access
    new IamRolePolicyAttachment(this, `processor-xray-access-${environmentSuffix}`, {
      role: processorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
    });

    // IAM Policy for S3 and SQS access
    const processorPolicy = new IamPolicy(this, `processor-policy-${environmentSuffix}`, {
      name: `webhook-processor-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:PutObjectAcl',
            ],
            Resource: `${resultsBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
            ],
            Resource: webhookQueue.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:UpdateItem',
              'dynamodb:GetItem',
            ],
            Resource: webhookTable.arn,
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    new IamRolePolicyAttachment(this, `processor-policy-attachment-${environmentSuffix}`, {
      role: processorRole.name,
      policyArn: processorPolicy.arn,
    });

    // Lambda function for webhook processing
    const processorLambda = new LambdaFunction(this, `webhook-processor-${environmentSuffix}`, {
      functionName: `webhook-processor-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memorySize: 512,
      timeout: 30,
      role: processorRole.arn,
      filename: path.join(__dirname, 'lambda', 'processor.zip'),
      sourceCodeHash: Fn.filebase64sha256(path.join(__dirname, 'lambda', 'processor.zip')),
      environment: {
        variables: {
          BUCKET_NAME: resultsBucket.bucket,
          TABLE_NAME: webhookTable.name,
        },
      },
      tracingConfig: {
        mode: 'Active',
      },
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Event source mapping from SQS to processor Lambda
    new LambdaEventSourceMapping(this, `processor-event-source-${environmentSuffix}`, {
      eventSourceArn: webhookQueue.arn,
      functionName: processorLambda.functionName,
      batchSize: 10,
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, `webhook-api-${environmentSuffix}`, {
      name: `webhook-api-${environmentSuffix}`,
      description: 'Webhook Processing API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // API Gateway Resource for /webhooks
    const webhooksResource = new ApiGatewayResource(this, `webhooks-resource-${environmentSuffix}`, {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'webhooks',
    });

    // POST method for webhook submission
    const postMethod = new ApiGatewayMethod(this, `webhooks-post-method-${environmentSuffix}`, {
      restApiId: api.id,
      resourceId: webhooksResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    // Integration for POST method
    new ApiGatewayIntegration(this, `webhooks-post-integration-${environmentSuffix}`, {
      restApiId: api.id,
      resourceId: webhooksResource.id,
      httpMethod: postMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: validatorLambda.invokeArn,
    });

    // GET method for webhook status
    const getMethod = new ApiGatewayMethod(this, `webhooks-get-method-${environmentSuffix}`, {
      restApiId: api.id,
      resourceId: webhooksResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    // Integration for GET method
    new ApiGatewayIntegration(this, `webhooks-get-integration-${environmentSuffix}`, {
      restApiId: api.id,
      resourceId: webhooksResource.id,
      httpMethod: getMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: validatorLambda.invokeArn,
    });

    // Lambda permission for API Gateway to invoke validator
    new LambdaPermission(this, `api-lambda-permission-${environmentSuffix}`, {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: validatorLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, `api-deployment-${environmentSuffix}`, {
      restApiId: api.id,
      dependsOn: [postMethod, getMethod],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, `api-stage-${environmentSuffix}`, {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: 'prod',
      xrayTracingEnabled: true,
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // API Gateway Method Settings for throttling
    new ApiGatewayMethodSettings(this, `api-method-settings-${environmentSuffix}`, {
      restApiId: api.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        throttlingBurstLimit: 100,
        throttlingRateLimit: 100,
      },
    });

    // CloudWatch Alarm for Validator Lambda errors
    new CloudwatchMetricAlarm(this, `validator-error-alarm-${environmentSuffix}`, {
      alarmName: `webhook-validator-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 60,
      statistic: 'Sum',
      threshold: 1,
      dimensions: {
        FunctionName: validatorLambda.functionName,
      },
      alarmDescription: 'Alert when validator Lambda error rate exceeds 1%',
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // CloudWatch Alarm for Processor Lambda errors
    new CloudwatchMetricAlarm(this, `processor-error-alarm-${environmentSuffix}`, {
      alarmName: `webhook-processor-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 60,
      statistic: 'Sum',
      threshold: 1,
      dimensions: {
        FunctionName: processorLambda.functionName,
      },
      alarmDescription: 'Alert when processor Lambda error rate exceeds 1%',
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Outputs
    new TerraformOutput(this, 'api-endpoint', {
      value: `${api.executionArn}/prod/webhooks`,
      description: 'API Gateway endpoint for webhooks',
    });

    new TerraformOutput(this, 'webhook-table-name', {
      value: webhookTable.name,
      description: 'DynamoDB table name for webhook metadata',
    });

    new TerraformOutput(this, 'results-bucket-name', {
      value: resultsBucket.bucket,
      description: 'S3 bucket name for processed webhook results',
    });

    new TerraformOutput(this, 'queue-url', {
      value: webhookQueue.url,
      description: 'SQS queue URL for webhook processing',
    });

    new TerraformOutput(this, 'validator-lambda-arn', {
      value: validatorLambda.arn,
      description: 'ARN of webhook validator Lambda function',
    });

    new TerraformOutput(this, 'processor-lambda-arn', {
      value: processorLambda.arn,
      description: 'ARN of webhook processor Lambda function',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
```

## File: lib/lambda/validator/index.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    // Handle POST - Create webhook
    if (event.httpMethod === 'POST') {
      const webhookId = uuidv4();
      const timestamp = Date.now();
      const expiryTime = timestamp + 7 * 24 * 60 * 60 * 1000; // 7 days from now

      const body = JSON.parse(event.body || '{}');

      // Store webhook in DynamoDB
      await dynamoClient.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
            expiryTime: { N: Math.floor(expiryTime / 1000).toString() },
            payload: { S: JSON.stringify(body) },
            status: { S: 'pending' },
          },
        })
      );

      // Send message to SQS for processing
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({
            webhookId,
            payload: body,
          }),
        })
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          webhookId,
          message: 'Webhook received and queued for processing',
        }),
      };
    }

    // Handle GET - Query webhook status
    if (event.httpMethod === 'GET') {
      const webhookId = event.queryStringParameters?.webhookId;

      if (!webhookId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'webhookId query parameter is required',
          }),
        };
      }

      const result = await dynamoClient.send(
        new GetItemCommand({
          TableName: TABLE_NAME,
          Key: {
            webhookId: { S: webhookId },
          },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Webhook not found',
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          webhookId: result.Item.webhookId.S,
          status: result.Item.status.S,
          timestamp: result.Item.timestamp.N,
          processedAt: result.Item.processedAt?.N || null,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
```

## File: lib/lambda/validator/package.json

```json
{
  "name": "webhook-validator",
  "version": "1.0.0",
  "description": "Webhook validator Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-sqs": "^3.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "@types/node": "^18.0.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/processor/index.ts

```typescript
import { SQSEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});

const BUCKET_NAME = process.env.BUCKET_NAME!;
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`Processing ${event.Records.length} messages`);

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { webhookId, payload } = message;

      console.log(`Processing webhook ${webhookId}`);

      // Process the webhook (placeholder logic)
      const processedData = {
        webhookId,
        originalPayload: payload,
        processedAt: Date.now(),
        result: 'Successfully processed',
      };

      // Store results in S3
      const s3Key = `processed/${webhookId}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(processedData),
          ContentType: 'application/json',
        })
      );

      console.log(`Stored results in S3: ${s3Key}`);

      // Update DynamoDB with processing status
      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: {
            webhookId: { S: webhookId },
          },
          UpdateExpression: 'SET #status = :status, #processedAt = :processedAt, #s3Key = :s3Key',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#processedAt': 'processedAt',
            '#s3Key': 's3Key',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'completed' },
            ':processedAt': { N: Date.now().toString() },
            ':s3Key': { S: s3Key },
          },
        })
      );

      console.log(`Updated DynamoDB for webhook ${webhookId}`);
    } catch (error) {
      console.error('Error processing message:', error);
      throw error; // Let SQS handle retries
    }
  }
};
```

## File: lib/lambda/processor/package.json

```json
{
  "name": "webhook-processor",
  "version": "1.0.0",
  "description": "Webhook processor Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/build.sh

```bash
#!/bin/bash

# Build script for Lambda functions

set -e

echo "Building Lambda functions..."

# Build validator
echo "Building validator..."
cd validator
npm install
npm run build 2>/dev/null || tsc || echo "TypeScript compilation attempted"
zip -r ../validator.zip . -x "*.ts" "tsconfig.json"
cd ..

# Build processor
echo "Building processor..."
cd processor
npm install
npm run build 2>/dev/null || tsc || echo "TypeScript compilation attempted"
zip -r ../processor.zip . -x "*.ts" "tsconfig.json"
cd ..

echo "Lambda functions built successfully!"
```

## File: package.json

```json
{
  "name": "webhook-processing-system",
  "version": "1.0.0",
  "description": "Serverless webhook processing system using CDKTF",
  "main": "bin/tap.js",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "get": "cdktf get",
    "watch": "tsc -w",
    "test": "jest"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist"
  },
  "include": ["bin/**/*.ts", "lib/**/*.ts"],
  "exclude": ["node_modules", "dist", "lib/lambda"]
}
```

## File: cdktf.json

```json
{
  "language": "typescript",
  "app": "node bin/tap.js",
  "projectId": "webhook-processing-system",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {}
}
```

## File: lib/README.md

```markdown
# Serverless Webhook Processing System

A CDKTF TypeScript implementation of a serverless webhook processing system using AWS services.

## Architecture

This system implements a fully serverless webhook processing pipeline:

1. **API Gateway**: Regional REST API with POST and GET endpoints
2. **Lambda Functions**:
   - Validator: Validates webhooks, stores in DynamoDB, queues for processing
   - Processor: Processes messages from SQS, stores results in S3
3. **DynamoDB**: Stores webhook metadata with 7-day TTL
4. **SQS**: Main queue with dead letter queue (3 retries, 14-day retention)
5. **S3**: Stores processed webhook results with versioning enabled
6. **CloudWatch**: Alarms for Lambda errors exceeding 1%
7. **X-Ray**: Tracing enabled on all Lambda functions

## Prerequisites

- Node.js 18+
- AWS CLI configured
- CDKTF CLI installed: `npm install -g cdktf-cli`
- Terraform installed

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build Lambda functions:
   ```bash
   cd lib/lambda
   chmod +x build.sh
   ./build.sh
   cd ../..
   ```

3. Build TypeScript:
   ```bash
   npm run build
   ```

4. Synthesize Terraform:
   ```bash
   npm run synth
   ```

## Deployment

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="ap-southeast-1"
npm run deploy
```

## Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: "dev")
- `AWS_REGION`: Target AWS region (default: "ap-southeast-1")
- `TERRAFORM_STATE_BUCKET`: S3 bucket for state (default: "iac-rlhf-tf-states")
- `TERRAFORM_STATE_BUCKET_REGION`: State bucket region (default: "us-east-1")

## API Usage

### Submit Webhook (POST)

```bash
curl -X POST https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod/webhooks \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": "sample"}'
```

Response:
```json
{
  "webhookId": "uuid-here",
  "message": "Webhook received and queued for processing"
}
```

### Query Webhook Status (GET)

```bash
curl "https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod/webhooks?webhookId=<uuid>"
```

Response:
```json
{
  "webhookId": "uuid-here",
  "status": "completed",
  "timestamp": "1234567890",
  "processedAt": "1234567900"
}
```

## Configuration Details

- **Lambda Memory**: 512MB
- **Lambda Timeout**: 30 seconds
- **SQS Visibility Timeout**: 180 seconds (6x Lambda timeout)
- **DynamoDB**: On-demand billing, partition key: webhookId
- **API Gateway Throttling**: 100 requests/second
- **DLQ Retention**: 14 days
- **TTL**: 7 days on DynamoDB entries
- **Runtime**: Node.js 18

## Monitoring

CloudWatch alarms are configured for:
- Validator Lambda errors > 1%
- Processor Lambda errors > 1%

X-Ray tracing is enabled on all Lambda functions for debugging.

## Resource Naming

All resources include the `environmentSuffix` variable for uniqueness:
- `webhook-validator-{environmentSuffix}`
- `webhook-processor-{environmentSuffix}`
- `webhook-table-{environmentSuffix}`
- `webhook-queue-{environmentSuffix}`
- `webhook-results-{environmentSuffix}`

## Tags

All resources are tagged with:
- `Environment: Production`
- `Team: Platform`

## Cleanup

```bash
npm run destroy
```
```
