# Market Data Processing System

A serverless real-time market data processing system built with CDKTF and Python.

## Architecture

- **Lambda Function**: Processes market data messages from SQS queue
- **DynamoDB**: Stores market alerts with point-in-time recovery
- **SNS**: Sends notifications for trading alerts
- **SQS**: Message queue with 14-day retention and dead-letter queue
- **KMS**: Encrypts Lambda environment variables
- **CloudWatch**: Monitors Lambda error rates

## Prerequisites

- Python 3.11+
- Node.js 18+
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed (`npm install -g cdktf-cli`)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF providers:
```bash
cdktf get
```

## Deployment

1. Set environment suffix (optional):
```bash
export ENVIRONMENT_SUFFIX=dev
```

2. Create Lambda deployment package:
```bash
cd lib/lambda
zip ../../lambda_function.zip index.py
cd ../..
```

3. Synthesize CDKTF stack:
```bash
cdktf synth
```

4. Deploy infrastructure:
```bash
cdktf deploy
```

## Configuration

The stack accepts an `environment_suffix` parameter for multi-environment deployments:

```python
TapStack(app, "tap", environment_suffix="prod")
```

All resources will be named with this suffix for uniqueness.

## Testing

### Unit Tests

Test Lambda function:
```bash
pytest tests/unit/test_lambda_function.py -v --cov=lib/lambda --cov-report=term-missing
```

Test infrastructure stack:
```bash
pytest tests/unit/test_tap_stack.py -v --cov=lib --cov-report=term-missing
```

### Integration Tests

Run after deployment:
```bash
pytest tests/integration/test_deployment.py -v
```

## Outputs

After deployment, the following outputs are available:

- `sqs_queue_url`: SQS queue URL for sending market data
- `sns_topic_arn`: SNS topic ARN for alert subscriptions
- `dynamodb_table_name`: DynamoDB table name for querying alerts
- `lambda_function_name`: Lambda function name

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

All resources are configured for complete removal without retention.

## Monitoring

CloudWatch alarm monitors Lambda error rate:
- Threshold: 1% error rate
- Period: 5 minutes
- Metric: Lambda Errors

View logs:
```bash
aws logs tail /aws/lambda/data-processor-{environmentSuffix} --follow
```

## Cost Optimization

- Lambda uses ARM64 architecture (Graviton2) for 20% cost savings
- DynamoDB uses on-demand billing
- Reserved concurrency set to 5 to prevent runaway costs
- SQS dead-letter queue prevents infinite retry loops
