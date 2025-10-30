# CI/CD Pipeline Integration

## Overview
A software development team needs to automate their container-based application deployment process. They want to use Pulumi for infrastructure management and integrate it with AWS CodePipeline to automatically provision and update their infrastructure whenever code changes are pushed to their repository.

## Requirements

Create a Pulumi TypeScript program to set up a CI/CD pipeline that deploys containerized applications using AWS services. The configuration must:

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

## Expected Output
A fully functional CI/CD pipeline that automatically builds Docker images and deploys infrastructure changes using Pulumi when source code is updated.

## Infrastructure Context
AWS eu-north-1 region deployment focusing on CodePipeline, CodeBuild, ECR, and S3 services for CI/CD automation. Requires Pulumi CLI 3.x with TypeScript/Node.js 18+, AWS CLI configured with appropriate credentials. Infrastructure includes S3 buckets for artifacts, ECR for container images, CodeBuild projects for building and deploying, and CodePipeline for orchestration. All resources deployed within default VPC with proper IAM roles and policies for service integration.

## Mandatory Constraints

1. CodeBuild projects must use the aws/codebuild/standard:7.0 image for consistency
2. Pipeline artifacts must be encrypted using AWS managed KMS keys
3. ECR repository must have a lifecycle policy to keep only the last 10 images
4. All IAM policies must follow the principle of least privilege with no wildcard permissions
5. CodeBuild compute type must be BUILD_GENERAL1_SMALL to minimize costs
6. Pipeline must include manual approval stage before the Pulumi deployment stage

## Task Metadata
- Platform: Pulumi
- Language: TypeScript
- Complexity: medium
- Subject Labels: aws, infrastructure, cicd, codepipeline, automation
- Task ID: hhfsa
