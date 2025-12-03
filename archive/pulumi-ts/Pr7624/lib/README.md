# CI/CD Pipeline Infrastructure

This Pulumi TypeScript infrastructure implements a complete CI/CD pipeline for containerized applications using AWS native services.

## Architecture Overview

The infrastructure includes:

- S3 Buckets: Artifact storage with versioning and encryption, CloudFront static assets
- ECR Repository: Container registry with vulnerability scanning and lifecycle policies
- CodeBuild: Docker image builds with custom buildspec.yml
- CodePipeline: Four-stage pipeline (Source, Build, Manual Approval, Deploy)
- ECS Fargate: Container deployment with task definitions
- CloudFront with Lambda@Edge: Content delivery with edge processing
- IAM Roles: Least-privilege access control
- SNS: Build failure notifications
- CloudWatch: Logs with 7-day retention
- Secrets Manager: GitHub OAuth token storage

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 16+ with npm
- AWS CLI configured with appropriate credentials
- GitHub repository with OAuth token

## Configuration

Create a Pulumi.dev.yaml file with the following configuration:

```yaml
config:
  aws:region: us-east-1
  tap:environmentSuffix: dev-12345
  tap:githubOwner: your-github-org
  tap:githubRepo: your-repo-name
  tap:githubBranch: main
  tap:githubToken:
    secure: <encrypted-token>
```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure GitHub token:
   ```bash
   pulumi config set --secret tap:githubToken <your-github-token>
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Review and confirm changes.

## Pipeline Workflow

1. Source Stage: Monitors GitHub repository for commits to main branch
2. Build Stage: CodeBuild builds Docker image and pushes to ECR
3. Approval Stage: Manual approval required before production deployment
4. Deploy Stage: ECS Fargate deploys new container version

## Resource Naming

All resources follow the naming convention: resource-type-environmentSuffix

Example: pipeline-artifacts-dev-12345, docker-build-dev-12345

## Monitoring

- CloudWatch Logs: /aws/codebuild/docker-build-environmentSuffix (7-day retention)
- SNS Topic: Notifications for pipeline failures
- CloudWatch Events: Monitors pipeline state changes

## Security Features

- All S3 buckets encrypted with AWS managed KMS keys
- ECR vulnerability scanning enabled on push
- IAM policies follow least-privilege principle
- No wildcard resources in policies
- Secrets stored in AWS Secrets Manager
- Lambda@Edge adds security headers

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured with forceDestroy: true for clean removal.

## Troubleshooting

### Build Failures

Check CloudWatch Logs: /aws/codebuild/docker-build-environmentSuffix

### Pipeline Stuck

Review manual approval stage in CodePipeline console

### ECR Push Issues

Verify CodeBuild role has ECR permissions and privileged mode enabled

## Cost Optimization

- CodeBuild uses BUILD_GENERAL1_SMALL compute type
- ECS Fargate uses minimal CPU (256) and memory (512)
- ECR lifecycle policy limits to 10 images
- S3 artifacts expire after 30 days
- CloudWatch Logs retained for 7 days only
