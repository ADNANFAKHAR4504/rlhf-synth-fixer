### Reasoning Trace

---

The user wants a complete serverless webhook processing system using CDKTF in TypeScript. Let me break down what needs to be implemented:

1. **Lambda Functions (3 total)**:
   - `ingestion`: Receives webhooks via API Gateway
   - `processing`: Processes queued messages from SQS
   - `status`: Retrieves transaction status from DynamoDB
   - All use Node.js 18, ARM64, structured logging with correlation IDs

2. **API Gateway REST API**:
   - POST /webhook/{provider}
   - GET /status/{transactionId}
   - Request validation, throttling (1000 req/s), AWS_IAM auth for internal endpoints

3. **DynamoDB Table**:
   - PK: transactionId, SK: timestamp
   - On-demand billing, PITR, encryption

4. **S3 Bucket**:
   - Store raw payloads
   - Versioning, 30-day lifecycle to archive
   - Server-side encryption

5. **SQS Queue**:
   - Main queue + DLQ
   - 5-minute visibility timeout
   - Max 3 retries

6. **Monitoring**:
   - CloudWatch Log Groups (7-day retention)
   - Alarms for Lambda errors and SQS backlog

7. **IAM Roles**:
   - Least privilege for each function

8. **Concurrency Controls**:
   - Ingestion: 50
   - Processing: 100

The flow is:

1. API Gateway → Ingestion Lambda
2. Ingestion Lambda → SQS Queue
3. SQS → Processing Lambda (event source)
4. Processing Lambda → DynamoDB + S3
5. Status Lambda → DynamoDB (read only)

I'll implement this step by step, ensuring all components are properly connected and configured.

### Answer

---

I'll implement a complete serverless webhook processing system using CDKTF in TypeScript. This solution will include all the required components with proper connections and security configurations.

## Complete Implementation

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayRequestValidator } from '@cdktf/provider-aws/lib/api-gateway-request-validator';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

class WebhookStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1', // Change as needed
    });

    // Data sources for account info
    const callerIdentity = new DataAwsCallerIdentity(this, 'caller-identity');
    const region = new DataAwsRegion(this, 'region');

    // === STORAGE LAYER ===

    // S3 Bucket for raw webhook payloads
    const webhookBucket = new S3Bucket(this, 'webhook-bucket', {
      bucket: `webhook-payloads-${crypto.randomBytes(4).toString('hex')}`,
      tags: {
        Environment: 'production',
        Service: 'webhook-processor',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: webhookBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: webhookBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Add lifecycle rule for archiving
    new S3BucketLifecycleConfiguration(this, 'bucket-lifecycle', {
      bucket: webhookBucket.id,
      rule: [
        {
          id: 'archive-old-payloads',
          status: 'Enabled',
          transition: [
            {
              days: 30,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-public-access-block', {
      bucket: webhookBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // DynamoDB Table for transaction data
    const transactionTable = new DynamodbTable(this, 'transaction-table', {
      name: 'webhook-transactions',
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'transactionId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'S',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Environment: 'production',
        Service: 'webhook-processor',
      },
    });

    // === QUEUE LAYER ===

    // Dead Letter Queue
    const dlq = new SqsQueue(this, 'webhook-dlq', {
      name: 'webhook-processing-dlq',
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Environment: 'production',
        Service: 'webhook-processor',
      },
    });

    // Main SQS Queue
    const webhookQueue = new SqsQueue(this, 'webhook-queue', {
      name: 'webhook-processing-queue',
      visibilityTimeoutSeconds: 300, // 5 minutes
      messageRetentionSeconds: 345600, // 4 days
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: dlq.arn,
        maxReceiveCount: 3,
      }),
      tags: {
        Environment: 'production',
        Service: 'webhook-processor',
      },
    });

    // === IAM ROLES ===

    // Base Lambda execution role policy
    const baseLambdaPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    };

    // Ingestion Lambda Role
    const ingestionRole = new IamRole(this, 'ingestion-role', {
      name: 'webhook-ingestion-lambda-role',
      assumeRolePolicy: JSON.stringify(baseLambdaPolicy),
    });

    new IamRolePolicy(this, 'ingestion-policy', {
      name: 'ingestion-permissions',
      role: ingestionRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
            Resource: webhookQueue.arn,
          },
        ],
      }),
    });

    // Processing Lambda Role
    const processingRole = new IamRole(this, 'processing-role', {
      name: 'webhook-processing-lambda-role',
      assumeRolePolicy: JSON.stringify(baseLambdaPolicy),
    });

    new IamRolePolicy(this, 'processing-policy', {
      name: 'processing-permissions',
      role: processingRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
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
            Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
            Resource: transactionTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: `${webhookBucket.arn}/*`,
          },
        ],
      }),
    });

    // Status Lambda Role
    const statusRole = new IamRole(this, 'status-role', {
      name: 'webhook-status-lambda-role',
      assumeRolePolicy: JSON.stringify(baseLambdaPolicy),
    });

    new IamRolePolicy(this, 'status-policy', {
      name: 'status-permissions',
      role: statusRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['dynamodb:Query', 'dynamodb:GetItem'],
            Resource: transactionTable.arn,
          },
        ],
      }),
    });

    // === LAMBDA FUNCTIONS ===

    // Create Lambda code directory
    const lambdaCodeDir = path.join(__dirname, 'lambda-code');
    if (!fs.existsSync(lambdaCodeDir)) {
      fs.mkdirSync(lambdaCodeDir, { recursive: true });
    }

    // Write Lambda function code
    const ingestionCode = `
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const crypto = require('crypto');

exports.handler = async (event) => {
  const correlationId = crypto.randomUUID();
  console.log(JSON.stringify({ 
    correlationId, 
    message: 'Webhook received', 
    provider: event.pathParameters?.provider 
  }));

  try {
    const body = JSON.parse(event.body || '{}');
    const message = {
      correlationId,
      provider: event.pathParameters?.provider || 'unknown',
      timestamp: new Date().toISOString(),
      payload: body,
      headers: event.headers
    };

    await sqs.sendMessage({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify(message)
    }).promise();

    console.log(JSON.stringify({ 
      correlationId, 
      message: 'Message queued successfully' 
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Webhook received', 
        correlationId 
      })
    };
  } catch (error) {
    console.error(JSON.stringify({ 
      correlationId, 
      error: error.message 
    }));
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        correlationId 
      })
    };
  }
};`;

    const processingCode = `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const crypto = require('crypto');

exports.handler = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    const { correlationId, payload, provider, timestamp } = message;
    
    console.log(JSON.stringify({ 
      correlationId, 
      message: 'Processing webhook', 
      provider 
    }));

    try {
      // Generate transaction ID
      const transactionId = crypto.randomUUID();
      
      // Store raw payload in S3
      await s3.putObject({
        Bucket: process.env.BUCKET_NAME,
        Key: \`webhooks/\${provider}/\${transactionId}.json\`,
        Body: JSON.stringify(message),
        ContentType: 'application/json'
      }).promise();

      // Store in DynamoDB
      await dynamodb.put({
        TableName: process.env.TABLE_NAME,
        Item: {
          transactionId,
          timestamp,
          provider,
          status: 'processed',
          correlationId,
          s3Key: \`webhooks/\${provider}/\${transactionId}.json\`,
          processedAt: new Date().toISOString()
        }
      }).promise();

      console.log(JSON.stringify({ 
        correlationId, 
        message: 'Webhook processed successfully',
        transactionId 
      }));
    } catch (error) {
      console.error(JSON.stringify({ 
        correlationId, 
        error: error.message 
      }));
      throw error; // Let SQS retry
    }
  }
};`;

    const statusCode = `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const transactionId = event.pathParameters?.transactionId;
  
  if (!transactionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing transactionId' })
    };
  }

  try {
    const result = await dynamodb.query({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'transactionId = :tid',
      ExpressionAttributeValues: {
        ':tid': transactionId
      },
      ScanIndexForward: false,
      Limit: 1
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Transaction not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items[0])
    };
  } catch (error) {
    console.error(JSON.stringify({ 
      error: error.message,
      transactionId 
    }));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};`;

    // Write Lambda code files
    fs.writeFileSync(path.join(lambdaCodeDir, 'ingestion.js'), ingestionCode);
    fs.writeFileSync(path.join(lambdaCodeDir, 'processing.js'), processingCode);
    fs.writeFileSync(path.join(lambdaCodeDir, 'status.js'), statusCode);

    // Create zip files for Lambda
    const AdmZip = require('adm-zip');

    ['ingestion', 'processing', 'status'].forEach(fn => {
      const zip = new AdmZip();
      zip.addLocalFile(path.join(lambdaCodeDir, `${fn}.js`), '', 'index.js');
      zip.writeZip(path.join(lambdaCodeDir, `${fn}.zip`));
    });

    // CloudWatch Log Groups
    const ingestionLogGroup = new CloudwatchLogGroup(this, 'ingestion-logs', {
      name: '/aws/lambda/webhook-ingestion',
      retentionInDays: 7,
    });

    const processingLogGroup = new CloudwatchLogGroup(this, 'processing-logs', {
      name: '/aws/lambda/webhook-processing',
      retentionInDays: 7,
    });

    const statusLogGroup = new CloudwatchLogGroup(this, 'status-logs', {
      name: '/aws/lambda/webhook-status',
      retentionInDays: 7,
    });

    // Lambda Functions
    const ingestionLambda = new LambdaFunction(this, 'ingestion-lambda', {
      functionName: 'webhook-ingestion',
      role: ingestionRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      architectures: ['arm64'],
      filename: path.join(lambdaCodeDir, 'ingestion.zip'),
      sourceCodeHash: crypto.randomBytes(16).toString('hex'), // Force update
      timeout: 30,
      memorySize: 256,
      reservedConcurrentExecutions: 50,
      environment: {
        variables: {
          QUEUE_URL: webhookQueue.url,
        },
      },
      dependsOn: [ingestionLogGroup],
    });

    const processingLambda = new LambdaFunction(this, 'processing-lambda', {
      functionName: 'webhook-processing',
      role: processingRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      architectures: ['arm64'],
      filename: path.join(lambdaCodeDir, 'processing.zip'),
      sourceCodeHash: crypto.randomBytes(16).toString('hex'),
      timeout: 60,
      memorySize: 512,
      reservedConcurrentExecutions: 100,
      environment: {
        variables: {
          BUCKET_NAME: webhookBucket.bucket,
          TABLE_NAME: transactionTable.name,
        },
      },
      dependsOn: [processingLogGroup],
    });

    const statusLambda = new LambdaFunction(this, 'status-lambda', {
      functionName: 'webhook-status',
      role: statusRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      architectures: ['arm64'],
      filename: path.join(lambdaCodeDir, 'status.zip'),
      sourceCodeHash: crypto.randomBytes(16).toString('hex'),
      timeout: 10,
      memorySize: 128,
      environment: {
        variables: {
          TABLE_NAME: transactionTable.name,
        },
      },
      dependsOn: [statusLogGroup],
    });

    // SQS Event Source Mapping for Processing Lambda
    new LambdaEventSourceMapping(this, 'sqs-lambda-trigger', {
      eventSourceArn: webhookQueue.arn,
      functionName: processingLambda.functionName,
      batchSize: 10,
      maximumBatchingWindowInSeconds: 5,
    });

    // === API GATEWAY ===

    const api = new ApiGatewayRestApi(this, 'webhook-api', {
      name: 'webhook-processor-api',
      description: 'Webhook processing API',
    });

    // Request validator
    const requestValidator = new ApiGatewayRequestValidator(
      this,
      'request-validator',
      {
        name: 'request-validator',
        restApiId: api.id,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Webhook resource /webhook
    const webhookResource = new ApiGatewayResource(this, 'webhook-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'webhook',
    });

    // Provider sub-resource /webhook/{provider}
    const providerResource = new ApiGatewayResource(this, 'provider-resource', {
      restApiId: api.id,
      parentId: webhookResource.id,
      pathPart: '{provider}',
    });

    // Status resource /status
    const statusResource = new ApiGatewayResource(this, 'status-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'status',
    });

    // Transaction sub-resource /status/{transactionId}
    const transactionResource = new ApiGatewayResource(
      this,
      'transaction-resource',
      {
        restApiId: api.id,
        parentId: statusResource.id,
        pathPart: '{transactionId}',
      }
    );

    // POST /webhook/{provider}
    const webhookMethod = new ApiGatewayMethod(this, 'webhook-method', {
      restApiId: api.id,
      resourceId: providerResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
      requestValidatorId: requestValidator.id,
      requestParameters: {
        'method.request.path.provider': true,
      },
    });

    new ApiGatewayIntegration(this, 'webhook-integration', {
      restApiId: api.id,
      resourceId: providerResource.id,
      httpMethod: webhookMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: `arn:aws:apigateway:${region.name}:lambda:path/2015-03-31/functions/${ingestionLambda.arn}/invocations`,
    });

    // GET /status/{transactionId}
    const statusMethod = new ApiGatewayMethod(this, 'status-method', {
      restApiId: api.id,
      resourceId: transactionResource.id,
      httpMethod: 'GET',
      authorization: 'AWS_IAM',
      requestValidatorId: requestValidator.id,
      requestParameters: {
        'method.request.path.transactionId': true,
      },
    });

    new ApiGatewayIntegration(this, 'status-integration', {
      restApiId: api.id,
      resourceId: transactionResource.id,
      httpMethod: statusMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: `arn:aws:apigateway:${region.name}:lambda:path/2015-03-31/functions/${statusLambda.arn}/invocations`,
    });

    // Lambda permissions for API Gateway
    new LambdaPermission(this, 'ingestion-api-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: ingestionLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    new LambdaPermission(this, 'status-api-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: statusLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [webhookMethod, statusMethod],
    });

    // API Stage with throttling
    const stage = new ApiGatewayStage(this, 'api-stage', {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: 'v1',
      throttleSettings: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
    });

    // === MONITORING & ALARMS ===

    // Lambda error alarm
    new CloudwatchMetricAlarm(this, 'ingestion-error-alarm', {
      alarmName: 'webhook-ingestion-errors',
      alarmDescription: 'Ingestion Lambda errors',
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 1,
      threshold: 5,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        FunctionName: ingestionLambda.functionName,
      },
    });

    new CloudwatchMetricAlarm(this, 'processing-error-alarm', {
      alarmName: 'webhook-processing-errors',
      alarmDescription: 'Processing Lambda errors',
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 1,
      threshold: 5,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        FunctionName: processingLambda.functionName,
      },
    });

    // SQS backlog alarm
    new CloudwatchMetricAlarm(this, 'sqs-backlog-alarm', {
      alarmName: 'webhook-queue-backlog',
      alarmDescription: 'SQS message backlog',
      metricName: 'ApproximateNumberOfMessagesVisible',
      namespace: 'AWS/SQS',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 1000,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        QueueName: webhookQueue.name,
      },
    });

    // === OUTPUTS ===

    new TerraformOutput(this, 'api-endpoint', {
      value: `${api.id}.execute-api.${region.name}.amazonaws.com/${stage.stageName}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'webhook-endpoint', {
      value: `https://${api.id}.execute-api.${region.name}.amazonaws.com/${stage.stageName}/webhook/{provider}`,
      description: 'Webhook ingestion endpoint',
    });

    new TerraformOutput(this, 'status-endpoint', {
      value: `https://${api.id}.execute-api.${region.name}.amazonaws.com/${stage.stageName}/status/{transactionId}`,
      description: 'Transaction status endpoint',
    });

    new TerraformOutput(this, 'table-name', {
      value: transactionTable.name,
      description: 'DynamoDB table name',
    });

    new TerraformOutput(this, 'bucket-name', {
      value: webhookBucket.bucket,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 'queue-url', {
      value: webhookQueue.url,
      description: 'SQS queue URL',
    });
  }
}

const app = new App();
new WebhookStack(app, 'webhook-processor-stack');
app.synth();
```

## Key Implementation Details

### **Architecture Flow**

1. **Ingestion**: API Gateway receives webhooks and forwards to Ingestion Lambda
2. **Queuing**: Ingestion Lambda adds messages to SQS with correlation IDs
3. **Processing**: Processing Lambda consumes from SQS, stores in DynamoDB and S3
4. **Status**: Status Lambda queries DynamoDB for transaction status

### **Security Features**

- Least privilege IAM roles for each Lambda
- S3 bucket with encryption and public access blocked
- DynamoDB with encryption at rest
- API Gateway with AWS_IAM auth for status endpoint

### **Reliability Features**

- SQS with DLQ for failed messages (3 retries)
- Reserved concurrency to prevent throttling
- Structured logging with correlation IDs
- CloudWatch alarms for errors and backlog

### **Cost Optimization**

- ARM64 (Graviton2) processors for better price/performance
- On-demand DynamoDB billing
- S3 lifecycle policy for archiving old data
- Appropriate Lambda memory sizes

### **Production Readiness**

- Request validation in API Gateway
- Throttling at 1000 req/s to prevent abuse
- 7-day log retention
- Point-in-time recovery for DynamoDB
- Versioning enabled on S3

## Usage

```bash
# Install dependencies
npm install cdktf @cdktf/provider-aws adm-zip

# Deploy
cdktf deploy

# Test webhook endpoint
curl -X POST https://{api-id}.execute-api.{region}.amazonaws.com/v1/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.completed", "amount": 100}'

# Check status (requires AWS IAM auth)
aws apigateway test-invoke-method \
  --rest-api-id {api-id} \
  --resource-id {resource-id} \
  --http-method GET \
  --path-with-query-string "/status/{transactionId}"
```

This implementation provides a complete, production-ready serverless webhook processing system with all requested features including monitoring, security, and cost optimization.
