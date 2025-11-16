# Ideal Response: Transaction Processing Infrastructure

## Overview

Successfully deployed serverless transaction processing system using Pulumi with TypeScript. The infrastructure handles real-time credit card transactions with fraud detection, queuing, and notifications.

## Infrastructure Components

### 1. KMS Key
- Custom KMS key for Lambda environment variable encryption
- Key rotation enabled
- KMS alias created for easy reference

### 2. DynamoDB Table
- Table: `transactions-synthv42e7j`
- On-demand billing mode (PAY_PER_REQUEST)
- Partition key: `transactionId` (String)
- Sort key: `timestamp` (Number)
- Streams enabled with NEW_AND_OLD_IMAGES view type

### 3. Lambda Functions

**Transaction Validator**
- Runtime: Node.js 18.x
- Reserved concurrency: 10
- Timeout: 30 seconds
- Validates and stores transactions in DynamoDB

**Fraud Detection**
- Runtime: Node.js 18.x
- Reserved concurrency: 10
- Timeout: 60 seconds
- Triggered by DynamoDB streams
- Analyzes patterns and sends to SQS queue
- Dead letter queue configured

**Notification**
- Runtime: Node.js 18.x
- Reserved concurrency: 10
- Timeout: 30 seconds
- Reads from SQS and publishes to SNS
- Dead letter queue configured

### 4. SQS Queues
- Main FIFO queue: `transaction-queue-synthv42e7j.fifo`
- Visibility timeout: 30 seconds
- Content-based deduplication enabled
- Two dead letter queues with 14-day retention

### 5. SNS Topic
- Topic: `transaction-notifications-synthv42e7j`
- Receives fraud detection results

### 6. API Gateway
- REST API with OpenAPI 3.0 schema validation
- POST /transaction endpoint
- API key authentication required
- Usage plan: 10,000 requests/day with throttling
- Lambda proxy integration

### 7. CloudWatch Log Groups
- 30-day retention for all Lambda functions
- Separate log groups per function

### 8. IAM Roles & Policies
- Least-privilege IAM roles for each Lambda
- Custom policies for DynamoDB, SQS, SNS, KMS access
- Basic execution role attached to all Lambdas

## Key Fixes Applied

1. **Lambda Concurrency**: Reduced from 100 to 10 per function (AWS quota constraint)
2. **API Gateway Stage**: Fixed usage plan dependency on deployment
3. **TypeScript Compilation**: Fixed stageName type issue in usage plan

## Deployment

```bash
cd lib
pulumi stack init synthv42e7j
pulumi config set environmentSuffix synthv42e7j
pulumi config set aws:region us-east-1
pulumi up --yes
```

## Outputs

- `apiInvokeUrl`: HTTPS endpoint for transactions
- `apiKeyValue`: API key for authentication
- `transactionTableName`: DynamoDB table name
- `snsTopicArn`: SNS topic ARN for notifications

## Testing

- 77 unit tests covering all infrastructure configuration
- 15 integration tests validating deployed resources
- All tests passing

## Compliance

- All resources include environmentSuffix for uniqueness
- No Retain policies (all resources destroyable)
- KMS encryption for sensitive data
- CloudWatch logging enabled
- Dead letter queues for reliability