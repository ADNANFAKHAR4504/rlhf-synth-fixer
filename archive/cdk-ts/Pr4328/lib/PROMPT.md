# Serverless API Infrastructure for Digital Learning Platform

You are an expert AWS Infrastructure Engineer. Create infrastructure using **AWS CDK with TypeScript**.

## Platform and Language Requirements

- Platform: **CDK (AWS Cloud Development Kit)**
- Language: **TypeScript**
- Region: **ap-southeast-1**

## Problem Statement

Create a serverless API infrastructure for a digital learning platform that needs to serve educational content while maintaining FERPA compliance. The system must handle educational content delivery with security, reliability, and high availability.

## Core Requirements

### 1. Serverless API Backend
- API Gateway REST API for educational content delivery
- Lambda functions to process requests and serve content
- DynamoDB table for storing educational content metadata
- Integration between API Gateway and Lambda

### 2. FERPA Compliance Requirements
FERPA (Family Educational Rights and Privacy Act) requires:
- Encryption of student data at rest using AWS KMS
- Encryption in transit using HTTPS/TLS
- Access control with IAM roles following least privilege
- Audit logging of all API access
- Data retention policies for educational records

### 3. Failure Recovery Features
- Lambda automatic retry configuration
- DynamoDB point-in-time recovery enabled
- CloudWatch alarms for monitoring failures
- Dead letter queue for failed Lambda executions
- Automated backups for data protection

### 4. High Availability
- Multi-AZ DynamoDB deployment
- Lambda concurrent execution limits
- API Gateway throttling configuration
- Health monitoring and automatic recovery

### 5. Security Requirements
- API Gateway with API key authentication
- Lambda execution role with minimal permissions
- S3 bucket for content storage with encryption
- CloudWatch Logs encryption
- No public access to storage resources

## Implementation Guidelines

### Resource Naming
- ALL resources MUST include the `environmentSuffix` parameter
- Pattern: `{resource-type}-${environmentSuffix}`
- Example: `learning-api-${environmentSuffix}`

### AWS Services to Implement
- API Gateway (REST API)
- Lambda (Node.js 18.x or 20.x)
- DynamoDB (on-demand billing)
- S3 (for educational content storage)
- KMS (for encryption)
- CloudWatch Logs (for monitoring)
- CloudWatch Alarms (for failure detection)
- SQS (dead letter queue)
- IAM (roles and policies)

### Cost Optimization
- Use DynamoDB on-demand pricing
- Lambda provisioned concurrency not required
- Use S3 Intelligent-Tiering for content storage
- CloudWatch Logs retention: 7-14 days

### Educational Content API Endpoints
- GET /content - List all educational content
- GET /content/{id} - Retrieve specific content
- POST /content - Create new content
- PUT /content/{id} - Update content
- DELETE /content/{id} - Delete content

## Deliverables

Provide complete, working infrastructure code in separate files:

1. **bin/tap.ts** - CDK app entry point
2. **lib/tap-stack.ts** - Main stack with all infrastructure
3. **lib/lambda/content-handler.ts** - Lambda function code for content API

Each file should be in its own code block and ready to copy-paste directly.

## Success Criteria

- Infrastructure deploys successfully to ap-southeast-1
- API Gateway accessible with API key authentication
- Lambda functions execute and return responses
- DynamoDB stores and retrieves content
- All data encrypted at rest and in transit
- CloudWatch Alarms configured for failures
- Point-in-time recovery enabled on DynamoDB
- All resources include environmentSuffix in naming
