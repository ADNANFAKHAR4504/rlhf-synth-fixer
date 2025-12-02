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
- `apiHandlerFunctionArn`: ARN of API handler function
- `batchProcessorFunctionArn`: ARN of batch processor function
- `transformFunctionArn`: ARN of transform function
- `dlqUrl`: URL of dead letter queue
- `layerArn`: ARN of shared Lambda layer
