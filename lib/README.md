# Serverless Cryptocurrency Webhook Processing System

A production-ready serverless system for processing cryptocurrency transaction webhooks with real-time validation, storage, and monitoring.

## Architecture

This CloudFormation template deploys a complete serverless webhook processing system with:

- **API Gateway REST API**: Webhook endpoints at `/webhooks/{currency}` supporting BTC, ETH, and USDT
- **Lambda Function**: Python 3.11 function for transaction validation and processing
- **DynamoDB Table**: Transaction storage with `transactionId` (partition key) and `timestamp` (sort key)
- **SQS Queues**: Standard processing queue and dead letter queue for failed messages
- **CloudWatch Monitoring**: Log groups with metric filters for currency-specific transaction counting
- **X-Ray Tracing**: Distributed tracing across API Gateway and Lambda
- **KMS Encryption**: Customer managed key for Lambda environment variable encryption

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- CloudFormation access to create stacks

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name crypto-webhook-system \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name crypto-webhook-system \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Usage

### Send Webhook Request

```bash
# Get API Key
API_KEY=$(aws apigateway get-api-keys --include-values --query 'items[0].value' --output text)

# Send webhook for BTC transaction
curl -X POST \
  "https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/webhooks/BTC" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "btc-tx-12345",
    "amount": 0.5,
    "sender": "wallet1",
    "receiver": "wallet2"
  }'
```

### Monitor Transactions

```bash
# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace CryptoWebhooks \
  --metric-name BTCTransactionCount-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### Check DynamoDB Records

```bash
# Query transaction table
aws dynamodb get-item \
  --table-name crypto-transactions-dev \
  --key '{"transactionId": {"S": "btc-tx-12345"}, "timestamp": {"N": "1234567890"}}' \
  --region us-east-1
```

## Resource Details

### Lambda Function

- **Runtime**: Python 3.11
- **Memory**: 1024 MB
- **Timeout**: 60 seconds
- **Reserved Concurrency**: 50 (cost control)
- **Dead Letter Queue**: Configured with max 3 retries

### DynamoDB Table

- **Billing Mode**: Pay-per-request
- **Point-in-Time Recovery**: Enabled
- **Encryption**: AWS managed keys

### SQS Queues

- **Processing Queue**: 300-second visibility timeout
- **Dead Letter Queue**: 14-day message retention

### CloudWatch Logs

- **Retention**: 30 days (compliance requirement)
- **Metric Filters**: BTC, ETH, USDT transaction counting

### API Gateway

- **Usage Plan**: 1000 requests/day per API key
- **Throttling**: 50 req/sec, 100 burst
- **X-Ray Tracing**: Enabled

## Monitoring

### CloudWatch Metrics

- `BTCTransactionCount-{suffix}`: Count of BTC transactions
- `ETHTransactionCount-{suffix}`: Count of ETH transactions
- `USDTTransactionCount-{suffix}`: Count of USDT transactions

### X-Ray Tracing

View distributed traces:
```bash
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --region us-east-1
```

## Cleanup

```bash
aws cloudformation delete-stack \
  --stack-name crypto-webhook-system \
  --region us-east-1
```

## Security Features

- **IAM Least Privilege**: Lambda role has minimal required permissions
- **KMS Encryption**: Environment variables encrypted with customer managed key
- **API Key Authentication**: Required for all webhook requests
- **Request Validation**: JSON schema validation at API Gateway
- **X-Ray Tracing**: Full request visibility for security auditing

## Cost Optimization

- **Reserved Concurrency**: Limits to 50 concurrent Lambda executions
- **DynamoDB On-Demand**: Pay only for actual usage
- **CloudWatch Retention**: 30 days for compliance, then auto-deletion
- **Dead Letter Queue**: 14-day retention prevents indefinite storage costs
```
