# Serverless Webhook Processor for Payment Notifications

A complete serverless infrastructure solution for processing payment webhooks using Pulumi and Python.

## Architecture

This solution implements a fully serverless event processing system with:

- **AWS Lambda** (ARM64) - Webhook processing with 1GB memory, 60s timeout, 100 reserved concurrent executions
- **Amazon DynamoDB** - Transaction storage with point-in-time recovery and on-demand billing
- **Amazon SNS** - Event distribution to downstream services
- **Amazon SQS** - Dead letter queue for failed events with 5 retry attempts
- **AWS KMS** - Customer-managed encryption key for data at rest
- **CloudWatch Logs** - 30-day log retention
- **AWS X-Ray** - Distributed tracing for debugging
- **Systems Manager Parameter Store** - Secrets management for API keys

## Features

- **Security**: Customer-managed KMS encryption, IAM least-privilege policies
- **Reliability**: Dead letter queue, point-in-time recovery, 5 retry attempts
- **Cost Optimization**: ARM64 architecture, on-demand billing, serverless design
- **Monitoring**: CloudWatch logs, X-Ray tracing
- **Compliance**: PCI DSS compliant design with encryption and access controls

## Prerequisites

- Python 3.9 or later
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create resources

## Deployment

### Install Dependencies

```bash
pip install pulumi pulumi-aws
```

### Configure Environment

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
```

### Deploy Stack

```bash
pulumi stack init dev
pulumi up
```

### View Outputs

```bash
pulumi stack output
```

## Resource Naming

All resources follow the naming convention: `resource-type-{environment_suffix}`

Examples:
- `webhook-processor-dev` - Lambda function
- `payment-transactions-dev` - DynamoDB table
- `payment-events-dev` - SNS topic
- `webhook-dlq-dev` - SQS dead letter queue

## Testing

### Unit Tests

```bash
pytest tests/
```

### Integration Tests

```bash
pytest tests/integration/
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable with no retention policies.

## Security Considerations

- All data encrypted at rest using customer-managed KMS key
- IAM roles follow least-privilege principle
- Lambda has no internet access (uses VPC endpoints if needed)
- Secrets stored in Systems Manager Parameter Store
- X-Ray tracing enabled for security monitoring

## Cost Optimization

- ARM64 Lambda architecture (20% cost reduction)
- DynamoDB on-demand billing (pay per request)
- 30-day log retention (vs indefinite)
- Reserved concurrency prevents runaway costs
- Serverless design (no idle resources)

## Monitoring

### CloudWatch Logs

Logs available at: `/aws/lambda/webhook-processor-{environment_suffix}`

### X-Ray Traces

View traces in AWS X-Ray console for debugging and performance analysis.

### Metrics

- Lambda invocations
- Lambda errors
- Lambda duration
- DynamoDB consumed capacity
- SQS message count (DLQ)

## Support

For issues or questions, contact the platform team.
