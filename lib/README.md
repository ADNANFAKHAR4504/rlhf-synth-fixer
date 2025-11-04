# Multi-Environment Data Processing Pipeline

This CDKTF TypeScript application deploys a data processing pipeline that maintains consistency across multiple environments (dev, staging, prod).

## Architecture

The infrastructure includes:

- **S3 Buckets**: Environment-specific data storage with versioning and encryption
- **DynamoDB Table**: Job tracking with environment-specific capacity and GSI
- **Lambda Functions**: Data processors with environment-specific memory allocation
- **IAM Roles**: Least privilege access with cross-environment restrictions
- **CloudWatch Logs**: Environment-specific retention policies

## Environment Configuration

Each environment has specific configurations:

### Dev Environment
- DynamoDB: 5 RCU / 5 WCU
- Lambda Memory: 128 MB
- Log Retention: 7 days

### Staging Environment
- DynamoDB: 10 RCU / 10 WCU
- Lambda Memory: 256 MB
- Log Retention: 30 days

### Production Environment
- DynamoDB: 25 RCU / 25 WCU
- Lambda Memory: 512 MB
- Log Retention: 90 days

## Deployment

### Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate credentials
- CDKTF CLI: `npm install -g cdktf-cli`
- Terraform >= 1.0

### Deploy to Dev Environment

```bash
export ENVIRONMENT_SUFFIX="dev-pr123"
cdktf deploy --context env=dev
```

### Deploy to Staging Environment

```bash
export ENVIRONMENT_SUFFIX="staging-pr123"
cdktf deploy --context env=staging
```

### Deploy to Production Environment

```bash
export ENVIRONMENT_SUFFIX="prod"
cdktf deploy --context env=prod
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{environmentSuffix}`

Examples:
- S3 Bucket: `company-data-dev-pr123`
- DynamoDB Table: `job-tracking-staging-pr456`
- Lambda Function: `data-processor-prod-v1`

## Security Features

### Cross-Environment Access Restrictions

IAM policies explicitly deny access to resources from other environments using:
- S3 object tags for environment verification
- DynamoDB condition keys for table access control
- Resource-based policies with environment filters

### Encryption

- S3: Server-side encryption (AES256) enabled
- DynamoDB: Encryption at rest enabled
- CloudWatch Logs: Encrypted by default

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## Stack Outputs

After deployment, the following outputs are available:

- `BucketName`: S3 bucket name
- `BucketArn`: S3 bucket ARN
- `TableName`: DynamoDB table name
- `TableArn`: DynamoDB table ARN
- `LambdaFunctionName`: Lambda function name
- `LambdaFunctionArn`: Lambda function ARN
- `LogGroupName`: CloudWatch log group name
- `Environment`: Deployed environment
- `EnvironmentSuffix`: Environment suffix for uniqueness

## Cleanup

Destroy the infrastructure:

```bash
cdktf destroy --context env=dev
```

Note: All resources are created without deletion protection for CI/CD compatibility.
