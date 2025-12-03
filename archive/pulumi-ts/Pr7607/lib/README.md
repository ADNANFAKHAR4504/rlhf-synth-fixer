# CI/CD Pipeline Integration - Implementation Guide

## Overview

This implementation creates a complete CI/CD pipeline for containerized applications using AWS CodePipeline, CodeBuild, ECR, S3, and SNS with Pulumi TypeScript.

## Architecture

The infrastructure consists of:

- S3 Bucket: Stores pipeline artifacts with versioning and 30-day lifecycle
- ECR Repository: Stores Docker images with scanning and 10-image lifecycle
- CodeBuild (Docker): Builds Docker images using standard:7.0
- CodeBuild (Pulumi): Deploys infrastructure changes
- CodePipeline: Orchestrates Source, Build, Approval, and Deploy stages
- SNS Topic: Sends failure notifications
- IAM Roles: Least privilege access for all services

## Prerequisites

- Pulumi CLI 3.x installed
- Node.js 18+ installed
- AWS CLI configured with credentials
- AWS account access

## Deployment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Set AWS region
export AWS_REGION=us-east-1

# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Stack Outputs

- `pipelineUrl`: Console URL for CodePipeline
- `ecrRepositoryUri`: ECR repository URI
- `artifactBucketName`: S3 bucket for artifacts
- `dockerBuildProjectName`: Docker build project
- `pulumiDeployProjectName`: Pulumi deploy project
- `snsTopicArn`: SNS topic for notifications

## Pipeline Workflow

1. Source code uploaded to S3 bucket triggers pipeline
2. Docker build stage executes and pushes image to ECR
3. Manual approval required before deployment
4. Pulumi deployment stage runs infrastructure changes
5. SNS notifications sent on failure

## Testing

Upload source code to trigger the pipeline:

```bash
# Create test source zip
zip -r source.zip .

# Upload to S3
aws s3 cp source.zip s3://pipeline-artifacts-dev/source.zip

# Monitor pipeline
aws codepipeline get-pipeline-state --name cicd-pipeline-dev
```

## Resource Naming

All resources include the environmentSuffix parameter:
- S3: `pipeline-artifacts-${environmentSuffix}`
- ECR: `app-repository-${environmentSuffix}`
- CodeBuild: `docker-build-${environmentSuffix}`
- CodePipeline: `cicd-pipeline-${environmentSuffix}`

## Cleanup

```bash
# Destroy all resources
pulumi destroy

# Remove stack
pulumi stack rm dev
```

## Key Features

- Fully automated CI/CD pipeline
- Image scanning on ECR push
- Manual approval before deployment
- SNS notifications for failures
- Least privilege IAM policies
- All resources fully destroyable
- Environment-specific naming

## Constraints Met

- CodeBuild uses standard:7.0 image
- BUILD_GENERAL1_SMALL compute type
- AWS managed KMS encryption
- ECR lifecycle keeps 10 images
- No wildcard IAM permissions
- Manual approval before deploy
- 30-day artifact lifecycle

## Files

- `lib/cicd-pipeline-stack.ts`: Main pipeline infrastructure
- `lib/tap-stack.ts`: Stack orchestration
- `bin/tap.ts`: Entry point
- `lib/PROMPT.md`: Task requirements
- `lib/MODEL_RESPONSE.md`: Implementation documentation
