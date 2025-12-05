Hey team,

We need to build a comprehensive CI/CD pipeline for deploying containerized applications across multiple AWS accounts. The business wants an automated, secure, and reliable deployment process that takes code from our repository all the way to production, with proper gates and approval checkpoints along the way.

The current challenge is that we're manually deploying container-based applications to ECS, which is time-consuming and error-prone. We need to implement a proper multi-stage pipeline that handles everything from building Docker images to deploying them across dev, staging, and production environments. The pipeline needs to integrate security scanning, manual approval gates, and support cross-account deployments.

This is a critical piece of infrastructure that will enable our development teams to ship features faster while maintaining security and compliance requirements. The business has specifically asked for automated deployments to dev, but manual approval before promoting to staging and production.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **AWS CDK with TypeScript** that automates the deployment of containerized applications through multiple environments with security scanning and approval gates.

### Core Requirements

1. **CodePipeline with Multiple Stages**
   - Source stage to pull code from repository
   - Build stage for creating Docker images and running tests
   - Test stage with unit tests and vulnerability scanning
   - Deploy stages for staging and production environments
   - Integrate all stages into a cohesive pipeline flow

2. **CodeBuild Projects for Container Operations**
   - Build project to create Docker images from application code
   - Push built images to Amazon ECR with proper tagging
   - Support for multi-architecture builds if needed
   - Configure build environment with necessary permissions

3. **Testing and Security**
   - Execute unit tests during the test stage
   - Run container vulnerability scanning on all images
   - Fail the pipeline if critical vulnerabilities detected
   - Generate and store test reports

4. **ECS Deployment Strategy**
   - Deploy to staging ECS cluster first
   - Require manual approval before production deployment
   - Support blue/green or rolling deployments
   - Include health checks and rollback capabilities

5. **Artifact Storage**
   - Use S3 for storing pipeline artifacts
   - Enable encryption at rest for all artifacts
   - Configure lifecycle policies for artifact retention
   - Ensure artifacts are accessible across stages

6. **IAM Security Model**
   - Create least-privilege IAM roles for each pipeline component
   - Source stage role with minimal read permissions
   - Build stage role with ECR push and S3 access
   - Deploy stage roles with ECS update permissions
   - Separate roles for staging and production

7. **CloudWatch Monitoring**
   - Set up alarms for pipeline failures
   - Create alarms for successful production deployments
   - Configure SNS topics for alert notifications
   - Include custom metrics for deployment duration

8. **Cross-Account Deployment Support**
   - Enable pipeline to deploy to production in separate account
   - Configure cross-account IAM roles and trust relationships
   - Set up KMS keys for cross-account artifact encryption
   - Handle cross-account ECR image access

9. **Resource Tagging**
   - Tag all resources with Environment tag (dev, staging, prod)
   - Apply Project tag to identify resource ownership
   - Include CostCenter tag for billing attribution
   - Consistent tagging across all pipeline resources

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS CodePipeline as the orchestration engine
- Use AWS CodeBuild for build and test execution
- Use Amazon ECR for Docker image registry
- Deploy to Amazon ECS Fargate clusters
- Use Amazon S3 with server-side encryption
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies)

### Constraints

- Pipeline must support manual approval gates before production
- All secrets and credentials managed through Secrets Manager or Parameter Store
- Container images must be scanned before deployment
- Cross-account access must use IAM roles, not access keys
- Pipeline artifacts must be encrypted at rest and in transit
- Include proper error handling and retry logic in build specs
- Support for rollback on failed deployments
- Compliance with security best practices and least privilege

### CI/CD Workflow Integration

Reference the provided `lib/ci-cd.yml` GitHub Actions workflow for integration patterns. The infrastructure should support:

- GitHub OIDC authentication for secure credential management
- Multi-stage deployments with manual approval gates
- Encrypted artifact storage between stages
- Cross-account role assumption for production deployments
- Notification webhooks for deployment status
- Integration with security scanning tools

The infrastructure must be designed to work seamlessly with automated CI/CD tools while maintaining security and compliance requirements.

## Success Criteria

- **Functionality**: Complete pipeline with all nine stages working end-to-end
- **Security**: Vulnerability scanning operational, least-privilege IAM roles verified
- **Reliability**: Successful deployments to all environments with proper approval gates
- **Cross-Account**: Production deployments working in separate AWS account
- **Monitoring**: CloudWatch alarms triggering on failures and successes
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Tagging**: All resources properly tagged with Environment, Project, CostCenter
- **Code Quality**: Well-structured TypeScript code with proper CDK constructs

## What to deliver

- Complete AWS CDK TypeScript implementation
- CodePipeline with source, build, test, and deploy stages
- CodeBuild projects for building and pushing Docker images
- Test stage with unit tests and container vulnerability scanning
- ECS deployment configuration with manual approval for production
- S3 bucket with encryption for pipeline artifacts
- IAM roles with least-privilege access for all components
- CloudWatch alarms for pipeline monitoring
- Cross-account deployment configuration and IAM setup
- Proper resource tagging on all components
- Unit tests for all CDK constructs
- Documentation and deployment instructions
- Build specifications for CodeBuild projects
- Integration with reference CI/CD workflow patterns
