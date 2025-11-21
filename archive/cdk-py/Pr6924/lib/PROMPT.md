Hey team,

We need to build out a comprehensive multi-stage CI/CD pipeline for our containerized applications in a single AWS account. The business wants us to automate the entire deployment workflow from source to deployment with proper controls and visibility at each stage. I've been asked to create this infrastructure using **AWS CDK with Python** and deploy it to us-east-1.

The challenge we're facing is that our current deployment process is manual and error-prone. We need to establish a robust pipeline that handles builds, tests, and deployments with blue/green deployment strategies. The team also wants proper approval gates before staging and production deployments, plus we need comprehensive monitoring to catch issues early.

## What we need to build

Create a single-account CI/CD pipeline infrastructure using **AWS CDK with Python** that automates containerized application deployments with proper controls, monitoring, and security practices.

### Core Requirements

1. **Multi-Stage Pipeline Architecture**
   - Multiple distinct stages: source, build, test, approval gates, and deploy
   - Blue/green deployment support using AWS CodeDeploy
   - Integration with CodePipeline for orchestration
   - Support for containerized applications with ECS Fargate

2. **Build Infrastructure**
   - CodeBuild projects configured to use ECR-hosted container images
   - BUILD_GENERAL1_SMALL compute type for cost efficiency
   - S3-based caching with 7-day expiration for faster builds
   - Build artifacts stored securely

3. **Approval and Notification System**
   - Manual approval actions before staging deployments
   - Manual approval actions before production deployments
   - SNS topics and subscriptions for approval notifications
   - Email notifications to appropriate stakeholders

4. **Artifact Storage**
   - S3 buckets for storing pipeline artifacts
   - Versioning enabled on all artifact buckets
   - SSE-S3 encryption for data at rest
   - Lifecycle policies with 90-day retention for old versions

5. **Container Deployment**
   - ECS Fargate services with blue/green deployment
   - CodeDeploy Application and Deployment Group for ECS
   - Blue/green deployment configuration for zero-downtime updates
   - Automatic rollback on deployment failures
   - Health checks and traffic shifting
   - Deployment actions in pipeline for automated ECS updates

6. **Security**
   - IAM roles with least privilege permissions for all services
   - Explicit deny policy for ec2:TerminateInstances in deployment roles
   - Secure artifact bucket access with encryption
   - No hardcoded credentials or sensitive data

7. **Secrets Management**
   - Secrets Manager entries for Docker registry credentials
   - Secure credential rotation support
   - No hardcoded secrets in code or configuration

8. **Monitoring and Alerting**
   - CloudWatch event rules for pipeline failure detection
   - SNS notifications for critical pipeline events
   - CloudWatch dashboards for pipeline metrics
   - Visibility into build times, deployment success rates, and failure patterns

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **AWS CodePipeline** for pipeline orchestration
- Use **AWS CodeBuild** for building and testing
- Use **Amazon ECS Fargate** for container deployments
- Use **AWS Secrets Manager** for credential storage
- Use **Amazon S3** for artifact storage with encryption
- Use **Amazon SNS** for notifications
- Use **Amazon CloudWatch** for monitoring and dashboards
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - NO Retain policies or DeletionProtection
- Use RemovalPolicy.DESTROY for all resources
- No RETAIN policies on S3 buckets, secrets, or any other resources
- Resources must support clean teardown for testing environments

### Constraints

- Use BUILD_GENERAL1_SMALL compute for CodeBuild to control costs
- Implement IAM least privilege across all services
- S3 artifact buckets must use SSE-S3 encryption only
- Cache expiration set to 7 days maximum
- Lifecycle policies must delete old artifact versions after 90 days
- Manual approvals required before staging and production deployments
- Blue/green deployments required for ECS Fargate services using CodeDeploy
- All deployment IAM roles must explicitly deny ec2:TerminateInstances
- Validate required parameters (email, connection ARN) before deployment

## Success Criteria

- **Functionality**: Complete pipeline from source to deployment with approval gates and CodeDeploy integration
- **Performance**: Build caching reduces build times by using S3 cache
- **Reliability**: Blue/green deployments ensure zero-downtime updates with automatic rollback
- **Security**: IAM roles with least privilege and explicit ec2:TerminateInstances denies
- **Monitoring**: CloudWatch dashboards provide visibility into pipeline health
- **Validation**: Required parameters are validated before stack creation
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Python, well-structured, follows CDK best practices

## What to deliver

- Complete AWS CDK Python implementation
- CodePipeline with source, build, test, approval, and deploy stages
- CodeBuild projects with ECR image support and S3 caching
- ECS Fargate services with blue/green deployment configuration
- CodeDeploy Application and Deployment Group for ECS blue/green deployments
- ECS deployment actions in the pipeline for automated container updates
- S3 artifact buckets with versioning, encryption, and lifecycle policies
- IAM roles with least privilege and explicit ec2:TerminateInstances deny policies
- SNS topics for manual approvals and alerts
- CloudWatch event rules for failure detection
- CloudWatch dashboards for pipeline metrics
- Secrets Manager entries for Docker credentials
- Parameter validation for required configuration values
- Unit tests for stack validation
- Integration tests for CodeDeploy and deployment functionality
- Clear documentation for deployment and usage
