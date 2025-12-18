# Model Response: AWS Serverless Infrastructure with Lambda, S3, and DynamoDB

## Implementation Summary

This infrastructure implements a serverless event-driven architecture using AWS CDK TypeScript with the following components:

### 1. DynamoDB Table for Logging
- **Table Name**: `lambda-invocation-logs-{environmentSuffix}`
- **Partition Key**: `requestId` (STRING)
- **Sort Key**: `timestamp` (STRING)
- **Billing Mode**: PAY_PER_REQUEST (on-demand)
- **Features**:
  - Point-in-time recovery enabled
  - RemovalPolicy.DESTROY for easy cleanup
  - Designed for Lambda invocation logging

### 2. S3 Bucket for Event Triggers
- **Bucket Name**: `lambda-trigger-bucket-{environmentSuffix}-{account}`
- **Security Features**:
  - Public access blocked (BlockPublicAccess.BLOCK_ALL)
  - SSL enforcement enabled
  - S3-managed encryption
  - No versioning (simplified for demo)
- **Configuration**:
  - RemovalPolicy.DESTROY with autoDeleteObjects
  - Event notification configured for OBJECT_CREATED events

### 3. Lambda Function (Python 3.8)
- **Function Name**: `s3-processor-{environmentSuffix}`
- **Runtime**: Python 3.8
- **Handler**: `index.lambda_handler`
- **Timeout**: 30 seconds
- **Memory**: 128 MB
- **Features**:
  - Processes S3 event records
  - Logs invocation details to DynamoDB
  - LocalStack endpoint detection for local development
  - Comprehensive error handling and logging

### 4. IAM Role and Permissions
- **Base Role**: AWSLambdaBasicExecutionRole (CloudWatch Logs)
- **S3 Permissions**: Read access to trigger bucket
- **DynamoDB Permissions**: Write access to logs table
- **Security**: Follows least-privilege principle

## Lambda Function Logic

The Lambda function:
1. Detects LocalStack environment via AWS_ENDPOINT_URL
2. Processes S3 event records from the event payload
3. Extracts bucket name, object key, and event name
4. Generates unique request ID (UUID)
5. Records invocation details in DynamoDB with schema:
   - requestId (partition key)
   - timestamp (sort key, ISO 8601)
   - bucketName
   - objectKey
   - eventName
   - functionName
   - awsRequestId
6. Returns success/error response with appropriate status codes

## Event Flow

```
S3 Object Created → S3 Event Notification → Lambda Invocation → DynamoDB Log Entry
```

## Outputs

The stack exports three CloudFormation outputs:
1. **BucketName**: Name of the S3 trigger bucket
2. **DynamoDBTableName**: Name of the invocation logs table
3. **LambdaFunctionName**: Name of the Lambda function

## LocalStack Compatibility

The implementation includes LocalStack-specific configurations:
- Lambda function detects `AWS_ENDPOINT_URL` environment variable
- S3 clients in tests use `forcePathStyle: true`
- All AWS SDK clients support endpoint override for local testing

## Error Handling

- Lambda function includes try-catch for all operations
- Logs errors to CloudWatch Logs
- Returns appropriate HTTP status codes (200/500)
- Gracefully handles malformed S3 events

## Security Best Practices

1. IAM roles follow least-privilege principle
2. S3 bucket blocks all public access
3. SSL enforcement on S3 bucket
4. Encryption at rest (S3-managed)
5. No hardcoded credentials
6. Managed policies for CloudWatch Logs access
