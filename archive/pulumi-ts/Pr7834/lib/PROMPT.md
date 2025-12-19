Hey team,

We need to build a complete CI/CD pipeline for an application deployment using AWS CodePipeline. I've been asked to create this in TypeScript using Pulumi. The business wants a professional multi-stage pipeline that automates everything from GitHub commits to Lambda deployment, with proper approval gates and notifications.

The current situation is that development teams are manually deploying applications, which is error-prone and doesn't scale. We need an automated pipeline that can handle the entire lifecycle - pulling code from GitHub, running tests, building artifacts, getting approval, and deploying to Lambda. The pipeline needs to be smart enough to trigger automatically when code changes and notify the team if anything goes wrong.

This is a critical infrastructure piece that multiple teams will rely on, so it needs to be production-ready with proper security, monitoring, and error handling. We're also running parallel testing environments, so everything needs to support unique naming through environment suffixes.

## What we need to build

Create a multi-stage CI/CD pipeline system using **Pulumi with TypeScript** for AWS. The pipeline will automate application deployment from source control through to Lambda execution.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for pipeline artifacts
   - Versioning enabled for audit trail
   - Encryption at rest enabled

2. **Pipeline Stages**
   - Source stage: Pull from GitHub repository
   - Build stage: Run npm tests and build application
   - Manual approval action between Build and Deploy
   - Deploy stage: Deploy application to Lambda

3. **Source Integration**
   - GitHub repository as source
   - OAuth token stored securely in AWS Secrets Manager
   - CloudWatch Events to trigger pipeline on code changes

4. **Build Configuration**
   - CodeBuild project for Build stage
   - Run npm tests
   - Build application artifacts
   - Proper build environment configuration

5. **Deployment**
   - Deploy application to Lambda using CodeBuild
   - Lambda function configuration
   - Proper execution permissions

6. **IAM Security**
   - CodePipeline service role with least privilege
   - CodeBuild service role with necessary permissions
   - Lambda execution role
   - Proper policy attachments for all services

7. **Monitoring and Notifications**
   - Pipeline failure notifications via SNS
   - Email subscription for alerts
   - CloudWatch integration for logging

8. **Resource Organization**
   - Tag all resources with Environment and Project tags
   - Consistent naming conventions

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodePipeline** for orchestration
- Use **AWS CodeBuild** for build and deploy stages
- Use **AWS S3** for artifact storage
- Use **AWS Lambda** for application deployment
- Use **AWS Secrets Manager** for GitHub OAuth token
- Use **AWS CloudWatch Events** for pipeline triggers
- Use **AWS SNS** for notifications
- Use **AWS IAM** for security and permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-${environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- S3 buckets: Enable force destroy or auto-delete objects
- Resource names: ALL named resources must include environmentSuffix variable
- Pattern: `${resourceName}-${environmentSuffix}`
- Example: `pipeline-artifacts-${environmentSuffix}`
- This ensures parallel deployments don't conflict

### Constraints

- Enable encryption at rest for S3 buckets (SSE-S3 minimum)
- Use IAM least privilege principles
- Enable CloudWatch logging where applicable
- All resources must be fully destroyable without manual intervention
- No DeletionProtection enabled
- Include proper error handling and logging
- Follow AWS best practices for security and reliability

## Success Criteria

- Functionality: Pipeline successfully pulls from GitHub, builds, and deploys to Lambda
- Automation: CloudWatch Events properly trigger pipeline on code changes
- Security: OAuth token stored in Secrets Manager, proper IAM roles with least privilege
- Reliability: Manual approval gate between Build and Deploy stages
- Monitoring: SNS notifications sent on pipeline failures
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be destroyed without manual intervention
- Code Quality: TypeScript code, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- AWS CodePipeline with three stages (Source, Build, Deploy)
- AWS CodeBuild projects for Build and Deploy stages
- S3 bucket for artifacts with versioning
- Lambda function for application deployment
- Secrets Manager secret for GitHub OAuth token
- CloudWatch Events rule for pipeline triggers
- SNS topic and email subscription for notifications
- IAM roles and policies for all services
- Unit tests for all components
- Documentation and deployment instructions
