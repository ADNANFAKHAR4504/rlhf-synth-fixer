# Serverless Payment Processing System

A production-ready serverless payment processing infrastructure built with CDKTF and TypeScript, deployed on AWS.

## Architecture

This infrastructure implements a complete payment processing system with the following components:

### Core Services

- **API Gateway REST API**: Provides `/transactions` (POST) and `/status` (GET) endpoints with request validation, CORS, and throttling at 10,000 requests/second
- **Lambda Functions**:
  - Transaction Processor: Handles payment transactions, stores in DynamoDB, queues in SQS, sends notifications via SNS
  - Status Checker: Retrieves transaction status from DynamoDB
- **DynamoDB**: Stores payment transactions with partition key `transaction_id` and sort key `timestamp`, on-demand billing, point-in-time recovery
- **SQS FIFO Queue**: Provides reliable message queuing with 14-day retention and message deduplication
- **SNS Topic**: Sends payment notifications via email subscription

### Security & Networking

- **VPC**: Private subnets for Lambda functions with VPC endpoints for DynamoDB and S3
- **KMS**: Customer-managed encryption keys for all data at rest
- **IAM**: Least-privilege roles for each Lambda function
- **Security Groups**: Controlled network access for Lambda functions

### Monitoring & Observability

- **CloudWatch Logs**: 30-day retention for all Lambda functions
- **CloudWatch Dashboard**: Displays Lambda invocations, errors, and DynamoDB metrics
- **CloudWatch Alarms**: Alerts when Lambda error rate exceeds 1%
- **X-Ray Tracing**: Enabled on Lambda functions and API Gateway for distributed tracing

## Prerequisites

- Node.js 18.x or later
- Terraform 1.5+ (installed via CDKTF)
- AWS CLI configured with appropriate credentials
- CDKTF CLI: `npm install -g cdktf-cli`

## Environment Variables

The following environment variables are required:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (default: 'dev')
- `AWS_REGION`: AWS region for deployment (default: 'us-east-1')
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state (default: 'iac-rlhf-tf-states')
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket (default: 'us-east-1')

## Installation

1. Install dependencies:
```bash
npm ci
```

2. Install Lambda function dependencies:
```bash
cd lib/lambda/transaction-processor && npm install && cd ../../..
cd lib/lambda/status-checker && npm install && cd ../../..
```

## Deployment

1. Synthesize CDKTF configuration:
```bash
npm run synth
```

2. Deploy infrastructure:
```bash
npm run deploy
```

3. Verify deployment:
```bash
# Check API Gateway URL from outputs
# Test transactions endpoint
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.00, "card_last_four": "1234", "merchant_id": "merchant-123"}'

# Check status
curl "https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/status?transaction_id=<transaction-id>"
```

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## Cleanup

To destroy all resources:
```bash
npm run destroy
```

## Configuration

### SNS Email Subscription

Update the email endpoint in `lib/tap-stack.ts`:
```typescript
const snsStack = new SnsStack(this, 'SnsStack', {
  environmentSuffix,
  emailEndpoint: 'your-email@example.com', // Replace with actual email
});
```

### Lambda Memory and Concurrency

Adjust in `lib/lambda-stack.ts`:
```typescript
memorySize: 512, // Increase for more CPU/memory
reservedConcurrentExecutions: 10, // Adjust based on load
```

### API Gateway Throttling

Modify in `lib/api-gateway-stack.ts`:
```typescript
throttlingBurstLimit: 10000,
throttlingRateLimit: 10000,
```

## Security Considerations

- All data encrypted at rest using KMS customer-managed keys
- Lambda functions deployed in private VPC subnets
- IAM roles follow least-privilege principle
- API Gateway uses request validation
- CloudWatch Logs encrypted
- X-Ray tracing enabled for security audit trails

## Cost Optimization

- Uses serverless services (Lambda, API Gateway, DynamoDB on-demand)
- VPC endpoints instead of NAT Gateway for AWS service access
- CloudWatch Logs with 30-day retention
- Reserved Lambda concurrency to control costs
- SQS FIFO with 14-day retention (auto-cleanup)

## Troubleshooting

### Lambda VPC Connectivity Issues

If Lambda functions cannot access AWS services, verify:
- VPC endpoints are created for DynamoDB and S3
- Security groups allow outbound traffic
- Subnet route tables are configured correctly

### DynamoDB Access Denied

Verify IAM role permissions include:
- `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`
- `kms:Decrypt`, `kms:Encrypt` for KMS key

### API Gateway 5xx Errors

Check:
- Lambda function CloudWatch logs
- Lambda execution role permissions
- Lambda timeout settings (default: 30 seconds)

## Outputs

The deployment provides the following outputs:

- `api_url`: API Gateway base URL
- `dynamodb_table_name`: DynamoDB table name
- `sqs_queue_url`: SQS queue URL
- `sns_topic_arn`: SNS topic ARN

## License

MIT
