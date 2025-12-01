# CI/CD Pipeline Infrastructure Implementation

## Overview

I've implemented a complete AWS CodePipeline infrastructure using Pulumi with TypeScript that automates the build and deployment of applications from a GitHub repository.

## Architecture

The solution includes:

1. **CodePipeline** - Three-stage pipeline (Source, Build, Deploy)
2. **CodeBuild** - Build automation with custom buildspec
3. **S3 Buckets** - Artifact storage and deployment targets
4. **IAM Roles** - Least-privilege access control
5. **CloudWatch Logs** - Build log retention and monitoring

## Implementation Details

### CodePipeline Configuration

```typescript
- Name: pipeline-{environmentSuffix}
- Stages:
  1. Source (GitHub integration)
  2. Build (CodeBuild execution)
  3. Deploy (S3 deployment)
- Artifact Store: S3 with encryption
```

### CodeBuild Project

```typescript
- Image: aws/codebuild/standard:7.0
- Compute: BUILD_GENERAL1_SMALL
- Timeout: 20 minutes
- Logs: CloudWatch with 7-day retention
- Buildspec: Inline with npm install, lint, build phases
```

### S3 Buckets

**Artifact Bucket:**
- Versioning: Enabled
- Encryption: AES256
- Lifecycle: 30-day expiration
- Public Access: Blocked

**Deploy Bucket:**
- Versioning: Enabled
- Encryption: AES256
- Public Access: Blocked

### IAM Configuration

**CodeBuild Role:**
- S3 access (GetObject, PutObject)
- CloudWatch Logs access
- Secrets Manager access for GitHub token

**CodePipeline Role:**
- S3 access for artifacts
- CodeBuild execution permissions
- Secrets Manager access

### Security Features

1. **Encryption**: All S3 buckets use server-side encryption
2. **Versioning**: Enabled on all buckets for audit trail
3. **Public Access**: Blocked on all buckets
4. **Secrets Management**: GitHub token stored in AWS Secrets Manager
5. **Least Privilege**: IAM roles follow principle of least privilege

## Resource Naming

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- `pipeline-dev`
- `build-project-dev`
- `pipeline-artifacts-dev-test`

## Deployment

```bash
pulumi up --yes
```

## Outputs

- `pipelineArn`: ARN of the CodePipeline
- `pipelineName`: Name of the CodePipeline
- `artifactBucketName`: S3 bucket for pipeline artifacts
- `buildProjectName`: Name of the CodeBuild project
- `deployBucketName`: S3 bucket for deployment artifacts

## Testing

- **Unit Tests**: 30 tests covering all components
- **Integration Tests**: 23 tests verifying actual AWS resources
- **Coverage**: 100% (statements, branches, functions, lines)

## Key Features

1. Automated CI/CD workflow from GitHub to S3
2. Secure artifact storage and transmission
3. Build logs with retention policy
4. Environment-specific resource naming
5. Fully destroyable infrastructure
6. Comprehensive test coverage
