# CI/CD Pipeline Infrastructure for Microservices

Hey team,

We're building out the deployment infrastructure for our SaaS platform's microservices architecture. The business needs automated pipelines that can handle the build, test, and deploy lifecycle for each service while keeping costs under control and maintaining our security posture. Right now, deployments are manual and error-prone, and we need to fix that.

The goal is to create a reusable pipeline template that any team can use for their microservices. Each pipeline needs to pull code from CodeCommit, build Docker images, run through proper approval gates, and deploy to ECS using blue/green deployment strategies. We also need proper artifact storage, encryption, and monitoring.

I've been asked to implement this using **CloudFormation with JSON** for our us-east-1 deployment. The architecture needs to follow our security standards while being cost-effective enough to replicate across multiple services.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **CloudFormation with JSON** that provides automated deployment capabilities for microservices with proper security controls and cost optimization.

### Core Pipeline Components

1. **CodePipeline Orchestration**
   - Three-stage pipeline: source, build, and deploy
   - Source stage connected to CodeCommit repository with main branch trigger
   - Build stage using CodeBuild for Docker image creation
   - Deploy stage targeting ECS service with blue/green deployment
   - Manual approval action between staging and production environments
   - Output the pipeline ARN and execution role ARN

2. **Build Infrastructure**
   - CodeBuild project configured for Docker image builds
   - Must use BUILD_GENERAL1_SMALL compute type for cost efficiency
   - Run in VPC with no internet access using VPC endpoints
   - Support for buildspec.yml in source repository
   - Integration with ECR for image storage

3. **Source Repository Integration**
   - CodeCommit as the source repository
   - CloudWatch Events rule to automatically trigger pipeline on commits to main branch
   - Proper IAM permissions for pipeline to access repository

4. **Artifact Storage and Encryption**
   - S3 bucket for pipeline artifacts with versioning enabled
   - All artifacts encrypted using customer-managed KMS keys
   - Pipeline execution logs retained for exactly 30 days
   - Proper lifecycle policies for artifact management

5. **Deployment Target Configuration**
   - Integration with ECS service for deployments
   - Blue/green deployment strategy implementation
   - Proper rollback capabilities

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **CodePipeline** as the orchestration engine
- Use **CodeBuild** for build stages with BUILD_GENERAL1_SMALL compute type
- Use **CodeCommit** as source repository
- Use **ECS** for deployment targets
- Use **S3** for artifact storage with versioning
- Use **KMS** for encryption with customer-managed keys
- Use **CloudWatch Events** for pipeline triggers
- Use **VPC endpoints** for CodeBuild, S3, and ECR access
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: {resource-type}-{purpose}-environment-suffix
- Deploy to **us-east-1** region
- All resources must be destroyable with no Retain deletion policies

### Security and Compliance Constraints

- CodeBuild must run in VPC with no internet access
- VPC endpoints required for CodeBuild to access S3, ECR, and other AWS services
- All pipeline artifacts must be encrypted with customer-managed KMS keys
- Pipeline execution logs retained for exactly 30 days (no more, no less)
- All IAM roles must follow least-privilege principle with no wildcard actions
- Each pipeline must include manual approval stage before production deployment
- Cross-account IAM trust relationships for multi-account deployments

### Optional Enhancements

If time permits after core implementation:
- Additional CodeBuild project for automated testing to improve quality assurance
- SNS topic for pipeline notifications to enhance team communication
- Lambda function for custom deployment validation to enable advanced deployment checks

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter for uniqueness
- Example: MyPipeline-environment-suffix, ArtifactBucket-environment-suffix
- All resources MUST use RemovalPolicy: Delete or DeletionPolicy: Delete
- FORBIDDEN: RetainPolicy or Retain on any resources
- VPC and subnets must be provided as parameters (not created in template)
- KMS key must support service principals for CodePipeline, CodeBuild, S3, and CloudWatch Logs

## Success Criteria

- **Functionality**: Complete pipeline executes source, build, deploy stages successfully
- **Security**: All artifacts encrypted, CodeBuild runs in VPC with no internet, IAM follows least-privilege
- **Cost Optimization**: BUILD_GENERAL1_SMALL compute type used, efficient resource sizing
- **Compliance**: Logs retained exactly 30 days, manual approval before production
- **Automation**: Pipeline triggers automatically on code commits to main branch
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Reusability**: Template can be deployed multiple times for different microservices
- **Code Quality**: Well-structured CloudFormation JSON, properly documented

## What to deliver

- Complete CloudFormation JSON template implementing the pipeline infrastructure
- Parameters for environmentSuffix, VPC configuration, ECS cluster, and ECR repository
- KMS key for artifact encryption with proper key policies
- S3 bucket for artifacts with versioning and lifecycle policies
- CodePipeline with source (CodeCommit), build (CodeBuild), and deploy (ECS) stages
- Manual approval action between staging and production
- CloudWatch Events rule for automatic pipeline triggering
- IAM roles and policies following least-privilege principle
- VPC endpoint configuration references for CodeBuild
- Outputs for pipeline ARN, execution role ARN, and artifact bucket name
- Documentation with deployment instructions and parameter descriptions
