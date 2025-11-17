# Loan Processing Application Infrastructure

This CDK application deploys a complete loan processing web application infrastructure with high availability, compliance features, and comprehensive logging.

## Architecture

- **VPC**: 3 public and 3 private subnets across us-east-1a, us-east-1b, us-east-1c
- **NAT Gateways**: One in each availability zone for outbound connectivity
- **ECS Fargate**: Auto-scaling container service (2-10 tasks based on CPU)
- **Application Load Balancer**: Internet-facing with access logging enabled
- **RDS Aurora PostgreSQL**: 1 writer and 2 reader instances with IAM authentication
- **S3 Buckets**: Static assets (with CloudFront), application logs, ALB logs
- **CloudWatch Logs**: 90-day retention for ECS and Lambda logs
- **Lambda Functions**: Async processing and log export functionality
- **KMS**: Customer-managed encryption keys for database and logs

## Deployment

### Prerequisites

- AWS CDK 2.x
- Node.js 18+
- AWS CLI configured
- Docker Desktop (for local testing)

### Deploy

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy with environment suffix
cdk deploy --context environmentSuffix=prod

# Or use default (dev)
cdk deploy
```

### Destroy

```bash
# Destroy all resources
cdk destroy --context environmentSuffix=prod
```

## Configuration

The stack accepts an `environmentSuffix` parameter that is appended to all resource names for uniqueness:

```bash
cdk deploy --context environmentSuffix=staging
```

## Compliance Features

- **IAM Database Authentication**: RDS uses IAM instead of passwords
- **Encryption**: All data encrypted at rest with customer-managed KMS keys
- **Backup Retention**: Database backups retained for exactly 35 days
- **Log Retention**: CloudWatch logs retained for 90 days
- **Access Logging**: ALB access logs stored in dedicated S3 bucket
- **Versioning**: All S3 buckets have versioning enabled
- **Public Access**: All S3 buckets block public access

## Auto Scaling

ECS service automatically scales between 2-10 tasks based on CPU utilization (70% target).

## Monitoring

All logs are streamed to CloudWatch and exported to S3 daily via subscription filters.

## Outputs

- `LoadBalancerDNS`: Application Load Balancer DNS name
- `CloudFrontURL`: CloudFront distribution domain name
- `DatabaseEndpoint`: RDS Aurora cluster endpoint
- `StaticAssetsBucket`: S3 bucket name for static assets
