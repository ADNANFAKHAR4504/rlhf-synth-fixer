# CI/CD Pipeline Infrastructure

Hey team,

We need to build a comprehensive CI/CD pipeline infrastructure for our containerized Node.js microservices. Our DevOps team has been manually deploying applications across staging and production environments, and it's becoming unsustainable. We need an automated pipeline that handles everything from source commits to production deployments with proper approval gates and security controls.

The business is looking for a solution that standardizes how we deploy containerized applications across multiple AWS accounts. We have staging and production environments in separate AWS accounts, and we need to ensure that code changes flow through proper testing and approval stages before reaching production customers.

I've been asked to create this using **CloudFormation with JSON** for our us-east-1 region. The pipeline needs to orchestrate multiple AWS services including CodeCommit for source control, CodeBuild for Docker image builds, CodePipeline for orchestration, and CodeDeploy for deployments to our EC2 Lambda clusters.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **CloudFormation with JSON** that automatically builds, tests, and deploys containerized Node.js applications with proper staging gates and security controls.

### Core Requirements

1. **Pipeline Orchestration**
   - Set up AWS CodePipeline with source, build, and deploy stages
   - Configure automatic triggering on CodeCommit repository changes
   - Implement manual approval action between staging and production stages
   - Output pipeline ARN and execution role ARN

2. **Container Build System**
   - Configure AWS CodeBuild project to build Docker images
   - Push built images to Amazon ECR registry
   - Use compute type BUILD_GENERAL1_SMALL for builds
   - Include proper buildspec configuration

3. **Deployment Infrastructure**
   - Deploy to EC2 Lambda clusters using AWS CodeDeploy
   - Enable rolling updates for zero-downtime deployments
   - Configure deployment to both staging and production environments
   - Support cross-account deployments (staging: 123456789012, production: 987654321098)

4. **Artifact Storage**
   - Create S3 bucket for pipeline artifacts
   - Enable AES256 encryption for all stored artifacts
   - Configure proper lifecycle policies

5. **Security and IAM**
   - Define IAM roles with least-privilege policies for CodePipeline, CodeBuild, and CodeDeploy
   - Enable cross-account deployment permissions
   - Ensure proper service-to-service authentication

6. **Event-Driven Triggers**
   - Configure CloudWatch Events to trigger pipeline on CodeCommit pushes
   - Support branch-based triggering

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS CodePipeline** for pipeline orchestration
- Use **AWS CodeBuild** for Docker image builds
- Use **AWS CodeCommit** for source control
- Use **AWS CodeDeploy** for EC2 deployments
- Use **Amazon ECR** for container registry
- Use **Amazon S3** for artifact storage with encryption
- Use **AWS IAM** for service roles and policies
- Use **Amazon CloudWatch Events** for pipeline triggers
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- Deploy to **us-east-1** region
- All resources must use DeletionPolicy: Delete for destroyability

### Optional Enhancements

- **AWS CodeDeploy Blue/Green**: Add support for blue/green EC2 deployments for zero-downtime releases
- **Amazon SNS**: Implement SNS notifications for pipeline state changes to improve team visibility
- **Amazon CloudWatch Synthetics**: Add post-deployment testing with synthetic canaries

### Constraints

- Use CodeCommit for source control with branch-based triggers
- CodeBuild projects must use compute type BUILD_GENERAL1_SMALL
- Deploy to EC2 Lambda clusters with rolling updates enabled
- Manual approval required between staging and production deployments
- All build artifacts must be encrypted at rest in S3
- Multi-account setup: staging (123456789012) and production (987654321098)
- VPC architecture with private subnets for containers and public subnets for ALB
- ALB for load balancing in both environments
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete automated CI/CD pipeline from commit to deployment
- **Security**: Least-privilege IAM policies, encrypted artifacts, secure cross-account access
- **Reliability**: Rolling updates, manual approval gates, proper error handling
- **Automation**: CloudWatch Events trigger pipeline automatically on code commits
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources use DeletionPolicy: Delete
- **Multi-Account**: Successful cross-account deployments to staging and production
- **Code Quality**: Clean JSON CloudFormation template, well-structured, documented

## Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL named resources must include the environmentSuffix parameter for uniqueness across parallel deployments. Use format: `{resource-type}-${EnvironmentSuffix}`
- **Destroyability**: ALL resources must set DeletionPolicy: Delete. No resources with Retain policies allowed.
- **No Account-Level Resources**: Do not create AWS GuardDuty detectors (account-level, only one per account allowed)
- **AWS Config IAM**: If using AWS Config, use correct managed policy: `service-role/AWS_ConfigRole`
- **Lambda Runtime**: If using Lambda with Node.js 18+, avoid AWS SDK v2 (not available), use SDK v3 or extract data from event object

## What to deliver

- Complete CloudFormation JSON template implementation
- AWS CodePipeline with source, build, deploy stages
- AWS CodeBuild project for Docker image builds
- AWS CodeCommit repository integration
- AWS CodeDeploy configuration for EC2 Lambda deployments
- Amazon ECR repository for container images
- Amazon S3 bucket for encrypted artifact storage
- AWS IAM roles and policies with least-privilege access
- Amazon CloudWatch Events rule for automatic pipeline triggering
- Optional: SNS notifications for pipeline events
- Optional: CloudWatch Synthetics for post-deployment validation
- CloudFormation outputs for pipeline ARN and execution role ARN
- Unit tests for all template components
- Documentation and deployment instructions
