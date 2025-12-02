# CodeBuild Infrastructure with Pulumi TypeScript

This infrastructure creates a complete CI/CD build system using AWS CodeBuild with artifact management, build caching, and notifications.

## Architecture

### Components

1. **S3 Artifact Bucket**
   - Stores build artifacts with versioning
   - 30-day lifecycle policy for automatic cleanup
   - Server-side encryption enabled

2. **CodeBuild Project**
   - Node.js 18 runtime on AWS Linux 2
   - 15-minute build timeout
   - BUILD_GENERAL1_SMALL compute type
   - GitHub source integration

3. **Build Caching**
   - S3-based caching for node_modules
   - Speeds up subsequent builds

4. **IAM Roles and Policies**
   - CodeBuild service role with S3 access
   - CloudWatch Logs write permissions
   - Events service role for SNS publishing

5. **CloudWatch Logs**
   - Dedicated log group for build logs
   - 7-day retention policy

6. **SNS Notifications**
   - Topic for build state notifications
   - Email subscription for alerts
   - CloudWatch Events integration

7. **CloudWatch Events**
   - Rule to capture build state changes
   - Triggers SNS on SUCCESS, FAILED, STOPPED

## Deployment

### Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js 18+ installed

### Deploy

```bash
# Install dependencies
npm install

# Set configuration
pulumi config set environmentSuffix <your-suffix>
pulumi config set notificationEmail <your-email>

# Deploy
pulumi up
```

### Outputs

After deployment, you'll receive:
- `codeBuildProjectName`: Name of the CodeBuild project
- `artifactBucketName`: S3 bucket for artifacts
- `snsTopicArn`: ARN of the notification topic

## Testing

Run unit tests:
```bash
npm test
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are configured with `forceDestroy` and no retention policies for easy cleanup.
