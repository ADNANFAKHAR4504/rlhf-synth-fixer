# Multi-Environment Trading Platform Infrastructure

This CDK TypeScript application implements a comprehensive multi-environment infrastructure replication system for a trading platform with type-safe configuration management and automated deployment validation.

## Architecture

### Components

1. **Configuration Management** (`lib/config/environment-config.ts`)
   - Type-safe environment configurations using TypeScript interfaces
   - Centralized configuration for dev, staging, and production environments
   - Environment-specific resource sizing and policies

2. **Base Stack** (`lib/stacks/base-stack.ts`)
   - Abstract base class for all stacks
   - Automatic tagging and naming conventions
   - SSM Parameter Store integration for cross-stack references

3. **VPC Stack** (`lib/stacks/vpc-stack.ts`)
   - Isolated VPCs per environment
   - 3 availability zones with public and private subnets
   - Environment-specific NAT gateway configuration

4. **Lambda Stack** (`lib/stacks/lambda-stack.ts`)
   - Order processing functions with environment-specific memory allocation
   - Least-privilege IAM roles
   - VPC integration and security groups

5. **DynamoDB Stack** (`lib/stacks/dynamodb-stack.ts`)
   - Environment-appropriate capacity settings
   - Point-in-time recovery for production only
   - Auto-scaling for production environment

6. **API Gateway Stack** (`lib/stacks/api-gateway-stack.ts`)
   - REST API with environment-specific throttling
   - CloudWatch logging and metrics
   - Usage plans for rate limiting

7. **S3 Stack** (`lib/stacks/s3-stack.ts`)
   - Trade data storage with lifecycle policies
   - Environment-specific retention periods
   - Encryption and versioning

8. **SQS Stack** (`lib/stacks/sqs-stack.ts`)
   - Order processing queues with dead letter queues
   - Environment-specific retention and visibility timeout

9. **Monitoring Stack** (`lib/stacks/monitoring-stack.ts`)
   - CloudFormation drift detection alarms
   - CloudWatch dashboards
   - SNS notifications

10. **Pipeline Stack** (`lib/stacks/pipeline-stack.ts`)
    - Automated deployment pipeline
    - Environment promotion with validation
    - Manual approval before production
    - Automated rollback on validation failure

## Environment Configurations

### Development
- **Region**: us-east-1
- **Lambda Memory**: 512 MB
- **API Throttle**: 100 req/sec
- **DynamoDB Capacity**: 5 RCU/WCU
- **S3 Retention**: 30 days
- **SQS Retention**: 4 days

### Staging
- **Region**: us-east-2
- **Lambda Memory**: 1024 MB
- **API Throttle**: 500 req/sec
- **DynamoDB Capacity**: 10 RCU/WCU
- **S3 Retention**: 90 days
- **SQS Retention**: 10 days

### Production
- **Region**: us-east-1
- **Lambda Memory**: 2048 MB
- **API Throttle**: 2000 req/sec
- **DynamoDB Capacity**: 25 RCU/WCU (with auto-scaling)
- **S3 Retention**: Indefinite
- **SQS Retention**: 14 days
- **Point-in-Time Recovery**: Enabled

## Prerequisites

- Node.js 18+
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- Separate AWS accounts for each environment (recommended)

## Installation

```bash
npm install
cd lib/lambda/order-processing
npm install
cd ../../..
```

## Deployment

### Deploy Specific Environment

```bash
# Deploy development environment
npx cdk deploy --context env=dev --all

# Deploy staging environment
npx cdk deploy --context env=staging --all

# Deploy production environment
npx cdk deploy --context env=prod --all
```

### Deploy Pipeline

```bash
npx cdk deploy PipelineStack
```

## Configuration

### Environment Variables

Set the following environment variables for cross-account deployment:

```bash
export CDK_DEV_ACCOUNT=123456789012
export CDK_STAGING_ACCOUNT=234567890123
export CDK_PROD_ACCOUNT=345678901234
export CDK_DEFAULT_REGION=us-east-1
```

### GitHub Integration

Store GitHub token in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-personal-access-token"
```

## Testing

### Validate Infrastructure

```bash
# Run CDK diff to preview changes
npx cdk diff --context env=dev --all

# Synthesize CloudFormation templates
npx cdk synth --context env=dev --all
```

### API Testing

```bash
# Get API endpoint from SSM Parameter Store
API_ENDPOINT=$(aws ssm get-parameter \
  --name /trading-platform/dev/api-endpoint \
  --query 'Parameter.Value' \
  --output text)

# Test order creation
curl -X POST $API_ENDPOINT/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-1",
    "customerId": "customer-123",
    "amount": 1000
  }'
```

## Drift Detection

Drift detection is automatically configured with CloudWatch alarms. Manual drift detection:

```bash
# Detect drift for a specific stack
aws cloudformation detect-stack-drift \
  --stack-name trading-vpc-dev

# Get drift detection status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <drift-detection-id>
```

## Monitoring

Access CloudWatch dashboards:
- Development: `trading-platform-dev`
- Staging: `trading-platform-staging`
- Production: `trading-platform-prod`

## Rollback

Rollback is automatically triggered if post-deployment validation fails. Manual rollback:

```bash
# Rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name trading-vpc-dev
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `trading-vpc-dev`
- `order-processing-staging`
- `trade-data-prod`

## SSM Parameter Store References

Cross-stack references are stored in Parameter Store under:
`/trading-platform/{environment}/{parameter-name}`

Examples:
- `/trading-platform/dev/vpc-id`
- `/trading-platform/staging/api-endpoint`
- `/trading-platform/prod/orders-table-name`

## Cost Optimization

- Development uses minimal resources (1 NAT gateway, small Lambda memory)
- Staging uses moderate resources for realistic testing
- Production uses auto-scaling and higher capacities
- All environments can be destroyed without data loss (RemovalPolicy.DESTROY)

## Security

- All S3 buckets have encryption enabled and block public access
- All IAM roles follow least-privilege principles
- VPC security groups restrict traffic appropriately
- API Gateway enforces rate limiting per environment
- All resources are tagged for compliance tracking

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/order-processing-dev --follow
```

### API Gateway Issues

Check API Gateway logs:
```bash
aws logs tail /aws/apigateway/trading-api-dev --follow
```

### DynamoDB Throttling

Monitor consumed capacity:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=orders-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Cleanup

```bash
# Destroy specific environment
npx cdk destroy --context env=dev --all

# Destroy all environments
npx cdk destroy --context env=dev --all
npx cdk destroy --context env=staging --all
npx cdk destroy --context env=prod --all
```

## Support

For issues or questions, contact the platform team or refer to the AWS CDK documentation.
