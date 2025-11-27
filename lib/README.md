# Serverless Cryptocurrency Price Alert System

A complete Pulumi TypeScript infrastructure solution for a serverless cryptocurrency price alert system using AWS services.

## Architecture

This system provides real-time cryptocurrency price monitoring and alerting capabilities:

- **DynamoDB Table**: Stores user alert configurations with userId/alertId as primary key
- **DynamoDB Streams**: Automatically triggers alert processing when alerts are modified
- **Price Checker Lambda**: Scans alerts every minute and checks current prices against thresholds
- **Alert Processor Lambda**: Sends SNS notifications when price thresholds are met
- **EventBridge Rule**: Schedules price checker to run every minute
- **SNS Topic**: Delivers email notifications to users
- **KMS Key**: Encrypts Lambda environment variables containing sensitive data
- **CloudWatch Logs**: Captures Lambda execution logs with 14-day retention

## AWS Services Used

- AWS Lambda (2 functions)
- Amazon DynamoDB (with Streams and Global Secondary Index)
- Amazon EventBridge
- Amazon SNS
- AWS KMS
- AWS IAM
- Amazon CloudWatch Logs

## Prerequisites

- Node.js 20.x or later
- Pulumi 3.x or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the above services

## Project Structure

```
.
├── index.ts              # Main Pulumi infrastructure code
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
├── Pulumi.yaml           # Pulumi project configuration
└── README.md             # This file
```

## Infrastructure Components

### DynamoDB Table

- **Name**: `crypto-alerts-${environmentSuffix}`
- **Keys**:
  - Partition Key: `userId` (String)
  - Sort Key: `alertId` (String)
- **Global Secondary Index**: `coinSymbol-index`
  - Hash Key: `coinSymbol`
  - Projected Attributes: userId, alertId, threshold, condition
- **Features**:
  - On-demand billing mode
  - Point-in-time recovery enabled
  - Streams enabled (NEW_AND_OLD_IMAGES)

### Lambda Functions

#### Price Checker Lambda

- **Name**: `price-checker-${environmentSuffix}`
- **Runtime**: Node.js 18.x (ARM64 architecture)
- **Trigger**: EventBridge rule (every minute)
- **Function**: Scans DynamoDB for all alerts, fetches current prices, checks thresholds
- **Permissions**: Read access to DynamoDB table and indexes, KMS decrypt

#### Alert Processor Lambda

- **Name**: `alert-processor-${environmentSuffix}`
- **Runtime**: Node.js 18.x (ARM64 architecture)
- **Trigger**: DynamoDB Streams
- **Function**: Processes new/modified alerts and sends SNS notifications
- **Permissions**: Read DynamoDB streams, publish to SNS, KMS decrypt

### EventBridge Rule

- **Name**: `price-checker-rule-${environmentSuffix}`
- **Schedule**: `cron(* * * * ? *)` (every minute, UTC timezone)
- **Target**: Price Checker Lambda function

### SNS Topic

- **Name**: `price-alerts-${environmentSuffix}`
- **Encryption**: AWS managed key (alias/aws/sns)
- **Purpose**: Sends email notifications when price alerts are triggered

### KMS Key

- **Description**: Encrypts Lambda environment variables
- **Alias**: `alias/crypto-alerts-${environmentSuffix}`
- **Deletion Window**: 7 days

## Deployment

### Install Dependencies

```bash
npm install
```

### Configure Pulumi Stack

```bash
# Create a new stack (or select existing)
pulumi stack init dev

# Configure AWS region
pulumi config set aws:region us-east-1
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy all resources
pulumi up
```

### View Outputs

```bash
pulumi stack output
```

Expected outputs:
- `tableName`: DynamoDB table name
- `tableArn`: DynamoDB table ARN
- `topicArn`: SNS topic ARN
- `priceCheckerFunctionName`: Price checker Lambda function name
- `priceCheckerFunctionArn`: Price checker Lambda function ARN
- `alertProcessorFunctionName`: Alert processor Lambda function name
- `alertProcessorFunctionArn`: Alert processor Lambda function ARN
- `kmsKeyId`: KMS key ID
- `eventRuleName`: EventBridge rule name

## Usage

### Create an Alert

Add an item to the DynamoDB table:

```bash
aws dynamodb put-item \
  --table-name crypto-alerts-dev \
  --item '{
    "userId": {"S": "user123"},
    "alertId": {"S": "alert001"},
    "coinSymbol": {"S": "BTC"},
    "threshold": {"N": "50000"},
    "condition": {"S": "above"}
  }'
```

### Subscribe to Notifications

Subscribe an email address to the SNS topic:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output topicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

Confirm the subscription via the email you receive.

### Monitor Execution

View Lambda logs:

```bash
# Price checker logs
aws logs tail /aws/lambda/price-checker-dev --follow

# Alert processor logs
aws logs tail /aws/lambda/alert-processor-dev --follow
```

## Testing

### Test Price Checker Lambda

Manually invoke the price checker:

```bash
aws lambda invoke \
  --function-name price-checker-dev \
  --payload '{}' \
  response.json

cat response.json
```

### Test Alert Processor Lambda

The alert processor is automatically triggered by DynamoDB streams when you add/modify items in the table.

## Resource Naming Convention

All resources include the environment suffix (Pulumi stack name) to support multiple deployments:

- Pattern: `{resource-name}-${environmentSuffix}`
- Example: `crypto-alerts-dev`, `price-checker-prod`

This allows multiple environments (dev, staging, prod) to coexist in the same AWS account.

## Security Features

- **IAM Roles**: Least-privilege policies for each Lambda function
- **KMS Encryption**: Environment variables encrypted at rest
- **SNS Encryption**: Server-side encryption using AWS managed keys
- **DynamoDB Encryption**: Default encryption at rest
- **Point-in-Time Recovery**: Enabled for DynamoDB table

## Cost Optimization

- **ARM64 Architecture**: Lambda functions use ARM64 for 20% cost savings
- **On-Demand Billing**: DynamoDB scales automatically without provisioned capacity
- **Serverless**: No idle infrastructure costs
- **Log Retention**: CloudWatch Logs retained for only 14 days

## Monitoring and Logging

- All Lambda functions log to CloudWatch Logs
- Log retention set to 14 days
- Execution metrics available in CloudWatch
- DynamoDB metrics available in CloudWatch

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

This will remove all infrastructure components. Confirm the deletion when prompted.

## Design Decisions

### Why ARM64 for Lambda?

ARM64 (Graviton2) provides better price-performance:
- 20% cost reduction compared to x86_64
- Better performance for compute-intensive workloads

### Why On-Demand Billing for DynamoDB?

On-demand billing provides:
- No capacity planning required
- Automatic scaling
- Pay only for what you use
- Suitable for unpredictable workloads

### Why DynamoDB Streams?

DynamoDB Streams enable:
- Real-time processing of table changes
- Automatic Lambda triggers
- Event-driven architecture
- Decoupling between components

### Why Global Secondary Index?

The GSI on `coinSymbol` enables:
- Fast queries by cryptocurrency symbol
- Efficient price checking across all alerts for a coin
- Optimized read patterns

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:

```bash
aws logs tail /aws/lambda/price-checker-dev --follow
```

### DynamoDB Access Denied

Verify IAM policies:

```bash
pulumi stack output priceCheckerFunctionArn
aws iam get-role-policy --role-name price-checker-role-dev --policy-name price-checker-policy-dev
```

### SNS Notifications Not Received

1. Verify email subscription is confirmed
2. Check SNS topic permissions
3. Review alert processor Lambda logs

### EventBridge Rule Not Triggering

Verify rule is enabled:

```bash
aws events describe-rule --name price-checker-rule-dev
```

## Limitations

- Mock price data (production would integrate with actual exchange APIs)
- No API for managing alerts (would require API Gateway)
- Single-region deployment
- No dead-letter queue for failed notifications

## Future Enhancements

1. **API Gateway**: REST API for alert management
2. **SQS Queue**: Buffer between price checker and alert processor
3. **Step Functions**: Complex multi-condition alert logic
4. **Multi-Region**: Deploy to multiple regions for high availability
5. **Real Exchange Integration**: Connect to actual cryptocurrency exchanges
6. **WebSocket API**: Real-time price updates to web/mobile clients
7. **DynamoDB TTL**: Automatic cleanup of old alerts

## License

MIT

## Support

For issues or questions, please refer to the Pulumi documentation or AWS service documentation.
