# Serverless Transaction Processing Pipeline

This project implements a production-ready serverless transaction processing pipeline using AWS services orchestrated with CDKTF Python.

## Architecture

The pipeline processes financial transactions through three stages:

1. **Validation**: Validates transaction data format, amount limits, and required fields
2. **Fraud Detection**: Analyzes transactions for fraud indicators and assigns risk scores
3. **Compliance Checking**: Ensures regulatory compliance (AML, KYC, GDPR, PCI DSS)

## Infrastructure Components

### Compute & Orchestration
- **AWS Lambda**: Three container-based functions (validation, fraud detection, compliance)
  - 3GB memory allocation
  - 60-second timeout
  - 100 reserved concurrent executions per function
- **AWS Step Functions**: Express workflow orchestrating the Lambda functions
  - Exponential backoff retry (3 attempts, starting at 2 seconds)
  - Error handling with dead letter queue

### Data & Messaging
- **DynamoDB**: Transaction state storage with on-demand billing and PITR
- **SNS**: Fraud and compliance alerts with server-side encryption
- **SQS**: Dead letter queue for failed transactions (14-day retention)

### Networking & Security
- **VPC**: Private subnets across 3 availability zones
- **Security Groups**: HTTPS-only egress for Lambda functions
- **VPC Endpoints**: Gateway endpoints for DynamoDB and S3, interface endpoint for Step Functions
- **IAM**: Least-privilege roles and policies for all services

### Monitoring
- **CloudWatch Logs**: 30-day retention for all Lambda functions and Step Functions

## Prerequisites

- Python 3.11 or later
- Pipenv
- Node.js 18+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Docker (for building Lambda container images)
- Terraform 1.5+ (installed via CDKTF)

## Installation

1. Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

2. Install Python dependencies:
```bash
pipenv install
pipenv install cdktf cdktf-cdktf-provider-aws constructs
```

## Deployment

### Step 1: Build and Push Lambda Container Images

Build and push the Lambda container images to ECR:

```bash
# Set your AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
ENV_SUFFIX=dev

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repositories (will be created by CDKTF, but you can create manually first)
aws ecr create-repository --repository-name transaction-validation-$ENV_SUFFIX --region $AWS_REGION || true
aws ecr create-repository --repository-name fraud-detection-$ENV_SUFFIX --region $AWS_REGION || true
aws ecr create-repository --repository-name compliance-checking-$ENV_SUFFIX --region $AWS_REGION || true

# Build and push validation Lambda
cd lib/lambda/validation
docker build -t transaction-validation:latest .
docker tag transaction-validation:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/transaction-validation-$ENV_SUFFIX:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/transaction-validation-$ENV_SUFFIX:latest
cd ../../..

# Build and push fraud detection Lambda
cd lib/lambda/fraud
docker build -t fraud-detection:latest .
docker tag fraud-detection:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/fraud-detection-$ENV_SUFFIX:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/fraud-detection-$ENV_SUFFIX:latest
cd ../../..

# Build and push compliance checking Lambda
cd lib/lambda/compliance
docker build -t compliance-checking:latest .
docker tag compliance-checking:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/compliance-checking-$ENV_SUFFIX:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/compliance-checking-$ENV_SUFFIX:latest
cd ../../..
```

### Step 2: Deploy Infrastructure

Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
export TERRAFORM_STATE_BUCKET=iac-rlhf-tf-states
export TERRAFORM_STATE_BUCKET_REGION=us-east-1
```

Deploy the stack:
```bash
# Generate Terraform configuration
pipenv run cdktf synth

# Deploy infrastructure
pipenv run cdktf deploy

# Or use Terraform directly
cd cdktf.out/stacks/TapStackdev
terraform init
terraform plan
terraform apply
```

### Step 3: Update SNS Subscription

The SNS topic subscription requires email confirmation:
```bash
# Check your email for the confirmation link from AWS
# Click the confirmation link to activate alerts
```

## Testing

### Run Unit Tests
```bash
pipenv install pytest pytest-cov
pipenv run pytest tests/unit/ -v --cov=lib --cov-report=term-missing
```

### Run Integration Tests
```bash
pipenv run pytest tests/integration/ -v
```

### Test the Pipeline

Create a test transaction:
```bash
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT_ID:stateMachine:transaction-pipeline-dev \
  --input '{
    "transaction_id": "txn-123456789",
    "amount": 1500.00,
    "currency": "USD",
    "merchant_id": "merchant-001",
    "customer_id": "customer-001",
    "merchant_country": "US",
    "customer_country": "US"
  }'
```

## Monitoring

### CloudWatch Logs
View Lambda function logs:
```bash
aws logs tail /aws/lambda/transaction-validation-dev --follow
aws logs tail /aws/lambda/fraud-detection-dev --follow
aws logs tail /aws/lambda/compliance-checking-dev --follow
```

### Step Functions Execution
View state machine executions:
```bash
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT_ID:stateMachine:transaction-pipeline-dev
```

### DynamoDB Table
Query transaction states:
```bash
aws dynamodb query \
  --table-name transaction-state-dev \
  --key-condition-expression "transaction_id = :txn_id" \
  --expression-attribute-values '{":txn_id":{"S":"txn-123456789"}}'
```

### Dead Letter Queue
Check for failed transactions:
```bash
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/transaction-dlq-dev \
  --max-number-of-messages 10
```

## Performance

The infrastructure is designed to handle:
- **10,000+ transactions per minute** during peak hours
- **Express workflows** reduce Step Functions costs by ~75%
- **Reserved concurrency** prevents throttling during traffic spikes
- **VPC endpoints** reduce data transfer costs and improve latency

## Security

- All Lambda functions deployed in private subnets
- HTTPS-only egress through security groups
- SNS topic encrypted with AWS managed keys
- DynamoDB point-in-time recovery enabled
- IAM roles follow least-privilege principle
- VPC endpoints eliminate internet gateway traversal

## Cleanup

To destroy all resources:
```bash
pipenv run cdktf destroy

# Or use Terraform directly
cd cdktf.out/stacks/TapStackdev
terraform destroy
```

## Troubleshooting

### Lambda Container Image Issues
If Lambda functions fail with image errors, ensure:
1. ECR repositories exist
2. Container images are pushed to ECR
3. Lambda execution role has ECR pull permissions

### VPC Connectivity Issues
If Lambda functions can't reach AWS services:
1. Verify VPC endpoints are created
2. Check security group egress rules
3. Verify route table associations

### Step Functions Errors
View detailed error logs in CloudWatch:
```bash
aws logs tail /aws/vendedlogs/states/transaction-pipeline-dev --follow
```

## Cost Optimization

This implementation uses several cost-optimization strategies:
- **Express workflows** instead of Standard workflows (75% cheaper)
- **On-demand DynamoDB** (no provisioned capacity costs)
- **VPC Gateway endpoints** (no data transfer charges for DynamoDB/S3)
- **30-day log retention** (reduces CloudWatch storage costs)
- **Container images** (faster cold starts, shared layers)

## Support

For issues or questions:
1. Check CloudWatch logs for error messages
2. Review dead letter queue for failed transactions
3. Verify all prerequisites are installed
4. Ensure AWS credentials have necessary permissions
