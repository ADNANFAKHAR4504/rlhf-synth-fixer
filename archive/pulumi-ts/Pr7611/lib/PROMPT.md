# Task: CI/CD Pipeline Integration

## Problem Statement

Create a Pulumi TypeScript program to deploy a CI/CD pipeline for containerized applications. The configuration must:

1. Create an S3 bucket for storing pipeline artifacts with versioning enabled and lifecycle rules to delete objects older than 30 days.
2. Set up an ECR repository for storing Docker images with image scanning on push enabled.
3. Create a CodeBuild project that builds Docker images from a Dockerfile in the source code and pushes them to ECR.
4. Configure the CodeBuild project to use a Linux environment with Docker support and appropriate IAM permissions.
5. Create a CodePipeline with three stages: Source (GitHub webhook), Build (CodeBuild), and Deploy (Lambda function).
6. Implement a Lambda function that tags the latest ECR image with 'production' after successful build.
7. Set up CloudWatch Events to trigger pipeline execution on GitHub push events.
8. Configure all IAM roles and policies following least privilege principles.
9. Enable CloudWatch Logs for CodeBuild with 7-day retention.
10. Add tags to all resources with Environment='production' and Team='devops'.

Expected output: A fully automated CI/CD pipeline that triggers on GitHub commits, builds Docker images, stores them in ECR, and tags successful builds for production use.

## Background

A software development team needs to automate their container-based application deployment process. They want to use AWS native CI/CD services integrated with their existing GitHub repository to build Docker images and deploy them to ECR whenever code is pushed to the main branch.

## Environment

AWS

## Constraints

- Use Pulumi's native TypeScript SDK without any custom components
- All S3 buckets must have encryption at rest using AWS managed keys
- CodeBuild compute type must be BUILD_GENERAL1_SMALL for cost optimization
- Pipeline artifact store must use a dedicated S3 bucket separate from application storage
- Lambda function must be written inline within the Pulumi program, not loaded from external files
- Use GitHub version 2 source action for CodePipeline integration
- ECR repository must have a lifecycle policy to keep only the last 10 images
- All CloudWatch log streams must use the /aws/codebuild/ prefix

## Platform

Pulumi

## Language

TypeScript

## Complexity

medium

## Delivery Requirements

This infrastructure must be delivered as a complete CI/CD pipeline with the following components:

1. **Source Control Integration**: GitHub repository webhook integration for automated triggering
2. **Automated Build Process**: CodeBuild project configured to build and test the Pulumi infrastructure code
3. **Deployment Pipeline**: CodePipeline orchestrating the build, test, and deployment stages
4. **Infrastructure Validation**: Automated validation of Pulumi code before deployment
5. **Deployment Stages**: Multi-stage deployment process (dev, staging, production)
6. **Artifact Management**: Secure storage of build artifacts and state files
7. **Monitoring & Notifications**: CloudWatch integration for pipeline monitoring and SNS notifications for pipeline status
8. **Rollback Capability**: Automated rollback mechanisms for failed deployments
9. **Security Scanning**: Integration of security scanning tools in the pipeline
10. **Documentation**: Automated generation of infrastructure documentation

## Model Response

### Infrastructure Overview

The CI/CD Pipeline Integration solution deploys a complete continuous integration and continuous deployment infrastructure using Pulumi TypeScript. This solution creates an automated workflow that triggers on GitHub commits, builds Docker images, stores them in Amazon ECR, and manages the deployment lifecycle.

### Components Deployed

1. **S3 Artifact Bucket**
   - Versioning enabled for artifact history
   - Lifecycle policy to automatically delete objects older than 30 days
   - Server-side encryption with AWS managed keys (AES-256)
   - Resource tags: Environment=production, Team=devops

2. **Amazon ECR Repository**
   - Image scanning on push enabled for vulnerability detection
   - Lifecycle policy to retain only the last 10 images
   - Immutable image tags for production deployments
   - Resource tags: Environment=production, Team=devops

3. **CodeBuild Project**
   - Linux-based build environment with Docker support
   - Compute type: BUILD_GENERAL1_SMALL (cost-optimized)
   - Integrated with ECR for Docker image storage
   - CloudWatch Logs with /aws/codebuild/ prefix and 7-day retention
   - IAM role with least privilege permissions for ECR push and S3 access

4. **CodePipeline**
   - **Source Stage**: GitHub webhook integration (GitHub version 2 source action)
   - **Build Stage**: CodeBuild project execution
   - **Deploy Stage**: Lambda function invocation for image tagging
   - Artifact store using dedicated S3 bucket
   - Resource tags: Environment=production, Team=devops

5. **Lambda Tagging Function**
   - Inline function code within Pulumi program
   - Tags successful ECR builds with 'production' label
   - IAM role with permissions to tag ECR images
   - Triggered automatically after successful CodeBuild completion

6. **CloudWatch Events Rule**
   - Monitors GitHub push events
   - Automatically triggers pipeline execution
   - Integrated with CodePipeline for seamless automation

7. **IAM Roles and Policies**
   - CodePipeline service role with necessary permissions
   - CodeBuild service role with ECR and S3 access
   - Lambda execution role for ECR image tagging
   - All roles follow least privilege security principles

### Deployment Flow

1. Developer pushes code to GitHub main branch
2. CloudWatch Events detects the push and triggers CodePipeline
3. Source stage pulls code from GitHub repository
4. Build stage executes CodeBuild project:
   - Pulls source code and Dockerfile
   - Builds Docker image
   - Scans image for vulnerabilities
   - Pushes image to ECR repository
5. Deploy stage invokes Lambda function:
   - Retrieves latest ECR image
   - Tags image as 'production'
   - Logs deployment status
6. Pipeline artifacts stored in S3 bucket
7. CloudWatch Logs capture all build and deployment activities

### Security Features

- All S3 buckets encrypted at rest with AWS managed keys
- ECR image scanning enabled to detect vulnerabilities before deployment
- IAM roles implement least privilege access controls
- VPC isolation for CodeBuild projects (if configured)
- Secure webhook integration with GitHub using tokens
- Immutable ECR tags prevent accidental overwrites

### Cost Optimization

- BUILD_GENERAL1_SMALL compute type reduces CodeBuild costs
- S3 lifecycle policy automatically deletes old artifacts (30-day retention)
- ECR lifecycle policy keeps only last 10 images to minimize storage costs
- CloudWatch Logs retention set to 7 days to control logging costs

### Monitoring and Observability

- CloudWatch Logs capture all CodeBuild output with 7-day retention
- CloudWatch Events track pipeline execution triggers
- Pipeline state changes visible in CodePipeline console
- ECR scan results available for security review
- Detailed IAM CloudTrail logs for audit compliance

### Scalability Considerations

- Pipeline can handle multiple concurrent builds with appropriate IAM limits
- ECR supports unlimited image storage with lifecycle management
- S3 bucket scales automatically for artifact storage
- Lambda function scales automatically based on deployment frequency

### Maintenance and Operations

- Automated lifecycle management for artifacts and images
- Self-cleaning infrastructure with retention policies
- Tag-based resource organization for easy management
- CloudWatch integration for operational monitoring
- Automated rollback capability through CodePipeline

### Prerequisites

- GitHub repository with Dockerfile and application code
- GitHub personal access token for webhook integration
- AWS account with appropriate service quotas
- Pulumi CLI installed and configured
- AWS credentials configured for Pulumi deployment

### Configuration Parameters

The following parameters can be customized in the Pulumi program:
- GitHub repository URL and branch name
- CodeBuild environment variables
- S3 lifecycle retention period
- ECR lifecycle image count
- CloudWatch log retention period
- Resource tags for organization-specific requirements

### Outputs

The Pulumi program provides the following outputs:
- S3 artifact bucket name and ARN
- ECR repository URL for Docker push operations
- CodePipeline name and ARN
- CodeBuild project name
- Lambda function ARN
- CloudWatch Log Group names
