Hey team,

We need to build out a complete CI/CD pipeline infrastructure for our development team. They're currently doing manual deployments and it's becoming a bottleneck - we need to automate the entire workflow from code commit to deployment. I've been asked to create this infrastructure using **AWS CDK with Go**.

The development team wants a full pipeline that can handle their application lifecycle automatically. When they push code changes, the system should pick them up, run builds, execute tests, and deploy to the target environment. They also need visibility into what's happening - notifications when things succeed or fail, and proper logging so they can debug issues.

Right now they're spending too much time on manual processes and there's risk of human error in deployments. We need something reliable and secure that follows AWS best practices.

## What we need to build

Create a comprehensive CI/CD pipeline infrastructure using **AWS CDK with Go** that automates application deployments from source to production.

### Core Requirements

1. **Pipeline Orchestration**
   - Implement AWS CodePipeline as the main orchestration engine
   - Configure source stage for code repository integration (CodeCommit or GitHub)
   - Set up build stage with CodeBuild integration
   - Include deploy stage for application deployments
   - Pipeline should trigger automatically on source changes

2. **Build Automation**
   - Configure AWS CodeBuild project for compilation and testing
   - Define proper build specifications (buildspec)
   - Handle build artifacts efficiently
   - Integrate with pipeline artifact management

3. **IAM Security**
   - Create service role for CodePipeline with least-privilege permissions
   - Create service role for CodeBuild with appropriate build permissions
   - Configure cross-service permissions (pipeline to trigger builds, access S3, etc.)
   - Follow AWS security best practices for service-to-service access

4. **Artifact Storage**
   - Set up S3 bucket for pipeline artifacts
   - Enable versioning for artifact history
   - Configure server-side encryption at rest
   - Implement proper lifecycle policies

5. **Notifications and Monitoring**
   - Create SNS topic for pipeline event notifications
   - Configure notifications for pipeline state changes (started, succeeded, failed)
   - Set up alerts for build failures
   - Integrate CloudWatch Logs for pipeline and build logging
   - Configure log retention policies

### Technical Requirements

- All infrastructure defined using **AWS CDK with Go**
- Use **AWS CodePipeline** for CI/CD orchestration
- Use **AWS CodeBuild** for build automation
- Use **AWS S3** for artifact storage with encryption
- Use **AWS SNS** for event notifications
- Use **AWS IAM** for service roles and permissions
- Use **AWS CloudWatch Logs** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region

### Constraints

- All resources must use environmentSuffix parameter for unique naming across environments
- Enable encryption at rest for all artifact storage
- Use least-privilege IAM policies - grant only required permissions
- No hardcoded credentials or secrets in code
- All resources must be destroyable (no DeletionPolicy: Retain or RemovalPolicy: RETAIN)
- CloudWatch Logs must be configured with appropriate retention periods
- Follow AWS CDK best practices for Go
- Code must be production-ready and maintainable

### Deployment Requirements (CRITICAL)

- All resources MUST include **environmentSuffix** in their names for uniqueness
- Example: `cicd-pipeline-${environmentSuffix}`, `build-project-${environmentSuffix}`, `artifacts-bucket-${environmentSuffix}`
- Infrastructure must be completely destroyable - use RemovalPolicy.DESTROY for all resources
- FORBIDDEN: RemovalPolicy.RETAIN on any resource (S3 buckets, logs, etc.)

## Success Criteria

- **Functionality**: Pipeline successfully orchestrates source → build → deploy workflow
- **Automation**: Pipeline triggers automatically on source repository changes
- **Security**: All IAM roles follow least-privilege principle with no hardcoded credentials
- **Monitoring**: CloudWatch Logs capture all pipeline and build activity
- **Notifications**: SNS topic publishes events for all pipeline state changes
- **Reliability**: Build failures are detected and reported through notifications
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Go code, well-structured, follows CDK patterns, fully documented

## What to deliver

- Complete AWS CDK Go implementation in lib/ directory
- AWS CodePipeline with source, build, and deploy stages
- AWS CodeBuild project with proper build specifications
- AWS S3 bucket for artifacts with versioning and encryption
- AWS SNS topic for pipeline notifications
- IAM service roles for CodePipeline and CodeBuild
- CloudWatch Logs integration for monitoring
- Stack outputs exposing pipeline ARN, build project name, bucket name, SNS topic ARN
- Unit tests achieving 100% coverage in tests/ directory
- Integration tests validating deployed infrastructure
- Documentation including deployment and usage instructions
