Hey team,

We need to set up a comprehensive CI/CD pipeline for infrastructure automation. The business wants to automate our infrastructure deployments using Pulumi, with proper guardrails and approval gates to ensure we can safely deploy to production. Right now, our infrastructure changes are manual and error-prone, and we need a reliable automated pipeline that runs Pulumi commands and manages artifacts properly.

The operations team has requested this because manual deployments are causing delays and sometimes configuration drift between environments. They want a system where infrastructure changes can be previewed, tested, and then deployed with manual approval gates before hitting production. This will give us both speed and safety.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The pipeline needs to handle the full lifecycle from source changes through build, approval, and deployment stages.

## What we need to build

Create a complete CI/CD pipeline system using **Pulumi with TypeScript** for infrastructure automation. The system will deploy to the **us-east-1** region.

### Core Requirements

1. **S3 Artifact Storage**
   - Create an S3 bucket to store pipeline artifacts
   - Enable versioning on the bucket for artifact history
   - Configure encryption and lifecycle policies
   - Bucket name must include **environmentSuffix** for uniqueness

2. **CodeBuild Project Configuration**
   - Set up a CodeBuild project that runs Pulumi commands
   - Support both `pulumi preview` and `pulumi up` commands
   - Configure appropriate build environment with Node.js support
   - Set up environment variables for Pulumi stack configuration
   - Pass ENVIRONMENT_SUFFIX and other stack parameters as environment variables

3. **CodePipeline Setup**
   - Configure a complete pipeline with source, build, and deploy stages
   - Source stage should trigger on S3 changes
   - Build stage runs CodeBuild for infrastructure preview/deployment
   - Deploy stage handles production deployments
   - All pipeline resources must include **environmentSuffix** in names

4. **IAM Roles and Permissions**
   - Create IAM role for CodeBuild with least-privilege policies
   - Create IAM role for CodePipeline with necessary permissions
   - CodeBuild needs permissions for S3, CloudWatch Logs, and CloudFormation operations
   - CodePipeline needs permissions to trigger builds and access artifacts
   - Follow principle of least privilege - no wildcard permissions

5. **CloudWatch Logging**
   - Set up CloudWatch log groups for CodeBuild project logs
   - Configure log retention policies
   - Enable proper log streaming for build outputs
   - Log group names must include **environmentSuffix**

6. **S3 Source Trigger**
   - Configure the pipeline to automatically trigger on S3 source changes
   - Set up proper event notification from S3 to CodePipeline
   - Handle source artifact packaging correctly

7. **Environment Variable Configuration**
   - Pass ENVIRONMENT_SUFFIX to CodeBuild as environment variable
   - Configure PULUMI_ACCESS_TOKEN (reference from parameter store or secrets manager)
   - Pass AWS_DEFAULT_REGION as environment variable
   - Support stack-specific configuration through environment variables

8. **Manual Approval Stage**
   - Include a manual approval stage before production deployments
   - Configure SNS notification for approval requests
   - Set up proper IAM permissions for approval actions
   - Provide clear custom approval messages

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS S3** for artifact storage and source triggers
- Use **AWS CodeBuild** for running Pulumi commands
- Use **AWS CodePipeline** for orchestrating the CI/CD workflow
- Use **AWS IAM** for role and policy management
- Use **AWS CloudWatch Logs** for build logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Reference the provided `lib/ci-cd.yml` for pipeline configuration details

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - use appropriate removal policies
- No Retain policies that prevent cleanup
- For S3 buckets, use `autoDeleteObjects: true` or handle deletion properly
- Ensure CodePipeline and CodeBuild can be deleted cleanly
- CloudWatch log groups should be removable
- All IAM roles and policies must be deletable

### Constraints

- Follow AWS best practices for CI/CD pipeline security
- Use encryption at rest for S3 artifacts (KMS or AES256)
- Implement least-privilege IAM policies - avoid wildcards
- Enable versioning for artifact buckets
- Configure proper CloudWatch log retention (7-14 days)
- Handle Pulumi access tokens securely (no hardcoded secrets)
- Ensure pipeline can handle both preview and deployment operations
- All resources must be properly tagged with environment information

## Success Criteria

- **Functionality**: Complete CI/CD pipeline that automates Pulumi infrastructure deployments
- **Source Integration**: Pipeline triggers automatically on S3 source changes
- **Build Process**: CodeBuild successfully runs Pulumi preview and up commands
- **Manual Approval**: Production deployments require manual approval gate
- **Logging**: All build activities logged to CloudWatch with proper retention
- **Security**: Least-privilege IAM roles, encrypted artifacts, no hardcoded credentials
- **Environment Configuration**: Pulumi stack parameters passed via environment variables
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All infrastructure can be cleanly destroyed without manual intervention
- **Code Quality**: TypeScript, well-tested, documented, following Pulumi conventions

## What to deliver

- Complete **Pulumi with TypeScript** implementation
- S3 bucket for artifact storage with versioning and encryption
- CodeBuild project configured for Pulumi commands
- CodePipeline with source, build, approval, and deploy stages
- IAM roles for CodeBuild and CodePipeline with least-privilege policies
- CloudWatch log groups for build logging
- Environment variable configuration for Pulumi stack parameters
- Manual approval stage with SNS notifications
- Unit tests for all components
- Documentation and deployment instructions
