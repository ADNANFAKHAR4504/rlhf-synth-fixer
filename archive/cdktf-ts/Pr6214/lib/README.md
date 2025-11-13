# Payment Processing Infrastructure - Multi-Environment Deployment

This CDKTF project deploys a comprehensive payment processing infrastructure across dev, staging, and production environments with consistent configurations and environment-specific sizing.

## Architecture

### Network Layer
- VPC with isolated networks per environment:
  - Dev: 10.0.0.0/16
  - Staging: 10.1.0.0/16
  - Prod: 10.2.0.0/16
- 2 public subnets + 2 private subnets per environment
- Deployed across 2 availability zones (ap-southeast-2a, ap-southeast-2b)
- NAT Gateways for private subnet internet access
- VPC endpoints for S3 service

### Database Layer
- RDS PostgreSQL 16.3 with environment-specific sizing:
  - Dev: db.t3.micro, 1-day backup retention
  - Staging: db.t3.small, 7-day backup retention
  - Prod: db.r5.large, 30-day backup retention, Multi-AZ
- Encrypted at rest
- Parameter groups with logging enabled
- Database credentials from AWS Secrets Manager

### Storage Layer
- S3 buckets with versioning enabled
- Server-side encryption (AES256)
- Environment-specific lifecycle policies:
  - Dev: Transition to IA after 30 days
  - Staging: Transition to IA after 90 days
  - Prod: Transition to IA after 365 days
- Public access blocked

### Compute Layer
- EC2 instances running payment processing applications
- Environment-specific instance types:
  - Dev: t3.micro
  - Staging: t3.small
  - Prod: t3.medium
- Amazon Linux 2023 AMI
- IAM roles with SSM and CloudWatch access
- Encrypted EBS volumes

## Prerequisites

- Node.js 18.x or later
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials
- Terraform 1.5+ (installed via CDKTF)

## Required AWS Secrets

Before deploying, create the following secrets in AWS Secrets Manager:

```bash
# Dev environment
aws secretsmanager create-secret \
  --name payment-db-credentials-dev \
  --secret-string '{"username":"dbadmin","password":"YourSecurePassword123!"}'

# Staging environment
aws secretsmanager create-secret \
  --name payment-db-credentials-staging \
  --secret-string '{"username":"dbadmin","password":"YourSecurePassword123!"}'

# Prod environment
aws secretsmanager create-secret \
  --name payment-db-credentials-prod \
  --secret-string '{"username":"dbadmin","password":"YourSecurePassword123!"}'
```

## Deployment

### Install Dependencies

```bash
npm install
```

### Deploy to Dev Environment

```bash
export ENVIRONMENT_SUFFIX="dev-pr123"
export AWS_REGION="ap-southeast-2"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"

cdktf deploy
```

### Deploy to Staging Environment

```bash
export ENVIRONMENT_SUFFIX="staging-pr456"
export AWS_REGION="ap-southeast-2"

cdktf deploy
```

### Deploy to Production Environment

```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION="ap-southeast-2"

cdktf deploy
```

## Testing

### Unit Tests

Run unit tests to validate stack configuration:

```bash
npm test
```

### Integration Tests

Integration tests validate deployed resources:

```bash
# After deployment, run integration tests
npm run test:integration
```

## Outputs

The stack outputs the following values:

- `vpc_id`: VPC identifier
- `rds_endpoint`: RDS PostgreSQL endpoint
- `s3_bucket_name`: S3 bucket name
- `ec2_instance_id`: EC2 instance identifier
- `environment`: Environment name (dev/staging/prod)
- `environment_suffix`: Full environment suffix

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{environmentSuffix}`

Examples:
- `payment-vpc-dev-pr123`
- `payment-db-staging-pr456`
- `payment-data-prod`

## Tagging Strategy

All resources are tagged with:
- `Environment`: Base environment (dev/staging/prod)
- `EnvironmentSuffix`: Full environment suffix
- `Application`: payment-processing
- `CostCenter`: fintech-ops
- `ManagedBy`: cdktf

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

**Note**: Ensure you're using the correct ENVIRONMENT_SUFFIX to avoid destroying the wrong environment.

## Security Considerations

- All data encrypted at rest and in transit
- Security groups follow least-privilege principles
- IAM roles with minimal required permissions
- S3 public access completely blocked
- RDS deployed in private subnets
- Database credentials stored in AWS Secrets Manager
- CloudWatch logging enabled for monitoring

## Cost Optimization

- Dev environment uses minimal instance sizes
- Lifecycle policies reduce storage costs
- Multi-AZ only enabled for production
- NAT Gateways shared per AZ

## Troubleshooting

### Secret Not Found Error

If you see errors about missing secrets, ensure you've created the required secrets in AWS Secrets Manager for your target environment.

### VPC CIDR Conflicts

If you see CIDR conflicts, ensure no existing VPCs overlap with:
- 10.0.0.0/16 (dev)
- 10.1.0.0/16 (staging)
- 10.2.0.0/16 (prod)

## Support

For issues or questions, contact the infrastructure team.
