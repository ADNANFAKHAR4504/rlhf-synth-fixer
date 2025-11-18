# Task: Serverless Payment Notification Processing System

## Platform and Language (MANDATORY)
Create infrastructure using **AWS CDK with Python**.

## Task Description

Create a CDK Python program to deploy a serverless payment notification processing system. The configuration must:

1. Deploy an API Gateway REST API with /webhooks endpoint accepting POST requests with API key authentication.
2. Create a Lambda function (process-payment) that validates incoming webhook payloads and writes to DynamoDB.
3. Set up a DynamoDB table (payment-transactions) with partition key 'transaction_id' and sort key 'timestamp'.
4. Implement an SQS queue (payment-processing-queue) that receives messages from the Lambda function.
5. Create a second Lambda function (process-accounting) triggered by SQS to handle accounting updates.
6. Configure SNS topic (payment-notifications) for alerting on failed transactions.
7. Set up a third Lambda function (notify-failures) triggered by DLQ messages to send alerts via SNS.
8. Implement CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes.
9. Create a Lambda Layer containing common libraries (boto3, requests, jsonschema).
10. Configure X-Ray tracing for all Lambda functions and API Gateway.
11. Set up CloudWatch Logs Insights queries for transaction analysis.
12. Enable AWS WAF on API Gateway with rate-based rules.

Expected output: A complete CDK Python application with stack definition, Lambda function code as inline strings or assets, proper IAM policies, and deployment instructions. The solution should handle 10,000 transactions per minute at peak load with sub-second processing latency.

## Context

A fintech startup needs to process real-time payment notifications from multiple payment providers. The system must handle variable loads efficiently, store transaction records for compliance, and trigger downstream accounting processes while maintaining PCI DSS compliance standards.

## Requirements

Production serverless infrastructure deployed in us-east-1 region for payment processing system. Architecture includes API Gateway for webhook ingestion, Lambda functions for processing, DynamoDB for transaction storage, SQS for message queuing, and SNS for notifications. Requires AWS CDK 2.x with Python 3.8+, AWS CLI configured with appropriate credentials. No VPC required as all services are serverless. CloudWatch Logs for centralized logging with 30-day retention. IAM roles follow least-privilege principle with separate roles for each Lambda function.

## Constraints

- Lambda functions must have reserved concurrent executions set to prevent throttling
- Lambda functions must use Python 3.11 runtime with Lambda Layers for shared dependencies
- All Lambda functions must use ARM-based Graviton2 processors for cost optimization
- All resources must be tagged with Environment, Owner, and CostCenter tags
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- API Gateway must implement request throttling at 1000 requests per second per API key
- Dead letter queues must be configured for all SQS queues with a retention period of 14 days

## Critical Requirements (MANDATORY)

### Resource Naming
- ALL named resources MUST include `environmentSuffix` parameter
- Pattern: `resourceName-${environmentSuffix}` or `f"resource-name-{environment_suffix}"`
- This ensures no conflicts in parallel deployments

### Destroyability
- NO RemovalPolicy.RETAIN allowed
- NO deletion_protection: true allowed
- All resources must be cleanable after testing

### Lambda Compatibility
- For Node.js 18+ runtimes: Use AWS SDK v3 or extract data from event object (AWS SDK v2 not available)
- Python Lambda functions should avoid unnecessary SDK dependencies when event data is sufficient

### Security Best Practices
- Enable encryption for data at rest (DynamoDB, S3, etc.)
- Use IAM least privilege for all roles
- Enable CloudWatch logging with appropriate retention periods

### Cost Optimization
- Prefer serverless and on-demand resources
- Use appropriate retention periods for logs and data
- Tag all resources for cost tracking
