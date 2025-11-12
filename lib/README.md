# Payment Processing Web Application Infrastructure

This CDK application deploys a complete payment processing infrastructure with the following components:

## Architecture

- **Network**: VPC with public, private, and isolated subnets across 3 AZs
- **Database**: RDS Aurora PostgreSQL cluster with encryption and automated backups
- **Compute**: ECS Fargate service with Application Load Balancer
- **Frontend**: S3 + CloudFront distribution with WAF protection
- **Security**: KMS encryption, Secrets Manager for credentials, WAF rules
- **Monitoring**: CloudWatch dashboard and alarms with SNS notifications

## Deployment

### Prerequisites

- AWS CDK 2.x installed
- Node.js 18+ installed
- AWS credentials configured
- Docker installed (for container builds)

### Deploy

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy with environment suffix
cdk deploy --context environmentSuffix=staging

# Or for production
cdk deploy --context environmentSuffix=prod
```

### Destroy

```bash
cdk destroy --context environmentSuffix=staging
```

## Configuration

The infrastructure uses the following configuration:

- **Region**: ap-southeast-1
- **VPC**: 3 AZs with public, private, and isolated subnets
- **Database**: Aurora PostgreSQL 15.3, 2 instances
- **ECS**: Fargate with 2-10 tasks, auto-scaling at 70% CPU
- **Frontend**: CloudFront with WAF protection
- **Logs**: 90-day retention in CloudWatch

## Security Features

- All data encrypted at rest with KMS
- Database credentials in Secrets Manager with 30-day rotation
- WAF rules blocking SQL injection, XSS, and rate limiting
- Security groups with least privilege access
- CloudFront OAI for S3 access

## Monitoring

CloudWatch dashboard includes:
- API latency (average and p99)
- Request count
- ECS CPU and memory utilization
- Database connections

Alarm configured for error rates exceeding 1%.

## Blue-Green Deployment

The ECS service supports blue-green deployments with:
- Circuit breaker for automatic rollback
- Health checks every 30 seconds
- Deregistration delay of 30 seconds

## Outputs

After deployment, the stack outputs:
- Load Balancer DNS name
- CloudFront distribution domain
- Database endpoint
- Frontend S3 bucket name
