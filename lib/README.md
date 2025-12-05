# GitOps CI/CD Pipeline - Pulumi Go Implementation

Complete implementation of a multi-stage CI/CD pipeline using AWS CodePipeline, CodeBuild, ECR, and ECS Fargate.

## Architecture

This implementation creates:

1. **Source Control**: CodeCommit repository with branch-based deployments
2. **Container Registry**: ECR repository with lifecycle policies and KMS encryption
3. **Build Pipeline**: Multi-stage CodePipeline with source, build, scan, and deploy stages
4. **Build Automation**: CodeBuild projects using ARM64 Graviton2 instances
5. **Security**: Trivy container vulnerability scanning
6. **Orchestration**: ECS Fargate clusters for container hosting
7. **Load Balancing**: Application Load Balancers with target groups
8. **Monitoring**: EventBridge rules for pipeline notifications
9. **Approval Gates**: Manual approval before production deployments
10. **Security**: IAM roles with least-privilege policies
11. **Encryption**: KMS keys for artifacts and images
12. **Logging**: CloudWatch log groups with 7-day retention

## Requirements

- Pulumi CLI 3.x
- Go 1.19+
- AWS CLI configured
- AWS account with appropriate permissions

## Configuration

Set the environment suffix:

```bash
pulumi config set environmentSuffix dev
```

## Deployment

```bash
# Install dependencies
go mod download

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

- `repositoryCloneUrlHttp`: CodeCommit repository clone URL
- `ecrRepositoryUrl`: ECR repository URL for container images
- `pipelineName`: CodePipeline name
- `ecsClusterName`: ECS cluster name
- `albDnsName`: Application Load Balancer DNS name
- `snsTopicArn`: SNS topic ARN for notifications
- `kmsKeyId`: KMS key ID for encryption

## Pipeline Stages

1. **Source**: Pulls code from CodeCommit main branch
2. **Build**: Builds Docker image and pushes to ECR
3. **SecurityScan**: Runs Trivy vulnerability scan
4. **DeployDev**: Deploys to dev environment
5. **DeployStaging**: Deploys to staging environment
6. **ApprovalForProduction**: Manual approval gate
7. **DeployProduction**: Deploys to production environment

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- CodeCommit: `gitops-repo-{environmentSuffix}`
- ECR: `microservices-{environmentSuffix}`
- ECS Cluster: `microservices-cluster-{environmentSuffix}`
- ALB: `ms-alb-{environmentSuffix}`

## Security Features

- KMS encryption for pipeline artifacts and ECR images
- IAM roles with least-privilege policies
- Private subnets for ECS tasks
- Security groups with restricted access
- Container vulnerability scanning with Trivy
- Manual approval before production deployments

## Cost Optimization

- ARM64 Graviton2 instances for CodeBuild
- Fargate Spot for cost savings
- Lifecycle policies to manage ECR storage
- 7-day log retention

## Cleanup

```bash
pulumi destroy
```

All resources are created without deletion protection and can be fully destroyed.
