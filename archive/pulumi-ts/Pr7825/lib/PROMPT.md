# AWS CodeBuild and CodeCommit CI/CD Pipeline with Enhanced Monitoring and Security

## Overview
Create a Pulumi TypeScript program to set up a comprehensive, production-ready CI/CD pipeline using AWS CodeBuild integrated with AWS CodeCommit, including advanced monitoring, notifications, and security features.

## Platform and Language
**IMPORTANT**: This infrastructure MUST be implemented using **Pulumi with TypeScript**.
- Platform: Pulumi
- Language: TypeScript
- All code must follow Pulumi TypeScript conventions and best practices

## Core Requirements

### 1. CodeCommit Repository
- Create an AWS CodeCommit repository for source code
- Repository name must include environmentSuffix: `app-repo-${environmentSuffix}`
- Configure appropriate tags (Environment=production, Team=devops)
- Enable repository event notifications

### 2. CodeBuild Project
- Create a CodeBuild project that triggers on commits to the main branch
- Project name must include environmentSuffix: `build-project-${environmentSuffix}`
- Build timeout: 15 minutes
- Compute type: BUILD_GENERAL1_SMALL
- **Note**: CodeCommit source does not support webhooks in CodeBuild. Use EventBridge or CloudWatch Events for triggering.

### 3. Build Environment
- Use standard Ubuntu Linux image
- Runtime: Node.js 18
- Configure environment variables as needed
- Enable build caching for faster builds

### 4. S3 Bucket for Build Artifacts
- Create S3 bucket with versioning enabled
- Bucket name must include environmentSuffix: `build-artifacts-${environmentSuffix}`
- Enable server-side encryption (SSE-S3 or SSE-KMS)
- Configure lifecycle policies for artifact retention (30 days)
- Enable public access blocking
- Add bucket policy for CodeBuild access only

### 5. IAM Roles and Policies
- Create IAM service role for CodeBuild
- Grant CodeBuild permissions to:
  - Access CodeCommit repository (pull source code)
  - Write to S3 artifacts bucket
  - Create and write CloudWatch Logs
  - Publish to SNS topic for notifications
- Follow least privilege principle
- Use managed policies where appropriate

### 6. CloudWatch Logs and Monitoring
- Configure CloudWatch Log Group for build output
- Log group name must include environmentSuffix: `/aws/codebuild/build-project-${environmentSuffix}`
- Retention period: 7 days
- Enable log streaming for build logs
- **NEW**: Create CloudWatch Alarms for:
  - Build failures (trigger after 2 consecutive failures)
  - Build duration exceeding threshold (>10 minutes)
  - Failed builds per day (>5 failures)

### 7. SNS Notifications
- **NEW**: Create SNS topic for build notifications
- Topic name must include environmentSuffix: `build-notifications-${environmentSuffix}`
- Configure notifications for:
  - Build started
  - Build succeeded
  - Build failed
  - Build stopped
- Add email subscription placeholder (configurable via stack parameters)

### 8. EventBridge Rule for Automated Triggers
- **NEW**: Create EventBridge rule to trigger builds on CodeCommit changes
- Target: CodeBuild project
- Event pattern: CodeCommit repository state change on main branch
- This replaces webhook functionality (which CodeCommit doesn't support)

### 9. KMS Encryption for Enhanced Security
- **NEW**: Create KMS key for encrypting:
  - S3 bucket artifacts
  - CloudWatch Logs
  - SNS messages
- Key alias must include environmentSuffix: `alias/codebuild-${environmentSuffix}`
- Configure key policy for CodeBuild, CloudWatch, and SNS access
- Enable automatic key rotation

### 10. Build Metrics and Dashboard
- **NEW**: Create CloudWatch Dashboard showing:
  - Build success rate (last 24 hours)
  - Build duration trends
  - Build failure count
  - Active builds count
- Dashboard name must include environmentSuffix: `codebuild-dashboard-${environmentSuffix}`

### 11. Resource Tagging
- ALL resources must be tagged with:
  - Environment: production
  - Team: devops
  - Project: ci-cd-pipeline
  - ManagedBy: pulumi
- Consistent tagging across all resources

## Configuration Parameters
- **environmentSuffix**: Must be used in all resource names to support multiple deployments
- **AWS Region**: Use default region (us-east-1) unless AWS_REGION file specifies otherwise
- **notificationEmail** (optional): Email address for SNS notifications

## Constraints and Best Practices
1. All resource names MUST include `environmentSuffix` to prevent conflicts
2. Use Pulumi outputs to expose key resource identifiers
3. Implement proper error handling and resource dependencies
4. Follow AWS security best practices (encryption at rest and in transit, least privilege IAM)
5. Ensure all resources are destroyable (no deletion protection or retain policies)
6. Use Pulumi ComponentResource pattern for clean resource organization
7. Configure appropriate timeouts and retries
8. Enable AWS service-level logging and monitoring
9. Use KMS encryption for sensitive data
10. Implement proper alarm thresholds based on expected build patterns

## Expected Outputs
The infrastructure should export:
- CodeCommit repository clone URL (HTTPS)
- CodeBuild project name
- CodeBuild project ARN
- S3 artifacts bucket name
- CloudWatch Log Group name
- IAM role ARN
- **NEW**: SNS topic ARN
- **NEW**: KMS key ARN
- **NEW**: EventBridge rule ARN
- **NEW**: CloudWatch Dashboard URL

## Testing Considerations
- Infrastructure should be fully deployable and destroyable
- Build project should trigger automatically on code commits via EventBridge
- Logs should be accessible in CloudWatch
- Artifacts should be stored in S3 with versioning and encryption
- Alarms should trigger appropriately on build failures
- SNS notifications should be sent for build events
- Dashboard should display real-time metrics

## Deliverables
1. Pulumi TypeScript infrastructure code in `lib/` directory
2. Unit tests with 100% coverage
3. Integration tests using deployed resources
4. All tests passing
5. Clean build and lint
6. Comprehensive monitoring and alerting
7. Production-ready security controls

## Security Features
- KMS encryption for all sensitive data
- S3 bucket public access blocking
- IAM least privilege policies
- CloudWatch Logs encryption
- SNS message encryption
- Secure artifact storage with lifecycle management

## Monitoring Features
- CloudWatch Alarms for build health
- SNS notifications for build events
- CloudWatch Dashboard for visualization
- Build metrics and trends
- Automated alerting on failures

## Advanced Features
- EventBridge integration for automated triggers (replaces webhooks)
- Build caching for performance optimization
- Lifecycle policies for cost optimization
- Comprehensive tagging for resource management
- Modular architecture with ComponentResource pattern
