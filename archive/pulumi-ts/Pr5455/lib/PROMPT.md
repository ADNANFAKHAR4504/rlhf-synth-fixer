# CI/CD Pipeline for Container Deployments

Hey team,

We've got a request from the software development team to automate their container deployment workflow. They're currently doing manual builds and pushes to ECR whenever they update their application code, and it's becoming a bottleneck. They want to move to a fully automated CI/CD pipeline using AWS native services.

The goal is pretty straightforward - every time a developer pushes code to the main branch in GitHub, we want to automatically build a Docker image, store it in ECR, and mark successful builds as production-ready. We need to use **Pulumi with TypeScript** for all the infrastructure code. The business wants this deployed in the ap-southeast-1 region to stay close to our primary customer base.

Right now, they have a Dockerfile in their repository and a GitHub repo, but everything else needs to be built from scratch. The team is specifically interested in using AWS CodePipeline and CodeBuild since they're already familiar with the AWS ecosystem and don't want to manage additional third-party CI/CD tools.

## What we need to build

Create a fully automated CI/CD pipeline using **Pulumi with TypeScript** that handles container builds and deployments for a GitHub-based project.

### Core Pipeline Components

1. **Artifact Storage**
   - S3 bucket for pipeline artifacts with versioning enabled
   - Lifecycle policy to automatically delete objects older than 30 days
   - AWS managed encryption at rest

2. **Container Registry**
   - ECR repository for Docker images
   - Image scanning enabled on every push
   - Lifecycle policy to keep only the last 10 images (cost optimization)

3. **Build System**
   - CodeBuild project configured for Docker builds
   - Linux environment with Docker support
   - BUILD_GENERAL1_SMALL compute type for cost efficiency
   - Reads Dockerfile from source and pushes to ECR

4. **Pipeline Orchestration**
   - CodePipeline with three stages: Source, Build, Deploy
   - GitHub version 2 source action with webhook integration
   - CodeBuild stage for Docker image creation
   - Lambda function stage for post-build tagging

5. **Post-Build Automation**
   - Lambda function that tags the latest ECR image with 'production' tag
   - Function must be written inline (not loaded from external files)
   - Triggered automatically after successful builds

6. **Event Management**
   - CloudWatch Events to trigger pipeline on GitHub push events
   - Integration between GitHub webhooks and CodePipeline

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use native Pulumi AWS SDK without custom components
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming pattern: resource-type-environment-suffix
- Deploy to **ap-southeast-1** region
- All resources must include tags: Environment='production' and Team='devops'

### Security and IAM

- All IAM roles and policies following least privilege principles
- CodeBuild needs appropriate permissions to read from ECR and S3
- Lambda function needs ECR tagging permissions
- Pipeline service role needs access to all stage actions
- No hardcoded credentials or secrets in code

### Logging and Monitoring

- CloudWatch Logs for CodeBuild with /aws/codebuild/ prefix
- 7-day retention period for logs
- Proper error handling and logging throughout

### Constraints

- Dedicated S3 bucket for pipeline artifacts (separate from any application storage)
- All S3 buckets must use AWS managed key encryption
- All resources must be destroyable (no Retain deletion policies)
- Lambda function code must be inline in the Pulumi program
- ECR lifecycle policy must maintain exactly the last 10 images

## Success Criteria

- **Functionality**: Pipeline triggers automatically on GitHub commits, builds Docker images, stores in ECR, and tags production builds
- **Performance**: Build process completes within reasonable time using SMALL compute
- **Reliability**: Pipeline handles failures gracefully with proper error messages
- **Security**: All IAM follows least privilege, encryption enabled, no exposed secrets
- **Cost**: Uses cost-optimized resources (serverless Lambda, SMALL compute, lifecycle policies)
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Tagging**: All resources properly tagged with Environment and Team
- **Destroyability**: Complete stack can be destroyed without manual cleanup

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- S3 bucket with versioning and lifecycle rules
- ECR repository with scanning and lifecycle policy
- CodeBuild project with Docker support and proper IAM
- CodePipeline with Source, Build, and Deploy stages
- Lambda function for ECR image tagging (inline code)
- CloudWatch Events for GitHub integration
- All IAM roles and policies properly configured
- CloudWatch log groups with 7-day retention
- Unit tests for all components
- Integration tests validating end-to-end workflow
- Documentation for deployment and usage
