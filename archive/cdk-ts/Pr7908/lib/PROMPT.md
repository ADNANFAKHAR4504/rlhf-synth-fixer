# Build Automated CI/CD Pipeline for Containerized Applications

Hey team,

We need to build a complete automated CI/CD pipeline for containerized applications. The business wants a solution that handles everything from source code commits to production deployments with proper security controls and monitoring. I've been asked to create this infrastructure using **AWS CDK with TypeScript**.

The pipeline should be production-ready with proper build automation, container registry management, and deployment orchestration. We need to make sure everything follows AWS best practices and includes comprehensive logging so teams can troubleshoot issues quickly.

## What we need to build

Create a complete CI/CD infrastructure using **AWS CDK with TypeScript** for automated container deployments.

### Core Requirements

1. **Source Control Integration**
   - Connect to source repositories (GitHub, CodeCommit, or similar)
   - Trigger pipeline on code changes
   - Support branch-based workflows

2. **Container Build Process**
   - Automated Docker image builds using CodeBuild
   - Build specification for container compilation
   - Build environment configuration
   - Artifact management

3. **Container Registry**
   - Amazon ECR repository for Docker images
   - Image lifecycle policies
   - Image scanning for vulnerabilities
   - Tag immutability settings

4. **Pipeline Orchestration**
   - AWS CodePipeline for workflow automation
   - Multiple stages: Source, Build, Deploy
   - Stage transitions with proper dependencies
   - Approval gates where needed

5. **Deployment Infrastructure**
   - ECS cluster for container orchestration
   - Task definitions for containerized applications
   - Service configuration with load balancing
   - Rolling deployment strategy

6. **IAM and Security**
   - Service roles for CodePipeline, CodeBuild
   - Task execution roles for ECS
   - Least privilege permissions
   - Encryption at rest for artifacts

7. **Monitoring and Logging**
   - CloudWatch Logs for build and deployment logs
   - CloudWatch metrics for pipeline health
   - SNS notifications for pipeline events
   - Alarms for failed deployments

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **AWS CodePipeline** for orchestration
- Use **AWS CodeBuild** for building containers
- Use **Amazon ECR** for container registry
- Use **Amazon ECS** (Fargate preferred) for container deployment
- Use **Application Load Balancer** for traffic distribution
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies, no deletion protection)

### Constraints

- Must support automated deployments on code changes
- Build process should be containerized and reproducible
- Pipeline must include proper error handling
- All stages should have appropriate timeouts
- Security best practices for container deployments
- Cost-effective resource selection (use Fargate over EC2)
- Include proper VPC configuration for ECS tasks
- All resources must be fully destroyable without manual intervention

### Deployment Requirements (CRITICAL)

- ALL named resources MUST include environmentSuffix parameter
- NO RemovalPolicy.RETAIN on any resources
- NO deletion_protection = true on any resources
- ECS services should use deployment configuration for zero-downtime updates
- S3 buckets for artifacts should be destroyable
- CodeBuild projects should cache dependencies for faster builds

## Success Criteria

- **Functionality**: Complete working CI/CD pipeline from source to deployment
- **Automation**: Pipeline triggers automatically on source changes
- **Container Support**: Successfully builds and deploys Docker containers
- **Security**: Proper IAM roles with least privilege, encrypted artifacts
- **Reliability**: Includes retry logic and proper error handling
- **Monitoring**: CloudWatch logs and metrics for all stages
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be deleted without manual cleanup
- **Code Quality**: TypeScript code that is well-structured, tested, and documented

## What to deliver

- Complete **AWS CDK with TypeScript** implementation
- CodePipeline with Source, Build, and Deploy stages
- CodeBuild project with buildspec configuration
- ECR repository with lifecycle policies
- ECS cluster, task definitions, and services
- Application Load Balancer for container access
- IAM roles and policies for all services
- CloudWatch logging and monitoring
- VPC configuration for ECS tasks
- Unit tests for all CDK constructs
- Documentation for pipeline configuration and deployment
