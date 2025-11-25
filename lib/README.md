# Fraud Detection Pipeline - Pulumi TypeScript

A serverless fraud detection pipeline built with Pulumi and TypeScript, featuring real-time transaction processing, pattern-based fraud detection, and automated alerting.

## Architecture Overview

This implementation creates a complete event-driven fraud detection system using AWS serverless services:

- **DynamoDB Table**: Stores transaction records with composite key (transactionId + timestamp)
- **Lambda Functions**:
  - `transaction-processor`: Receives and stores transactions (3008MB, ARM64)
  - `fraud-detector`: Analyzes transactions for fraud patterns (1024MB, ARM64)
- **EventBridge**: Custom event bus routes high-value transactions for analysis
- **SNS**: Sends fraud alerts via email notifications
- **SQS**: Dead-letter queues for failed Lambda invocations
- **KMS**: Encrypts Lambda environment variables
- **CloudWatch Logs**: 30-day retention for all Lambda functions

## Prerequisites

- Node.js 18.x or higher
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- TypeScript 5.x

## Configuration

The infrastructure requires the following configuration values:

1. **environmentSuffix** (required): Unique suffix for resource naming
2. **emailAddress** (optional): Email address for fraud alerts (defaults to alerts@example.com)
3. **aws:region** (optional): AWS region (defaults to us-east-1)

Create a stack configuration file (e.g., `Pulumi.dev.yaml`):

```yaml
config:
  fraud-detection-pipeline:environmentSuffix: dev-001
  fraud-detection-pipeline:emailAddress: your-email@example.com
  aws:region: us-east-1
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Build TypeScript code:

```bash
npm run build
```

3. Initialize Pulumi stack:

```bash
pulumi stack init dev
```

## Deployment

Deploy the infrastructure:

```bash
# Using npm script
npm run pulumi:deploy

# Or directly with Pulumi CLI
pulumi up --yes
```

The deployment will output important resource identifiers:

- `eventBridgeBusArn`: ARN of the custom EventBridge bus
- `snsTopicArn`: ARN of the fraud alerts SNS topic
- `dynamoDbTableName`: Name of the transactions DynamoDB table
- `transactionProcessorFunctionName`: Name of the transaction processor Lambda
- `fraudDetectorFunctionName`: Name of the fraud detector Lambda

## Testing the Pipeline

### 1. Confirm SNS Email Subscription

After deployment, check your email inbox for an SNS subscription confirmation email and click the confirmation link.

### 2. Test Transaction Processing

Invoke the transaction-processor Lambda with a test transaction:

```bash
# Low-value transaction (won't trigger fraud detection)
aws lambda invoke \
  --function-name transaction-processor-dev-001 \
  --payload '{"transactionId":"txn-001","amount":500,"userId":"user-123","merchantId":"merchant-456","timestamp":1234567890}' \
  response.json

# High-value transaction (will trigger fraud detection)
aws lambda invoke \
  --function-name transaction-processor-dev-001 \
  --payload '{"transactionId":"txn-002","amount":15000,"userId":"user-123","merchantId":"merchant-456","timestamp":1234567891}' \
  response.json
```

### 3. Verify DynamoDB Storage

Check that transactions are stored in DynamoDB:

```bash
aws dynamodb get-item \
  --table-name transactions-dev-001 \
  --key '{"transactionId":{"S":"txn-001"},"timestamp":{"N":"1234567890"}}'
```

### 4. Check CloudWatch Logs

View Lambda execution logs:

```bash
# Transaction processor logs
aws logs tail /aws/lambda/transaction-processor-dev-001 --follow

# Fraud detector logs
aws logs tail /aws/lambda/fraud-detector-dev-001 --follow
```

## Fraud Detection Logic

The fraud-detector Lambda uses pattern matching to calculate a fraud score:

| Pattern | Score | Description |
|---------|-------|-------------|
| Amount > $50,000 | +40 | Extremely high transaction |
| Amount > $10,000 | +20 | High transaction |
| Round number (divisible by 1000) | +10 | Common fraud indicator |
| Weekend transaction | +15 | Higher fraud risk period |

**Alert Threshold**: Fraud score >= 30 triggers an SNS alert.

## Resource Naming Convention

All resources include the `environmentSuffix` parameter for uniqueness:

- DynamoDB: `transactions-${environmentSuffix}`
- Lambda: `transaction-processor-${environmentSuffix}`, `fraud-detector-${environmentSuffix}`
- EventBridge: `fraud-detection-bus-${environmentSuffix}`
- SNS: `fraud-alerts-${environmentSuffix}`
- SQS: `transaction-processor-dlq-${environmentSuffix}`, `fraud-detector-dlq-${environmentSuffix}`

## Cost Optimization Features

- **ARM64 Architecture**: All Lambda functions use Graviton2 processors for 20% cost savings
- **On-Demand Billing**: DynamoDB uses PAY_PER_REQUEST mode (no provisioned capacity)
- **Reserved Concurrency**: Prevents cold starts while limiting concurrent executions
- **Efficient Memory Allocation**: Right-sized memory for each Lambda function

## Security Features

- **Least Privilege IAM**: Each Lambda has minimal required permissions
- **KMS Encryption**: Lambda environment variables encrypted at rest
- **DynamoDB Encryption**: Server-side encryption enabled
- **Point-in-Time Recovery**: DynamoDB PITR enabled for data protection
- **Dead-Letter Queues**: Failed events captured for analysis

## Monitoring and Logging

- **CloudWatch Logs**: 30-day retention for compliance
- **DLQ Monitoring**: Set up CloudWatch alarms on DLQ depth
- **Lambda Metrics**: Monitor invocation count, duration, errors, and throttles
- **EventBridge Metrics**: Track event delivery and rule execution

## Cleanup

To destroy all resources:

```bash
# Using npm script
npm run pulumi:destroy

# Or directly with Pulumi CLI
pulumi destroy --yes
```

All resources are designed to be fully destroyable without manual intervention.

## Troubleshooting

### Issue: SNS alerts not received

- Verify email subscription is confirmed
- Check fraud-detector CloudWatch logs for SNS publish errors
- Verify IAM role has `sns:Publish` permission

### Issue: Fraud detector not triggered

- Verify transaction amount is > $10,000
- Check transaction-processor logs for EventBridge publish errors
- Verify EventBridge rule pattern matches event structure

### Issue: DynamoDB access denied

- Verify IAM role has DynamoDB permissions
- Check resource names match expected pattern with environmentSuffix
- Verify KMS key allows Lambda role to decrypt environment variables

## Architecture Decisions

1. **ARM64 Architecture**: Chosen for cost optimization (20% savings) without performance impact
2. **On-Demand DynamoDB**: Suitable for variable workload, avoids over-provisioning
3. **Reserved Concurrency**: Set to prevent cold starts while controlling costs
4. **Inline Lambda Code**: Simplified deployment, suitable for demo purposes
5. **KMS Encryption**: Required by security constraints for environment variables
6. **30-Day Log Retention**: Compliance requirement specified in constraints

## Exports for External Integrations

The stack exports the following values for integration with other systems:

```typescript
export const eventBridgeBusArn = fraudDetectionBus.arn;
export const snsTopicArn = fraudAlertsTopic.arn;
export const dynamoDbTableName = transactionsTable.name;
export const transactionProcessorFunctionArn = transactionProcessorFunction.arn;
```

Access exports via:

```bash
pulumi stack output eventBridgeBusArn
pulumi stack output snsTopicArn
```

## Production Considerations

For production deployment, consider:

1. **Enhanced Fraud Detection**: Implement ML-based models using Amazon Fraud Detector
2. **Velocity Checks**: Query user transaction history for anomaly detection
3. **Geographic Checks**: Validate transaction location against user profile
4. **Rate Limiting**: Implement API Gateway with throttling
5. **Multi-Region**: Deploy across regions for high availability
6. **Enhanced Monitoring**: Set up CloudWatch alarms and dashboards
7. **Separate Lambda Packages**: Use Lambda layers for shared dependencies
8. **VPC Configuration**: Deploy Lambda functions in VPC for enhanced security

## License

MIT
