# Serverless Event Processing Infrastructure

## Overview

This infrastructure creates a serverless event processing pipeline for financial transaction webhooks using AWS services. The system validates incoming webhook events, prevents duplicates, and routes events to appropriate SQS queues based on transaction type.

## Architecture

```
Webhook Request
    |
    v
API Gateway (REST API)
    |
    v
Validator Lambda
    |
    +---> DynamoDB (deduplication)
    |
    +---> Router Lambda (async invocation)
            |
            v
        SQS Queues
            |
            +---> payments-queue
            |       |
            |       +---> payments-dlq
            |
            +---> refunds-queue
            |       |
            |       +---> refunds-dlq
            |
            +---> disputes-queue
                    |
                    +---> disputes-dlq
```

## Components

### API Gateway
- **Type**: REST API
- **Endpoint**: POST /webhook
- **Throttling**: 1000 RPS burst limit
- **X-Ray**: Enabled
- **Request Validation**: JSON schema validation for required fields

### Lambda Functions

#### Webhook Validator
- **Runtime**: Python 3.11
- **Architecture**: arm64
- **Timeout**: 30 seconds
- **Memory**: 256 MB
- **Concurrency**: 10 reserved executions
- **Responsibilities**:
  - Validates webhook payload
  - Checks for duplicate events in DynamoDB
  - Stores event with 30-day TTL
  - Invokes router Lambda asynchronously

#### Event Router
- **Runtime**: Python 3.11
- **Architecture**: arm64
- **Timeout**: 60 seconds
- **Memory**: 256 MB
- **Concurrency**: 10 reserved executions
- **Responsibilities**:
  - Routes events to appropriate SQS queue based on transaction_type
  - Handles payment, refund, and dispute transaction types

### DynamoDB Table
- **Name**: transaction-events-{environmentSuffix}
- **Billing Mode**: On-demand (PAY_PER_REQUEST)
- **Key**: event_id (String)
- **TTL**: Enabled (30 days)
- **Point-in-Time Recovery**: Enabled
- **Purpose**: Event deduplication

### SQS Queues

#### Primary Queues
- **payments-queue**: Handles payment transactions
- **refunds-queue**: Handles refund transactions
- **disputes-queue**: Handles dispute transactions

**Configuration**:
- Message Retention: 7 days (604800 seconds)
- Visibility Timeout: 300 seconds
- Encryption: SQS-managed SSE enabled
- Dead Letter Queue: Configured with maxReceiveCount of 3

#### Dead Letter Queues
- **payments-dlq**: Failed payment messages
- **refunds-dlq**: Failed refund messages
- **disputes-dlq**: Failed dispute messages

**Configuration**:
- Message Retention: 7 days
- Encryption: SQS-managed SSE enabled

### CloudWatch Log Groups
- **/aws/lambda/webhook-validator-{environmentSuffix}**: Validator Lambda logs
- **/aws/lambda/event-router-{environmentSuffix}**: Router Lambda logs
- **Retention**: 30 days

## Deployment

### Prerequisites
- Python 3.8+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- Environment variable `ENVIRONMENT_SUFFIX` set

### Deploy
```bash
export ENVIRONMENT_SUFFIX="dev"
pulumi up
```

### Destroy
```bash
pulumi destroy
```

## Environment Variables

### Validator Lambda
- `DYNAMODB_TABLE`: DynamoDB table name for event deduplication
- `ROUTER_LAMBDA_NAME`: Name of router Lambda function

### Router Lambda
- `PAYMENTS_QUEUE_URL`: SQS queue URL for payments
- `REFUNDS_QUEUE_URL`: SQS queue URL for refunds
- `DISPUTES_QUEUE_URL`: SQS queue URL for disputes

## API Request Format

### POST /webhook

**Required Fields**:
- `event_id` (string): Unique event identifier
- `transaction_type` (string): One of: payment, refund, dispute
- `amount` (number): Transaction amount
- `timestamp` (string): ISO 8601 timestamp

**Example Request**:
```json
{
  "event_id": "evt_12345",
  "transaction_type": "payment",
  "amount": 99.99,
  "timestamp": "2025-12-02T10:30:00Z"
}
```

**Success Response** (200):
```json
{
  "message": "Event validated and queued for processing",
  "event_id": "evt_12345"
}
```

**Duplicate Event** (409):
```json
{
  "error": "Duplicate event"
}
```

**Missing Field** (400):
```json
{
  "error": "Missing required field: event_id"
}
```

## Outputs

The stack exports the following outputs:

- `api_endpoint`: API Gateway webhook endpoint URL
- `validator_lambda_arn`: ARN of validator Lambda function
- `router_lambda_arn`: ARN of router Lambda function
- `payments_queue_url`: URL of payments SQS queue
- `refunds_queue_url`: URL of refunds SQS queue
- `disputes_queue_url`: URL of disputes SQS queue
- `dynamodb_table_name`: Name of DynamoDB table

## Security Features

- **Encryption**: All SQS queues use AWS-managed encryption
- **IAM Roles**: Least privilege principle applied
  - Validator Lambda: DynamoDB read/write, Router Lambda invoke
  - Router Lambda: SQS send message only
- **API Gateway**: Request validation prevents malformed payloads
- **X-Ray Tracing**: Enabled for all Lambda functions and API Gateway

## Monitoring

### CloudWatch Metrics
- Lambda invocations, errors, duration
- API Gateway requests, 4XX/5XX errors, latency
- SQS queue depth, message age
- DynamoDB read/write capacity

### CloudWatch Alarms (Recommended)
- DLQ message count > 0
- Lambda error rate > 1%
- API Gateway 5XX error rate > 1%
- SQS message age > 10 minutes

## Cost Optimization

- **Lambda**: arm64 architecture for 20% cost savings
- **DynamoDB**: On-demand billing, only pay for what you use
- **SQS**: Standard queues, low per-request cost
- **DynamoDB TTL**: Automatic cleanup prevents storage cost accumulation

## Testing

Run unit tests:
```bash
python -m pytest tests/unit/ -v
```

Run integration tests:
```bash
python -m pytest tests/integration/ -v
```

## Troubleshooting

### Events not reaching SQS queues
- Check CloudWatch logs for validator and router Lambdas
- Verify IAM permissions for Lambda invoke and SQS send
- Check X-Ray traces for request flow

### Duplicate event errors
- DynamoDB stores events with 30-day TTL
- Check if event_id was used within last 30 days
- Review DynamoDB table items

### API Gateway errors
- Verify request payload matches JSON schema
- Check API Gateway execution logs in CloudWatch
- Review throttling metrics

## Files

- `tap.py`: Pulumi entry point
- `lib/tap_stack.py`: Infrastructure definition
- `lib/PROMPT.md`: Original task requirements
- `lib/MODEL_RESPONSE.md`: Initial generated code
- `lib/IDEAL_RESPONSE.md`: Production-ready corrected code
- `lib/MODEL_FAILURES.md`: Documentation of corrections
- `tests/unit/test_tap_stack.py`: Comprehensive unit tests

## License

This infrastructure code is generated for testing purposes.
