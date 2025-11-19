# Multi-Environment Payment Processing Infrastructure

This Pulumi TypeScript project deploys consistent payment processing infrastructure across development, staging, and production environments.

## Architecture

### Components

1. **NetworkComponent** - VPC with 3 private subnets across availability zones
2. **DatabaseComponent** - Aurora Serverless v2 PostgreSQL clusters with encryption
3. **IamComponent** - IAM roles and policies with least-privilege access
4. **ComputeComponent** - Lambda functions for payment processing and validation
5. **ApiComponent** - API Gateway with custom domains and optional WAF
6. **StorageComponent** - DynamoDB tables and S3 buckets for data persistence
7. **MonitoringComponent** - CloudWatch alarms and metrics

### Environment Configurations

- **Development**: 7-day log retention, 10 Lambda concurrency, 80% CPU threshold
- **Staging**: 30-day log retention, 50 Lambda concurrency, 75% CPU threshold
- **Production**: 90-day log retention, 200 Lambda concurrency, 70% CPU threshold, WAF enabled

## Deployment

### Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS CLI configured with credentials

### Configuration

Set the environment suffix (required for unique resource naming):

```bash
pulumi config set environmentSuffix <unique-suffix>
```

### Deploy

```bash
# Install dependencies
npm install

# Deploy infrastructure
pulumi up
```

### Outputs

After deployment, you'll get endpoints and ARNs for:
- VPC IDs and subnet IDs for each environment
- RDS cluster endpoints and ARNs
- API Gateway invoke URLs
- DynamoDB table names
- S3 bucket names
- WAF ACL ARN (production only)

## Testing

Run unit tests:

```bash
npm test
```

## Clean Up

Destroy all infrastructure:

```bash
pulumi destroy
```

## Security Features

- KMS encryption for RDS databases
- S3 encryption with AES256
- IAM roles with least-privilege policies
- VPC isolation with private subnets
- API Gateway WAF protection (production)
- DynamoDB point-in-time recovery

## Cost Optimization

- Aurora Serverless v2 with auto-scaling (0.5-1 ACU)
- DynamoDB on-demand billing
- S3 lifecycle policies to Glacier
- Environment-specific resource sizing
