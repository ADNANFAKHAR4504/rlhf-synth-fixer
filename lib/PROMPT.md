Hey team,

We need to build a complete CI/CD pipeline for our container-based application deployment. The business has been asking for a way to automate our entire deployment process - from source code changes all the way to infrastructure deployment. Our development team is tired of manually building Docker images, pushing them to registries, and then running infrastructure updates. They want a fully automated solution that triggers on code changes and handles everything.

The management team has decided we should use Pulumi for infrastructure management since it gives us the flexibility of real programming languages and integrates nicely with version control. They want this integrated with AWS native services like CodePipeline and CodeBuild. The idea is that whenever developers push code changes, the pipeline should automatically build Docker images, store them in ECR, and then deploy infrastructure changes using Pulumi.

We've been allocated the eu-north-1 region for this deployment. The team has emphasized that we need proper security controls - encrypted artifacts, image scanning, least privilege IAM policies. They also want cost efficiency, so we're looking at smaller compute instances for builds. Finally, they want manual approval before any infrastructure changes are deployed to production, which makes sense for safety.

## What we need to build

Create a complete CI/CD pipeline using **Pulumi with TypeScript** for automated Docker image building and infrastructure deployment on AWS.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts
   - Versioning enabled on the bucket
   - Lifecycle rules to automatically delete old artifacts after 30 days
   - Resource name must include environmentSuffix parameter

2. **Container Registry**
   - ECR repository for storing Docker images
   - Image scanning enabled on push for security
   - Lifecycle policy to keep only the last 10 images to control storage costs
   - Resource name must include environmentSuffix parameter

3. **Build Projects**
   - CodeBuild project for building Docker images from source code and pushing to ECR
   - Second CodeBuild project for running Pulumi deployments
   - Both projects must use aws/codebuild/standard:7.0 image
   - Compute type must be BUILD_GENERAL1_SMALL for cost optimization
   - Environment variables configured for Docker registry authentication
   - Resource names must include environmentSuffix parameter

4. **Pipeline Orchestration**
   - CodePipeline with three stages: Source, Build, and Deploy
   - Source stage pulls from S3 bucket
   - Build stage uses CodeBuild to build and push Docker images
   - Manual approval stage before deployment
   - Deploy stage runs Pulumi using the deployment CodeBuild project
   - Automatic triggering when new source artifacts are uploaded to S3
   - Resource name must include environmentSuffix parameter

5. **Security and Access Control**
   - IAM roles for CodeBuild with permissions for ECR, S3, and infrastructure deployment
   - IAM role for CodePipeline with permissions to orchestrate stages
   - All IAM policies following least privilege principle with no wildcard permissions
   - Pipeline artifacts encrypted using AWS managed KMS keys
   - Resource names must include environmentSuffix parameter

6. **Notifications**
   - SNS topic for pipeline failure notifications
   - Subscription configured for alerts
   - Resource name must include environmentSuffix parameter

7. **Resource Tagging**
   - All resources tagged with Environment, Project, and ManagedBy tags
   - Tags include environmentSuffix for identification

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning and lifecycle policies
- Use **ECR** for container registry with scanning and lifecycle policies
- Use **CodeBuild** for build and deployment projects (two projects)
- Use **CodePipeline** for orchestrating the CI/CD workflow
- Use **IAM** for roles and policies with least privilege access
- Use **SNS** for failure notifications
- Use **KMS** for artifact encryption (AWS managed keys)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **eu-north-1** region
- All resources must be destroyable with no Retain policies

### Constraints

- CodeBuild projects MUST use aws/codebuild/standard:7.0 image
- Pipeline artifacts MUST be encrypted using AWS managed KMS keys
- ECR repository MUST have lifecycle policy keeping only last 10 images
- All IAM policies MUST follow least privilege with no wildcard permissions
- CodeBuild compute type MUST be BUILD_GENERAL1_SMALL
- Pipeline MUST include manual approval stage before Pulumi deployment
- All resources must support clean teardown without retention
- Include proper error handling and logging in all components

## Success Criteria

- **Functionality**: Pipeline automatically triggers on S3 artifact uploads, builds Docker images, and deploys infrastructure through Pulumi with manual approval checkpoint
- **Performance**: Builds complete efficiently using small compute instances
- **Reliability**: Pipeline includes proper error handling and failure notifications via SNS
- **Security**: Artifacts encrypted, images scanned, IAM follows least privilege, no wildcard permissions
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Cost Control**: Uses BUILD_GENERAL1_SMALL compute, lifecycle policies delete old artifacts and images
- **Code Quality**: TypeScript, properly typed, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket with versioning and 30-day lifecycle policy
- ECR repository with scanning enabled and 10-image lifecycle policy
- CodeBuild project for Docker image builds with standard:7.0 image
- CodeBuild project for Pulumi deployments with appropriate IAM permissions
- CodePipeline with Source, Build, Manual Approval, and Deploy stages
- IAM roles and policies for CodeBuild and CodePipeline with least privilege access
- SNS topic with notification subscription for pipeline failures
- KMS configuration for artifact encryption using AWS managed keys
- Unit tests for all components
- Documentation with deployment instructions and architecture overview
- All resource names include environmentSuffix parameter
- Comprehensive outputs for deployed resource identifiers