# Task: CI/CD Pipeline Integration

## Platform and Language
**CRITICAL**: Use AWS CDK with TypeScript for this implementation.

## Task Description

Create a CDK TypeScript program to implement a CI/CD pipeline for deploying a Node.js application. The configuration must:

1. Create an S3 bucket for storing pipeline artifacts with versioning enabled.
2. Define a CodeBuild project that runs unit tests using Node.js 18 runtime.
3. Set up a CodePipeline with source, build, and deploy stages.
4. Configure the pipeline to trigger on changes to the main branch of a CodeCommit repository.
5. Add a manual approval action between staging and production deployments.
6. Create separate CodeBuild projects for staging and production deployments.
7. Configure CloudWatch Events to send notifications on pipeline failures.
8. Implement IAM roles with least-privilege permissions for each service.
9. Add pipeline parameters for customizing deployment configurations.
10. Enable CloudWatch Logs for all CodeBuild projects with 7-day retention.

## Requirements

### Infrastructure Components
- S3 bucket for pipeline artifacts (versioning enabled)
- CodeCommit repository integration
- CodeBuild projects (test, staging deploy, production deploy)
- CodePipeline with multiple stages
- Manual approval action
- CloudWatch Events for notifications
- CloudWatch Logs with 7-day retention
- IAM roles with least-privilege permissions

### Complexity Level
hard

## Important Constraints

1. **Resource Naming**: ALL named AWS resources MUST include the `environmentSuffix` parameter in their names to prevent resource conflicts across parallel deployments.
   - Example: `pipeline-${environmentSuffix}`, `artifact-bucket-${environmentSuffix}`

2. **Destroyability**: All resources must be fully destroyable:
   - NO `removalPolicy: RemovalPolicy.RETAIN`
   - NO `deletionProtection: true`
   - S3 buckets should use `autoDeleteObjects: true` and `removalPolicy: RemovalPolicy.DESTROY`

3. **Node.js Runtime**: Use Node.js 18 for CodeBuild projects as specified in requirements.

4. **CloudWatch Logs**: Configure 7-day retention for all CodeBuild project logs.

5. **IAM Permissions**: Implement least-privilege IAM roles for all services (CodeBuild, CodePipeline, etc.).

## Deliverables

1. CDK TypeScript infrastructure code in `lib/` directory
2. All resources properly configured with `environmentSuffix`
3. Comprehensive unit tests with 90%+ coverage
4. Integration tests that verify deployed resources
5. Documentation of architecture and deployment steps
