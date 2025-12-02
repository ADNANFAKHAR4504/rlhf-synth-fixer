# CI/CD Build System with AWS CodeBuild

This Pulumi TypeScript project deploys a complete CI/CD build system using AWS CodeBuild with artifact management, logging, and notifications.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores build artifacts with versioning and 30-day lifecycle policy
- **CodeBuild Project**: Configured for Node.js 18 applications with 3GB/2vCPUs
- **IAM Roles**: Secure access for CodeBuild to S3 and CloudWatch Logs
- **CloudWatch Logs**: Build logs with 7-day retention
- **SNS Topic**: Email notifications for build status changes
- **CloudWatch Events**: Monitors build states (SUCCEEDED, FAILED, STOPPED)

## Prerequisites

- Node.js 18+ and npm installed
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Configuration

The stack requires the following configuration:

```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set notificationEmail <your-email@example.com>
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Set required configuration:
```bash
pulumi config set environmentSuffix dev
pulumi config set notificationEmail team@example.com
```

3. Preview the deployment:
```bash
pulumi preview
```

4. Deploy the stack:
```bash
pulumi up
```

5. Confirm the SNS email subscription by clicking the link sent to the notification email.

## Resources Created

All resources are tagged with `Environment=Production` and `Team=DevOps`:

- S3 bucket: `codebuild-artifacts-{environmentSuffix}`
- CodeBuild project: `codebuild-project-{environmentSuffix}`
- CloudWatch log group: `/aws/codebuild/project-{environmentSuffix}`
- SNS topic: `codebuild-notifications-{environmentSuffix}`
- IAM roles: `codebuild-role-{environmentSuffix}`, `codebuild-events-role-{environmentSuffix}`

## Build Configuration

The CodeBuild project is configured with:
- Compute: BUILD_GENERAL1_MEDIUM (3GB memory, 2 vCPUs)
- Runtime: Node.js 18
- Timeout: 20 minutes build, 5 minutes queue
- Artifacts: Stored in S3 with ZIP packaging
- Logs: CloudWatch Logs with 7-day retention

## Notifications

Build state changes trigger SNS notifications for:
- SUCCEEDED: Build completed successfully
- FAILED: Build encountered errors
- STOPPED: Build was manually stopped

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable without retention policies.

## Outputs

After deployment, the following outputs are available:

- `artifactsBucketName`: S3 bucket name for artifacts
- `artifactsBucketArn`: S3 bucket ARN
- `codebuildProjectName`: CodeBuild project name
- `codebuildProjectArn`: CodeBuild project ARN
- `buildBadgeUrl`: Badge URL for build status
- `logGroupName`: CloudWatch log group name
- `snsTopicArn`: SNS topic ARN for notifications
- `codebuildRoleArn`: IAM role ARN for CodeBuild

## Testing

To start a build manually:

```bash
aws codebuild start-build --project-name codebuild-project-{environmentSuffix}
```

Monitor build logs:

```bash
aws logs tail /aws/codebuild/project-{environmentSuffix} --follow
```
