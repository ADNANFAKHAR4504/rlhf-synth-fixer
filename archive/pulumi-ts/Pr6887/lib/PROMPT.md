# Task: Serverless File Processing Pipeline

## Platform and Language
**CRITICAL: This infrastructure must be implemented using Pulumi with TypeScript.**

The Lambda functions themselves will use Go 1.x runtime (not the IaC code).

## Problem Statement

Create infrastructure code using **Pulumi with TypeScript** to deploy a serverless file processing pipeline. The configuration must:

1. Create an S3 bucket with versioning and lifecycle rules to transition objects to Glacier after 90 days
2. Deploy three Lambda functions: file validator, data processor, and result aggregator, each with 512MB memory
3. Configure S3 event notifications to trigger the validator Lambda on object creation
4. Set up SQS FIFO queues between Lambda functions for ordered processing
5. Implement DynamoDB table with TTL for tracking processing status
6. Create dead letter queues for each Lambda with maximum receive count of 3
7. Deploy API Gateway REST API with GET endpoint to query processing status
8. Configure request throttling on API Gateway at 1000 requests per second
9. Set up CloudWatch Logs retention to 7 days for all Lambda functions
10. Add resource tags for cost tracking: Environment=Production, Team=Analytics

Expected output: The program should create a complete serverless pipeline where files uploaded to S3 trigger validation, processing flows through FIFO queues maintaining order, and results are queryable via API Gateway while failed messages are captured in DLQs.

## Scenario

A financial analytics startup needs to process large volumes of market data files uploaded by partners. The system must handle bursty workloads during market hours and scale down during off-hours to minimize costs.

## Infrastructure Requirements

Serverless infrastructure deployed in us-east-1 using Lambda functions for compute, S3 for file storage, DynamoDB for metadata tracking, SQS FIFO queues for message ordering, and API Gateway for REST endpoints. Requires Pulumi CLI 3.x with TypeScript SDK, AWS CLI configured with appropriate credentials. No VPC required as all services are managed. Lambda functions process market data files asynchronously with automatic scaling based on S3 events. DynamoDB configured with on-demand billing and point-in-time recovery.

## Special Requirements

- All Lambda functions must use Go 1.x runtime (the Lambda execution runtime, NOT the Pulumi IaC language)
- Use DynamoDB for storing processing metadata with TTL enabled
- Lambda functions must have 512MB memory allocation
- Use SQS FIFO queues for ordered message processing
- S3 buckets must have versioning enabled and lifecycle policies
- Deploy API Gateway with request throttling at 1000 requests per second
- Implement DLQ for failed processing attempts with retry logic
- Use S3 event notifications to trigger Lambda functions without polling

## Critical Implementation Requirements

### Resource Naming
ALL resource names must include `environmentSuffix` parameter for proper isolation:
- Pattern: `resourceName-${environmentSuffix}`
- This is MANDATORY for all named resources (S3 buckets, DynamoDB tables, SQS queues, API Gateway, etc.)

### Destroyability
- NO RemovalPolicy.RETAIN or DeletionPolicy: Retain
- NO deletionProtection: true
- All resources must be fully destroyable for automated cleanup

### Lambda Functions
- Runtime: Go 1.x (nodejs18.x is preferred if Go not available)
- Memory: 512MB as specified
- Placeholder code is acceptable (actual business logic not required)
- Include proper IAM permissions for S3, SQS, DynamoDB access

### AWS Best Practices
- Enable encryption at rest for S3 and DynamoDB
- Use IAM least privilege principle
- Enable CloudWatch logging for all Lambda functions with 7-day retention
- Include proper error handling and DLQ configuration

## Success Criteria

1. All infrastructure deploys successfully without errors
2. S3 event notifications properly trigger Lambda validator function
3. SQS FIFO queues maintain message ordering between Lambda functions
4. DynamoDB table configured with TTL for automatic cleanup
5. API Gateway endpoint responds to GET requests for status queries
6. Dead letter queues capture failed processing attempts
7. All resources properly tagged for cost tracking
8. CloudWatch Logs retention set to 7 days
9. All resource names include environmentSuffix
10. Infrastructure is fully destroyable (no retention policies)
