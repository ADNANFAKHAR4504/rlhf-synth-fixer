Hey team,

We need to build a robust CI/CD build system using AWS CodeBuild for our Node.js applications. The business wants a complete automated build pipeline that can handle artifact storage, build execution, logging, and notifications. I've been asked to create this infrastructure using Pulumi with TypeScript. The goal is to have a production-ready build system that our development teams can rely on for continuous integration and deployment workflows.

Our current challenge is that we don't have a centralized build system with proper artifact management and notification mechanisms. Teams are struggling with build visibility and artifact retention policies. We need a solution that provides clear build status notifications, automatic cleanup of old artifacts, and comprehensive logging for troubleshooting build failures.

## What we need to build

Create a complete CI/CD build infrastructure using **Pulumi with TypeScript** that deploys AWS CodeBuild with full artifact management, logging, and notification capabilities.

### Core Requirements

1. **Artifact Storage**
   - Create an S3 bucket for storing build artifacts
   - Enable versioning on the bucket for artifact history
   - Implement lifecycle rules to automatically delete artifacts older than 30 days
   - Configure appropriate bucket policies for CodeBuild access

2. **CodeBuild Project Configuration**
   - Set up a CodeBuild project optimized for Node.js 18 applications
   - Allocate 3GB memory and 2 vCPUs compute resources for builds
   - Use the standard AWS managed image for Node.js on Linux
   - Configure build timeout of 20 minutes
   - Set queued timeout of 5 minutes
   - Enable build badge generation for the project

3. **IAM Security Configuration**
   - Create IAM roles for CodeBuild with least privilege access
   - Grant permissions to read source code from S3
   - Allow writing build artifacts to the S3 bucket
   - Enable CloudWatch Logs access for build logging
   - Follow AWS security best practices for role trust relationships

4. **Logging Infrastructure**
   - Set up CloudWatch log groups for build logs
   - Configure 7-day retention period for logs
   - Ensure proper log stream organization for build runs
   - Enable structured logging for easier troubleshooting

5. **Notification System**
   - Create an SNS topic for build status notifications
   - Configure email subscription endpoint for the SNS topic
   - Set up CloudWatch Events rules to capture build state changes
   - Trigger notifications for SUCCEEDED, FAILED, and STOPPED build states
   - Ensure notifications include relevant build information

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodeBuild** for build project execution
- Use **S3** for artifact storage with versioning and lifecycle management
- Use **IAM** for security roles and policies
- Use **CloudWatch Logs** for build log management with retention
- Use **SNS** for notification delivery
- Use **CloudWatch Events** for build state change monitoring
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be tagged with Environment=Production and Team=DevOps

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names to ensure uniqueness
- All resources must be fully destroyable - use `DELETE` or `DESTROY` removal policies
- FORBIDDEN: Using `RETAIN` policies that prevent resource cleanup
- Resource naming pattern: `codebuild-project-{environmentSuffix}`, `artifacts-bucket-{environmentSuffix}`, etc.
- The environmentSuffix must be a configurable Pulumi input parameter

### Constraints

- Build environment must support Node.js 18 runtime
- Compute resources must be exactly 3GB memory and 2 vCPUs
- Artifact lifecycle must enforce 30-day deletion policy
- Log retention must be exactly 7 days
- Build timeout constraints: 20 minutes for build, 5 minutes for queue
- All resources must include both Environment=Production and Team=DevOps tags
- Email subscription for SNS requires confirmation after deployment
- CloudWatch Events must monitor all three build states: SUCCEEDED, FAILED, STOPPED

## Success Criteria

- **Functionality**: Complete CI/CD build system with artifact management, logging, and notifications
- **Performance**: Build resources allocated appropriately (3GB/2vCPUs) for Node.js 18 builds
- **Reliability**: Automatic artifact cleanup and log retention policies working correctly
- **Security**: IAM roles follow least privilege with proper trust relationships
- **Monitoring**: Build state changes trigger appropriate SNS notifications
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Tagging**: All resources tagged with Environment=Production and Team=DevOps
- **Destroyability**: All resources can be completely removed without manual intervention
- **Code Quality**: TypeScript code with proper type definitions, well-structured, and documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- S3 bucket with versioning and 30-day lifecycle rule
- CodeBuild project with Node.js 18 environment, 3GB/2vCPUs
- IAM roles and policies for CodeBuild service
- CloudWatch log groups with 7-day retention
- SNS topic with email subscription capability
- CloudWatch Events rules for build state monitoring
- Proper resource tagging and naming conventions
- Documentation with deployment instructions
- Export all relevant ARNs, bucket names, and project identifiers
