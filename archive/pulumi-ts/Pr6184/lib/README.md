# Payment Processing Pipeline

A serverless payment processing infrastructure built with Pulumi and TypeScript, deployed on AWS.

## Architecture

This solution implements a complete payment webhook processing pipeline:

1. **API Gateway** - HTTP API endpoint accepting POST requests at `/webhook`
2. **Webhook Processor Lambda** - Validates incoming webhooks and publishes to SNS
3. **SNS Topic** - Fans out events to multiple SQS queues
4. **Transaction Recorder Lambda** - Stores transaction data in DynamoDB
5. **Fraud Detector Lambda** - Analyzes transactions for fraud patterns
6. **DynamoDB Table** - Persistent storage for transaction records
7. **VPC Configuration** - Private subnets for secure Lambda execution
8. **KMS Encryption** - Customer-managed keys for data encryption

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- Go 1.19 for building Lambda functions

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Build Lambda functions:
```bash
cd lib/lambda/webhook-processor && go mod download && go build -o bootstrap main.go && cd ../../..
cd lib/lambda/transaction-recorder && go mod download && go build -o bootstrap main.go && cd ../../..
cd lib/lambda/fraud-detector && go mod download && go build -o bootstrap main.go && cd ../../..
```

3. Deploy the stack:
```bash
pulumi up
```

4. Get the API endpoint:
```bash
pulumi stack output apiUrl
```

## Testing

Send a test webhook:
```bash
curl -X POST https://your-api-endpoint/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-12345",
    "amount": 99.99,
    "currency": "USD",
    "processorId": "stripe",
    "timestamp": 1234567890
  }'
```

## Configuration

The infrastructure uses the following configurations:

- **Region**: us-east-2
- **Lambda Runtime**: Go 1.x
- **DynamoDB Billing**: On-demand
- **SQS Retention**: 7 days
- **CloudWatch Logs Retention**: 30 days
- **API Gateway Throttling**: 5000 burst, 2000 rate limit
- **Lambda Concurrent Executions**: 100 per function

## Security

- All Lambda environment variables encrypted with customer-managed KMS keys
- Lambda functions run in VPC private subnets
- DynamoDB table encrypted at rest
- SNS/SQS messages encrypted with KMS
- IAM roles follow principle of least privilege

## Monitoring

CloudWatch Logs are enabled for all Lambda functions with 30-day retention. Monitor:

- `/aws/lambda/webhook-processor-{env}`
- `/aws/lambda/transaction-recorder-{env}`
- `/aws/lambda/fraud-detector-{env}`

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```
