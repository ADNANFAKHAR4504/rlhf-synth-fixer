# CI/CD Pipeline Infrastructure

Automated CI/CD pipeline for containerized applications using Pulumi and AWS.

## Architecture

The infrastructure creates a complete CI/CD pipeline with the following components:

### Core Services
- **S3 Bucket**: Artifact storage with versioning and 30-day lifecycle policy
- **ECR Repository**: Container registry with image scanning and 10-image retention
- **CodeBuild**: Docker build automation with inline buildspec
- **CodePipeline**: 3-stage pipeline (Source, Build, Manual Approval)
- **SNS Topic**: Pipeline state change notifications
- **EventBridge**: Event routing for pipeline state changes

### Security Features
- IAM roles with least-privilege access for CodeBuild and CodePipeline
- S3 bucket public access blocked
- ECR image scanning on push
- S3 versioning enabled for audit trail

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- GitHub OAuth token for pipeline integration
- Node.js 18+ and npm

## Deployment

### 1. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="prod-123"
export GITHUB_OWNER="your-github-org"
export GITHUB_REPO="your-repository"
export GITHUB_BRANCH="main"
export GITHUB_TOKEN="ghp_your_token_here"
export AWS_REGION="us-east-1"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy Infrastructure

```bash
pulumi stack init prod
pulumi up
```

### 4. View Outputs

```bash
pulumi stack output artifactBucketName
pulumi stack output ecrRepositoryUrl
pulumi stack output pipelineName
pulumi stack output snsTopicArn
```

## Stack Outputs

- **artifactBucketName**: S3 bucket storing pipeline artifacts
- **ecrRepositoryUrl**: ECR repository URL for Docker images
- **pipelineName**: Name of the CodePipeline
- **snsTopicArn**: ARN of SNS topic for notifications

## Pipeline Workflow

1. **Source Stage**: Pulls code from GitHub on webhook trigger (main branch)
2. **Build Stage**: CodeBuild builds Docker image and pushes to ECR
3. **Deploy Stage**: Manual approval gate before deployment

## Resource Naming Convention

All resources include the `environmentSuffix` for uniqueness:
- S3 Bucket: `pipeline-artifacts-{suffix}`
- ECR Repository: `app-repository-{suffix}`
- CodeBuild Project: `docker-build-{suffix}`
- CodePipeline: `app-pipeline-{suffix}`
- SNS Topic: `pipeline-notifications-{suffix}`
- IAM Roles: `codebuild-role-{suffix}`, `codepipeline-role-{suffix}`

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

## Lifecycle Management

### S3 Artifacts
- Versioning: Enabled
- Lifecycle: Objects deleted after 30 days
- Destruction: forceDestroy enabled for testing

### ECR Images
- Scanning: On push
- Lifecycle: Retain only last 10 images
- Destruction: forceDelete enabled for testing

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: forceDestroy and forceDelete are enabled, so all artifacts and images will be deleted.

## Tagging

All resources are tagged with:
- `Environment`: production
- `ManagedBy`: pulumi

## Customization

Edit `bin/tap.ts` to customize:
- GitHub repository settings
- AWS region
- Environment suffix
- Default tags

Edit `lib/tap-stack.ts` to customize:
- S3 lifecycle duration
- ECR image retention count
- CodeBuild compute size
- Pipeline stages

## Security Best Practices

1. Store GitHub token in AWS Secrets Manager (not environment variables)
2. Enable MFA for manual approval actions
3. Review and audit IAM policies regularly
4. Monitor SNS notifications for pipeline failures
5. Enable AWS CloudTrail for audit logging

## Troubleshooting

### Pipeline Fails to Start
- Verify GitHub OAuth token is valid
- Check IAM permissions for CodePipeline
- Verify GitHub repository exists and is accessible

### Build Fails
- Check CodeBuild logs in CloudWatch
- Verify Dockerfile exists in repository root
- Check ECR permissions for CodeBuild role

### Manual Approval Not Working
- Verify SNS topic subscription
- Check email/notification settings
- Review IAM permissions for approval actions

## Support

For issues or questions, refer to:
- [Pulumi AWS Documentation](https://www.pulumi.com/docs/clouds/aws/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
