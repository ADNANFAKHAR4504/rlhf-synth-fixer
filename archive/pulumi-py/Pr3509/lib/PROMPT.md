# Infrastructure Requirements for Logistics Tracking API

## Background
A logistics firm requires a serverless API to handle 1,800 daily tracking updates. The system must be secure, scalable, and provide comprehensive performance metrics for monitoring and optimization.

## Problem Statement
Deploy a serverless API infrastructure in AWS us-west-2 region with the following components:
- REST API endpoints for tracking updates using Amazon API Gateway
- Lambda function with Python 3.9 runtime to process tracking requests
- DynamoDB table for storing tracking data with on-demand scaling
- IAM roles and policies for secure, least-privilege access
- CloudWatch metrics and alarms for monitoring API performance
- AWS Systems Manager Parameter Store for secure configuration management

## Technical Constraints
1. DynamoDB must use on-demand billing mode for automatic scaling
2. API Gateway must be secured with IAM authentication
3. All sensitive configuration values must be stored in SSM Parameter Store
4. Lambda function should have appropriate timeout and memory settings for tracking updates
5. CloudWatch alarms should monitor API latency and error rates
6. Use AWS Lambda Powertools for Python for enhanced observability

## Implementation Requirements
Generate infrastructure code using Pulumi with Python that includes:
1. API Gateway REST API with tracking endpoints (/track POST and /status GET)
2. Lambda function with Python 3.9 runtime, configured with environment variables from Parameter Store
3. DynamoDB table with partition key for tracking_id and sort key for timestamp
4. IAM execution role for Lambda with permissions for DynamoDB, CloudWatch Logs, and Parameter Store
5. CloudWatch dashboard with key metrics and alarms for 4XX/5XX errors and latency thresholds
6. SSM Parameter Store entries for API configuration, database connection strings, and feature flags
7. API Gateway request/response models and validators for input validation
8. Lambda dead letter queue for failed processing attempts

Please provide complete infrastructure code implementation with proper error handling and resource tagging.