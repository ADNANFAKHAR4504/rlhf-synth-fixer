# Infrastructure Requirements

## Platform and Language (MANDATORY)

**CRITICAL: You MUST use AWS CDK with Python for this task.**

- Platform: AWS CDK
- Language: Python
- These constraints are NON-NEGOTIABLE and will be validated

## Task Description

Create a CDK Python program to build a serverless ETL pipeline for processing large CSV transaction files.

## MANDATORY REQUIREMENTS (Must complete)

1. Deploy Step Functions state machine to orchestrate file processing workflow (CORE: Step Functions)
2. Create Lambda function to split large CSV files into 50MB chunks for parallel processing (CORE: Lambda)
3. Implement DynamoDB table to track processing status with partition key 'file_id' and sort key 'chunk_id' (CORE: DynamoDB)
4. Configure S3 bucket with lifecycle policy to move processed files to Glacier after 30 days
5. Set up EventBridge rule to trigger workflow when files land in S3 with prefix 'incoming/'
6. Create Lambda function for data validation that checks CSV headers and data types
7. Implement error handling with exponential backoff (max 3 retries) in Step Functions
8. Configure all Lambda functions with 3GB memory and 15-minute timeout
9. Create CloudWatch dashboard showing processing metrics and failure rates
10. Ensure all resources use consistent tagging: Environment=Production, Project=ETL

## OPTIONAL ENHANCEMENTS (If time permits)

- Add SQS FIFO queue for processing results notification (OPTIONAL: SQS) - ensures ordered delivery
- Implement tracing across all Lambda functions (OPTIONAL) - enables distributed debugging
- Add SNS topic for alerting on processing failures (OPTIONAL: SNS) - improves incident response

## Background / Use Case

A financial analytics company needs to process daily transaction files from multiple partner banks. The files arrive at unpredictable times and vary in size from 100MB to 2GB, requiring a robust ETL pipeline that can handle parallel processing and maintain audit trails.

## Technical Environment

AWS multi-region deployment supporting us-east-1 as primary and eu-west-1 for disaster recovery. Core services include Step Functions for workflow orchestration, Lambda functions with 3GB memory for processing, DynamoDB for state management, S3 for file storage with Glacier lifecycle. Requires Python 3.9+, AWS CDK 2.x, boto3 installed. VPC not required as all services are serverless. EventBridge for event-driven triggers, CloudWatch for monitoring. IAM roles follow least-privilege with specific actions per service. Stack designed for high-throughput file processing with automatic scaling.

## Constraints and Requirements

1. Lambda functions must use Python 3.9 runtime with pandas and boto3 pre-installed as layers
2. Step Functions state machine must implement Map state for parallel chunk processing with MaxConcurrency of 10
3. DynamoDB table must use on-demand billing mode with point-in-time recovery enabled
4. S3 bucket must enable versioning and server-side encryption with AWS managed keys (SSE-S3)
5. All IAM roles must explicitly deny s3:DeleteBucket and dynamodb:DeleteTable actions for safety
6. CloudWatch Logs retention must be set to 30 days for all Lambda function logs to control costs

## Expected Output

Complete CDK Python stack that deploys a production-ready serverless ETL pipeline capable of processing large CSV files in parallel with full observability and error handling.

## Critical Requirements from Project Standards

### Resource Naming
- ALL resources MUST include environmentSuffix in their names
- Format: `resource-name-${environmentSuffix}` or `resource-name-${props.environmentSuffix}`
- This is MANDATORY for all named resources (S3 buckets, Lambda functions, DynamoDB tables, etc.)

### Destroyability
- NO RemovalPolicy.RETAIN allowed
- NO deletionProtection: true allowed
- All resources must be fully destroyable for CI/CD cleanup
- S3 buckets should use autoDeleteObjects: true

### Security Best Practices
- Follow IAM least privilege principle
- Enable encryption at rest for all applicable services
- Use AWS managed keys (SSE-S3) for S3 encryption
- Implement proper IAM role policies with explicit deny for dangerous operations

### Cost Optimization
- Use serverless services where appropriate (Lambda, DynamoDB on-demand, etc.)
- Set CloudWatch Logs retention to 30 days
- Implement lifecycle policies for S3 to move data to cheaper storage tiers

### Monitoring and Observability
- Create CloudWatch dashboards for key metrics
- Enable CloudWatch Logs for all Lambda functions
- Consider X-Ray tracing for distributed debugging (if implementing optional enhancements)

## Validation

Before considering the task complete, ensure:
1. All MANDATORY requirements are implemented
2. Code follows platform/language requirements (CDK + Python)
3. All resources include environmentSuffix
4. No retention policies that prevent cleanup
5. Proper error handling and logging
6. Infrastructure can be deployed and destroyed cleanly
