Hey team,

We need to build a complete CI/CD pipeline for our microservices architecture. The development team has been asking for a standardized way to deploy Python applications across multiple services, and we need something that handles everything from code quality checks to blue-green deployments on ECS Fargate.

The challenge here is creating a reusable pipeline that can handle the full deployment lifecycle. We're talking about source control integration, automated testing, security scanning, Docker image building, and then orchestrating blue-green deployments to minimize downtime. The team wants to replicate this pattern across multiple Python services, so we need to make it robust and well-structured.

I've been asked to create this using **AWS CDK with Python**. The infrastructure needs to cover the entire pipeline from CodeCommit to ECS Fargate, including all the networking, load balancing, and IAM roles required to make it work securely.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **AWS CDK with Python** that automates the deployment of containerized Python applications to ECS Fargate with blue-green deployment capability.

### Core Requirements

1. **CI/CD Pipeline Setup**
   - CodePipeline with three stages: source, build, and deploy
   - CodeCommit repository as the source stage
   - CodeBuild project for build and test execution
   - CodeDeploy for managing blue-green deployments to ECS
   - Pipeline must trigger automatically on code commits

2. **Build and Test Configuration**
   - CodeBuild project with Python 3.9 runtime environment
   - Build specification that runs pytest for unit testing
   - Integration of bandit security scanner for SAST analysis
   - Build artifacts stored in S3 with encryption enabled
   - Docker image building and pushing to ECR

3. **Container Infrastructure**
   - ECR repository for Docker image storage
   - ECR lifecycle policy to retain only the last 10 images
   - ECS cluster configured for Fargate launch type
   - ECS Fargate service with task definition for Python application
   - Blue-green deployment configuration via CodeDeploy

4. **Networking and Load Balancing**
   - VPC with private subnets across 2 availability zones
   - Application Load Balancer for traffic routing
   - Two target groups for blue-green deployment switching
   - Security groups for ALB and ECS tasks with proper ingress/egress rules

5. **Secrets and Configuration Management**
   - Parameter Store integration for Docker Hub credentials
   - CodeBuild environment variables referencing Parameter Store
   - Secure handling of sensitive configuration data

6. **Monitoring and Notifications**
   - CloudWatch Logs for all pipeline stages with 30-day retention
   - CloudWatch Logs for ECS task execution
   - SNS topic for pipeline failure notifications
   - Email subscription to SNS topic for alerting

7. **IAM Security Configuration**
   - IAM role for CodePipeline with least privilege access
   - IAM role for CodeBuild with permissions for testing, building, and ECR push
   - IAM role for CodeDeploy with ECS deployment permissions
   - ECS task execution role with ECR pull and CloudWatch Logs access
   - ECS task role with application-specific permissions

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use AWS CodePipeline for orchestrating the CI/CD workflow
- Use AWS CodeBuild for build stage with Python 3.9 runtime
- Use AWS CodeCommit as source repository
- Use AWS CodeDeploy for blue-green deployment strategy
- Use ECS Fargate for container hosting
- Use Application Load Balancer with target groups for traffic management
- Use ECR for Docker image registry with lifecycle policies
- Use Parameter Store for secrets management
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`

### Multi-Environment Support

The infrastructure must support deployment across multiple environments (dev, staging, prod):
- Accept environmentSuffix as a CDK context parameter
- All resource names include environmentSuffix for isolation
- IAM roles configured for cross-account deployments
- Reference lib/ci-cd.yml for GitHub Actions workflow integration
- Support OIDC authentication for automated deployments

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use RemovalPolicy.DESTROY, NO RemovalPolicy.RETAIN)
- Resource names must include **environmentSuffix** parameter for uniqueness
- CodeCommit repository should be created (not referenced as existing)
- Pipeline execution history retained for 30 days minimum
- Build artifacts encrypted at rest in S3
- SNS topic must have email subscription placeholder (email can be parameterized)
- ECR images automatically cleaned up via lifecycle policy

### Constraints

- Pipeline must use CodeCommit as source (mandatory)
- Build stage must run both pytest and bandit (mandatory)
- Pipeline logs must be retained for 30 days (mandatory)
- Blue-green deployment strategy for ECS (recommended)
- Build artifacts stored in S3 with encryption (recommended)
- Parameter Store for Docker credentials (recommended)
- SNS notifications on pipeline failure (recommended)
- All resources must be fully managed and destroyable for testing purposes
- Include proper error handling and CloudWatch logging throughout

## Success Criteria

- Functionality: Complete working CI/CD pipeline from code commit to deployment
- Automation: Pipeline automatically triggers on CodeCommit changes
- Testing: Both unit tests (pytest) and security scanning (bandit) execute successfully
- Deployment: Blue-green deployment strategy minimizes downtime during updates
- Security: Least privilege IAM roles, encrypted artifacts, secure credential management
- Monitoring: CloudWatch Logs capture all pipeline and application activity
- Notifications: SNS alerts trigger on pipeline failures
- Reusability: Pipeline can be replicated across multiple services with minimal changes
- Resource Naming: All resources include environmentSuffix for environment isolation
- Code Quality: Clean Python CDK code, well-structured, properly documented

## What to deliver

- Complete AWS CDK Python implementation
- CodePipeline with source (CodeCommit), build (CodeBuild), and deploy (CodeDeploy) stages
- CodeBuild project configured for Python 3.9, pytest, and bandit
- ECS cluster and Fargate service with blue-green deployment
- VPC with private subnets and Application Load Balancer
- ECR repository with lifecycle policy
- Parameter Store integration for credentials
- SNS topic for failure notifications
- IAM roles with least privilege access for all services
- CloudWatch Logs with 30-day retention
- Stack outputs including pipeline ARN and ECR repository URI
- Proper error handling and resource tagging
- Deployment instructions and documentation