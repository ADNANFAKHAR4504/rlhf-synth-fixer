Hey team,

We need to build a production-ready CI/CD pipeline for containerized microservices. The development team has been manually deploying their applications to ECS, and they need an automated solution that handles everything from source code to production deployment with proper security controls and rollback capabilities.

The pipeline needs to support their workflow where developers push code to GitHub, have it automatically built and tested, deployed to a staging environment for validation, then pushed to production after manual approval. They're running containerized applications on ECS Fargate in both us-east-1 and us-west-2, and they need Blue/Green deployments to minimize downtime during releases.

Security is a major concern here. All artifacts must be encrypted at rest, IAM roles need to follow least-privilege principles, and they want CloudWatch notifications whenever pipeline state changes occur. The team also needs proper logging for debugging build failures.

## What we need to build

Create a multi-stage CI/CD pipeline infrastructure using **CloudFormation with YAML** that orchestrates the complete deployment lifecycle for containerized applications.

### Core Requirements

1. **Pipeline Orchestration**
   - Create CodePipeline with exactly 5 stages in sequence: Source (GitHub), Build, Test, Deploy-Staging, Deploy-Production
   - Configure GitHub as the source provider with OAuth token integration
   - Set up artifact storage between pipeline stages

2. **Build and Test Infrastructure**
   - Configure CodeBuild project for the Build stage with buildspec.yml inline specification
   - Configure separate CodeBuild project for the Test stage with buildspec.yml inline specification
   - Use compute type BUILD_GENERAL1_SMALL with Amazon Linux 2 runtime environment
   - Enable CloudWatch Logs integration with 30-day retention period for both projects

3. **Deployment Strategy**
   - Implement ECS Blue/Green deployments using CodeDeploy for staging environment
   - Implement ECS Blue/Green deployments using CodeDeploy for production environment
   - Configure deployment groups with Fargate launch type compatibility
   - Set up Application Load Balancer target group switching for zero-downtime deployments

4. **Security Controls**
   - Create S3 bucket for pipeline artifacts with server-side encryption using customer-managed KMS key
   - Define IAM role for CodePipeline with minimal required permissions (no wildcard actions)
   - Define IAM role for CodeBuild projects with minimal required permissions (no wildcard actions)
   - Define IAM role for CodeDeploy with minimal required permissions for ECS Blue/Green deployments
   - Enable S3 bucket versioning and block public access

5. **Manual Approval Gate**
   - Add manual approval action between Deploy-Staging and Deploy-Production stages
   - Configure approval action with SNS notification to approval team
   - Set approval timeout and custom approval message

6. **Monitoring and Notifications**
   - Configure CloudWatch Events rule to capture pipeline state change events
   - Create SNS topic for pipeline notifications with email subscription endpoint
   - Send notifications for pipeline execution state changes (STARTED, SUCCEEDED, FAILED)
   - Create CloudWatch Logs groups for CodeBuild projects with 30-day retention

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML** syntax
- Deploy to **us-east-1** as primary region
- Use **CodePipeline** for orchestration with exactly 5 stages
- Use **CodeBuild** for Build and Test stages with inline buildspec.yml
- Use **CodeDeploy** for ECS Blue/Green deployments to staging and production
- Use **S3** for artifact storage with **KMS** customer-managed key encryption
- Use **CloudWatch Events** to trigger **SNS** notifications on pipeline state changes
- Use **CloudWatch Logs** for CodeBuild project logs with 30-day retention
- All IAM roles must follow least-privilege principle with no wildcard (*) permissions in action lists
- Resource names must include **EnvironmentSuffix** parameter for uniqueness across multiple deployments
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`

### Constraints

- CodeBuild projects must use BUILD_GENERAL1_SMALL compute type
- CodeBuild projects must use Amazon Linux 2 runtime image
- Pipeline must have exactly 5 stages in order: Source, Build, Test, Deploy-Staging, Deploy-Production
- All IAM policies must use specific actions, no wildcard (*) actions allowed
- Artifacts must be encrypted with customer-managed KMS key, not AWS-managed key
- Manual approval action must be placed between Deploy-Staging and Deploy-Production
- All resources must be destroyable (use DeletionPolicy: Delete, no Retain policies)
- CloudWatch Logs retention must be set to 30 days for cost optimization

### Deployment Requirements (CRITICAL)

- All resource names MUST include **EnvironmentSuffix** parameter using CloudFormation !Sub or !Join intrinsic functions
- Example: `!Sub 'codepipeline-cicd-${EnvironmentSuffix}'`
- All resources MUST use `DeletionPolicy: Delete` - no Retain policies allowed
- S3 bucket MUST have DeletionPolicy: Delete for test environment cleanup
- KMS keys MUST be deletable - use PendingWindowInDays for scheduled deletion

## Success Criteria

- Functionality: Complete 5-stage pipeline that orchestrates source retrieval, build, test, staging deployment, manual approval, and production deployment
- Security: All IAM roles follow least-privilege with specific actions, artifacts encrypted with customer KMS key, S3 bucket has versioning and blocked public access
- Reliability: Blue/Green deployments ensure zero-downtime releases, CloudWatch monitoring captures all pipeline state changes
- Monitoring: CloudWatch Events trigger SNS notifications for all pipeline state changes, CodeBuild logs retained for 30 days
- Resource Naming: All resources include EnvironmentSuffix parameter for multi-environment deployments
- Code Quality: Valid CloudFormation YAML syntax, properly structured template with Parameters, Resources, and Outputs sections

## What to deliver

- Complete CloudFormation YAML template implementing the CI/CD pipeline
- S3 bucket with KMS encryption for artifacts
- CodePipeline with 5 stages (Source, Build, Test, Deploy-Staging, Deploy-Production)
- Two CodeBuild projects (Build and Test) with inline buildspec.yml specifications
- CodeDeploy configuration for ECS Blue/Green deployments
- IAM roles for CodePipeline, CodeBuild, and CodeDeploy with least-privilege policies
- CloudWatch Events rule connected to SNS topic for pipeline notifications
- CloudWatch Logs groups for CodeBuild projects with 30-day retention
- Template parameters including EnvironmentSuffix, GitHubToken, RepositoryName, BranchName
- Template outputs for pipeline ARN, S3 bucket name, and SNS topic ARN
