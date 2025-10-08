# Customer Feedback Processing System - Terraform Infrastructure

This Terraform configuration deploys a complete serverless feedback processing system with sentiment analysis and analytics capabilities on AWS.

## Architecture Components

### 1. Storage Layer
- DynamoDB Table with point-in-time recovery, PAY_PER_REQUEST billing
- S3 Data Lake with year/month/day partitioning and versioning
- S3 Athena Results Bucket with 30-day lifecycle policy

### 2. Processing Layer
- Lambda Function (Python 3.11) for feedback processing
- AWS Comprehend sentiment analysis (us-west-2)
- CloudWatch metrics publishing

### 3. API Layer
- API Gateway REST API with Lambda proxy integration
- POST /feedback endpoint

### 4. Analytics Layer
- Glue Catalog Database and Crawler (daily at midnight UTC)
- Athena Workgroup with SSE-S3 encryption

### 5. Monitoring
- CloudWatch Log Groups with 14-day retention
- CloudWatch Alarms for Lambda errors and DynamoDB throttles

## Key Features
1. Environment Isolation via environment_suffix variable
2. Regional Compatibility (Comprehend in us-west-2)
3. IAM Least Privilege policies
4. Comprehensive Testing (81 unit + 24 integration tests)