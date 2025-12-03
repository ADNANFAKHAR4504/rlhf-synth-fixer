# CI/CD Pipeline for Containerized Applications

This Pulumi TypeScript project deploys a complete CI/CD pipeline for containerized applications using AWS services.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores pipeline artifacts with versioning enabled
- **ECR Repository**: Private Docker image registry with lifecycle policies
- **CodeBuild Project**: Builds Docker images from GitHub source
- **CodePipeline**: Orchestrates the CI/CD workflow with three stages:
  - Source: Pulls code from GitHub
  - Build: Executes CodeBuild to create Docker images
  - Manual Approval: Requires human approval before deployment
- **CloudWatch Logs**: Captures build logs with 7-day retention
- **SNS Topic**: Sends notifications for pipeline state changes
- **IAM Roles**: Service roles with least privilege permissions

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- GitHub repository with Dockerfile
- GitHub OAuth token for source integration

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <unique-suffix>
```

## Deployment

Deploy the infrastructure:

```bash
npm install
pulumi up
```

## Outputs

After deployment, the stack outputs:

- `pipelineUrl`: URL to view the CodePipeline in AWS Console
- `ecrRepositoryUri`: URI for the ECR repository to push Docker images

## GitHub Configuration

Update the CodePipeline source stage configuration:

1. Replace `example-owner` with your GitHub username/organization
2. Replace `example-repo` with your repository name
3. Update `OAuthToken` with your GitHub personal access token
4. Adjust `Branch` if using a different default branch

## Buildspec

The CodeBuild project uses an inline buildspec that:

1. Authenticates with ECR
2. Builds a Docker image from the repository
3. Tags the image with commit hash and latest
4. Pushes images to ECR
5. Creates imagedefinitions.json for deployment

Ensure your repository contains a Dockerfile at the root.

## Cleanup

Remove all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable without manual intervention.

## Security

- IAM roles follow least privilege principle
- S3 bucket encrypted with AES256
- ECR images scanned on push
- CloudWatch Logs for audit trail
- All resources tagged for compliance tracking

## Cost Optimization

- CloudWatch Logs retention set to 7 days
- ECR lifecycle policy keeps only last 10 images
- Serverless and managed services minimize operational costs
- Small compute instance for CodeBuild

## Monitoring

- CloudWatch Logs capture all build output
- SNS notifications for pipeline state changes
- ECR scan findings available in AWS Console
- Pipeline execution history in CodePipeline

## Tagging

All resources are tagged with:
- Environment: ci
- Project: container-pipeline
