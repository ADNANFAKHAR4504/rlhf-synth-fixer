# Payment Processing Infrastructure

This infrastructure provides a complete payment processing system built with CDKTF and Python, designed to work consistently across development, staging, and production environments.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Storage for batch payment CSV files with encryption and versioning
- **DynamoDB Tables**: Three tables for payments, processing status, and audit logs
- **Lambda Functions**: Three functions for payment processing, batch file processing, and API handling
- **API Gateway**: RESTful API for payment submission and status queries
- **Step Functions**: Workflow orchestration for complex payment flows
- **SNS**: Notification system for payment status updates
- **SQS**: Reliable event processing with dead letter queue
- **CloudWatch**: Logging, monitoring, and alarms for critical failures

## Deployment

### Prerequisites

- Python 3.12+
- Pipenv
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with credentials

### Environment Variables

Required environment variables:

```bash
export ENVIRONMENT_SUFFIX="dev"                           # Environment identifier
export AWS_REGION="us-east-1"                            # Target AWS region
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"       # S3 bucket for state
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"         # State bucket region
```

### Deploy

```bash
# Install dependencies
pipenv install

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy
```

### Destroy

```bash
# Destroy all resources
cdktf destroy
```

## API Usage

### Submit Payment

```bash
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/payments \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pay_123456",
    "amount": 99.99,
    "currency": "USD"
  }'
```

### Get Payment Status

```bash
curl https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/payments/pay_123456
```

## Batch Processing

Upload CSV files to the S3 bucket with the following format:

```csv
payment_id,amount,currency
pay_001,100.00,USD
pay_002,50.00,EUR
pay_003,75.50,USD
```

The batch processor Lambda will automatically process the file and queue individual payments.

## Monitoring

CloudWatch alarms are configured for:

- Lambda function errors (threshold: 5 errors in 10 minutes)
- Dead letter queue messages (any message)
- API 5xx errors (threshold: 10 errors in 10 minutes)

All alarms publish to the SNS topic for notifications.

## Security

- All data at rest is encrypted (S3, DynamoDB)
- All data in transit uses TLS/HTTPS
- IAM roles follow least privilege principle
- S3 buckets have public access blocked
- DynamoDB tables have point-in-time recovery enabled

## Resource Naming

All resources include the environment suffix for uniqueness:
- S3 Bucket: `payment-batch-files-{environment_suffix}`
- DynamoDB Tables: `payments-{environment_suffix}`, etc.
- Lambda Functions: `payment-processor-{environment_suffix}`, etc.
- API Gateway: `payment-api-{environment_suffix}`

## Testing

```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=lib tests/
```
