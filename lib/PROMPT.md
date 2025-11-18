# Task: Serverless Transaction Processing Pipeline

## Scenario
A financial services company processes millions of daily transactions that require complex validation, fraud detection, and regulatory compliance checks. They need a serverless pipeline that can handle variable workloads while maintaining audit trails and supporting real-time notifications for suspicious activities.

## Task Description
Create a Terraform configuration to build a serverless transaction processing pipeline using Step Functions and Lambda. The configuration must:

1. Define a Step Functions state machine using Express workflow type that orchestrates three Lambda functions for validation, fraud detection, and compliance checking.
2. Create three Lambda functions using container images with 3GB memory, 60-second timeout, and reserved concurrent executions of 100 per function.
3. Set up a DynamoDB table named 'transaction-state' with partition key 'transaction_id' (String) and sort key 'timestamp' (Number), using on-demand billing.
4. Configure SNS topic 'fraud-alerts' with email subscription endpoint and server-side encryption.
5. Implement SQS dead letter queue with 14-day message retention for failed transactions.
6. Create IAM roles and policies allowing Lambda functions to read/write DynamoDB, publish to SNS, and send messages to SQS.
7. Deploy all Lambda functions in private subnets with security group allowing HTTPS outbound only.
8. Configure Step Functions to retry Lambda invocations 3 times with exponential backoff starting at 2 seconds.
9. Add CloudWatch log groups for each Lambda function with 30-day retention.
10. Create VPC endpoints for DynamoDB, S3, and Step Functions services.
11. Output the Step Functions state machine ARN and execution role ARN.

## Expected Output
A complete Terraform configuration that creates a production-ready serverless pipeline capable of processing financial transactions with proper error handling, monitoring, and security controls. The infrastructure should support processing 10,000+ transactions per minute during peak hours.

## Technical Requirements
Production environment in us-east-1 region focusing on serverless transaction processing. Architecture includes AWS Lambda functions deployed as container images, Step Functions Express workflows for orchestration, DynamoDB for transaction state storage, SNS for notifications, and SQS for dead letter queues. VPC configuration with private subnets across 3 availability zones, VPC endpoints for DynamoDB, S3, and Step Functions. Lambda functions require 3GB memory allocation for processing large transaction batches. Terraform 1.5+ required with AWS provider 5.x.

## Constraints
- All Lambda functions must have reserved concurrent executions set to prevent throttling of critical workflows
- Step Functions must implement exponential backoff retry logic with jitter for all Lambda invocations
- Lambda functions must use container images instead of ZIP deployment for consistency with existing CI/CD pipelines
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- Step Functions must use Express workflows for high-volume transaction processing to reduce costs
- SNS topics must be configured with server-side encryption using AWS managed keys
- Lambda functions must be deployed in private subnets with VPC endpoints for AWS service access
