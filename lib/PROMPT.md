# CI/CD Pipeline Infrastructure

Hey team,

We need to set up a complete CI/CD pipeline for a Node.js application using AWS native services. The business wants an automated workflow that takes code from commit to deployment with minimal manual intervention. I've been asked to build this using **Pulumi with TypeScript**.

The pipeline should handle the standard development workflow - when developers push code to the repository, it automatically builds the application, runs tests, and deploys the artifacts. We need this to be reliable, secure, and easy to maintain.

## What we need to build

Create a complete CI/CD pipeline using **Pulumi with TypeScript** that automates the build and deployment process for a Node.js application.

### Core Requirements

1. **Source Control**
   - Create a CodeCommit repository for source code storage
   - Set main branch as the default branch
   - Repository should be ready for immediate use

2. **Artifact Storage**
   - Set up an S3 bucket for build artifacts
   - Enable versioning to track artifact history
   - Configure proper encryption for security

3. **Build Environment**
   - Configure a CodeBuild project using aws/codebuild/standard:5.0 image
   - Support Node.js builds with standard workflow
   - Build spec should run: npm install, npm test, npm run build
   - Enable CloudWatch Logs with 30-day retention

4. **Pipeline Orchestration**
   - Create a CodePipeline with three stages:
     - Source stage: Pull from CodeCommit repository
     - Build stage: Execute CodeBuild project
     - Deploy stage: Store artifacts in S3
   - Ensure smooth integration between all stages

5. **Security and Permissions**
   - Implement IAM roles with least privilege access
   - Separate roles for CodePipeline and CodeBuild services
   - Grant only necessary permissions for each service

6. **Resource Management**
   - Tag all resources with Environment=Production and Project=NodeApp
   - Output the pipeline ARN, S3 bucket name, and repository clone URL
   - Follow AWS best practices for resource organization

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodeCommit** for source repository
- Use **AWS CodePipeline** for orchestration
- Use **AWS CodeBuild** for build execution
- Use **Amazon S3** for artifact storage
- Use **AWS IAM** for access control
- Use **Amazon CloudWatch Logs** for build logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL named resources MUST include environmentSuffix parameter
  - Format: `pipeline-${environmentSuffix}`, `bucket-${environmentSuffix}`, etc.
  - This prevents resource conflicts in CI/CD parallel deployments

- **Destroyability**: All resources must be fully deletable
  - DO NOT use `retainOnDelete` or retention policies
  - DO NOT set `protect` options to true
  - Resources must be cleanable for testing purposes

- **IAM Policies**: Use specific, least-privilege permissions
  - Avoid wildcard permissions where possible
  - Grant only actions required for each service

- **CloudWatch Logs**: Set appropriate retention periods
  - Use 30-day retention for build logs
  - Helps control storage costs

### Constraints

- Pipeline must support standard Node.js build workflow
- All resources must be properly tagged for organization
- IAM policies must follow least privilege principle
- Build logs must be retained for troubleshooting
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Pipeline successfully orchestrates Source -> Build -> Deploy workflow
- **Security**: IAM roles implement least privilege access patterns
- **Observability**: CloudWatch Logs capture build execution details
- **Integration**: All three stages properly connected and functional
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript code, well-structured, properly typed
- **Outputs**: Pipeline ARN, bucket name, and repository URL accessible

## What to deliver

- Complete Pulumi TypeScript implementation
- CodeCommit repository with main branch
- S3 bucket with versioning for artifacts
- CodeBuild project with standard Node.js build spec
- CodePipeline connecting all three stages
- IAM roles for CodePipeline and CodeBuild
- CloudWatch Logs configuration
- Comprehensive outputs for all key resources
- Unit tests for all infrastructure components
- Documentation and deployment instructions
