# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

Complete CI/CD pipeline using AWS CodePipeline, CodeBuild, ECR, and S3, with Pulumi for infrastructure management.

## Architecture Overview

The infrastructure includes:
- S3 bucket for pipeline artifacts with versioning, lifecycle policies, and KMS encryption
- ECR repository for Docker images with scanning and lifecycle policies
- Two CodeBuild projects: Docker image builds and Pulumi deployments
- CodePipeline with 4 stages: Source, Build, Manual Approval, and Deploy
- IAM roles and policies following least privilege principles
- SNS topic for pipeline failure notifications
- All resources include environmentSuffix for environment isolation

## Key Implementation Details

### Proper Pulumi Output Handling
All Pulumi Output types are properly handled using `.apply()` and `pulumi.all()`:
- IAM policies use `pulumi.all([...resources])` to collect all Outputs before JSON.stringify()
- All Output values properly resolved before being used in configuration

### CodePipeline Configuration
- Uses `artifactStores` array (not singular `artifactStore`)
- For single-region pipelines, omit the `region` field (AWS requires this)
- `PollForSourceChanges` configuration must be string type, not boolean

### Resource Naming
All resources include environmentSuffix for isolation:
- S3: `pipeline-artifacts-${environmentSuffix}`
- ECR: `app-images-${environmentSuffix}`
- CodeBuild: `docker-build-${environmentSuffix}`, `pulumi-deploy-${environmentSuffix}`
- Pipeline: `cicd-pipeline-${environmentSuffix}`
- IAM roles: Include environmentSuffix for all roles
- SNS: `pipeline-notifications-${environmentSuffix}`

### Security Best Practices
- KMS encryption for S3 artifacts
- ECR image scanning on push
- Least privilege IAM policies with specific resource ARNs
- No wildcard permissions (except where AWS requires, like `ecr:GetAuthorizationToken`)

### Cost Optimization
- BUILD_GENERAL1_SMALL compute type for both CodeBuild projects
- S3 lifecycle rule deletes artifacts after 30 days
- ECR lifecycle policy keeps only last 10 images

## Deployment

Successfully deploys to AWS eu-north-1 region with all resources properly configured and integrated.