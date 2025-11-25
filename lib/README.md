# Crypto Price Alert System

A serverless cryptocurrency price alert system built with Pulumi and TypeScript, deployed on AWS.

## Architecture Overview

This system provides a complete webhook processing pipeline for cryptocurrency price alerts:

- **API Gateway**: REST API endpoint (`/webhook`) for receiving price data from crypto exchanges
- **Ingestion Lambda**: Processes incoming webhooks, stores price history in DynamoDB, and queues messages for evaluation
- **Evaluation Lambda**: Evaluates user-defined alert rules and sends notifications via SNS
- **DynamoDB Tables**:
  - Alert rules table (userId, alertId) with point-in-time recovery
  - Price history table with TTL for automatic data expiration
- **SQS Queue**: Message queue between ingestion and evaluation with dead letter queue for error handling
- **SNS Topic**: Push notifications with server-side encryption
- **EventBridge**: Scheduled rule triggering evaluation every 5 minutes
- **KMS Key**: Custom key for encrypting Lambda environment variables
- **X-Ray Tracing**: End-to-end distributed tracing across all services

## Prerequisites

- Node.js 18 or higher
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create IAM roles, Lambda, DynamoDB, API Gateway, SQS, SNS, EventBridge, and KMS

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Lambda function dependencies:
   ```bash
   cd lib/lambda/ingestion && npm install && cd ../../..
   cd lib/lambda/evaluation && npm install && cd ../../..
   ```

3. Set environment suffix (optional, defaults to 'dev'):
   ```bash
   export ENVIRONMENT_SUFFIX=dev
   ```

4. Deploy the stack:
   ```bash
   pulumi up
   ```

5. Review the changes and confirm deployment.

## Stack Outputs

After deployment, you'll receive:

- `apiEndpoint`: The API Gateway endpoint URL for webhooks
- `alertRulesTableName`: DynamoDB table name for alert rules
- `priceHistoryTableName`: DynamoDB table name for price history
- `snsTopicArn`: SNS topic ARN for notifications

## Usage

### Creating Alert Rules

Insert alert rules directly into the DynamoDB alert rules table:

```json
{
  "userId": "user123",
  "alertId": "alert456",
  "symbol": "BTC",
  "condition": "above",
  "threshold": 50000
}
```

### Sending Webhook Data

POST to the API Gateway endpoint:

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "coinbase",
    "symbol": "BTC",
    "price": 51000
  }'
```

### Receiving Notifications

Subscribe to the SNS topic to receive push notifications when alerts trigger.

## Configuration

All resources include the `environmentSuffix` parameter for multi-environment deployments. Resource names follow the pattern: `crypto-alert-{component}-${environmentSuffix}`.

## Security Features

- Custom KMS key encryption for Lambda environment variables
- Server-side encryption for SNS topics
- Least-privilege IAM roles with no wildcard permissions
- API Gateway request validation
- X-Ray tracing for monitoring and debugging

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured with appropriate deletion policies for safe cleanup.
