# Serverless Webhook Processing System

A complete serverless architecture for processing payment webhooks at scale using AWS serverless services.

## Architecture Overview

This solution implements a production-ready webhook processing pipeline that:
- Receives webhooks via API Gateway REST API
- Validates signatures and stores payloads in S3
- Tracks webhook metadata in DynamoDB
- Processes webhooks in order by provider using SQS FIFO
- Routes processed events via EventBridge for downstream consumption
- Provides full observability with CloudWatch Logs and X-Ray tracing

## Infrastructure Components

### AWS Services Used

- **API Gateway REST API**: Webhook ingestion endpoint with request validation
- **Lambda Functions**: Two functions (ingestion and processing)
- **DynamoDB**: Webhook metadata storage with on-demand billing
- **S3**: Raw payload archival with 30-day lifecycle to Glacier
- **SQS FIFO**: Ordered message processing by provider
- **SQS Standard**: Dead letter queue for failed messages
- **EventBridge**: Custom event bus for webhook routing
- **CloudWatch Logs**: Centralized logging with 7-day retention
- **X-Ray**: Distributed tracing for all components
- **IAM**: Least-privilege roles and policies

### Resource Naming Convention

All resources include the environment suffix for multi-environment support:
- Format: `{resource-type}-{environment-suffix}`
- Example: `webhook-api-dev`, `webhook-metadata-prod`

## Prerequisites

- Pulumi CLI 3.x or higher
- Python 3.8 or higher
- AWS CLI configured with appropriate credentials
- boto3 Python package

## Installation

1. Install Pulumi:
```bash
curl -fsSL https://get.pulumi.com | sh
```

2. Install Python dependencies:
```bash
pip install pulumi pulumi-aws boto3
```

3. Configure AWS credentials:
```bash
aws configure
```

## Deployment

### 1. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
export REPOSITORY=your-repo-name
export COMMIT_AUTHOR=your-name
export PR_NUMBER=your-pr-number
export TEAM=your-team
```

### 2. Initialize Pulumi Stack

```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
```

### 3. Deploy Infrastructure

```bash
pulumi up
```

Review the planned changes and confirm deployment.

### 4. Retrieve Outputs

After deployment, retrieve the API endpoint and other outputs:

```bash
pulumi stack output api_endpoint
pulumi stack output dynamodb_table_name
pulumi stack output s3_bucket_name
pulumi stack output sqs_queue_url
pulumi stack output eventbridge_bus_arn
```

## Testing

### Test Webhook Ingestion

Use curl to send a test webhook:

```bash
API_ENDPOINT=$(pulumi stack output api_endpoint)

curl -X POST $API_ENDPOINT \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature-12345" \
  -H "X-Provider-ID: stripe" \
  -d '{"event": "payment.completed", "amount": 100}'
```

Expected response:
```json
{
  "message": "Webhook received and queued for processing",
  "webhook_id": "uuid-here"
}
```

### Verify Processing

1. Check CloudWatch Logs for ingestion Lambda:
```bash
aws logs tail /aws/lambda/webhook-ingestion-dev --follow
```

2. Check CloudWatch Logs for processing Lambda:
```bash
aws logs tail /aws/lambda/webhook-processing-dev --follow
```

3. Verify DynamoDB entry:
```bash
TABLE_NAME=$(pulumi stack output dynamodb_table_name)
aws dynamodb scan --table-name $TABLE_NAME
```

4. Verify S3 payload storage:
```bash
BUCKET_NAME=$(pulumi stack output s3_bucket_name)
aws s3 ls s3://$BUCKET_NAME/ --recursive
```

### X-Ray Tracing

View distributed traces in AWS X-Ray console:
```bash
aws xray get-trace-summaries --start-time $(date -u -d '1 hour ago' +%s) --end-time $(date -u +%s)
```

## Configuration

### Environment Variables (Lambda Functions)

**Ingestion Lambda**:
- `BUCKET_NAME`: S3 bucket for payload storage
- `TABLE_NAME`: DynamoDB table for metadata
- `QUEUE_URL`: SQS FIFO queue URL
- `ENVIRONMENT`: Environment suffix

**Processing Lambda**:
- `EVENT_BUS_NAME`: EventBridge custom bus name
- `ENVIRONMENT`: Environment suffix

### API Gateway Settings

- Throttling: 5000 burst limit, 10000 rate limit
- Request validation: Requires X-Webhook-Signature and X-Provider-ID headers
- Stage: Uses environment suffix as stage name

### Lambda Configuration

- Runtime: Python 3.11
- Memory: 256 MB
- Timeout: 30 seconds
- X-Ray: Enabled (Active mode)

### SQS Configuration

- Queue type: FIFO
- Content-based deduplication: Enabled
- Message retention: 4 days
- Visibility timeout: 180 seconds
- Dead letter queue: Maximum 3 receive attempts

### S3 Lifecycle Policy

- Archive to Glacier after 30 days
- Force destroy enabled for test environments

## Monitoring and Observability

### CloudWatch Metrics

Monitor key metrics:
- API Gateway 4XX/5XX errors
- Lambda invocation count and duration
- Lambda error count and throttles
- SQS messages sent/received
- DynamoDB consumed capacity

### CloudWatch Logs

All Lambda functions log to CloudWatch with 7-day retention:
- `/aws/lambda/webhook-ingestion-{env}`
- `/aws/lambda/webhook-processing-{env}`
- `/aws/events/webhook-events-{env}`

### X-Ray Tracing

End-to-end tracing available for:
- API Gateway requests
- Lambda function execution
- AWS service calls (S3, DynamoDB, SQS, EventBridge)

## Security

### IAM Permissions

**Ingestion Lambda**:
- S3: PutObject, PutObjectAcl
- DynamoDB: PutItem
- SQS: SendMessage, GetQueueUrl
- CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents
- X-Ray: PutTraceSegments, PutTelemetryRecords

**Processing Lambda**:
- SQS: ReceiveMessage, DeleteMessage, GetQueueAttributes
- EventBridge: PutEvents
- CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents
- X-Ray: PutTraceSegments, PutTelemetryRecords

### Data Protection

- All S3 buckets have public access blocked
- Webhook signatures validated before processing
- Payloads stored with encryption at rest (S3 default)
- DynamoDB encryption at rest enabled by default

## Troubleshooting

### Common Issues

**1. Missing Required Headers**
- Error: 400 Bad Request
- Solution: Ensure X-Webhook-Signature and X-Provider-ID headers are present

**2. Lambda Timeout**
- Error: Task timed out after 30.00 seconds
- Solution: Check external service dependencies, increase timeout if needed

**3. SQS Messages in DLQ**
- Issue: Messages failing after 3 attempts
- Solution: Check processing Lambda CloudWatch Logs for errors

**4. S3 Bucket Name Conflict**
- Error: Bucket already exists
- Solution: Ensure environment suffix is unique

### Debug Commands

Check Lambda function logs:
```bash
aws logs tail /aws/lambda/{function-name} --since 1h --follow
```

View SQS queue attributes:
```bash
aws sqs get-queue-attributes --queue-url {queue-url} --attribute-names All
```

List DynamoDB items:
```bash
aws dynamodb scan --table-name {table-name}
```

View EventBridge events:
```bash
aws events describe-event-bus --name {bus-name}
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm the destruction when prompted. All resources will be permanently deleted.

## Constraints Compliance

This implementation enforces all 10 required constraints:

1. API Gateway with request validation and throttling
2. Lambda functions with 256MB memory and 30s timeout
3. DynamoDB with on-demand billing mode
4. Lambda Python 3.11 runtime
5. X-Ray tracing on all components
6. SQS FIFO queue with content-based deduplication
7. Dead letter queue with 3 max receive attempts
8. S3 lifecycle policy to archive after 30 days
9. EventBridge custom bus with provider-based routing
10. All resources tagged with Environment and Service

## Support

For issues or questions, refer to:
- PROMPT.md: Original requirements
- MODEL_RESPONSE.md: Complete implementation code
- IDEAL_RESPONSE.md: Implementation details and architecture
- MODEL_FAILURES.md: Validation and lessons learned

## License

This infrastructure code is generated for the TAP (Test Automation Platform) project.
