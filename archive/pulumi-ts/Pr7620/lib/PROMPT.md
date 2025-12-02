# CI/CD Pipeline Integration

Hey team,

We need to build a complete CI/CD pipeline for our containerized Node.js application using AWS native services. The development team has been manually building and deploying Docker images, and we need to automate this entire workflow to improve reliability and speed up our release cycle. I've been asked to create this infrastructure using **Pulumi with TypeScript**.

The business wants a fully automated pipeline that triggers on GitHub commits, builds containers, runs tests, and stores versioned Docker images in ECR. We also need manual approval gates before production deployments and proper artifact management with automatic cleanup to control costs.

This is a critical piece of infrastructure that will serve as the foundation for our deployment automation. The pipeline needs to handle source control integration, containerized builds, automated testing, and artifact storage with proper security controls throughout.

## What we need to build

Create a complete CI/CD pipeline using **Pulumi with TypeScript** for automating container builds and deployments. The pipeline should integrate GitHub source control, AWS CodeBuild for building and testing, CodePipeline for orchestration, and ECR for storing Docker images.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for pipeline artifacts
   - Enable versioning for artifact tracking
   - Lifecycle rules to automatically delete objects after 30 days
   - Encryption at rest using AWS managed keys (SSE-S3)
   - Must use environmentSuffix in bucket name

2. **Container Registry**
   - ECR repository for Docker images
   - Enable image scanning on push for security
   - Lifecycle policy to keep only the last 10 images
   - Must use environmentSuffix in repository name

3. **Build Project**
   - CodeBuild project integrated with GitHub source
   - Run unit tests during build
   - Push Docker images to ECR after successful tests
   - Use custom Docker image from ECR for build environment
   - Use compute type BUILD_GENERAL1_SMALL for cost optimization
   - Must use environmentSuffix in project name

4. **Pipeline Orchestration**
   - CodePipeline with three stages:
     - Source stage: GitHub integration
     - Build stage: CodeBuild execution
     - Manual Approval stage: human gate for production
   - Must use environmentSuffix in pipeline name

5. **IAM Security**
   - CodePipeline service role with least privilege
   - CodeBuild service role with least privilege
   - Permissions for S3, ECR, CodeBuild, CodePipeline operations
   - Policies must explicitly deny actions outside stack scope

6. **Automation Triggers**
   - CloudWatch Events rule to trigger pipeline on GitHub commits to main branch
   - Must use environmentSuffix in event rule name

7. **Enhanced Capabilities**
   - Integrate SNS for notifications and alerts
   - Integrate SQS for build queue management
   - Integrate Lambda for custom pipeline actions
   - Integrate DynamoDB for pipeline metadata and state tracking

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use Pulumi's AWS Classic provider (not AWS Native) for all resources
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Pipeline artifacts must be encrypted in transit using TLS 1.2 or higher
- Requires Pulumi 3.x with TypeScript and Node.js 16+

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL resources MUST include environmentSuffix variable for uniqueness
  - Bucket name: pipeline-artifacts-${environmentSuffix}
  - ECR repository: app-images-${environmentSuffix}
  - CodeBuild project: app-build-${environmentSuffix}
  - CodePipeline: app-pipeline-${environmentSuffix}
  - CloudWatch rule: pipeline-trigger-${environmentSuffix}

- **Destroyability**: All resources must be fully destroyable
  - NO RETAIN policies on any resources
  - S3 buckets must support force deletion
  - ECR repositories must support force deletion
  - All resources should clean up completely on stack deletion

- **Integration with CI/CD Workflow**: Reference the provided ci-cd.yml workflow file for GitHub Actions integration patterns

## Success Criteria

- **Functionality**: Pipeline automatically triggers on GitHub commits to main branch
- **Build Process**: CodeBuild successfully builds Docker images and runs tests
- **Image Storage**: Docker images are pushed to ECR with proper tags and scanning
- **Artifact Management**: S3 artifacts are versioned and automatically cleaned up after 30 days
- **Security**: All IAM roles follow least privilege, encryption enabled for data at rest and in transit
- **Cost Optimization**: Lifecycle policies prevent unbounded storage growth
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Code Quality**: TypeScript code is well-typed, tested, and documented

## What to deliver

- Complete Pulumi TypeScript implementation in index.ts
- CodePipeline configuration with Source, Build, and Manual Approval stages
- CodeBuild project with GitHub integration and ECR image push
- S3 bucket for artifacts with versioning and lifecycle rules
- ECR repository with image scanning and lifecycle policy
- IAM roles and policies for CodePipeline and CodeBuild
- CloudWatch Events rule for automated pipeline triggers
- SNS topic for pipeline notifications
- SQS queue for build event processing
- Lambda function for custom pipeline actions
- DynamoDB table for pipeline state tracking
- Stack outputs for pipeline URL, ECR repository URI, and S3 bucket name
- Unit tests for all infrastructure components
- Integration tests that validate deployed resources
- Documentation covering deployment and usage
