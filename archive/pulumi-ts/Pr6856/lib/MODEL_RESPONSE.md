# Serverless Transaction Processing System - Implementation

This implementation provides a complete serverless transaction processing system using **Pulumi with TypeScript** deployed to **us-east-1**.

## Architecture Overview

The system implements:
1. API Gateway REST API with OpenAPI 3.0 request validation
2. Transaction Validator Lambda (Go 1.x) - processes API requests and writes to DynamoDB
3. DynamoDB table with streams enabled
4. Fraud Detection Lambda (Go 1.x) - triggered by DynamoDB streams
5. SQS FIFO queue for ordered transaction processing
6. Notification Lambda (Go 1.x) - reads from SQS and publishes to SNS
7. SNS topic for notifications
8. Two Dead Letter Queues for failed Lambda executions
9. Custom KMS key for Lambda environment variable encryption
10. CloudWatch Log Groups with 30-day retention
11. API Gateway usage plan with 10,000 requests/day limit

## Implementation

The complete implementation is in `lib/tap-stack.ts` with all 11 required infrastructure components properly configured with environmentSuffix for multi-environment support.

### Resource Summary

#### AWS Services Implemented (7 Total)

1. **API Gateway** - REST API with OpenAPI validation and usage plans
2. **Lambda** - 3 functions (validator, fraud detection, notification) in Go 1.x
3. **DynamoDB** - Transaction table with streams and on-demand billing
4. **SQS** - 1 FIFO queue + 2 Dead Letter Queues
5. **SNS** - Notification topic
6. **KMS** - Custom encryption key for Lambda environment variables
7. **CloudWatch Logs** - 3 log groups with 30-day retention

#### Key Features

- All resources use environmentSuffix for multi-environment support
- All Lambda functions use Go 1.x runtime as specified
- Reserved concurrent executions set to 100 for all Lambda functions
- KMS encryption for Lambda environment variables
- Dead letter queues with 14-day retention
- API Gateway with OpenAPI 3.0 request validation
- Usage plan with 10,000 requests/day limit
- DynamoDB on-demand billing for cost optimization
- SQS FIFO queue maintains transaction ordering
- Proper IAM roles with least privilege principle

#### Exports

- `apiUrl` - API Gateway invoke URL for transactions endpoint
- `apiKey` - API key value for client access
- `tableName` - DynamoDB table name
- `topicArn` - SNS topic ARN
- `queueUrl` - SQS queue URL

## Deployment

Deploy with:

```bash
export ENVIRONMENT_SUFFIX=dev
pulumi up
```

The system will process transactions through the API Gateway, validate them, store in DynamoDB, perform fraud detection asynchronously, and send notifications via SNS.