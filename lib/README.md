# Fraud Detection System

A serverless fraud detection system built with CDKTF and Python for AWS.

## Architecture

This solution implements a complete fraud detection pipeline:

- **API Gateway**: REST API endpoint for transaction ingestion with request validation
- **Lambda Functions**:
  - Transaction Processor: Processes incoming transactions in real-time
  - Pattern Analyzer: Scheduled analysis of transaction patterns (every 5 minutes)
- **DynamoDB**: Transaction storage with GSI for user-based queries
- **SNS/SQS**: Alert distribution system with dead letter queue
- **CloudWatch**: Monitoring, alarms, and X-Ray tracing
- **KMS**: Customer-managed encryption keys
- **Systems Manager**: Parameter Store for configuration

## Prerequisites

- Python 3.11+
- Node.js 18+ (for CDKTF)
- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed: `npm install -g cdktf-cli`

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Package Lambda functions:
```bash
cd lib/lambda_functions
zip transaction_processor.zip transaction_processor.py
zip pattern_analyzer.zip pattern_analyzer.py
cd ../..
```

## Deployment

1. Initialize CDKTF:
```bash
cdktf init
```

2. Synthesize Terraform configuration:
```bash
cdktf synth
```

3. Deploy the stack:
```bash
cdktf deploy
```

4. Note the outputs:
   - API Endpoint URL
   - Lambda Function ARNs
   - DynamoDB Table Name

## Configuration

The system uses the following environment variables (set via Stack parameter):
- `environment_suffix`: Unique suffix for resource naming (default: "dev")

Configuration parameters stored in SSM Parameter Store:
- `/fraud-detection/{env}/fraud_threshold`: Fraud detection threshold (0-1)
- `/fraud-detection/{env}/alert_email`: Email address for alerts

## Testing

### Test Transaction Processing

```bash
# Get API Key from AWS Console (API Gateway > API Keys)
API_KEY="your-api-key"
API_URL="your-api-endpoint/prod"

curl -X POST "${API_URL}/transactions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "transaction_id": "txn-001",
    "user_id": "user-123",
    "amount": 150.50,
    "merchant": "Store ABC",
    "location": "New York"
  }'
```

### Test High-Value Transaction (Fraud Alert)

```bash
curl -X POST "${API_URL}/transactions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "transaction_id": "txn-002",
    "user_id": "user-456",
    "amount": 15000.00,
    "merchant": "Suspicious Store",
    "location": "Unknown"
  }'
```

## Monitoring

- **CloudWatch Logs**: Lambda execution logs with 30-day retention
- **CloudWatch Alarms**: Alerts when error rate exceeds 1% over 5 minutes
- **X-Ray Traces**: Distributed tracing for API Gateway and Lambda
- **Dead Letter Queue**: Failed Lambda invocations sent to DLQ

## Security Features

- ARM64 architecture for Lambda (Graviton2 processors)
- KMS encryption for all data at rest and in transit
- IAM roles with least privilege principle
- API Gateway with API key authentication and usage limits (1000 req/day)
- Request validation at API Gateway level
- VPC isolation (optional - not implemented in this version)

## Cost Optimization

- Serverless architecture (pay per use)
- DynamoDB on-demand billing
- ARM64 Lambda functions (20% cost reduction)
- Reserved concurrency limits (1-5 per function)
- 30-day log retention

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

Note: All resources are configured to be destroyable without retention policies.

## Troubleshooting

1. **Lambda deployment fails**: Ensure lambda function zip files exist in `lib/lambda_functions/` directory
2. **API returns 403**: Verify API key is included in `x-api-key` header
3. **DynamoDB write errors**: Check Lambda IAM role has PutItem permissions
4. **SNS alerts not received**: Verify SNS topic subscription and SQS queue policy
