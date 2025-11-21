
# Multi-Environment Fraud Detection Pipeline

A complete AWS CDK Python implementation for deploying a fraud detection pipeline across multiple environments (dev, staging, production) with environment-specific configurations.

## Architecture Overview

This solution deploys a real-time fraud detection system with the following components:

- **Kinesis Data Streams**: Ingests transaction data in real-time
- **Lambda Functions**: Processes streams and calculates fraud scores
- **DynamoDB**: Stores processed transaction results
- **S3**: Archives high-risk transactions
- **SSM Parameter Store**: Manages environment-specific configuration
- **CloudWatch**: Monitors and alerts on system health
- **X-Ray**: Traces requests in staging and production (conditional)

## Environment Configurations

### Development (us-east-1)
- Kinesis: 1 shard
- Lambda: 512MB memory
- DynamoDB: 5 RCU / 5 WCU
- Error threshold: 10%
- Log retention: 7 days
- Tracing: Disabled
- PITR: Disabled

### Staging (us-west-2)
- Kinesis: 2 shards
- Lambda: 1GB memory
- DynamoDB: 10 RCU / 10 WCU
- Error threshold: 5%
- Log retention: 14 days
- Tracing: Enabled
- PITR: Enabled

### Production (us-east-1)
- Kinesis: 4 shards
- Lambda: 2GB memory
- DynamoDB: 25 RCU / 25 WCU
- Error threshold: 2%
- Log retention: 30 days
- Tracing: Enabled
- PITR: Enabled

## Prerequisites

- Python 3.8 or higher
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- Node.js 14.x or higher (for CDK CLI)

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate.bat
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Bootstrap CDK (if not already done):
   ```bash
   cdk bootstrap
   ```

## Deployment

### Deploy to Development Environment

```bash
cdk deploy --context environment=dev --context environmentSuffix=unique-suffix
```

### Deploy to Staging Environment

```bash
cdk deploy --context environment=staging --context environmentSuffix=unique-suffix
```

### Deploy to Production Environment

```bash
cdk deploy --context environment=prod --context environmentSuffix=unique-suffix
```


### Deploy All Environments

You can deploy all environments by running the command multiple times with different context values.

## Configuration Management

After deployment, update the SSM Parameter Store values:

```bash
# Update API key
aws ssm put-parameter \
  --name "/fraud-detection/dev/api-key" \
  --value "your-actual-api-key" \
  --type "SecureString" \
  --overwrite

# Update connection string
aws ssm put-parameter \
  --name "/fraud-detection/dev/connection-string" \
  --value "your-actual-connection-string" \
  --type "SecureString" \
  --overwrite
```


## Testing the Pipeline

Send test data to the Kinesis stream:

```python
import boto3
import json

kinesis = boto3.client('kinesis')

test_transaction = {
    'transaction_id': 'test-123',
    'amount': 5500,
    'hour': 23,
    'location_mismatch': True,
    'velocity_flag': False
}

kinesis.put_record(
    StreamName='fraud-transactions-dev-unique-suffix',
    Data=json.dumps(test_transaction),
    PartitionKey='test'
)
```


## Monitoring

CloudWatch alarms are automatically created for:

- Lambda error rate exceeding environment threshold
- Lambda duration approaching timeout
- Kinesis iterator age (processing lag)

Alarms send notifications to the SNS topic created for each environment.

## Resource Naming

All resources include the environment suffix for uniqueness:

- Kinesis Stream: `fraud-transactions-{env}-{suffix}`
- Lambda Function: `fraud-processor-{env}-{suffix}`
- DynamoDB Table: `fraud-results-{env}-{suffix}`
- S3 Bucket: `company-fraud-data-{env}-{region}-{suffix}`

## Cleanup

To destroy the stack and all resources:

```bash
cdk destroy --context environment=dev --context environmentSuffix=unique-suffix
```


All resources are configured with `RemovalPolicy.DESTROY` and S3 buckets have `auto_delete_objects=True` to ensure clean destruction.

## Security Considerations

- All S3 buckets have public access blocked
- DynamoDB tables use encryption at rest
- Kinesis streams use AWS managed encryption
- SSM parameters should use SecureString type for sensitive data
- Lambda functions use least-privilege IAM roles
- CloudWatch Logs are encrypted

## Cost Optimization

- Development environment uses minimal resources
- S3 lifecycle policies automatically archive and expire old data
- DynamoDB provisioned capacity is tuned per environment
- CloudWatch Logs retention prevents indefinite storage costs

## Development

### Running Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run unit tests
pytest tests/unit -v

# Run tests with coverage
pytest tests/unit --cov=lib --cov-report=term-missing

# Run integration tests
pytest tests/integration -v
```


### Project Structure

```
.
├── app.py                      # CDK app entry point
├── cdk.json                    # CDK configuration
├── lib/
│   ├── __init__.py
│   ├── tap_stack.py           # Main stack definition
│   ├── lambda/
│   │   └── index.py           # Lambda function code
│   └── README.md              # This file
├── tests/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── requirements.txt           # Production dependencies
└── requirements-dev.txt       # Development dependencies


## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:

```bash
aws logs tail /aws/lambda/fraud-processor-dev-unique-suffix --follow
```


### DynamoDB Throttling

Monitor CloudWatch metrics for `ConsumedReadCapacityUnits` and `ConsumedWriteCapacityUnits`. Adjust capacity in `app.py` if needed.

### Kinesis Processing Lag

Check the iterator age metric in CloudWatch. If consistently high, consider:
- Increasing Lambda memory
- Increasing batch size
- Adding more shards

## Support

For issues or questions, please contact the infrastructure team.


