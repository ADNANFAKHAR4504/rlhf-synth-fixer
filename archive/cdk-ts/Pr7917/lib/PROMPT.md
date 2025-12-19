# CI/CD Pipeline for Node.js Application

Hey team,

We need to build a complete CI/CD pipeline for a Node.js application. I've been asked to create this infrastructure using **CDK with TypeScript**. The business wants an automated deployment pipeline that can handle source control, automated builds, and deployment to production with proper security controls.

We're dealing with a typical Node.js application that needs continuous integration and deployment. The pipeline should automatically trigger on code commits to the main branch, run tests, build the application, and deploy artifacts. This needs to be production-ready with proper logging, security, and cost optimization.

The infrastructure must support automated deployments while maintaining security through least-privilege IAM policies and proper environment configuration. All resources should be tagged appropriately for cost tracking and management.

## What we need to build

Create a CI/CD pipeline infrastructure using **CDK with TypeScript** that automates the deployment of a Node.js application.

### Core Requirements

1. **Source Control**
   - CodeCommit repository to store application source code
   - Configured to trigger pipeline on commits to main branch

2. **Build Infrastructure**
   - CodeBuild project with standard Node.js 18 runtime image
   - Execute npm install, npm test, and npm build commands
   - Store build logs in CloudWatch Logs with 7-day retention
   - Environment variable NODE_ENV set to 'production'

3. **Artifact Storage**
   - S3 bucket for build artifacts
   - Versioning enabled on the bucket
   - Proper lifecycle policies for cost optimization

4. **Pipeline Orchestration**
   - CodePipeline with three stages: Source, Build, and Deploy
   - Automatic triggering on commits to main branch
   - Proper stage transitions and artifact handling

5. **Security and Access Control**
   - IAM roles with least-privilege permissions for CodeBuild
   - IAM roles with least-privilege permissions for CodePipeline
   - Proper trust relationships and policy attachments

6. **Resource Tagging**
   - All resources tagged with Environment: 'production'
   - All resources tagged with Team: 'backend'

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use AWS CodeCommit for source repository
- Use AWS CodeBuild for build execution
- Use AWS CodePipeline for orchestration
- Use Amazon S3 for artifact storage
- Use CloudWatch Logs for build logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Use CDK Constructs pattern for modularity

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resource names must include an environmentSuffix parameter to ensure uniqueness across multiple deployments. This is mandatory for testing isolation.
- **Destroyability**: All resources must be destroyable. Use `RemovalPolicy.DESTROY` for S3 buckets and logs. Never use `RemovalPolicy.RETAIN` or `deletionProtection: true`.
- **CI/CD Integration**: Infrastructure should be compatible with GitHub Actions deployment (reference lib/ci-cd.yml for workflow structure)
- **Multi-Environment Support**: While this task deploys to production, the infrastructure should support environment parameters

### Constraints

- Node.js 18 runtime must be used for build environment
- CloudWatch log retention limited to 7 days for cost optimization
- S3 versioning enabled but no lifecycle rules needed beyond destroyability
- Pipeline must trigger automatically without manual intervention
- All IAM permissions must follow least-privilege principle
- All resources must be destroyable (no Retain policies)
- Include proper error handling in build specifications

## Success Criteria

- **Functionality**: Complete CI/CD pipeline that automatically builds and deploys on commit
- **Build Process**: Successfully executes npm install, npm test, npm build commands
- **Logging**: Build logs stored in CloudWatch with 7-day retention
- **Security**: Least-privilege IAM roles for all services
- **Artifact Management**: Build artifacts stored in versioned S3 bucket
- **Resource Tagging**: All resources tagged with Environment and Team
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: TypeScript code with proper type safety, well-tested, documented

## What to deliver

- Complete **CDK with TypeScript** implementation
- CodeCommit repository configuration
- CodeBuild project with Node.js 18 runtime
- CodePipeline with Source, Build, and Deploy stages
- S3 bucket for artifacts with versioning
- IAM roles and policies with least-privilege permissions
- CloudWatch Logs configuration with 7-day retention
- Unit tests for all components
- Documentation and deployment instructions
