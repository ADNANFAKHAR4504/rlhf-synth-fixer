# Multi-Environment Payment Processing Infrastructure

This CDK application deploys a complete payment processing infrastructure across multiple environments (dev, staging, production) with environment-specific configurations.

## Architecture

### Components

1. **Networking Layer** (`networking-construct.ts`)
   - VPC with 2 AZs
   - Public and private subnets
   - VPC endpoints for S3, DynamoDB, and Secrets Manager
   - Single NAT Gateway for cost optimization

2. **Database Layer** (`database-construct.ts`)
   - Aurora PostgreSQL Multi-AZ cluster
   - Secrets Manager for credentials with automatic rotation
   - Environment-specific instance types
   - Encrypted storage

3. **Storage Layer** (`storage-construct.ts`)
   - S3 buckets with versioning
   - **Intelligent-Tiering lifecycle policies** (works with 7-day dev retention)
   - Expiration policies based on environment
   - SSE-S3 encryption

4. **Messaging Layer** (`messaging-construct.ts`)
   - SQS queues for async processing
   - Dead-letter queues for failed messages
   - Environment-specific timeouts and retention

5. **Compute Layer** (`compute-construct.ts`)
   - Lambda functions for payment validation
   - VPC integration with database access
   - Environment-specific memory allocations
   - X-Ray tracing enabled

6. **API Gateway Layer** (`api-gateway-construct.ts`)
   - REST API with request validation
   - CloudWatch logging
   - Usage plans and throttling
   - CORS enabled

7. **Monitoring Layer** (`monitoring-construct.ts`)
   - CloudWatch dashboards
   - Environment-specific alarms
   - SNS notifications

## Deployment

### Prerequisites

- AWS CLI configured
- Node.js 18+
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Cross-account IAM roles configured

### Environment Configuration

The stack automatically detects environment from the `environmentSuffix` parameter:

```bash
# Deploy to dev
cdk deploy -c environmentSuffix=dev123

# Deploy to staging
cdk deploy -c environmentSuffix=staging456

# Deploy to production (with approval)
cdk deploy -c environmentSuffix=prod789 --require-approval always
```

### Install Dependencies

```bash
npm install
cd lib/lambda/payment-validation && npm install && cd ../../..
```

### Synthesize CloudFormation

```bash
cdk synth -c environmentSuffix=dev
```

### Deploy

```bash
cdk deploy -c environmentSuffix=dev
```

## Environment-Specific Configurations

### Development
- VPC CIDR: 10.0.0.0/16
- DB Instance: t3.medium
- Lambda Memory: 512MB
- S3 Retention: 7 days (uses Intelligent-Tiering)
- SQS Visibility: 30 seconds

### Staging
- VPC CIDR: 10.1.0.0/16
- DB Instance: t3.large
- Lambda Memory: 1024MB
- S3 Retention: 30 days (uses Intelligent-Tiering)
- SQS Visibility: 60 seconds

### Production
- VPC CIDR: 10.2.0.0/16
- DB Instance: r5.large
- Lambda Memory: 2048MB
- S3 Retention: 90 days (uses Intelligent-Tiering)
- SQS Visibility: 120 seconds

## S3 Lifecycle Policy Fix

**CRITICAL**: This implementation uses S3 Intelligent-Tiering storage class instead of STANDARD_IA transitions. This is because:

- AWS requires a minimum of 30 days before transitioning to STANDARD_IA
- Dev environment needs 7-day retention (less than 30 days)
- Intelligent-Tiering works with ANY retention period (including 7 days)
- Objects are automatically moved to cost-optimized storage tiers
- No minimum storage duration requirements

### Previous Issue
The original implementation attempted to use STANDARD_IA transitions with 7-day retention, which caused deployment failures.

### Solution
All S3 buckets now use Intelligent-Tiering with immediate transition (day 0), plus expiration policies based on environment retention requirements.

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# After deployment
npm run test:integration
```

## API Usage

### Validate Payment

```bash
POST /payments
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "customerId": "cust_123456",
  "description": "Payment for order #12345"
}
```

### Get Payment Status

```bash
GET /payments/{paymentId}
```

## Monitoring

Access CloudWatch dashboard:
```
AWS Console → CloudWatch → Dashboards → payment-dashboard-{environmentSuffix}
```

## Cleanup

```bash
cdk destroy -c environmentSuffix=dev
```

## Security

- All IAM roles follow least-privilege principles
- Database credentials stored in Secrets Manager with rotation
- Encryption at rest enabled for all storage resources
- VPC endpoints minimize data transfer over internet
- API Gateway validates all requests
- Lambda functions run in VPC with security groups

## Cost Optimization

- Single NAT Gateway per environment
- VPC endpoints for S3, DynamoDB, Secrets Manager
- S3 Intelligent-Tiering for automatic cost optimization
- Aurora with right-sized instances per environment
- CloudWatch log retention set to 1 week
- Auto-deletion enabled for S3 buckets in synthetic tasks

## Support

For issues or questions, refer to the project documentation or contact the infrastructure team.
