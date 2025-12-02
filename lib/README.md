# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program deploys a complete CI/CD pipeline using AWS CodePipeline for Node.js applications.

## Architecture

- **S3 Bucket**: Stores pipeline artifacts with versioning and encryption
- **ECR Repository**: Stores Docker images with lifecycle policies
- **CodeBuild Project**: Builds Docker images from buildspec.yml
- **CodePipeline**: Orchestrates Source → Build → Deploy workflow
- **CloudWatch Logs**: Captures build logs with 7-day retention
- **IAM Roles**: Properly scoped permissions for CodePipeline and CodeBuild

## Prerequisites

- AWS credentials configured
- Pulumi CLI installed
- Node.js 16+ and npm
- GitHub OAuth token for repository access

## Configuration

Set required configuration values:

```bash
pulumi config set environmentSuffix <unique-suffix>
pulumi config set githubOwner <github-owner>
pulumi config set githubRepo <github-repo>
pulumi config set githubBranch <branch-name>
pulumi config set ecsClusterName <ecs-cluster>
pulumi config set ecsServiceName <ecs-service>
```

## Deployment

```bash
npm install
pulumi up
```

## Outputs

- `pipelineArn`: ARN of the CodePipeline
- `codeBuildProjectArn`: ARN of the CodeBuild project
- `ecrRepositoryUri`: URI of the ECR repository
- `artifactBucketName`: Name of the S3 artifacts bucket
- `logGroupName`: Name of the CloudWatch log group

## Cleanup

```bash
pulumi destroy
```

All resources are configured to be destroyable without retention policies.
