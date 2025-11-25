# Financial Services Platform Infrastructure

This Pulumi TypeScript program establishes a foundational cloud environment for a financial services platform in AWS eu-central-1 region.

## Architecture

### VPC Infrastructure
- VPC with CIDR 10.0.0.0/16
- 3 Availability Zones for high availability
- Public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- Private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- Internet Gateway for public subnet internet access
- NAT Gateway (single instance for cost optimization) for private subnet outbound access
- VPC Endpoints for S3 and ECR to reduce data transfer costs

### Database Infrastructure
- RDS Aurora PostgreSQL Serverless v2 cluster
- Engine version: PostgreSQL 15.3
- Encryption at rest using AWS KMS customer-managed keys
- Automatic key rotation enabled
- 30-day backup retention period
- Serverless v2 scaling: 0.5-1 ACU for cost optimization
- Deployed in private subnets only
- CloudWatch logs export enabled

### Container Infrastructure
- ECR repository for container images
- Vulnerability scanning on push enabled
- Image lifecycle policy (retain last 10 images)
- AES256 encryption for images at rest

### Monitoring & Logging
- CloudWatch log groups for all services
- 30-day retention period for compliance
- Separate log groups for: database, containers, applications

### Security Features
- All data encrypted at rest with KMS
- Network isolation with private subnets
- Security groups with least-privilege access
- VPC endpoints to avoid internet traffic
- Vulnerability scanning for container images

### Compliance & Governance
- All resources tagged with: Environment, Project, CostCenter
- Resource names include environmentSuffix for multi-environment support
- Infrastructure is fully destroyable (no deletion protection)

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured with appropriate credentials
- TypeScript

## Environment Variables

Required:
- `ENVIRONMENT_SUFFIX`: Unique identifier for the deployment (e.g., 'dev', 'test-abc123')
- `AWS_REGION`: Target AWS region (defaults to 'eu-central-1')

Optional (for tagging):
- `REPOSITORY`: Repository name
- `COMMIT_AUTHOR`: Git commit author
- `PR_NUMBER`: Pull request number
- `TEAM`: Team name

## Deployment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="test-$(openssl rand -hex 4)"
export AWS_REGION="eu-central-1"

# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output

# Destroy infrastructure
pulumi destroy
```

## Outputs

The stack exports the following outputs:
- `vpcId`: VPC identifier
- `privateSubnetIds`: Array of private subnet IDs
- `publicSubnetIds`: Array of public subnet IDs
- `databaseClusterId`: RDS cluster identifier
- `databaseEndpoint`: RDS cluster endpoint for connections
- `ecrRepositoryUrl`: ECR repository URL for pushing container images

## Cost Optimization

This infrastructure uses several cost optimization strategies:
- Single NAT Gateway instead of one per AZ (~$32/month savings per NAT)
- Aurora Serverless v2 with minimal scaling (0.5-1 ACU)
- VPC Endpoints for S3 and ECR (no data transfer charges)
- ECR lifecycle policy to limit stored images
- 30-day log retention (not indefinite)

## Security Notes

- Database master password is temporary and should be rotated
- KMS keys have automatic rotation enabled
- All network traffic between services uses private subnets
- Container images are scanned for vulnerabilities before deployment

## Testing

Unit tests and integration tests are provided in the `test/` directory.

```bash
# Run unit tests
npm test

# Run integration tests (requires deployed stack)
npm run test:integration
```
