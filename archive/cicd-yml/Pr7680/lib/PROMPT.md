Hey team,

We need to set up a complete CI/CD pipeline for our Node.js application that builds Docker images and deploys them to ECS. I've been asked to create this using Pulumi with TypeScript. The business wants automated deployments triggered by GitHub commits, with proper artifact management and logging.

The pipeline needs to handle the full workflow from source code to production deployment. We're looking at CodePipeline for orchestration, CodeBuild for building Docker images, and ECR for image storage. Make sure to include a unique environment suffix in all resource names to avoid conflicts across different environments.

## What we need to build

Create a CI/CD pipeline infrastructure using **Pulumi with TypeScript** for automated application deployments.

The infrastructure will be deployed through a multi-stage CI/CD pipeline as shown in the provided `lib/ci-cd.yml` reference. This demonstrates how infrastructure can integrate with automated deployment workflows using GitHub Actions with OIDC authentication and security scanning.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts
   - Enable versioning to track artifact history
   - Configure encryption using AWS managed S3 key for artifact store

2. **Docker Image Building**
   - CodeBuild project that builds Docker images from source
   - Read build instructions from buildspec.yml file in the repository
   - Use BUILD_GENERAL1_SMALL compute type for cost efficiency
   - Enable CloudWatch Logs with 7-day retention for build logs

3. **Pipeline Configuration**
   - CodePipeline with three distinct stages:
     - Source stage: Pull code from GitHub repository
     - Build stage: Use CodeBuild to create Docker images
     - Deploy stage: Push images to ECS for deployment
   - Configure GitHub webhook integration for automatic pipeline triggers on commits

4. **Container Registry**
   - ECR repository for storing Docker images
   - Implement lifecycle policies to manage image retention and storage costs
   - Ensure images are properly tagged for version tracking

5. **IAM Security**
   - Create service role for CodePipeline with necessary permissions
   - Create service role for CodeBuild with ECR push permissions
   - Follow principle of least privilege for all policies
   - Include permissions for S3 artifact access and CloudWatch logging

6. **Resource Organization**
   - Tag all resources with Environment=production
   - Tag all resources with Project=nodejs-app
   - Use consistent naming with environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodePipeline** for pipeline orchestration
- Use **AWS CodeBuild** for building Docker images
- Use **Amazon ECR** for container image storage
- Use **Amazon S3** for pipeline artifacts
- Use **CloudWatch Logs** for build logging
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environmentSuffix`
- All resources must be destroyable (no Retain policies or deletion protection)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All named resources (S3 buckets, ECR repos, log groups, etc.) must include the environmentSuffix parameter in their names
- **Destroyability**: All resources must be fully destroyable after testing - no Retain deletion policies, no deletion protection flags
- **GitHub Integration**: CodePipeline source stage requires GitHub OAuth token or connection for webhook setup
- **ECS Dependency**: Deploy stage references ECS cluster and service (these can be placeholder values for the pipeline configuration)

### Constraints

- No hardcoded account IDs or repository names
- Pipeline artifact encryption must use AWS managed S3 key
- CodeBuild must have permissions to push to ECR
- Include proper error handling for failed builds
- CloudWatch log retention set to exactly 7 days
- All IAM roles must have trust relationships properly configured

## Success Criteria

- **Functionality**: Pipeline successfully triggers on GitHub commits and completes all stages
- **Build Process**: CodeBuild creates Docker images from buildspec.yml
- **Image Storage**: Images pushed to ECR with proper tagging
- **Logging**: All build logs captured in CloudWatch with 7-day retention
- **Security**: IAM roles follow least privilege, encryption enabled on artifacts
- **Integration**: GitHub webhook properly configured for automatic triggers
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources tagged with Environment and Project
- **Code Quality**: TypeScript, well-tested, and properly documented

## What to deliver

- Complete Pulumi TypeScript implementation
- CodePipeline with Source, Build, and Deploy stages
- CodeBuild project configured for Docker builds
- ECR repository with lifecycle policies
- S3 bucket for artifacts with versioning and encryption
- IAM roles and policies for CodePipeline and CodeBuild
- CloudWatch Logs configuration
- Unit tests for all infrastructure components
- Documentation and deployment instructions
