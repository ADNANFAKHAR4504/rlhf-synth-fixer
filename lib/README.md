# Cryptocurrency Price Alert System

A serverless real-time cryptocurrency price alert processing system built with AWS CloudFormation, Lambda, DynamoDB, and EventBridge.

## Architecture

The system consists of three Lambda functions orchestrated by EventBridge:

1. **PriceWebhookProcessor** (1GB, 100 reserved concurrency)
   - Receives real-time price updates from cryptocurrency exchanges via webhooks
   - Stores price data in DynamoDB for historical tracking
   - Handles burst traffic during market volatility

2. **AlertMatcher** (2GB, 50 reserved concurrency)
   - Triggered every 60 seconds by EventBridge
   - Scans user alerts and compares against current prices
   - Identifies alerts where threshold conditions are met

3. **ProcessedAlerts** (512MB)
   - Receives matched alerts via Lambda destinations
   - Updates alert status to 'notified' in DynamoDB
   - Prepares notifications for users (SNS integration point)

## AWS Services

- **Lambda**: Serverless compute with ARM64 Graviton2 processors for cost optimization
- **DynamoDB**: NoSQL storage with on-demand billing and point-in-time recovery
- **EventBridge**: Scheduled triggers for alert matching every 60 seconds
- **IAM**: Least privilege roles with specific DynamoDB and CloudWatch permissions
- **CloudWatch Logs**: 3-day retention for debugging and monitoring

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- AWS account with permissions to create Lambda, DynamoDB, EventBridge, IAM resources

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name crypto-alert-system-dev \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name crypto-alert-system-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name crypto-alert-system-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Configuration

The template accepts the following parameter:

- **EnvironmentSuffix**: Environment identifier (default: 'dev')
  - Used for resource naming to support multiple environments
  - Example values: dev, staging, prod

## Testing

### Test PriceWebhookProcessor

```bash
# Get function ARN from outputs
WEBHOOK_ARN=$(aws cloudformation describe-stacks \
  --stack-name crypto-alert-system-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`PriceWebhookProcessorArn`].OutputValue' \
  --output text)

# Invoke with test payload
aws lambda invoke \
  --function-name PriceWebhookProcessor-dev \
  --payload '{"body": "{\"symbol\": \"BTC\", \"price\": 45000, \"exchange\": \"coinbase\"}"}' \
  response.json

cat response.json
```

### Create Test User Alert

```bash
# Get table name
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name crypto-alert-system-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`CryptoAlertsTableName`].OutputValue' \
  --output text)

# Create alert
aws dynamodb put-item \
  --table-name $TABLE_NAME \
  --item '{
    "userId": {"S": "user123"},
    "alertId": {"S": "alert001"},
    "symbol": {"S": "BTC"},
    "threshold": {"N": "50000"},
    "condition": {"S": "above"},
    "status": {"S": "active"},
    "type": {"S": "user_alert"}
  }'
```

### Monitor EventBridge Triggers

```bash
# View AlertMatcher logs
aws logs tail /aws/lambda/AlertMatcher-dev --follow
```

## Resource Naming

All resources include the `EnvironmentSuffix` parameter for multi-environment support:

- DynamoDB Table: `CryptoAlerts-{EnvironmentSuffix}`
- Lambda Functions: `{FunctionName}-{EnvironmentSuffix}`
- IAM Roles: `{FunctionName}-Role-{EnvironmentSuffix}`
- Log Groups: `/aws/lambda/{FunctionName}-{EnvironmentSuffix}`
- EventBridge Rule: `AlertMatcher-Schedule-{EnvironmentSuffix}`

## Cost Optimization

- **ARM64 Architecture**: All Lambda functions use Graviton2 processors for 20% cost savings
- **On-Demand Billing**: DynamoDB scales automatically, only pay for usage
- **Reserved Concurrency**: Prevents runaway costs during traffic spikes
- **Short Log Retention**: 3-day CloudWatch Logs retention minimizes storage costs
- **Serverless Architecture**: No idle infrastructure costs

## Security

- **Least Privilege IAM**: Each Lambda role has specific permissions for required actions only
- **No Wildcard Actions**: All IAM policies specify exact actions (no `*` permissions)
- **Point-in-Time Recovery**: DynamoDB backup enabled for data protection
- **CloudWatch Logging**: All functions log for security audit trails

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name crypto-alert-system-dev \
  --region us-east-1
```

All resources are configured with `DeletionPolicy: Delete` for complete cleanup.

## Future Enhancements

- Add SNS topic for multi-channel notifications (email, SMS, push)
- Implement SQS FIFO queue between webhook and processor for guaranteed ordering
- Add API Gateway for manual price testing without webhooks
- Implement dead letter queue for failed alert processing
- Add X-Ray tracing for distributed performance monitoring
