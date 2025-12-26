# Serverless Cryptocurrency Price Alert System

This CloudFormation template deploys a serverless architecture for processing cryptocurrency price alerts with webhook integration, real-time alert evaluation, and SMS notifications.

## Architecture

- **API Gateway**: REST API with POST /webhooks endpoint for receiving price updates
- **Lambda Functions**:
  - ProcessWebhook: Validates and stores incoming price data (1GB memory, arm64)
  - CheckAlerts: Evaluates price thresholds from DynamoDB streams (512MB memory, arm64)
  - SendNotification: Delivers SMS notifications via SNS (256MB memory, arm64)
  - CleanupHistory: Removes old price data hourly (256MB memory, arm64)
- **DynamoDB Tables**:
  - PriceAlerts: Stores user alert configurations (userId, alertId)
  - PriceHistory: Stores recent price data (symbol, timestamp) with TTL
- **SNS**: Topic for SMS notifications
- **EventBridge**: Hourly schedule for cleanup function
- **CloudWatch**: Alarms for Lambda errors and DynamoDB throttling

## Deployment

### Prerequisites

- AWS CLI configured
- CloudFormation deployment permissions

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name crypto-alert-system \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Lambda Functions

After stack creation, package and deploy the Lambda functions:

```bash
# Package Lambda functions
cd lib/lambda
zip -r process-webhook.zip process-webhook.js node_modules/
zip -r check-alerts.zip check-alerts.js node_modules/
zip -r send-notification.zip send-notification.js node_modules/
zip -r cleanup-history.zip cleanup-history.js node_modules/

# Update Lambda functions
aws lambda update-function-code \
  --function-name ProcessWebhook-dev \
  --zip-file fileb://process-webhook.zip

aws lambda update-function-code \
  --function-name CheckAlerts-dev \
  --zip-file fileb://check-alerts.zip

aws lambda update-function-code \
  --function-name SendNotification-dev \
  --zip-file fileb://send-notification.zip

aws lambda update-function-code \
  --function-name CleanupHistory-dev \
  --zip-file fileb://cleanup-history.zip
```

## Configuration

### API Key

Retrieve the API key for webhook authentication:

```bash
aws apigateway get-api-key \
  --api-key <api-key-id> \
  --include-value
```

### Create Price Alert

Add an alert to the PriceAlerts table:

```bash
aws dynamodb put-item \
  --table-name PriceAlerts-dev \
  --item '{
    "userId": {"S": "user123"},
    "alertId": {"S": "alert001"},
    "cryptocurrency": {"S": "BTC"},
    "threshold": {"N": "50000"},
    "condition": {"S": "above"}
  }'
```

### Send Test Webhook

```bash
curl -X POST \
  https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/webhooks \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "price": 51000,
    "timestamp": 1234567890
  }'
```

## Monitoring

- Lambda error alarms trigger when error rate exceeds 1%
- DynamoDB throttle alarms trigger on UserErrors > 5
- CloudWatch Logs retention: 30 days
- All metrics available in CloudWatch dashboard

## Cleanup

```bash
aws cloudformation delete-stack \
  --stack-name crypto-alert-system \
  --region us-east-1
```
