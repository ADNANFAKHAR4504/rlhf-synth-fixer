Hey team,

We need to build a complete CI/CD pipeline infrastructure for our containerized Node.js applications. The DevOps team has been manually building and deploying containers, and it's becoming a bottleneck. We need to automate the entire workflow from code commit to production deployment. I've been asked to create this infrastructure using Pulumi with Python.

The business wants a fully automated pipeline that can handle building Docker images, running tests, pushing to our container registry, and deploying to ECS. Security is a major concern, so everything needs encryption at rest and in transit, plus proper IAM controls following least privilege principles.

We're targeting the Singapore region (ap-southeast-1) for this deployment. The infrastructure needs to be completely reproducible and destroyable without leaving any orphaned resources behind.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with Python** for deploying containerized Node.js applications to AWS ECS.

### Core Requirements

1. **Source Code and Pipeline Orchestration**
   - Set up AWS CodePipeline to orchestrate the entire CI/CD workflow
   - Configure source stage integration for code repositories
   - Implement automated triggers on code changes
   - Handle pipeline execution with proper error handling

2. **Build and Test Infrastructure**
   - Deploy AWS CodeBuild projects for building containerized applications
   - Configure Docker-based build environments for Node.js applications
   - Set up automated testing during the build phase
   - Implement build artifact management
   - Configure CloudWatch Logs for build output and debugging

3. **Container Registry Management**
   - Create Amazon ECR repositories for storing Docker images
   - Implement image scanning on push for security vulnerabilities
   - Configure lifecycle policies for image retention
   - Enable encryption at rest using AWS KMS
   - Set up proper access controls for push/pull operations

4. **Application Deployment**
   - Configure AWS CodeDeploy for ECS deployments
   - Set up Amazon ECS clusters, services, and task definitions
   - Implement blue/green deployment strategies
   - Configure health checks and rollback mechanisms
   - Enable container insights for monitoring

5. **Security and Encryption**
   - Implement encryption at rest for all data stores using AWS KMS
   - Ensure encryption in transit using TLS/SSL
   - Create IAM roles and policies following least privilege principle
   - Fetch secrets from existing AWS Secrets Manager entries (do not create new secrets)
   - Enable audit logging for all pipeline activities

6. **Monitoring and Logging**
   - Configure CloudWatch Logs for all services
   - Set up log retention policies
   - Enable detailed monitoring for pipeline stages
   - Implement CloudWatch metrics for pipeline health

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS CodePipeline** for workflow orchestration
- Use **AWS CodeBuild** for building and testing containers
- Use **AWS CodeDeploy** for ECS deployments
- Use **Amazon ECR** as the container registry
- Use **Amazon ECS** for running containerized applications
- Use **AWS KMS** for encryption at rest
- Use **IAM** for access control and service roles
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness and multi-environment support
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **ap-southeast-1** region
- All resources must use appropriate tags for organization and cost tracking

### Constraints

- All resources must be fully destroyable (no DeletionPolicy: Retain)
- Secrets should be fetched from existing Secrets Manager entries, not created by this template
- Follow AWS security best practices including encryption and least privilege
- IAM roles must have only the minimum required permissions
- All data at rest must be encrypted using KMS
- All data in transit must use TLS/SSL
- Build and deployment processes must include proper error handling
- CloudWatch logging must be enabled for all services
- Resource naming must support multiple environments through environmentSuffix

### Destroyability Requirements

- No retention policies that prevent resource deletion
- ECR repositories should be deletable when empty
- CloudWatch log groups should be deletable
- All IAM roles and policies should be cleanly removable
- KMS keys should support deletion (with standard waiting periods)
- No hardcoded references that prevent clean teardown

## Success Criteria

- Functionality: Complete end-to-end CI/CD pipeline from code to deployment
- Automation: Zero manual intervention required for build and deploy
- Security: All encryption requirements met, IAM follows least privilege
- Reliability: Pipeline handles failures gracefully with proper error messages
- Monitoring: Comprehensive logging and metrics for all pipeline stages
- Resource Naming: All resources include environmentSuffix for multi-environment support
- Destroyability: All infrastructure can be completely torn down without orphaned resources
- Code Quality: Clean Python code, well-structured Pulumi program, proper resource dependencies

## What to deliver

- Complete Pulumi Python implementation with proper project structure
- AWS CodePipeline configuration with all stages (Source, Build, Deploy)
- AWS CodeBuild projects with Docker build specifications
- Amazon ECR repositories with security scanning and lifecycle policies
- AWS CodeDeploy configuration for ECS deployments
- Amazon ECS cluster, services, and task definitions
- IAM roles and policies for all services with least privilege
- KMS keys for encryption at rest
- CloudWatch log groups for all services
- Comprehensive unit tests for all components
- Integration tests validating the complete pipeline workflow
- Documentation including deployment instructions and architecture overview
- All code should support the environmentSuffix parameter for multi-environment deployments
