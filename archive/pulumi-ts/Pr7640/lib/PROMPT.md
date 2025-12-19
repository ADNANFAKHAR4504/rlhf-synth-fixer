Hey team,

We need to set up an automated CI/CD pipeline for our containerized applications. The goal is to have a complete deployment pipeline that automatically builds Docker images, stores them securely, and moves them through our deployment stages with proper controls. I've been asked to create this using Pulumi with TypeScript, and the business wants a robust solution that handles everything from source code commits to production deployments.

Right now, our teams are manually building and pushing Docker images, which is error-prone and time-consuming. We want to automate this entire workflow so that when developers commit code to the main branch, the system automatically builds the Docker image, stores it in our registry, and kicks off the deployment pipeline. We also need manual approval gates before critical deployments and comprehensive logging for troubleshooting.

The pipeline needs to integrate with our GitHub repositories, use AWS services for building and orchestration, and ensure we're not accumulating too many old Docker images that eat up storage costs. Everything should be tagged properly for cost tracking and management purposes.

## What we need to build

Create an automated CI/CD pipeline infrastructure using **Pulumi with TypeScript** for containerized application deployments.

### Core Requirements

1. Artifact Storage
   - Create an S3 bucket for storing pipeline artifacts
   - Enable versioning on the bucket to track artifact history
   - Resource name must include environmentSuffix for uniqueness

2. Container Registry
   - Set up an ECR repository for Docker image storage
   - Configure lifecycle policies to retain only the last 10 images
   - This prevents storage costs from growing unbounded
   - Resource name must include environmentSuffix

3. Build Environment
   - Configure a CodeBuild project that builds Docker images
   - Connect to a GitHub repository as the source
   - Output built images to the ECR repository
   - Resource name must include environmentSuffix

4. IAM Security
   - Create IAM roles for CodeBuild with least privilege access
   - Grant CodeBuild permission to push images to ECR
   - Grant CodeBuild permission to read/write S3 artifacts
   - Ensure proper trust relationships are configured

5. Pipeline Orchestration
   - Set up CodePipeline with three stages:
     - Source stage: Pull code from GitHub
     - Build stage: Run CodeBuild to build Docker images
     - Manual Approval stage: Require human approval before proceeding
   - Configure the pipeline to trigger automatically on commits to main branch
   - Resource name must include environmentSuffix

6. Logging and Monitoring
   - Enable CloudWatch Logs for CodeBuild project
   - Set log retention to 30 days
   - Ensure logs are easily accessible for troubleshooting

7. Resource Tagging
   - Tag all resources with Environment=Production
   - Tag all resources with ManagedBy=Pulumi
   - This helps with cost allocation and resource management

8. Outputs
   - Export the pipeline URL for easy access to the console
   - Export the ECR repository URI for image push/pull operations

### Technical Requirements

- All infrastructure defined using Pulumi with TypeScript
- Use AWS S3 for artifact storage
- Use AWS ECR for Docker image registry
- Use AWS CodeBuild for building Docker images
- Use AWS CodePipeline for pipeline orchestration
- Use AWS IAM for access control
- Use AWS CloudWatch for logging
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-{environmentSuffix}
- Deploy to us-east-1 region

### CI/CD Integration

The infrastructure will be deployed through a multi-stage CI/CD pipeline as shown in the provided lib/ci-cd.yml reference file. This demonstrates:
- GitHub OIDC authentication for secure deployments
- Automated deployment to dev environment on commits
- Manual approval gates for staging and production
- Security scanning and validation steps
- Cross-account deployment patterns using IAM role assumption

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter for uniqueness
- All resources must be fully destroyable (no Retain policies, no DeletionProtection)
- No account-level resources that conflict with other deployments
- CodePipeline GitHub source requires pre-existing GitHub connection ARN
- CodeBuild must have correct IAM permissions before first build

### Constraints

- All infrastructure must be defined in Pulumi TypeScript code
- No manual resource creation or console configuration
- Pipeline must be fully automated after initial setup
- IAM roles must follow least privilege principle
- All resources must be destroyable for testing purposes (no Retain policies)
- Include proper error handling for build failures
- Logs must be retained for compliance (30 days)
- No hardcoded secrets or credentials

## Success Criteria

- Functionality: Pipeline automatically triggers on GitHub commits to main branch
- Functionality: CodeBuild successfully builds Docker images and pushes to ECR
- Functionality: Manual approval stage blocks deployment until approved
- Security: IAM roles have least privilege access
- Security: No credentials stored in code
- Reliability: CloudWatch Logs capture all build activity
- Reliability: Pipeline handles build failures gracefully
- Cost Management: ECR lifecycle policy keeps only last 10 images
- Resource Naming: All resources include environmentSuffix
- Resource Tagging: All resources tagged with Environment and ManagedBy
- Code Quality: TypeScript code is well-structured and documented
- Deployability: Stack can be fully deployed and destroyed without errors

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- S3 bucket with versioning for artifacts
- ECR repository with lifecycle policy (keep last 10 images)
- CodeBuild project configured for Docker builds
- IAM roles and policies for CodeBuild
- CodePipeline with Source, Build, and Manual Approval stages
- CloudWatch Logs configuration with 30-day retention
- Resource tags on all resources
- Stack outputs for pipeline URL and ECR repository URI
- Unit tests for all components
- Integration tests to verify deployment
- Documentation for setup and deployment
