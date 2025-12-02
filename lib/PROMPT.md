Hey team,

We need to set up automated build infrastructure for our Node.js applications using AWS CodeBuild. The development team is looking for a reliable CI/CD solution that can automatically build their applications, store artifacts, and notify them when builds fail. I've been asked to create this using **Pulumi with TypeScript**.

The goal is to create a complete build pipeline that integrates with our existing workflows. We need artifact storage with versioning, configurable build environments, proper logging, and failure notifications so the team stays informed. The business wants this to be production-ready but also needs to ensure every deployment can be torn down cleanly after testing.

## What we need to build

Create a CodeBuild-based automated build infrastructure using **Pulumi with TypeScript** for Node.js applications.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for build artifacts with versioning enabled
   - Proper encryption and access controls
   - Resource names must include environmentSuffix for uniqueness

2. **CodeBuild Configuration**
   - Build project for Node.js applications
   - Use aws/codebuild/standard:6.0 Docker image
   - Configure with 3 GB memory and BUILD_GENERAL1_SMALL compute type
   - Set build timeout to 15 minutes
   - Pass environment variables: NODE_ENV (production) and BUILD_NUMBER (using CODEBUILD_BUILD_NUMBER)

3. **IAM Permissions**
   - Create IAM role for CodeBuild with least privilege access
   - Permissions for S3 artifact uploads
   - Permissions for CloudWatch Logs access
   - Follow AWS security best practices

4. **Logging and Monitoring**
   - Enable CloudWatch Logs for build output
   - Set log retention period to 7 days
   - Ensure logs are accessible for debugging

5. **Failure Notifications**
   - SNS topic for build notifications
   - CloudWatch Event Rule to detect build failures
   - Trigger SNS notifications when builds fail (FAILED status)

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS S3** for artifact storage
- Use **AWS CodeBuild** for build execution
- Use **AWS IAM** for permissions management
- Use **AWS CloudWatch Logs** for logging
- Use **AWS SNS** for notifications
- Use **AWS EventBridge** (CloudWatch Events) for failure detection
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region (check lib/AWS_REGION if present)

### Constraints

- All resources must be tagged with Environment: production and Team: devops
- All resources must be destroyable (no Retain policies or deletion protection)
- Use S3 bucket versioning for artifact history
- IAM roles must follow least privilege principle
- Build environment must be properly configured for Node.js workloads
- CloudWatch logs must be retained for 7 days only (cost optimization)

### Deployment Requirements (CRITICAL)

- **Resource Naming**: Every AWS resource name MUST include the environmentSuffix parameter to ensure uniqueness across parallel deployments. Use pattern: `{resource-type}-${environmentSuffix}`
- **Destroyability**: All resources MUST be fully destroyable. Do NOT use RemovalPolicy.RETAIN, deletion_protection: true, or any configuration that prevents resource deletion
- **S3 Buckets**: Must be destroyable including when containing objects
- **CloudWatch Logs**: Set retention period explicitly (7 days) to prevent default indefinite retention

## Success Criteria

- **Functionality**: Complete automated build pipeline with artifact storage, logging, and notifications
- **Configuration**: Build environment properly configured with correct Docker image, memory, and compute type
- **Permissions**: IAM roles configured with least privilege access to S3 and CloudWatch Logs
- **Monitoring**: CloudWatch Logs enabled with 7-day retention
- **Notifications**: SNS topic and EventBridge rule properly configured to detect and notify on build failures
- **Resource Naming**: All resources include environmentSuffix in their names
- **Destroyability**: All resources can be cleanly deleted without errors
- **Code Quality**: Well-structured TypeScript code with proper types and error handling

## What to deliver

- Complete **Pulumi TypeScript** implementation in lib/ directory
- S3 bucket with versioning for artifacts
- CodeBuild project with Node.js 6.0 standard image
- IAM role with S3 and CloudWatch Logs permissions
- CloudWatch Logs group with 7-day retention
- SNS topic for failure notifications
- EventBridge rule for build failure detection
- Unit tests for all components with 100% coverage
- Integration tests using deployed resources
- Documentation of architecture and deployment instructions
