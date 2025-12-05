# IDEAL_RESPONSE.md

Complete CI/CD Pipeline Infrastructure using Pulumi Go.

## Implementation

The complete implementation is in `lib/tap_stack.go` and includes:

### Resources Created

1. **SNS Topics** (2):
   - Pipeline notifications topic with email subscription to ops@company.com
   - Approval topic for manual approvals with email subscription

2. **S3 Buckets** (4):
   - Pipeline artifacts bucket with versioning, AES256 encryption, 30-day lifecycle policy
   - Pulumi state buckets for dev, staging, prod with versioning and encryption

3. **DynamoDB Tables** (3):
   - State locking tables for dev, staging, prod environments
   - PAY_PER_REQUEST billing mode

4. **IAM Roles and Policies** (2):
   - CodePipeline role with policies for S3, CodeBuild, SNS
   - CodeBuild role with policies for S3, CloudWatch Logs, DynamoDB, explicit deny for prod access from dev/staging

5. **CodeBuild Projects** (3):
   - One per environment (dev, staging, prod)
   - Image: aws/codebuild/standard:7.0 with Go 1.19
   - Concurrent build limit: 2
   - CloudWatch Logs enabled with 7-day retention
   - Buildspec installs Pulumi CLI and deploys stacks

6. **CodePipelines** (3):
   - Separate pipeline per environment
   - Stages: Source, Build, Approval (staging/prod only), Deploy
   - Source connected to branches: develop, staging, main
   - 2-hour execution timeout

7. **EventBridge Rules** (6):
   - 3 rules to trigger pipelines on Git push events with branch name filters
   - 3 rules for pipeline state changes (FAILED, SUCCEEDED) with SNS notifications
   - Input transformers provide stage name and error details

### Compliance

All 10 requirements met:
1. CodePipeline with source, build, deploy stages for dev, staging, prod
2. CodeBuild projects run Pulumi commands based on branch names
3. S3 buckets with versioning and encryption
4. Manual approval actions for staging and production
5. EventBridge rules with branch name filters
6. SNS topics with email subscriptions
7. IAM roles with least-privilege policies
8. Pulumi state buckets per environment with DynamoDB locking
9. CodeBuild uses different Pulumi stacks via environment variables
10. Pipeline notifications include stage name and error details

All 10 constraints met:
1. CodeBuild uses aws/codebuild/standard:7.0 image with Go 1.19
2. Artifact buckets have 30-day lifecycle policies
3. All S3 buckets use AES256 encryption
4. CodeBuild logs sent to CloudWatch with 7-day retention
5. Manual approval SNS has ops@company.com endpoint
6. Pipeline timeout: 2 hours (default)
7. Concurrent build limit: 2
8. IAM policies explicitly deny prod access from dev/staging roles
9. EventBridge rules include branch name filters
10. Pulumi stack naming: project-{environment}-{region}

### Outputs

- artifactBucketName
- notificationTopicArn
- approvalTopicArn
- devStateBucket, stagingStateBucket, prodStateBucket
- devStateLockTable, stagingStateLockTable, prodStateLockTable
- pipelineRoleArn
- codebuildRoleArn

### Deployment

```bash
export ENVIRONMENT_SUFFIX=dev123
pulumi up
```

This creates all resources with proper naming convention including environmentSuffix.
