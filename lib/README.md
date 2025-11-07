# Serverless Webhook Processing System

A production-ready serverless webhook processing system built with AWS CDK (Python) that handles webhooks from multiple payment providers (Stripe, PayPal, and Square) with reliable async processing and comprehensive error handling.

## Architecture

The system consists of:

- **API Gateway REST API** with 3 endpoints (/stripe, /paypal, /square)
- **Lambda Custom Authorizer** for webhook signature validation
- **3 Provider-Specific Lambda Processors** (Stripe, PayPal, Square)
- **SQS Queue** for asynchronous processing with 300s visibility timeout
- **Lambda SQS Consumer** for writing events to DynamoDB
- **DynamoDB Table** (WebhookEvents) with on-demand billing
- **S3 Bucket** for failed webhook archival with 90-day Glacier transition
- **Dead Letter Queue** with Lambda processor for handling failures after 3 retries

## Features

- Custom authorization for all webhook endpoints
- Separate IAM roles per Lambda with least privilege
- KMS encryption for Lambda environment variables
- API Gateway throttling at 1000 req/sec
- CloudWatch Logs with 30-day retention
- Automatic retry mechanism (3 attempts)
- Failed webhook archival to S3 organized by provider/date
- On-demand scaling for DynamoDB
- All resources include environmentSuffix for isolation
- Fully destroyable infrastructure

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.11+
- Node.js 18+ (for AWS CDK)
- AWS CDK Toolkit installed (`npm install -g aws-cdk`)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

## Deployment

### Deploy with default environment suffix:
```bash
cdk deploy
```

### Deploy with custom environment suffix:
```bash
cdk deploy -c environmentSuffix=prod
```

### Synthesize CloudFormation template:
```bash
cdk synth
```

## Configuration

The stack uses the following configuration:

- **Region**: us-east-1 (default, can be changed in cdk.json)
- **Lambda Runtime**: Python 3.11
- **API Gateway Throttling**: 1000 req/sec
- **SQS Visibility Timeout**: 300 seconds
- **DLQ Max Receive Count**: 3
- **CloudWatch Log Retention**: 30 days
- **S3 Lifecycle**: 90 days to Glacier

## Testing

### Run unit tests:
```bash
pytest tests/unit/ -v
```

### Run unit tests with coverage:
```bash
pytest tests/unit/ --cov=lib --cov-report=html --cov-report=term
```

### Run integration tests (requires deployed stack):
```bash
pytest tests/integration/ -v
```

## Stack Outputs

After deployment, the stack provides the following outputs:

- **ApiUrl**: Base URL for the webhook API
- **TableName**: DynamoDB table name for webhook events
- **BucketName**: S3 bucket name for failed webhooks

## API Endpoints

### POST /stripe
Processes Stripe webhook events

**Headers**:
- `Authorization`: Valid authorization token

**Body**: Stripe webhook payload

**Response**:
- `200 OK`: Webhook processed successfully
- `500 Internal Server Error`: Processing failed

### POST /paypal
Processes PayPal webhook events

**Headers**:
- `Authorization`: Valid authorization token

**Body**: PayPal webhook payload

**Response**:
- `200 OK`: Webhook processed successfully
- `500 Internal Server Error`: Processing failed

### POST /square
Processes Square webhook events

**Headers**:
- `Authorization`: Valid authorization token

**Body**: Square webhook payload

**Response**:
- `200 OK`: Webhook processed successfully
- `500 Internal Server Error`: Processing failed

## Webhook Processing Flow

1. **Webhook received** → API Gateway validates authorization via custom Lambda authorizer
2. **Authorization successful** → Request routed to provider-specific Lambda processor
3. **Processor validates** → Transforms payload to standard format
4. **Message sent to SQS** → Queued for asynchronous processing
5. **SQS Consumer triggered** → Writes event to DynamoDB
6. **Success** → Event persisted with processed timestamp

### Failure Handling

- **Processing fails** → SQS retries up to 3 times (visibility timeout: 300s)
- **All retries exhausted** → Message moved to Dead Letter Queue (DLQ)
- **DLQ processor triggered** → Archives failed webhook to S3
- **S3 organization**: `{provider}/{year}/{month}/{day}/{eventId}.json`

## DynamoDB Schema

**Table**: WebhookEvents

| Attribute | Type | Description |
|-----------|------|-------------|
| eventId (PK) | String | Unique event identifier |
| timestamp (SK) | Number | Event timestamp (Unix epoch) |
| provider | String | Payment provider (stripe/paypal/square) |
| type | String | Event type |
| payload | String | Original webhook payload (JSON string) |
| processedAt | Number | Processing timestamp |

## Security

- **IAM Least Privilege**: Each Lambda has a separate role with minimal permissions
- **KMS Encryption**: Lambda environment variables encrypted at rest
- **API Gateway Authorization**: Custom authorizer validates all requests
- **S3 Encryption**: SSE-S3 encryption enabled on bucket
- **No Hardcoded Credentials**: All AWS service access via IAM roles

## Monitoring

- **CloudWatch Logs**: All Lambda functions log to CloudWatch
- **Log Retention**: 30 days
- **API Gateway Logging**: Request/response logging enabled
- **DLQ Monitoring**: Monitor DLQ depth for processing failures

## Cost Optimization

- **DynamoDB On-Demand**: Pay only for actual reads/writes
- **Lambda**: Pay per invocation and compute time
- **S3 Lifecycle**: Automatic transition to Glacier after 90 days
- **Serverless Architecture**: No idle compute costs

## Cleanup

To delete the stack and all resources:

```bash
cdk destroy
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup.

## Troubleshooting

### Stack deployment fails
- Verify AWS credentials are configured correctly
- Check CDK bootstrap is complete for your account/region
- Review CloudFormation events in AWS Console

### Tests fail
- Ensure all dependencies installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.11+)
- For integration tests, verify stack is deployed

### API Gateway returns 403
- Verify Authorization header is present and not empty
- Check custom authorizer Lambda logs in CloudWatch
- Token value 'invalid' will always deny access (test behavior)

### Events not appearing in DynamoDB
- Check SQS queue for messages
- Review SQS consumer Lambda logs
- Verify IAM permissions for DynamoDB write access

### Failed webhooks not in S3
- Check DLQ for messages
- Review DLQ processor Lambda logs
- Verify IAM permissions for S3 write access

## Development

### Project Structure

```
.
├── bin/                    # CDK app entry point
├── lib/
│   ├── tap_stack.py       # Main CDK stack
│   ├── lambda/            # Lambda function code
│   │   ├── authorizer.py
│   │   ├── stripe_processor.py
│   │   ├── paypal_processor.py
│   │   ├── square_processor.py
│   │   ├── sqs_consumer.py
│   │   └── dlq_processor.py
│   ├── PROMPT.md          # Original requirements
│   ├── MODEL_RESPONSE.md  # Implementation details
│   └── README.md          # This file
├── tests/
│   ├── unit/              # Unit tests
│   │   ├── test_tap_stack.py
│   │   └── test_lambda_handlers.py
│   └── integration/       # Integration tests
│       └── test_webhook_flow.py
├── cdk.json               # CDK configuration
├── requirements.txt       # Python dependencies
└── metadata.json          # Task metadata

```

### Adding a new payment provider

1. Create new Lambda processor in `lib/lambda/{provider}_processor.py`
2. Add Lambda function in `lib/tap_stack.py`
3. Create API Gateway resource and method
4. Add unit tests in `tests/unit/test_lambda_handlers.py`
5. Update this README

## License

This infrastructure code is part of the TAP (Test Automation Platform) project.

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda execution details
2. Review CloudFormation stack events
3. Verify IAM permissions and resource configurations
