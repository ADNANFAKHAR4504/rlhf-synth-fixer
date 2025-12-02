Hey team,

We need to build a comprehensive CI/CD pipeline solution for automated Docker application deployments. The business is pushing hard for faster release cycles and wants automated deployments across multiple environments with proper safeguards in place. I've been asked to create this infrastructure using Pulumi with TypeScript to give us full programmatic control over our pipeline resources.

Right now, development teams are manually building Docker images and deploying them, which is error-prone and slow. We need to automate the entire flow from code commit to production deployment, with staging environments for testing and manual approval gates before production releases. The architecture needs to handle branch-based workflows where different Git branches automatically deploy to different environments.

## What we need to build

Create a multi-stage CI/CD pipeline system using **Pulumi with TypeScript** that automates Docker-based application deployments across staging and production environments.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts with versioning enabled
   - Proper encryption at rest for compliance
   - Lifecycle policies for artifact cleanup

2. **Source Control Integration**
   - GitHub repository integration as the source stage
   - CloudWatch Events configuration to trigger pipeline on code commits
   - Automatic pipeline execution on push to tracked branches

3. **Build Stage**
   - CodeBuild project configured to build Docker images from source
   - Build specifications for containerized applications
   - Integration with GitHub repository for source code access
   - Proper build environment configuration

4. **Container Registry**
   - ECR repository for storing built Docker images
   - Lifecycle policies to manage image retention and cleanup
   - Image scanning and tagging support

5. **Pipeline Orchestration**
   - CodePipeline with three stages: Source, Build, Deploy
   - Branch-based deployment logic: main branch goes to production, develop branch goes to staging
   - Manual approval action before production deployments
   - Proper stage transitions and artifact passing

6. **IAM Security**
   - Least-privilege IAM roles for CodePipeline service
   - Least-privilege IAM roles for CodeBuild service
   - Service-specific permissions scoped to only required actions
   - Trust relationships configured for AWS service principals

7. **Resource Tagging**
   - All resources tagged with Environment tag (production/staging)
   - All resources tagged with Project tag
   - All resources tagged with ManagedBy tag indicating infrastructure as code

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning
- Use **CodeBuild** for building Docker images
- Use **CodePipeline** for pipeline orchestration
- Use **ECR** for Docker image registry
- Use **IAM** for service permissions
- Use **CloudWatch Events** for automated triggering
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL named resources (S3 buckets, ECR repositories, CodeBuild projects, CodePipeline, IAM roles) MUST include the environmentSuffix in their names to prevent conflicts during parallel deployments
- **Destroyability**: ALL resources must be fully destroyable. Do not use RemovalPolicy.RETAIN or deletion_protection. Use DESTROY or DELETE policies
- **No Account-Level Services**: Do not create GuardDuty detectors or other account-level resources that can only exist once per account
- **CodeBuild Service Role**: Ensure CodeBuild IAM role has permissions for ECR (GetAuthorizationToken, BatchCheckLayerAvailability, BatchGetImage, PutImage) and S3 artifact access
- **CodePipeline Artifact Access**: Ensure CodePipeline role has access to artifact bucket and can pass roles to downstream services

### Constraints

- IAM roles must follow principle of least privilege with minimal required permissions
- S3 artifact bucket must have versioning enabled for rollback capability
- ECR lifecycle policies must prevent unbounded image storage costs
- Manual approval required before any production deployments to prevent accidental releases
- Pipeline must support multiple branches with isolated environments
- All service integrations must use IAM roles, not hardcoded credentials
- Build process must be reproducible and stateless

## Success Criteria

- **Functionality**: Pipeline automatically triggers on code commits, builds Docker images, and deploys to correct environment based on branch
- **Security**: All IAM roles follow least-privilege principles with explicit permissions only
- **Reliability**: Pipeline stages execute in correct order with proper artifact passing between stages
- **Flexibility**: System supports branch-based deployments with staging and production environments
- **Resource Naming**: All resources include environmentSuffix to enable parallel deployments
- **Tagging**: All resources properly tagged with Environment, Project, and ManagedBy tags
- **Code Quality**: Production-ready TypeScript code with proper error handling and documentation

## What to deliver

- Complete Pulumi TypeScript implementation with all pipeline components
- S3 bucket for pipeline artifacts with versioning
- CodeBuild project for Docker image builds
- CodePipeline with source, build, and deploy stages
- ECR repository with lifecycle policies
- IAM roles for CodePipeline and CodeBuild
- CloudWatch Events rule for automated triggering
- Manual approval action in pipeline before production
- Unit tests for all infrastructure components
- Documentation covering deployment and usage
