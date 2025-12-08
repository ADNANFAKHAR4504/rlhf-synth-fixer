Hey team,

We need to build a reusable CI/CD pipeline infrastructure for our microservices teams. The goal is to create a standardized CDK construct that provisions AWS CodePipeline with all the bells and whistles needed for automated containerized application deployments to ECS Fargate. I've been asked to implement this using **AWS CDK with Python**.

Our DevOps team has been noticing that different development teams are building their own CI/CD workflows from scratch, which leads to inconsistency in how we handle testing, security scanning, and multi-account deployments. We need a repeatable pattern that teams can just plug their application details into and get a production-grade pipeline.

The business wants us to support the full development lifecycle from code commit through production deployment, with proper approval gates and automated rollback capabilities. This needs to work across our multi-account AWS setup where dev, staging, and production environments are in separate accounts.

## What we need to build

Create a reusable CDK construct using **AWS CDK with Python** that provisions a complete CI/CD pipeline for containerized ECS applications.

### Core Requirements

1. **Reusable CDK Construct**
   - Accept application name, GitHub repository details, and target ECS cluster as parameters
   - Design for reusability across multiple microservices teams
   - Encapsulate all pipeline resources in a single construct

2. **Multi-Stage CodePipeline**
   - Source stage: GitHub repository integration
   - Build stage: CodeBuild for Docker image creation
   - Test stage: Automated unit test execution
   - Staging deploy stage: Deploy to staging environment
   - Manual approval gate: Human approval before production
   - Production deploy stage: Deploy to production environment

3. **CodeBuild Projects**
   - Build Docker images from Dockerfile
   - Run unit tests during build
   - Push container images to ECR
   - Separate CodeBuild project for security scanning using Trivy on Docker images
   - Use Amazon Linux 2 standard runtime images

4. **Blue/Green Deployment with CodeDeploy**
   - Configure blue/green deployment for ECS services
   - Automatic rollback on deployment failures
   - Integration with ECS Fargate

5. **Cross-Account Deployment**
   - Support deployment to separate AWS accounts for staging and production
   - Use IAM assumed roles for cross-account access
   - Proper permission boundaries and least privilege

6. **CloudWatch Monitoring**
   - Create dashboards showing pipeline metrics
   - Track build duration
   - Monitor deployment success rates
   - Visibility into pipeline health

7. **SNS Notifications**
   - Configure SNS topic for pipeline state changes
   - Email subscriptions for deployment notifications
   - Alert on pipeline failures

8. **Integration Testing**
   - Automated integration test stage
   - Spin up temporary ECS task for testing
   - Clean up test resources after completion

9. **Parameter Store Integration**
   - Store build-time secrets in AWS Systems Manager Parameter Store
   - Manage runtime configurations
   - Secure access to sensitive values

10. **Artifact Management**
    - Store pipeline artifacts in versioned S3 buckets
    - Enable S3 bucket encryption for artifacts
    - Lifecycle policies for artifact retention

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **us-east-1** region
- Use **CodePipeline** for orchestration
- Use **CodeBuild** for building Docker images and running tests
- Use **ECR** for container registry
- Use **ECS Fargate** for container hosting
- Use **CodeDeploy** for blue/green deployments
- Use **CloudWatch** for dashboards and metrics
- Use **SNS** for notifications
- Use **S3** for artifact storage with encryption
- Use **Systems Manager Parameter Store** for secrets management
- Use **IAM** for cross-account roles
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Use CDK L2 constructs where available

### CI/CD Integration Requirements (Reference lib/ci-cd.yml)

The infrastructure should be compatible with GitHub Actions workflows that use:
- OIDC authentication for AWS credentials
- Multi-stage deployments across dev, staging, and prod environments
- Manual approval gates between environments
- Security scanning with cdk-nag or equivalent
- Cross-account role assumptions for staging and production

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use RemovalPolicy.DESTROY)
- No Retain policies on any resources
- Include proper error handling and logging
- Support parameterization for different applications and environments

### Known Blockers

This CI/CD pipeline requires external parameters that must be provided at deployment time:
- GitHub OAuth token for source stage integration
- Cross-account IAM role ARNs for staging and production deployments
- ECS cluster details (cluster name, service name, task definition)
- Email addresses for SNS notification subscriptions

These parameters should be accepted as construct properties with clear documentation on how to provide them.

## Success Criteria

- Reusable CDK construct that accepts application parameters
- Complete CodePipeline with all six stages (source, build, test, staging deploy, approval, prod deploy)
- CodeBuild projects for building and security scanning
- Blue/green deployment configuration with automatic rollback
- Cross-account deployment capabilities with assumed roles
- CloudWatch dashboards showing pipeline metrics
- SNS notifications for pipeline state changes
- Integration test stage with temporary ECS task
- Parameter Store integration for secrets
- S3 artifact storage with encryption and versioning
- All resources include environmentSuffix in naming
- Code is well-structured, type-hinted, and documented
- Compatible with GitHub Actions CI/CD workflows

## What to deliver

- Complete **AWS CDK with Python** implementation in lib/ directory
- Main construct in lib/cicd_pipeline_construct.py (reusable construct class)
- Stack implementation in lib/tap_stack.py (instantiates the construct)
- Entry point in bin/tap.py with proper sys.path configuration
- Python package initialization file lib/__init__.py
- Unit tests for construct components
- Clear documentation of required parameters and setup instructions
- README explaining how to use the construct and what external parameters are needed
