# Payment Processing Infrastructure

Multi-environment payment processing infrastructure deployed using AWS CDK with TypeScript.

## Architecture

This solution implements a comprehensive payment processing system that can be deployed across multiple environments (dev, staging, prod) with environment-specific configuration:

### Components

- **VPC**: Environment-specific CIDR blocks with public and private subnets
- **RDS Aurora PostgreSQL**: Environment-specific instance sizing (db.t3.medium, db.r5.large, db.r5.xlarge)
- **Lambda**: Payment processing functions with SSM Parameter Store integration
- **API Gateway**: RESTful API with environment-specific throttling and WAF protection
- **SQS**: Message queues with dead letter queues for reliable processing
- **S3**: Storage buckets with environment-specific lifecycle policies
- **WAF**: Web Application Firewall with rate limiting and AWS Managed Rules
- **SSM Parameter Store**: Environment-specific configuration management

### Environment Configuration

| Environment | VPC CIDR | DB Instance | Message Retention | S3 Lifecycle |
|-------------|----------|-------------|-------------------|--------------|
| dev | 10.0.0.0/16 | db.t3.medium | 1 day | 7 days |
| staging | 10.1.0.0/16 | db.r5.large | 7 days | 30 days |
| prod | 10.2.0.0/16 | db.r5.xlarge | 14 days | 90 days |

## Deployment

### Prerequisites

```bash
npm install
npm run build
```

### Deploy to Environment

The stack automatically detects the environment from the `environmentSuffix` context variable:

```bash
# Deploy to dev (default)
cdk deploy

# Deploy to specific environment
cdk deploy -c environmentSuffix=dev
cdk deploy -c environmentSuffix=staging
cdk deploy -c environmentSuffix=prod
```

### Environment Validation

The stack includes configuration validation that ensures:
- Environment configuration exists before deployment
- All required parameters are present
- Proper resource naming with environmentSuffix

## Configuration

### SSM Parameters

The Lambda function reads configuration from SSM Parameter Store at:
```
/<environmentSuffix>/payment-service/config/settings
```

Configuration is automatically created during deployment with environment-specific values.

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## Resource Naming

All resources include the `environmentSuffix` for uniqueness:
- VPC: `payment-vpc-{environmentSuffix}`
- Database: `payment-db-cluster-{environmentSuffix}`
- Lambda: `payment-handler-{environmentSuffix}`
- API: `payment-api-{environmentSuffix}`
- Queue: `payment-queue-{environmentSuffix}`
- Bucket: `payment-storage-{environmentSuffix}-{account}`
- WAF: `payment-waf-{environmentSuffix}`

## Security Features

- All database credentials stored in AWS Secrets Manager
- S3 buckets with block public access enabled
- VPC isolated subnets for database and Lambda
- API Gateway with IAM authentication
- WAF with rate limiting and AWS Managed Rules
- SQS queues with KMS encryption
- IAM roles following least privilege principle

## Cost Optimization

- NAT Gateways disabled (using PRIVATE_ISOLATED subnets)
- VPC Gateway Endpoints for S3 access
- Environment-appropriate resource sizing
- S3 lifecycle policies with Infrequent Access transitions

## Cleanup

All resources are created with `removalPolicy: DESTROY` for easy cleanup:

```bash
cdk destroy -c environmentSuffix=dev
```

## CloudFormation Outputs

The stack exports the following outputs for cross-stack referencing:
- VPC ID and configuration
- Database endpoint and port
- API Gateway URL and ID
- SQS queue URL and ARN
- S3 bucket name and ARN
- Lambda function name
- WAF ACL ARN

All outputs include environment tags for easy identification.
