# Task: Serverless Financial Data Processing Pipeline

## Platform and Language (MANDATORY)
**Use Pulumi with TypeScript** - This is a NON-NEGOTIABLE requirement.

## Overview
A financial analytics startup needs to process millions of stock market data points daily through a serverless pipeline. The system must handle variable loads during market hours and scale to zero during off-hours to minimize costs.

## AWS Region
Deploy all resources in **us-east-1**

## Infrastructure Requirements

Create a Pulumi TypeScript program to deploy a serverless data processing pipeline for financial analytics with the following components:

### 1. S3 Bucket for Raw Data Ingestion
- Create an S3 bucket for raw market data ingestion
- Enable server-side encryption using AWS-managed keys (SSE-S3)
- Enable versioning
- Configure lifecycle policies for 30-day retention
- Bucket name MUST include environmentSuffix: `market-data-${environmentSuffix}`

### 2. DynamoDB Table for State Management
- Table name: `MarketDataState-${environmentSuffix}`
- Partition key: 'symbol' (String)
- Sort key: 'timestamp' (Number)
- Use on-demand billing mode
- Enable point-in-time recovery

### 3. Lambda Functions
Deploy three Lambda functions with the following specifications:

**a) DataIngestion Lambda**
- Function name: `DataIngestion-${environmentSuffix}`
- Runtime: Node.js 18.x
- Memory: 3GB
- Trigger: S3 events (ObjectCreated)
- Enable X-Ray tracing
- CloudWatch Logs retention: 7 days

**b) DataProcessor Lambda**
- Function name: `DataProcessor-${environmentSuffix}`
- Runtime: Node.js 18.x
- Memory: 3GB
- Trigger: SQS messages
- Enable X-Ray tracing
- CloudWatch Logs retention: 7 days

**c) DataAggregator Lambda**
- Function name: `DataAggregator-${environmentSuffix}`
- Runtime: Node.js 18.x
- Memory: 3GB
- Trigger: EventBridge scheduled rule (every 5 minutes)
- Enable X-Ray tracing
- CloudWatch Logs retention: 7 days

### 4. SQS Queue Configuration
- Queue name: `ProcessingQueue-${environmentSuffix}`
- Message retention period: 4 days
- Visibility timeout: 5 minutes
- Create a dead letter queue for failed messages
- Dead letter queue MUST be configured for all asynchronous Lambda invocations

### 5. EventBridge Configuration
- Create an EventBridge rule that captures custom events from the DataProcessor function
- Route captured events to DataAggregator Lambda
- Ensure at least once delivery guarantee

### 6. API Gateway REST API
- Create REST API with POST endpoint '/ingest'
- Endpoint triggers DataIngestion Lambda synchronously
- Implement request throttling at 10,000 requests per second
- API name: `MarketDataAPI-${environmentSuffix}`

### 7. IAM Roles and Permissions
- Create separate IAM roles for each Lambda function
- Follow least privilege principle with explicit deny statements
- Grant only required permissions for each service:
  - DataIngestion: S3 read, SQS send, DynamoDB write
  - DataProcessor: SQS receive/delete, DynamoDB read/write, EventBridge put events
  - DataAggregator: DynamoDB read/write, CloudWatch metrics

### 8. CloudWatch Configuration
- Create Log Groups for each Lambda function
- Set retention period to 7 days
- Add metric filters for error tracking (filter for ERROR or Exception in logs)

### 9. Resource Tagging
Add the following tags to ALL resources:
- Environment: Production
- Project: MarketAnalytics

### 10. Stack Outputs
Export the following values:
- API Gateway URL
- S3 bucket name
- DynamoDB table ARN

## AWS Services Used
- Lambda (3 functions)
- DynamoDB (1 table)
- S3 (1 bucket)
- SQS (2 queues - main + DLQ)
- EventBridge (1 rule)
- API Gateway (1 REST API)
- CloudWatch Logs (3 log groups)
- IAM (3 roles)
- X-Ray (tracing)

## Architecture Requirements
- Event-driven patterns with multiple Lambda functions
- Connect functions through SQS and EventBridge
- No VPC required (all services are serverless and publicly accessible with IAM authentication)
- Automatic scaling for handling thousands of concurrent data streams
- Comprehensive error handling through dead letter queues

## Destroyability Requirements
- ALL resources must be destroyable without manual intervention
- No DeletionPolicy: Retain or RemovalPolicy.RETAIN
- No deletion_protection: true

## Environment Suffix Requirement
**CRITICAL**: ALL resource names MUST include the environmentSuffix parameter to avoid naming conflicts:
```typescript
const environmentSuffix = pulumi.getStack() || "dev";
// Example: bucketName: `market-data-${environmentSuffix}`
```

## Expected Output
A fully functional serverless pipeline where:
1. Market data uploaded to S3 triggers the DataIngestion Lambda
2. DataIngestion processes data and sends messages to SQS
3. DataProcessor consumes SQS messages and updates DynamoDB state
4. DataProcessor emits custom events to EventBridge
5. DataAggregator runs every 5 minutes via EventBridge scheduled rule
6. Aggregated results are available via API Gateway POST endpoint
7. System handles thousands of concurrent data streams with automatic scaling
8. Comprehensive error handling through dead letter queues

## Technical Requirements
- Pulumi CLI 3.x
- TypeScript/Node.js 18.x
- AWS CLI configured with appropriate credentials

## Constraints
All constraints from the task description must be implemented:
- S3 versioning enabled with 30-day lifecycle
- DynamoDB on-demand billing with point-in-time recovery
- Lambda 3GB memory, Node.js 18.x, X-Ray tracing enabled
- CloudWatch Logs 7-day retention
- API Gateway 10,000 req/sec throttling
- SQS 4-day retention, 5-minute visibility timeout
- IAM least privilege with explicit deny statements
- EventBridge at least once delivery
- Dead letter queues for async Lambda invocations
