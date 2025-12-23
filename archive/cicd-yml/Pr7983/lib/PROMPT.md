# Terraform CI/CD Pipeline for Multi-Account Infrastructure Deployments

Hey team,

We need to build an automated CI/CD pipeline for deploying Terraform infrastructure across multiple AWS accounts. The DevOps team has been manually running Terraform commands for deployments to dev, staging, and production environments, and they want to automate this with proper approval gates and security controls.

I've been asked to create this using **Terraform with HCL**. The business wants a CodePipeline that can automatically validate and deploy Terraform configurations while maintaining proper state management and requiring manual approval before production changes.

The challenge here is setting up cross-account deployments where our pipeline runs in a central pipeline account but needs to assume roles in three target accounts (dev: 123456789012, staging: 234567890123, production: 345678901234). We need to ensure the pipeline has proper security with encryption, state locking to prevent concurrent modifications, and notifications so the team knows when approvals are needed or when deployments succeed or fail.

## What we need to build

Create a CI/CD pipeline using **Terraform with HCL** that automates Terraform deployments across multiple AWS accounts.

### Core Requirements

1. **CodePipeline Configuration**:
   - Four stages: Source, Plan, Approval, and Apply
   - CodeCommit repository as the source for Terraform configurations
   - Automatic triggering on repository changes
   - KMS encryption for pipeline artifacts

2. **CodeBuild Projects**:
   - Separate projects for terraform plan and terraform apply operations
   - Use terraform:1.5-alpine Docker image
   - 10-minute timeout limits for builds
   - CloudWatch Logs integration for all build outputs
   - Environment variables for account IDs and cross-account role names

3. **Cross-Account IAM Setup**:
   - IAM roles for CodeBuild to assume roles in dev, staging, and prod accounts
   - Proper trust relationships and permissions
   - Least privilege access patterns

4. **State Management**:
   - S3 backend configuration for Terraform state
   - DynamoDB table for state locking
   - Versioning enabled on state bucket

5. **Approval Workflow**:
   - Manual approval action before production deployments
   - SNS topic for approval notifications
   - Integration with pipeline stages

6. **Notifications**:
   - SNS topic for pipeline state changes
   - Subscriptions for pipeline notifications
   - CloudWatch Log groups for build outputs

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Deploy to **us-east-1** region
- CodeBuild must use terraform:1.5-alpine Docker image
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- All resources must be destroyable (no retention policies)
- Proper error handling and logging

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL resources must include environmentSuffix parameter for uniqueness across deployments
- **Destroyability**: ALL resources must be destroyable - no retention policies or stateful resources that prevent destruction
- **CI/CD Integration**: Infrastructure must work with the GitHub Actions workflow defined in lib/ci-cd.yml
- **Multi-Environment Support**: Configuration must support deployment to dev, staging, and production environments
- **Security**: Use KMS encryption for sensitive data, implement least privilege IAM policies

### Constraints

- Pipeline artifacts must be encrypted with KMS
- All build logs stored in CloudWatch Logs
- Manual approval required before production deployment
- CodeBuild projects must have 10-minute timeout limits
- S3 backend with DynamoDB for state locking
- CodeBuild must assume cross-account roles for deployments
- SNS notifications for pipeline state changes

## Success Criteria

- **Functionality**: CodePipeline successfully orchestrates all four stages
- **Cross-Account Access**: CodeBuild can assume roles in target accounts
- **State Management**: Terraform state properly stored and locked
- **Security**: Artifacts encrypted, proper IAM permissions
- **Notifications**: SNS alerts for pipeline events
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Valid HCL syntax, well-structured, documented

## What to deliver

- Complete Terraform HCL implementation
- CodePipeline with Source, Plan, Approval, and Apply stages
- CodeCommit repository resource
- CodeBuild projects for plan and apply
- IAM roles for cross-account access
- S3 bucket and DynamoDB table for state management
- KMS key for artifact encryption
- SNS topic and subscriptions for notifications
- CloudWatch Log groups for build outputs
- Variables configuration using environment suffix
- Documentation and deployment instructions
