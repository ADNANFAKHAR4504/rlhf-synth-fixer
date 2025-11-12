# Serverless Financial Data Processing Pipeline

A comprehensive serverless architecture for processing financial market data using AWS services.

## Architecture

This solution implements a complete event-driven data processing pipeline:

### Data Flow

1. **Ingestion**: Market data is uploaded to S3 or sent via API Gateway POST /ingest
2. **Initial Processing**: DataIngestion Lambda stores metadata in DynamoDB and queues messages in SQS
3. **Processing**: DataProcessor Lambda consumes SQS messages, processes data, and emits custom events
4. **Aggregation**: DataAggregator Lambda runs on schedule (every 5 minutes) and on custom events

### AWS Services

- **S3**: Raw data storage with versioning, encryption, and lifecycle policies
- **Lambda**: Three functions for ingestion, processing, and aggregation
- **DynamoDB**: State management with on-demand billing and point-in-time recovery
- **SQS**: Message queuing with dead letter queue for reliability
- **EventBridge**: Event routing and scheduled triggers
- **API Gateway**: REST API with throttling and IAM authentication
- **CloudWatch**: Logging and error monitoring for all functions
- **IAM**: Least privilege roles for each Lambda function

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials

### Deploy

```bash
# Install dependencies
npm install

# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy stack
pulumi up --yes
```

### Destroy

```bash
pulumi destroy --yes
```

## Configuration

All resources are named with an environment suffix for multi-environment deployments:

- S3 Bucket: `market-data-bucket-${environmentSuffix}`
- DynamoDB Table: `MarketDataState-${environmentSuffix}`
- Lambda Functions: `DataIngestion-${environmentSuffix}`, etc.

## Testing

After deployment, you can test the API:

```bash
# Get API URL from stack outputs
API_URL=$(pulumi stack output apiUrl)

# Send test data
curl -X POST "https://${API_URL}" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","price":150.25,"volume":1000000}'
```

## Monitoring

All Lambda functions have CloudWatch Log Groups with:
- 7-day retention
- Metric filters for error tracking
- X-Ray tracing enabled

## Security

- S3 encryption at rest with AES256
- IAM roles follow least privilege principle
- API Gateway uses IAM authentication
- All resources tagged for compliance

## Outputs

The stack exports:
- `apiUrl`: API Gateway endpoint URL
- `bucketName`: S3 bucket name for data uploads
- `tableArn`: DynamoDB table ARN
