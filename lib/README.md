# Fintech Loan Processing Infrastructure

This Pulumi TypeScript project deploys a production-grade, secure infrastructure for a fintech loan processing application on AWS.

## Architecture

The infrastructure includes:

### Networking
- Multi-AZ VPC with CIDR 10.0.0.0/16
- 3 Public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 Private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- Internet Gateway for public subnet connectivity
- 3 NAT Gateways (one per AZ) for private subnet outbound connectivity
- Route tables for public and private subnets

### Compute
- ECS Fargate cluster with Container Insights enabled
- ECS Service running 3 tasks minimum
- Auto-scaling (3-10 tasks) based on CPU utilization (target 70%)
- Task definition: 256 CPU units, 512MB memory

### Database
- RDS PostgreSQL 15.4 Multi-AZ instance
- db.t3.micro instance class
- 20GB GP3 storage with encryption at rest
- Customer-managed KMS key encryption
- 7-day automated backup retention
- Backup window: 03:00-04:00 UTC
- Maintenance window: Sunday 04:00-05:00 UTC

### Load Balancing
- Application Load Balancer in public subnets
- Target group with health checks
- HTTP listener on port 80
- Access logs stored in S3 with lifecycle policies

### Security
- Security groups with least-privilege rules:
  - ALB: Allows HTTP (80) and HTTPS (443) from internet
  - ECS: Allows traffic from ALB only
  - RDS: Allows PostgreSQL (5432) from ECS only
- IAM roles with minimal required permissions
- KMS encryption for RDS
- S3 bucket versioning enabled

### Monitoring & Logging
- CloudWatch Log Group for ECS containers (/ecs/fintech/loan-processing)
- 7-day log retention
- CloudWatch alarms for high CPU (ECS and RDS)
- Container Insights for ECS cluster

### Storage
- S3 bucket for ALB access logs
- Lifecycle policy: Transition to Glacier after 90 days, delete after 7 years
- Bucket versioning enabled

## Prerequisites

- Node.js 18+ installed
- Pulumi CLI 3.x installed
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Configuration

The infrastructure uses environment variables for configuration:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource names (default: 'dev')
- `AWS_REGION`: Target AWS region (default: 'us-east-1')
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Commit author for tagging
- `PR_NUMBER`: PR number for tagging
- `TEAM`: Team name for tagging

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export ENVIRONMENT_SUFFIX="your-unique-suffix"
   export AWS_REGION="us-east-1"
   ```

3. Preview changes:
   ```bash
   pulumi preview
   ```

4. Deploy infrastructure:
   ```bash
   pulumi up
   ```

## Outputs

The stack exports the following outputs:

- `vpcId`: VPC ID
- `albDnsName`: Application Load Balancer DNS name
- `ecsClusterName`: ECS Cluster name
- `rdsEndpoint`: RDS instance endpoint
- `albLogsBucket`: S3 bucket name for ALB logs
- `ecsLogGroup`: CloudWatch Log Group name
- `kmsKeyId`: KMS key ID for encryption

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests (requires deployed infrastructure):
```bash
npm run test:integration
```

## Resource Naming Convention

All resources include the `environmentSuffix` for uniqueness:
- Format: `{resource-name}-${environmentSuffix}`
- Example: `fintech-alb-dev`, `fintech-cluster-staging`

## Compliance Features

- **Encryption at Rest**: RDS encrypted with customer-managed KMS key
- **Encryption in Transit**: Security groups enforce secure communication
- **Audit Logging**: CloudWatch logs with 7-day retention
- **Access Logs**: ALB logs stored in S3 with 7-year retention
- **Multi-AZ Deployment**: High availability across 3 availability zones
- **Least Privilege**: IAM roles with minimal required permissions
- **Network Isolation**: Private subnets for application and database layers

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

**Note**: All resources are configured with `forceDestroy: true` and `deletionProtection: false` to ensure clean cleanup in CI/CD environments.

## Cost Optimization

- RDS instance uses db.t3.micro (smallest production-viable instance)
- ECS Fargate auto-scales down to 3 tasks during low traffic
- S3 lifecycle policy transitions old logs to Glacier
- CloudWatch logs have 7-day retention

## Security Considerations

- Replace the placeholder RDS password with AWS Secrets Manager
- Replace the nginx placeholder image with your actual application container
- Consider adding HTTPS listener with ACM certificate for production
- Review and adjust security group rules based on specific requirements
- Enable MFA Delete on S3 bucket for production environments

## Known Limitations

- NAT Gateways in all 3 AZs increase costs (~$96/month total)
- RDS Multi-AZ increases costs but provides high availability
- Current implementation uses HTTP; HTTPS requires ACM certificate
- Database password is hardcoded; use Secrets Manager for production

## Support

For issues or questions, refer to:
- Pulumi documentation: https://www.pulumi.com/docs/
- AWS documentation: https://docs.aws.amazon.com/
