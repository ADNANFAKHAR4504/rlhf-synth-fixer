Hey team,

We need to set up a complete CI/CD build infrastructure using AWS CodeBuild with all the bells and whistles - artifact storage, build notifications, and proper caching. The business wants a solid foundation for their Node.js applications that can handle multiple builds efficiently and keep the team informed about build status in real-time.

I've been asked to create this in TypeScript using Pulumi. The architecture needs to cover everything from storing build artifacts to notifying developers when builds succeed or fail. We're dealing with a GitHub-hosted Node.js application, so we'll need to configure the build environment appropriately with Node.js 18 runtime on AWS Linux 2.

The key challenge here is setting up the entire pipeline infrastructure - not just the build project itself, but also the storage layer for artifacts, proper IAM permissions, build caching for performance, and a notification system that actually works. We need CloudWatch integration for both logging and event-driven notifications.

## What we need to build

Create a CI/CD build infrastructure using **Pulumi with TypeScript** for AWS CodeBuild projects that includes artifact management, build caching, and comprehensive notifications.

### Core Requirements

1. **S3 Artifact Storage**
   - S3 bucket for storing build artifacts
   - Versioning enabled on the bucket
   - Lifecycle rules to automatically delete artifacts older than 30 days
   - Proper encryption and access controls

2. **CodeBuild Project Configuration**
   - CodeBuild project for a Node.js application
   - Source from GitHub repository (use placeholder URL)
   - Build environment using standard AWS Linux 2 image
   - Node.js 18 runtime configured
   - Build timeout set to 15 minutes
   - Compute type: BUILD_GENERAL1_SMALL

3. **IAM Permissions**
   - IAM role for CodeBuild service
   - Policies allowing CodeBuild to access S3 for artifacts
   - Policies allowing CodeBuild to write to CloudWatch Logs
   - Least privilege access - only what CodeBuild needs

4. **Build Caching**
   - S3-based build caching configured
   - Cache configuration to speed up subsequent builds
   - Proper cache paths and modes

5. **SNS Notification System**
   - SNS topic for build notifications
   - Email subscription endpoint configured
   - Topic policies allowing CloudWatch Events to publish

6. **CloudWatch Integration**
   - CloudWatch Events rule to capture build state changes
   - Events trigger SNS notifications on build success/failure
   - CloudWatch Logs group for build logs
   - Log retention set to 7 days

7. **Stack Outputs**
   - Export CodeBuild project name
   - Export S3 bucket name
   - Export SNS topic ARN
   - All outputs clearly labeled for easy reference

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **CodeBuild** for build orchestration
- Use **S3** for artifact storage and build caching
- Use **SNS** for build notifications
- Use **CloudWatch Logs** for log storage
- Use **CloudWatch Events** for build state change detection
- Use **IAM** for service permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names for parallel deployment support
- No Retain policies or DeletionProtection - all resources must be destroyable
- CodeBuild project must have `deletionConfig` with `deleteReports: true`
- S3 buckets must have `forceDestroy: true` to allow cleanup with artifacts present
- CloudWatch log groups must be explicitly created (don't rely on auto-creation)

### Constraints

- Build timeout must be exactly 15 minutes (not shorter, not longer)
- Compute type must be BUILD_GENERAL1_SMALL (cost-optimized for testing)
- Node.js runtime must be version 18 specifically
- Lifecycle rule must delete artifacts after exactly 30 days
- Log retention must be exactly 7 days
- All resources must be destroyable (no Retain policies)
- Include proper error handling for resource creation
- Use service-linked roles where appropriate

## Success Criteria

- **Functionality**: Complete CodeBuild infrastructure that can execute builds and store artifacts
- **Notifications**: Build state changes trigger SNS notifications correctly
- **Caching**: S3 caching configured to improve build performance
- **Logging**: CloudWatch Logs capture all build output with proper retention
- **Cleanup**: Lifecycle rules automatically manage artifact retention
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Permissions**: IAM roles follow least privilege with only required permissions
- **Code Quality**: TypeScript code, well-structured, properly typed, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- CodeBuild project with Node.js 18 on AWS Linux 2
- S3 bucket with versioning, lifecycle rules, and encryption
- IAM role with policies for S3 and CloudWatch Logs access
- S3-based build cache configuration
- SNS topic with email subscription for notifications
- CloudWatch Events rule for build state changes
- CloudWatch Logs group with 7-day retention
- Stack outputs for project name, bucket name, and topic ARN
- Unit tests for all components
- Documentation and deployment instructions
