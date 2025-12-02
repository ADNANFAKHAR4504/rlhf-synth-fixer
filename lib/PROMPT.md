# CI/CD Pipeline for Containerized ECS Applications

Hey team,

We need to build an automated CI/CD pipeline that can deploy containerized applications to ECS. The business wants a complete end-to-end solution that handles everything from storing Docker images to automatically deploying them when code changes are pushed to GitHub. I've been asked to create this using **Pulumi with TypeScript**.

The current deployment process is manual and error-prone. Developers have to manually build Docker images, push them to a registry, and then manually deploy to ECS. We need to automate this entire workflow with proper artifact storage, image lifecycle management, and a multi-stage pipeline that goes from source code to running containers.

## What we need to build

Create a CI/CD pipeline infrastructure using **Pulumi with TypeScript** that automates containerized application deployment to ECS.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts
   - Versioning must be enabled for artifact history
   - Proper encryption and access controls

2. **Container Registry**
   - ECR repository for storing Docker images
   - Lifecycle policy that retains only the last 10 images
   - Automatic cleanup of older images to reduce storage costs

3. **Build Infrastructure**
   - CodeBuild project that builds Docker images from source code
   - Pushes built images to ECR
   - Build specifications must be inline within the CodeBuild project definition
   - No external buildspec.yml files

4. **Pipeline Configuration**
   - CodePipeline with exactly three stages:
     - Source stage: GitHub integration
     - Build stage: CodeBuild execution
     - Deploy stage: ECS deployment
   - Pipeline must trigger automatically on GitHub repository changes
   - Proper stage transitions and artifact passing

5. **IAM Security**
   - IAM roles for CodeBuild service with least-privilege permissions
   - IAM roles for CodePipeline service with least-privilege permissions
   - Roles should only have permissions needed for their specific tasks
   - No overly broad wildcard permissions

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning
- Use **ECR** for Docker image registry with lifecycle policies
- Use **CodeBuild** for building and pushing Docker images
- Use **CodePipeline** for orchestrating the three-stage pipeline
- Use **ECS** as the deployment target
- Use **IAM** for service roles and permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Constraints

- All resources must be tagged with Environment=Production and ManagedBy=Pulumi
- ECR lifecycle policy must retain exactly the last 10 images (not more, not less)
- CodePipeline must have exactly 3 stages (Source, Build, Deploy)
- Build specifications must be inline (no external buildspec files)
- IAM roles must follow least-privilege principle
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

## Success Criteria

- **Functionality**: Complete automated pipeline from GitHub commit to ECS deployment
- **Security**: Least-privilege IAM roles with minimal required permissions
- **Lifecycle Management**: ECR automatically cleans up images older than the last 10
- **Automation**: Pipeline triggers automatically on GitHub repository changes
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources properly tagged with Environment=Production and ManagedBy=Pulumi
- **Code Quality**: TypeScript code with proper typing, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket with versioning for artifacts
- ECR repository with lifecycle policy (retain 10 images)
- CodeBuild project with inline buildspec
- CodePipeline with Source, Build, and Deploy stages
- IAM roles for CodeBuild and CodePipeline with least-privilege
- Unit tests for all components
- Documentation and deployment instructions
