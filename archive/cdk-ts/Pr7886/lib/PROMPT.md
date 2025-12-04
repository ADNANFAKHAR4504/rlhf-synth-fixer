Hey team,

We need to build a comprehensive CI/CD pipeline infrastructure that can handle multi-stage deployments across different environments. I've been looking at how we can automate our application deployments from source to production using **AWS CDK with TypeScript**. The business wants a complete solution that includes build automation, testing stages, manual approval gates, and cross-account deployment capabilities.

The main challenge here is creating a robust pipeline system that supports our development workflow. We need separate pipelines for development, staging, and production environments, with proper security controls and automatic rollback capabilities. The system should notify teams about pipeline state changes and use Lambda functions for custom integration testing. We're aiming for a fully automated deployment process with the right checks and balances in place.

## What we need to build

Create a multi-stage CI/CD infrastructure using **AWS CDK with TypeScript** that orchestrates deployments across multiple environments.

### Core Requirements

1. **Multi-Environment Pipeline System**
   - Set up CodePipeline instances for development, staging, and production environments
   - Each pipeline must have source, build, test, and deploy stages
   - Configure CodeBuild projects for building and testing Node.js applications
   - All pipelines must support the same stage structure but target different environments

2. **Artifact Storage and Versioning**
   - Use S3 buckets for storing build artifacts
   - Enable versioning on all artifact buckets
   - Ensure proper lifecycle policies for artifact retention
   - Each environment should have dedicated artifact storage

3. **Approval and Control Gates**
   - Implement manual approval actions between staging and production deployments
   - Configure approval SNS notifications to alert relevant teams
   - Ensure approvers have proper IAM permissions

4. **Custom Pipeline Actions with Lambda**
   - Deploy Lambda functions for custom pipeline actions
   - Functions should handle integration testing execution
   - Include proper error handling and logging
   - Lambda functions must report back to CodePipeline with success/failure status

5. **Monitoring and Notifications**
   - Configure SNS topics for pipeline state change notifications
   - Set up CloudWatch Events to track pipeline execution status
   - Send notifications for pipeline failures, approvals needed, and successful deployments
   - Enable monitoring for automatic rollback detection

6. **Cross-Account Deployment Capabilities**
   - Set up IAM roles for cross-account deployments
   - Configure trust relationships between accounts
   - Ensure proper permissions for CodePipeline to assume cross-account roles
   - Include role ARNs as configurable parameters

7. **Automatic Rollback on Failures**
   - Implement CloudWatch alarms to detect deployment failures
   - Configure automatic rollback mechanisms using CloudWatch and Lambda
   - Set failure thresholds for automatic rollback triggers
   - Log all rollback events for audit purposes

8. **Resource Organization and Tagging**
   - Tag all resources with Environment, Project, and Owner tags
   - Use consistent naming conventions across all resources
   - Resource names must include **environmentSuffix** parameter for uniqueness
   - Follow naming pattern: resource-type-environmentSuffix

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **AWS CodePipeline** for orchestrating the deployment workflow
- Use **AWS CodeBuild** for build and test execution
- Use **AWS S3** for artifact storage with versioning
- Use **AWS Lambda** for custom pipeline actions
- Use **AWS SNS** for notifications
- Use **AWS IAM** for cross-account role management
- Use **Amazon CloudWatch** for monitoring and rollback automation
- Resource names must include **environmentSuffix** for environment isolation
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- Every resource name MUST include the **environmentSuffix** parameter to ensure uniqueness across deployments
- Use RemovalPolicy.DESTROY for all resources (S3 buckets, Lambda functions, SNS topics)
- For S3 buckets, set autoDeleteObjects: true to ensure clean teardown
- No resources should have RETAIN policies as this prevents proper cleanup
- Lambda function code should be inline or bundled, not referencing external files
- CodeBuild projects should use standard AWS-managed images
- SNS topics should not have subscriptions that prevent deletion

### Constraints

- Must support deployment to multiple AWS accounts via cross-account IAM roles
- Pipeline artifacts must be encrypted at rest
- All IAM roles must follow least-privilege principles
- CodeBuild projects must use specific Node.js runtime versions
- Manual approval actions must require explicit confirmation
- Rollback must occur within defined time thresholds
- All Lambda functions must have appropriate timeout and memory configurations
- Pipeline execution must be idempotent

## Success Criteria

- Functionality: All three environment pipelines (dev, staging, prod) deploy successfully
- Pipeline Stages: Source, build, test, and deploy stages execute correctly
- Approval Gates: Manual approval properly blocks production deployments until confirmed
- Custom Actions: Lambda functions execute integration tests and report results to CodePipeline
- Notifications: SNS topics send alerts for all pipeline state changes
- Cross-Account: IAM roles allow deployment to different AWS accounts
- Rollback: Automatic rollback triggers on deployment failures
- Resource Naming: All resources include environmentSuffix for isolation
- Tagging: All resources tagged with Environment, Project, and Owner
- Code Quality: TypeScript code is well-structured, modular, and documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- CodePipeline configurations for dev, staging, and production
- CodeBuild projects for build and test stages
- S3 buckets with versioning for artifact storage
- Lambda functions for custom pipeline actions (integration tests)
- SNS topics for notifications
- IAM roles for cross-account deployments
- CloudWatch alarms and automation for rollback
- Proper tagging and naming with environmentSuffix support
- Clean, modular code structure with Constructs
- Documentation on deployment and usage
