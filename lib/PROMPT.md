Hey team,

We need to set up a complete CI/CD pipeline for our containerized Node.js application. The team has asked me to build this using Pulumi with TypeScript. The goal is to have an automated pipeline that handles everything from source control through to ECS deployment, with proper security and monitoring in place.

Right now, our developers are manually building Docker images and deploying to ECS, which is error-prone and time-consuming. We need a proper automated pipeline that can build, test, and deploy our application across different environments while maintaining security best practices and giving us visibility into the deployment process.

The business wants this pipeline to be production-ready with proper artifact storage, image lifecycle management, and CloudWatch logging so we can troubleshoot issues quickly. They've emphasized the need for least-privilege IAM permissions and proper resource tagging for cost tracking.

## What we need to build

Create a CI/CD pipeline infrastructure using **Pulumi with TypeScript** for deploying a containerized Node.js application to ECS.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for CodePipeline artifacts
   - Enable versioning on the bucket for audit trail
   - Proper encryption and access controls

2. **Container Image Management**
   - ECR repository for Docker images
   - Lifecycle policy to retain only the last 10 images
   - Automatic cleanup of old images to save costs

3. **Build Configuration**
   - CodeBuild project that builds Docker images from GitHub
   - Linux build environment with Docker support
   - Proper buildspec configuration for container builds

4. **Pipeline Stages**
   - Source stage connected to GitHub repository
   - Build stage using CodeBuild to create Docker images
   - Deploy stage pushing to ECS
   - Automated triggers on code commits

5. **Security and Permissions**
   - IAM roles for CodePipeline service with least-privilege access
   - IAM roles for CodeBuild service with minimum required permissions
   - Proper trust relationships and policy attachments
   - No overly permissive policies

6. **Logging and Monitoring**
   - CloudWatch Logs for CodeBuild output
   - 7-day log retention to balance cost and debugging needs
   - Proper log group naming and permissions

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodePipeline** for orchestration
- Use **AWS CodeBuild** for Docker image building
- Use **Amazon ECR** for container registry
- Use **Amazon S3** for artifact storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### CI/CD Workflow Requirements

The infrastructure will be deployed through a multi-stage CI/CD pipeline. Reference the provided `lib/ci-cd.yml` for patterns on:
- GitHub OIDC authentication for secure credential management
- Multi-environment deployment strategies
- Build stage with dependency installation and artifact generation
- Deploy stages with proper approval gates
- Notification hooks for deployment status updates

The infrastructure code should support:
- Multi-environment deployment with environment-specific parameters
- Compatibility with automated CI/CD deployment
- Proper IAM roles for cross-account access if needed

### Resource Tagging

All resources must be tagged with:
- Environment=production
- Project=nodejs-app

This is required for cost allocation and resource management.

### Constraints

- All IAM policies must follow least-privilege principle
- No hardcoded credentials or secrets
- CodeBuild must use managed Docker images
- S3 bucket must have versioning enabled
- ECR lifecycle policy must be automatic
- All resources must be destroyable with no Retain policies
- CloudWatch Logs must have defined retention periods
- Build environment must support Docker operations

### Deployment Requirements (CRITICAL)

- All resource names MUST include the **environmentSuffix** parameter for uniqueness
- Use naming pattern: `{resource-type}-${environmentSuffix}`
- All resources MUST have RemovalPolicy set to DESTROY or equivalent
- FORBIDDEN: Any Retain or Snapshot policies
- All outputs must be exported for consumption by other stacks

## Success Criteria

- **Functionality**: Pipeline successfully builds Docker images from GitHub and deploys to ECS
- **Performance**: Build times are reasonable with proper caching
- **Security**: All IAM roles use least-privilege permissions with no wildcards
- **Reliability**: Pipeline handles failures gracefully with proper error messages
- **Resource Naming**: All resources include environmentSuffix in their names
- **Logging**: CodeBuild logs are captured in CloudWatch with 7-day retention
- **Lifecycle Management**: ECR automatically removes images older than 10 versions
- **Code Quality**: TypeScript code is well-typed, tested, and documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- IAM roles with properly scoped policies for CodePipeline and CodeBuild
- S3 bucket with versioning for artifacts
- ECR repository with lifecycle policy
- CodeBuild project configured for Docker builds
- CodePipeline with Source, Build, and Deploy stages
- CloudWatch Logs group with retention policy
- Exported outputs for pipeline ARN and ECR repository URI
- Resource tags applied consistently across all resources
- Documentation on how the pipeline works and how to trigger builds
