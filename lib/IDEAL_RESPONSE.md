# Ideal Response: AWS Serverless Infrastructure with Lambda, S3, and DynamoDB

## Overview

This document describes the ideal implementation for the serverless infrastructure task that creates an event-driven architecture using AWS Lambda, S3, and DynamoDB.

## Infrastructure Components

### 1. DynamoDB Table

A DynamoDB table for logging Lambda invocations with:
- Partition key: `requestId` (STRING) - unique identifier for each invocation
- Sort key: `timestamp` (STRING) - ISO 8601 timestamp
- Billing mode: PAY_PER_REQUEST (on-demand, cost-optimized)
- Point-in-time recovery enabled for data protection
- RemovalPolicy.DESTROY for clean resource teardown

### 2. S3 Bucket

An S3 bucket configured to trigger Lambda function on object creation:
- Block all public access for security
- SSL enforcement (HTTPS only)
- S3-managed encryption at rest
- Event notification for OBJECT_CREATED events
- Auto-delete objects on stack deletion

### 3. Lambda Function

A Python 3.8 Lambda function that:
- Processes S3 event notifications
- Extracts bucket name, object key, and event type from event payload
- Generates unique request ID (UUID) for each invocation
- Logs invocation details to DynamoDB table
- Handles LocalStack endpoints for local testing
- Implements comprehensive error handling

### 4. IAM Role and Permissions

Lambda execution role with:
- AWSLambdaBasicExecutionRole managed policy for CloudWatch Logs
- Read permissions for S3 bucket
- Write permissions for DynamoDB table
- Follows least-privilege security principle

## Implementation Requirements

### Lambda Function Logic

The function should:
1. Accept S3 event as input
2. Process each record in the event
3. Log the following to DynamoDB:
   - requestId: Unique UUID
   - timestamp: ISO 8601 format
   - bucketName: S3 bucket name
   - objectKey: S3 object key
   - eventName: S3 event type
   - functionName: Lambda function name
   - awsRequestId: AWS request ID from context
4. Return structured JSON response with status code and message

### Security Best Practices

1. No hardcoded credentials
2. Block all public S3 access
3. Enforce HTTPS for S3 bucket
4. Use IAM roles with minimal required permissions
5. Enable encryption at rest
6. Use managed policies where appropriate

### LocalStack Compatibility

The implementation should:
- Detect LocalStack environment via AWS_ENDPOINT_URL
- Configure DynamoDB client with endpoint override when in LocalStack
- Support path-style S3 access in tests
- Use test credentials for LocalStack

### Testing Requirements

#### Unit Tests

Should validate:
- Stack construction
- All resource properties
- IAM permissions
- Event notification configuration
- CloudFormation outputs

#### Integration Tests

Should verify:
- S3 bucket accessibility
- DynamoDB table operations
- Lambda function invocation
- End-to-end flow: S3 upload triggers Lambda, logs to DynamoDB
- Multiple event handling
- Error scenarios
- Data consistency and schema validation

### CloudFormation Outputs

Export these values:
1. BucketName: S3 bucket name
2. DynamoDBTableName: DynamoDB table name
3. LambdaFunctionName: Lambda function name

## Key Quality Indicators

1. 100% test coverage for critical paths
2. All security best practices implemented
3. Clean resource teardown with RemovalPolicy.DESTROY
4. Production-ready error handling
5. LocalStack compatibility for local development
6. Clear and descriptive resource naming
7. Comprehensive integration tests with real AWS resources
