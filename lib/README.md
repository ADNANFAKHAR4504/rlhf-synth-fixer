# Serverless Payment Notification Processing System

Complete AWS CDK Python implementation of a serverless payment processing system.

## Overview

This solution implements a highly scalable payment notification processing system using AWS serverless services. It handles webhook ingestion, transaction storage, accounting processing, and failure notifications with comprehensive monitoring and security features.

## Architecture

- **API Gateway**: REST API with /webhooks endpoint for payment notifications
- **Lambda Functions**: Three functions for payment processing, accounting, and failure notifications
- **DynamoDB**: Transaction storage with on-demand billing and point-in-time recovery
- **SQS**: Message queuing with dead letter queue for failed messages
- **SNS**: Notification topic for alerts and failures
- **CloudWatch**: Alarms, metrics, and log insights for monitoring
- **AWS WAF**: Rate-based protection for the API
- **X-Ray**: Distributed tracing across all components

## Prerequisites

- AWS CDK 2.x installed
- Python 3.11 or higher
- AWS CLI configured with appropriate credentials
- Node.js 18+ (for CDK)
- pip and virtualenv

## Project Structure

```
.
├── lib/
│   ├── tap_stack.py              # Main CDK stack definition
│   ├── lambda/                   # Lambda function code
│   │   ├── process_payment.py    # Payment processing function
│   │   ├── process_accounting.py # Accounting processing function
│   │   └── notify_failures.py    # Failure notification function
│   ├── lambda_layer/             # Lambda layer for shared dependencies
│   │   └── requirements.txt      # Python dependencies
│   ├── PROMPT.md                 # Original requirements
│   ├── MODEL_RESPONSE.md         # Generated implementation
│   ├── IDEAL_RESPONSE.md         # Refined implementation
│   └── MODEL_FAILURES.md         # Known issues and improvements
├── test/
│   └── test_tap_stack.py         # Comprehensive unit tests
├── bin/
│   └── tap.py                    # CDK app entry point
└── README.md                     # This file
```

## Installation

1. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies (for CDK):

```bash
npm install
```

4. Prepare Lambda layer dependencies:

```bash
mkdir -p lib/lambda_layer/python
pip install -r lib/lambda_layer/requirements.txt -t lib/lambda_layer/python/
```

## Deployment

### Synthesize CloudFormation Template

```bash
cdk synth --context environmentSuffix=your-suffix
```

### Deploy to AWS

```bash
cdk deploy --context environmentSuffix=your-suffix
```

Replace `your-suffix` with a unique identifier (e.g., `dev123`, `prod456`).

### Bootstrap CDK (First time only)

If you haven't used CDK in your AWS account before:

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

## Configuration

### Environment Suffix

All resources are named with an environment suffix to prevent conflicts:
- DynamoDB: `payment-transactions-{suffix}`
- Lambda: `process-payment-{suffix}`, etc.
- SQS: `payment-processing-queue-{suffix}`

### Resource Tags

All resources are tagged with:
- **Environment**: `synth-{suffix}`
- **Owner**: `turing-ai`
- **CostCenter**: `training`

### Lambda Configuration

- **Runtime**: Python 3.11
- **Architecture**: ARM64 (Graviton2)
- **Reserved Concurrency**:
  - Process Payment: 100
  - Process Accounting: 50
  - Notify Failures: 10
- **X-Ray Tracing**: Enabled
- **Log Retention**: 30 days

### API Gateway Configuration

- **Throttling**: 1000 requests/second per API key
- **Quota**: 1,000,000 requests per day
- **Authentication**: API key required
- **CORS**: Enabled for POST and OPTIONS

### WAF Configuration

- **Rate Limit**: 2000 requests per 5 minutes per IP
- **Action**: Block requests exceeding limit

## Testing

### Run Unit Tests

```bash
pytest test/ -v
```

### Run Tests with Coverage

```bash
pytest test/ --cov=lib --cov-report=html --cov-report=term
```

### Test Coverage Requirements

- Statements: 100%
- Functions: 100%
- Lines: 100%

## Usage

### Retrieve API Key

After deployment, retrieve the API key value:

```bash
aws apigateway get-api-keys --include-values \
  --query "items[?name=='payment-api-key-{suffix}'].value" \
  --output text
```

### Send Test Webhook

```bash
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/webhooks \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{
    "transaction_id": "txn_12345",
    "amount": 99.99,
    "currency": "USD",
    "provider": "stripe",
    "metadata": {
      "customer_id": "cust_67890"
    }
  }'
```

### Monitor Transactions

Query DynamoDB table:

```bash
aws dynamodb scan --table-name payment-transactions-{suffix}
```

### View CloudWatch Logs

```bash
aws logs tail /aws/lambda/process-payment-{suffix} --follow
```

### Check Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix process-payment-errors-{suffix}
```

## Monitoring

### CloudWatch Dashboards

Access CloudWatch console to view:
- Lambda invocations and errors
- API Gateway requests and latency
- DynamoDB read/write capacity
- SQS queue depth and age

### CloudWatch Logs Insights Queries

Pre-configured queries available:
1. **payment-transaction-analysis-{suffix}**: Transaction count by ID
2. **payment-error-analysis-{suffix}**: Error count over time
3. **payment-latency-analysis-{suffix}**: Performance metrics

### CloudWatch Alarms

Alarms configured for:
- Lambda error count (> 1 error)
- Lambda error rate (> 1% of invocations)
- SNS notifications sent for all alarms

### X-Ray Tracing

View distributed traces in X-Ray console:
- End-to-end request flow
- Service map
- Performance bottlenecks

## Security

### API Authentication

- API key required for all requests
- Keys managed through API Gateway

### Encryption

- DynamoDB: AWS managed encryption at rest
- SQS: SSE-SQS encryption
- CloudWatch Logs: Encrypted by default

### IAM Roles

Separate IAM roles for each Lambda function with least-privilege permissions:
- Process Payment: DynamoDB write, SQS send
- Process Accounting: DynamoDB read/write, SNS publish, SQS receive
- Notify Failures: SNS publish, SQS receive

### WAF Protection

- Rate-based rules block excessive requests
- CloudWatch metrics for monitoring

## Troubleshooting

### Lambda Layer Issues

If Lambda functions cannot import dependencies:

```bash
# Rebuild Lambda layer
rm -rf lib/lambda_layer/python
mkdir -p lib/lambda_layer/python
pip install -r lib/lambda_layer/requirements.txt -t lib/lambda_layer/python/
cdk deploy --context environmentSuffix=your-suffix
```

### API Gateway 403 Errors

- Verify API key is included in x-api-key header
- Check API key is associated with usage plan
- Verify usage plan is attached to API stage

### DLQ Messages

View messages in dead letter queue:

```bash
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT/payment-processing-dlq-{suffix}
```

### Alarm Notifications

Subscribe to SNS topic for notifications:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:payment-notifications-{suffix} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Performance

### Expected Throughput

- **Target**: 10,000 transactions per minute
- **Latency**: Sub-second processing
- **Concurrent Executions**: Configurable per function

### Load Testing

Use tools like Apache JMeter or Artillery:

```bash
artillery quick --count 100 --num 10 \
  -H "x-api-key: YOUR-API-KEY" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/webhooks
```

## Cost Optimization

- **Lambda**: ARM64 architecture for 20% cost savings
- **DynamoDB**: On-demand billing for variable loads
- **CloudWatch Logs**: 30-day retention to limit costs
- **API Gateway**: Usage plan with quotas

### Estimated Monthly Costs

Based on 10M requests/month:
- Lambda: ~$50
- DynamoDB: ~$30
- API Gateway: ~$35
- CloudWatch: ~$10
- Other services: ~$5
- **Total**: ~$130/month

## Cleanup

### Destroy Stack

```bash
cdk destroy --context environmentSuffix=your-suffix
```

All resources will be deleted (no RETAIN policies configured).

### Manual Cleanup (if needed)

If destroy fails, manually delete:
1. CloudWatch Log Groups
2. Lambda Functions
3. API Gateway
4. DynamoDB Tables

## Known Limitations

1. Lambda layer requires manual pip install before deployment
2. API key value not exported (must retrieve via CLI)
3. No SNS subscriptions configured (must add manually)
4. Reserved concurrency may need adjustment based on account limits

See `lib/MODEL_FAILURES.md` for complete list of known issues.

## Compliance

### PCI DSS Considerations

Current implementation provides:
- Encryption at rest (DynamoDB)
- Encryption in transit (HTTPS)
- Access logging (CloudWatch)
- Audit trails (X-Ray, CloudWatch Logs)

Additional controls may be required for full PCI DSS compliance.

## Support

For issues or questions:
1. Review `lib/MODEL_FAILURES.md` for known issues
2. Check CloudWatch Logs for error details
3. Review X-Ray traces for performance issues
4. Consult AWS documentation for service limits

## License

This is a training/example project for infrastructure as code generation.
