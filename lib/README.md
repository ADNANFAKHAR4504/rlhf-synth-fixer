# Serverless Transaction Validation Pipeline

A production-ready serverless transaction validation pipeline built with AWS CDK and Python.

## Overview

This solution implements a comprehensive three-stage transaction processing pipeline that validates, analyzes, and enriches financial transactions using AWS serverless services. The architecture supports both event-driven (S3 uploads) and API-driven (REST endpoint) transaction submission.

## Architecture

### Processing Stages

1. **Ingestion** - Schema validation and initial storage
2. **Validation** - Business rules and fraud detection
3. **Enrichment** - External data enrichment and risk scoring

### AWS Services

- **Lambda**: Three functions (512MB each) for processing stages
- **DynamoDB**: Transaction state storage with Global Secondary Index
- **Step Functions**: Orchestration with exponential backoff retry
- **SQS**: Queue-based decoupling with Dead Letter Queues
- **EventBridge**: S3 upload event triggers
- **API Gateway**: REST API for manual submission
- **SNS**: Failure notifications and alerts
- **X-Ray**: Distributed tracing (10% sampling)
- **CloudWatch**: Logs (14-day retention) and custom metrics

## Features

### Core Features
- Three-stage validation pipeline with state management
- On-demand DynamoDB billing with GSI for status queries
- Exponential backoff retry (2s interval, 3 attempts, 2.0 rate)
- 300-second visibility timeout on all queues
- Dead Letter Queues with maxReceiveCount=3
- Active X-Ray tracing across all components
- CloudWatch Logs with 14-day retention
- Custom metrics: ProcessingRate, ErrorCount, RiskScore

### Enhanced Features
- EventBridge rule triggers pipeline on S3 Object Created events
- API Gateway REST endpoint for manual transaction submission
- SNS notifications for failures and high-risk transactions
- CloudWatch alarm for high error counts
- Comprehensive IAM least-privilege policies
- Server-side encryption for all data stores

### Security
- All S3 public access blocked
- KMS encryption for SQS queues
- TLS/SSL for all data in transit
- Least-privilege IAM policies
- CloudWatch logging for all API calls

## Project Structure

```
lib/
├── tap_stack.py              # Main CDK stack (687 lines)
├── lambda/
│   ├── ingestion.py          # Ingestion handler (168 lines)
│   ├── validation.py         # Validation handler (236 lines)
│   └── enrichment.py         # Enrichment handler (230 lines)
├── PROMPT.md                 # Requirements specification
├── MODEL_RESPONSE.md         # Implementation documentation
├── IDEAL_RESPONSE.md         # Architecture summary
└── README.md                 # This file

tests/
├── unit/
│   └── test_tap_stack.py     # Unit tests (621 lines, 70+ tests)
└── integration/
    └── test_deployed_resources.py  # Integration tests (560 lines)
```

## Requirements

- Python 3.9+
- AWS CDK 2.x
- AWS CLI configured
- pytest (for testing)
- boto3 (for Lambda functions)

## Deployment

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt

# Configure AWS credentials
aws configure
```

### Deploy Stack

```bash
# Synthesize CloudFormation template
cdk synth --context environmentSuffix=dev

# Deploy to AWS
cdk deploy --context environmentSuffix=dev

# View outputs
cdk output --context environmentSuffix=dev
```

### Environment Suffix

The `environmentSuffix` parameter creates unique resource names:
- Can be set via props, CDK context, or defaults to 'dev'
- All resources include the suffix: `resource-name-${environmentSuffix}`
- Examples: `transactions-dev`, `transaction-ingestion-prod`

## Usage

### Via API Gateway

Submit transactions using the REST API endpoint:

```bash
# Get API endpoint from outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name TapStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Submit transaction
curl -X POST ${API_ENDPOINT}transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-001",
    "source": "api",
    "data": {
      "amount": 150.00,
      "currency": "USD",
      "merchantId": "MERCHANT-12345",
      "customerId": "CUSTOMER-67890"
    }
  }'
```

### Via S3 Upload

Upload transaction files to trigger automatic processing:

```bash
# Create transaction file
cat > transaction.json << EOF
{
  "amount": 250.00,
  "currency": "USD",
  "merchantId": "US-MERCHANT-001",
  "customerId": "CUSTOMER-001"
}
EOF

# Upload to S3
aws s3 cp transaction.json s3://transaction-uploads-dev/transactions/txn-$(date +%s).json
```

### Monitor Processing

```bash
# View Lambda logs
aws logs tail /aws/lambda/transaction-ingestion-dev --follow

# Check DynamoDB table
aws dynamodb scan --table-name transactions-dev

# Query by status using GSI
aws dynamodb query \
  --table-name transactions-dev \
  --index-name StatusIndex \
  --key-condition-expression "status = :status" \
  --expression-attribute-values '{":status":{"S":"COMPLETED"}}'

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace "TransactionPipeline/dev" \
  --metric-name ProcessingRate \
  --statistics Sum \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300

# View X-Ray traces
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

## Testing

### Unit Tests

Test infrastructure code without deploying:

```bash
# Run all unit tests
pytest tests/unit/ -v

# Run specific test class
pytest tests/unit/test_tap_stack.py::TestDynamoDB -v

# Run with coverage
pytest tests/unit/ --cov=lib --cov-report=html
```

### Integration Tests

Test deployed resources (requires stack deployment):

```bash
# Deploy stack first
cdk deploy --context environmentSuffix=test

# Run integration tests
pytest tests/integration/ -v

# Run specific integration test
pytest tests/integration/test_deployed_resources.py::TestDynamoDBTable -v

# Run slow tests
pytest tests/integration/ -v -m slow
```

## Transaction Processing Flow

1. **Submission**
   - Transaction submitted via API Gateway OR S3 upload
   - EventBridge/API Gateway triggers Step Functions execution

2. **Ingestion**
   - Lambda validates schema (amount, currency, merchantId, customerId)
   - Stores transaction in DynamoDB with INGESTED status
   - Sends message to validation queue
   - Publishes ProcessingRate metric

3. **Validation**
   - Lambda retrieves transaction from DynamoDB
   - Applies business rules (amount limits, currency, IDs)
   - Performs fraud detection (flags high-value transactions)
   - Updates status to VALIDATED or VALIDATION_FAILED
   - Sends to enrichment queue OR publishes failure notification

4. **Enrichment**
   - Lambda enriches with merchant/customer data
   - Calculates comprehensive risk score
   - Updates status to COMPLETED, COMPLETED_WITH_WARNING, or REQUIRES_MANUAL_REVIEW
   - Publishes RiskScore metric
   - Sends notification for manual review cases

## Monitoring and Observability

### CloudWatch Metrics

Custom metrics in `TransactionPipeline/${environmentSuffix}` namespace:
- `ProcessingRate`: Transactions processed per 5-minute period
- `ErrorCount`: Failed transactions per 5-minute period
- `RiskScore`: Risk assessment values (0-100)

### CloudWatch Alarms

- **High Error Alarm**: Triggers when ErrorCount > 10 over 2 evaluation periods (10 minutes)
- Action: Sends notification to SNS failure topic

### X-Ray Tracing

- Active tracing on all Lambda functions and Step Functions
- 10% sampling rate for cost optimization
- Service map shows end-to-end transaction flow
- Trace details include:
  - DynamoDB operations
  - SQS message sends
  - Lambda invocations
  - SNS publishes

### CloudWatch Logs

Log groups with 14-day retention:
- `/aws/lambda/transaction-ingestion-${environmentSuffix}`
- `/aws/lambda/transaction-validation-${environmentSuffix}`
- `/aws/lambda/transaction-enrichment-${environmentSuffix}`
- `/aws/vendedlogs/states/transaction-pipeline-${environmentSuffix}`
- `/aws/apigateway/transaction-api-${environmentSuffix}`

## Failure Handling

### Dead Letter Queues

All Lambda functions have DLQs configured:
- `maxReceiveCount`: 3 attempts before moving to DLQ
- 14-day retention for failed messages
- KMS encryption enabled

### SNS Notifications

Failure notifications sent for:
- Ingestion errors (schema validation failures)
- Validation failures (business rule violations)
- Enrichment errors (processing failures)
- High-risk transactions (manual review required)

### Step Functions Retry

Exponential backoff configuration:
- Interval: 2 seconds
- Max attempts: 3
- Backoff rate: 2.0 (exponential)
- Errors: All (States.ALL)

## Resource Cleanup

```bash
# Destroy stack and all resources
cdk destroy --context environmentSuffix=dev

# Verify deletion
aws cloudformation describe-stacks --stack-name TapStack-dev
```

All resources use `RemovalPolicy.DESTROY` for clean teardown:
- S3 bucket with auto-delete objects
- DynamoDB table
- CloudWatch Log Groups
- No manual cleanup required

## Troubleshooting

### Common Issues

**Stack deployment fails:**
- Check AWS credentials: `aws sts get-caller-identity`
- Verify CDK bootstrap: `cdk bootstrap`
- Check CloudFormation events: `aws cloudformation describe-stack-events --stack-name TapStack-dev`

**Lambda function errors:**
- Check CloudWatch Logs for error messages
- Verify IAM permissions
- Check DynamoDB table and SQS queue names in environment variables

**Integration tests fail:**
- Ensure stack is deployed: `cdk deploy`
- Verify `cfn-outputs/flat-outputs.json` exists
- Check AWS credentials and region

**Transaction not processing:**
- Check Step Functions execution status
- View Lambda logs for errors
- Verify DynamoDB item was created
- Check SQS queue messages and DLQs

## Best Practices

1. **Security**: Use IAM roles with least-privilege permissions
2. **Monitoring**: Enable CloudWatch Logs and X-Ray tracing
3. **Error Handling**: Configure DLQs and retry policies
4. **Testing**: Run unit and integration tests before deployment
5. **Naming**: Use environmentSuffix for resource isolation
6. **Cost**: Monitor usage and set billing alarms
7. **Cleanup**: Destroy stacks when no longer needed

## License

This implementation follows AWS best practices and CDK patterns for serverless applications.

## Support

For issues or questions:
1. Check CloudWatch Logs for error details
2. Review X-Ray traces for performance issues
3. Examine Step Functions execution history
4. Verify resource configuration in AWS Console
