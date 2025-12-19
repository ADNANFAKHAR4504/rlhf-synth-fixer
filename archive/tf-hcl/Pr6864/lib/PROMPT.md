Hey team,

We need to build a comprehensive multi-stage CI/CD pipeline for infrastructure automation. The business has been pushing to modernize our infrastructure deployment process, and they want us to implement a fully automated pipeline that can validate, plan, and deploy Terraform infrastructure changes with proper guardrails and approval gates. This needs to be built using **Terraform with HCL**.

Here's the situation: our current manual infrastructure deployment process is error-prone and time-consuming. We need an automated pipeline that can catch issues early through validation and security scanning, generate Terraform plans for review, and only apply changes after proper approval. The pipeline should be resilient, secure, and provide visibility into every deployment.

One critical thing to note - AWS CodeCommit is being deprecated, so we must use GitHub integration via CodeStar Connections instead. This is non-negotiable. The business also wants full state management with locking to prevent concurrent modifications, and all resources need to be properly tagged and named for easy identification.

## What we need to build

Create a multi-stage CI/CD pipeline infrastructure using **Terraform with HCL** that orchestrates infrastructure deployments with validation, security scanning, planning, and controlled deployment stages.

### Core Requirements

1. **Source Control Integration**
   - GitHub integration using AWS CodeStar Connections (CodeCommit is deprecated)
   - Automatic webhook triggers on code commits to specified branch
   - Branch-based deployment strategies
   - Source artifact generation for pipeline stages

2. **Multi-Stage Pipeline Architecture**
   - Stage 1 - Source: GitHub integration via CodeStar Connections with automatic triggers
   - Stage 2 - Validate: Terraform syntax validation and security scanning with tfsec
   - Stage 3 - Plan: Terraform plan generation with artifact storage and manual approval gate
   - Stage 4 - Apply: Terraform apply with state management and deployment notifications

3. **CodeBuild Projects for Each Stage**
   - Separate CodeBuild projects for validation, planning, and apply stages
   - Terraform CLI integration with appropriate versions
   - Build specifications with environment variable management
   - VPC configuration for secure builds (optional but recommended)
   - CloudWatch Logs integration for build logging

4. **Artifact and State Management**
   - S3 bucket for pipeline artifacts with versioning enabled
   - Separate S3 bucket for Terraform state file storage
   - DynamoDB table for Terraform state locking to prevent concurrent modifications
   - S3 encryption at rest using SSE-S3 or SSE-KMS
   - Lifecycle policies for cost optimization
   - All buckets must block public access

5. **Security and Access Control**
   - IAM roles for CodePipeline orchestration
   - Separate IAM service roles for each CodeBuild project
   - Least privilege access policies
   - Proper trust relationships between services
   - Secure parameter storage using SSM Parameter Store
   - S3 bucket encryption and access controls

6. **Monitoring and Notifications**
   - CloudWatch Logs for build output retention
   - Log groups per CodeBuild project with retention policies
   - SNS topic for deployment notifications
   - Email subscriptions for pipeline status updates
   - CloudWatch Events rules for pipeline state changes
   - CloudWatch alarms for pipeline failures

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **CodePipeline** for multi-stage orchestration with stage transitions
- Use **CodeBuild** for executing Terraform commands in each stage
- Use **CodeStar Connections** for GitHub integration (not CodeCommit)
- Use **S3** for artifact storage and Terraform state backend
- Use **DynamoDB** for state locking with point-in-time recovery
- Use **IAM** for service roles and policies with least privilege
- Use **CloudWatch** for logging and monitoring
- Use **SNS** for notifications and alerts
- Use **SSM Parameter Store** for secure configuration storage
- Resource names must include **environmentSuffix** for uniqueness and environment isolation
- Follow naming convention: resource-type-purpose-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- AWS CodeCommit is deprecated - must use GitHub with CodeStar Connections
- CodeStar Connection requires manual activation in AWS Console after initial deployment
- All S3 buckets must have encryption enabled and block public access
- S3 buckets must use force_destroy=true for destroyability (no deletion protection)
- DynamoDB table must have point-in-time recovery enabled
- IAM policies must follow least privilege principle
- Manual approval stage required between Plan and Apply stages
- All resources must be fully destroyable without retain policies
- Build logs must be retained for troubleshooting
- Pipeline needs remote state backend with locking for its own state

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL resources (S3 buckets, DynamoDB tables, IAM roles, CodePipeline, CodeBuild projects, SNS topics, CloudWatch log groups) MUST include the environmentSuffix variable in their names
- **Destroyability**: All S3 buckets MUST use force_destroy = true to allow cleanup, no DeletionPolicy = Retain allowed
- **State Management**: Include example remote backend configuration for the pipeline infrastructure itself
- **Variables**: Define environment_suffix, aws_region, github_repository_id, github_branch, and notification_email as input variables
- **Outputs**: Export pipeline_name, pipeline_arn, artifact_bucket_name, state_bucket_name, state_lock_table_name, and codestar_connection_arn

## Success Criteria

- **Functionality**: Complete multi-stage pipeline that can validate, plan, and apply Terraform infrastructure
- **Integration**: GitHub integration via CodeStar Connections with automatic webhook triggers
- **Security**: All IAM roles use least privilege, all S3 buckets encrypted and non-public
- **State Management**: Remote state backend with DynamoDB locking to prevent conflicts
- **Monitoring**: CloudWatch Logs for all builds, SNS notifications for pipeline status
- **Approval Gates**: Manual approval required between Plan and Apply stages
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean HCL code with proper variable definitions and comprehensive outputs

## What to deliver

- Complete Terraform HCL implementation with modular structure
- CodePipeline resource with all four stages (Source, Validate, Plan, Apply)
- CodeBuild projects for validation, planning, and apply stages
- S3 buckets for artifacts and Terraform state with encryption
- DynamoDB table for state locking with PITR enabled
- IAM roles and policies for CodePipeline and CodeBuild
- CodeStar Connection resource for GitHub integration
- SNS topic and email subscription for notifications
- CloudWatch log groups for build logging
- Variables file (variables.tf) with all required inputs
- Outputs file (outputs.tf) with all required exports
- Example terraform.tfvars file for configuration
- README.md with deployment instructions and post-deployment steps
