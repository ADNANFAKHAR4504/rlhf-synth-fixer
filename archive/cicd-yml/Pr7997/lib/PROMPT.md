# CI/CD Pipeline Integration

Hey team,

Our DevOps team needs to implement a multi-stage CI/CD pipeline for a Node.js microservices application. The pipeline should automatically build, test, and deploy code changes through development, staging, and production environments with proper approval gates and rollback capabilities.

I've been asked to create this using **CDK with TypeScript**. The business wants a fully automated pipeline that can handle the entire deployment lifecycle from source code to production, with proper testing gates and rollback mechanisms.

We need to build something that can orchestrate the entire deployment process, from pulling code from GitHub, building Docker images, running tests, deploying to multiple environments, and handling approvals for production deployments. The key is to make it reliable with automatic rollback capabilities based on health metrics.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **CDK with TypeScript** for deploying containerized microservices. The configuration must:

1. Create a CodePipeline with Source, Build, Test, Deploy-Dev, Deploy-Staging, Approval, and Deploy-Prod stages.
2. Configure GitHub as the source provider with OAuth token stored in Secrets Manager.
3. Set up three CodeBuild projects: one for Docker image building (SMALL compute), one for unit tests (MEDIUM compute), and one for integration tests (LARGE compute).
4. Implement blue/green deployments using CodeDeploy to ECS services with automatic traffic shifting over 10 minutes.
5. Add manual approval action with SNS topic notification before production deployment.
6. Create CloudWatch alarms monitoring ECS task health, ALB target health, and HTTP 5xx errors.
7. Configure automatic rollback when any alarm breaches threshold during deployment.
8. Set up S3 bucket for pipeline artifacts with AES256 encryption and 30-day lifecycle policy.
9. Store environment-specific configuration in Parameter Store with paths like /app/dev/*, /app/staging/*, /app/prod/*.
10. Create CloudWatch Events rule to trigger pipeline on GitHub push to main branch.
11. Output the pipeline ARN, artifact bucket name, and approval topic ARN.

## Environment
Multi-stage CI/CD infrastructure deployed in us-east-1 using AWS CodePipeline for orchestration, CodeBuild for compilation and testing, CodeDeploy for blue/green deployments to ECS Fargate clusters. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured. VPC with private subnets across 3 AZs for ECS tasks. Application Load Balancer for traffic distribution. S3 bucket for artifact storage with encryption enabled. CloudWatch Logs for centralized logging and CloudWatch Alarms for deployment health monitoring.

## Constraints
- Use AWS CodePipeline with at least 4 distinct stages
- Implement manual approval actions between staging and production deployments
- Store build artifacts in S3 with lifecycle policies for 30-day retention
- Use CodeBuild projects with different compute types for build vs integration tests
- Deploy using CodeDeploy with blue/green deployment strategy for zero-downtime
- Configure CloudWatch Events to trigger pipeline on GitHub webhook events
- Implement automated rollback based on CloudWatch alarm thresholds
- Use Systems Manager Parameter Store for storing deployment configuration values

## Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **AWS CodePipeline** for orchestration with at least 4 distinct stages
- Use **AWS CodeBuild** for Docker builds (SMALL compute), unit tests (MEDIUM), and integration tests (LARGE)
- Use **AWS CodeDeploy** for blue/green deployments to ECS Fargate
- Use **Amazon ECS Fargate** for container runtime
- Use **Application Load Balancer** for traffic distribution
- Use **Amazon S3** for artifact storage with AES256 encryption
- Use **AWS Secrets Manager** for GitHub OAuth token
- Use **AWS Systems Manager Parameter Store** for environment configuration
- Use **Amazon CloudWatch** for monitoring, logs, alarms, and events
- Use **Amazon SNS** for approval notifications
- Use **Amazon VPC** with private subnets across 3 AZs
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: pipeline-${environmentSuffix}, build-project-${environmentSuffix}, etc.

## Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names for uniqueness
- All resources must be destroyable (use RemovalPolicy.DESTROY, no RETAIN policies)
- Do NOT create actual ECS services or ALB - focus on the CI/CD pipeline infrastructure
- The pipeline should reference ECS services and ALB that would exist, but don't create them
- For CodeDeploy, create the deployment group configuration but reference existing ECS service
- Include proper IAM roles and permissions for all services
- Ensure S3 bucket has versioning enabled and 30-day lifecycle policy
- CloudWatch alarms should be configured but won't have actual targets without ECS services

## Success Criteria

- **Functionality**: Complete CI/CD pipeline with Source, Build, Test, Deploy stages and approval gates
- **Security**: OAuth token in Secrets Manager, artifact encryption, proper IAM roles
- **Reliability**: Automatic rollback based on CloudWatch alarms, blue/green deployments
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript, well-structured CDK stack, documented
- **Monitoring**: CloudWatch alarms for deployment health, SNS notifications
- **Storage**: S3 bucket with encryption and lifecycle policies

## What to deliver

- Complete **CDK with TypeScript** implementation
- CodePipeline with multiple stages (Source, Build, Test, Deploy-Dev, Deploy-Staging, Approval, Deploy-Prod)
- Three CodeBuild projects with different compute types
- CodeDeploy deployment configuration for blue/green deployments
- S3 bucket for artifacts with encryption and lifecycle policy
- Secrets Manager secret for GitHub OAuth token (placeholder)
- Parameter Store parameters for environment-specific configuration
- CloudWatch alarms for monitoring deployment health
- SNS topic for approval notifications
- CloudWatch Events rule for pipeline triggering
- VPC with private subnets across 3 AZs
- IAM roles and permissions for all services
- Stack outputs: pipeline ARN, artifact bucket name, approval topic ARN
- Unit tests for stack components
- Documentation and deployment instructions
