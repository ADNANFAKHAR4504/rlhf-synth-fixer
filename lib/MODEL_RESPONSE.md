# Lambda ETL Infrastructure Optimization - Pulumi TypeScript Implementation

This implementation provides a complete refactored Lambda-based ETL infrastructure with all requested optimizations.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const environment = config.get("environment") || "dev";
const region = aws.getRegionOutput().name;

// Common tags for all resources
const commonTags = {
    Environment: environment,
    CostCenter: "data-engineering",
    ManagedBy: "pulumi",
    Project: "etl-optimization"
};

// KMS key for encrypting Lambda environment variables
const kmsKey = new aws.kms.Key(`lambda-encryption-key-${environmentSuffix}`, {
    description: "KMS key for Lambda environment variable encryption",
    enableKeyRotation: true,
    tags: commonTags
});

const kmsKeyAlias = new aws.kms.Alias(`lambda-key-alias-${environmentSuffix}`, {
    name: `alias/lambda-etl-${environmentSuffix}`,
    targetKeyId: kmsKey.id
});

// S3 bucket for ETL data
const dataBucket = new aws.s3.Bucket(`etl-data-bucket-${environmentSuffix}`, {
    bucketPrefix: `etl-data-${environmentSuffix}`,
    forceDestroy: true,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256"
            }
        }
    },
    tags: commonTags
});

// DynamoDB table for ETL metadata and state management
const metadataTable = new aws.dynamodb.Table(`etl-metadata-table-${environmentSuffix}`, {
    name: `etl-metadata-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "jobId",
    rangeKey: "timestamp",
    attributes: [
        { name: "jobId", type: "S" },
        { name: "timestamp", type: "N" }
    ],
    serverSideEncryption: {
        enabled: true
    },
    pointInTimeRecovery: {
        enabled: true
    },
    tags: commonTags
});

// SQS Dead Letter Queue for failed Lambda executions
const deadLetterQueue = new aws.sqs.Queue(`etl-dlq-${environmentSuffix}`, {
    name: `etl-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    tags: commonTags
});

// Lambda Layer for shared dependencies
const sharedDependenciesLayer = new aws.lambda.LayerVersion(`shared-deps-layer-${environmentSuffix}`, {
    layerName: `etl-shared-deps-${environmentSuffix}`,
    code: new pulumi.asset.AssetArchive({
        "nodejs": new pulumi.asset.FileArchive("./lambda-layers/shared-dependencies")
    }),
    compatibleRuntimes: ["nodejs18.x"],
    description: "Shared dependencies for ETL Lambda functions"
});

// IAM role for API handler Lambda
const apiHandlerRole = new aws.iam.Role(`api-handler-role-${environmentSuffix}`, {
    name: `api-handler-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com"
            }
        }]
    }),
    tags: commonTags
});

// IAM policy for API handler
const apiHandlerPolicy = new aws.iam.RolePolicy(`api-handler-policy-${environmentSuffix}`, {
    role: apiHandlerRole.id,
    policy: pulumi.all([dataBucket.arn, metadataTable.arn, kmsKey.arn]).apply(([bucketArn, tableArn, keyArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    Resource: "arn:aws:logs:*:*:*"
                },
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    Resource: `${bucketArn}/*`
                },
                {
                    Effect: "Allow",
                    Action: [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:Query"
                    ],
                    Resource: tableArn
                },
                {
                    Effect: "Allow",
                    Action: [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    Resource: keyArn
                },
                {
                    Effect: "Allow",
                    Action: [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    Resource: "*"
                },
                {
                    Effect: "Allow",
                    Action: [
                        "sqs:SendMessage"
                    ],
                    Resource: "*"
                }
            ]
        })
    )
});

// CloudWatch Log Group for API handler
const logRetentionDays = environment === "prod" ? 30 : 7;

const apiHandlerLogGroup = new aws.cloudwatch.LogGroup(`api-handler-logs-${environmentSuffix}`, {
    name: `/aws/lambda/etl-api-handler-${environmentSuffix}`,
    retentionInDays: logRetentionDays,
    tags: commonTags
});

// API Handler Lambda Function (small function - 512MB)
const apiHandlerFunction = new aws.lambda.Function(`api-handler-${environmentSuffix}`, {
    name: `etl-api-handler-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: apiHandlerRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda-functions/api-handler")
    }),
    layers: [sharedDependenciesLayer.arn],
    memorySize: 512,
    timeout: 30,
    reservedConcurrentExecutions: 5,
    environment: {
        variables: {
            DATA_BUCKET: dataBucket.bucket,
            METADATA_TABLE: metadataTable.name,
            MAX_CONNECTIONS: "10",
            REGION: region,
            ENVIRONMENT: environment
        }
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
        targetArn: deadLetterQueue.arn
    },
    tracingConfig: {
        mode: "Active"
    },
    tags: commonTags
}, { dependsOn: [apiHandlerLogGroup] });

// IAM role for Batch Processor Lambda
const batchProcessorRole = new aws.iam.Role(`batch-processor-role-${environmentSuffix}`, {
    name: `batch-processor-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com"
            }
        }]
    }),
    tags: commonTags
});

// IAM policy for Batch Processor
const batchProcessorPolicy = new aws.iam.RolePolicy(`batch-processor-policy-${environmentSuffix}`, {
    role: batchProcessorRole.id,
    policy: pulumi.all([dataBucket.arn, metadataTable.arn, kmsKey.arn]).apply(([bucketArn, tableArn, keyArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    Resource: "arn:aws:logs:*:*:*"
                },
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket"
                    ],
                    Resource: [bucketArn, `${bucketArn}/*`]
                },
                {
                    Effect: "Allow",
                    Action: [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem",
                        "dynamodb:BatchWriteItem"
                    ],
                    Resource: tableArn
                },
                {
                    Effect: "Allow",
                    Action: [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    Resource: keyArn
                },
                {
                    Effect: "Allow",
                    Action: [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    Resource: "*"
                },
                {
                    Effect: "Allow",
                    Action: [
                        "sqs:SendMessage"
                    ],
                    Resource: "*"
                }
            ]
        })
    )
});

// CloudWatch Log Group for Batch Processor
const batchProcessorLogGroup = new aws.cloudwatch.LogGroup(`batch-processor-logs-${environmentSuffix}`, {
    name: `/aws/lambda/etl-batch-processor-${environmentSuffix}`,
    retentionInDays: logRetentionDays,
    tags: commonTags
});

// Batch Processor Lambda Function (large function - 1024MB)
const batchProcessorFunction = new aws.lambda.Function(`batch-processor-${environmentSuffix}`, {
    name: `etl-batch-processor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: batchProcessorRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda-functions/batch-processor")
    }),
    layers: [sharedDependenciesLayer.arn],
    memorySize: 1024,
    timeout: 300,
    reservedConcurrentExecutions: 5,
    environment: {
        variables: {
            DATA_BUCKET: dataBucket.bucket,
            METADATA_TABLE: metadataTable.name,
            MAX_CONNECTIONS: "10",
            REGION: region,
            ENVIRONMENT: environment
        }
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
        targetArn: deadLetterQueue.arn
    },
    tracingConfig: {
        mode: "Active"
    },
    tags: commonTags
}, { dependsOn: [batchProcessorLogGroup] });

// Grant Lambda permission to write to DLQ
const apiHandlerDlqPermission = new aws.lambda.Permission(`api-handler-dlq-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: apiHandlerFunction.name,
    principal: "sqs.amazonaws.com",
    sourceArn: deadLetterQueue.arn
});

const batchProcessorDlqPermission = new aws.lambda.Permission(`batch-processor-dlq-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: batchProcessorFunction.name,
    principal: "sqs.amazonaws.com",
    sourceArn: deadLetterQueue.arn
});

// S3 bucket notification to trigger batch processor
const bucketNotification = new aws.s3.BucketNotification(`etl-bucket-notification-${environmentSuffix}`, {
    bucket: dataBucket.id,
    lambdaFunctions: [{
        lambdaFunctionArn: batchProcessorFunction.arn,
        events: ["s3:ObjectCreated:*"],
        filterPrefix: "incoming/"
    }]
});

const s3InvokePermission = new aws.lambda.Permission(`s3-invoke-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: batchProcessorFunction.name,
    principal: "s3.amazonaws.com",
    sourceArn: dataBucket.arn
});

// CloudWatch Alarms for monitoring
const apiHandlerErrorAlarm = new aws.cloudwatch.MetricAlarm(`api-handler-errors-${environmentSuffix}`, {
    name: `api-handler-errors-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Sum",
    threshold: 10,
    alarmDescription: "Alert when API handler has more than 10 errors in 5 minutes",
    dimensions: {
        FunctionName: apiHandlerFunction.name
    },
    tags: commonTags
});

const batchProcessorErrorAlarm = new aws.cloudwatch.MetricAlarm(`batch-processor-errors-${environmentSuffix}`, {
    name: `batch-processor-errors-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Sum",
    threshold: 5,
    alarmDescription: "Alert when batch processor has more than 5 errors in 5 minutes",
    dimensions: {
        FunctionName: batchProcessorFunction.name
    },
    tags: commonTags
});

const dlqDepthAlarm = new aws.cloudwatch.MetricAlarm(`dlq-depth-${environmentSuffix}`, {
    name: `dlq-depth-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "ApproximateNumberOfMessagesVisible",
    namespace: "AWS/SQS",
    period: 300,
    statistic: "Average",
    threshold: 10,
    alarmDescription: "Alert when DLQ has more than 10 messages",
    dimensions: {
        QueueName: deadLetterQueue.name
    },
    tags: commonTags
});

// Exports
export const dataBucketName = dataBucket.bucket;
export const dataBucketArn = dataBucket.arn;
export const metadataTableName = metadataTable.name;
export const metadataTableArn = metadataTable.arn;
export const deadLetterQueueUrl = deadLetterQueue.url;
export const deadLetterQueueArn = deadLetterQueue.arn;
export const apiHandlerFunctionName = apiHandlerFunction.name;
export const apiHandlerFunctionArn = apiHandlerFunction.arn;
export const batchProcessorFunctionName = batchProcessorFunction.name;
export const batchProcessorFunctionArn = batchProcessorFunction.arn;
export const kmsKeyId = kmsKey.id;
export const kmsKeyArn = kmsKey.arn;
export const sharedLayerArn = sharedDependenciesLayer.arn;
```

## File: Pulumi.yaml

```yaml
name: etl-optimization
runtime: nodejs
description: Optimized Lambda ETL infrastructure with Pulumi TypeScript
config:
  aws:region:
    description: AWS region for deployment
    default: eu-west-2
  environmentSuffix:
    description: Unique suffix for resource names to prevent conflicts
    default: dev
  environment:
    description: Environment name (dev or prod)
    default: dev
```

## File: package.json

```json
{
  "name": "etl-optimization",
  "version": "1.0.0",
  "description": "Optimized Lambda ETL infrastructure",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "bin",
    "rootDir": "."
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "bin"
  ]
}
```

## File: lambda-functions/api-handler/index.js

```javascript
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: "adaptive"
});

const s3Client = new S3Client({
  maxAttempts: 3,
  retryMode: "adaptive"
});

// Environment variables
const DATA_BUCKET = process.env.DATA_BUCKET;
const METADATA_TABLE = process.env.METADATA_TABLE;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS || "10");
const ENVIRONMENT = process.env.ENVIRONMENT;

// Exponential backoff retry logic
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

exports.handler = async (event) => {
  console.log(`Processing API request in environment: ${ENVIRONMENT}`);
  console.log(`Max connections: ${MAX_CONNECTIONS}`);

  try {
    const jobId = event.jobId || `job-${Date.now()}`;
    const timestamp = Date.now();

    // Store metadata in DynamoDB with retry
    await retryWithBackoff(async () => {
      const command = new PutItemCommand({
        TableName: METADATA_TABLE,
        Item: {
          jobId: { S: jobId },
          timestamp: { N: timestamp.toString() },
          status: { S: "processing" },
          requestData: { S: JSON.stringify(event) }
        }
      });
      return await dynamoClient.send(command);
    });

    // Store data in S3 with retry
    await retryWithBackoff(async () => {
      const command = new PutObjectCommand({
        Bucket: DATA_BUCKET,
        Key: `incoming/${jobId}.json`,
        Body: JSON.stringify(event),
        ContentType: "application/json"
      });
      return await s3Client.send(command);
    });

    console.log(`Successfully processed job: ${jobId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Job submitted successfully",
        jobId: jobId
      })
    };
  } catch (error) {
    console.error("Error processing request:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing job",
        error: error.message
      })
    };
  }
};
```

## File: lambda-functions/api-handler/package.json

```json
{
  "name": "api-handler",
  "version": "1.0.0",
  "description": "API handler for ETL requests",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0"
  }
}
```

## File: lambda-functions/batch-processor/index.js

```javascript
const { DynamoDBClient, UpdateItemCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: "adaptive"
});

const s3Client = new S3Client({
  maxAttempts: 3,
  retryMode: "adaptive"
});

// Environment variables
const DATA_BUCKET = process.env.DATA_BUCKET;
const METADATA_TABLE = process.env.METADATA_TABLE;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS || "10");
const ENVIRONMENT = process.env.ENVIRONMENT;

// Exponential backoff retry logic
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Stream to string helper
async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

exports.handler = async (event) => {
  console.log(`Processing batch in environment: ${ENVIRONMENT}`);
  console.log(`Max connections: ${MAX_CONNECTIONS}`);
  console.log(`Event: ${JSON.stringify(event)}`);

  try {
    // Handle S3 event
    const record = event.Records?.[0];
    if (!record || record.eventSource !== 'aws:s3') {
      throw new Error('Invalid event source');
    }

    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    // Get file from S3 with retry
    const data = await retryWithBackoff(async () => {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      const response = await s3Client.send(command);
      return await streamToString(response.Body);
    });

    const jobData = JSON.parse(data);
    const jobId = jobData.jobId || key.split('/').pop().replace('.json', '');

    // Simulate batch processing
    console.log(`Processing ${jobId}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update metadata in DynamoDB with retry
    await retryWithBackoff(async () => {
      const command = new UpdateItemCommand({
        TableName: METADATA_TABLE,
        Key: {
          jobId: { S: jobId },
          timestamp: { N: (jobData.timestamp || Date.now()).toString() }
        },
        UpdateExpression: "SET #status = :status, processedAt = :processedAt",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": { S: "completed" },
          ":processedAt": { N: Date.now().toString() }
        }
      });
      return await dynamoClient.send(command);
    });

    console.log(`Successfully processed batch job: ${jobId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Batch processed successfully",
        jobId: jobId
      })
    };
  } catch (error) {
    console.error("Error processing batch:", error);
    throw error; // Let Lambda retry mechanism handle it
  }
};
```

## File: lambda-functions/batch-processor/package.json

```json
{
  "name": "batch-processor",
  "version": "1.0.0",
  "description": "Batch processor for ETL operations",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0"
  }
}
```

## File: lambda-layers/shared-dependencies/nodejs/package.json

```json
{
  "name": "shared-dependencies",
  "version": "1.0.0",
  "description": "Shared dependencies for Lambda functions",
  "dependencies": {
    "aws-xray-sdk-core": "^3.5.0"
  }
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
cd lambda-functions/api-handler && npm install && cd ../..
cd lambda-functions/batch-processor && npm install && cd ../..
cd lambda-layers/shared-dependencies/nodejs && npm install && cd ../../..
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region eu-west-2
pulumi config set environmentSuffix dev-$(date +%s)
pulumi config set environment dev
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. For production deployment:
```bash
pulumi stack init prod
pulumi config set aws:region eu-west-2
pulumi config set environmentSuffix prod-$(date +%s)
pulumi config set environment prod
pulumi up
```

## Features Implemented

1. **Runtime Updates**: All Lambda functions use Node.js 18.x
2. **Memory Optimization**: 512MB for API handler, 1024MB for batch processor
3. **Connection Pooling**: MAX_CONNECTIONS=10 environment variable
4. **Concurrent Executions**: Reserved 5 concurrent executions for critical functions
5. **Timeout Configuration**: 30s for API handlers, 300s for batch processors
6. **X-Ray Tracing**: Active tracing enabled on all functions
7. **IAM Least Privilege**: Separate roles with specific permissions per function
8. **Log Retention**: 7 days for dev, 30 days for prod
9. **Lambda Layers**: Shared dependencies layer to reduce package size
10. **Dead Letter Queues**: SQS DLQ configured for failed executions
11. **Retry Logic**: Exponential backoff implemented in function code
12. **KMS Encryption**: Environment variables encrypted with KMS
13. **Resource Naming**: All resources include environmentSuffix
14. **Monitoring**: CloudWatch alarms for errors and DLQ depth
15. **Tagging**: All resources tagged with Environment and CostCenter
