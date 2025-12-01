Hey team,

We need to set up a complete automated CI/CD pipeline for our containerized applications. Our development team is tired of manual deployments and wants a fully automated workflow that builds Docker images from GitHub, stores them in ECR, and deploys to ECS Fargate whenever code is pushed to the main branch. This needs to be built using **Pulumi with TypeScript**.

The current situation is frustrating - every time developers push code, someone has to manually build the Docker image, push it to ECR, update the ECS task definition, and trigger a deployment. This is error-prone and slows down our release cycles. We want to implement AWS native CI/CD services to automate this entire workflow and get notifications when things go wrong.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** that automates the container build and deployment workflow for our development team.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for pipeline artifacts with versioning enabled
   - Encryption using AWS managed keys
   - Proper lifecycle policies

2. **Container Registry**
   - ECR repository for Docker images
   - Lifecycle policies to keep only the last 10 images
   - Automatic vulnerability scanning on image push

3. **Build Infrastructure**
   - CodeBuild project for building Docker images
   - Must use aws/codebuild/standard:5.0 image for builds
   - Custom buildspec.yml from the repository
   - Build timeout set to maximum 15 minutes
   - Build environment variables for Docker registry URL and image tags

4. **Pipeline Orchestration**
   - CodePipeline with three stages: Source (GitHub), Build (CodeBuild), and Deploy (ECS)
   - Automatic trigger on commits to main branch
   - Manual approval stage before production deployment

5. **Security and Permissions**
   - IAM roles with least-privilege permissions for CodeBuild and CodePipeline
   - No wildcard resources in IAM policies
   - Use Pulumi Config for sensitive values like GitHub OAuth token
   - GitHub OAuth token stored in Secrets Manager

6. **Monitoring and Notifications**
   - SNS topic for pipeline notifications
   - Alerts on build failures
   - CloudWatch Logs groups for build logs with 7-day retention
   - Structured JSON logging format for CloudWatch Log streams

7. **Enhanced Functionality**
   - CloudFront distribution for enhanced functionality and scalability
   - Lambda@Edge functions for request/response processing
   - S3 integration for static assets and enhanced functionality
   - CloudWatch metrics and alarms for monitoring

8. **ECS Deployment**
   - ECS task definition with exact memory and CPU values
   - Fargate launch type for running containers

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use S3 for artifact storage with versioning and encryption
- Use ECR for container registry with lifecycle policies and vulnerability scanning
- Use CodeBuild for Docker image builds with standard:5.0 image
- Use CodePipeline for orchestration with manual approval stage
- Use ECS Fargate for container deployment
- Use IAM for least-privilege access control
- Use SNS for build failure notifications
- Use CloudWatch Logs for build monitoring with 7-day retention
- Use CloudFront for enhanced functionality and scalability
- Use Lambda@Edge for request/response processing
- Use Secrets Manager for GitHub OAuth token storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region
- Reference the ci-cd.yml configuration file in lib/ directory

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with RemovalPolicy.Destroy
- No Retain policies allowed on any resources
- Include environmentSuffix string parameter in all resource names
- Build timeout must not exceed 15 minutes
- CodeBuild must use privileged mode for Docker builds
- Manual approval required before production deployment

### Constraints

- CodeBuild must use the aws/codebuild/standard:5.0 image for builds
- Pipeline artifact bucket must have encryption enabled using AWS managed keys
- ECR repository must scan images on push for vulnerabilities
- All IAM policies must follow least-privilege principle with no wildcard resources
- Pipeline must have manual approval stage before production deployment
- Build timeout must be set to maximum 15 minutes
- Use Pulumi Config for sensitive values like GitHub OAuth token
- ECS task definition must specify exact memory and CPU values
- CloudWatch Log streams must use structured JSON logging format
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- Functionality: Pipeline automatically triggers on commits to main branch and deploys to ECS
- Performance: Build completes within 15 minutes with proper timeout handling
- Reliability: Build failures trigger SNS notifications with detailed error information
- Security: All IAM roles follow least-privilege with no wildcard permissions
- Resource Naming: All resources include environmentSuffix for environment isolation
- Code Quality: TypeScript code with proper typing, error handling, and documentation
- Monitoring: CloudWatch Logs with 7-day retention and structured logging format

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket with versioning and encryption for pipeline artifacts
- ECR repository with lifecycle policies and vulnerability scanning
- CodeBuild project with standard:5.0 image and custom buildspec.yml
- CodePipeline with Source, Build, Manual Approval, and Deploy stages
- ECS Fargate task definition and service
- IAM roles and policies with least-privilege access
- SNS topic for build failure notifications
- CloudWatch Logs groups with 7-day retention
- CloudFront distribution with Lambda@Edge functions
- Secrets Manager secret for GitHub OAuth token
- Unit tests for all components
- Documentation and deployment instructions