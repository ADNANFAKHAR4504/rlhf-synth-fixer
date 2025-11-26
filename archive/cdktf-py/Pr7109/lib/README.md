# Serverless Webhook Processing System

A complete serverless infrastructure for processing real-time transaction notifications from payment providers using AWS services and CDKTF Python.

## Architecture

This system implements a serverless event-driven architecture for webhook processing:

### Components

1. **API Gateway REST API** - Receives webhook POST requests at `/webhook` endpoint
2. **Lambda Functions** (Container-based, ARM64 Graviton2):
   - **Webhook Validator** (1024MB) - Validates and stores incoming webhooks
   - **Fraud Detector** (512MB) - Mock ML-based fraud detection
   - **Transaction Archival** (512MB) - Archives transactions to S3 after 24 hours
3. **DynamoDB Table** - `transactions` table with point-in-time recovery (35-day retention)
4. **Step Functions EXPRESS** - Parallel workflow for fraud detection and notifications
5. **EventBridge** - Custom event bus `payment-events` with amount-based routing rules
6. **SNS Topic** - `transaction-alerts` for email and SMS notifications
7. **S3 Bucket** - Transaction audit logs with lifecycle policies
8. **CloudWatch Dashboard** - Real-time metrics and performance monitoring

### Event Flow

1. Payment provider sends webhook to API Gateway `/webhook` endpoint
2. Webhook Validator Lambda validates payload and stores in DynamoDB
3. Event published to EventBridge custom event bus
4. EventBridge routes based on transaction amount:
   - High value (>$10,000) → Step Functions workflow
   - Medium value ($1,000-$10,000) → SNS notification
   - Low value (<$1,000) → Logged for batch processing
5. Step Functions runs parallel branches:
   - Fraud Detection Lambda analyzes transaction
   - SNS notification sent to subscribers
6. Transaction Archival Lambda runs daily to archive old transactions to S3

## Prerequisites

- Python 3.9 or higher
- CDKTF 0.19 or higher
- AWS CLI configured with appropriate credentials
- Docker (for building Lambda container images)
- Terraform installed

## Environment Variables

The following environment variables are used for deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
export REPOSITORY="your-repo-name"
export COMMIT_AUTHOR="author-name"
export PR_NUMBER="123"
export TEAM="your-team"
```

## Deployment Instructions

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install CDKTF providers
cdktf get
```

### 2. Build Lambda Container Images

Before deploying, you need to build and push Docker images for each Lambda function:

```bash
# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and push webhook validator
cd lib/lambda/webhook_validator
docker build --platform linux/arm64 -t webhook-validator:latest .
docker tag webhook-validator:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/webhook-validator-${ENVIRONMENT_SUFFIX}:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/webhook-validator-${ENVIRONMENT_SUFFIX}:latest

# Build and push fraud detector
cd ../fraud_detector
docker build --platform linux/arm64 -t fraud-detector:latest .
docker tag fraud-detector:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/fraud-detector-${ENVIRONMENT_SUFFIX}:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/fraud-detector-${ENVIRONMENT_SUFFIX}:latest

# Build and push transaction archival
cd ../transaction_archival
docker build --platform linux/arm64 -t transaction-archival:latest .
docker tag transaction-archival:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/transaction-archival-${ENVIRONMENT_SUFFIX}:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/transaction-archival-${ENVIRONMENT_SUFFIX}:latest

cd ../../..
```

### 3. Deploy Infrastructure

```bash
# Synthesize CDKTF configuration
cdktf synth

# Deploy the stack
cdktf deploy

# Or deploy with auto-approve
cdktf deploy --auto-approve
```

### 4. Configure SNS Subscriptions

After deployment, confirm SNS email and SMS subscriptions:

```bash
# Email subscription will receive confirmation email
# SMS subscription will receive confirmation text

# Update SNS subscription endpoints in tap_stack.py:
# - Replace alerts@example.com with your email
# - Replace +1234567890 with your phone number
```

## Testing

### Test Webhook Endpoint

```bash
# Get API Gateway URL from outputs
API_URL=$(aws cloudformation describe-stacks --stack-name TapStack${ENVIRONMENT_SUFFIX} --query "Stacks[0].Outputs[?OutputKey=='WebhookApiUrl'].OutputValue" --output text)

# Send test webhook
curl -X POST ${API_URL}/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_123456",
    "amount": 15000,
    "currency": "USD",
    "provider": "stripe",
    "customer_id": "cust_789",
    "metadata": {
      "order_id": "order_123"
    }
  }'
```

### Monitor Execution

```bash
# View Lambda logs
aws logs tail /aws/lambda/webhook-validator-${ENVIRONMENT_SUFFIX} --follow

# View Step Functions executions
aws stepfunctions list-executions --state-machine-arn arn:aws:states:${AWS_REGION}:${ACCOUNT_ID}:stateMachine:transaction-workflow-${ENVIRONMENT_SUFFIX}

# View CloudWatch Dashboard
aws cloudwatch get-dashboard --dashboard-name transaction-metrics-${ENVIRONMENT_SUFFIX}
```

## Key Features

### ARM-Based Graviton2 Processors
All Lambda functions use `arm64` architecture for cost optimization and performance.

### X-Ray Tracing
All Lambda functions and Step Functions have X-Ray tracing enabled with custom segments for detailed observability.

### Point-in-Time Recovery
DynamoDB table has point-in-time recovery enabled with 35-day retention for compliance.

### Dead Letter Queues
EventBridge rules include DLQs to capture failed invocations for debugging.

### Lifecycle Policies
S3 bucket has automated lifecycle policies:
- Transition to IA after 30 days
- Transition to Glacier after 90 days
- Expire after 365 days

### CloudWatch Monitoring
Comprehensive dashboard tracking:
- Lambda invocations, duration, and errors
- DynamoDB capacity units
- Step Functions execution status
- API Gateway requests and errors
- EventBridge invocations
- SNS message delivery

## Cost Optimization

- **ARM64 Graviton2**: ~20% cost savings vs x86
- **On-Demand DynamoDB**: Pay only for what you use
- **EXPRESS Step Functions**: Lower cost for high-throughput workflows
- **S3 Lifecycle Policies**: Automatic cost reduction for aging data

## Compliance & Security

- Encryption at rest for S3 and DynamoDB
- X-Ray tracing for audit trails
- CloudWatch Logs with 30-day retention
- Point-in-time recovery for data protection
- IAM least privilege access

## Cleanup

To destroy all resources:

```bash
# Destroy the stack
cdktf destroy

# Or with auto-approve
cdktf destroy --auto-approve
```

Note: All resources are configured to be fully destroyable for CI/CD workflows.

## Troubleshooting

### Container Image Issues
If Lambda functions fail to deploy with container image errors:
1. Verify ECR repositories exist: `aws ecr describe-repositories`
2. Ensure images are pushed with `:latest` tag
3. Check Docker is building for `linux/arm64` platform

### EventBridge Not Routing
If events aren't being routed:
1. Verify event bus exists and rules are enabled
2. Check event pattern matches your payload structure
3. Review CloudWatch Logs for rule evaluation

### Step Functions Failures
If workflows fail:
1. Check Step Functions execution history in console
2. Verify Lambda function permissions
3. Review CloudWatch Logs for individual Lambda errors

## Additional Resources

- [CDKTF Python Documentation](https://developer.hashicorp.com/terraform/cdktf/concepts/cdktf-architecture)
- [AWS Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [AWS Step Functions Express Workflows](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-express-vs-standard.html)
- [EventBridge Event Patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
