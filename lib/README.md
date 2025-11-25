# Cryptocurrency Price Processing System

A serverless cryptocurrency price processing pipeline built with CDKTF and Python. This system handles webhook ingestion, real-time data enrichment, and storage of cryptocurrency prices from multiple exchanges.

## Architecture Overview

The system consists of the following components:

1. **Webhook Processor Lambda**: Receives price updates from cryptocurrency exchanges and stores them in DynamoDB
2. **Price Enricher Lambda**: Automatically triggered by DynamoDB streams to calculate moving averages and volatility metrics
3. **DynamoDB Table**: Stores cryptocurrency prices with partition key (symbol) and sort key (timestamp)
4. **Dead Letter Queues**: SQS queues for both Lambda functions to capture failed invocations
5. **SNS Topic**: Receives notifications for successful price enrichment operations
6. **KMS Key**: Customer-managed key for encrypting Lambda environment variables
7. **CloudWatch Logs**: Log groups with subscription filters for error detection

## Prerequisites

- Python 3.9 or higher
- Node.js 14+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5+
- CDKTF 0.19+

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF CLI globally:
```bash
npm install -g cdktf-cli@latest
```

3. Install AWS provider:
```bash
cdktf provider add aws@~>5.0
```

## Deployment

1. Initialize CDKTF (first time only):
```bash
cdktf init
```

2. Create Lambda deployment packages:
```bash
# Create webhook processor package
cd lib/lambda/webhook-processor
zip -r ../webhook-processor.zip .
cd ../../..

# Create price enricher package
cd lib/lambda/price-enricher
zip -r ../price-enricher.zip .
cd ../../..
```

3. Synthesize the Terraform configuration:
```bash
cdktf synth
```

4. Deploy the stack:
```bash
cdktf deploy
```

5. The deployment will output:
   - Lambda function ARNs
   - DynamoDB table name
   - SNS topic ARN

## Configuration

The stack accepts an `environment_suffix` parameter to allow multiple deployments:

```python
CryptoPriceProcessingStack(app, "crypto-price-processing", environment_suffix="dev")
```

Change "dev" to "staging" or "prod" for different environments.

## Architecture Features

### Cost Optimization
- ARM64 architecture for Lambda functions (up to 34% cost savings)
- DynamoDB on-demand billing (no wasted provisioned capacity)
- 3-day CloudWatch log retention (minimized storage costs)

### Reliability
- Dead letter queues with 4-day retention
- DynamoDB point-in-time recovery
- Reserved concurrent executions to prevent throttling

### Security
- Customer-managed KMS key for Lambda environment variables
- Least-privilege IAM roles with specific action permissions
- No wildcard permissions in IAM policies

### Monitoring
- CloudWatch log groups for all Lambda functions
- Subscription filters for automatic error detection
- SNS notifications for successful processing

## Testing

To test the webhook processor:

```bash
aws lambda invoke \
  --function-name webhook-processor-dev \
  --payload '{"symbol":"BTC","price":50000.00,"exchange":"coinbase","volume":1234.56}' \
  response.json
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

## Technical Constraints

- Lambda functions use ARM64 architecture
- DynamoDB uses on-demand billing with point-in-time recovery
- CloudWatch Logs retention is exactly 3 days
- Dead letter queue retention is 4 days
- All environment variables are encrypted with customer-managed KMS key
- All resources include environment suffix for uniqueness

## Outputs

After deployment, the following outputs are available:

- `webhook_processor_arn`: ARN of the webhook processor Lambda function
- `price_enricher_arn`: ARN of the price enricher Lambda function
- `dynamodb_table_name`: Name of the DynamoDB table
- `sns_topic_arn`: ARN of the SNS topic for success notifications
