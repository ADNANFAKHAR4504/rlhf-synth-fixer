# CI/CD Pipeline Integration for Pulumi Infrastructure Validation

This Pulumi TypeScript project implements a complete CI/CD pipeline for automated infrastructure validation using AWS native services.

## Overview

The pipeline automatically validates Pulumi infrastructure code on every commit to a CodeCommit repository, providing instant feedback through build notifications and detailed logging.

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   CodeCommit    │────────▶│  EventBridge │────────▶│   CodeBuild     │
│   Repository    │         │     Rule     │         │    Project      │
└─────────────────┘         └──────────────┘         └─────────────────┘
                                                               │
                                                               │
                                                               ▼
                            ┌──────────────────────────────────────────┐
                            │                                          │
                            ▼                                          ▼
                    ┌───────────────┐                         ┌──────────────┐
                    │  CloudWatch   │                         │   S3 Bucket  │
                    │   Log Group   │                         │  (Artifacts) │
                    └───────────────┘                         └──────────────┘
                            │
                            │ (on failure)
                            ▼
                    ┌───────────────┐
                    │   SNS Topic   │
                    │ (Notifications)│
                    └───────────────┘
```

## Components

### 1. CodeCommit Repository
- Central version control for Pulumi infrastructure code
- Supports both HTTP and SSH cloning
- Automatically triggers builds on push

### 2. CodeBuild Project
- Runs on every commit to validate configurations
- Uses official Pulumi Docker image with CLI pre-installed
- Executes `pulumi preview` and policy checks
- Small instance type (cost-effective for validation)

### 3. S3 Bucket
- Stores build artifacts and Pulumi state files
- Versioning enabled for state file history
- Encryption at rest using AES256
- Public access completely blocked

### 4. IAM Roles
- CodeBuild role with least-privilege permissions
- EventBridge role for triggering builds
- Scoped to specific resources only

### 5. CloudWatch Log Group
- Captures all build logs for debugging
- 7-day retention policy
- Integrated with CodeBuild for automatic logging

### 6. SNS Topic
- Sends notifications for failed builds
- Can be subscribed to email, SMS, Lambda, etc.
- Triggered automatically by buildspec

### 7. EventBridge Rule
- Monitors CodeCommit for repository changes
- Triggers CodeBuild on push events
- Filters for specific repository and event types

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed (version 3.x or later)
- Node.js 18+ and npm
- Pulumi access token

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

### Environment Variables

Set these environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX=dev        # Environment identifier (dev, staging, prod)
export AWS_REGION=us-east-1         # AWS region for deployment
export PULUMI_ACCESS_TOKEN=<token>  # Your Pulumi access token
```

### Pulumi Stack Configuration

Initialize a new stack or select an existing one:

```bash
pulumi stack init dev
# or
pulumi stack select dev
```

## Deployment

### Preview Changes

```bash
pulumi preview --stack dev
```

### Deploy Infrastructure

```bash
pulumi up --stack dev --yes
```

### View Outputs

```bash
pulumi stack output
```

## Post-Deployment Setup

### 1. Update Pulumi Access Token

The CodeBuild project is created with a placeholder token. Update it:

```bash
# Get the build project name
BUILD_PROJECT=$(pulumi stack output buildProjectName)

# Update the token in AWS Console or via AWS CLI
aws codebuild update-project \
  --name $BUILD_PROJECT \
  --environment "environmentVariables=[{name=PULUMI_ACCESS_TOKEN,value=YOUR_ACTUAL_TOKEN,type=PLAINTEXT}]"
```

### 2. Subscribe to SNS Notifications

```bash
# Get the SNS topic ARN
TOPIC_ARN=$(pulumi stack output notificationTopicArn)

# Subscribe your email
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription via email
```

### 3. Clone and Push to Repository

```bash
# Get the repository clone URL
REPO_URL=$(pulumi stack output repositoryCloneUrlHttp)

# Clone the repository
git clone $REPO_URL
cd <repository-name>

# Add your Pulumi code and push
git add .
git commit -m "Initial commit"
git push origin main
```

## Testing

### Run Unit Tests

```bash
npm run test:unit
```

### Run Integration Tests

Integration tests validate actual AWS resources:

```bash
# Ensure infrastructure is deployed first
pulumi up --stack dev --yes

# Run integration tests
npm run test:integration
```

## Monitoring

### View Build Logs

```bash
# Get log group name
LOG_GROUP=$(pulumi stack output logGroupName)

# View recent logs
aws logs tail $LOG_GROUP --follow
```

### Check Build Status

```bash
# Get build project name
BUILD_PROJECT=$(pulumi stack output buildProjectName)

# List recent builds
aws codebuild list-builds-for-project --project-name $BUILD_PROJECT

# Get build details
aws codebuild batch-get-builds --ids <build-id>
```

### Monitor SNS Notifications

Check your email or other subscribed endpoints for build failure notifications.

## Troubleshooting

### Build Fails with "Pulumi not found"

Verify the Docker image in CodeBuild project is set to `pulumi/pulumi:latest`.

### No Build Notifications

1. Check SNS topic subscription is confirmed
2. Verify SNS_TOPIC_ARN environment variable in CodeBuild
3. Check buildspec post_build phase for notification logic

### EventBridge Not Triggering Builds

1. Verify event rule is enabled
2. Check event pattern matches repository name exactly
3. Ensure EventBridge role has permission to start builds

### State File Conflicts

1. S3 versioning is enabled by default
2. Use `pulumi stack refresh` if needed
3. Check S3 bucket for state file versions

## Security Considerations

1. **IAM Permissions**: All roles follow least-privilege principle
2. **Encryption**: S3 bucket encrypted at rest with AES256
3. **Public Access**: S3 bucket blocks all public access
4. **Secrets**: Pulumi token should be updated to use AWS Secrets Manager for production
5. **Resource Scoping**: All IAM policies scoped to specific resource ARNs

## Cost Optimization

- Small CodeBuild instance (BUILD_GENERAL1_SMALL)
- 7-day log retention (reduces CloudWatch costs)
- Serverless architecture (no always-on resources)
- Build caching enabled (faster builds, lower costs)
- S3 lifecycle policies can be added for old artifacts

## Cleanup

To destroy all resources:

```bash
pulumi destroy --stack dev --yes
```

To remove the stack completely:

```bash
pulumi stack rm dev --yes
```

## Outputs

The stack exports these values:

- `repositoryCloneUrlHttp`: HTTP URL for cloning CodeCommit repository
- `repositoryCloneUrlSsh`: SSH URL for cloning CodeCommit repository
- `buildProjectName`: Name of the CodeBuild project
- `artifactBucketName`: Name of the S3 artifacts bucket
- `notificationTopicArn`: ARN of the SNS notification topic
- `logGroupName`: Name of the CloudWatch log group

## File Structure

```
.
├── bin/
│   └── tap.ts              # Pulumi entry point
├── lib/
│   ├── tap-stack.ts        # Main stack implementation
│   ├── PROMPT.md           # Original requirements
│   ├── IDEAL_RESPONSE.md   # Complete solution documentation
│   ├── MODEL_FAILURES.md   # Common failure patterns
│   └── README.md           # This file
├── test/
│   ├── tap-stack.unit.test.ts       # Unit tests
│   └── tap-stack.int.test.ts        # Integration tests
├── Pulumi.yaml             # Pulumi project configuration
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## Contributing

When modifying this infrastructure:

1. Update tests to reflect changes
2. Run `npm run build` to verify TypeScript compilation
3. Run `npm run test:unit` to verify unit tests pass
4. Deploy to a test environment first
5. Run `npm run test:integration` to verify deployment
6. Update documentation as needed

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review CloudWatch logs for build errors
3. Consult `lib/MODEL_FAILURES.md` for common issues
4. Review `lib/IDEAL_RESPONSE.md` for architecture details

## License

MIT

## Tags

All resources are tagged with:
- `Environment: CI`
- `Project: InfraValidation`

Additional tags from provider configuration:
- `Repository`: Git repository URL
- `Author`: Commit author
- `PRNumber`: Pull request number
- `Team`: Team name
- `CreatedAt`: Resource creation timestamp
