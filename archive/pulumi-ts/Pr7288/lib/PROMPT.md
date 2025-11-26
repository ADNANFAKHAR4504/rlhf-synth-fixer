# Serverless Fraud Detection Pipeline

## Task Description

Create a Pulumi TypeScript program to build a serverless fraud detection pipeline. The configuration must:

1. Create a DynamoDB table named 'transactions' with partition key 'transactionId' (string) and sort key 'timestamp' (number), with on-demand billing mode.
2. Create a Lambda function 'transaction-processor' with 3008MB memory that receives transaction events and stores them in DynamoDB.
3. Create a second Lambda function 'fraud-detector' with 1024MB memory that analyzes transactions using pattern matching.
4. Set up EventBridge custom event bus 'fraud-detection-bus' to route events between Lambda functions.
5. Configure EventBridge rules to trigger fraud-detector when transaction-processor publishes events with amount > 10000.
6. Create SNS topic 'fraud-alerts' with email subscription for notifications when fraud is detected.
7. Implement proper IAM roles with least privilege for each Lambda function.
8. Tag all resources with Environment='production' and Service='fraud-detection'.
9. Export the EventBridge bus ARN and SNS topic ARN for external integrations.

Expected output: A complete Pulumi TypeScript program that deploys a functional fraud detection pipeline with proper event routing, processing capabilities, and alerting mechanisms.

## Background

A fintech startup needs a serverless event processing system to handle real-time transaction fraud detection. The system must process incoming transaction events, run fraud detection algorithms, and notify relevant parties while maintaining strict latency requirements under 500ms.

## Environment

Production environment in us-east-1 region for low-latency fraud detection system. Uses Lambda functions with Graviton2 processors for transaction processing, DynamoDB for storing transaction history and fraud patterns, EventBridge for event routing between services. Requires Pulumi CLI 3.x, TypeScript 4.x, Node.js 18.x, AWS CLI configured with appropriate permissions. VPC endpoints configured for DynamoDB and S3 to reduce data transfer costs. Multi-AZ deployment not required as Lambda and DynamoDB handle availability automatically.

## Constraints

- Lambda functions must have reserved concurrent executions set to prevent cold starts
- DynamoDB tables must use point-in-time recovery and encryption at rest
- All Lambda functions must use ARM-based Graviton2 processors for cost optimization
- EventBridge rules must include dead-letter queue configuration for failed invocations
- Lambda functions must use environment variables with KMS encryption
- CloudWatch Logs retention must be set to exactly 30 days for compliance

## Platform and Language

**CRITICAL**: This task MUST be implemented using **Pulumi with TypeScript**.

Any deviation from these requirements will result in task failure.

## Resource Naming Convention

**CRITICAL**: ALL named resources MUST include the environmentSuffix parameter.

Pattern: `resourceName-${environmentSuffix}`

Example:
```typescript
const bucket = new aws.s3.Bucket(`data-bucket-${environmentSuffix}`, {
  bucket: `data-bucket-${environmentSuffix}`,
  // ...
});
```

## Destroyability Requirements

**CRITICAL**: All resources MUST be destroyable without manual intervention.

- Do NOT use RemovalPolicy.RETAIN
- Do NOT set deletionProtection: true
- S3 buckets: Set autoDeleteObjects: true or equivalent
- RDS instances: Set skipFinalSnapshot: true
- DynamoDB: No special retention settings

## AWS Region

Use **us-east-1** as specified in the environment section.
