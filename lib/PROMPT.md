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
