# Basic CI/CD Pipeline Infrastructure

## Context

A growing startup needs to automate their application deployment process. They're currently manually building and deploying their application, which leads to inconsistencies and errors. They want a simple CI/CD pipeline using AWS services that can automatically build and deploy their application when code changes are pushed to GitHub.

The team is comfortable with AWS and wants to use native AWS services (CodePipeline and CodeBuild) for their CI/CD workflow. They need a straightforward pipeline that handles source code retrieval, building, and basic deployment.

## Objective

Create AWS CodePipeline infrastructure using **Pulumi with TypeScript** that automates the build and deployment of applications from a GitHub repository.

## Core Requirements

1. **Pipeline Setup**
   - Create a CodePipeline with 3 stages: Source, Build, and Deploy
   - Source stage should integrate with GitHub repository
   - Build stage should compile/build the application
   - Deploy stage should deploy artifacts to S3

2. **Build Configuration**
   - Configure CodeBuild project for building applications
   - Use standard AWS CodeBuild Docker image (aws/codebuild/standard:7.0)
   - Set build timeout to 20 minutes
   - Store build logs in CloudWatch Logs

3. **Artifact Storage**
   - Create S3 bucket for storing pipeline artifacts
   - Enable versioning on the artifact bucket
   - Use server-side encryption for artifacts
   - Store build outputs for deployment stage

4. **IAM and Security**
   - Create IAM role for CodePipeline with necessary permissions
   - Create IAM role for CodeBuild with necessary permissions
   - Follow least-privilege principle for IAM policies
   - Use AWS Secrets Manager for GitHub token storage

5. **Build Specifications**
   - Create buildspec.yml that defines build commands
   - Include install, pre_build, build, and post_build phases
   - Output artifacts to S3 for deployment

## Technical Requirements

- Use **Pulumi with TypeScript** for all infrastructure
- Deploy to us-east-1 region
- Resource names must include environmentSuffix for uniqueness
- All resources must be destroyable (forceDestroy: true for S3, no RETAIN policies)
- Use AWS CodePipeline for orchestration
- Use AWS CodeBuild for build automation
- Use S3 for artifact storage
- Use IAM for access control
- Use CloudWatch Logs for build logging

## Resource Naming Convention

Follow this pattern: `{resource-type}-{environment-suffix}`

Examples:
- `pipeline-dev`
- `build-project-prod`
- `artifacts-bucket-staging`

## Deployment Requirements

- All resources must include environmentSuffix parameter
- Enable forceDestroy: true for S3 buckets
- No RemovalPolicy.RETAIN on any resources
- All resources must be fully removable via pulumi destroy
- Include proper resource dependencies

## Success Criteria

- CodePipeline successfully triggers on GitHub changes
- CodeBuild project compiles application successfully
- Build artifacts are stored in S3
- IAM roles have appropriate least-privilege permissions
- All resources can be destroyed cleanly
- Pipeline handles basic error scenarios
- CloudWatch Logs capture build output

## Deliverables

1. **lib/tap-stack.ts** - Complete Pulumi implementation including:
   - CodePipeline resource with 3 stages
   - CodeBuild project with buildspec
   - S3 bucket for artifacts
   - IAM roles and policies
   - CloudWatch log group

2. **bin/tap.ts** - Pulumi program entry point

3. **Unit tests** - Comprehensive tests for all resources

4. **Integration tests** - Tests using actual deployment outputs

## Constraints

- Build timeout: 20 minutes maximum
- Use aws/codebuild/standard:7.0 Docker image
- CloudWatch Logs retention: 7 days
- S3 lifecycle: Expire artifacts after 30 days
- All secrets must use AWS Secrets Manager (no hardcoded values)
- Pipeline must support automatic triggering via GitHub webhook
- Include error handling for transient failures

## Implementation Notes

This is a medium-complexity task focused on creating a foundational CI/CD pipeline. The implementation should be straightforward and well-documented, serving as a building block for more complex pipeline configurations in the future.
