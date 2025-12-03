# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program provisions a complete CI/CD pipeline for a Node.js application on AWS.

## Architecture Overview

The infrastructure includes:

1. **S3 Buckets**
   - Artifact bucket with versioning and lifecycle rules (30-day expiration)
   - Deployment bucket with versioning
   - Both encrypted with AWS managed keys (AES256)

2. **CodeBuild Project**
   - Uses `aws/codebuild/standard:5.0` image
   - Environment variables: `NODE_ENV=production`, `BUILD_NUMBER`
   - Integrated with CloudWatch Logs (7-day retention)

3. **CodePipeline**
   - Three stages: Source (S3) → Build (CodeBuild) → Deploy (S3)
   - Automatically triggered on source artifact upload

4. **IAM Roles & Policies**
   - Least-privilege policies for CodeBuild and CodePipeline
   - EventBridge role for pipeline triggering

5. **CloudWatch & EventBridge**
   - Build failure notifications
   - S3 event-based pipeline triggering
   - Centralized logging with 7-day retention

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 20+ and npm installed
- AWS account with permissions for S3, CodeBuild, CodePipeline, IAM, CloudWatch, EventBridge

## Configuration

The infrastructure requires an `environmentSuffix` configuration parameter for resource naming:

```bash
pulumi config set environmentSuffix <your-suffix>
```

## Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set configuration**:
   ```bash
   pulumi config set environmentSuffix dev
   pulumi config set aws:region us-east-1
   ```

3. **Preview changes**:
   ```bash
   pulumi preview
   ```

4. **Deploy infrastructure**:
   ```bash
   pulumi up
   ```

## Testing the Pipeline

1. **Upload source artifact**:
   ```bash
   # Create a sample Node.js app
   mkdir sample-app && cd sample-app
   npm init -y
   echo "console.log('Hello from CI/CD');" > index.js

   # Create zip
   zip -r ../source.zip .
   cd ..

   # Upload to artifact bucket (triggers pipeline)
   aws s3 cp source.zip s3://artifact-bucket-<environmentSuffix>/source.zip
   ```

2. **Monitor pipeline**:
   ```bash
   aws codepipeline get-pipeline-state --name nodejs-pipeline-<environmentSuffix>
   ```

3. **Check build logs**:
   ```bash
   aws logs tail /aws/codebuild/nodejs-build-<environmentSuffix> --follow
   ```

4. **Verify deployment**:
   ```bash
   aws s3 ls s3://deploy-bucket-<environmentSuffix>/
   ```

## Resource Naming

All resources include the `environmentSuffix` parameter in their names:
- S3 Buckets: `artifact-bucket-${environmentSuffix}`, `deploy-bucket-${environmentSuffix}`
- CodeBuild Project: `nodejs-build-${environmentSuffix}`
- CodePipeline: `nodejs-pipeline-${environmentSuffix}`
- IAM Roles: `codebuild-role-${environmentSuffix}`, `codepipeline-role-${environmentSuffix}`
- CloudWatch Log Groups: `/aws/codebuild/nodejs-build-${environmentSuffix}`

## Outputs

The stack exports the following outputs:

- `artifactBucketName`: Name of the artifact storage bucket
- `deployBucketName`: Name of the deployment bucket
- `codeBuildProjectName`: Name of the CodeBuild project
- `codePipelineName`: Name of the CodePipeline
- `codeBuildLogGroupName`: CloudWatch log group for builds
- `codeBuildRoleArn`: ARN of CodeBuild IAM role
- `codePipelineRoleArn`: ARN of CodePipeline IAM role
- `eventRuleArn`: ARN of build failure event rule

## Security Features

- **Encryption**: All S3 buckets use server-side encryption (AES256)
- **Least Privilege**: IAM policies grant minimal required permissions
- **Logging**: Comprehensive CloudWatch logging with retention policies
- **Monitoring**: EventBridge rules for build failures and automated notifications

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Tags

All resources are tagged with:
- `Environment: production`
- `ManagedBy: pulumi`
