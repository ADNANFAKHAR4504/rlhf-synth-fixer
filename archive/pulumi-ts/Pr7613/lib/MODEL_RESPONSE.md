# Pulumi TypeScript: Lambda ETL Infrastructure Optimization

This implementation refactors and optimizes a Lambda-based ETL infrastructure with Node.js 18.x runtime, proper resource allocation, monitoring, and error handling.

## File: lib/index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

interface LambdaEtlStackProps {
  environmentSuffix: string;
  environment: string; // "dev" or "prod"
}

export class LambdaEtlStack {
  public readonly apiHandlerFunctionArn: pulumi.Output<string>;
  public readonly batchProcessorFunctionArn: pulumi.Output<string>;
  public readonly transformFunctionArn: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly layerArn: pulumi.Output<string>;

  constructor(props: LambdaEtlStackProps) {
    const { environmentSuffix, environment } = props;

    // Determine log retention based on environment
    const logRetentionDays = environment === "prod" ? 30 : 7;

    // Create shared Lambda layer for dependencies
    const sharedLayer = new aws.lambda.LayerVersion(`shared-deps-layer-${environmentSuffix}`, {
      layerName: `shared-deps-layer-${environmentSuffix}`,
      code: new pulumi.asset.AssetArchive({
        "nodejs": new pulumi.asset.FileArchive(path.join(__dirname, "lambda-layers/nodejs")),
      }),
      compatibleRuntimes: ["nodejs18.x"],
      description: "Shared dependencies layer for Lambda functions",
    });

    this.layerArn = sharedLayer.arn;

    // Create Dead Letter Queue for failed executions
    const dlq = new aws.sqs.Queue(`lambda-dlq-${environmentSuffix}`, {
      name: `lambda-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: `lambda-dlq-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    this.dlqUrl = dlq.url;

    // IAM Role for API Handler Lambda
    const apiHandlerRole = new aws.iam.Role(`api-handler-role-${environmentSuffix}`, {
      name: `api-handler-role-${environmentSuffix}`,
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
      tags: {
        Name: `api-handler-role-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(`api-handler-basic-exec-${environmentSuffix}`, {
      role: apiHandlerRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(`api-handler-xray-${environmentSuffix}`, {
      role: apiHandlerRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
    });

    // Attach SQS policy for DLQ
    const apiHandlerSqsPolicy = new aws.iam.RolePolicy(`api-handler-sqs-policy-${environmentSuffix}`, {
      role: apiHandlerRole.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sqs:SendMessage",
            "sqs:GetQueueUrl"
          ],
          "Resource": "${dlq.arn}"
        }]
      }`,
    });

    // CloudWatch Log Group for API Handler
    const apiHandlerLogGroup = new aws.cloudwatch.LogGroup(`api-handler-logs-${environmentSuffix}`, {
      name: `/aws/lambda/api-handler-${environmentSuffix}`,
      retentionInDays: logRetentionDays,
      tags: {
        Name: `api-handler-logs-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    // API Handler Lambda Function (small function - 512MB, 30s timeout)
    const apiHandlerFunction = new aws.lambda.Function(`api-handler-${environmentSuffix}`, {
      name: `api-handler-${environmentSuffix}`,
      runtime: "nodejs18.x",
      handler: "index.handler",
      role: apiHandlerRole.arn,
      code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(path.join(__dirname, "lambda/api-handler")),
      }),
      memorySize: 512,
      timeout: 30,
      reservedConcurrentExecutions: 5,
      layers: [sharedLayer.arn],
      environment: {
        variables: {
          ENVIRONMENT: environment,
          MAX_CONNECTIONS: "10",
          LOG_LEVEL: "INFO",
        },
      },
      deadLetterConfig: {
        targetArn: dlq.arn,
      },
      tracingConfig: {
        mode: "Active",
      },
      tags: {
        Name: `api-handler-${environmentSuffix}`,
        Environment: environment,
        FunctionType: "API",
        ManagedBy: "Pulumi",
      },
    }, { dependsOn: [apiHandlerLogGroup] });

    this.apiHandlerFunctionArn = apiHandlerFunction.arn;

    // IAM Role for Batch Processor Lambda
    const batchProcessorRole = new aws.iam.Role(`batch-processor-role-${environmentSuffix}`, {
      name: `batch-processor-role-${environmentSuffix}`,
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
      tags: {
        Name: `batch-processor-role-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    new aws.iam.RolePolicyAttachment(`batch-processor-basic-exec-${environmentSuffix}`, {
      role: batchProcessorRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    new aws.iam.RolePolicyAttachment(`batch-processor-xray-${environmentSuffix}`, {
      role: batchProcessorRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
    });

    const batchProcessorSqsPolicy = new aws.iam.RolePolicy(`batch-processor-sqs-policy-${environmentSuffix}`, {
      role: batchProcessorRole.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sqs:SendMessage",
            "sqs:GetQueueUrl"
          ],
          "Resource": "${dlq.arn}"
        }]
      }`,
    });

    // CloudWatch Log Group for Batch Processor
    const batchProcessorLogGroup = new aws.cloudwatch.LogGroup(`batch-processor-logs-${environmentSuffix}`, {
      name: `/aws/lambda/batch-processor-${environmentSuffix}`,
      retentionInDays: logRetentionDays,
      tags: {
        Name: `batch-processor-logs-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    // Batch Processor Lambda Function (large function - 1024MB, 5min timeout)
    const batchProcessorFunction = new aws.lambda.Function(`batch-processor-${environmentSuffix}`, {
      name: `batch-processor-${environmentSuffix}`,
      runtime: "nodejs18.x",
      handler: "index.handler",
      role: batchProcessorRole.arn,
      code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(path.join(__dirname, "lambda/batch-processor")),
      }),
      memorySize: 1024,
      timeout: 300,
      reservedConcurrentExecutions: 5,
      layers: [sharedLayer.arn],
      environment: {
        variables: {
          ENVIRONMENT: environment,
          MAX_CONNECTIONS: "10",
          BATCH_SIZE: "100",
          LOG_LEVEL: "INFO",
        },
      },
      deadLetterConfig: {
        targetArn: dlq.arn,
      },
      tracingConfig: {
        mode: "Active",
      },
      tags: {
        Name: `batch-processor-${environmentSuffix}`,
        Environment: environment,
        FunctionType: "Batch",
        ManagedBy: "Pulumi",
      },
    }, { dependsOn: [batchProcessorLogGroup] });

    this.batchProcessorFunctionArn = batchProcessorFunction.arn;

    // IAM Role for Transform Lambda
    const transformRole = new aws.iam.Role(`transform-role-${environmentSuffix}`, {
      name: `transform-role-${environmentSuffix}`,
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
      tags: {
        Name: `transform-role-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    new aws.iam.RolePolicyAttachment(`transform-basic-exec-${environmentSuffix}`, {
      role: transformRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    new aws.iam.RolePolicyAttachment(`transform-xray-${environmentSuffix}`, {
      role: transformRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
    });

    const transformSqsPolicy = new aws.iam.RolePolicy(`transform-sqs-policy-${environmentSuffix}`, {
      role: transformRole.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sqs:SendMessage",
            "sqs:GetQueueUrl"
          ],
          "Resource": "${dlq.arn}"
        }]
      }`,
    });

    // CloudWatch Log Group for Transform
    const transformLogGroup = new aws.cloudwatch.LogGroup(`transform-logs-${environmentSuffix}`, {
      name: `/aws/lambda/transform-${environmentSuffix}`,
      retentionInDays: logRetentionDays,
      tags: {
        Name: `transform-logs-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    // Transform Lambda Function (small function - 512MB, 30s timeout)
    const transformFunction = new aws.lambda.Function(`transform-${environmentSuffix}`, {
      name: `transform-${environmentSuffix}`,
      runtime: "nodejs18.x",
      handler: "index.handler",
      role: transformRole.arn,
      code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(path.join(__dirname, "lambda/transform")),
      }),
      memorySize: 512,
      timeout: 30,
      layers: [sharedLayer.arn],
      environment: {
        variables: {
          ENVIRONMENT: environment,
          MAX_CONNECTIONS: "10",
          LOG_LEVEL: "INFO",
        },
      },
      deadLetterConfig: {
        targetArn: dlq.arn,
      },
      tracingConfig: {
        mode: "Active",
      },
      tags: {
        Name: `transform-${environmentSuffix}`,
        Environment: environment,
        FunctionType: "Transform",
        ManagedBy: "Pulumi",
      },
    }, { dependsOn: [transformLogGroup] });

    this.transformFunctionArn = transformFunction.arn;

    // CloudWatch Alarms for Critical Functions
    const apiHandlerErrorAlarm = new aws.cloudwatch.MetricAlarm(`api-handler-errors-${environmentSuffix}`, {
      name: `api-handler-errors-${environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "Errors",
      namespace: "AWS/Lambda",
      period: 300,
      statistic: "Sum",
      threshold: 5,
      alarmDescription: "Alert when API handler has more than 5 errors in 10 minutes",
      dimensions: {
        FunctionName: apiHandlerFunction.name,
      },
      tags: {
        Name: `api-handler-errors-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    const batchProcessorErrorAlarm = new aws.cloudwatch.MetricAlarm(`batch-processor-errors-${environmentSuffix}`, {
      name: `batch-processor-errors-${environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "Errors",
      namespace: "AWS/Lambda",
      period: 300,
      statistic: "Sum",
      threshold: 3,
      alarmDescription: "Alert when batch processor has more than 3 errors in 10 minutes",
      dimensions: {
        FunctionName: batchProcessorFunction.name,
      },
      tags: {
        Name: `batch-processor-errors-${environmentSuffix}`,
        Environment: environment,
        ManagedBy: "Pulumi",
      },
    });

    // Export important values
    pulumi.export("apiHandlerFunctionName", apiHandlerFunction.name);
    pulumi.export("apiHandlerFunctionArn", apiHandlerFunction.arn);
    pulumi.export("batchProcessorFunctionName", batchProcessorFunction.name);
    pulumi.export("batchProcessorFunctionArn", batchProcessorFunction.arn);
    pulumi.export("transformFunctionName", transformFunction.name);
    pulumi.export("transformFunctionArn", transformFunction.arn);
    pulumi.export("dlqUrl", dlq.url);
    pulumi.export("dlqArn", dlq.arn);
    pulumi.export("sharedLayerArn", sharedLayer.arn);
  }
}
```

## File: lib/lambda/api-handler/index.js

```javascript
// API Handler Lambda Function
// Runtime: Node.js 18.x
// Purpose: Handle API requests with low latency

exports.handler = async (event, context) => {
  // Enable X-Ray tracing
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", JSON.stringify(context, null, 2));

  const { MAX_CONNECTIONS, ENVIRONMENT, LOG_LEVEL } = process.env;

  try {
    // Structured logging for better observability
    console.log(JSON.stringify({
      level: "INFO",
      message: "Processing API request",
      requestId: context.requestId,
      environment: ENVIRONMENT,
      maxConnections: MAX_CONNECTIONS,
    }));

    // Simulate API processing
    const result = {
      statusCode: 200,
      body: JSON.stringify({
        message: "API request processed successfully",
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
      }),
    };

    console.log(JSON.stringify({
      level: "INFO",
      message: "API request completed",
      requestId: context.requestId,
      statusCode: result.statusCode,
    }));

    return result;
  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "API request failed",
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
    }));

    throw error; // This will trigger DLQ
  }
};
```

## File: lib/lambda/batch-processor/index.js

```javascript
// Batch Processor Lambda Function
// Runtime: Node.js 18.x
// Purpose: Process large batches of data with extended timeout

exports.handler = async (event, context) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", JSON.stringify(context, null, 2));

  const { MAX_CONNECTIONS, ENVIRONMENT, BATCH_SIZE, LOG_LEVEL } = process.env;

  try {
    console.log(JSON.stringify({
      level: "INFO",
      message: "Starting batch processing",
      requestId: context.requestId,
      environment: ENVIRONMENT,
      maxConnections: MAX_CONNECTIONS,
      batchSize: BATCH_SIZE,
    }));

    // Extract records from event
    const records = event.Records || [];

    console.log(JSON.stringify({
      level: "INFO",
      message: "Processing batch records",
      requestId: context.requestId,
      recordCount: records.length,
    }));

    // Simulate batch processing
    const processedRecords = records.map((record, index) => ({
      id: record.messageId || `record-${index}`,
      status: "processed",
      timestamp: new Date().toISOString(),
    }));

    console.log(JSON.stringify({
      level: "INFO",
      message: "Batch processing completed",
      requestId: context.requestId,
      processedCount: processedRecords.length,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Batch processed successfully",
        processedCount: processedRecords.length,
        requestId: context.requestId,
      }),
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "Batch processing failed",
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
    }));

    throw error; // This will trigger DLQ
  }
};
```

## File: lib/lambda/transform/index.js

```javascript
// Transform Lambda Function
// Runtime: Node.js 18.x
// Purpose: Transform data records

exports.handler = async (event, context) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", JSON.stringify(context, null, 2));

  const { MAX_CONNECTIONS, ENVIRONMENT, LOG_LEVEL } = process.env;

  try {
    console.log(JSON.stringify({
      level: "INFO",
      message: "Starting data transformation",
      requestId: context.requestId,
      environment: ENVIRONMENT,
      maxConnections: MAX_CONNECTIONS,
    }));

    // Extract data from event
    const inputData = event.data || event.body || {};

    // Simulate transformation
    const transformedData = {
      ...inputData,
      transformed: true,
      transformedAt: new Date().toISOString(),
      requestId: context.requestId,
    };

    console.log(JSON.stringify({
      level: "INFO",
      message: "Data transformation completed",
      requestId: context.requestId,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Data transformed successfully",
        data: transformedData,
        requestId: context.requestId,
      }),
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "Data transformation failed",
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
    }));

    throw error; // This will trigger DLQ
  }
};
```

## File: lib/lambda-layers/nodejs/package.json

```json
{
  "name": "shared-dependencies",
  "version": "1.0.0",
  "description": "Shared dependencies for Lambda functions",
  "dependencies": {
    "date-fns": "^2.30.0"
  }
}
```

## File: lib/README.md

```markdown
# Lambda ETL Infrastructure Optimization

This infrastructure implements an optimized Lambda-based ETL pipeline using Pulumi with TypeScript.

## Architecture Overview

The infrastructure includes:

- **3 Lambda Functions**: API Handler, Batch Processor, and Transform function
- **Node.js 18.x Runtime**: All functions use the latest Node.js LTS runtime
- **Optimized Resource Allocation**: 512MB for small functions, 1024MB for batch processors
- **Lambda Layer**: Shared dependencies to reduce deployment package size
- **Dead Letter Queue**: SQS queue for failed Lambda executions
- **X-Ray Tracing**: Active tracing enabled on all functions for performance monitoring
- **CloudWatch Logs**: Retention policies set to 7 days (dev) or 30 days (prod)
- **IAM Least Privilege**: Separate IAM roles for each function with minimal permissions
- **CloudWatch Alarms**: Monitoring for critical function failures

## Lambda Functions

### 1. API Handler (`api-handler-{environmentSuffix}`)

- **Purpose**: Handle API requests with low latency
- **Memory**: 512MB
- **Timeout**: 30 seconds
- **Reserved Concurrency**: 5
- **Runtime**: Node.js 18.x

### 2. Batch Processor (`batch-processor-{environmentSuffix}`)

- **Purpose**: Process large batches of data
- **Memory**: 1024MB
- **Timeout**: 5 minutes (300 seconds)
- **Reserved Concurrency**: 5
- **Runtime**: Node.js 18.x

### 3. Transform Function (`transform-{environmentSuffix}`)

- **Purpose**: Transform data records
- **Memory**: 512MB
- **Timeout**: 30 seconds
- **Runtime**: Node.js 18.x

## Configuration

### Environment Variables

All functions include:
- `ENVIRONMENT`: Environment name (dev/prod)
- `MAX_CONNECTIONS`: Database connection pool size (10)
- `LOG_LEVEL`: Logging level (INFO)

Additional for batch processor:
- `BATCH_SIZE`: Number of records to process per batch (100)

### Dead Letter Queue

Failed Lambda executions are sent to an SQS queue for investigation:
- **Queue Name**: `lambda-dlq-{environmentSuffix}`
- **Retention**: 14 days

## Monitoring and Observability

### X-Ray Tracing

All Lambda functions have X-Ray tracing enabled (`mode: "Active"`), providing:
- End-to-end request tracing
- Service map visualization
- Performance bottleneck identification

### CloudWatch Logs

Each function has a dedicated log group with retention policies:
- **Development**: 7 days
- **Production**: 30 days

### CloudWatch Alarms

- **API Handler**: Alert when >5 errors in 10 minutes
- **Batch Processor**: Alert when >3 errors in 10 minutes

## Deployment

### Prerequisites

1. Install Pulumi CLI
2. Install Node.js 18.x or later
3. Configure AWS credentials

### Deploy Infrastructure

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="your-suffix-here"

# Set environment (dev or prod)
export ENVIRONMENT="dev"

# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Deploy Lambda Layer

Before deploying the infrastructure, prepare the Lambda layer:

```bash
cd lib/lambda-layers/nodejs
npm install
cd ../../..
```

## Security

### IAM Roles

Each Lambda function has its own IAM role with:
- **AWSLambdaBasicExecutionRole**: CloudWatch Logs permissions
- **AWSXRayDaemonWriteAccess**: X-Ray tracing permissions
- **Custom SQS Policy**: Permissions to send messages to DLQ

### Least Privilege

IAM policies grant only the minimum permissions required:
- Lambda execution (CloudWatch Logs write)
- X-Ray trace writing
- SQS message sending to specific DLQ

## Cost Optimization

- **Lambda Layers**: Shared dependencies reduce deployment package size
- **Reserved Concurrency**: Limits cost exposure (5 concurrent executions per critical function)
- **Log Retention**: Automatic log cleanup (7-30 days)
- **Efficient Memory Allocation**: Right-sized memory for workload

## Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Cleanup

To remove all infrastructure:

```bash
pulumi destroy
```

## Outputs

The stack exports:
- `apiHandlerFunctionName`: Name of API handler function
- `apiHandlerFunctionArn`: ARN of API handler function
- `batchProcessorFunctionName`: Name of batch processor function
- `batchProcessorFunctionArn`: ARN of batch processor function
- `transformFunctionName`: Name of transform function
- `transformFunctionArn`: ARN of transform function
- `dlqUrl`: URL of dead letter queue
- `dlqArn`: ARN of dead letter queue
- `sharedLayerArn`: ARN of shared Lambda layer
```
