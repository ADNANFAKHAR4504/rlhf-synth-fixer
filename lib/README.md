# EduTech CI/CD Pipeline Infrastructure

This Pulumi Go program provisions a secure CI/CD pipeline infrastructure for an educational platform that handles sensitive student data in compliance with APEC CBPR requirements.

## Architecture Overview

The infrastructure implements a complete CI/CD pipeline with the following components:

### Networking
- VPC with CIDR 10.0.0.0/16
- Public subnets (10.0.1.0/24, 10.0.2.0/24) in us-east-1a and us-east-1b
- Private subnets (10.0.10.0/24, 10.0.11.0/24) in us-east-1a and us-east-1b
- Internet Gateway for public subnet connectivity
- Security groups for RDS, ElastiCache, and ECS with proper ingress/egress rules

### Data Storage
- **RDS Aurora PostgreSQL Cluster**
  - Engine: Aurora PostgreSQL 15.3
  - Instance class: db.t3.medium
  - Storage encrypted with KMS
  - Backup retention: 7 days
  - Multi-AZ deployment across private subnets
  - Credentials managed via Secrets Manager

### Caching Layer
- **ElastiCache Redis Replication Group**
  - Engine: Redis 7.0
  - Node type: cache.t3.micro
  - 2 cache clusters for high availability
  - At-rest and transit encryption enabled
  - Automatic failover and Multi-AZ enabled
  - KMS encryption

### Shared Storage
- **EFS File System**
  - Encrypted with KMS
  - Mount targets in both private subnets
  - Shared across ECS containers

### Container Orchestration
- **ECS Fargate Cluster**
  - Container Insights enabled
  - Fargate launch type (serverless)
  - 2 task replicas for high availability
  - Circuit breaker with automatic rollback
  - Blue-green deployment support (MinimumHealthyPercent: 100, MaximumPercent: 200)

- **ECR Repository**
  - Image scanning on push
  - KMS encryption
  - Stores container images

### API Layer
- **API Gateway REST API**
  - Regional endpoint
  - Cognito User Pools authorizer
  - Integrated with ECS backend

### CI/CD Pipeline
- **AWS CodePipeline**
  - Source stage: CodeCommit (edutech-repo/main)
  - Build stage: CodeBuild
  - Deploy stage: ECS deployment

- **AWS CodeBuild**
  - Docker image build and push to ECR
  - Automated testing
  - Environment variables injected

### Security
- **KMS Key**
  - Key rotation enabled
  - Used for RDS, ElastiCache, EFS, ECR, and S3 encryption

- **Secrets Manager**
  - Secure storage of RDS master password
  - KMS encrypted

- **IAM Roles**
  - ECS Task Execution Role
  - CodePipeline Service Role
  - CodeBuild Service Role
  - Least privilege policies

### Artifact Storage
- **S3 Bucket**
  - Pipeline artifacts storage
  - Server-side encryption (AES256)
  - Force destroy enabled for cleanup

## Prerequisites

- Pulumi CLI (v3.x or later)
- Go 1.23 or later
- AWS credentials configured
- AWS CLI (optional, for manual operations)

## Environment Variables

The infrastructure uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT_SUFFIX` | Unique identifier for the environment | `dev` |
| `AWS_REGION` | Target AWS region | `us-east-1` |
| `REPOSITORY` | Repository name for tagging | `unknown` |
| `COMMIT_AUTHOR` | Commit author for tagging | `unknown` |
| `PR_NUMBER` | Pull request number for tagging | `unknown` |
| `TEAM` | Team name for tagging | `unknown` |

## Deployment

1. **Install Dependencies**
   ```bash
   cd lib
   go mod download
   ```

2. **Set Environment Variables**
   ```bash
   export ENVIRONMENT_SUFFIX="dev"
   export AWS_REGION="us-east-1"
   ```

3. **Preview Changes**
   ```bash
   pulumi preview
   ```

4. **Deploy Infrastructure**
   ```bash
   pulumi up
   ```

5. **View Outputs**
   ```bash
   pulumi stack output
   ```

## Outputs

After successful deployment, the following outputs are available:

- `vpcId`: VPC identifier
- `rdsEndpoint`: RDS Aurora cluster endpoint for database connections
- `ecsClusterName`: ECS cluster name for application deployment
- `ecrRepositoryUrl`: ECR repository URL for pushing container images
- `apiGatewayUrl`: API Gateway REST API identifier
- `efsFileSystemId`: EFS file system ID for mounting

## Resource Naming Convention

All resources follow the naming pattern: `{resource-type}-{environmentSuffix}`

Examples:
- `vpc-dev`
- `rds-sg-dev`
- `student-db-cluster-dev`
- `session-redis-dev`
- `app-cluster-dev`
- `ci-cd-pipeline-dev`

## Security Features

### Encryption
- All data encrypted at rest using AWS KMS
- Transit encryption enabled for ElastiCache Redis
- S3 bucket encryption for pipeline artifacts
- ECR repository encryption

### Network Security
- VPC isolation with public/private subnet segregation
- Security groups with minimal required access
- No direct internet access for database and cache layers

### Access Control
- IAM roles with least privilege principle
- Service-specific assume role policies
- Granular policy permissions

### Credential Management
- RDS passwords stored in AWS Secrets Manager
- No hardcoded credentials in code
- KMS encryption for secrets

## Compliance

### APEC CBPR Requirements
- **Data Sovereignty**: All resources deployed in us-east-1 region
- **Encryption**: At-rest and in-transit encryption for sensitive data
- **Access Controls**: IAM policies and security groups
- **Audit Logging**: CloudWatch Logs for all services
- **Data Retention**: Configurable backup retention for RDS

## High Availability

- Multi-AZ deployment for RDS and ElastiCache
- ECS tasks distributed across multiple availability zones
- Automatic failover for database and cache
- Circuit breaker for ECS deployments

## Disaster Recovery

- RDS automated backups (7-day retention)
- Preferred backup window: 03:00-04:00 UTC
- Point-in-time recovery supported
- Infrastructure as Code for rapid recreation

## Cost Optimization

- Fargate serverless compute (pay per use)
- RDS Aurora with right-sized instances
- ElastiCache with cost-effective node types
- EFS for shared storage (pay per use)

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured for clean destruction:
- RDS: `SkipFinalSnapshot: true`
- S3: `ForceDestroy: true`
- KMS: `DeletionWindowInDays: 10`

## Troubleshooting

### Common Issues

1. **IAM Permission Errors**
   - Ensure AWS credentials have sufficient permissions
   - Required services: EC2, RDS, ElastiCache, ECS, ECR, CodePipeline, CodeBuild, IAM, KMS, Secrets Manager, S3, EFS, API Gateway

2. **Resource Quota Limits**
   - Check AWS service quotas for your account
   - Request limit increases if needed

3. **Network Connectivity**
   - Verify VPC and subnet configuration
   - Check security group rules
   - Ensure internet gateway is attached

4. **ECS Task Failures**
   - Check ECR repository has valid images
   - Verify IAM task execution role permissions
   - Review CloudWatch logs for error messages

## Monitoring

- ECS Container Insights enabled
- CloudWatch Logs for all services
- CloudWatch Metrics for resource utilization
- AWS X-Ray for distributed tracing (optional)

## Further Customization

To customize the infrastructure:

1. Modify resource parameters in `tap_stack.go`
2. Adjust security group rules as needed
3. Change instance sizes based on workload
4. Configure additional CodePipeline stages
5. Add CloudWatch alarms for monitoring

## Support

For issues or questions, refer to:
- AWS Documentation: https://docs.aws.amazon.com/
- Pulumi Documentation: https://www.pulumi.com/docs/
- Repository Issues: [Your Repository URL]

## License

[Your License Here]
