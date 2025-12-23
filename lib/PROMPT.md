# Serverless Data Processing Pipeline with Multi-Region Support

Design and implement an event-driven serverless infrastructure using AWS CDK + TypeScript for a data processing pipeline that spans multiple AWS regions.

## Overview

Build a system that processes data files uploaded to S3, transforms them through Lambda functions, and stores results in DynamoDB. The solution must support multi-region deployment for high availability.

Framework: AWS CDK + TypeScript
Primary Region: us-east-1
Secondary Region: us-west-2 (disaster recovery)
Naming Convention: serverless-<resource>-<environment> (use "prod" for environment)

## S3 Configuration

Create a primary S3 bucket in us-east-1 named serverless-data-ingestion-prod with:
- Versioning enabled
- SSE-S3 encryption
- Public access blocked
- Event notifications to trigger Lambda on object creation

Create a secondary bucket in us-west-2 for disaster recovery. Note that cross-region replication has been removed to avoid deployment issues.

## Lambda Functions

Primary function serverless-data-processor-prod in us-east-1:
- Runtime: Node.js 18.x
- Environment variables for DynamoDB table name and region
- Dead letter queue (SQS) for failed processing
- Timeout: 5 minutes

The function should validate incoming JSON, transform data to a standardized format, store records in DynamoDB, and log to CloudWatch.

Deploy an identical function in us-west-2 pointing to the regional DynamoDB table.

## DynamoDB Tables

Primary table serverless-processed-data-prod in us-east-1:
- Partition key: recordId (String)
- Sort key: timestamp (String)
- GSI for querying by processing status
- Point-in-time recovery enabled
- DynamoDB Streams for change data capture

Set up Global Tables for automatic replication between us-east-1 and us-west-2.

## IAM Configuration

Lambda execution role needs:
- s3:GetObject on the ingestion bucket
- dynamodb:PutItem, dynamodb:UpdateItem, dynamodb:GetItem on the table
- logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents
- sqs:SendMessage for the dead letter queue

## Event Architecture

Configure S3 bucket notifications to trigger Lambda on object creation with filtering for .json and .csv files.

Enable DynamoDB Streams on the processed data table and create an additional Lambda for stream processing.

## Multi-Region Strategy

Active-passive configuration where us-east-1 handles incoming requests and us-west-2 serves as disaster recovery. S3 cross-region replication is disabled.

## Monitoring

Set up CloudWatch alarms for Lambda errors and duration. Configure SNS notifications for critical alerts. Deploy monitoring in both regions.

## Data Flow

1. Files uploaded to S3 in primary region
2. S3 event triggers Lambda function
3. Lambda validates, transforms, and enriches data
4. Processed data stored in DynamoDB
5. Global Tables replicate data to secondary region
6. CloudWatch captures metrics across regions

## Error Handling

Include a dead letter queue for failed Lambda executions, retry logic with exponential backoff, and comprehensive input validation.

## Deliverables

The CDK implementation should include:
- Main stack file (tap-stack.ts) with all resources
- Lambda handler code with processing logic
- IAM roles and policies with least privilege
- Multi-region stack configuration
- Resource outputs for critical ARNs

## Success Criteria

1. Complete CDK + TypeScript implementation
2. S3 bucket with event notifications (no cross-region replication)
3. Lambda with data processing capabilities
4. DynamoDB with Global Tables
5. IAM roles following least privilege
6. Event-driven S3 to Lambda to DynamoDB flow
7. Multi-region deployment with failover
8. Dead letter queue implementation
9. CloudWatch monitoring across regions
10. Encryption and security best practices
11. Consistent naming across resources
12. Deployable with cdk deploy
