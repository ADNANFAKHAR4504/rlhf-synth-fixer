Hey team,

We need to build a comprehensive CI/CD pipeline for containerized applications that our DevOps team can use to automate deployments from GitHub to production. The business wants a fully automated pipeline that handles everything from source code commits to deployment, with proper security scanning and multi-stage approvals. I've been asked to create this infrastructure using **Pulumi with TypeScript**.

Right now, our teams are manually building Docker images and deploying them, which is error-prone and slow. We need infrastructure that automates the entire process: storing artifacts securely, managing container images with proper lifecycle policies, building images consistently, and deploying through multiple environments with appropriate approval gates. The pipeline should follow AWS best practices for security and use modern authentication methods like OIDC instead of long-lived credentials.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** that automates containerized application deployments.

### Core Requirements

1. **Artifact Storage**
   - Create an S3 bucket for storing pipeline artifacts
   - Enable versioning to maintain artifact history
   - Include proper naming with environmentSuffix for uniqueness

2. **Container Registry**
   - Set up an ECR repository for Docker images
   - Configure lifecycle policies to automatically keep only the last 10 images
   - Ensure repository can be destroyed without retention policies

3. **Build Infrastructure**
   - Create a CodeBuild project that builds Docker images
   - Configure to use buildspec.yml from the source repository
   - Set up proper IAM roles for CodeBuild to access ECR and S3
   - Include environment variables for container registry and artifact bucket

4. **Pipeline Configuration**
   - Set up CodePipeline with three stages: Source, Build, and Deploy
   - Source stage should pull from GitHub repository
   - Build stage should use the CodeBuild project to build Docker images
   - Deploy stage should be a placeholder for future ECS deployment integration

5. **Event-Driven Triggers**
   - Enable CloudWatch Events to automatically trigger pipeline on GitHub pushes to main branch
   - Ensure proper IAM permissions for event-driven execution

6. **Monitoring and Outputs**
   - Output the pipeline URL for easy access
   - Output the ECR repository URI for image push operations

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS CodePipeline for orchestration
- Use AWS CodeBuild for Docker image building
- Use Amazon ECR for container image storage
- Use Amazon S3 for artifact storage
- Use CloudWatch Events for pipeline triggers
- Resource names must include **environmentSuffix** for uniqueness (e.g., `pipeline-{environmentSuffix}`)
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain or SNAPSHOT_ON_DELETE policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resources MUST include an environmentSuffix parameter in their names to ensure uniqueness across multiple deployments
- **Destroyability**: All resources must be fully destroyable without retention policies. This includes:
  - S3 buckets with force destroy enabled
  - ECR repositories with force delete enabled
  - No RemovalPolicy.RETAIN or SNAPSHOT_ON_DELETE policies
- **IAM Permissions**: CodeBuild must have proper permissions to:
  - Push images to ECR (ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability, ecr:PutImage, ecr:InitiateLayerUpload, ecr:UploadLayerPart, ecr:CompleteLayerUpload)
  - Access S3 bucket for artifacts (s3:GetObject, s3:PutObject)
  - Write logs to CloudWatch Logs

### Constraints

- All resources must be tagged with Environment=Production and Team=DevOps
- Use environment variables in CodeBuild for configuration (not hardcoded values)
- ECR lifecycle policy should maintain exactly the last 10 images (delete older ones)
- S3 bucket must have versioning enabled for artifact tracking
- Pipeline must support GitHub as source provider
- Include proper error handling and logging configuration
- CodeBuild project should use standard docker runtime environment

## Success Criteria

- **Functionality**: Complete CI/CD pipeline that can trigger on GitHub commits, build Docker images, and store them in ECR
- **Artifact Management**: S3 bucket properly configured with versioning for artifact storage
- **Image Lifecycle**: ECR repository automatically maintains only the last 10 images
- **Security**: Proper IAM roles and policies with least privilege access
- **Automation**: CloudWatch Events trigger pipeline automatically on code changes
- **Resource Naming**: All resources include environmentSuffix for multi-deployment support
- **Tagging**: All resources properly tagged with Environment and Team tags
- **Outputs**: Pipeline URL and ECR repository URI exposed for operational use
- **Code Quality**: Well-structured TypeScript code, properly tested, with clear documentation

## What to deliver

- Complete Pulumi TypeScript implementation in index.ts
- IAM roles and policies for CodeBuild with ECR and S3 access
- CodePipeline configuration with Source, Build, and Deploy stages
- CodeBuild project configured for Docker image building
- ECR repository with lifecycle policy for image retention
- S3 bucket for artifacts with versioning enabled
- CloudWatch Events rule for pipeline triggering
- Proper resource outputs (pipeline URL, ECR URI)
- Unit tests covering all infrastructure components
- Documentation with deployment instructions
