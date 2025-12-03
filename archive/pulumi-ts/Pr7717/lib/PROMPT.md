# CI/CD Pipeline Infrastructure

Hey team,

We need to build a complete CI/CD pipeline infrastructure for our application deployments. The business wants an automated pipeline that handles source code changes from GitHub, builds Docker containers, and provides controlled deployment approval gates. I've been asked to create this using TypeScript with Pulumi. The pipeline should be production-ready with proper security, logging, and artifact management.

The current manual deployment process is slow and error-prone. We need automation that can handle multiple deployments per day while maintaining security and visibility. The pipeline needs to store build artifacts, manage Docker images securely, and provide clear logs for debugging build issues.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** for automated deployments.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for pipeline artifacts
   - Enable versioning for artifact history
   - Lifecycle rules to delete objects after 30 days (cost optimization)
   - Secure bucket with proper encryption and access controls

2. **Container Image Management**
   - ECR repository for storing Docker images
   - Enable image scanning on push for security vulnerabilities
   - Configure image lifecycle policies for cleanup

3. **Build Infrastructure**
   - CodeBuild project using aws/codebuild/standard:5.0 image
   - Configure source from GitHub repository
   - Define build environment and compute resources
   - Output Docker image tags as pipeline variables

4. **Pipeline Orchestration**
   - Three-stage CodePipeline:
     - Source stage: Pull from GitHub repository
     - Build stage: Execute CodeBuild project
     - Manual Approval stage: Require human approval before deployment
   - Configure stage transitions and actions
   - Connect artifact bucket to pipeline stages

5. **Security and Permissions**
   - IAM role for CodePipeline with least-privilege permissions
   - IAM role for CodeBuild with access to ECR and CloudWatch
   - Service-linked role associations
   - Secure credential handling

6. **Observability**
   - CloudWatch Logs for CodeBuild output
   - 7-day log retention policy
   - Structured logging for debugging

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning and lifecycle rules
- Use **ECR** for Docker image repository with scanning
- Use **CodeBuild** for build execution
- Use **CodePipeline** for orchestration
- Use **IAM** for service roles and policies
- Use **CloudWatch Logs** for build logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Resource Tagging

Tag all resources with:
- Environment: production
- Team: devops

### Constraints

- Use least-privilege IAM permissions (no wildcards where specific resources can be referenced)
- Enable encryption at rest for all storage
- Artifacts should auto-expire after 30 days to control costs
- CloudWatch logs should retain for 7 days only
- All resources must be destroyable without retain policies (important for test environments)
- CodeBuild must use standard image version 5.0
- Pipeline must include manual approval gate before deployment stages

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter
- Use pattern: `{service}-{purpose}-${environmentSuffix}`
- All resources MUST use DESTROY removal policy (no RETAIN)
- RemovalPolicy.DESTROY for CDK, DeletionPolicy: Delete for CloudFormation
- For Pulumi: Do not set retainOnDelete or set it to false

## Success Criteria

- Functionality: Complete three-stage pipeline that can pull from GitHub, build containers, and await approval
- Security: Proper IAM roles with least-privilege permissions, encrypted artifacts, image scanning enabled
- Observability: CloudWatch logs capture all build output with 7-day retention
- Resource Management: All resources properly tagged, artifacts auto-expire, logs auto-cleanup
- Resource Naming: All resources include environmentSuffix in their names
- Destroyability: All resources can be destroyed without retain policies blocking cleanup
- Code Quality: TypeScript code, type-safe, well-structured, follows Pulumi best practices

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- S3 bucket with versioning and lifecycle configuration
- ECR repository with image scanning enabled
- CodeBuild project with proper environment configuration
- CodePipeline with three stages (Source, Build, Manual Approval)
- IAM roles for CodePipeline and CodeBuild with specific policies
- CloudWatch Logs group with 7-day retention
- Stack exports for pipeline ARN and artifact bucket name
- All resources tagged with Environment=production and Team=devops
- Unit tests verifying resource creation
- Documentation with deployment instructions