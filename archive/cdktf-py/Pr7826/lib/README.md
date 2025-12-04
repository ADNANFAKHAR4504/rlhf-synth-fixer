# Multi-Region Disaster Recovery Payment Processing API

## Quick Start

This CDKTF Python implementation provides a complete multi-region disaster recovery architecture for payment processing APIs spanning us-east-1 and us-east-2 regions.

## Architecture Overview

```
Client Request
    ↓
Route 53 (DNS Failover)
    ↓
┌─────────────────────────────────────────────────────────┐
│  Primary Region (us-east-1)                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ API Gateway│→ │  Validation│→ │  DynamoDB  │       │
│  │            │  │   Lambda   │  │ (Global)   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                        ↓              ↓                 │
│                  ┌────────────┐  ┌────────────┐       │
│                  │    SQS     │→ │ Processing │       │
│                  │   Queue    │  │   Lambda   │       │
│                  └────────────┘  └────────────┘       │
│                                       ↓                 │
│                                  ┌────────────┐       │
│                                  │  SNS Topic │       │
│                                  └────────────┘       │
└─────────────────────────────────────────────────────────┘
              Automatic Replication ↕
┌─────────────────────────────────────────────────────────┐
│  Secondary Region (us-east-2)                           │
│  (Identical infrastructure with automatic failover)     │
└─────────────────────────────────────────────────────────┘
```

## Files Structure

```
lib/
├── tap_stack.py              # Main CDKTF stack (1071 lines)
├── lambda/
│   ├── payment_validation.py     # Payment validation Lambda
│   ├── payment_processing.py     # Payment processing Lambda
│   └── failover_orchestration.py # Failover Lambda
├── PROMPT.md                 # Original task requirements
├── IDEAL_RESPONSE.md         # Complete implementation guide
└── README.md                 # This file
```

## Infrastructure Components

### DynamoDB Global Table
- On-demand billing mode
- Point-in-time recovery enabled
- Automatic replication between regions
- Stores all transaction records

### Lambda Functions (3 types)
1. **Payment Validation**: Validates incoming payments
2. **Payment Processing**: Processes validated payments from SQS
3. **Failover Orchestration**: Monitors alarms and triggers failover

### API Gateway
- REST API in both regions
- POST /validate endpoint
- Integrated with validation Lambda

### Route 53
- Hosted zone for DNS management
- Health checks for both regions
- Failover routing policy

### SQS Queues
- Processing queues in both regions
- Dead letter queues configured

### CloudWatch
- Alarms for API latency, Lambda errors, DynamoDB throttles
- Dashboards for each region

### SNS Topics
- Operational alerts
- Failover notifications

## Deployment

### 1. Prerequisites

```bash
# Install Python dependencies
pip install cdktf cdktf-cdktf-provider-aws constructs boto3

# Install Node.js dependencies (for testing)
npm install

# Configure AWS credentials
aws configure
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="your-unique-suffix"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
```

### 3. Package Lambda Functions

```bash
cd lib/lambda
zip -r ../lambda_validation.zip payment_validation.py
zip -r ../lambda_processing.zip payment_processing.py
zip -r ../lambda_failover.zip failover_orchestration.py
cd ../..
```

### 4. Deploy

```bash
# Synthesize Terraform configuration
python tap.py

# Deploy to AWS
cdktf deploy

# Or use Terraform directly
cd cdktf.out/stacks/TapStack*
terraform init
terraform plan
terraform apply
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Test Payment Validation API

```bash
# Get API endpoint from outputs
ENDPOINT=$(terraform output -raw primary_api_endpoint)

# Test valid payment
curl -X POST ${ENDPOINT}/validate \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-001",
    "amount": 100.50,
    "currency": "USD",
    "customer_id": "cust-123",
    "payment_method": "credit_card"
  }'

# Expected: 200 OK with validation success
```

### Test Failover

```bash
# Trigger CloudWatch alarm
aws cloudwatch set-alarm-state \
  --alarm-name "payment-api-latency-${ENVIRONMENT_SUFFIX}-us-east-1" \
  --state-value ALARM \
  --state-reason "Testing failover" \
  --region us-east-1

# Monitor health checks
aws route53 get-health-check-status --health-check-id <health-check-id>
```

## Monitoring

### CloudWatch Dashboards

```bash
# View primary region dashboard
aws cloudwatch get-dashboard \
  --dashboard-name "payment-dashboard-${ENVIRONMENT_SUFFIX}-us-east-1" \
  --region us-east-1
```

### Lambda Logs

```bash
# Validation Lambda
aws logs tail /aws/lambda/payment-validation-${ENVIRONMENT_SUFFIX}-us-east-1 --follow

# Processing Lambda
aws logs tail /aws/lambda/payment-processing-${ENVIRONMENT_SUFFIX}-us-east-1 --follow

# Failover Lambda
aws logs tail /aws/lambda/payment-failover-orchestration-${ENVIRONMENT_SUFFIX} --follow
```

### DynamoDB Table

```bash
# Check table status
aws dynamodb describe-table \
  --table-name "payment-transactions-${ENVIRONMENT_SUFFIX}" \
  --region us-east-1

# Scan recent transactions
aws dynamodb scan \
  --table-name "payment-transactions-${ENVIRONMENT_SUFFIX}" \
  --limit 10 \
  --region us-east-1
```

### SQS Queues

```bash
# Check processing queue
aws sqs get-queue-attributes \
  --queue-url $(aws sqs get-queue-url --queue-name "payment-processing-queue-${ENVIRONMENT_SUFFIX}-us-east-1" --query 'QueueUrl' --output text) \
  --attribute-names All \
  --region us-east-1
```

## Disaster Recovery

### Failover Triggers
- Route 53 health checks fail (3 consecutive failures)
- CloudWatch alarms trigger (API latency, Lambda errors, DynamoDB throttles)
- Manual failover via CloudWatch alarm state change

### Recovery Time Objective (RTO)
- DNS failover: ~60 seconds (TTL)
- Data replication: <1 second (DynamoDB global tables)

### Recovery Point Objective (RPO)
- <1 second (near-zero data loss with DynamoDB replication)

## Cost Estimates

Monthly cost for 1M transactions:
- DynamoDB: $25
- Lambda: $20
- API Gateway: $3.50
- Route 53: $2
- SQS/SNS: $0 (free tier)
- CloudWatch: $0 (free tier)
- **Total: ~$50-60/month**

## Security

- IAM roles with least privilege
- Lambda functions in VPC private subnets
- DynamoDB encryption at rest
- HTTPS-only API Gateway
- CloudWatch logging enabled

## Constraints Satisfied

1. DynamoDB on-demand billing
2. Dead letter queues configured
3. All resources tagged
4. Reserved concurrent executions set
5. Point-in-time recovery enabled
6. Route 53 health checks with failover
7. Cross-region replication <1s
8. Custom domain names configured
9. Lambda in VPC private subnets
10. CloudWatch alarms with SNS actions

## Troubleshooting

### Lambda Functions Not Deploying
- Ensure Lambda zip files exist: `lambda_validation.zip`, `lambda_processing.zip`, `lambda_failover.zip`
- Check IAM permissions for Lambda execution role

### API Gateway 502 Errors
- Check Lambda logs for errors
- Verify Lambda has correct environment variables
- Ensure Lambda is not timing out

### DynamoDB Replication Issues
- Verify global table configuration
- Check DynamoDB streams are enabled
- Review CloudWatch metrics for replication lag

### Route 53 Health Checks Failing
- Verify API Gateway endpoints are accessible
- Check SSL certificate configuration
- Review health check path: `/prod/validate`

## Support

For implementation details, see `IDEAL_RESPONSE.md`.

For original requirements, see `PROMPT.md`.

## License

MIT
