# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates an automated CI/CD pipeline for deploying containerized applications to ECS.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores pipeline artifacts with versioning enabled
- **ECR Repository**: Docker image registry with lifecycle policy (retains last 10 images)
- **CodeBuild Project**: Builds Docker images with inline buildspec
- **CodePipeline**: 3-stage pipeline (Source → Build → Deploy)
- **IAM Roles**: Least-privilege permissions for CodeBuild and CodePipeline

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured
- Node.js 14+ and npm
- GitHub personal access token (for pipeline source)

## Configuration

Set these configuration values:

```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set githubRepo <owner/repo>
pulumi config set githubBranch <branch-name>
pulumi config set --secret githubToken <your-github-token>
```

Or use environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev
```

## Deployment

Install dependencies:

```bash
npm install
```

Deploy the infrastructure:

```bash
pulumi up
```

## Outputs

After deployment:

- `artifactBucketName`: S3 bucket name for artifacts
- `ecrRepositoryUrl`: ECR repository URL for Docker images
- `pipelineName`: CodePipeline name

## Pipeline Flow

1. **Source Stage**: Triggers on GitHub commits
2. **Build Stage**: CodeBuild builds Docker image and pushes to ECR
3. **Deploy Stage**: Updates ECS service with new image

## Resource Naming

All resources include environmentSuffix for uniqueness:
- S3: `pipeline-artifacts-{environmentSuffix}`
- ECR: `container-registry-{environmentSuffix}`
- CodeBuild: `docker-build-{environmentSuffix}`
- CodePipeline: `ecs-pipeline-{environmentSuffix}`

## Tags

All resources tagged with:
- Environment: Production
- ManagedBy: Pulumi

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Security Considerations

- IAM roles follow least-privilege principle
- S3 bucket has server-side encryption
- ECR scanning enabled on push
- CodeBuild runs with necessary privileges for Docker

## Pipeline Stages

1. **Source**: Monitors GitHub repository for changes
2. **Build**: Builds Docker image, pushes to ECR, creates imagedefinitions.json
3. **Deploy**: Updates ECS service with new image

## Dependencies

The implementation has proper dependency management:
- CodeBuild depends on IAM policy attachment
- CodePipeline depends on IAM policy attachment
- All resources properly parented to TapStack component
