# Cryptocurrency Price Processing System

A serverless cryptocurrency price processing pipeline built with CDKTF Python that handles real-time webhook ingestion, data enrichment, and storage.

## Architecture

The system consists of:

1. **Webhook Processor Lambda**: Receives price updates from exchanges, validates data, and writes to DynamoDB
2. **Price Enricher Lambda**: Triggered by DynamoDB Streams to add moving averages and volatility metrics
3. **DynamoDB Table**: Stores cryptocurrency prices with partition key 'symbol' and sort key 'timestamp'
4. **KMS Key**: Encrypts Lambda environment variables containing sensitive configuration
5. **SQS Dead Letter Queues**: Captures failed Lambda executions for both functions
6. **SNS Topic**: Receives success notifications via Lambda destinations
7. **CloudWatch Logs**: Monitors both Lambda functions with subscription filters for error detection

## Prerequisites

- Python 3.9 or higher
- Node.js 16+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

3. Prepare Lambda deployment packages:
```bash
# Create webhook processor package
cd lib/lambda/webhook_processor
pip install -r requirements.txt -t .
zip -r ../webhook_processor.zip .
cd ../../..

# Create price enricher package
cd lib/lambda/price_enricher
pip install -r requirements.txt -t .
zip -r ../price_enricher.zip .
cd ../../..
```

## Configuration

Set the environment suffix for resource naming:
```bash
export ENVIRONMENT_SUFFIX=dev
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

The deployment will output:
- Lambda function ARNs
- DynamoDB table name
- SNS topic ARN
- KMS key ID

## Resource Configuration

### Lambda Functions

- **webhook-processor**:
  - Memory: 1GB
  - Timeout: 60 seconds
  - Architecture: ARM64
  - Reserved Concurrency: 10
  - Runtime: Python 3.11

- **price-enricher**:
  - Memory: 512MB
  - Timeout: 60 seconds
  - Architecture: ARM64
  - Reserved Concurrency: 10
  - Runtime: Python 3.11

### DynamoDB Table

- Billing Mode: On-demand
- Point-in-time Recovery: Enabled
- Streams: Enabled (NEW_AND_OLD_IMAGES)
- Partition Key: symbol (String)
- Sort Key: timestamp (Number)

### CloudWatch Logs

- Retention: 3 days
- Error Pattern Filter: Detects ERROR, Error, error, exception, Exception

### Dead Letter Queues

- Message Retention: 4 days (345600 seconds)
- Separate queues for each Lambda function

## Testing

### Test Webhook Processor

Invoke the webhook processor Lambda with sample data:
```bash
aws lambda invoke \
  --function-name webhook-processor-$ENVIRONMENT_SUFFIX \
  --payload '{"symbol":"BTC","price":50000.00,"exchange":"binance"}' \
  response.json
```

### Monitor DynamoDB Stream Processing

Check CloudWatch Logs for the price-enricher function:
```bash
aws logs tail /aws/lambda/price-enricher-$ENVIRONMENT_SUFFIX --follow
```

### Check Dead Letter Queues

Monitor failed messages:
```bash
aws sqs receive-message \
  --queue-url $(aws sqs get-queue-url --queue-name webhook-processor-dlq-$ENVIRONMENT_SUFFIX --query 'QueueUrl' --output text)
```

## Cost Optimization

The system is optimized for cost:
- ARM64 Lambda architecture (20% cost savings)
- On-demand DynamoDB billing (pay per request)
- 3-day CloudWatch Logs retention
- Serverless architecture (no idle resources)
- Reserved concurrency prevents runaway costs

## Security

- Customer-managed KMS key for environment variable encryption
- Least-privilege IAM roles for each Lambda function
- DynamoDB and KMS access scoped to specific resources
- CloudWatch Logs for audit trail

## Monitoring

Monitor the system health:
- CloudWatch Logs for both Lambda functions
- DynamoDB metrics for table performance
- SQS metrics for dead letter queue depth
- SNS for success notifications

Set up CloudWatch Alarms:
```bash
# Example: Alert on DLQ messages
aws cloudwatch put-metric-alarm \
  --alarm-name crypto-processor-dlq-alert \
  --metric-name ApproximateNumberOfMessagesVisible \
  --namespace AWS/SQS \
  --statistic Average \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold
```

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/webhook-processor-$ENVIRONMENT_SUFFIX --follow
```

### DynamoDB Stream Issues

Verify stream is enabled:
```bash
aws dynamodb describe-table --table-name crypto-prices-$ENVIRONMENT_SUFFIX
```

### KMS Decryption Failures

Ensure Lambda execution role has KMS decrypt permissions:
```bash
aws kms list-grants --key-id <key-id>
```

## Additional Resources

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
