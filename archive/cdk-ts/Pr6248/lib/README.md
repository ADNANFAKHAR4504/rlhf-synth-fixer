# Serverless Payment Processing System

A complete serverless payment processing system built with AWS CDK and ts.

## Architecture

The system implements a serverless payment processing workflow with the following components:

- **API Gateway REST API**: POST endpoint at /transactions that accepts JSON payloads with amount, currency, and card_token fields
- **Lambda Functions**:
  - Transaction validation function with reserved concurrency of 100
  - Review processing function triggered by SQS queue for invalid transactions
- **DynamoDB Table**: Stores valid transactions with partition key (transaction_id) and sort key (timestamp)
- **SQS Queues**:
  - Invalid transactions queue with 5-minute visibility timeout
  - Dead letter queues for both invalid transactions and review processing
- **SNS Topic**: Sends compliance notifications for transactions exceeding $5,000
- **CloudWatch**:
  - Alarms monitoring Lambda error rates (> 1%)
  - Log groups with 7-day retention for cost optimization
- **SSM Parameter Store**: Configuration management for transaction limits and supported currencies

## Deployment

```bash
# Install dependencies
npm install

# Install Lambda function dependencies
cd lib/lambda/validation && npm install && cd ../../..

# Synthesize CloudFormation template
npm run cdk:synth

# Deploy to AWS
ENVIRONMENT_SUFFIX=dev npm run cdk:deploy

# Destroy stack when done
ENVIRONMENT_SUFFIX=dev npm run cdk:destroy
```

## Configuration

The system uses SSM Parameter Store for configuration management:

- **Max transaction amount**: $10,000
- **Supported currencies**: USD, EUR, GBP
- **High-value threshold**: $5,000 (triggers compliance notifications)

## API Usage

After deployment, get the API key and endpoint from the stack outputs:

```bash
# Get API key value
aws apigateway get-api-key \
  --api-key $(aws cloudformation describe-stacks \
    --stack-name TapStackdev \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiKeyId`].OutputValue' \
    --output text) \
  --include-value

# Test valid transaction
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: <your-api-key>" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "card_token": "tok_123456"
  }'

# Test high-value transaction (triggers SNS notification)
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: <your-api-key>" \
  -d '{
    "amount": 6000,
    "currency": "EUR",
    "card_token": "tok_789012"
  }'

# Test invalid transaction (queued for review)
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -H "x-api-key: <your-api-key>" \
  -d '{
    "amount": 15000,
    "currency": "USD",
    "card_token": "tok_345678"
  }'
```

## Monitoring

CloudWatch alarms are configured for Lambda function errors:
- Validation Lambda errors exceeding 1% error rate
- Review Lambda errors exceeding 1% error rate

All alarms send notifications to the compliance SNS topic.

CloudWatch Logs are configured with:
- INFO level logging for API Gateway
- 7-day retention period for cost optimization
- X-Ray tracing enabled on all Lambda functions

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests (requires deployed stack)
npm run test:integration
```

## Security Features

- API Gateway request validation with JSON schema
- API key authentication required for all requests
- Usage plan limiting to 1000 requests per day
- IAM roles with least-privilege permissions
- X-Ray tracing for security auditing
- CloudWatch Logs for compliance and debugging

## Resource Tagging

All resources are tagged with:
- Environment: production
- CostCenter: payments

## Cost Optimization

- DynamoDB on-demand billing (pay per request)
- Lambda reserved concurrency prevents runaway costs
- CloudWatch Logs 7-day retention
- Serverless architecture (no idle compute costs)
- API Gateway usage plan prevents abuse

## Constraints Met

- Reserved concurrency: 100 for payment processing Lambda
- DynamoDB on-demand billing mode
- X-Ray tracing enabled on all Lambda functions
- API Gateway request validation models
- Lambda environment variables from Parameter Store
- Dead letter queues for async operations
- CloudWatch Logs 7-day retention
- No VPC required (all AWS-managed services)
- DESTROY removal policy for all resources (no Retain policies)
- All resource names include environmentSuffix for uniqueness

## File Structure

```
lib/
├── tap-stack.ts              # Main CDK stack definition
├── lambda/
│   ├── validation/
│   │   ├── index.js          # Transaction validation Lambda
│   │   └── package.json      # Lambda dependencies
│   └── review/
│       └── index.js          # Review processing Lambda
├── PROMPT.md                 # Original requirements
├── MODEL_RESPONSE.md         # Implementation summary
└── README.md                 # This file
```

## Architecture Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTPS + API Key
       ▼
┌─────────────────────┐
│   API Gateway       │
│   /transactions     │
│   (Request Model)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐         ┌──────────────┐
│ Validation Lambda   │─────────▶│  DynamoDB    │
│ (Concurrency: 100)  │ Valid    │  Table       │
│ (X-Ray Enabled)     │─────────▶│              │
└──────┬──────┬───────┘          └──────────────┘
       │      │
       │      │ High Value
       │      ▼
       │ ┌──────────────┐
       │ │  SNS Topic   │
       │ │ (Compliance) │
       │ └──────────────┘
       │
       │ Invalid
       ▼
┌─────────────────────┐
│   SQS Queue         │
│ (5min visibility)   │
│ (DLQ enabled)       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Review Lambda      │
│  (X-Ray Enabled)    │
│  (DLQ enabled)      │
└─────────────────────┘
```

## Support

For issues or questions, please check:
- CloudWatch Logs for Lambda execution details
- X-Ray traces for performance analysis
- CloudWatch Alarms for error notifications
