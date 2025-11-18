# Serverless Financial Data Processing Pipeline

A complete serverless data processing pipeline built with **Pulumi and TypeScript** for financial analytics. This infrastructure handles millions of stock market data points daily with automatic scaling and comprehensive error handling.

## Architecture Overview

This solution implements an event-driven serverless architecture with the following components:

1. **S3 Bucket** - Raw market data ingestion with encryption and versioning
2. **DynamoDB Table** - State management with on-demand billing and point-in-time recovery
3. **Lambda Functions** (3) - DataIngestion, DataProcessor, DataAggregator
4. **SQS Queues** - ProcessingQueue with dead letter queue for failed messages
5. **EventBridge** - Custom event routing and scheduled rules
6. **API Gateway** - REST API with POST /ingest endpoint
7. **CloudWatch** - Log groups with 7-day retention and error metric filters
8. **IAM Roles** - Least privilege access with explicit deny statements
9. **X-Ray** - Distributed tracing for all Lambda functions

## Data Flow

```
1. Market data → S3 bucket → triggers DataIngestion Lambda
2. DataIngestion processes → sends to SQS ProcessingQueue
3. DataProcessor consumes SQS → updates DynamoDB state
4. DataProcessor emits events → EventBridge
5. DataAggregator runs every 5 minutes → aggregates data
6. API Gateway POST /ingest → direct Lambda invocation
7. Dead letter queues → capture all failed async executions
```

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create all required resources

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda function dependencies:
```bash
cd lambda
npm install
cd ..
```

## Configuration

The infrastructure uses the Pulumi stack name as the environment suffix. All resources include this suffix for uniqueness:

```bash
# Set your stack
pulumi stack select dev  # or create: pulumi stack init dev
```

Resources will be named: `market-data-dev`, `DataIngestion-dev`, etc.

## Deployment

### Deploy to AWS

```bash
# Initialize Pulumi (first time only)
pulumi login

# Preview changes
pulumi preview

# Deploy the infrastructure
pulumi up
```

The deployment will output:
- **apiGatewayUrl** - POST endpoint for data ingestion
- **s3BucketName** - S3 bucket for raw data
- **dynamodbTableArn** - DynamoDB table ARN

### Deploy with Custom Stack

```bash
# Create production stack
pulumi stack init prod

# Deploy to production
pulumi up --stack prod
```

## AWS Services Configuration

### S3 Bucket
- Versioning enabled
- SSE-S3 encryption
- 30-day lifecycle policy
- S3 event notifications to Lambda

### DynamoDB Table
- Partition key: `symbol` (String)
- Sort key: `timestamp` (Number)
- On-demand billing mode
- Point-in-time recovery enabled

### Lambda Functions

**DataIngestion**
- Runtime: Node.js 18.x
- Memory: 3GB
- Timeout: 5 minutes
- Trigger: S3 ObjectCreated events
- Dead letter queue configured

**DataProcessor**
- Runtime: Node.js 18.x
- Memory: 3GB
- Timeout: 5 minutes
- Trigger: SQS messages
- Batch size: 10 messages

**DataAggregator**
- Runtime: Node.js 18.x
- Memory: 3GB
- Timeout: 5 minutes
- Trigger: EventBridge scheduled rule (every 5 minutes)
- Dead letter queue configured

### SQS Queues
- Message retention: 4 days
- Visibility timeout: 5 minutes
- Dead letter queue with 14-day retention
- Max receive count: 3

### API Gateway
- REST API with IAM authorization
- POST /ingest endpoint
- Throttling: 10,000 req/sec burst and rate limit
- AWS_PROXY integration with DataIngestion Lambda

### CloudWatch
- Log retention: 7 days
- Error metric filters for all Lambda functions
- Pattern: `?ERROR ?Exception`
- Namespace: MarketAnalytics

### IAM Policies
All roles implement least privilege with explicit deny statements:
- Deny destructive operations (DeleteBucket, DeleteTable, etc.)
- Allow only required actions per function
- X-Ray tracing permissions
- CloudWatch Logs permissions

## Testing

### Upload Test Data to S3

```bash
# Get bucket name from Pulumi outputs
BUCKET_NAME=$(pulumi stack output s3BucketName)

# Upload test market data
echo '{"symbol":"AAPL","price":150.00,"timestamp":1234567890}' > test-data.json
aws s3 cp test-data.json s3://${BUCKET_NAME}/AAPL/test-data.json
```

### Invoke API Gateway

```bash
# Get API URL from Pulumi outputs
API_URL=$(pulumi stack output apiGatewayUrl)

# Invoke the API (requires AWS Signature V4)
aws apigatewayv2 invoke \
  --api-id $(pulumi stack output apiGatewayUrl | cut -d'/' -f3 | cut -d'.' -f1) \
  --stage prod \
  --request-path /ingest \
  --http-method POST \
  --body '{"symbol":"TSLA","price":200.00}' \
  response.json
```

### Monitor Logs

```bash
# DataIngestion logs
aws logs tail /aws/lambda/DataIngestion-dev --follow

# DataProcessor logs
aws logs tail /aws/lambda/DataProcessor-dev --follow

# DataAggregator logs
aws logs tail /aws/lambda/DataAggregator-dev --follow
```

### Check DynamoDB Data

```bash
# Get table name
TABLE_NAME=$(pulumi stack output dynamodbTableArn | cut -d'/' -f2)

# Scan table
aws dynamodb scan --table-name ${TABLE_NAME}
```

### View CloudWatch Metrics

```bash
# View error metrics
aws cloudwatch get-metric-statistics \
  --namespace MarketAnalytics \
  --metric-name DataIngestionErrorCount \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Monitoring and Debugging

### X-Ray Tracing
All Lambda functions have X-Ray tracing enabled. View traces in the AWS X-Ray console to debug performance issues and failures.

### Dead Letter Queues
Failed async Lambda executions are sent to the dead letter queue:
- Queue name: `ProcessingDLQ-{stack}`
- Check for failed messages: `aws sqs receive-message --queue-url <DLQ_URL>`

### CloudWatch Alarms (Optional)
Create alarms for error metrics:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name DataIngestionErrors \
  --alarm-description "Alert on DataIngestion errors" \
  --metric-name DataIngestionErrorCount \
  --namespace MarketAnalytics \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Cleanup

To destroy all resources:

```bash
# Destroy infrastructure
pulumi destroy

# Remove stack (optional)
pulumi stack rm dev
```

**Warning**: This will permanently delete all data in S3 and DynamoDB. The infrastructure is configured for complete destroyability with no retention policies.

## Cost Optimization

This architecture is optimized for cost:
- **Serverless**: No idle resource costs
- **On-demand DynamoDB**: Pay per request, no provisioned capacity
- **Lambda**: Scales to zero during off-hours
- **7-day log retention**: Reduced CloudWatch costs
- **S3 lifecycle**: 30-day expiration for old data

Estimated monthly cost for 1M requests/day: $50-$100 USD

## Troubleshooting

### Lambda Timeout Errors
- Check function memory (currently 3GB)
- Review CloudWatch Logs for performance bottlenecks
- Check X-Ray traces for slow operations

### SQS Dead Letter Queue Messages
- Review message content in DLQ
- Check Lambda function errors in CloudWatch Logs
- Verify DynamoDB table permissions

### API Gateway 403 Errors
- Ensure IAM credentials are configured
- Check API Gateway resource policies
- Verify Lambda permission for API Gateway invocation

### S3 Event Not Triggering Lambda
- Check S3 bucket notification configuration
- Verify Lambda permission for S3 invocation
- Review CloudWatch Logs for invocation records

## Security Considerations

1. **IAM Policies**: Explicit deny statements prevent destructive operations
2. **Encryption**: S3 uses SSE-S3 encryption at rest
3. **API Gateway**: IAM authorization required for all requests
4. **VPC**: Not required for this serverless architecture
5. **Secrets**: Use AWS Secrets Manager for sensitive configuration
6. **Least Privilege**: Each Lambda role has minimal required permissions

## Architecture Decisions

### Why Node.js 18.x?
- AWS SDK v3 included by default (no bundling required)
- Better performance than earlier versions
- Long-term support (LTS)

### Why On-Demand DynamoDB?
- Variable market data workload
- Scales automatically with traffic
- Cost-effective for unpredictable patterns

### Why 3GB Memory for Lambda?
- Financial analytics may require memory-intensive operations
- Higher memory = more CPU allocation
- Faster processing = lower duration costs

### Why 7-Day Log Retention?
- Balance between debugging capability and cost
- Sufficient for most troubleshooting scenarios
- Can be increased for compliance requirements

## Compliance and Governance

- **Tags**: All resources tagged with Environment=Production, Project=MarketAnalytics
- **Region**: us-east-1 (configurable via region constant)
- **Destroyability**: No Retain policies, all resources can be deleted
- **Audit**: CloudWatch Logs and X-Ray provide complete audit trail

## File Structure

```
.
├── index.ts              # Main Pulumi infrastructure code
├── Pulumi.yaml           # Pulumi project configuration
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
├── lambda/               # Lambda function code
│   ├── dataIngestion.js
│   ├── dataProcessor.js
│   ├── dataAggregator.js
│   └── package.json
└── lib/
    ├── PROMPT.md         # Original requirements
    ├── MODEL_RESPONSE.md # Initial generated code
    ├── MODEL_FAILURES.md # Issues identified
    ├── IDEAL_RESPONSE.md # Corrected implementation
    └── README.md         # This file
```

## Support and Documentation

- [Pulumi AWS Documentation](https://www.pulumi.com/docs/clouds/aws/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

## License

This infrastructure code is provided as-is for educational and development purposes.
