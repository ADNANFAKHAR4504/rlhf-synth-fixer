# Payment Webhook Processing System

A serverless payment webhook processing pipeline built with AWS CDK and Python for handling webhooks from multiple payment providers (Stripe, PayPal, Square).

## Architecture

The system consists of:

- **API Gateway REST API**: Entry point for webhooks with /webhook/{provider} endpoint
- **Lambda Functions**: Three functions for receiving, processing, and auditing webhooks
- **DynamoDB**: Table for storing webhook data with streams enabled
- **SQS**: Dead letter queues for failed processing
- **SNS**: Alert topic for critical events
- **KMS**: Customer-managed encryption key
- **WAF**: Rate-based rules to protect API (10 req/sec per IP)
- **X-Ray**: Distributed tracing across all services

## Requirements

- Python 3.11+
- AWS CDK 2.120.0+
- AWS CLI configured
- Node.js 18+ (for CDK)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Lambda layer dependencies:
```bash
cd lib/lambda/layers/shared/python
pip install -r requirements.txt -t .
cd ../../../../..
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/ap-southeast-1
```

## Deployment

Deploy with environment suffix:

```bash
export ENVIRONMENT_SUFFIX=dev
cdk deploy
```

Or pass via context:

```bash
cdk deploy -c environment_suffix=prod
```

## Testing

Test the webhook endpoint:

```bash
curl -X POST https://YOUR-API-ID.execute-api.ap-southeast-1.amazonaws.com/prod/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.succeeded", "amount": 1000}'
```

## Configuration

All resources include the `environment_suffix` parameter for multi-environment deployments:

- Lambda functions: Reserved concurrent executions configured
- DynamoDB: On-demand billing mode
- API Gateway: 1000 req/sec throttling
- WAF: 10 req/sec per IP rate limiting
- X-Ray: Enabled on all services
- KMS: Customer-managed key for all encryption

## Monitoring

- CloudWatch Logs: Lambda function logs
- CloudWatch Metrics: API Gateway, DynamoDB, Lambda metrics
- X-Ray: Distributed tracing
- CloudWatch Alarms: DLQ message alerts

## Security

- All Lambda environment variables encrypted with customer-managed KMS key
- DynamoDB encrypted at rest with customer-managed KMS key
- SQS queues encrypted with KMS
- SNS topic encrypted with KMS
- IAM roles with least privilege
- WAF rate limiting to prevent abuse

## Clean Up

```bash
cdk destroy
```

## Architecture Diagram

```
Internet
   |
   v
API Gateway (+ WAF) --> Lambda (Webhook Receiver) --> DynamoDB
   |                                                      |
   |                                                      v
   |                                           DynamoDB Streams
   |                                                      |
   |                                                      v
   +------------------------------------> Lambda (Audit Logger) --> SNS Alerts

Failed Webhooks --> SQS DLQ --> CloudWatch Alarm --> SNS Alerts
```

## Lambda Functions

1. **webhook_receiver**: Receives webhooks and stores in DynamoDB (30s timeout, 100 concurrent)
2. **payment_processor**: Processes webhooks asynchronously (5min timeout, 50 concurrent)
3. **audit_logger**: Logs all DynamoDB changes for compliance (triggered by streams)

## Compliance

- PCI DSS: Encryption at rest and in transit
- Audit logging: All changes tracked via DynamoDB streams
- Retention: 14-day DLQ retention for investigation
