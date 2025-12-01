# CI/CD Pipeline Integration - Pulumi TypeScript Implementation

This solution implements a complete CI/CD pipeline for containerized applications using AWS services with Pulumi and TypeScript.

## Architecture Overview

The infrastructure includes:
- S3 bucket for pipeline artifacts with versioning and 30-day lifecycle
- ECR repository for Docker images with scanning and 10-image limit
- CodeBuild project for building Docker images
- CodeBuild project for running Pulumi deployments
- CodePipeline with Source, Build, Manual Approval, and Deploy stages
- SNS topic for pipeline failure notifications
- IAM roles and policies with least privilege access

## File: lib/cicd-pipeline-stack.ts

Complete CI/CD pipeline stack implementation with all AWS services integrated.

## File: lib/tap-stack.ts

Main orchestration component that instantiates the CI/CD pipeline stack.

## File: bin/tap.ts

Entry point with environment configuration and stack outputs.

## Requirements Fulfillment

1. S3 Bucket for Artifacts - Created with versioning enabled and 30-day lifecycle rule
2. ECR Repository - Configured with scan on push enabled
3. Docker Build CodeBuild - Uses standard:7.0 image with BUILD_GENERAL1_SMALL compute
4. Pulumi Deploy CodeBuild - Separate project for infrastructure deployment
5. CodePipeline - Four stages: Source (S3), Build (Docker), Approval (Manual), Deploy (Pulumi)
6. IAM Roles - Least privilege policies for all services
7. Docker Authentication - Environment variables set for ECR login
8. SNS Notifications - Topic with EventBridge rule for pipeline failures
9. Resource Tagging - All resources tagged with Environment, Project, and ManagedBy
10. ECR Lifecycle - Policy to keep only last 10 images
11. Encryption - AWS managed KMS keys for S3 artifacts

## Key Features

- All resource names include environmentSuffix for uniqueness
- forceDestroy: true on S3 and ECR for easy cleanup
- No retention policies - fully destroyable infrastructure
- Proper IAM least privilege with no wildcard permissions
- CloudWatch Logs enabled for all CodeBuild projects
- Manual approval stage before Pulumi deployment
- Automatic pipeline trigger on S3 source changes