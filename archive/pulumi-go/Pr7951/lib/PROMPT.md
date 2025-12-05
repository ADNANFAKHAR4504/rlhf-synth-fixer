# Task: CI/CD Pipeline

## Problem Statement

Create a Pulumi Go program to deploy a multi-stage CI/CD pipeline that provisions infrastructure automatically. The configuration must: 1. Set up a CodePipeline with source, build, and deploy stages for dev, staging, and production environments. 2. Configure CodeBuild projects that run Pulumi commands to update infrastructure based on branch names. 3. Create S3 buckets for pipeline artifacts with versioning and encryption enabled. 4. Implement manual approval actions before staging and production deployments. 5. Set up EventBridge rules to trigger pipelines on specific Git push events to main, staging, and develop branches. 6. Configure SNS topics for pipeline state change notifications with email subscriptions. 7. Create IAM roles with least-privilege policies for CodePipeline and CodeBuild services. 8. Store Pulumi state files in separate S3 buckets per environment with state locking via DynamoDB. 9. Configure CodeBuild to use different Pulumi stacks based on the target environment. 10. Set up pipeline failure notifications that include stage name and error details. Expected output: A fully automated CI/CD pipeline that provisions infrastructure using Pulumi based on Git events, with proper separation between environments and approval workflows for production deployments.

## Background

A software development team needs automated infrastructure provisioning integrated into their CI/CD workflow. They want to trigger infrastructure updates based on Git events and maintain separate pipelines for different environments with approval gates.

## Environment

Multi-environment CI/CD infrastructure deployed in us-east-1 using AWS CodePipeline, CodeBuild, S3, EventBridge, and SNS. Requires Pulumi CLI 3.x with Go 1.19+, AWS CLI configured with appropriate credentials. Pipeline artifacts stored in encrypted S3 buckets. Separate Pulumi stacks for dev, staging, and production environments. DynamoDB tables for Pulumi state locking. VPC endpoints for secure CodeBuild execution without internet access.

## Constraints

- CodeBuild projects must use the aws/codebuild/standard:7.0 image with Go runtime
- Pipeline artifact buckets must have lifecycle policies to delete objects older than 30 days
- All S3 buckets must use AES256 server-side encryption
- CodeBuild logs must be sent to CloudWatch Logs with 7-day retention
- Manual approval SNS topics must have email endpoints for ops@company.com
- Pipeline execution must timeout after 2 hours to prevent runaway costs
- CodeBuild projects must have concurrent build limits set to 2
- IAM policies must explicitly deny access to production resources from dev/staging roles
- EventBridge rules must include branch name filters in their event patterns
- Pulumi stack names must follow the pattern: project-{environment}-{region}
