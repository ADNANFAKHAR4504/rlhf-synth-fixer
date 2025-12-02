# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program creates a complete CI/CD pipeline for containerized Node.js applications using AWS CodePipeline, CodeBuild, ECR, and S3.

## Architecture

The pipeline consists of three stages:

1. **Source Stage**: Pulls code from GitHub repository
2. **Build Stage**: Builds Docker image using CodeBuild and pushes to ECR
3. **Deploy Stage**: Deploys the container to Amazon ECS

## Resources Created

- **S3 Bucket**: Stores CodePipeline artifacts with versioning enabled
- **ECR Repository**: Stores Docker images with lifecycle policy (retains last 10 images)
- **CodeBuild Project**: Builds Docker images with Linux environment
- **CodePipeline**: Orchestrates the CI/CD workflow
- **CloudWatch Logs**: Captures CodeBuild logs with 7-day retention
- **IAM Roles and Policies**: Least-privilege access for services

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 18+ and npm installed
- GitHub repository with Dockerfile
- Existing ECS cluster and service (for deployment stage)

## Configuration

Set the following Pulumi configuration values:

```bash
# Required
pulumi config set environmentSuffix <your-suffix>

# Optional GitHub configuration
pulumi config set githubOwner <github-org-or-user>
pulumi config set githubRepo <repository-name>
pulumi config set githubBranch <branch-name>
pulumi config set --secret githubToken <github-personal-access-token>
```

Or use environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev
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

## Outputs

- `pipelineArn`: ARN of the created CodePipeline
- `ecrRepositoryUri`: URI of the ECR repository for pushing images

## Pipeline Workflow

1. **Source**: Triggered by GitHub webhook or manual execution
2. **Build**:
   - Authenticates with ECR
   - Builds Docker image from source code
   - Tags image with commit hash and 'latest'
   - Pushes images to ECR
   - Generates imagedefinitions.json for ECS
3. **Deploy**:
   - Updates ECS service with new task definition
   - Uses imagedefinitions.json to specify new image

## Security Features

- IAM roles use least-privilege policies
- S3 bucket encryption enabled
- ECR image scanning on push
- No hardcoded credentials (uses IAM roles)
- CloudWatch Logs for audit trail

## Resource Tagging

All resources are tagged with:
- Environment: production
- Project: nodejs-app

## Lifecycle Management

- ECR automatically removes images older than the last 10 versions
- CloudWatch Logs retained for 7 days
- All resources can be destroyed with `pulumi destroy`

## Customization

To customize the buildspec or add additional stages:

1. Modify the buildspec in `lib/tap-stack.ts`
2. Add additional pipeline stages as needed
3. Update IAM policies for new permissions

## Troubleshooting

- **Build failures**: Check CloudWatch Logs at `/aws/codebuild/nodejs-app-{environmentSuffix}`
- **Permission errors**: Verify IAM role policies have required permissions
- **ECR authentication**: Ensure CodeBuild has privileged mode enabled for Docker
- **Pipeline stuck**: Check ECS cluster and service exist and are healthy

## Cost Optimization

- CodeBuild uses SMALL compute type (can be adjusted)
- ECR lifecycle policy removes old images automatically
- CloudWatch Logs retention set to 7 days
- S3 versioning enabled but can be combined with lifecycle rules

## Notes

- The pipeline expects a Dockerfile in the repository root
- ECS cluster and service must exist before deploying
- GitHub token should have repo access permissions
- Consider using GitHub Actions OIDC instead of personal access tokens for production
