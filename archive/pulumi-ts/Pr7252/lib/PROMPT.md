# Self-Managed Pulumi CI/CD Pipeline

Hey team,

We're working with a fintech startup that needs to implement a proper GitOps workflow for their infrastructure. They're currently manually deploying Pulumi stacks across multiple AWS accounts, and it's becoming unmanageable. They need an automated CI/CD pipeline that can validate, test, and deploy infrastructure changes with proper approval gates and compliance controls.

The business wants every infrastructure change to flow through a standardized pipeline that prevents manual deployments while maintaining strict security and audit trails. They're running a multi-account AWS setup with separate dev, staging, and production accounts, and need seamless deployments across all environments.

I've been asked to build this solution in TypeScript using Pulumi. The pipeline needs to be sophisticated enough to handle Pulumi's stateful nature, cross-account deployments, and the company's compliance requirements around change management.

## What we need to build

Create a self-managed CI/CD system using **Pulumi with TypeScript** that automates the deployment of Pulumi infrastructure stacks across multiple AWS accounts.

### Core Requirements

1. **Pipeline Orchestration**
   - Create CodePipeline with 3 stages: Source (GitHub webhook), Build (Pulumi preview), Deploy (Pulumi up)
   - Implement separate pipelines for dev, staging, and prod environments
   - Enable parallel execution of non-production stages
   - Implement manual approval step before production deployments

2. **Build Infrastructure**
   - Configure CodeBuild project with custom Docker image from ECR containing Pulumi CLI
   - Use BUILD_GENERAL1_LARGE compute type for faster Pulumi operations
   - Set build logs retention to 30 days with CloudWatch Logs
   - Custom CodeBuild image must be scanned for vulnerabilities before use

3. **State Management**
   - Store Pulumi state in S3 with versioning and encryption enabled
   - Each environment pipeline must have unique state bucket with lifecycle policies
   - Implement retry logic for transient Pulumi backend failures

4. **Security and Access Control**
   - Configure IAM roles with cross-account assume permissions for multi-account deployments
   - CodeBuild service role must have sts:AssumeRole permission for target accounts
   - All IAM policies must follow least-privilege principle without wildcards
   - GitHub webhook must validate HMAC signatures for security

5. **Encryption and Compliance**
   - Configure build artifacts encryption using customer-managed KMS keys
   - Pipeline artifacts must use SSE-KMS encryption with rotation enabled

6. **Automation and Notifications**
   - Create CloudWatch EventBridge rule to trigger pipeline on git push events
   - Set up notifications for pipeline state changes

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use CodePipeline for orchestration
- Use CodeBuild for build and deploy stages
- Use S3 for state storage and artifact storage
- Use KMS for encryption keys
- Use EventBridge for GitHub webhook integration
- Use IAM for cross-account access control
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- Target AWS accounts: dev (123456789012), staging (234567890123), prod (345678901234)

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter in their names for uniqueness
- Enable deletion_protection = false for all resources (all resources must be destroyable)
- No resources should use RETAIN or RemovalPolicy.RETAIN
- All resources must be fully removable via pulumi destroy

### Constraints

- CodeBuild compute type must be BUILD_GENERAL1_LARGE for performance
- Pipeline artifacts must use SSE-KMS encryption with rotation enabled
- Each environment pipeline must have unique state bucket with lifecycle policies
- CodeBuild service role must have sts:AssumeRole permission for target accounts
- GitHub webhook must validate HMAC signatures for security
- Build logs retention must be set to 30 days with CloudWatch Logs
- Pipeline must support parallel execution of non-production stages
- Custom CodeBuild image must be scanned for vulnerabilities
- All IAM policies must follow least-privilege principle without wildcards
- Pipeline must implement retry logic for transient Pulumi backend failures
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- Functionality: CodePipeline successfully deploys Pulumi stacks across all three environments
- Security: Cross-account IAM roles properly configured with least-privilege access
- Compliance: All artifacts encrypted, audit trails maintained, manual approval for production
- Automation: GitHub push events automatically trigger pipeline execution
- Reliability: Pipeline handles transient failures with retry logic
- Resource Naming: All resources include environmentSuffix parameter
- Destroyability: All resources can be fully destroyed without retention policies
- Code Quality: TypeScript implementation, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- CodePipeline with Source, Build (Pulumi preview), and Deploy (Pulumi up) stages
- CodeBuild projects configured with custom Pulumi CLI Docker image
- S3 buckets for Pulumi state with versioning and encryption
- KMS keys for artifact encryption with rotation
- IAM roles with cross-account assume permissions
- EventBridge rules for GitHub webhook integration
- CloudWatch Logs configuration with 30-day retention
- Manual approval actions for production deployments
- Separate pipeline configurations for dev, staging, and prod environments
- Unit tests for all components
- Documentation and deployment instructions
