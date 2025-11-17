# Multi-Environment Data Analytics Platform

AWS CDK infrastructure for a data analytics platform with support for multiple environments (dev, staging, prod).

## Architecture

The infrastructure consists of:

- **VPC**: Isolated network with public and private subnets across 2 AZs
- **RDS PostgreSQL**: Database with encryption and automated backups
- **Lambda Functions**: Data processing functions with VPC access
- **S3 Buckets**: Object storage with optional versioning
- **DynamoDB Tables**: State management with environment-specific billing
- **SSM Parameters**: Centralized configuration management
- **CloudWatch Logs**: Log aggregation with retention policies

## Environment Configurations

### Dev
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.micro, single-AZ, 7-day backup, encrypted
- Lambda: 512MB memory, 7-day log retention
- Storage: No versioning, on-demand DynamoDB

### Staging
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.small, single-AZ, 14-day backup, encrypted
- Lambda: 1024MB memory, 30-day log retention
- Storage: Versioned S3, on-demand DynamoDB

### Production
- VPC CIDR: 10.2.0.0/16
- RDS: db.r5.large, multi-AZ, 30-day backup, encrypted
- Lambda: 2048MB memory, 90-day log retention
- Storage: Versioned S3, provisioned DynamoDB

## Deployment

### Prerequisites
- AWS CLI configured
- Node.js 18+ and npm
- AWS CDK CLI installed

### Deploy

```bash
# Install dependencies
npm install

# Deploy to dev
cdk deploy -c environment=dev -c environmentSuffix=dev-test

# Deploy to staging
cdk deploy -c environment=staging -c environmentSuffix=staging-test

# Deploy to production
cdk deploy -c environment=prod -c environmentSuffix=prod-v1
```

### Destroy

```bash
cdk destroy -c environment=dev -c environmentSuffix=dev-test
```

## Project Structure

```
lib/
├── environment-config.ts    # Environment-specific configurations
├── vpc-construct.ts         # VPC and networking
├── database-construct.ts    # RDS PostgreSQL
├── lambda-construct.ts      # Lambda functions
├── storage-construct.ts     # S3 and DynamoDB
├── parameter-construct.ts   # SSM parameters
└── tap-stack.ts            # Main stack composition
bin/
└── tap.ts                   # CDK app entry point
```

## Security

- RDS database deployed in private subnets with storage encryption enabled
- Lambda functions use VPC endpoints for AWS services
- Database credentials stored in Secrets Manager
- All storage resources encrypted at rest
- Security groups follow least privilege principle

## Cost Optimization

- Dev environment uses smallest instance sizes
- On-demand billing for dev/staging DynamoDB
- Automated resource cleanup with RemovalPolicy.DESTROY
- Single NAT Gateway per environment

## Key Fixes Applied

1. RDS storage encryption enabled for all environments
2. RDS instance types properly parsed from configuration strings
3. Lambda log retention uses CloudWatch RetentionDays enum
4. Log groups have RemovalPolicy.DESTROY for clean deletion
5. Environment validation checks against valid values
6. Proper environment-specific configurations for dev/staging/prod
