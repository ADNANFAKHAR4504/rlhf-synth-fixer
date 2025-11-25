# Infrastructure as Code Task

## Problem Statement

Create a Pulumi TypeScript program to deploy a serverless crypto price alert system. The configuration must: 1. Create two Lambda functions - one for webhook ingestion (256MB memory) and one for rule evaluation (512MB memory), both using ARM64 architecture. 2. Set up a DynamoDB table for user alert rules with partition key 'userId' and sort key 'alertId', with point-in-time recovery enabled. 3. Create another DynamoDB table for price history with TTL enabled on 'expiryTime' attribute. 4. Configure an SNS topic for outbound notifications with server-side encryption. 5. Set up API Gateway REST API with POST endpoint '/webhook' that triggers the ingestion Lambda. 6. Implement request validation on the API Gateway endpoint for required fields: 'exchange', 'symbol', 'price'. 7. Create SQS queue between ingestion and evaluation Lambdas with visibility timeout of 5 minutes. 8. Configure dead letter queue for the main SQS queue with maximum receive count of 3. 9. Set up EventBridge rule to trigger evaluation Lambda every 5 minutes for batch processing. 10. Create custom KMS key for encrypting Lambda environment variables. 11. Enable X-Ray tracing on all Lambda functions and API Gateway. 12. Implement least-privilege IAM roles for each Lambda with no wildcard permissions. Expected output: A Pulumi program that deploys a complete serverless webhook processing system with proper error handling, encryption, and monitoring capabilities suitable for production use.

## Background Context

A fintech startup needs to process cryptocurrency price alerts for their mobile app users. The system must handle webhook notifications from various crypto exchanges, apply user-defined threshold rules, and send push notifications when price targets are met. The architecture must be event-driven to minimize costs during low-activity periods.

## Environment Requirements

Serverless infrastructure deployed in us-east-1 using Lambda for webhook processing and rule evaluation, DynamoDB for storing user alert configurations and price history, SNS for push notification delivery, and API Gateway for webhook endpoints. Requires Pulumi CLI 3.x with TypeScript, Node.js 18+, and AWS CLI configured. No VPC required as all services are managed. Custom KMS key for encryption at rest. X-Ray distributed tracing enabled across all Lambda functions for debugging webhook processing flows.

## Technical Constraints

- Lambda functions must use ARM64 architecture for cost optimization
- DynamoDB tables must use point-in-time recovery enabled
- All Lambda functions must have X-Ray tracing active
- SNS topics must have server-side encryption enabled
- Lambda environment variables containing API keys must be encrypted with a custom KMS key
- Dead letter queues must have a maximum receive count of 3
- API Gateway must use request validation for all endpoints

## Metadata

- Platform: Pulumi
- Language: TypeScript
- Difficulty: Expert
- Subtask: Application Deployment
- Task ID: x3c8w7i4
