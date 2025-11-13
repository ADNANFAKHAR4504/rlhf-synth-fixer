# Serverless Transaction Processing System

Production-ready serverless transaction processing system built with **Pulumi Python** for processing millions of daily transactions with fraud detection, PCI compliance, and comprehensive monitoring.

## Overview

This system provides:
- API Gateway REST endpoint for transaction submission
- Three Lambda functions for validation, fraud detection, and failed transaction handling
- DynamoDB tables for merchant configurations and transaction storage
- SQS queues with DLQ for reliable message processing
- SNS topic for fraud alerts
- CloudWatch monitoring with alarms and dashboard
- X-Ray distributed tracing
- AWS WAF for API protection
- VPC with private subnets and VPC endpoints
- KMS encryption for all data at rest

## Architecture

```
API Gateway (+ WAF)
    |
    v
Validation Lambda (VPC)
    |
    v
SQS Transaction Queue -----> Fraud Detection Lambda (VPC)
    |                               |
    v                               v
DLQ -----> Failed Transaction Lambda   DynamoDB (Transactions)
                |                           |
                v                           v
            SNS Topic               CloudWatch + X-Ray
```

## Key Features

- **Serverless Architecture**: Auto-scales to handle burst traffic (1000+ TPS)
- **PCI Compliance**: KMS encryption, VPC isolation, audit trails
- **Fraud Detection**: Pattern matching with configurable thresholds
- **Reliability**: SQS with DLQ, 3 retry attempts, 14-day retention
- **Monitoring**: CloudWatch alarms (1% error threshold), dashboard, X-Ray tracing
- **Security**: WAF with managed rule sets, API key authentication, least-privilege IAM
- **Cost Optimized**: ~$98/month for 1M transactions

## Prerequisites

- AWS CLI configured with credentials
- Pulumi 3.x or higher
- Python 3.9 or higher
- Virtual environment

## Quick Start

1. **Install dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure region**:
   ```bash
   pulumi config set aws:region us-east-2
   ```

3. **Set environment suffix** (optional):
   ```bash
   pulumi config set environmentSuffix dev
   ```

4. **Deploy**:
   ```bash
   pulumi up
   ```

5. **Get API endpoint**:
   ```bash
   pulumi stack output api_endpoint
   ```

6. **Retrieve API key**:
   ```bash
   aws apigateway get-api-keys --include-values
   ```

## Usage

### Submit Transaction

```bash
curl -X POST \
  https://{api_id}.execute-api.us-east-2.amazonaws.com/prod/transaction \
  -H 'x-api-key: {api_key}' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_id": "txn_123456",
    "merchant_id": "merchant_001",
    "amount": 1500.00,
    "currency": "USD"
  }'
```

### Response

```json
{
  "message": "Transaction validated and queued",
  "transaction_id": "txn_123456",
  "status": "pending_fraud_check"
}
```

## Configuration

### Environment Variables (Lambda Functions)

#### Validation Lambda
- `MERCHANT_TABLE_NAME`: DynamoDB table for merchant configs
- `QUEUE_URL`: SQS queue URL for validated transactions

#### Fraud Detection Lambda
- `TRANSACTION_TABLE_NAME`: DynamoDB table for processed transactions
- `SNS_TOPIC_ARN`: SNS topic for fraud alerts

#### Failed Transaction Lambda
- `TRANSACTION_TABLE_NAME`: DynamoDB table for failed transactions
- `SNS_TOPIC_ARN`: SNS topic for failure alerts

### Stack Configuration

```yaml
config:
  aws:region: us-east-2
  environmentSuffix: dev  # Default: dev
```

## Fraud Detection Rules

The fraud detection Lambda calculates a fraud score based on:

1. **High Amount** (>$5,000): +30 points
2. **Suspicious Merchant Name** (contains 'test', 'fake', 'dummy'): +40 points
3. **Unusual Currency** (not USD/EUR/GBP): +20 points
4. **Round Amount Pattern** (multiples of 1000): +10 points

### Fraud Status

- **Score >= 50**: FRAUD_SUSPECTED
- **Score >= 30**: REVIEW_REQUIRED
- **Score < 30**: APPROVED

## Monitoring

### CloudWatch Dashboard

View dashboard URL from stack outputs:
```bash
pulumi stack output dashboard_url
```

Dashboard includes:
- Lambda invocations
- Lambda errors
- Lambda duration
- SQS queue metrics

### CloudWatch Alarms

Alarms trigger when Lambda error rate exceeds 1% over 10 minutes. Notifications sent to SNS topic.

### X-Ray Tracing

View distributed traces:
```bash
aws xray get-trace-summaries --start-time $(date -u -d '1 hour ago' +%s) --end-time $(date +%s)
```

### Lambda Logs

Tail logs for debugging:
```bash
aws logs tail /aws/lambda/validation-lambda-dev --follow
aws logs tail /aws/lambda/fraud-detection-lambda-dev --follow
aws logs tail /aws/lambda/failed-transaction-lambda-dev --follow
```

## Testing

### Seed Merchant Data

```bash
aws dynamodb put-item \
  --table-name merchant-config-dev \
  --item '{
    "merchant_id": {"S": "merchant_001"},
    "name": {"S": "Test Merchant"},
    "active": {"BOOL": true},
    "max_transaction_amount": {"N": "10000"}
  }'
```

### Test Transaction Flow

```bash
# 1. Submit transaction
curl -X POST \
  https://{api_id}.execute-api.us-east-2.amazonaws.com/prod/transaction \
  -H 'x-api-key: {api_key}' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_id": "txn_test_001",
    "merchant_id": "merchant_001",
    "amount": 1500.00,
    "currency": "USD"
  }'

# 2. Wait for processing (5 seconds)
sleep 5

# 3. Check transaction in DynamoDB
aws dynamodb get-item \
  --table-name processed-transactions-dev \
  --key '{"transaction_id": {"S": "txn_test_001"}}'
```

## Cost Breakdown

Monthly costs for 1M transactions:

| Service | Cost |
|---------|------|
| Lambda | $35.02 |
| API Gateway | $3.50 |
| DynamoDB | $2.50 |
| SQS | $0.80 |
| SNS | $0.50 |
| VPC Endpoints | $43.20 |
| KMS | $1.90 |
| CloudWatch Logs | $5.00 |
| WAF | $6.00 |
| **Total** | **~$98/month** |

## Security

### Implemented Controls

1. **Network Isolation**: Lambda functions in private subnets, no internet access
2. **Encryption**: KMS customer-managed keys for all data at rest
3. **Authentication**: API key required for all API Gateway requests
4. **Authorization**: Least-privilege IAM roles with resource-level permissions
5. **WAF Protection**: AWS managed rule sets for common exploits
6. **Rate Limiting**: 500 req/s, burst 1000, 10K/day quota
7. **Monitoring**: CloudWatch alarms, X-Ray tracing, 30-day log retention
8. **Audit Trails**: All transactions logged in DynamoDB with timestamps

### PCI Compliance

This implementation addresses:
- **Requirement 1**: Network segmentation (VPC)
- **Requirement 3**: Encryption at rest and in transit
- **Requirement 6**: Secure development (IaC)
- **Requirement 10**: Logging and monitoring
- **Requirement 11**: Security testing (WAF)

## Troubleshooting

### Lambda VPC Cold Starts

**Symptom**: First invocation takes 10+ seconds

**Solution**: Consider provisioned concurrency for production:
```python
aws.lambda_.ProvisionedConcurrencyConfig(
    f"validation-lambda-provisioned-{self.environment_suffix}",
    function_name=lambda_func.name,
    provisioned_concurrent_executions=10,
    qualifier=lambda_func.version
)
```

### API Gateway 502 Errors

**Symptom**: Intermittent 502 Bad Gateway errors

**Solution**:
- Check Lambda logs for errors
- Verify Lambda timeout is sufficient
- Check VPC endpoint connectivity

### DynamoDB Throttling

**Symptom**: ProvisionedThroughputExceededException

**Solution**:
- Verify on-demand mode is enabled
- Check for hot partition keys
- Review access patterns

### SQS Message Delays

**Symptom**: Messages not processed immediately

**Solution**:
- Check Lambda event source mapping is enabled
- Verify IAM permissions for SQS
- Check Lambda error logs

## Cleanup

Destroy all resources:
```bash
pulumi destroy
```

Remove stack state:
```bash
pulumi stack rm dev
```

## Project Structure

```
.
├── lib/
│   ├── __main__.py              # Pulumi entry point
│   ├── tap_stack.py             # TapStack component resource
│   ├── lambda/                  # Lambda function code
│   │   ├── validation_handler.py
│   │   ├── fraud_detection_handler.py
│   │   └── failed_transaction_handler.py
│   ├── PROMPT.md               # Task requirements
│   ├── MODEL_RESPONSE.md       # Generated code summary
│   ├── IDEAL_RESPONSE.md       # Complete implementation guide
│   ├── MODEL_FAILURES.md       # Failure analysis
│   └── README.md               # This file
├── Pulumi.yaml                 # Pulumi project configuration
├── requirements.txt            # Python dependencies
└── metadata.json              # Task metadata
```

## Outputs

| Output | Description |
|--------|-------------|
| `api_endpoint` | API Gateway endpoint URL |
| `dashboard_url` | CloudWatch dashboard URL |
| `merchant_table_name` | DynamoDB merchant table |
| `transaction_table_name` | DynamoDB transaction table |
| `queue_url` | SQS queue URL |
| `sns_topic_arn` | SNS topic ARN |
| `validation_lambda_arn` | Validation Lambda ARN |
| `fraud_detection_lambda_arn` | Fraud detection Lambda ARN |
| `failed_transaction_lambda_arn` | Failed transaction Lambda ARN |

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review X-Ray traces for request flow
3. Verify IAM permissions and VPC configuration
4. Check AWS service quotas and limits

## License

This implementation is for demonstration purposes. Review and modify for production use.
