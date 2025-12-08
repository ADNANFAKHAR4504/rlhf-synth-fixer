# Streaming Media Processing Pipeline with CI/CD Integration

Hey team,

We need to build a complete CI/CD pipeline infrastructure for a Japanese streaming service that handles real-time media processing. The business wants automated deployments with proper security controls and compliance tracking. I've been asked to create this using **CloudFormation with JSON**.

The streaming platform needs a robust pipeline that can automatically build and deploy media processing components whenever code changes are pushed. Given the compliance requirements for handling media content in Japan, we need proper audit trails, encrypted artifacts, and multi-stage approval processes.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **CloudFormation with JSON** for a streaming media processing platform.

### Core Requirements

1. **Source Code Management**
   - AWS CodeCommit repository for storing application code
   - Main branch protection with automatic triggering
   - Repository should support media processing application code

2. **Build Pipeline**
   - AWS CodeBuild project for building media processing applications
   - Environment configured for media processing dependencies
   - CloudWatch Logs integration for build transparency
   - Automated testing and validation in build phase

3. **Deployment Orchestration**
   - AWS CodePipeline with multi-stage workflow
   - Source → Build → Deploy stages
   - S3-based deployment for processed artifacts
   - Automatic triggering on code commits to main branch

4. **Compliance and Security**
   - Encrypted S3 artifact storage (SSE-S3)
   - IAM roles following least privilege principle
   - Versioning enabled for audit trail
   - Lifecycle policies for artifact retention (30 days)
   - CloudWatch Logs for compliance monitoring

5. **Notifications and Monitoring**
   - SNS topic for pipeline state notifications
   - EventBridge rules for automated triggering
   - Filter notifications to only FAILED and SUCCEEDED states
   - Reduce alert fatigue for operations team

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS CodePipeline** for orchestration
- Use **AWS CodeCommit** for source repository
- Use **AWS CodeBuild** for build stage
- Use **Amazon S3** for artifact storage with encryption
- Use **Amazon SNS** for notifications
- Use **EventBridge** for automatic triggering
- Use **IAM roles** with least privilege policies
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-name-${EnvironmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (NO DeletionPolicy: Retain)
- S3 buckets must be deletable (no retention policies that prevent deletion)
- Include EnvironmentSuffix parameter in ALL resource names
- All IAM roles must have specific resource ARNs (no wildcards where possible)
- Pipeline must trigger automatically on git push (no manual execution needed)

### Constraints

- Must handle media processing workloads
- Support for compliance audit requirements
- Automated deployment workflow (no manual steps)
- Cost optimization through lifecycle policies
- Timeout protection for builds (max 15 minutes)
- Proper dependency management between resources

## Success Criteria

- **Functionality**: Complete three-stage pipeline (Source → Build → Deploy) that executes automatically
- **Security**: All artifacts encrypted, least privilege IAM roles, audit logging enabled
- **Compliance**: Versioning enabled, lifecycle management configured, CloudWatch Logs retained
- **Automation**: Automatic triggering on code commits via EventBridge
- **Resource Naming**: All resources include EnvironmentSuffix for multi-environment support
- **Code Quality**: Valid JSON CloudFormation template, proper resource dependencies
- **Notifications**: SNS notifications only for actionable states (success/failure)

## What to deliver

- Complete CloudFormation JSON template in lib/TapStack.json
- AWS CodeCommit repository resource
- AWS CodeBuild project with buildspec
- AWS CodePipeline with three stages
- S3 bucket for artifacts with encryption and versioning
- IAM roles for CodeBuild and CodePipeline with least privilege
- EventBridge rules for automatic triggering and notifications
- SNS topic for pipeline notifications
- Comprehensive outputs (repository URLs, pipeline name, bucket name, log groups)
- All resources properly configured for automatic, secure deployments
