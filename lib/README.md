# Healthcare CI/CD Pipeline Infrastructure

Secure CI/CD pipeline infrastructure for deploying containerized healthcare applications to Amazon ECS with PostgreSQL database management, built using AWS CDK with TypeScript.

## Overview

This infrastructure provides a complete, production-ready CI/CD pipeline for HealthTech Solutions' patient management system. It includes:

- **VPC with Network Isolation**: Public and private subnets with NAT Gateway
- **ECS with Fargate**: Serverless container orchestration in private subnets
- **RDS PostgreSQL**: Managed database with encryption and automated backups
- **Secrets Manager**: Secure credential storage with automatic 30-day rotation
- **EFS**: Persistent shared storage for ECS tasks
- **CodePipeline**: Automated CI/CD with Source, Build, and Deploy stages
- **Application Load Balancer**: Internet-facing load balancer for ECS services
- **CloudWatch Logs**: Centralized logging and monitoring

## Architecture

```
Internet
    |
    v
[ALB (Public)]
    |
    v
[ECS Fargate Tasks (Private)] --> [EFS Storage]
    |                                    |
    v                                    v
[RDS PostgreSQL (Isolated)]      [Secrets Manager]

[CodePipeline] --> [CodeCommit] --> [CodeBuild] --> [ECS Deploy]
```

## Security Features

1. **Network Isolation**
   - ECS tasks run in private subnets with NO public IP addresses
   - Database in isolated subnets, accessible only from ECS
   - NAT Gateway for outbound internet access
   - Security groups with least privilege access

2. **Secrets Management**
   - All database credentials stored in AWS Secrets Manager
   - Automatic credential rotation every 30 days
   - No hardcoded secrets in code or environment variables

3. **Encryption**
   - RDS encryption at rest enabled
   - EFS encryption enabled
   - S3 bucket encryption for artifacts
   - EFS transit encryption enabled

## Prerequisites

- AWS Account with appropriate permissions
- AWS CDK CLI version 2.x or later
- Node.js 14.x or later
- AWS CLI configured with credentials
- Docker installed (for local testing)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Bootstrap CDK (if not already done):
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

## Deployment

### Deploy Infrastructure

Deploy the complete infrastructure stack:

```bash
# Deploy with environment suffix
cdk deploy -c environmentSuffix=dev

# Or use npm script
npm run deploy
```

### Synthesize CloudFormation Template

Generate CloudFormation template without deploying:

```bash
cdk synth -c environmentSuffix=dev
```

### View Differences

Compare deployed stack with current code:

```bash
cdk diff -c environmentSuffix=dev
```

## Configuration

### Environment Suffix

All resources include an environment suffix for parallel deployments. Set via CDK context:

```bash
cdk deploy -c environmentSuffix=prod
```

Or set in `cdk.context.json`:

```json
{
  "environmentSuffix": "prod"
}
```

### Region

Default region is `us-east-1`. To deploy to a different region:

```bash
export CDK_DEFAULT_REGION=us-west-2
cdk deploy
```

## Testing

### Unit Tests

Run unit tests for infrastructure code:

```bash
npm test
```

### Integration Tests

Integration tests require deployed infrastructure:

```bash
# Deploy first
npm run deploy

# Run integration tests
npm run test:integration
```

### Test Coverage

Generate test coverage report:

```bash
npm run test:coverage
```

## Infrastructure Components

### Network Stack

- VPC with 2 Availability Zones
- Public, Private, and Isolated subnets
- 1 NAT Gateway (cost-optimized)
- Internet Gateway
- Security groups for ALB, ECS, RDS, and EFS

### Database Stack

- RDS PostgreSQL 15.3 (db.t3.micro)
- 20GB GP3 storage with encryption
- Private isolated subnets
- Automated backups (7-day retention)
- Secrets Manager with 30-day rotation
- No deletion protection (test environment)

### Storage Stack

- EFS file system with encryption
- Access point for ECS tasks
- Lifecycle policy (transition after 7 days)
- Private subnets with NAT access

### ECS Stack

- ECS cluster with Container Insights
- Fargate task definition (0.5 vCPU, 1GB memory)
- 2 tasks for high availability
- Private subnets, no public IPs
- EFS volume mount at `/mnt/efs`
- Secrets from Secrets Manager
- CloudWatch Logs (7-day retention)
- Application Load Balancer (internet-facing)
- Target group with health checks

### Pipeline Stack

- CodeCommit repository
- S3 bucket for artifacts (encrypted)
- CodeBuild for Docker builds
- CodePipeline with 3 stages:
  1. Source (CodeCommit)
  2. Build (Docker)
  3. Deploy (ECS)

## Outputs

After deployment, the following outputs are available:

- `LoadBalancerDns`: ALB DNS name for accessing the application
- `DatabaseEndpoint`: RDS database endpoint
- `DatabaseSecretArn`: Secrets Manager ARN for database credentials
- `FileSystemId`: EFS file system ID
- `AccessPointId`: EFS access point ID
- `ClusterName`: ECS cluster name
- `ServiceName`: ECS service name
- `PipelineName`: CodePipeline name
- `RepositoryCloneUrlHttp`: CodeCommit repository URL

## Using the CI/CD Pipeline

1. **Clone the CodeCommit Repository**:
```bash
REPO_URL=$(aws cloudformation describe-stacks \
  --stack-name TapStack<environmentSuffix> \
  --query 'Stacks[0].Outputs[?OutputKey==`RepositoryCloneUrlHttp`].OutputValue' \
  --output text)

git clone $REPO_URL
```

2. **Add Application Code**:
```bash
cd <repository-name>
# Add your Dockerfile and application code
git add .
git commit -m "Initial application code"
git push origin main
```

3. **Pipeline Executes Automatically**:
   - Source stage pulls from CodeCommit
   - Build stage builds Docker image
   - Deploy stage updates ECS service

4. **Monitor Pipeline**:
```bash
aws codepipeline get-pipeline-state --name healthcare-pipeline-<environmentSuffix>
```

## Accessing the Application

Once deployed, access the application via the Load Balancer DNS:

```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name TapStack<environmentSuffix> \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDns`].OutputValue' \
  --output text)

curl http://$ALB_DNS
```

## Database Access

Database credentials are stored in Secrets Manager:

```bash
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name TapStack<environmentSuffix> \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
  --output text)

aws secretsmanager get-secret-value --secret-id $SECRET_ARN
```

## Cost Optimization

This infrastructure is optimized for cost:

- Single NAT Gateway (instead of per-AZ)
- T3.micro database instance
- Fargate tasks with minimal resources
- 7-day log retention
- EFS lifecycle policy

Estimated monthly cost: $150-200 (varies by usage)

## Cleanup

To destroy all resources:

```bash
cdk destroy -c environmentSuffix=dev
```

**Note**: All resources are configured as destroyable (no retention policies).

## Troubleshooting

### ECS Tasks Not Starting

Check CloudWatch Logs:
```bash
aws logs tail /ecs/healthcare-<environmentSuffix> --follow
```

### Database Connection Issues

1. Verify security groups allow ECS to RDS (port 5432)
2. Check Secrets Manager rotation status
3. Verify database is in "available" state

### Pipeline Failures

View pipeline execution details:
```bash
aws codepipeline get-pipeline-execution \
  --pipeline-name healthcare-pipeline-<environmentSuffix> \
  --pipeline-execution-id <execution-id>
```

## Security Best Practices

1. **Rotate Credentials**: Automatic 30-day rotation enabled
2. **Network Isolation**: ECS tasks in private subnets only
3. **Encryption**: All data encrypted at rest and in transit
4. **Least Privilege IAM**: Minimal permissions for each service
5. **Audit Logging**: CloudWatch Logs for all services

## Compliance

This infrastructure follows AWS Well-Architected Framework:

- **Security**: Encryption, network isolation, secrets management
- **Reliability**: Multi-AZ deployment, automated backups
- **Performance**: Fargate auto-scaling, EFS caching
- **Cost Optimization**: Right-sized resources, lifecycle policies
- **Operational Excellence**: CloudWatch monitoring, automated deployments

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review CDK synth output
3. Consult AWS documentation

## License

[Your License Here]
