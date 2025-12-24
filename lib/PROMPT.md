Hey team,

We've been asked to set up a comprehensive CI/CD pipeline infrastructure that can handle deployments across multiple AWS accounts. The business needs a secure, automated pipeline that supports deploying to both staging and production environments with proper approval gates and security scanning built in. This is a critical piece of infrastructure that will be used by development teams to ship code safely and efficiently.

The challenge here is that we need to support cross-account deployments while maintaining proper security boundaries. We also need to ensure artifacts are encrypted in transit and at rest, and that we have visibility into pipeline state changes. The team wants CloudFormation so we can version control and reproduce this infrastructure consistently across different regions if needed.

I've been working with the platform team on the requirements. They want a full-featured pipeline with build, test, and deployment stages. Security scanning is mandatory before any code can go to production, and we need manual approval before pushing to prod. Everything needs to be parameterized so different teams can deploy their own pipelines with different account configurations.

## What we need to build

Create a multi-stage CI/CD pipeline using **CloudFormation with yaml** that handles secure deployments across multiple AWS accounts.

### Core Requirements

1. **Pipeline Architecture**
   - Create a CodePipeline with four distinct stages: source, build, test, and deploy
   - Configure CodeBuild projects for both unit testing and security scanning
   - Support deployment to staging and production environments in separate AWS accounts
   - Include manual approval stage before production deployment

2. **Security and Encryption**
   - Implement KMS encryption key for all pipeline artifacts
   - Configure proper key policies allowing cross-account access
   - Set up cross-account IAM roles with least privilege permissions for staging and production deployments
   - Enable security scanning as a mandatory pipeline stage

3. **Artifact Management**
   - Create S3 bucket for storing pipeline artifacts
   - Enable versioning on artifact bucket
   - Configure lifecycle policies to manage artifact retention
   - Apply bucket encryption using KMS key

4. **Monitoring and Notifications**
   - Configure EventBridge rules to capture pipeline state changes
   - Set up notifications for pipeline failures and state transitions
   - Enable CloudWatch logging for pipeline execution

5. **Parameterization and Flexibility**
   - Use CloudFormation parameters for staging and production account IDs
   - Parameterize all resource names with environmentSuffix for uniqueness
   - Allow configuration of source repository details
   - Support different deployment regions through parameters

### Technical Requirements

- All infrastructure defined using **CloudFormation with yaml**
- Use **CodePipeline** for orchestration
- Use **CodeBuild** for build and test stages
- Use **S3** for artifact storage with versioning
- Use **KMS** for artifact encryption
- Use **EventBridge** for state change notifications
- Use **IAM** for cross-account role configuration
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Optional Enhancements

- Add **CodeDeploy** for blue-green deployments to enable zero-downtime releases
- Implement **Lambda** function for custom security gate with flexible validation logic
- Configure **SNS** topics for failure notifications to improve incident response time

### Deployment Requirements

- All resources MUST include environmentSuffix parameter in their names
- NO DeletionPolicy: Retain or UpdateReplacePolicy: Retain on any resources
- All resources must be destroyable
- Pipeline must be fully functional and deployable
- IAM roles must follow least privilege principle
- KMS key policies must allow proper cross-account access
- All CodeBuild projects must have proper service roles

### Constraints

- Must be pure CloudFormation yaml template, no JSON
- Cross-account roles must be assumable by CodePipeline service
- KMS key must allow encryption/decryption from staging and production accounts
- S3 bucket must be private with no public access
- All resources must support complete teardown without manual intervention
- Include proper error handling in build specifications
- EventBridge rules must not create unnecessary noise

## Success Criteria

- **Functionality**: Pipeline successfully deploys through all stages with proper approval gates
- **Performance**: Build and test stages complete efficiently, artifact management is optimized
- **Reliability**: Pipeline handles failures gracefully, state changes are properly tracked
- **Security**: Artifacts are encrypted, cross-account access is properly scoped, IAM follows least privilege
- **Resource Naming**: All resources include environmentSuffix in their names
- **Code Quality**: Clean yaml, well-structured, properly documented with deployment instructions

## What to deliver

- Complete CloudFormation yaml template
- CodePipeline with source, build, test, and deploy stages
- CodeBuild projects for unit testing and security scanning
- Cross-account IAM roles for staging and production
- S3 bucket with versioning and lifecycle policies
- KMS key with cross-account policies
- EventBridge rules for pipeline notifications
- Manual approval stage configuration
- Parameters for account IDs and resource customization
- Documentation with deployment and usage instructions
