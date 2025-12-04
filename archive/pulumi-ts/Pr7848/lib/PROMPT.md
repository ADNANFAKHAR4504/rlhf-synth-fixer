# CI/CD Pipeline Infrastructure

Hey team,

We need to build a comprehensive CI/CD pipeline infrastructure for our development teams. The business wants a fully automated workflow that can pull code from GitHub, build Docker images, run tests, and deploy to production with proper monitoring and notifications. I've been asked to create this using Pulumi with TypeScript.

Our current deployment process is manual and error-prone. Developers push code to GitHub, then we manually trigger builds, run tests, and deploy. This is causing delays in our release cycles and occasional production issues. We need an automated pipeline that handles everything from code commit to deployment notification.

The pipeline needs to be robust and include proper monitoring. When builds fail or deployments have issues, we need to know immediately. The business also wants proper artifact management with automatic cleanup to keep costs down.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** for automated software delivery on AWS.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for pipeline artifacts with versioning enabled
   - Lifecycle rules to delete artifacts older than 30 days
   - Encryption at rest for security compliance
   - Proper bucket policies for CodePipeline access

2. **Container Registry**
   - ECR repository for Docker image storage
   - Enable image scanning on push for vulnerability detection
   - Image tag immutability to prevent accidental overwrites
   - Lifecycle policies for automated image cleanup
   - Repository access policies for CodeBuild

3. **Build System**
   - CodeBuild project to build Docker images from GitHub
   - Execute unit tests during the build process
   - Push successful builds to ECR repository
   - Buildspec configuration for build steps
   - Environment variables for build customization
   - Service role with necessary permissions

4. **Pipeline Orchestration**
   - CodePipeline with three stages:
     - Source Stage: GitHub webhook integration for automatic triggering
     - Build Stage: Execute CodeBuild project
     - Deploy Stage: Trigger Lambda function for deployments
   - Configure stage transitions and actions
   - Use S3 bucket as artifact store
   - Service role with required permissions

5. **Identity and Access Management**
   - CodeBuild service role: ECR push, S3 access, CloudWatch logs
   - CodePipeline service role: S3, CodeBuild, Lambda invocation
   - Lambda execution role: CloudWatch logging, deployment actions
   - Follow AWS least-privilege principle for all policies
   - Proper trust relationships for each service

6. **Deployment Handler**
   - Lambda function to receive deployment notifications
   - Trigger downstream deployments or integrations
   - Log all deployment events to CloudWatch
   - Runtime configuration (Node.js or Python)
   - Environment variables for configuration

7. **Monitoring and Alerting**
   - CloudWatch Events to monitor pipeline state changes
   - Track STARTED, SUCCEEDED, FAILED states
   - Event patterns for pipeline state transitions
   - Integration with SNS for notifications

8. **Notification System**
   - SNS topic for pipeline failure notifications
   - Email subscriptions or webhook endpoints
   - Proper access policies for CloudWatch Events

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodePipeline** for pipeline orchestration
- Use **AWS CodeBuild** for building Docker images
- Use **Amazon ECR** for container registry
- Use **Amazon S3** for artifact storage
- Use **AWS Lambda** for deployment handling
- Use **Amazon CloudWatch** for monitoring
- Use **Amazon SNS** for notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-${environmentSuffix}`
- Deploy to **us-east-1** region
- Enable encryption at rest for S3 and ECR
- Implement least-privilege IAM policies with specific actions

### Constraints

- All IAM policies must follow least-privilege principle
- No wildcard permissions in IAM policies where specific actions can be defined
- Encryption at rest required for S3 bucket and ECR repository
- Logging must be enabled for all pipeline stages
- Pipeline must support parallel deployments using environmentSuffix
- All resources must be tagged consistently
- GitHub webhook integration required for automated triggers

### Deployment Requirements (CRITICAL)

- All resources must be cleanly destroyable with `pulumi destroy`
- S3 buckets MUST have `forceDestroy: true` to enable deletion with objects
- ECR repositories MUST allow force deletion
- NO resources with `retainOnDelete: true`
- NO resources with `protect: true`
- All resources must include environmentSuffix in names for parallel deployments
- Resource naming format: `{resource-type}-${environmentSuffix}`

## Success Criteria

- **Functionality**: Complete CI/CD pipeline from source to deployment
- **Automation**: GitHub commits automatically trigger pipeline execution
- **Testing**: Unit tests execute during build stage
- **Deployment**: Successful builds trigger deployment Lambda
- **Monitoring**: Pipeline state changes captured by CloudWatch Events
- **Notifications**: Pipeline failures send notifications via SNS
- **Security**: Least-privilege IAM policies, encryption at rest
- **Resource Naming**: All resources include environmentSuffix
- **Destroyability**: All resources cleanly removable with pulumi destroy
- **Code Quality**: TypeScript, well-structured, proper error handling

## What to deliver

- Complete Pulumi TypeScript implementation in lib/index.ts
- AWS CodePipeline with three stages (Source, Build, Deploy)
- AWS CodeBuild project with buildspec configuration
- Amazon ECR repository with scanning and lifecycle policies
- Amazon S3 bucket for artifacts with lifecycle rules
- AWS Lambda function for deployment notifications
- IAM roles with least-privilege policies for all services
- CloudWatch Events for pipeline monitoring
- SNS topic for failure notifications
- Resource tagging for all resources
- Stack outputs: pipeline URL, ECR URI, S3 bucket, Lambda ARN
- Proper TypeScript types and interfaces
- Error handling and logging
- Documentation in comments
