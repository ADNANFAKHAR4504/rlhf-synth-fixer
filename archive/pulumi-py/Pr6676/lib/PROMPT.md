# CI/CD Pipeline for Automated Pulumi Deployments

Hey team,

We need to build a CI/CD pipeline that automates our Pulumi infrastructure deployments. Right now, our development team is manually running Pulumi commands every time they push code, which is error-prone and time-consuming. They want to integrate Pulumi deployments directly into AWS CodePipeline so testing environments get automatically provisioned whenever code is pushed to the main branch.

The business wants this pipeline to connect to our GitHub repository, run Pulumi preview and update commands through CodeBuild, and notify the team if anything fails. We're also dealing with sensitive data here, so the Pulumi access token needs to be stored securely in Parameter Store, and all artifacts need encryption.

I've been asked to create this in **Python using Pulumi**. The system needs to be production-ready with proper IAM permissions, CloudWatch logging, and automated notifications.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with Python** that automates Pulumi infrastructure deployments.

### Core Requirements

1. **CodePipeline with GitHub Integration**
   - Create pipeline with exactly 3 stages: Source, Build, and Deploy
   - Source stage connects to GitHub repository
   - Pipeline triggers only on main branch commits
   - Store artifacts in S3 bucket with versioning enabled

2. **CodeBuild for Pulumi Execution**
   - Configure Build stage using CodeBuild to run Pulumi commands
   - Use aws/codebuild/standard:5.0 build image
   - Define inline buildspec.yml with install, pre_build, and build phases
   - Phases should install Pulumi, run pulumi preview, and run pulumi update
   - Environment variables must include PULUMI_ACCESS_TOKEN from Parameter Store

3. **S3 Buckets for Storage**
   - Create S3 artifact bucket with server-side encryption
   - Versioning enabled with 30-day lifecycle policy for artifact retention
   - Create dedicated S3 backend bucket for Pulumi state storage
   - Both buckets must have encryption at rest

4. **IAM Roles and Permissions**
   - Create IAM role for CodePipeline with minimal required permissions
   - Create IAM role for CodeBuild with minimal required permissions
   - Follow least-privilege principle with no wildcard actions
   - Roles should only access specific S3 buckets and Parameter Store paths

5. **Secrets Management**
   - Store Pulumi access token in Parameter Store as SecureString type
   - CodeBuild must retrieve token securely during build

6. **CloudWatch Logging**
   - Enable CloudWatch Logs for CodeBuild project
   - Set log retention to 14 days
   - Log group should be named appropriately

7. **SNS Notifications**
   - Create SNS topic for pipeline failure notifications
   - Add email subscription to the topic
   - Integrate with CodePipeline to send alerts on failures

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **CodePipeline** for pipeline orchestration
- Use **CodeBuild** for Pulumi command execution
- Use **S3** for artifact storage and state backend
- Use **SSM Parameter Store** for secrets management
- Use **CloudWatch Logs** for build logging
- Use **SNS** for notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-environmentSuffix`
- Deploy to **us-east-1** region

### Constraints

- CodePipeline must have exactly 3 stages
- CodeBuild must use aws/codebuild/standard:5.0 image
- All IAM roles must follow least-privilege principle
- S3 artifact bucket must have versioning and 30-day lifecycle policy
- PULUMI_ACCESS_TOKEN must be SecureString in Parameter Store
- CloudWatch Logs retention must be 14 days
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Optional Enhancements (if time permits)

- Add Lambda function for custom pipeline approval logic
- Implement EventBridge rule for pipeline state change monitoring
- Add CodeCommit as alternative source provider

## Success Criteria

- **Functionality**: Pipeline successfully executes Pulumi deployments on git push
- **Security**: Secrets stored securely, IAM follows least privilege, encryption enabled
- **Reliability**: CloudWatch logging enabled, SNS notifications working
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Python code, well-structured, tested, documented

## What to deliver

- Complete Pulumi Python implementation
- CodePipeline with 3 stages (Source, Build, Deploy)
- CodeBuild project with inline buildspec
- S3 buckets for artifacts and Pulumi state
- IAM roles with least-privilege permissions
- Parameter Store for Pulumi access token
- CloudWatch Logs with 14-day retention
- SNS topic for failure notifications
- Unit tests for all components
- Documentation and deployment instructions
