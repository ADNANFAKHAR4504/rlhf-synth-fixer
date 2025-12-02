# CI/CD Pipeline Integration

## Problem Statement

Create a Pulumi TypeScript program to set up an automated CI/CD pipeline for containerized applications. The configuration must:

1. Create an S3 bucket for pipeline artifacts with versioning enabled and lifecycle rules to delete artifacts older than 30 days.
2. Set up an ECR repository with image scanning on push and a lifecycle policy to retain only the last 10 images.
3. Configure a CodeBuild project that builds Docker images from a GitHub repository, runs unit tests, and pushes successful builds to ECR.
4. Create a CodePipeline with three stages: Source (GitHub webhook), Build (CodeBuild), and Deploy (ECS rolling update).
5. Define IAM roles with least-privilege policies for CodeBuild and CodePipeline service principals.
6. Set up CloudWatch Events to trigger the pipeline on commits to the main branch.
7. Configure build notifications to an SNS topic for failed builds.
8. Create build specification as code within the infrastructure definition.
9. Enable build logs to CloudWatch Logs with 7-day retention.
10. Tag all resources with Environment, Project, and ManagedBy tags.

Expected output: A fully automated pipeline that triggers on code commits, builds and tests Docker images, stores them in ECR, and deploys to an existing ECS cluster. The pipeline should provide build status notifications and maintain audit trails through CloudWatch Logs.

## Background

A fintech startup needs to automate their microservice deployment workflow using AWS native CI/CD services. They want infrastructure that automatically builds Docker images from source code, runs tests, and deploys to ECS when changes are pushed to their main branch.

## Environment

AWS us-east-1 region with CodePipeline orchestrating builds through CodeBuild and deployments to ECS Fargate. Requires Pulumi CLI 3.x, Node.js 16+, and AWS credentials configured. Assumes existing VPC with private subnets and an ECS cluster named 'production-cluster'. Pipeline integrates with GitHub for source control and uses S3 for artifact storage.

## Constraints

- Use Pulumi's native TypeScript SDK without any custom components or external modules
- CodeBuild must use AWS managed Ubuntu standard 5.0 image for consistency
- Pipeline artifacts must be encrypted using AWS managed S3 encryption keys
- All IAM policies must follow least-privilege principle with explicit resource ARNs
- Build timeout must be set to 15 minutes to prevent hanging builds
- Use Pulumi stack outputs to export pipeline name, ECR repository URI, and S3 bucket name
