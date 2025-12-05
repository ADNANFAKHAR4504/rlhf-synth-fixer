# CI/CD Pipeline Integration - GitOps Continuous Deployment

## Background

A software development team needs to implement a GitOps-style continuous deployment pipeline for their microservices architecture. The pipeline should automatically build container images from source code, run security scans, and deploy to ECS Fargate across multiple environments using infrastructure-as-code principles.

## Environment

AWS multi-account setup deployed in us-east-1 region with separate accounts for dev, staging, and production environments. Uses CodePipeline for orchestration, CodeBuild for container builds, ECR for image storage, and ECS Fargate for container hosting. Requires Pulumi CLI 3.x with Go 1.19+, AWS CLI configured with cross-account assume role permissions. VPC per environment with private subnets across 2 AZs, Application Load Balancers in public subnets. EventBridge for pipeline notifications, Systems Manager Parameter Store for configuration.

## Problem Statement

Create a Pulumi Go program to deploy a multi-stage CI/CD pipeline using AWS CodePipeline.

### Requirements

The configuration must:

1. Set up a CodeCommit repository with main, develop, and release branches for source control
2. Create a CodePipeline with source, build, security scan, and deploy stages for each environment
3. Configure CodeBuild projects using ARM64 Graviton2 instances with buildspec files for Docker image creation
4. Implement a security scanning stage using Trivy in CodeBuild to check container vulnerabilities
5. Create ECR repositories with lifecycle policies to retain only the last 10 images per tag
6. Deploy ECS Fargate services with task definitions that reference the built container images
7. Configure Application Load Balancers with target groups for each ECS service
8. Set up EventBridge rules to send pipeline state changes to an SNS topic for Slack integration
9. Add a manual approval action before the production deployment stage
10. Create IAM roles with least-privilege policies for CodePipeline, CodeBuild, and ECS tasks
11. Configure KMS keys for encrypting CodePipeline artifacts and ECR images
12. Implement CloudWatch log groups for CodeBuild and ECS task logs with 7-day retention

### Mandatory Constraints

- Use AWS CodeCommit as the source repository with branch-based deployments
- Pipeline artifacts must be encrypted with customer-managed KMS keys
- Implement manual approval step before production deployments

### Optional Constraints

- CodeBuild projects must use ARM-based Graviton2 compute for cost optimization
- Container images must pass Trivy security scanning before deployment
- Use EventBridge for pipeline state change notifications to Slack
- Each environment (dev/staging/prod) must have isolated ECS clusters

## Platform and Language

**CRITICAL**: This task MUST be implemented using **Pulumi with Go**.

- Platform: Pulumi
- Language: Go
- Version: Pulumi CLI 3.x with Go 1.19+

## Expected Output

A complete Pulumi program that creates the entire CI/CD infrastructure with proper resource dependencies, cross-account permissions, and security configurations. The pipeline should automatically trigger on code commits and progress through build, scan, and deployment stages with appropriate gates.

## Additional Requirements

- All resource names must include the environmentSuffix parameter for uniqueness
- Resources must be destroyable (no DeletionPolicy: Retain or deletionProtection: true)
- Include proper error handling and validation
- Follow AWS Well-Architected Framework best practices
- Implement comprehensive logging and monitoring
