# MODEL_RESPONSE: Serverless Financial Data Processing Pipeline

This response provides a complete Pulumi TypeScript implementation for a serverless financial analytics data processing pipeline.

## File: Pulumi.yaml

```yaml
name: market-analytics-pipeline
runtime: nodejs
description: Serverless data processing pipeline for financial analytics
```

## File: package.json

```json
{
  "name": "market-analytics-pipeline",
  "version": "1.0.0",
  "description": "Serverless financial data processing pipeline",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
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
    "outDir": "bin",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin"]
}
```

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

// Environment suffix for resource naming
const environmentSuffix = pulumi.getStack() || "dev";

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
  redrivePolicy: pulumi.interpolate`{
    "deadLetterTargetArn": "${deadLetterQueue.arn}",
    "maxReceiveCount": 3
  }`,
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
        Effect: "Allow",
        Action: ["sqs:SendMessage"],
        Resource: queueArn,
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:PutItem", "dynamodb:UpdateItem"],
        Resource: tableArn,
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
        Effect: "Allow",
        Action: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
        Resource: tableArn,
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

// DataIngestion Lambda
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

// DataAggregator Lambda
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

// ===== CloudWatch Metric Filters =====
const errorMetricFilter = new aws.cloudwatch.LogMetricFilter(`error-filter-${environmentSuffix}`, {
  name: `ErrorMetricFilter-${environmentSuffix}`,
  logGroupName: dataIngestionLogGroup.name,
  pattern: "[ERROR, Exception]",
  metricTransformation: {
    name: "ErrorCount",
    namespace: "MarketAnalytics",
    value: "1",
  },
});

// ===== Exports =====
export const apiGatewayUrl = pulumi.interpolate`${api.executionArn}/prod/ingest`;
export const s3BucketName = marketDataBucket.bucket;
export const dynamodbTableArn = marketDataTable.arn;
```

## File: lambda/dataIngestion.js

```javascript
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log("DataIngestion triggered", JSON.stringify(event));

  try {
    // Process S3 event
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;

      console.log(`Processing file: ${bucket}/${key}`);

      // Simulate data processing
      const marketData = {
        symbol: key.split('/')[0] || 'UNKNOWN',
        timestamp: Date.now(),
        source: bucket,
        key: key,
      };

      // Send message to SQS
      const sqsParams = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(marketData),
      };

      await sqsClient.send(new SendMessageCommand(sqsParams));
      console.log("Message sent to SQS");

      // Store initial state in DynamoDB
      const dynamoParams = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
          symbol: { S: marketData.symbol },
          timestamp: { N: marketData.timestamp.toString() },
          status: { S: "ingested" },
          source: { S: bucket },
          key: { S: key },
        },
      };

      await dynamoClient.send(new PutItemCommand(dynamoParams));
      console.log("Data stored in DynamoDB");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data ingestion successful" }),
    };
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
};
```

## File: lambda/dataProcessor.js

```javascript
const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");

const dynamoClient = new DynamoDBClient({});
const eventBridgeClient = new EventBridgeClient({});

exports.handler = async (event) => {
  console.log("DataProcessor triggered", JSON.stringify(event));

  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      console.log("Processing message:", message);

      // Update DynamoDB state
      const updateParams = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
          symbol: { S: message.symbol },
          timestamp: { N: message.timestamp.toString() },
        },
        UpdateExpression: "SET #status = :processed, processedAt = :time",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":processed": { S: "processed" },
          ":time": { N: Date.now().toString() },
        },
      };

      await dynamoClient.send(new UpdateItemCommand(updateParams));
      console.log("DynamoDB updated");

      // Emit custom event to EventBridge
      const eventParams = {
        Entries: [
          {
            Source: "market.data.processor",
            DetailType: "MarketDataProcessed",
            Detail: JSON.stringify({
              symbol: message.symbol,
              timestamp: message.timestamp,
              status: "processed",
            }),
            EventBusName: process.env.EVENT_BUS_NAME || "default",
          },
        ],
      };

      await eventBridgeClient.send(new PutEventsCommand(eventParams));
      console.log("Event emitted to EventBridge");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Processing successful" }),
    };
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
};
```

## File: lambda/dataAggregator.js

```javascript
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");

const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

exports.handler = async (event) => {
  console.log("DataAggregator triggered", JSON.stringify(event));

  try {
    // Scan DynamoDB for processed records
    const scanParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: "#status = :processed",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":processed": { S: "processed" },
      },
    };

    const result = await dynamoClient.send(new ScanCommand(scanParams));
    console.log(`Found ${result.Items.length} processed records`);

    // Aggregate data by symbol
    const symbolCounts = {};
    result.Items.forEach((item) => {
      const symbol = item.symbol.S;
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    console.log("Symbol aggregation:", symbolCounts);

    // Send aggregated metrics to CloudWatch
    const metricData = Object.entries(symbolCounts).map(([symbol, count]) => ({
      MetricName: "ProcessedRecords",
      Dimensions: [
        {
          Name: "Symbol",
          Value: symbol,
        },
      ],
      Value: count,
      Unit: "Count",
      Timestamp: new Date(),
    }));

    if (metricData.length > 0) {
      const metricsParams = {
        Namespace: "MarketAnalytics",
        MetricData: metricData,
      };

      await cloudwatchClient.send(new PutMetricDataCommand(metricsParams));
      console.log("Metrics sent to CloudWatch");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Aggregation successful",
        totalRecords: result.Items.length,
        symbols: Object.keys(symbolCounts).length,
      }),
    };
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
};
```

## File: lambda/package.json

```json
{
  "name": "market-analytics-lambda",
  "version": "1.0.0",
  "description": "Lambda functions for market analytics pipeline",
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-eventbridge": "^3.0.0",
    "@aws-sdk/client-cloudwatch": "^3.0.0"
  }
}
```
