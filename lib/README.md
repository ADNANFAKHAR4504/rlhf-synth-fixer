# Payment Webhook Processing System

A serverless payment webhook processing pipeline built with Pulumi and TypeScript.

## Architecture

This system implements a complete serverless payment webhook processing pipeline:

1. **API Gateway REST API** - Receives webhook POST requests at `/webhooks` endpoint
2. **Webhook Validator Lambda** - Validates signatures and stores events in DynamoDB
3. **DynamoDB Table** - Stores payment events with streams enabled
4. **EventBridge Pipe** - Monitors DynamoDB Streams for new items
5. **Step Functions** - Orchestrates payment processing with exponential backoff retry
6. **Payment Processor Lambda** - Executes payment processing logic
7. **KMS Key** - Encrypts Lambda environment variables
8. **X-Ray Tracing** - Distributed tracing across all components

## Features

- **ARM64 Architecture**: All Lambda functions use Graviton2 processors for cost optimization
- **Customer-Managed Encryption**: KMS key encrypts Lambda environment variables
- **Point-in-Time Recovery**: DynamoDB table has PITR enabled
- **Reserved Concurrency**: Lambda functions have reserved concurrent executions
- **Exponential Backoff**: Step Functions implements retry logic with backoff
- **Least Privilege IAM**: All IAM policies follow least privilege principle
- **Distributed Tracing**: X-Ray enabled on API Gateway and Lambda functions
- **Stream Processing**: DynamoDB Streams trigger Step Functions via EventBridge

## Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create resources

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda function dependencies:
```bash
cd lib/lambda/webhook-validator && npm install && cd ../../..
cd lib/lambda/payment-processor && npm install && cd ../../..
```

3. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

## Deployment

Deploy the stack:
```bash
pulumi up
```

This will create all resources and output:
- API Gateway endpoint URL
- Step Functions state machine ARN
- DynamoDB table name
- KMS key ID
- Lambda function names

## Testing

### Send a test webhook:

```bash
# Get the API endpoint
API_URL=$(pulumi stack output apiUrl)

# Generate a signature
PAYLOAD='{"paymentId":"pay_123456","amount":99.99,"currency":"USD","status":"pending","provider":"stripe"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "webhook-secret-key" | awk '{print $2}')

# Send the webhook
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Monitor execution:

1. Check API Gateway logs in CloudWatch
2. Check Lambda function logs in CloudWatch
3. View X-Ray traces in AWS Console
4. Monitor Step Functions execution in AWS Console
5. Query DynamoDB table for stored events

## Configuration

The stack uses the following configuration:

- `environmentSuffix`: Suffix for resource names (defaults to stack name)
- `aws:region`: AWS region for deployment (defaults to us-east-1)

## Security

- All Lambda environment variables are encrypted with customer-managed KMS key
- DynamoDB table uses server-side encryption at rest
- IAM roles follow least privilege principle with no wildcard actions
- Webhook signatures are validated using HMAC-SHA256
- X-Ray tracing enabled for observability

## Cost Optimization

- ARM64 Lambda functions reduce compute costs by ~20%
- DynamoDB uses on-demand billing mode
- Reserved concurrency prevents runaway costs
- Serverless architecture means no idle resource costs

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Troubleshooting

### Webhook signature validation fails

Ensure the signature is calculated correctly using HMAC-SHA256 with the secret key.

### Step Functions retries exhausted

Check the payment processor Lambda logs for errors. The state machine retries up to 3 times with exponential backoff.

### DynamoDB Stream not triggering

Verify the EventBridge pipe is active and has correct permissions.

## License

MIT
