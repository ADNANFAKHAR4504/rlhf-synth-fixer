# CI/CD Pipeline Integration - Infrastructure Implementation

## Background

A software development team needs to implement a multi-stage CI/CD pipeline for deploying Pulumi-based AWS infrastructure. The solution uses a dual-orchestration architecture: GitHub Actions for local development CI/CD workflows and AWS CodePipeline for production deployments. This hybrid approach supports automated testing, security scanning, and staged deployments with proper environment separation.

## Environment

AWS CI/CD infrastructure deployed in us-east-1 region. The solution consists of:
- GitHub Actions workflow for development/testing CI/CD (runs Pulumi deployments)
- Pulumi Python program provisioning AWS CodePipeline infrastructure for production
- Requires Pulumi CLI 3.x with Python 3.9+, boto3 installed
- GitHub Actions uses OIDC-based AWS authentication via role assumption
- AWS CodePipeline uses GitHub as source provider with OAuth token from Secrets Manager

## Problem Statement

Create a CI/CD pipeline solution consisting of:

1. A GitHub Actions workflow (ci-cd.yml) that orchestrates development deployments with 5 stages:
   - Source: Checkout code and validate source
   - Build: Install Python dependencies and run Pulumi preview
   - Test: Execute unit tests and integration tests using pytest
   - SecurityScan: Run Bandit security scanning and Safety vulnerability checks on Python code
   - Deploy: Execute Pulumi up to deploy infrastructure to production environment

2. A Pulumi Python program (tap_stack.py) that provisions AWS CodePipeline infrastructure for production:
   - KMS key for artifact encryption with key rotation enabled
   - S3 bucket for pipeline artifacts with versioning and 30-day lifecycle policy
   - ECR repository with scan-on-push enabled and lifecycle policy keeping last 10 images
   - Secrets Manager secret for storing GitHub OAuth token securely with KMS encryption
   - SNS topic for pipeline failure notifications with email subscription to devops@company.com
   - IAM roles with least privilege policies using explicit resource ARNs for CodePipeline and CodeBuild
   - CloudWatch Log Groups for all CodeBuild projects with 7-day retention and KMS encryption
   - CodeBuild projects for Docker image builds and Node.js-based test execution
   - CodePipeline with 5 stages: Source (GitHub), Build (Docker), Test (parallel unit/integration), SecurityScan, Deploy (ECS)
   - CloudWatch Event Rule for CodeCommit-based pipeline triggers (for internal repository mirroring scenarios)

## Mandatory Constraints

1. GitHub Actions workflow must trigger only on commits to 'main' and 'release/*' branches
2. All IAM roles must follow principle of least privilege with explicit resource ARNs
3. Both GitHub Actions workflow and AWS CodePipeline must have exactly 5 stages: Source, Build, Test, SecurityScan, and Deploy
4. Use Pulumi ComponentResource pattern to organize related AWS resources with parent-child relationships

## Optional Constraints

1. All artifacts must be encrypted using a customer-managed KMS key with automatic rotation
2. CodeBuild projects must use compute type BUILD_GENERAL1_SMALL for cost optimization
3. Pipeline notifications must be sent to SNS topic only for failed executions
4. GitHub Actions must use OIDC-based AWS authentication via role assumption
5. Security scan stage in GitHub Actions should use Bandit for Python code analysis and Safety for dependency vulnerabilities
6. ECR repository should have scan-on-push enabled for container vulnerability detection
7. S3 bucket must block all public access

## Expected Output

A complete solution consisting of:
1. A GitHub Actions workflow file (ci-cd.yml) with proper YAML structure, 5 sequential jobs with dependencies, environment-based deployment protection for production
2. A Pulumi Python program using ComponentResource pattern with type-safe dataclass arguments
3. Dual CI/CD architecture: GitHub Actions for development workflows, AWS CodePipeline for production deployments
4. Environment variable pattern for configuration with no credentials in code
5. Comprehensive resource tagging for cost allocation and resource management
6. Security best practices: KMS encryption, least privilege IAM, public access blocking, container scanning
