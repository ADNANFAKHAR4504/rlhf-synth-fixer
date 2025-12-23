# CI/CD Pipeline Integration using Pulumi with TypeScript

## Task Overview

Create a Pulumi TypeScript program to set up a CI/CD pipeline that deploys containerized applications using AWS services.

## Scenario

A software development team needs to automate their container-based application deployment process. They want to use Pulumi for infrastructure management and integrate it with AWS CodePipeline to automatically provision and update their infrastructure whenever code changes are pushed to their repository.

## Requirements

The configuration must:

1. Create an S3 bucket for storing pipeline artifacts with versioning enabled and lifecycle rules to delete old artifacts after 30 days.

2. Set up an ECR repository for storing Docker images with image scanning on push enabled.

3. Configure a CodeBuild project that builds Docker images from source code and pushes them to ECR.

4. Create a CodePipeline with three stages: Source (from S3), Build (using CodeBuild), and Deploy (running Pulumi).

5. Define IAM roles and policies for CodeBuild and CodePipeline with least privilege access.

6. Configure the pipeline to trigger automatically when new source artifacts are uploaded to S3.

7. Set up CodeBuild environment variables for Docker registry authentication.

8. Create a separate CodeBuild project for running Pulumi deployments with appropriate IAM permissions.

9. Configure pipeline notifications to send alerts on failure using SNS.

10. Tag all resources with Environment, Project, and ManagedBy tags.

## Implementation Requirements

- AWS us-east-1 region deployment focusing on CodePipeline, CodeBuild, ECR, and S3 services for CI/CD automation.
- Requires Pulumi CLI 3.x with TypeScript/Node.js 18+, AWS CLI configured with appropriate credentials.
- Infrastructure includes S3 buckets for artifacts, ECR for container images, CodeBuild projects for building and deploying, and CodePipeline for orchestration.
- All resources deployed within default VPC with proper IAM roles and policies for service integration.

## Constraints

1. CodeBuild projects must use the aws/codebuild/standard:7.0 image for consistency
2. Pipeline artifacts must be encrypted using AWS managed KMS keys
3. ECR repository must have a lifecycle policy to keep only the last 10 images
4. All IAM policies must follow the principle of least privilege with no wildcard permissions
5. CodeBuild compute type must be BUILD_GENERAL1_SMALL to minimize costs
6. Pipeline must include manual approval stage before the Pulumi deployment stage

## Expected Output

A fully functional CI/CD pipeline that automatically builds Docker images and deploys infrastructure changes using Pulumi when source code is updated.

## Critical Requirements for Synthetic Tasks

### Resource Naming
- ALL resource names MUST include the `environmentSuffix` parameter
- Format: `resource-name-${environmentSuffix}`
- This ensures uniqueness across parallel deployments and prevents resource conflicts

### Destroyability
- NO resources should have retention policies (e.g., `retainOnDelete: false`)
- NO resources should have deletion protection enabled
- All resources must be fully destroyable for cleanup after testing

### Platform and Language
- MUST use **Pulumi with TypeScript** as specified in metadata.json
- Do NOT use other IaC tools (CDK, CloudFormation, Terraform, etc.)
- Do NOT use other languages (Python, Go, Java, etc.)

### Best Practices
- Follow AWS Well-Architected Framework principles
- Implement proper error handling and logging
- Use appropriate resource tagging (Environment, Project, ManagedBy)
- Configure encryption for data at rest and in transit where applicable
- Implement least privilege IAM policies

## AWS Services

Based on the requirements, this task will utilize the following AWS services:
- S3 (artifact storage)
- ECR (container image registry)
- CodeBuild (build automation)
- CodePipeline (pipeline orchestration)
- IAM (access management)
- SNS (notifications)
- KMS (encryption)

Note: The `aws_services` field in metadata.json will be populated automatically by the code-reviewer agent after code generation.
