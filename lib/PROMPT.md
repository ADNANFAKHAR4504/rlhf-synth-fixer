# CI/CD Pipeline Integration - Infrastructure Implementation

## Background

A software development team needs to implement a multi-stage CI/CD pipeline for deploying Pulumi-based AWS infrastructure. The pipeline must support automated testing, security scanning, and staged deployments with proper environment separation. The solution requires both a GitHub Actions workflow for orchestration and Pulumi Python code for AWS resource provisioning.

## Environment

AWS CI/CD infrastructure deployed in us-east-1 region. The solution uses GitHub Actions as the CI/CD orchestrator to run Pulumi deployments. The Pulumi Python program provisions AWS resources including CodePipeline, CodeBuild, ECR, S3, SNS, and IAM roles. Requires Pulumi CLI 3.x with Python 3.9+, boto3 installed. Pipeline integrates with GitHub for source control using OIDC-based AWS authentication.

## Problem Statement

Create a CI/CD pipeline solution consisting of:

1. A GitHub Actions workflow (ci-cd.yml) that orchestrates the deployment with 5 stages:
   - Source: Checkout code and validate source
   - Build: Install dependencies and run Pulumi preview
   - Test: Execute unit tests and integration tests using pytest
   - SecurityScan: Run Bandit security scanning and Safety vulnerability checks
   - Deploy: Execute Pulumi up to deploy infrastructure to production

2. A Pulumi Python program (tap_stack.py) that provisions AWS CI/CD infrastructure:
   - KMS key for artifact encryption with key rotation enabled
   - S3 bucket for pipeline artifacts with versioning and 30-day lifecycle policy
   - ECR repository with image scanning on push and lifecycle policy
   - Secrets Manager secret for storing GitHub OAuth token securely
   - SNS topic for pipeline failure notifications with email subscription
   - IAM roles with least privilege policies for CodePipeline and CodeBuild
   - CloudWatch Log Groups for build projects with 7-day retention
   - CodeBuild projects for build, unit tests, and integration tests
   - CodePipeline with 5 stages connecting all components
   - CloudWatch Event Rule for branch-based pipeline triggers

## Mandatory Constraints

1. GitHub Actions workflow must trigger only on commits to 'main' and 'release/*' branches
2. All IAM roles must follow principle of least privilege with explicit resource ARNs
3. Both GitHub Actions workflow and CodePipeline must have exactly 5 stages: Source, Build, Test, SecurityScan, and Deploy
4. Use Pulumi ComponentResource pattern to organize related AWS resources

## Optional Constraints

1. All artifacts must be encrypted using a customer-managed KMS key
2. CodeBuild projects must use compute type BUILD_GENERAL1_SMALL for cost optimization
3. Pipeline notifications must be sent to SNS topic only for failed executions
4. GitHub Actions must use OIDC-based AWS authentication via role assumption
5. Security scan stage should use Bandit for Python code analysis and Safety for dependency vulnerabilities

## Expected Output

A complete solution consisting of:
1. A GitHub Actions workflow file (ci-cd.yml) with proper YAML structure, 5 sequential jobs, and environment-based deployment protection
2. A Pulumi Python program using ComponentResource pattern with type-safe dataclass arguments
3. Proper separation between CI/CD orchestration (GitHub Actions) and infrastructure provisioning (Pulumi/AWS)
4. Environment variable pattern for configuration (no credentials in code)
5. Comprehensive resource tagging for cost allocation and management
