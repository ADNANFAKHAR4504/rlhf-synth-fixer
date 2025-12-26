Hey team,

We need to build a secure payment processing infrastructure for handling financial transactions. This is for a fintech company that needs strict security controls, so data protection and audit logging are critical.

I need you to create this infrastructure using CloudFormation YAML. The system processes payment data through several connected services that need to work together securely.

## Architecture Overview

The payment API Gateway receives transaction requests and invokes the Lambda processor function. The Lambda function validates transactions and writes session data to DynamoDB for tracking. Transaction logs are stored in an encrypted S3 bucket for audit purposes. The SQS queue connects to Lambda for asynchronous payment processing. SNS topics trigger alerts when CloudWatch alarms detect issues with the transaction queue or Lambda errors.

All storage services connect to KMS for encryption - S3 buckets, DynamoDB tables, and SQS queues are encrypted using customer-managed KMS keys.

## What we need to build

Create a payment processing infrastructure with these connected components:

### Core Services

1. VPC with public and private subnets across two availability zones. The Lambda function runs in private subnets and connects to AWS services through VPC endpoints or internet gateway.

2. API Gateway HTTP API that invokes the payment processor Lambda function. The API handles POST requests to the /payment endpoint and triggers the Lambda for each transaction.

3. Lambda function that processes payments and writes to DynamoDB for session tracking. The function also sends transaction logs to S3 and reads messages from SQS for batch processing.

4. DynamoDB table for storing payment sessions with KMS encryption enabled. The table uses on-demand billing and has a global secondary index for user lookups.

5. S3 bucket for transaction audit logs encrypted with KMS. The bucket blocks public access and enables versioning for compliance.

6. SQS queue for asynchronous transaction processing encrypted with KMS. The queue connects to Lambda through an event source mapping.

7. SNS topic for payment alerts that receives notifications from CloudWatch alarms. Alarms monitor queue depth and Lambda error rates.

8. CloudWatch Log Group for Lambda execution logs with 30-day retention.

### Security Requirements

- KMS customer-managed key encrypts S3, DynamoDB, SQS, and SNS
- IAM role for Lambda with specific permissions for each service it accesses
- Security group for Lambda with outbound-only traffic
- VPC with proper subnet configuration for network isolation

### Technical Details

- Deploy to us-east-1 region
- Use EnvironmentSuffix parameter for resource naming
- CloudFormation YAML format
- Include stack outputs for VPC ID, API endpoint, and resource ARNs

## Expected Output

A working CloudFormation template that deploys the complete payment processing infrastructure with proper service integrations and security controls.
