# Serverless Payment Webhook Processing System

## Project Overview

We need to build a serverless payment processing system that can handle webhook notifications from payment providers. This system will process events asynchronously, store transaction records, and send email notifications to customers.

## Business Context

A fintech startup requires a robust, scalable payment processing API that can:
- Receive webhook notifications from various payment providers
- Process payment events without blocking the webhook response
- Store transaction data securely
- Send timely email notifications to customers
- Handle high transaction volumes efficiently

## Architecture Requirements

### Core Infrastructure
- **Region**: Deploy everything in the us-east-2 region
- **Serverless Approach**: Use fully managed AWS services to minimize operational overhead
- **Security**: Implement encryption at rest and least privilege access controls
- **Monitoring**: Include comprehensive logging and distributed tracing

### API Gateway Setup
We need a REST API (not HTTP API) with three main endpoints:

1. **POST /webhooks/payment** - Receives payment webhook notifications
2. **GET /transactions/{id}** - Retrieves specific transaction details
3. **POST /transactions/{id}/notify** - Triggers manual notifications

Requirements:
- Enable request validation using JSON schemas for POST endpoints
- Use AWS IAM authorization for all endpoints
- Enable CloudWatch logging at INFO level
- Integrate with Lambda functions for processing

### Lambda Functions
Deploy three Python 3.11 Lambda functions:

1. **Webhook Processor** - Handles incoming payment webhooks
2. **Transaction Reader** - Retrieves transaction data
3. **Notification Sender** - Sends email notifications

Configuration for all functions:
- 512MB memory allocation
- X-Ray tracing enabled for debugging
- Environment variables encrypted with KMS
- Reserved concurrent executions to prevent throttling
- Dead letter queues for error handling
- Appropriate IAM roles with least privilege access

### Data Storage
Set up a DynamoDB table named 'payment_transactions':
- **Partition Key**: transaction_id
- **Sort Key**: timestamp
- **Billing Mode**: On-demand
- **Features**: Point-in-time recovery enabled
- **Encryption**: Server-side encryption with customer-managed KMS key

### Message Processing
Configure an SQS queue for asynchronous notification processing:
- Visibility timeout: 300 seconds
- Separate dead letter queues for each Lambda function
- Integration with SNS for email delivery

### Notification System
Create an SNS topic for email notifications:
- Email protocol subscription
- Integration with SQS for reliable delivery

### Security & Encryption
Implement a KMS customer-managed key:
- Automatic rotation enabled
- Appropriate key policy for service access
- Used for encrypting DynamoDB data and Lambda environment variables

### Monitoring & Logging
Set up comprehensive observability:
- CloudWatch log groups with 7-day retention for all Lambda functions and API Gateway
- X-Ray for distributed tracing across all services
- Centralized logging for troubleshooting

## Expected Deliverables

The Terraform configuration should include:
- Complete infrastructure as code with all AWS resources
- Proper resource interconnections and dependencies
- IAM policies following least privilege principles
- API Gateway integrations with Lambda functions
- Lambda permissions for API Gateway invocation
- All security and encryption configurations

## Outputs Required

The configuration should output:
- API Gateway invoke URL
- DynamoDB table name
- SQS queue URL

These outputs will be used for integration testing and application configuration.