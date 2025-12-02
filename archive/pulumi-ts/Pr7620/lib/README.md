# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, S3, ECR, and supporting services.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores pipeline artifacts with versioning and 30-day lifecycle policy
- **ECR Repository**: Stores Docker images with image scanning and lifecycle policy to keep last 10 images
- **CodeBuild Project**: Builds Docker images, runs tests, and pushes to ECR
- **CodePipeline**: Three-stage pipeline (Source, Build, Manual Approval)
- **SNS Topic**: Notifications for pipeline events and manual approvals
- **SQS Queue**: Message queue for build events
- **Lambda Function**: Custom pipeline actions with DynamoDB logging
- **DynamoDB Table**: Pipeline state tracking
- **CloudWatch Events**: Automated pipeline triggering on commits

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 16+ and npm
- Docker (for building images)
- GitHub repository with OAuth token stored in AWS Secrets Manager

## Deployment

1. Set environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

2. Configure GitHub OAuth token in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-oauth-token" \
  --region us-east-1
```

3. Deploy the infrastructure:

```bash
pulumi up --yes
```

## Configuration

The infrastructure can be customized by setting environment variables:

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: dev)
- `AWS_REGION`: AWS region for deployment (default: us-east-1)

## Outputs

After deployment, the following outputs are available:

- `pipelineUrl`: AWS Console URL for the CodePipeline
- `ecrRepositoryUri`: ECR repository URI for Docker images
- `bucketName`: S3 bucket name for artifacts
- `snsTopicArn`: SNS topic ARN for notifications
- `sqsQueueUrl`: SQS queue URL for build events
- `lambdaFunctionArn`: Lambda function ARN for custom actions
- `dynamodbTableName`: DynamoDB table name for pipeline state

## Resource Naming

All resources include the `environmentSuffix` in their names:

- S3 Bucket: `pipeline-artifacts-{environmentSuffix}`
- ECR Repository: `app-images-{environmentSuffix}`
- CodeBuild Project: `app-build-{environmentSuffix}`
- CodePipeline: `app-pipeline-{environmentSuffix}`
- CloudWatch Rule: `pipeline-trigger-{environmentSuffix}`

## Security

- All S3 buckets use SSE-S3 encryption
- IAM roles follow least privilege principle
- ECR images are scanned on push
- Explicit deny policies prevent cross-region access

## Cleanup

To destroy all resources:

```bash
pulumi destroy --yes
```

All resources are configured with `forceDestroy: true` to ensure complete cleanup.

## Testing

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```
