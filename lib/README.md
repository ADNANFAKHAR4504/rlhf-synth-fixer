# Payment Processing Infrastructure

This Pulumi TypeScript project deploys a multi-environment payment processing infrastructure to AWS with strict consistency guarantees across dev, staging, and production environments.

## Architecture

The infrastructure includes:
- **VPC**: Isolated network with public and private subnets across 2 availability zones
- **API Gateway**: HTTP API with two endpoints for payment processing and verification
- **Lambda Functions**: Serverless compute for payment processing logic
- **RDS PostgreSQL**: Managed database for transaction data with automated backups
- **S3**: Audit log storage with versioning and intelligent tiering
- **SQS**: Message queues with dead letter queue for failed notifications
- **CloudWatch**: Monitoring and alarms for Lambda errors
- **IAM**: Least privilege roles and policies

## Prerequisites

- Node.js 18 or later
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- TypeScript

## Installation

```bash
npm install
```

## Configuration

The project uses Pulumi stack configuration files to manage environment-specific values:

- `Pulumi.dev.yaml` - Development environment configuration
- `Pulumi.staging.yaml` - Staging environment configuration
- `Pulumi.prod.yaml` - Production environment configuration

### Configuration Parameters

- `environmentSuffix`: Unique suffix for resource names (required)
- `environment`: Environment name (dev, staging, or prod)
- `region`: AWS region for deployment
- `rdsInstanceClass`: RDS instance class (db.t3.medium or db.r5.large)
- `rdsBackupRetentionDays`: Number of days to retain backups (3 or 7)
- `lambdaMemorySize`: Lambda function memory in MB (default: 512)
- `lambdaTimeout`: Lambda function timeout in seconds (default: 30)

## Deployment

### Development Environment

```bash
pulumi stack select dev
pulumi up
```

### Staging Environment

```bash
pulumi stack select staging
pulumi up
```

### Production Environment

```bash
pulumi stack select prod
pulumi up
```

Production deployments require explicit confirmation to prevent accidental changes.

## Stack References

The infrastructure supports stack references for sharing VPC and subnet information from a separate networking stack. To use stack references:

1. Deploy a networking stack first
2. Reference outputs in your payment processing stack configuration

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

All resources include the `environmentSuffix` parameter in their names to ensure uniqueness and prevent conflicts between environments.

Examples:
- S3 Bucket: `payment-audit-logs-dev-m71vs8`
- Lambda Function: `process-payment-staging-m71vs8`
- RDS Instance: `payment-db-prod-m71vs8`

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be destroyable:
- S3 buckets have `forceDestroy: true`
- RDS instances have `deletionProtection: false` and `skipFinalSnapshot: true`

## Monitoring

CloudWatch alarms are configured for Lambda function errors:
- Threshold: 5 errors in 5 minutes
- Alarms are created for both process-payment and verify-payment functions

## Security

- RDS instances use encrypted storage with AWS-managed KMS keys
- Lambda functions run in private subnets with VPC configuration
- IAM roles follow least privilege principle
- API Gateway has request/response logging enabled
- All data stores use encryption at rest

## Cost Optimization

The infrastructure uses cost-effective configurations:
- NAT Gateway: Single NAT gateway shared across AZs
- RDS: Appropriate instance sizes per environment
- S3: Intelligent tiering for older audit logs
- Lambda: Right-sized memory and timeout settings

## Environment Consistency

The reusable module architecture ensures consistency across environments:
- Identical resource types and configurations
- Environment-specific values managed via Pulumi config
- Single source of truth for infrastructure definitions
- Configuration drift prevention through code

## Outputs

After deployment, the following outputs are available:

- `vpcId`: VPC identifier
- `privateSubnetIds`: List of private subnet IDs
- `publicSubnetIds`: List of public subnet IDs
- `apiGatewayEndpoint`: API Gateway endpoint URL
- `rdsEndpoint`: RDS database endpoint
- `auditLogsBucketName`: S3 bucket name for audit logs
- `paymentQueueUrl`: SQS queue URL
- `processPaymentLambdaArn`: Process payment Lambda ARN
- `verifyPaymentLambdaArn`: Verify payment Lambda ARN
