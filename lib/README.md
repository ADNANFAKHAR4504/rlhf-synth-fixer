# Webhook Processing Infrastructure

This Pulumi Python program deploys a serverless webhook processing infrastructure for financial transactions on AWS.

## Architecture

The infrastructure includes:

- **API Gateway REST API**: Provides a POST endpoint at `/webhook` for receiving transaction notifications
- **Lambda Function**: Validates webhook payloads and stores valid transactions (Node.js 18.x, 1024MB)
- **DynamoDB Table**: Stores transaction data with partition key `transactionId` and sort key `timestamp`
- **KMS Encryption**: Encrypts sensitive Lambda environment variables
- **CloudWatch Logs**: 30-day retention for all Lambda executions
- **X-Ray Tracing**: Enabled for performance monitoring
- **IAM Roles**: Least privilege permissions for Lambda
- **Usage Plan**: Rate limiting at 1000 requests/minute

## Prerequisites

- Python 3.8 or later
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Configuration

The infrastructure uses the following configuration:

- **Region**: us-east-1 (configurable via AWS_REGION environment variable)
- **Environment Suffix**: dev/staging/prod (configurable via ENVIRONMENT_SUFFIX)
- **Lambda Runtime**: Node.js 18.x
- **Lambda Memory**: 1024MB
- **Lambda Concurrency**: 100 reserved executions
- **API Rate Limit**: 1000 requests/minute
- **DynamoDB Billing**: On-demand
- **Log Retention**: 30 days

## Deployment

1. Install dependencies:

```bash
pip install -r requirements.txt
