# CI/CD Pipeline for Infrastructure Deployment

## Task Overview
Create a Pulumi TypeScript program to build a CI/CD pipeline for infrastructure deployment.

## Platform & Language Requirements
**CRITICAL: This task MUST be implemented using Pulumi with TypeScript**
- Platform: Pulumi
- Language: TypeScript
- AWS Provider: Use Pulumi's AWS Classic provider version 6.x or higher

## Business Context
A startup needs to implement automated infrastructure deployment for their containerized application. The team wants to use Pulumi for infrastructure management and requires a CI/CD pipeline that can automatically deploy infrastructure changes when code is pushed to their repository.

## Technical Requirements

The configuration must implement the following:

### 1. S3 Artifact Storage
- Create an S3 bucket to store pipeline artifacts with versioning enabled
- Implement lifecycle policy to delete objects after 30 days
- Enable encryption at rest
- Include `environmentSuffix` in bucket name for uniqueness

### 2. CodeBuild Project
- Set up a CodeBuild project that runs Pulumi commands to preview and deploy infrastructure
- Use Docker image with Pulumi CLI pre-installed
- Configure compute type as BUILD_GENERAL1_SMALL for cost optimization
- Set CodeBuild timeout to 20 minutes maximum
- Enable CloudWatch Logs for project execution

### 3. IAM Roles and Permissions
- Configure IAM roles for CodePipeline and CodeBuild with necessary permissions
- All IAM policies must follow least privilege principle with explicit resource ARNs
- Grant CodeBuild permissions to assume roles needed for Pulumi deployment
- Include permissions for S3, CodePipeline, CloudWatch Logs

### 4. CodePipeline Configuration
- Create a CodePipeline with source, build, and deploy stages
- Use GitHub as the source provider with OAuth connection
- Include manual approval stage before production deployment
- Configure pipeline to trigger on GitHub commits

### 5. Environment Variables
- Set up environment variables for Pulumi access token (reference from AWS Secrets Manager or Parameter Store)
- Configure stack configuration for different environments (staging/production)
- Include AWS region and other deployment parameters

### 6. Monitoring and Logging
- Enable CloudWatch Logs for CodeBuild project execution
- Configure log retention policies
- Set up CloudWatch metrics for pipeline success/failure

### 7. Resource Tagging
- Tag all resources with Environment and ManagedBy tags
- Include additional tags for cost allocation and tracking

## Expected Output
A fully functional CI/CD pipeline that:
1. Triggers on GitHub commits
2. Runs Pulumi preview in staging environment
3. Waits for manual approval
4. Executes Pulumi up for production deployment
5. Provides comprehensive logging and monitoring

## Critical Implementation Requirements

### Resource Naming Convention
**CRITICAL: ALL named resources MUST include `environmentSuffix`**

Example patterns:
```typescript
const artifactBucket = new aws.s3.Bucket(`pipeline-artifacts-${environmentSuffix}`, {
    bucket: `pipeline-artifacts-${environmentSuffix}`,
    // ...
});
```

### Destroyability Requirements
**CRITICAL: Infrastructure must be fully destroyable**
- No retention policies on resources
- S3 buckets must allow deletion (use lifecycle policies for cleanup)
- No DeletionProtection on any resources

### Security Best Practices
- Enable encryption for S3 buckets (SSE-S3 or SSE-KMS)
- Use IAM least privilege with explicit resource ARNs
- Store sensitive values in AWS Secrets Manager or Parameter Store
- Enable CloudWatch Logs with appropriate retention

### Cost Optimization
- CodeBuild compute type: BUILD_GENERAL1_SMALL
- S3 lifecycle policy: Delete artifacts after 30 days
- CloudWatch log retention: 7-14 days maximum
- Use appropriate timeout values to prevent runaway builds

## Constraints and Considerations

1. Use Pulumi's AWS Classic provider version 6.x or higher
2. CodeBuild compute type must be BUILD_GENERAL1_SMALL for cost optimization
3. Pipeline artifact bucket must have lifecycle policy to delete objects after 30 days
4. All IAM policies must follow least privilege principle with explicit resource ARNs
5. CodeBuild timeout must be set to 20 minutes maximum

## Testing Requirements

Your implementation should be testable with:
- Unit tests verifying resource configurations
- Integration tests validating pipeline execution (where applicable)
- 100% code coverage for infrastructure code

## Deployment Validation

After deployment, verify:
1. CodePipeline exists and can be triggered
2. CodeBuild project is properly configured
3. S3 artifact bucket exists with versioning and lifecycle policy
4. IAM roles have correct permissions
5. CloudWatch Logs are being generated
6. Manual approval stage functions correctly

## AWS Services Used
- AWS CodePipeline
- AWS CodeBuild
- Amazon S3
- AWS IAM
- Amazon CloudWatch Logs
- AWS Secrets Manager (for Pulumi token storage)

## Deliverables
1. Pulumi TypeScript infrastructure code in `lib/` directory
2. Unit tests with 100% coverage
3. Integration tests validating deployed infrastructure
4. Documentation of the pipeline workflow
5. All resources tagged appropriately
