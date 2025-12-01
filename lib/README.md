# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates a complete CI/CD pipeline for containerized applications on AWS.

## Architecture

The infrastructure includes:

1. **S3 Bucket** - Stores build artifacts with versioning enabled
2. **ECR Repository** - Hosts Docker images with lifecycle policy (retain last 10 images)
3. **CodeBuild Project** - Builds Docker images from source code and pushes to ECR
4. **CodePipeline** - Three-stage pipeline: Source (GitHub) → Build (CodeBuild) → Deploy (ECS)
5. **IAM Roles** - Least-privilege permissions for CodeBuild and CodePipeline
6. **CloudWatch Logs** - CodeBuild logs with 7-day retention
7. **SNS Topic** - Notifications for pipeline failures
8. **Tags** - All resources tagged with Environment=Production and ManagedBy=Pulumi

## Prerequisites

- Node.js 18 or later
- Pulumi CLI installed
- AWS credentials configured
- GitHub personal access token

## Environment Variables

Set the following environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"              # Deployment environment
export AWS_REGION="us-east-1"                # AWS region
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"      # GitHub personal access token
export GITHUB_REPO="owner/repo"              # GitHub repository
export GITHUB_BRANCH="main"                  # Branch to monitor
export ECS_CLUSTER_NAME="app-cluster"        # ECS cluster name
export ECS_SERVICE_NAME="app-service"        # ECS service name
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
```

3. Deploy the infrastructure:
```bash
pulumi up
```

4. Review and confirm the changes.

## Outputs

After deployment, the following outputs are available:

- `artifactBucketName` - S3 bucket name for build artifacts
- `ecrRepositoryUrl` - ECR repository URL for Docker images
- `pipelineName` - CodePipeline name
- `snsTopicArn` - SNS topic ARN for notifications

## buildspec.yml

Your source repository should include a `buildspec.yml` file:

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"app-container","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
```

## Clean Up

To destroy all resources:

```bash
pulumi destroy
```

## Resource Naming

All resources use the `environmentSuffix` parameter for naming:
- S3 Bucket: `cicd-artifacts-{environmentSuffix}`
- ECR Repository: `app-repository-{environmentSuffix}`
- CodeBuild Project: `app-build-{environmentSuffix}`
- CodePipeline: `app-pipeline-{environmentSuffix}`
- SNS Topic: `pipeline-notifications-{environmentSuffix}`
- CloudWatch Log Group: `/aws/codebuild/app-build-{environmentSuffix}`

## Security Features

- S3 bucket has public access blocked
- ECR images are scanned on push
- IAM roles follow least-privilege principles
- All resources are tagged for governance
- CloudWatch Logs have retention policies
- Pipeline failures trigger SNS notifications
