# CI/CD Pipeline Integration Infrastructure

Complete infrastructure for a fintech CI/CD pipeline with ECS Fargate, blue-green deployments, and automated testing.

## Architecture Overview

This infrastructure implements:

- **VPC**: 2 AZs with public/private subnets and NAT Gateway
- **ECR**: Container registry with lifecycle policy (keep last 10 images)
- **ECS Fargate**: Serverless container hosting with 2 tasks
- **Application Load Balancer**: Traffic management with health checks
- **CodeDeploy**: Blue-green deployment strategy
- **CodePipeline**: Automated pipeline with 5 stages
- **CodeBuild**: Separate projects for unit tests, integration tests, and Docker builds
- **EventBridge**: Pipeline triggering and notifications
- **SNS**: Email notifications for pipeline state changes
- **Parameter Store**: Configuration storage
- **S3**: Encrypted artifact storage with lifecycle rules

## Pipeline Stages

1. **Source**: S3-based source artifact retrieval
2. **Test**: Parallel unit and integration tests
3. **Build**: Docker image build and push to ECR
4. **Approval**: Manual approval gate
5. **Deploy**: Blue-green deployment via CodeDeploy

## Deployment

### Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured with appropriate credentials
- Docker (for local testing)

### Deploy Infrastructure

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: dev)
- `AWS_REGION`: Target region (default: us-east-1)

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Resource Naming

All resources include `environmentSuffix` for uniqueness:
- Pipeline: `cicd-pipeline-{environmentSuffix}`
- ECS Service: `app-service-{environmentSuffix}`
- ECR Repository: `app-repo-{environmentSuffix}`
- ALB: `app-alb-{environmentSuffix}`

## Security Features

- IAM roles with least privilege access
- S3 bucket encryption (AES256)
- ECR image scanning enabled
- VPC isolation with private subnets
- Security groups with minimal ingress rules
- No deletion protection (infrastructure is destroyable)

## Monitoring

- ECS Container Insights enabled
- CloudWatch Logs for all CodeBuild projects
- EventBridge rules for pipeline state changes
- SNS email notifications for success/failure

## Cost Optimization

- Fargate tasks: 256 CPU, 512 MB memory
- Single NAT Gateway
- S3 lifecycle policy (30-day expiration)
- ECR lifecycle policy (keep 10 images)
- CodeBuild: SMALL compute type

## Outputs

- `pipelineUrl`: CodePipeline console URL
- `ecsServiceName`: ECS service name
- `loadBalancerDns`: ALB DNS endpoint
- `ecrRepositoryUri`: ECR repository URI

## Cleanup

```bash
# Destroy all infrastructure
pulumi destroy

# Remove stack
pulumi stack rm
```

## Notes

- Manual approval required before production deployment
- Blue-green deployment with 5-minute rollback window
- All resources are fully destroyable
- Tags include: Environment, Project, ManagedBy
