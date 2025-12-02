Hey team,

We need to build a comprehensive CI/CD pipeline infrastructure for our Node.js microservices. The business wants to automate the entire deployment process from code commit to production, with proper gates and notifications along the way. This is a critical piece of infrastructure that will enable our development teams to ship faster while maintaining quality and security standards.

The current manual deployment process is causing delays and inconsistencies. We're looking to implement a multi-stage pipeline with automated testing, manual approval gates for production deployments, and comprehensive notifications. The solution needs to handle branch-based deployments where the main branch goes to production and develop branch goes to staging.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The team has already standardized on this stack, so it's important we stick with it for consistency across our infrastructure codebase.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** that handles the full deployment lifecycle for Node.js microservices.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts
   - Enable versioning to track artifact history
   - Encryption at rest for security compliance

2. **Pipeline Stages**
   - Source stage to pull code from repository
   - Build stage using CodeBuild with Node.js runtime
   - Test stage to run automated tests
   - Manual approval action before production deployments
   - Deploy stage to push to target environments

3. **Branch-Based Deployments**
   - Main branch deploys to production environment
   - Develop branch deploys to staging environment
   - Proper environment isolation and configuration

4. **Custom Pipeline Actions**
   - Lambda functions for custom notifications
   - Lambda functions for approval checks and validations
   - Integration with pipeline events

5. **Notification System**
   - SNS topics for pipeline state change notifications
   - Email notifications to development team on pipeline failures
   - CloudWatch Event Rules to capture pipeline events

6. **Security and Access Control**
   - IAM roles for CodePipeline with least-privilege access
   - IAM roles for CodeBuild with only required permissions
   - IAM roles for Lambda functions following least privilege
   - Separate roles for each service component

7. **Resource Organization**
   - Tag all resources with environment tag (production/staging)
   - Tag all resources with cost-center tag for billing tracking
   - Proper resource naming for identification

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodePipeline** for the main pipeline orchestration
- Use **AWS CodeBuild** for building and testing Node.js applications
- Use **AWS Lambda** for custom pipeline actions and notifications
- Use **Amazon S3** for artifact storage with versioning
- Use **Amazon SNS** for notification delivery
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- All resources must be destroyable (no retain policies or protection)
- Enable encryption at rest using AWS KMS
- Enable encryption in transit using TLS/SSL

### Deployment Requirements (CRITICAL)

All resources MUST include environmentSuffix in their names to support multiple environments and testing:
- S3 buckets: `pipeline-artifacts-${environmentSuffix}`
- CodePipeline: `nodejs-pipeline-${environmentSuffix}`
- CodeBuild projects: `nodejs-build-${environmentSuffix}`, `nodejs-test-${environmentSuffix}`
- Lambda functions: `pipeline-notification-${environmentSuffix}`, `approval-check-${environmentSuffix}`
- SNS topics: `pipeline-notifications-${environmentSuffix}`
- IAM roles: `codepipeline-role-${environmentSuffix}`, `codebuild-role-${environmentSuffix}`, `lambda-role-${environmentSuffix}`

All resources must be fully destroyable for CI/CD testing workflows:
- Do NOT use `protect: true` in Pulumi
- Do NOT use `retainOnDelete: true` for S3 buckets
- Avoid any deletion protection mechanisms

For Lambda functions using Node.js 18.x or higher:
- Use AWS SDK v3 imports: `import { SNSClient } from '@aws-sdk/client-sns'`
- Do NOT use `require('aws-sdk')` as SDK v2 is not available in Node.js 18+
- Keep functions simple to avoid SDK complexity

### Constraints

- Follow AWS least-privilege security model for all IAM roles
- No hardcoded environment names (prod, dev, staging) in resource names
- No hardcoded account IDs or ARNs
- No hardcoded email addresses - use parameters
- Enable comprehensive CloudWatch logging for troubleshooting
- Include proper error handling in Lambda functions
- Manual approval gate must be properly configured before production stage

## Success Criteria

- **Pipeline Creation**: CodePipeline successfully created with source, build, test, approval, and deploy stages
- **Artifact Management**: S3 bucket configured with versioning and encryption
- **Build Integration**: CodeBuild projects properly configured for Node.js applications
- **Custom Actions**: Lambda functions deployed and integrated with pipeline events
- **Notifications**: SNS topics configured with email subscriptions working
- **Security**: All IAM roles follow least-privilege principle with minimal required permissions
- **Approval Gates**: Manual approval action properly configured and functional
- **Branch Handling**: Pipeline correctly routes main to production and develop to staging
- **Monitoring**: CloudWatch logs available for all pipeline stages
- **Resource Naming**: All resources include environmentSuffix in their names
- **Tagging**: All resources tagged with environment and cost-center tags
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: TypeScript code is well-structured, typed, and documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- CodePipeline configuration with all required stages
- CodeBuild projects for build and test stages
- Lambda functions for notifications and approval checks
- SNS topics and CloudWatch Event Rules for notifications
- IAM roles and policies for all services
- S3 bucket configuration for artifacts
- Unit tests for all infrastructure components
- Integration tests validating pipeline functionality
- Documentation with deployment instructions
