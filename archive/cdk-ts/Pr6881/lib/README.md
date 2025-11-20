# Serverless Stock Pattern Detection System

AWS CDK TypeScript implementation of a real-time stock pattern detection and alerting system for financial services.

## Architecture

This system implements a fully serverless architecture using:

- **API Gateway**: REST API with `/patterns` and `/alerts` endpoints
- **Lambda Functions**: Three functions for pattern detection, alert processing, and threshold checking
- **DynamoDB**: On-demand table for storing trading patterns
- **SQS**: Message queue for reliable alert delivery with DLQ
- **SNS**: Topic for critical alert notifications
- **EventBridge**: Scheduled rule for periodic threshold checks
- **CloudWatch**: Comprehensive logging, monitoring, and alarms

## Key Features

- ARM-based Graviton2 processors for all Lambda functions (cost-efficient)
- X-Ray tracing enabled for distributed tracing
- Lambda Layers for shared dependencies
- Reserved concurrency for PatternDetector (50)
- API Gateway throttling (1000 rps, 2000 burst)
- 4-day message retention for SQS queues
- Point-in-time recovery for DynamoDB
- CloudWatch alarms for error monitoring
- 7-day log retention

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+
- AWS CDK 2.x installed (`npm install -g aws-cdk`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda layer dependencies:
```bash
cd lib/lambda/layers/shared/nodejs
npm install
cd ../../../../..
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

## Deployment

Deploy the stack with default environment suffix (dev):
```bash
cdk deploy
```

Deploy with custom environment suffix:
```bash
cdk deploy --context environmentSuffix=prod
```

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## API Usage

### Submit Pattern Data

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/patterns \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "price": 150.25,
    "volume": 75000,
    "pattern": "head-and-shoulders"
  }'
```

### Check Alerts

```bash
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/alerts
```

## Configuration

### Environment Variables

Lambda functions use these environment variables:

**PatternDetector**:
- `TABLE_NAME`: DynamoDB table name
- `QUEUE_URL`: SQS queue URL

**AlertProcessor**:
- `TOPIC_ARN`: SNS topic ARN

**ThresholdChecker**:
- `TABLE_NAME`: DynamoDB table name
- `QUEUE_URL`: SQS queue URL
- `THRESHOLD_PERCENTAGE`: Price change threshold (default: 5)
- `THRESHOLD_VOLUME`: Volume threshold (default: 10000)
- `THRESHOLD_PRICE`: Price threshold (default: 100)

## Monitoring

CloudWatch alarms are configured for:
- Lambda function errors (>1% error rate)
- DLQ message count
- API Gateway 4xx/5xx errors

Access logs and metrics through AWS CloudWatch Console.

## Resource Cleanup

To destroy all resources:
```bash
cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for clean teardown.

## Architecture Constraints

- All Lambda functions use ARM_64 architecture
- SQS retention: exactly 4 days
- Lambda log retention: 7 days
- API throttling: 1000 rps (2000 burst)
- DynamoDB: on-demand billing with PITR
- PatternDetector reserved concurrency: 50
- AlertProcessor batch size: 10
- DLQ max receive count: 3

## License

MIT
