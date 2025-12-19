# Serverless Webhook Processing System with Monitoring

A production-ready serverless webhook processing system built with Terraform HCL, featuring comprehensive monitoring, observability, and distributed tracing.

## Quick Start

```bash
# Initialize Terraform
cd lib
terraform init

# Plan with custom environment
terraform plan -var="environment_suffix=demo"

# Deploy infrastructure
terraform apply -var="environment_suffix=demo" -var="alarm_email=your-email@example.com"

# Get API endpoint
terraform output api_gateway_url

# Test webhook
curl -X POST $(terraform output -raw api_gateway_url) \
  -H "Content-Type: application/json" \
  -d '{"webhookId": "test-001", "payload": {"data": "hello"}}'
```

## Architecture

```
Internet → API Gateway → Validation Queue → Validator Lambda → Processing Queue → Processor Lambda → Notification Queue → Notifier Lambda
                ↓                ↓                    ↓                    ↓                    ↓                    ↓
            X-Ray           DLQ Alarms          Error Alarms         Error Alarms         Error Alarms        CloudWatch
                                                                                                                  Logs
```

## Features

### Base Infrastructure
- API Gateway REST API with SQS integration
- 3 Lambda functions (validator, processor, notifier)
- 6 SQS queues (3 main + 3 DLQ)
- IAM roles with least-privilege permissions
- CloudWatch log groups

### Monitoring and Observability (Iteration 1)
- 18 CloudWatch alarms covering all critical metrics
- SNS topic for centralized alarm notifications
- AWS X-Ray distributed tracing
- Configurable alarm thresholds

## CloudWatch Alarms (18 Total)

### Lambda Alarms (12)
- **Error Rate**: Triggers when errors > 5% of invocations (per function: 3 alarms)
- **Throttles**: Triggers on any throttling (per function: 3 alarms)
- **Duration**: Triggers when execution > 80% of timeout (per function: 3 alarms)
- **Concurrency**: Triggers when concurrent executions > 90 (per function: 3 alarms)

### SQS Queue Alarms (6)
- **Message Age**: Triggers when oldest message > 300 seconds (per queue: 3 alarms)
- **Queue Depth**: Triggers when message count > 100 (per queue: 3 alarms)

### DLQ Alarms (3)
- **DLQ Messages**: Triggers immediately when any message enters DLQ (per DLQ: 3 alarms)

### API Gateway Alarms (3)
- **4xx Error Rate**: Triggers when > 10% of requests return 4xx
- **5xx Error Rate**: Triggers when > 1% of requests return 5xx
- **High Latency**: Triggers when p99 latency > 1000ms

## Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `environment_suffix` | "dev" | Unique suffix for resource names |
| `region` | "ap-southeast-1" | AWS deployment region |
| `lambda_memory` | 512 | Lambda memory in MB |
| `lambda_timeout` | 30 | Lambda timeout in seconds |
| `lambda_reserved_concurrency` | 100 | Reserved concurrent executions |
| `alarm_email` | "" | Email for SNS alarm notifications |
| `enable_alarms` | true | Enable/disable CloudWatch alarms |
| `enable_xray` | true | Enable/disable X-Ray tracing |

## File Structure

```
lib/
├── provider.tf           # Terraform configuration
├── variables.tf          # Input variables
├── outputs.tf            # Output values
├── api_gateway.tf        # API Gateway with X-Ray
├── sqs.tf                # 6 SQS queues
├── lambda.tf             # 3 Lambda functions with X-Ray
├── iam.tf                # IAM roles and policies
├── monitoring.tf         # 18 CloudWatch alarms + SNS
├── lambda/
│   ├── validator.py      # Webhook validation
│   ├── processor.py      # Webhook processing
│   └── notifier.py       # Notification logic
├── PROMPT.md             # Base requirements
├── PROMPT2.md            # Iteration 1 requirements
├── MODEL_FAILURES.md     # Training analysis
└── IDEAL_RESPONSE.md     # Complete documentation

test/
├── terraform.unit.test.ts    # Unit tests
└── terraform.int.test.ts     # Integration tests
```

## Testing

```bash
# Run unit tests (no AWS required)
npm test test/terraform.unit.test.ts

# Run integration tests (requires deployed infrastructure)
npm test test/terraform.int.test.ts
```

## Deployment Examples

### Basic Deployment
```bash
terraform apply -var="environment_suffix=dev"
```

### With Email Notifications
```bash
terraform apply \
  -var="environment_suffix=prod" \
  -var="alarm_email=ops-team@example.com"
```

### Without Alarms (Testing)
```bash
terraform apply \
  -var="environment_suffix=test" \
  -var="enable_alarms=false"
```

### Without X-Ray (Cost Optimization)
```bash
terraform apply \
  -var="environment_suffix=dev" \
  -var="enable_xray=false"
```

## Outputs

After deployment, Terraform provides:

```
api_gateway_url         = "https://xxxxxxx.execute-api.ap-southeast-1.amazonaws.com/production/webhook"
validator_lambda_arn    = "arn:aws:lambda:ap-southeast-1:xxxx:function:webhook-validator-dev"
processor_lambda_arn    = "arn:aws:lambda:ap-southeast-1:xxxx:function:webhook-processor-dev"
notifier_lambda_arn     = "arn:aws:lambda:ap-southeast-1:xxxx:function:webhook-notifier-dev"
validation_queue_url    = "https://sqs.ap-southeast-1.amazonaws.com/xxxx/webhook-validation-queue-dev"
processing_queue_url    = "https://sqs.ap-southeast-1.amazonaws.com/xxxx/webhook-processing-queue-dev"
notification_queue_url  = "https://sqs.ap-southeast-1.amazonaws.com/xxxx/webhook-notification-queue-dev"
alarm_topic_arn         = "arn:aws:sns:ap-southeast-1:xxxx:webhook-alarms-dev"
```

## Monitoring Access

### CloudWatch Alarms
```bash
# List all alarms
aws cloudwatch describe-alarms --alarm-name-prefix webhook

# View alarm history
aws cloudwatch describe-alarm-history \
  --alarm-name lambda-validator-errors-dev
```

### X-Ray Traces
```bash
# View service map
aws xray get-service-graph \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)

# Get trace summaries
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

### Lambda Logs
```bash
# Tail validator logs
aws logs tail /aws/lambda/webhook-validator-dev --follow

# Tail processor logs
aws logs tail /aws/lambda/webhook-processor-dev --follow

# Tail notifier logs
aws logs tail /aws/lambda/webhook-notifier-dev --follow
```

## Troubleshooting

### Alarm is firing
1. Check CloudWatch Metrics for the specific resource
2. View X-Ray traces for recent requests
3. Check CloudWatch Logs for error details
4. Verify DLQ for failed messages

### No webhooks being processed
1. Verify API Gateway endpoint is accessible
2. Check SQS queue depth metrics
3. Review Lambda function errors and throttles
4. Inspect X-Ray service map for bottlenecks

### High latency
1. Check Lambda duration metrics
2. Review X-Ray traces for slow components
3. Verify SQS queue visibility timeouts
4. Check Lambda memory configuration

## Resource Costs

Estimated monthly costs (us-east-1, assuming 1M webhooks/month):

- API Gateway: $3.50 (1M requests)
- Lambda: $5.00 (3M invocations, 512MB, 5s avg)
- SQS: $0.50 (6M requests)
- CloudWatch: $2.00 (logs, metrics, alarms)
- X-Ray: $5.00 (1M traces)
- SNS: $0.50 (notifications)

**Total: ~$17/month** for 1M webhooks

## Clean Up

```bash
# Destroy all resources
terraform destroy -var="environment_suffix=dev"

# Or with specific vars
terraform destroy \
  -var="environment_suffix=prod" \
  -var="alarm_email=ops@example.com"
```

## License

This is training infrastructure for demonstrating Terraform best practices with monitoring and observability.

## Support

For issues or questions, refer to:
- `lib/IDEAL_RESPONSE.md` - Complete architecture documentation
- `lib/MODEL_FAILURES.md` - Training analysis and iteration notes
- `lib/PROMPT.md` - Base requirements
- `lib/PROMPT2.md` - Monitoring iteration requirements
