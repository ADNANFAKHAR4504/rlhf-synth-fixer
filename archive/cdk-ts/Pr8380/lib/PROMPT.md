# Infrastructure as Code (IaC) Requirements

## Overview

You are an expert AWS Solutions Architect specializing in serverless architectures and Infrastructure as Code (IaC). Your task is to design a complete, event-driven, and resilient serverless application using AWS CDK and TypeScript.

## Problem Statement

Develop a complete serverless data processing pipeline. The core of the system is a DynamoDB table that stores records (e.g., customer orders). When a new record is created or updated in this table, a Lambda function must be triggered automatically to process the data, enrich it with metadata, and store the processed results in a private S3 bucket. The entire system must be resilient, with robust error handling and monitoring, and adhere to strict naming conventions.

## Global Requirements

- **Tool**: AWS CDK
- **Language**: TypeScript
- **Region**: `us-east-1`
- **Naming Convention**: All resources must follow the pattern `dev-<resource>-<team>` (e.g., `dev-orders-table-backend`, `dev-order-processor-lambda-backend`). You can use "backend" for the team name.

## Detailed Requirements

### 1. Architectural Design

Before writing code, provide a summary inside a `<thinking>` block. Describe the end-to-end data flow:

- A new item is written to the **DynamoDB table**
- The change is captured by **DynamoDB Streams**
- An **Event Source Mapping** invokes the **Lambda function**, passing the stream data
- The Lambda processes the event, enriches it with metadata (timestamp, processing status, etc.)
- The processed and enriched data is stored as a JSON file in a **private S3 bucket**
- If processing fails permanently, the event is sent to a **Dead-Letter Queue (SQS)**
- An **Audit Lambda function** processes DLQ messages and stores failure details in an **Audit DynamoDB table** for permanent audit trail
- A **CloudWatch Alarm** monitors the Lambda for errors

### 2. Infrastructure Components

#### DynamoDB Configuration

- **DynamoDB Stream**: The DynamoDB table must have streaming enabled, specifically `stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES`
- **Partition Key**: The table must define a partition key (e.g., `orderId` of type `string`)

#### Lambda Function Configuration

- **Event Source Mapping**: The Lambda function must be configured with an event source from the DynamoDB table's stream. Set a batch size for processing records
- **Runtime**: Use the latest supported Node.js runtime
- **Handler Code**: The Lambda function must:
  - Process DynamoDB stream records
  - Enrich data with metadata (processing timestamp, record ID, processing status)
  - Store the enriched data as JSON files in the S3 bucket with a structured key pattern (e.g., `processed-data/year/month/day/record-id.json`)

#### S3 Bucket Configuration

- **Private S3 Bucket**: Create a private S3 bucket for storing processed data
- **Security**: The bucket must block all public access
- **Encryption**: Enable server-side encryption (SSE-S3)
- **Versioning**: Enable versioning for data integrity
- **Object Key Structure**: Use a hierarchical structure for organized storage

#### Audit System Configuration

- **Audit DynamoDB Table**: Create a separate DynamoDB table for storing audit logs of failed processing events
- **Table Schema**:
  - Partition key: `auditId` (string)
  - Sort key: `timestamp` (string)
  - Global Secondary Index: `failure-type-index` for querying by failure type and timestamp
- **Audit Lambda Function**: Create a separate Lambda function to process DLQ messages and store audit records
- **SQS Integration**: Configure the audit Lambda to be triggered by messages from the Dead-Letter Queue
- **Audit Data Structure**: Store comprehensive failure information including request ID, function ARN, failure type, stream information, and complete DLQ message context

#### IAM Permissions (Critical)

**Main Processing Lambda Role** must grant **only** the following permissions (least privilege):

- To read from the DynamoDB stream (`dynamodb:GetRecords`, `dynamodb:GetShardIterator`, `dynamodb:DescribeStream`)
- To write objects to the S3 bucket (`s3:PutObject`, `s3:PutObjectAcl`)
- To write logs to CloudWatch (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`)
- Note: SQS DLQ permissions are handled automatically by the Event Source Mapping's `onFailure` configuration

**Audit Lambda Role** must grant **only** the following permissions (least privilege):

- To write to the audit DynamoDB table (`dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:GetItem`)
- To read and delete messages from the SQS DLQ (`sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`)
- To write logs to CloudWatch (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`)

### 3. Error Handling and Monitoring

#### Dead-Letter Queue (DLQ)

- Create an SQS queue to act as a DLQ for the Lambda function
- Configure the Lambda's `onFailure` property to point to this SQS queue
- This captures failed processing events after retry attempts are exhausted

#### Audit System

- **Audit Lambda Integration**: Configure the audit Lambda function to be triggered by DLQ messages
- **Permanent Storage**: Failed events are automatically processed by the audit Lambda and stored in the audit DynamoDB table
- **Structured Audit Records**: Each audit record includes failure type, request context, stream information, and complete DLQ message for comprehensive analysis
- **Query Capabilities**: Support querying audit logs by failure type, timestamp, and other criteria using DynamoDB queries and GSI

#### CloudWatch Monitoring

- Create a CloudWatch Alarm that monitors the Lambda function's `Errors` metric
- The alarm should trigger if the error count is greater than or equal to 5 within a 5-minute period

### 4. Resource Tagging and Security

- Implement consistent resource tagging for all infrastructure components
- Follow AWS security best practices for IAM roles and policies
- Ensure all resources follow the specified naming convention

## Output Requirements

- The code must be complete and self-contained, including all necessary imports, the Stack definition, and the App instantiation
- Strictly adhere to the `dev-<resource>-<team>` naming convention for all constructs
- Use `CfnOutput` to export the DynamoDB table name, Lambda function name, S3 bucket name, audit table name, and audit Lambda function name
- The solution must be deployable using standard CDK commands (`cdk synth`, `cdk deploy`)

## Success Criteria

The solution should demonstrate:

1. Proper CDK TypeScript implementation with all necessary imports
2. DynamoDB table with streams enabled and proper configuration
3. Lambda function with event source mapping from DynamoDB stream
4. Private S3 bucket with encryption, versioning, and public access blocked
5. Lambda function processes data, enriches with metadata, and stores to S3
6. IAM roles with least privilege permissions (separate roles for main and audit Lambdas)
7. SQS Dead-Letter Queue with proper Lambda integration
8. Audit DynamoDB table with proper schema and GSI for querying
9. Audit Lambda function with SQS event source from DLQ
10. Comprehensive audit records with failure context and DLQ message details
11. CloudWatch Alarm for Lambda error monitoring
12. Consistent naming convention across all resources
13. Proper resource outputs for integration testing (DynamoDB, Lambda, S3, Audit resources)
