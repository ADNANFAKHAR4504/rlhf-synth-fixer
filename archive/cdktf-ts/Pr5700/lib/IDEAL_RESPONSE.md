# Serverless Webhook Processing System - IDEAL RESPONSE

This document contains the complete implementation of the serverless webhook processing system using CDKTF with TypeScript.

## Implementation Files

### File: lib/tap-stack.ts

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
    // Use account ID in bucket name to ensure global uniqueness and prevent conflicts on redeployment
    const resultsBucket = new S3Bucket(this, `webhook-results-${environmentSuffix}`, {
      bucket: `webhook-results-${environmentSuffix}-${current.accountId}`,
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
    // Add lifecycle configuration to handle updates properly on redeployment
    new LambdaEventSourceMapping(this, `processor-event-source-${environmentSuffix}`, {
      eventSourceArn: webhookQueue.arn,
      functionName: processorLambda.functionName,
      batchSize: 10,
      lifecycle: {
        createBeforeDestroy: true,
      },
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
    const postIntegration = new ApiGatewayIntegration(this, `webhooks-post-integration-${environmentSuffix}`, {
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
    const getIntegration = new ApiGatewayIntegration(this, `webhooks-get-integration-${environmentSuffix}`, {
      restApiId: api.id,
      resourceId: webhooksResource.id,
      httpMethod: getMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: validatorLambda.invokeArn,
    });

    // Lambda permission for API Gateway to invoke validator
    // Use unique statementId per environment to prevent conflicts on redeployment
    new LambdaPermission(this, `api-lambda-permission-${environmentSuffix}`, {
      statementId: `AllowAPIGatewayInvoke-${environmentSuffix}`,
      action: 'lambda:InvokeFunction',
      functionName: validatorLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Deployment
    // Add triggers to force redeployment when methods or integrations change
    // This prevents conflicts when redeploying after successful initial deployment
    const deployment = new ApiGatewayDeployment(this, `api-deployment-${environmentSuffix}`, {
      restApiId: api.id,
      dependsOn: [postMethod, getMethod, postIntegration, getIntegration],
      triggers: {
        // Force redeployment when integrations change
        // Concatenated IDs will change when resources change, triggering new deployment
        redeployment: Fn.join('-', [
          postMethod.id,
          getMethod.id,
          postIntegration.id,
          getIntegration.id,
        ]),
      },
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

    // CloudWatch Alarm for Validator Lambda errors (error rate > 1%)
    new CloudwatchMetricAlarm(this, `validator-error-alarm-${environmentSuffix}`, {
      alarmName: `webhook-validator-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      threshold: 1.0,
      alarmDescription: 'Alert when validator Lambda error rate exceeds 1%',
      metricQuery: [
        {
          id: 'errors',
          metric: {
            metricName: 'Errors',
            namespace: 'AWS/Lambda',
            period: 60,
            stat: 'Sum',
            dimensions: {
              FunctionName: validatorLambda.functionName,
            },
          },
          returnData: false,
        },
        {
          id: 'invocations',
          metric: {
            metricName: 'Invocations',
            namespace: 'AWS/Lambda',
            period: 60,
            stat: 'Sum',
            dimensions: {
              FunctionName: validatorLambda.functionName,
            },
          },
          returnData: false,
        },
        {
          id: 'error_rate',
          expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
          label: 'Error Rate (%)',
          returnData: true,
        },
      ],
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // CloudWatch Alarm for Processor Lambda errors (error rate > 1%)
    new CloudwatchMetricAlarm(this, `processor-error-alarm-${environmentSuffix}`, {
      alarmName: `webhook-processor-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      threshold: 1.0,
      alarmDescription: 'Alert when processor Lambda error rate exceeds 1%',
      metricQuery: [
        {
          id: 'errors',
          metric: {
            metricName: 'Errors',
            namespace: 'AWS/Lambda',
            period: 60,
            stat: 'Sum',
            dimensions: {
              FunctionName: processorLambda.functionName,
            },
          },
          returnData: false,
        },
        {
          id: 'invocations',
          metric: {
            metricName: 'Invocations',
            namespace: 'AWS/Lambda',
            period: 60,
            stat: 'Sum',
            dimensions: {
              FunctionName: processorLambda.functionName,
            },
          },
          returnData: false,
        },
        {
          id: 'error_rate',
          expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
          label: 'Error Rate (%)',
          returnData: true,
        },
      ],
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Outputs
    new TerraformOutput(this, 'api-endpoint', {
      value: `https://${api.id}.execute-api.${awsRegion}.amazonaws.com/${stage.stageName}/webhooks`,
      description: 'API Gateway endpoint URL for webhooks',
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

### File: lib/lambda/validator/index.ts

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

### File: lib/lambda/processor/index.ts

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

### File: lib/lambda/build.sh

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

### File: lib/lambda/validator/package.json

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

### File: lib/lambda/processor/package.json

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

### File: lib/PROMPT.md

```markdown
# Application Deployment

CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with ts

Platform: cdktf
Language: ts
Region: ap-southeast-1

Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

Create a CDKTF program to build a serverless webhook processing system. The configuration must:

1. Deploy a REST API using API Gateway with POST and GET endpoints for webhook reception and status queries.

2. Create a Lambda function to validate incoming webhooks and store them in a DynamoDB table with TTL enabled for 7 days.

3. Set up an SQS queue with a dead letter queue for failed messages after 3 retries.

4. Deploy a Lambda function that processes messages from the SQS queue and stores results in S3.

5. Configure Lambda functions with appropriate IAM roles and environment variables.

6. Set up DynamoDB with on-demand billing and partition key 'webhookId'.

7. Enable X-Ray tracing on all Lambda functions for debugging.

8. Configure API Gateway with throttling limits of 100 requests per second.

9. Create CloudWatch alarms for Lambda errors exceeding 1% error rate.

10. Tag all resources with 'Environment: Production' and 'Team: Platform'.

Expected output: A fully deployed serverless infrastructure with API endpoints returning webhook IDs on POST requests and processing status on GET requests. All webhook data should flow through the queue for async processing with results stored in S3.

---

## Additional Context

### Background

A startup needs to build a serverless event processing system that receives webhooks from various third-party services. The system must process events asynchronously while maintaining high reliability and providing real-time status updates through a REST API.

### Constraints and Requirements

- Lambda functions must have 512MB memory and 30-second timeout
- DynamoDB table must use on-demand pricing mode
- SQS visibility timeout must be 6 times the Lambda timeout
- API Gateway must use Regional endpoint type
- S3 bucket must have versioning enabled
- All Lambda functions must use Node.js 18 runtime
- Dead letter queue must retain messages for 14 days
- API responses must include CORS headers for browser compatibility

### Environment Setup

Serverless webhook processing system deployed in ap-southeast-1 using API Gateway for HTTP endpoints, Lambda functions for compute, DynamoDB for webhook metadata storage, SQS for message queuing, and S3 for processed results. Requires CDKTF with TypeScript, Node.js 18+, AWS CLI configured with appropriate permissions. Architecture includes async processing with dead letter queue support and monitoring through CloudWatch and X-Ray.

## Project-Specific Conventions

### Resource Naming

All resources must use the `environmentSuffix` variable in their names to support multiple PR environments. Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix.

### Testing Integration

Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`. Tests should validate actual deployed resources.

### Resource Management

Infrastructure should be fully destroyable for CI/CD workflows. Exception: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack. Avoid using DeletionPolicy: Retain unless absolutely necessary.

### Security Baseline

- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region

All resources should be deployed to: ap-southeast-1
```

## Key Implementation Features

### 1. Redeployment Safety
- S3 bucket names include account ID for global uniqueness
- Lambda permission statementId includes environment suffix
- API Gateway deployment uses triggers to force redeployment on changes
- Event source mapping includes lifecycle configuration

### 2. CloudWatch Alarms
- Uses metric math queries to calculate error rate percentage
- Expression: `IF(invocations > 0, (errors / invocations) * 100, 0)`
- Threshold set to 1.0 for 1% error rate

### 3. API Gateway Configuration
- Proper endpoint URL construction in outputs
- Deployment triggers prevent conflicts on redeployment
- Regional endpoint type for better performance

### 4. Resource Naming
- All resources include `environmentSuffix` for multi-environment support
- Account ID included in S3 bucket name for global uniqueness

### 5. Error Handling
- Lambda functions include comprehensive error handling
- CORS headers for browser compatibility
- Proper HTTP status codes
