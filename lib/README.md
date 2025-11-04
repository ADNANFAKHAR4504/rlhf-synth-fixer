# Multi-Environment Infrastructure with CDKTF

This project deploys consistent infrastructure across three environments (dev, staging, prod) with environment-specific configurations using CDKTF with TypeScript.

## Architecture

The infrastructure includes:

- **S3 Buckets**: Environment-specific buckets with versioning, encryption, and lifecycle policies
  - Production includes cross-region replication to ap-northeast-2
- **DynamoDB Tables**: Identical schemas with environment-appropriate billing modes
  - Dev/Staging: On-demand billing
  - Production: Provisioned capacity
- **CloudWatch Alarms**: Environment-specific thresholds for monitoring
  - Dev: 50% of baseline thresholds
  - Staging: 75% of baseline thresholds
  - Production: 100% of baseline thresholds
- **SNS Topics**: Environment-specific alert notifications
- **IAM Roles**: Least-privilege access policies

## Environment Configuration

Each environment has specific settings defined in `lib/environment-config.ts`:

### Dev Environment
- Bucket lifecycle: 7 days to IA
- DynamoDB: On-demand billing
- Alarm threshold: 50% of baseline
- No cross-region replication

### Staging Environment
- Bucket lifecycle: 30 days to IA
- DynamoDB: On-demand billing
- Alarm threshold: 75% of baseline
- No cross-region replication

### Production Environment
- Bucket lifecycle: 90 days to IA
- DynamoDB: Provisioned capacity (5 RCU/WCU)
- Alarm threshold: 100% of baseline
- Cross-region replication enabled to ap-northeast-2
- Point-in-time recovery enabled

## Prerequisites

- Node.js 18+
- CDKTF CLI installed
- AWS credentials configured
- Terraform installed

## Deployment

### Deploy to Development

```bash
export ENVIRONMENT_SUFFIX=dev
npm run build
cdktf deploy
```

### Deploy to Staging

```bash
export ENVIRONMENT_SUFFIX=staging
npm run build
cdktf deploy
```

### Deploy to Production

```bash
export ENVIRONMENT_SUFFIX=prod
npm run build
cdktf deploy
```

## Configuration Validation

The infrastructure includes parameter validation to prevent misconfigurations:

- Production settings (provisioned billing, cross-region replication) cannot be applied to non-production environments
- Production environment requires all capacity settings when using provisioned billing
- Environment names must be one of: dev, staging, prod

## Outputs

After deployment, the following outputs are available:

- `S3BucketName`: Name of the S3 bucket
- `S3BucketArn`: ARN of the S3 bucket
- `DynamoDBTableName`: Name of the DynamoDB table
- `DynamoDBTableArn`: ARN of the DynamoDB table
- `SNSTopicArn`: ARN of the SNS topic for alerts
- `DataAccessRoleArn`: ARN of the IAM role for data access
- `Environment`: Environment name
- `BillingMode`: DynamoDB billing mode

## Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Resource Naming

All resources follow the naming convention: `{resource-type}-{environment-suffix}`

Examples:
- `data-bucket-dev`
- `data-table-staging`
- `infrastructure-alerts-prod`

## Security

- All S3 buckets use server-side encryption with AWS managed keys (AES256)
- IAM roles follow least-privilege principles
- All resources are tagged with Environment and CostCenter tags
- DynamoDB tables in production have point-in-time recovery enabled

## Cost Optimization

- Development and staging use on-demand DynamoDB billing for cost efficiency
- Lifecycle policies transition objects to cheaper storage classes
- Minimal provisioned capacity in production
- No NAT Gateways or expensive compute resources

## Cleanup

To destroy the infrastructure:

```bash
cdktf destroy
```

Note: Ensure S3 buckets are empty before destroying, or remove bucket contents manually.
