# Financial Analytics Platform Infrastructure

This directory contains the Pulumi TypeScript infrastructure code for a production-ready financial analytics platform on AWS.

## Architecture

The infrastructure implements a secure, cost-optimized, highly available architecture:

- **Network**: VPC with 3 AZs, public/private subnets, VPC endpoints (no NAT gateways)
- **Compute**: ECS Fargate Spot cluster for containerized microservices
- **Database**: Aurora PostgreSQL Serverless v2 with 35-day encrypted backups
- **Storage**: S3 buckets with versioning and Glacier transitions after 90 days
- **Streaming**: Kinesis Data Streams for real-time data ingestion
- **Security**: Customer-managed KMS encryption, least-privilege IAM, security groups
- **Backup**: AWS Backup for centralized backup management
- **Monitoring**: CloudWatch logs with 30-day retention and KMS encryption

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured with appropriate credentials
- TypeScript 5.x

## Configuration

Set the required configuration value:

```bash
pulumi config set environmentSuffix <unique-suffix>
```

Example:

```bash
pulumi config set environmentSuffix dev-abc123
```

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Preview changes:

```bash
pulumi preview
```

3. Deploy infrastructure:

```bash
pulumi up
```

4. Save outputs:

```bash
pulumi stack output --json > cfn-outputs/flat-outputs.json
```

## Testing

### Unit Tests

Run unit tests with coverage:

```bash
npm test
npm run test:coverage
```

### Integration Tests

Deploy the infrastructure first, then run integration tests:

```bash
pulumi up
npm run test:integration
```

## Cleanup

Destroy all resources:

```bash
pulumi destroy
```

## Key Resources

- **VPC**: `analytics-vpc-${environmentSuffix}`
- **ECS Cluster**: `analytics-ecs-cluster-${environmentSuffix}`
- **Aurora Cluster**: `analytics-aurora-cluster-${environmentSuffix}`
- **S3 Buckets**:
  - Raw data: `analytics-raw-data-${environmentSuffix}`
  - Processed: `analytics-processed-data-${environmentSuffix}`
- **Kinesis Stream**: `analytics-stream-${environmentSuffix}`
- **KMS Key**: `analytics-kms-${environmentSuffix}`

## Stack Outputs

All critical resource identifiers are exported as stack outputs:

- VPC ID and CIDR
- Subnet IDs (public and private)
- ECS cluster ARN and name
- IAM role ARNs
- Aurora endpoints
- S3 bucket names and ARNs
- Kinesis stream ARN
- KMS key ARN

## Security Features

- All data encrypted at rest using customer-managed KMS keys
- All compute resources in private subnets
- Security groups with least-privilege access
- IAM roles with minimal required permissions
- VPC endpoints to avoid internet traffic
- Database credentials stored in Secrets Manager
- CloudWatch logs encrypted with KMS

## Cost Optimization

- Fargate Spot instances (up to 70% savings)
- Aurora Serverless v2 (scales to zero)
- No NAT gateways (using VPC endpoints)
- S3 lifecycle policies (Glacier transitions)
- CloudWatch log retention (30 days)

## Compliance

- 35-day backup retention for audit requirements
- KMS encryption for all sensitive data
- VPC flow logs and CloudWatch audit logs
- Security group restrictions
- Private subnet isolation
