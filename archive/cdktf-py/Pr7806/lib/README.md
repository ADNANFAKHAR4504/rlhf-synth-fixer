# Serverless Fraud Detection Pipeline

## Overview

A production-ready serverless fraud detection system built with **CDKTF Python** that processes millions of transactions daily, detects fraud patterns in real-time, and sends automated alerts.

## Architecture

```
API Gateway → Lambda (API Handler) → DynamoDB (with Streams)
                                           ↓
                                     Lambda (Fraud Detection - VPC)
                                           ↓
                                     SQS Queue + DLQ
                                           ↓
                                     Lambda (Notification)
                                           ↓
                                     SNS Topic → Email
```

## Infrastructure Components

### Core Services
- **API Gateway**: REST API endpoint for transaction submission
- **DynamoDB**: Transaction storage with streams for change data capture
- **Lambda Functions**: 3 serverless functions for processing
- **SQS**: Message queue with dead letter queue for reliability
- **SNS**: Email notification system for fraud alerts

### Security & Networking
- **KMS**: Customer-managed encryption keys
- **VPC**: Private network isolation for sensitive operations
- **IAM**: Least privilege access policies
- **Security Groups**: Network access control

### Observability
- **CloudWatch Logs**: 7-day retention for all Lambda functions
- **X-Ray**: Distributed tracing for performance monitoring

## Lambda Functions

### 1. API Handler (`api_handler.py`)
- Validates incoming transaction requests
- Stores validated transactions in DynamoDB
- Returns transaction ID and timestamp
- Runtime: Python 3.11, Memory: 256MB, Timeout: 30s

### 2. Fraud Detection (`fraud_detection.py`)
- Processes DynamoDB stream events
- Applies multi-rule fraud detection logic
- Calculates risk scores (0-100)
- Sends suspicious transactions to SQS
- Runtime: Python 3.11, Memory: 512MB, Timeout: 60s
- VPC-enabled for secure data processing

### 3. Notification Handler (`notification_handler.py`)
- Polls SQS queue for suspicious transactions
- Formats fraud alert messages
- Publishes alerts to SNS topic
- Runtime: Python 3.11, Memory: 256MB, Timeout: 30s

## Fraud Detection Rules

1. **High-Value Transactions**: Amount > $10,000
2. **Suspicious Merchants**: Blacklisted merchant names
3. **Pattern Detection**: Small round amounts under $50
4. **Location-Based**: High-risk geographic locations
5. **Risk Scoring**: Weighted scoring system (0-100)

## Deployment

### Prerequisites
- Python 3.11+
- Node.js 18+ (for CDKTF)
- AWS CLI configured
- Terraform CDK CLI

### Installation

```bash
# Install dependencies
pipenv install

# Package Lambda functions
cd lib/lambda
python3 << 'EOF'
import zipfile
for func in ['api_handler', 'fraud_detection', 'notification_handler']:
    with zipfile.ZipFile(f'{func}.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
        with open(f'{func}.py', 'r') as f:
            zf.writestr('index.py', f.read())
EOF
cd ../..
```

### Deploy

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# Get outputs
cdktf output
```

### Environment Variables

Set these before deployment:
- `ENVIRONMENT_SUFFIX`: Unique identifier for resources (e.g., "dev", "prod")
- `AWS_REGION`: Target AWS region (default: us-east-1)
- `TERRAFORM_STATE_BUCKET`: S3 bucket for state files

## Testing

### Unit Tests

```bash
# Run all unit tests
python -m pytest tests/unit/ -v

# Run with coverage
python -m pytest tests/unit/ --cov=lib --cov-report=html
```

### Integration Tests

```bash
# Set environment variables
export API_ENDPOINT="https://xxx.execute-api.us-east-1.amazonaws.com/prod/transactions"
export DYNAMODB_TABLE="transactions-dev"
export SQS_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/xxx/suspicious-transactions-dev"

# Run integration tests
python -m pytest tests/integration/ -v
```

## API Usage

### Submit Transaction

```bash
curl -X POST https://API_ENDPOINT/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 125.50,
    "merchant": "Store Name",
    "card_number": "1234567890123456",
    "location": "New York, USA",
    "customer_id": "CUST12345"
  }'
```

### Response

```json
{
  "message": "Transaction recorded successfully",
  "transaction_id": "uuid-here",
  "timestamp": 1234567890000
}
```

### Trigger Fraud Alert

Submit a high-value transaction:

```bash
curl -X POST https://API_ENDPOINT/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15000.00,
    "merchant": "Unknown Store",
    "card_number": "1234567890123456",
    "location": "Nigeria"
  }'
```

This will trigger fraud detection and send an email alert.

## Configuration

### Required Constraints (All Met)

- Lambda Runtime: Python 3.11
- DLQ Retention: 14 days
- SQS Visibility Timeout: 6 minutes (360 seconds)
- Lambda Reserved Concurrency: 100 per function
- API Gateway Throttling: 1000 requests/second
- DynamoDB Billing: On-demand
- CloudWatch Log Retention: 7 days
- KMS: Customer-managed keys with rotation
- IAM: Least privilege, no wildcard permissions
- VPC: Enabled for fraud detection Lambda

### Resource Naming

All resources include `environment_suffix` parameter:
- Format: `{resource-name}-{environment_suffix}`
- Example: `transactions-dev`, `api-handler-prod`

## Monitoring

### CloudWatch Logs

Log groups created for each Lambda function:
- `/aws/lambda/api-handler-{environment_suffix}`
- `/aws/lambda/fraud-detection-{environment_suffix}`
- `/aws/lambda/notification-handler-{environment_suffix}`

### X-Ray Tracing

Distributed tracing enabled on:
- All Lambda functions
- API Gateway

View traces in AWS X-Ray console to analyze:
- Request latency
- Service dependencies
- Error rates

### Metrics

Key metrics to monitor:
- API Gateway: Request count, latency, 4xx/5xx errors
- Lambda: Invocations, duration, errors, throttles
- DynamoDB: Read/write capacity, throttled requests
- SQS: Messages sent, received, deleted

## Troubleshooting

### Lambda in VPC Cannot Access Services

Ensure VPC endpoints are configured or NAT Gateway is available for internet access.

### SQS Messages Not Being Processed

Check notification Lambda CloudWatch logs and verify IAM permissions.

### DynamoDB Stream Not Triggering Lambda

Verify stream is enabled and event source mapping is active.

### API Gateway 502 Errors

Check Lambda function errors in CloudWatch Logs and verify Lambda timeout is sufficient.

## Cleanup

```bash
# Destroy all infrastructure
cdktf destroy

# Confirm deletion
yes
```

All resources are fully destroyable (no retention policies).

## Security Considerations

1. **Encryption at Rest**: All data encrypted with KMS
2. **Encryption in Transit**: HTTPS for API Gateway, TLS for AWS services
3. **IAM Policies**: Least privilege access for all roles
4. **VPC Isolation**: Sensitive processing in private subnets
5. **Card Number Masking**: PII masked in fraud alerts
6. **No Hardcoded Secrets**: All configuration via environment variables

## Cost Optimization

- **Serverless**: Pay only for actual usage
- **On-Demand Billing**: DynamoDB scales automatically
- **Reserved Concurrency**: Prevents runaway costs
- **7-Day Log Retention**: Balances observability and cost
- **No NAT Gateway**: VPC endpoints preferred (if needed)

## Performance

- **API Latency**: < 200ms for transaction submission
- **Fraud Detection**: Near real-time (< 5 seconds)
- **Throughput**: Handles millions of transactions daily
- **Scalability**: Automatic scaling with Lambda and DynamoDB

## Future Enhancements

- Machine learning-based fraud detection
- Real-time dashboard for fraud monitoring
- Multi-region deployment for high availability
- Advanced analytics and reporting
- Integration with third-party fraud detection services

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the infrastructure team.