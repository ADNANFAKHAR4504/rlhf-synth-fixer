# CI/CD Pipeline for Docker Image Builds and ECR Pushes

This Pulumi TypeScript infrastructure creates a complete CI/CD pipeline that automates Docker image builds and pushes them to Amazon ECR.

## Architecture

The pipeline consists of:
- **S3 Bucket**: Stores pipeline artifacts with versioning enabled
- **ECR Repository**: Stores Docker images with scanning and lifecycle policies
- **CodeBuild Project**: Builds Docker images from source code
- **CodePipeline**: Orchestrates the workflow with three stages:
  - Source: GitHub integration with webhook triggers
  - Build: CodeBuild execution
  - Deploy: Manual approval gate
- **IAM Roles**: Least privilege access for CodeBuild and CodePipeline
- **CloudWatch Logs**: Build logs with 7-day retention

## Prerequisites

- Node.js 18+ and npm installed
- Pulumi CLI installed
- AWS credentials configured
- GitHub OAuth token for repository access

## Configuration

Set up the required configuration:

```bash
# Set GitHub token (required)
pulumi config set --secret githubToken YOUR_GITHUB_TOKEN

# Set GitHub repository details
pulumi config set githubOwner your-org-or-username
pulumi config set githubRepo your-repo-name
pulumi config set githubBranch main
```

## Deployment

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy the stack
pulumi up

# View outputs
pulumi stack output
```

## Required Files in Your Repository

Your GitHub repository must include a `buildspec.yml` file at the root:

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG

artifacts:
  files:
    - '**/*'
```

## Outputs

After deployment, the stack exports:
- `artifactBucketArn`: S3 bucket ARN for artifacts
- `ecrRepositoryUrl`: ECR repository URL for Docker images
- `codeBuildProjectName`: CodeBuild project name
- `pipelineArn`: CodePipeline ARN
- `webhookUrl`: GitHub webhook URL

## Features

- Automated pipeline triggers on GitHub changes
- Image scanning on push for security vulnerabilities
- 7-day CloudWatch log retention
- Standard compute for cost efficiency
- Encryption at rest for S3 and ECR
- IAM roles with least privilege
- Fully destroyable stack (no retained resources)

## Cost Considerations

- S3: Minimal storage costs for artifacts
- ECR: Storage costs for Docker images (lifecycle policy keeps last 10)
- CodeBuild: Pay per build minute (standard small compute)
- CodePipeline: $1/month per active pipeline
- CloudWatch Logs: Minimal costs with 7-day retention

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured with `forceDestroy` enabled, so the stack will clean up completely without manual intervention.

## Security

- All IAM policies follow least privilege principle
- S3 bucket has public access blocked
- ECR repository is private
- GitHub token stored as Pulumi secret
- Encryption at rest enabled for S3 and ECR

## Troubleshooting

Check CloudWatch Logs for build failures:
```bash
aws logs tail /aws/codebuild/docker-build-dev --follow
```

View CodeBuild project details:
```bash
pulumi stack output codeBuildProjectName
aws codebuild batch-get-projects --names $(pulumi stack output codeBuildProjectName)
```

View pipeline execution status:
```bash
pulumi stack output pipelineName
aws codepipeline get-pipeline-state --name $(pulumi stack output pipelineName)
```
