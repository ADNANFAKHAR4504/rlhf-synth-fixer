# Cryptocurrency Price Alert System

A serverless cryptocurrency price alert system built with Pulumi and AWS. This system processes webhook events from crypto exchanges, evaluates user-defined price thresholds, and sends SMS notifications when conditions are met.

## Architecture

This infrastructure creates:

- **DynamoDB Table**: Stores user alerts with partition key `userId` and sort key `alertId`, with point-in-time recovery enabled
- **SNS Topic**: Sends SMS notifications with AWS managed encryption
- **Webhook Lambda**: Receives webhook events from exchanges, stores alerts in DynamoDB (ARM64, 1024MB, 30s timeout)
- **Price Check Lambda**: Evaluates alerts every 5 minutes via EventBridge (ARM64, 512MB, 60s timeout)
- **EventBridge Rule**: Triggers price check Lambda on schedule (rate: 5 minutes)
- **IAM Roles**: Least privilege permissions for each Lambda function
- **KMS Key**: Encrypts Lambda environment variables
- **X-Ray Tracing**: Enabled on all Lambda functions with custom subsegments

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI 3.x
- AWS CLI configured with credentials
- AWS account with appropriate permissions

## Configuration

The stack requires an `environmentSuffix` configuration parameter for resource naming:

```bash
pulumi config set environmentSuffix <your-suffix>
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Set the environment suffix:
```bash
pulumi config set environmentSuffix dev
```

3. Deploy the stack:
```bash
pulumi up
```

## Resource Naming

All resources follow the pattern: `{resource-type}-${environmentSuffix}`

Example:
- DynamoDB table: `crypto-alerts-dev`
- Webhook Lambda: `webhook-processor-dev`
- Price check Lambda: `price-checker-dev`

## Stack Outputs

After deployment, the following outputs are available:

- `webhookLambdaArn`: ARN of the webhook processor Lambda function
- `priceCheckLambdaArn`: ARN of the price check Lambda function
- `alertsTableName`: Name of the DynamoDB alerts table
- `alertTopicArn`: ARN of the SNS topic for notifications

## Lambda Functions

### Webhook Handler (`lib/lambda/webhook-handler.js`)

Processes incoming webhook events from crypto exchanges and stores alerts in DynamoDB.

**Environment Variables:**
- `ALERTS_TABLE_NAME`: DynamoDB table name for storing alerts

**Features:**
- X-Ray tracing with custom subsegments
- Error handling and logging
- ARM64 architecture for cost optimization

### Price Checker (`lib/lambda/price-checker.js`)

Evaluates all active alerts against current market prices and sends notifications.

**Environment Variables:**
- `ALERTS_TABLE_NAME`: DynamoDB table name for reading alerts
- `ALERT_TOPIC_ARN`: SNS topic ARN for sending notifications

**Features:**
- Scheduled execution via EventBridge (every 5 minutes)
- X-Ray tracing with custom subsegments
- SMS notifications via SNS
- ARM64 architecture for cost optimization

## Security

- SNS topics use AWS managed encryption (KMS)
- Lambda environment variables encrypted with KMS
- IAM roles follow least privilege principle
- X-Ray tracing enabled for monitoring

## Cost Optimization

- Lambda functions use ARM64 (Graviton2) for lower costs
- DynamoDB uses on-demand billing (no wasted capacity)
- Serverless architecture (no idle costs)

## Testing

Run unit tests:
```bash
npm test
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Tags

All resources are tagged with:
- `Environment`: production
- `Service`: price-alerts
