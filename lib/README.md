```markdown
# Payment Processing Observability Stack

A comprehensive CDKTF Python implementation for monitoring payment processing infrastructure with CloudWatch, X-Ray, and Synthetics.

## Architecture

This stack deploys:

- **CloudWatch Logs**: Encrypted log groups for API Gateway, Lambda, and RDS with 90-day retention
- **KMS Encryption**: Customer-managed keys for log encryption with 7-day deletion window
- **X-Ray Tracing**: Distributed tracing with custom segments for payment flows
- **CloudWatch Synthetics**: Health check canary running every 5 minutes
- **CloudWatch Dashboard**: Real-time metrics with position-based widgets
- **Metric Filters**: Extract latency percentiles (p50, p95, p99) from logs
- **Composite Alarms**: Combined alerting for API and Lambda errors
- **SNS Notifications**: Multi-subscriber email alerts
- **Custom Metrics**: Lambda functions emitting business metrics via boto3

## Prerequisites

- Python 3.9 or higher
- CDKTF 0.20 or higher
- AWS CLI configured with appropriate credentials
- Node.js 18+ (for CDKTF)
- Terraform 1.5 or higher

## Installation

```bash
# Install Python dependencies
pip install cdktf-cdktf-provider-aws constructs

# Install CDKTF CLI
npm install -g cdktf-cli@latest

## Project Structure

worktree/synth-c4l8k0/
├── lib/
│   ├── tap_stack.py          # Main CDKTF stack
│   ├── lambda/
│   │   └── payment_metrics.py # Lambda function code
│   ├── PROMPT.md              # Requirements document
│   ├── MODEL_RESPONSE.md      # Initial implementation
│   ├── IDEAL_RESPONSE.md      # Corrected implementation
│   └── README.md              # This file
├── bin/
│   └── tap.py                 # CDKTF app entry point
├── cdktf.json                 # CDKTF configuration
└── metadata.json              # Task metadata

## Deployment

```bash
# Synthesize the CDKTF stack
cdktf synth

# View the Terraform plan
cdktf plan

# Deploy to AWS
cdktf deploy

# Destroy resources
cdktf destroy

## Configuration

The stack accepts the following parameters in `bin/tap.py`:

- `environment_suffix`: Unique suffix for resource names (default: 'dev')
- `aws_region`: AWS region for deployment (default: 'us-east-1')
- `default_tags`: Tags applied to all resources

Example:

```python
TapStack(
    app,
    "tap-stack",
    environment_suffix="prod",
    aws_region="us-east-1",
    default_tags={
        'Environment': 'production',
        'CostCenter': 'payments'
    }
)

## Features

### Log Management

All log groups are encrypted with KMS and have 90-day retention:

- `/aws/apigateway/payments-{suffix}`
- `/aws/lambda/payment-processor-{suffix}`
- `/aws/rds/payments-db-{suffix}`

### Metric Filters

Extract latency percentiles from API Gateway logs:

- **APILatencyP50**: Median latency
- **APILatencyP95**: 95th percentile latency
- **APILatencyP99**: 99th percentile latency

### Alarms

**Composite Alarm** triggers when:
- API error rate > 5% OR
- Lambda error rate > 10%

Notifications sent to two email addresses via SNS.

### Custom Metrics

Lambda function emits:
- **PaymentAmount**: Total payment amount (by payment type and region)
- **PaymentProcessingTime**: Average processing time (by payment type)
- **PaymentSuccess**: Success count (by payment type)

### X-Ray Tracing

Custom segments track:
- `payment_validation`: Input validation stage
- `payment_processing`: Core payment logic
- `database_write`: Database persistence

## Key Improvements in IDEAL_RESPONSE

1. **DataAwsCallerIdentity**: Properly fetch AWS account ID
2. **KMS Key Policy**: Added condition for CloudWatch Logs encryption context
3. **Lambda Dimensions**: Added FunctionName dimension to Lambda alarm
4. **X-Ray SDK**: Added error handling for missing X-Ray SDK
5. **Canary Name**: Truncated to 21 characters maximum
6. **Canary Runtime**: Updated to syn-nodejs-puppeteer-7.0
7. **Dashboard Layout**: Added x, y, width, height for proper widget positioning
8. **Bucket Naming**: Added account ID to ensure unique S3 bucket name
9. **IAM Permissions**: Added CloudWatchSyntheticsFullAccess for canary
10. **TerraformOutput**: Added outputs for key resource identifiers
11. **Error Handling**: Improved Lambda error handling and metric emission
12. **Python Runtime**: Updated to Python 3.11 for better support

## Testing

### Invoke Lambda Function

```bash
aws lambda invoke \
  --function-name payment-processor-dev \
  --payload '{"amount": 100, "type": "credit_card", "payment_id": "test-123"}' \
  response.json

### View CloudWatch Logs

```bash
aws logs tail /aws/lambda/payment-processor-dev --follow

### Check Canary Status

```bash
aws synthetics get-canary --name health-check-dev

## Compliance

- All logs encrypted with customer-managed KMS keys
- 90-day retention on all log groups
- All resources tagged with Environment and CostCenter
- X-Ray tracing enabled on all Lambda functions
- All resources fully destroyable (7-day KMS deletion window)

## Monitoring

### CloudWatch Dashboard

Access the dashboard:
AWS Console > CloudWatch > Dashboards > payment-processing-{environment_suffix}

### X-Ray Service Map

View distributed traces:
AWS Console > X-Ray > Service Map

### SNS Subscriptions

Confirm email subscriptions:
AWS Console > SNS > Topics > payment-alarms-{suffix} > Subscriptions

## Troubleshooting

### Canary Failures

1. Check canary logs:
   ```bash
   aws logs tail /aws/lambda/cwsyn-health-check-{suffix} --follow
   ```

2. Verify S3 artifacts:
   ```bash
   aws s3 ls s3://canary-artifacts-{suffix}-{account-id}/canary-results/
   ```

### Alarm Not Triggering

1. Verify SNS subscriptions are confirmed
2. Check alarm configuration:
   ```bash
   aws cloudwatch describe-alarms --alarm-names api-high-errors-{suffix}
   ```

### X-Ray Traces Missing

1. Ensure Lambda tracing is enabled:
   ```bash
   aws lambda get-function-configuration \
     --function-name payment-processor-{suffix} \
     | jq '.TracingConfig'
   ```

2. Check X-Ray IAM permissions in Lambda role

### KMS Encryption Issues

1. Verify KMS key policy allows CloudWatch Logs
2. Check log group KMS key association:
   ```bash
   aws logs describe-log-groups \
     --log-group-name-prefix /aws/apigateway/payments-
   ```

## Cost Optimization

- Synthetics canary: ~$0.0012 per run (5-minute interval = ~8,640 runs/month)
- CloudWatch Logs: First 5 GB ingestion free, then $0.50/GB
- X-Ray traces: First 100,000 traces/month free, then $5.00/1M traces
- KMS: $1/month per key + $0.03/10,000 requests

## Security

- All log data encrypted at rest with KMS
- IAM roles follow least-privilege principle
- KMS key rotation enabled
- No hardcoded credentials
- SNS topics encrypted (optional enhancement)

## Resources Created

- 3 CloudWatch Log Groups
- 1 KMS Key + Alias
- 3 Metric Filters
- 3 CloudWatch Alarms (including 1 composite)
- 1 SNS Topic + 2 Subscriptions
- 1 Lambda Function
- 3 IAM Roles + 6 Policy Attachments
- 2 IAM Policies
- 1 CloudWatch Synthetics Canary
- 1 S3 Bucket
- 1 CloudWatch Dashboard

Total: ~20 AWS resources
