```markdown
# Multi-Account Payment Processing Infrastructure

CloudFormation StackSet solution for deploying payment processing infrastructure consistently across multiple AWS accounts (dev, staging, production).

## Architecture

### Components

1. **Network Stack** - VPC with 3 AZs, public/private subnets, security groups
2. **Storage Stack** - DynamoDB table with GSIs for payment transactions
3. **Compute Stack** - Lambda functions, ALB, Step Functions state machine
4. **Monitoring Stack** - CloudWatch alarms and SNS topics

### Key Features

- Multi-account deployment via CloudFormation StackSets
- Identical infrastructure across all environments
- Environment-specific parameters (account IDs, domain names, emails)
- Production-only features via CloudFormation Conditions
- Drift detection support
- Modular nested stack architecture

## Infrastructure Details

### Lambda Functions

- **Validation Function**: Validates payment requests (Node.js 18.x, 512 MB, 30s timeout)
- **Processing Function**: Processes payments and stores in DynamoDB (Node.js 18.x, 512 MB, 60s timeout)
- Reserved concurrency (100) enabled only in production

### DynamoDB Table

- **Table Name**: payment-transactions-{environment}
- **Partition Key**: transactionId (String)
- **Sort Key**: timestamp (Number)
- **GSI 1**: customer-index (customerId + timestamp)
- **GSI 2**: status-index (paymentStatus + timestamp)
- **Billing**: On-demand (PAY_PER_REQUEST)

### Application Load Balancer

- Internet-facing ALB in public subnets
- Target groups for Lambda functions
- Health checks configured
- HTTP listener on port 80

### Step Functions

- Orchestrates payment workflow: Validate → Process → Succeed/Fail
- Retry logic with exponential backoff
- Error handling for validation and processing failures

### CloudWatch Alarms

- Lambda error alarms (threshold: 5 errors in 5 minutes)
- DynamoDB throttle alarms
- State machine failure alarms
- Lambda duration alarms

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick start:

```bash
# 1. Upload nested templates to S3
aws s3 sync lib/nested/ s3://your-bucket/nested/

# 2. Create StackSet
aws cloudformation create-stack-set \
  --stack-set-name payment-processing-infrastructure \
  --template-body file://lib/PaymentProcessingStack.json \
  --capabilities CAPABILITY_NAMED_IAM

# 3. Deploy to accounts
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 \
  --regions us-east-1 \
