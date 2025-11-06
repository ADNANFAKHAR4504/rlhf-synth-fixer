# Payment Processing Infrastructure Migration

This CDK Go application provides a complete infrastructure solution for migrating a payment processing system from on-premises to AWS, supporting both development and production environments.

## Prerequisites

- Go 1.19 or higher
- AWS CDK 2.100 or higher
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Architecture

The solution creates:

- **VPC**: Separate VPCs for dev (10.0.0.0/16) and prod (10.1.0.0/16) with public/private subnets across 2 AZs
- **RDS**: PostgreSQL 14 instances with automated backups (db.t3.small for dev, db.r5.large for prod)
- **Lambda**: Transaction validation functions with Go runtime (512MB for dev, 2048MB for prod)
- **S3**: Versioned buckets with lifecycle policies for data storage
- **SQS**: Message queues with environment-specific visibility timeouts
- **IAM**: Least-privilege roles and policies
- **CloudWatch**: Monitoring and alarms with environment-appropriate thresholds
- **CodePipeline**: Deployment automation with manual approval for production

## Installation

1. Install dependencies:
```bash
go mod download
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

## Deployment

### Deploy Development Environment

```bash
cdk deploy PaymentStack-dev \
  -c environment=dev \
  -c environmentSuffix=dev-v1
```

### Deploy Production Environment

```bash
cdk deploy PaymentStack-prod \
  -c environment=prod \
  -c environmentSuffix=prod-v1
```

### Deploy with Pipeline

```bash
cdk deploy PipelineStack-prod \
  -c environment=prod \
  -c environmentSuffix=prod-v1 \
  -c repositoryName=payment-processing-repo
```

## Environment-Specific Configurations

### Development
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.small, 20GB storage
- Lambda: 512MB memory
- SQS visibility timeout: 30 seconds
- CloudWatch alarm threshold: 10 errors

### Production
- VPC CIDR: 10.1.0.0/16
- RDS: db.r5.large, 100GB storage, Multi-AZ enabled
- Lambda: 2048MB memory
- SQS visibility timeout: 120 seconds
- CloudWatch alarm threshold: 5 errors

## Lambda Function

The transaction validation Lambda function:
- Uses Go runtime (provided.al2023)
- Validates transaction data
- Checks for fraud patterns in RDS
- Stores results in S3
- Processes messages from SQS

To build the Lambda function:
```bash
cd lib/lambda/validation
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip function.zip bootstrap
```

## Security Features

- Network isolation with VPCs and security groups
- Database access restricted to Lambda functions only
- Least-privilege IAM policies
- Encryption at rest for S3 and SQS
- Multi-AZ deployment for production RDS

## Monitoring

CloudWatch alarms are configured for:
- Lambda function errors
- SQS queue depth
- RDS CPU utilization

## Cost Optimization

- Development environment uses smaller, cost-effective instance types
- S3 lifecycle policies transition objects to Intelligent-Tiering after 90 days
- Lambda functions sized appropriately per environment
- RDS automated backups with 7-day retention

## Cleanup

To destroy the infrastructure:

```bash
cdk destroy PaymentStack-dev
cdk destroy PaymentStack-prod
cdk destroy PipelineStack-prod
```

## Context Variables

- `environment`: Target environment (dev/prod)
- `environmentSuffix`: Unique suffix for resource naming
- `repositoryName`: CodeCommit repository name (optional, for pipeline)

## Useful CDK Commands

- `cdk synth` - Synthesize CloudFormation template
- `cdk diff` - Compare deployed stack with current state
- `cdk deploy` - Deploy stack to AWS
- `cdk destroy` - Remove stack from AWS
- `cdk ls` - List all stacks

## Testing

Run Go tests:
```bash
go test ./...
```

## License

This project is licensed under the MIT License.
