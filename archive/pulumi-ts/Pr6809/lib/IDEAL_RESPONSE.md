# IDEAL_RESPONSE: Corrected Implementation

This document contains the corrected version of the infrastructure code with all issues from MODEL_FAILURES.md resolved.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Environment suffix for resource naming
const environmentSuffix = pulumi.getStack() || "dev";
const region = "us-east-1";

// Common tags for all resources
const commonTags = {
  Environment: "Production",
  Project: "MarketAnalytics",
};

// ===== S3 Bucket for Raw Data Ingestion =====
const marketDataBucket = new aws.s3.Bucket(`market-data-${environmentSuffix}`, {
  bucket: `market-data-${environmentSuffix}`,
  tags: commonTags,
  versioning: {
    enabled: true,
  },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: "AES256",
      },
    },
  },
  lifecycleRules: [
    {
      enabled: true,
      expiration: {
        days: 30,
      },
    },
  ],
});

// ===== DynamoDB Table for State Management =====
const marketDataTable = new aws.dynamodb.Table(`MarketDataState-${environmentSuffix}`, {
  name: `MarketDataState-${environmentSuffix}`,
  billingMode: "PAY_PER_REQUEST",
  hashKey: "symbol",
  rangeKey: "timestamp",
  attributes: [
    { name: "symbol", type: "S" },
    { name: "timestamp", type: "N" },
  ],
  pointInTimeRecovery: {
    enabled: true,
  },
  tags: commonTags,
});

// ===== SQS Queues =====
const deadLetterQueue = new aws.sqs.Queue(`ProcessingDLQ-${environmentSuffix}`, {
  name: `ProcessingDLQ-${environmentSuffix}`,
  messageRetentionSeconds: 1209600, // 14 days
  tags: commonTags,
});

const processingQueue = new aws.sqs.Queue(`ProcessingQueue-${environmentSuffix}`, {
  name: `ProcessingQueue-${environmentSuffix}`,
  messageRetentionSeconds: 345600, // 4 days
  visibilityTimeoutSeconds: 300, // 5 minutes
  redrivePolicy: deadLetterQueue.arn.apply(arn => JSON.stringify({
    deadLetterTargetArn: arn,
    maxReceiveCount: 3,
  })),
  tags: commonTags,
});

// ===== IAM Roles for Lambda Functions =====

// DataIngestion Lambda Role
const dataIngestionRole = new aws.iam.Role(`DataIngestion-Role-${environmentSuffix}`, {
  name: `DataIngestion-Role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: {
        Service: "lambda.amazonaws.com",
      },
    }],
  }),
  tags: commonTags,
});

// Attach policies to DataIngestion role
new aws.iam.RolePolicyAttachment(`DataIngestion-LambdaBasic-${environmentSuffix}`, {
  role: dataIngestionRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

new aws.iam.RolePolicyAttachment(`DataIngestion-XRay-${environmentSuffix}`, {
  role: dataIngestionRole.name,
  policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
});

const dataIngestionPolicy = new aws.iam.RolePolicy(`DataIngestion-Policy-${environmentSuffix}`, {
  role: dataIngestionRole.id,
  policy: pulumi.all([marketDataBucket.arn, processingQueue.arn, marketDataTable.arn]).apply(([bucketArn, queueArn, tableArn]) => JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:GetObjectVersion"],
        Resource: `${bucketArn}/*`,
      },
      {
        Effect: "Deny",
        Action: ["s3:DeleteBucket", "s3:DeleteObject", "s3:PutBucketPolicy"],
        Resource: "*",
      },
      {
        Effect: "Allow",
        Action: ["sqs:SendMessage"],
        Resource: queueArn,
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:PutItem", "dynamodb:UpdateItem"],
        Resource: tableArn,
      },
      {
        Effect: "Deny",
        Action: ["dynamodb:DeleteTable", "dynamodb:DeleteItem"],
        Resource: "*",
      },
    ],
  })),
});

// DataProcessor Lambda Role
const dataProcessorRole = new aws.iam.Role(`DataProcessor-Role-${environmentSuffix}`, {
  name: `DataProcessor-Role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: {
        Service: "lambda.amazonaws.com",
      },
    }],
  }),
  tags: commonTags,
});

new aws.iam.RolePolicyAttachment(`DataProcessor-LambdaBasic-${environmentSuffix}`, {
  role: dataProcessorRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

new aws.iam.RolePolicyAttachment(`DataProcessor-XRay-${environmentSuffix}`, {
  role: dataProcessorRole.name,
  policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
});

const dataProcessorPolicy = new aws.iam.RolePolicy(`DataProcessor-Policy-${environmentSuffix}`, {
  role: dataProcessorRole.id,
  policy: pulumi.all([processingQueue.arn, marketDataTable.arn]).apply(([queueArn, tableArn]) => JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
        Resource: queueArn,
      },
      {
        Effect: "Deny",
        Action: ["sqs:DeleteQueue", "sqs:PurgeQueue"],
        Resource: "*",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
        Resource: tableArn,
      },
      {
        Effect: "Deny",
        Action: ["dynamodb:DeleteTable", "dynamodb:DeleteItem"],
        Resource: "*",
      },
      {
        Effect: "Allow",
        Action: ["events:PutEvents"],
        Resource: "*",
      },
    ],
  })),
});

// DataAggregator Lambda Role
const dataAggregatorRole = new aws.iam.Role(`DataAggregator-Role-${environmentSuffix}`, {
  name: `DataAggregator-Role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: {
        Service: "lambda.amazonaws.com",
      },
    }],
  }),
  tags: commonTags,
});

new aws.iam.RolePolicyAttachment(`DataAggregator-LambdaBasic-${environmentSuffix}`, {
  role: dataAggregatorRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

new aws.iam.RolePolicyAttachment(`DataAggregator-XRay-${environmentSuffix}`, {
  role: dataAggregatorRole.name,
  policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
});

const dataAggregatorPolicy = new aws.iam.RolePolicy(`DataAggregator-Policy-${environmentSuffix}`, {
  role: dataAggregatorRole.id,
  policy: pulumi.all([marketDataTable.arn]).apply(([tableArn]) => JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"],
        Resource: tableArn,
      },
      {
        Effect: "Deny",
        Action: ["dynamodb:DeleteTable", "dynamodb:DeleteItem"],
        Resource: "*",
      },
      {
        Effect: "Allow",
        Action: ["cloudwatch:PutMetricData"],
        Resource: "*",
      },
    ],
  })),
});

// ===== CloudWatch Log Groups =====
const dataIngestionLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/DataIngestion-${environmentSuffix}`, {
  name: `/aws/lambda/DataIngestion-${environmentSuffix}`,
  retentionInDays: 7,
  tags: commonTags,
});

const dataProcessorLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/DataProcessor-${environmentSuffix}`, {
  name: `/aws/lambda/DataProcessor-${environmentSuffix}`,
  retentionInDays: 7,
  tags: commonTags,
});

const dataAggregatorLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/DataAggregator-${environmentSuffix}`, {
  name: `/aws/lambda/DataAggregator-${environmentSuffix}`,
  retentionInDays: 7,
  tags: commonTags,
});

// ===== Lambda Functions =====

// DataIngestion Lambda (FIXED: Added dead letter queue)
const dataIngestionLambda = new aws.lambda.Function(`DataIngestion-${environmentSuffix}`, {
  name: `DataIngestion-${environmentSuffix}`,
  runtime: "nodejs18.x",
  handler: "dataIngestion.handler",
  role: dataIngestionRole.arn,
  memorySize: 3008,
  timeout: 300,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda"),
  }),
  environment: {
    variables: {
      SQS_QUEUE_URL: processingQueue.url,
      DYNAMODB_TABLE_NAME: marketDataTable.name,
    },
  },
  tracingConfig: {
    mode: "Active",
  },
  deadLetterConfig: {
    targetArn: deadLetterQueue.arn,
  },
  tags: commonTags,
}, { dependsOn: [dataIngestionLogGroup] });

// S3 bucket notification to trigger DataIngestion Lambda
const allowS3Invocation = new aws.lambda.Permission(`DataIngestion-S3Permission-${environmentSuffix}`, {
  action: "lambda:InvokeFunction",
  function: dataIngestionLambda.arn,
  principal: "s3.amazonaws.com",
  sourceArn: marketDataBucket.arn,
});

const bucketNotification = new aws.s3.BucketNotification(`market-data-notification-${environmentSuffix}`, {
  bucket: marketDataBucket.id,
  lambdaFunctions: [{
    lambdaFunctionArn: dataIngestionLambda.arn,
    events: ["s3:ObjectCreated:*"],
  }],
}, { dependsOn: [allowS3Invocation] });

// DataProcessor Lambda
const dataProcessorLambda = new aws.lambda.Function(`DataProcessor-${environmentSuffix}`, {
  name: `DataProcessor-${environmentSuffix}`,
  runtime: "nodejs18.x",
  handler: "dataProcessor.handler",
  role: dataProcessorRole.arn,
  memorySize: 3008,
  timeout: 300,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda"),
  }),
  environment: {
    variables: {
      DYNAMODB_TABLE_NAME: marketDataTable.name,
      EVENT_BUS_NAME: "default",
    },
  },
  tracingConfig: {
    mode: "Active",
  },
  tags: commonTags,
}, { dependsOn: [dataProcessorLogGroup] });

// SQS trigger for DataProcessor Lambda
const sqsEventSourceMapping = new aws.lambda.EventSourceMapping(`DataProcessor-SQS-${environmentSuffix}`, {
  eventSourceArn: processingQueue.arn,
  functionName: dataProcessorLambda.name,
  batchSize: 10,
});

// DataAggregator Lambda (FIXED: Added dead letter queue)
const dataAggregatorLambda = new aws.lambda.Function(`DataAggregator-${environmentSuffix}`, {
  name: `DataAggregator-${environmentSuffix}`,
  runtime: "nodejs18.x",
  handler: "dataAggregator.handler",
  role: dataAggregatorRole.arn,
  memorySize: 3008,
  timeout: 300,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda"),
  }),
  environment: {
    variables: {
      DYNAMODB_TABLE_NAME: marketDataTable.name,
    },
  },
  tracingConfig: {
    mode: "Active",
  },
  deadLetterConfig: {
    targetArn: deadLetterQueue.arn,
  },
  tags: commonTags,
}, { dependsOn: [dataAggregatorLogGroup] });

// ===== EventBridge Rules =====

// Scheduled rule for DataAggregator (every 5 minutes)
const scheduledRule = new aws.cloudwatch.EventRule(`DataAggregator-Schedule-${environmentSuffix}`, {
  name: `DataAggregator-Schedule-${environmentSuffix}`,
  description: "Trigger DataAggregator every 5 minutes",
  scheduleExpression: "rate(5 minutes)",
  tags: commonTags,
});

const allowEventBridgeInvocation = new aws.lambda.Permission(`DataAggregator-EventBridge-${environmentSuffix}`, {
  action: "lambda:InvokeFunction",
  function: dataAggregatorLambda.arn,
  principal: "events.amazonaws.com",
  sourceArn: scheduledRule.arn,
});

const scheduledTarget = new aws.cloudwatch.EventTarget(`DataAggregator-Target-${environmentSuffix}`, {
  rule: scheduledRule.name,
  arn: dataAggregatorLambda.arn,
}, { dependsOn: [allowEventBridgeInvocation] });

// ===== API Gateway =====

// REST API
const api = new aws.apigateway.RestApi(`MarketDataAPI-${environmentSuffix}`, {
  name: `MarketDataAPI-${environmentSuffix}`,
  description: "Market Data Ingestion API",
  tags: commonTags,
});

// /ingest resource
const ingestResource = new aws.apigateway.Resource(`ingest-resource-${environmentSuffix}`, {
  restApi: api.id,
  parentId: api.rootResourceId,
  pathPart: "ingest",
});

// POST method on /ingest
const ingestMethod = new aws.apigateway.Method(`ingest-post-${environmentSuffix}`, {
  restApi: api.id,
  resourceId: ingestResource.id,
  httpMethod: "POST",
  authorization: "AWS_IAM",
});

// Lambda integration
const apiLambdaPermission = new aws.lambda.Permission(`DataIngestion-APIGateway-${environmentSuffix}`, {
  action: "lambda:InvokeFunction",
  function: dataIngestionLambda.arn,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

const ingestIntegration = new aws.apigateway.Integration(`ingest-integration-${environmentSuffix}`, {
  restApi: api.id,
  resourceId: ingestResource.id,
  httpMethod: ingestMethod.httpMethod,
  integrationHttpMethod: "POST",
  type: "AWS_PROXY",
  uri: dataIngestionLambda.invokeArn,
}, { dependsOn: [apiLambdaPermission] });

// Deployment
const deployment = new aws.apigateway.Deployment(`api-deployment-${environmentSuffix}`, {
  restApi: api.id,
  stageName: "prod",
}, { dependsOn: [ingestIntegration] });

// Stage with throttling
const apiStage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
  deployment: deployment.id,
  restApi: api.id,
  stageName: "prod",
  tags: commonTags,
});

const apiMethodSettings = new aws.apigateway.MethodSettings(`api-throttle-${environmentSuffix}`, {
  restApi: api.id,
  stageName: apiStage.stageName,
  methodPath: "*/*",
  settings: {
    throttlingBurstLimit: 10000,
    throttlingRateLimit: 10000,
  },
});

// ===== CloudWatch Metric Filters (FIXED: Corrected pattern and added for all functions) =====
const dataIngestionErrorFilter = new aws.cloudwatch.LogMetricFilter(`DataIngestion-error-filter-${environmentSuffix}`, {
  name: `DataIngestion-ErrorFilter-${environmentSuffix}`,
  logGroupName: dataIngestionLogGroup.name,
  pattern: '?ERROR ?Exception',
  metricTransformation: {
    name: "DataIngestionErrorCount",
    namespace: "MarketAnalytics",
    value: "1",
  },
});

const dataProcessorErrorFilter = new aws.cloudwatch.LogMetricFilter(`DataProcessor-error-filter-${environmentSuffix}`, {
  name: `DataProcessor-ErrorFilter-${environmentSuffix}`,
  logGroupName: dataProcessorLogGroup.name,
  pattern: '?ERROR ?Exception',
  metricTransformation: {
    name: "DataProcessorErrorCount",
    namespace: "MarketAnalytics",
    value: "1",
  },
});

const dataAggregatorErrorFilter = new aws.cloudwatch.LogMetricFilter(`DataAggregator-error-filter-${environmentSuffix}`, {
  name: `DataAggregator-ErrorFilter-${environmentSuffix}`,
  logGroupName: dataAggregatorLogGroup.name,
  pattern: '?ERROR ?Exception',
  metricTransformation: {
    name: "DataAggregatorErrorCount",
    namespace: "MarketAnalytics",
    value: "1",
  },
});

// ===== Exports (FIXED: Corrected API Gateway URL) =====
export const apiGatewayUrl = pulumi.interpolate`https://${api.id}.execute-api.${region}.amazonaws.com/prod/ingest`;
export const s3BucketName = marketDataBucket.bucket;
export const dynamodbTableArn = marketDataTable.arn;
```

## Summary of Corrections

1. **API Gateway URL Export**: Changed from `executionArn` to proper invoke URL format
2. **Dead Letter Queue for DataIngestion Lambda**: Added `deadLetterConfig` to catch S3-triggered failures
3. **Dead Letter Queue for DataAggregator Lambda**: Added `deadLetterConfig` to catch EventBridge-triggered failures
4. **IAM Explicit Deny Statements**: Added explicit Deny statements to all three IAM role policies
5. **CloudWatch Metric Filter Pattern**: Corrected from `[ERROR, Exception]` to `?ERROR ?Exception`
6. **Metric Filters for All Functions**: Added error metric filters for DataProcessor and DataAggregator
7. **SQS Redrive Policy**: Changed from string template to proper `apply()` method for better type safety

All issues identified in MODEL_FAILURES.md have been resolved in this corrected implementation.
