# Payment Webhook Processing System

Serverless payment webhook processing system built with AWS CDK (Python) for handling webhooks from multiple payment providers (Stripe, PayPal, Square).

## Architecture Overview

```
Internet → API Gateway (WAF) → Webhook Receiver Lambda → Processing Queue
                                          ↓
                                    DynamoDB Table
                                          ↓
                                  DynamoDB Streams
                                          ↓
                                   Audit Logger Lambda

Processing Queue → Payment Processor Lambda → DynamoDB Table
                           ↓ (on failure)
                      Dead Letter Queue → SNS Alert Topic
```

## Components

### Infrastructure (lib/tap_stack.py)
- **API Gateway REST API**: `/webhook/{provider}` endpoint with WAF protection
- **Lambda Functions**: 3 functions (receiver, processor, audit logger)
- **DynamoDB Table**: PaymentWebhooks with streams enabled
- **SQS Queues**: Processing queue and dead letter queue
- **SNS Topic**: Alert notifications
- **KMS Key**: Customer-managed encryption key
- **WAF**: Rate limiting (10 req/sec per IP)
- **CloudWatch**: Alarms and X-Ray tracing

### Lambda Functions
- **Webhook Receiver** (lib/lambda/receiver/): Receives and acknowledges webhooks
- **Payment Processor** (lib/lambda/processor/): Processes payment webhooks async
- **Audit Logger** (lib/lambda/audit/): Logs DynamoDB changes for audit trail

## Prerequisites

- Python 3.11 or later
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Pipenv installed (`pip install pipenv`)
- AWS credentials configured
- Sufficient IAM permissions to create resources

## Installation

1. **Install Python dependencies**:
   ```bash
   pipenv install
   ```

2. **Activate virtual environment**:
   ```bash
   pipenv shell
   ```

3. **Install Lambda layer dependencies** (optional for local testing):
   ```bash
   cd lib/lambda/layer/python
   pip install -r requirements.txt -t .
   cd ../../../..
   ```

## Configuration

Environment suffix can be set via CDK context:

```bash
# Development
cdk synth -c environmentSuffix=dev

# Production
cdk synth -c environmentSuffix=prod
```

Default environment suffix: `dev`

## Deployment

### First Time Deployment

1. **Bootstrap CDK** (if not already done):
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/us-east-1
   ```

2. **Synthesize CloudFormation**:
   ```bash
   cdk synth -c environmentSuffix=<YOUR_SUFFIX>
   ```

3. **Deploy stack**:
   ```bash
   cdk deploy -c environmentSuffix=<YOUR_SUFFIX>
   ```

### Subsequent Deployments

```bash
cdk deploy -c environmentSuffix=<YOUR_SUFFIX>
```

## Testing

### Unit Tests

Run unit tests to verify infrastructure configuration:

```bash
pytest tests/unit/ -v
```

Unit tests verify:
- Stack synthesis succeeds
- Resource configurations correct
- Resource names include environmentSuffix
- Lambda runtime, architecture, timeout settings
- DynamoDB billing mode and streams
- KMS encryption enabled
- IAM permissions granted

### Integration Tests

After deployment, run integration tests:

```bash
pytest tests/integration/ -v
```

Integration tests verify:
- API Gateway endpoint accessible
- Webhook POST requests processed
- Data stored in DynamoDB
- Async processing via SQS
- DynamoDB streams trigger audit logger
- Failed processing goes to DLQ
- X-Ray traces generated
- CloudWatch metrics published

### Manual Testing

1. **Get API endpoint**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name TapStack<environmentSuffix> \
     --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
     --output text
   ```

2. **Send test webhook**:
   ```bash
   curl -X POST \
     https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/webhook/stripe \
     -H 'Content-Type: application/json' \
     -d '{"event": "payment.succeeded", "amount": 1000}'
   ```

3. **Verify in DynamoDB**:
   ```bash
   aws dynamodb scan \
     --table-name PaymentWebhooks-<environmentSuffix> \
     --max-items 5
   ```

4. **Check CloudWatch Logs**:
   ```bash
   aws logs tail /aws/lambda/webhook-receiver-<environmentSuffix> --follow
   ```

## Monitoring

### CloudWatch Dashboards

Key metrics to monitor:
- API Gateway 4xx/5xx errors
- Lambda invocation count, duration, errors
- SQS queue depth (processing queue and DLQ)
- DynamoDB read/write capacity (should be 0 for on-demand)
- WAF blocked requests

### X-Ray Traces

View distributed traces:
```bash
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

### Alarms

Configured alarms:
- **DLQ Alarm**: Triggers when messages appear in dead letter queue
- SNS notification sent to alert topic

## Security

### Encryption
- **At Rest**: All data encrypted with customer-managed KMS key
- **In Transit**: HTTPS/TLS for all API calls

### Access Control
- IAM least privilege for all Lambda functions
- Service principals for KMS key access
- API Gateway resource policies

### Rate Limiting
- **WAF**: 10 requests per second per IP address
- **API Gateway**: 1000 requests per second burst limit

### Audit Logging
- All DynamoDB changes logged via streams
- CloudWatch Logs retention for compliance
- X-Ray traces for security analysis

## Cost Optimization

### Serverless Architecture
- Lambda ARM64: ~20% cost reduction vs x86_64
- DynamoDB on-demand: Pay per request, no wasted capacity
- SQS: First 1M requests free per month

### Cost Estimates (Monthly)
- API Gateway: ~$3.50 per million requests
- Lambda: ~$0.20 per million requests (ARM64, 128MB)
- DynamoDB: ~$1.25 per million writes
- SQS: ~$0.40 per million requests
- CloudWatch Logs: ~$0.50 per GB ingested
- KMS: ~$1.00 per month + $0.03 per 10k requests

**Typical Cost**: $10-20/month for low-volume testing

## Troubleshooting

### Deployment Failures

**Issue**: Reserved concurrency exceeds account limit
```
Error: Specified ReservedConcurrentExecutions decreases account's UnreservedConcurrentExecution below 10
```
**Solution**: Reduce `reserved_concurrent_executions` in tap_stack.py or request limit increase

**Issue**: Resource names conflict
```
Error: Resource with name already exists
```
**Solution**: Ensure unique `environmentSuffix` is set via CDK context

### Runtime Errors

**Issue**: Lambda function timeout
```
Error: Task timed out after 30.00 seconds
```
**Solution**: Check Lambda logs, verify external API connectivity, increase timeout if needed

**Issue**: DynamoDB permission denied
```
Error: User is not authorized to perform: dynamodb:PutItem
```
**Solution**: Verify IAM role has `grant_write_data` permission

### WAF Issues

**Issue**: Requests blocked by WAF
```
Status: 403 Forbidden
```
**Solution**: Check WAF logs, adjust rate limit if testing requires higher throughput

## Cleanup

Destroy all resources:

```bash
cdk destroy -c environmentSuffix=<YOUR_SUFFIX>
```

**Note**: All resources have `RemovalPolicy.DESTROY` configured for easy cleanup.

## Support

For issues or questions:
1. Check CloudWatch Logs for detailed error messages
2. Review X-Ray traces for request flow
3. Verify IAM permissions
4. Check AWS service quotas

## License

Internal use only for synthetic task training.
