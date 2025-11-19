# Multi-Environment Infrastructure

This Pulumi TypeScript program deploys consistent infrastructure across three environments (dev, staging, prod) with controlled variations.

## Architecture

The solution uses a reusable component architecture:

- **EnvironmentComponent**: Orchestrates all resources for a specific environment
- **VpcComponent**: Creates isolated VPC with subnets and VPC endpoints
- **RdsComponent**: PostgreSQL database with environment-specific instance classes
- **LambdaComponent**: Payment processing Lambda function
- **ApiGatewayComponent**: REST API with environment-scaled rate limiting
- **DynamoDBComponent**: Transaction history table with consistent GSI
- **S3Component**: Audit logs bucket with environment-specific lifecycle
- **CloudWatchComponent**: Monitoring dashboard and alarms

## Environment Configurations

### Development
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.micro
- API Rate Limit: 100 req/min
- DynamoDB Capacity: 5 read/5 write
- S3 Retention: 7 days
- CloudWatch Threshold: 80%

### Staging
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.small
- API Rate Limit: 500 req/min
- DynamoDB Capacity: 10 read/10 write
- S3 Retention: 30 days
- CloudWatch Threshold: 70%

### Production
- VPC CIDR: 10.2.0.0/16
- RDS: db.m5.large
- API Rate Limit: 2000 req/min
- DynamoDB Capacity: 50 read/50 write
- S3 Retention: 90 days
- CloudWatch Threshold: 60%

## Deployment

### Prerequisites
- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured
- AWS credentials with appropriate permissions

### Deploy to Development
```bash
export ENVIRONMENT_SUFFIX=dev
pulumi stack select dev
pulumi up
```

### Deploy to Staging
```bash
export ENVIRONMENT_SUFFIX=staging
pulumi stack select staging
pulumi up
```

### Deploy to Production
```bash
export ENVIRONMENT_SUFFIX=prod
pulumi stack select prod
pulumi up
```

## Outputs

Each deployment provides:
- VPC ID
- RDS endpoint
- Lambda function ARN
- API Gateway URL
- DynamoDB table name
- S3 bucket name
- CloudWatch dashboard name
- Configuration comparison report
- Drift detection report

## Features

### Consistent Schema
- DynamoDB tables have identical GSI configurations across environments
- Lambda functions have identical code and configuration
- All resources follow the same naming convention with environmentSuffix

### Environment-Specific Scaling
- RDS instance classes scale with environment
- API Gateway rate limits scale with environment
- DynamoDB capacity scales with environment
- S3 retention policies vary by environment
- CloudWatch alarm thresholds adjust by environment

### Security
- All data encrypted at rest using KMS
- Environment-specific KMS keys
- VPC isolation per environment
- No public access to databases
- IAM roles follow least privilege principle

### Cost Optimization
- VPC endpoints for S3 and DynamoDB (no NAT Gateway)
- Single-AZ RDS for non-prod environments
- Appropriate instance sizing per environment

### Monitoring
- CloudWatch dashboards per environment
- Error alarms for Lambda and API Gateway
- Environment-adjusted alarm thresholds

## Configuration Comparison

The solution includes a custom resource provider that generates a JSON report comparing configurations across all three environments, highlighting differences in:
- VPC CIDR blocks
- RDS instance classes
- API Gateway rate limits
- DynamoDB capacity units
- S3 retention policies
- CloudWatch alarm thresholds

## Drift Detection

The drift detection component validates deployed resources against Pulumi state and outputs a report identifying any configuration drift.

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are configured with proper removal policies to ensure clean destruction.

## AWS Services Used

- Amazon VPC
- Amazon EC2 (Security Groups, Subnets, Internet Gateway, VPC Endpoints)
- Amazon RDS (PostgreSQL)
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon S3
- Amazon CloudWatch
- AWS KMS
- AWS IAM
