# Payment Processing CI/CD Infrastructure

This Pulumi program creates a complete CI/CD pipeline infrastructure for a payment processing service.

## Architecture

- **VPC**: Custom VPC with private subnets across 2 availability zones
- **ECS**: Fargate-based container orchestration for payment services
- **RDS**: Multi-AZ PostgreSQL database with encryption
- **CodePipeline**: Automated CI/CD pipeline with CodeBuild
- **Secrets Manager**: Secure storage for database credentials
- **Security**: Security groups, IAM roles with least privilege
- **Monitoring**: CloudWatch logs and Container Insights

## Components

### Networking
- VPC with CIDR 10.0.0.0/16
- Private subnets in 2 availability zones
- Security groups for RDS and ECS

### Database
- RDS PostgreSQL 14.7 (Multi-AZ)
- Encryption at rest enabled
- Automated backups (7-day retention)
- Stored credentials in AWS Secrets Manager

### Container Orchestration
- ECS Fargate cluster
- Task definitions with CloudWatch logging
- Container Insights enabled

### CI/CD Pipeline
- CodePipeline for automated deployments
- CodeBuild for building Docker images
- S3 bucket for pipeline artifacts
- IAM roles with least privilege permissions

## Prerequisites

- Go 1.19 or later
- Pulumi CLI installed
- AWS credentials configured
- AWS CLI (optional, for manual testing)

## Configuration

The stack requires an `environmentSuffix` configuration value:

```bash
pulumi config set environmentSuffix <your-unique-suffix>
pulumi config set aws:region us-east-1
```

## Deployment

1. Install dependencies:
   ```bash
   go mod tidy
   ```

2. Preview changes:
   ```bash
   pulumi preview
   ```

3. Deploy:
   ```bash
   pulumi up
   ```

4. View outputs:
   ```bash
   pulumi stack output
   ```

## Testing

Run unit tests:
```bash
go test ./tests/unit/...
```

Run integration tests (requires deployment):
```bash
go test ./tests/integration/...
```

## Outputs

After deployment, the following outputs are available:

- `vpcId`: VPC ID for the payment infrastructure
- `ecsClusterName`: Name of the ECS cluster
- `dbInstanceEndpoint`: RDS database endpoint
- `dbSecretArn`: ARN of the database credentials secret
- `pipelineName`: Name of the CodePipeline
- `artifactBucketName`: S3 bucket name for pipeline artifacts
- `taskDefinitionArn`: ARN of the ECS task definition

## Security Considerations

- All database credentials are stored in AWS Secrets Manager
- RDS instance is not publicly accessible
- Encryption at rest enabled for RDS and S3
- Security groups restrict network access
- IAM roles follow least privilege principle

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                      AWS Cloud                       │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │              VPC (10.0.0.0/16)                 │ │
│  │                                                 │ │
│  │  ┌─────────────┐        ┌──────────────┐      │ │
│  │  │   Private   │        │   Private    │      │ │
│  │  │  Subnet AZ1 │        │  Subnet AZ2  │      │ │
│  │  │             │        │              │      │ │
│  │  │  ┌───────┐  │        │  ┌────────┐  │      │ │
│  │  │  │  ECS  │  │        │  │  RDS   │  │      │ │
│  │  │  │ Tasks │  │        │  │Multi-AZ│  │      │ │
│  │  │  └───────┘  │        │  └────────┘  │      │ │
│  │  └─────────────┘        └──────────────┘      │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ CodePipeline│→ │  CodeBuild   │→ │    S3     │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐│
│  │   Secrets Manager    │  │    CloudWatch Logs   ││
│  └──────────────────────┘  └──────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Support

For issues or questions, refer to:
- Pulumi Documentation: https://www.pulumi.com/docs/
- AWS ECS Documentation: https://docs.aws.amazon.com/ecs/
- AWS CodePipeline Documentation: https://docs.aws.amazon.com/codepipeline/
