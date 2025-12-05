# CI/CD Pipeline Integration - Infrastructure Implementation

## Background

A software development team needs to implement a multi-stage CI/CD pipeline for their microservices application. The pipeline must support automated testing, security scanning, and blue-green deployments to minimize downtime during releases.

## Environment

AWS CI/CD infrastructure deployed in us-east-1 region using CodePipeline for orchestration, CodeBuild for compilation and testing, CodeDeploy for blue-green deployments to ECS Fargate. Requires Pulumi CLI 3.x with Python 3.9+, boto3 installed. Pipeline integrates with GitHub for source control, ECR for container registry with vulnerability scanning enabled. VPC endpoints configured for private communication between services. CodeArtifact repository for dependency caching.

## Problem Statement

Create a Pulumi Python program to deploy a CI/CD pipeline for containerized microservices. The configuration must:

1. Set up a CodePipeline with Source stage connecting to GitHub repository 'myorg/microservices-app' using OAuth token from Secrets Manager
2. Configure Build stage with CodeBuild project that builds Docker images from Dockerfile in repository root and pushes to ECR repository
3. Implement Test stage running unit tests and integration tests in parallel using two separate CodeBuild projects
4. Add SecurityScan stage that performs ECR image vulnerability scanning and blocks deployment if HIGH severity issues found
5. Create Deploy stage using CodeDeploy for blue-green deployment to ECS Fargate service with LINEAR_10PERCENT_EVERY_10MINUTES configuration
6. Configure S3 bucket for pipeline artifacts with versioning enabled and lifecycle policy to delete objects after 30 days
7. Set up CloudWatch Events rule to trigger pipeline only for main and release/* branch commits
8. Create SNS topic for pipeline failure notifications with email subscription to 'devops@company.com'
9. Implement CloudWatch Logs groups for all CodeBuild projects with 7-day retention
10. Configure IAM roles with minimal permissions for each service following AWS security best practices

## Mandatory Constraints

1. Pipeline must trigger only on commits to 'main' and 'release/*' branches
2. All IAM roles must follow principle of least privilege with explicit resource ARNs
3. Use AWS CodePipeline with exactly 5 stages: Source, Build, Test, SecurityScan, and Deploy

## Optional Constraints

1. All artifacts must be encrypted using a customer-managed KMS key
2. CodeBuild projects must use compute type BUILD_GENERAL1_SMALL for cost optimization
3. Pipeline notifications must be sent to SNS topic only for failed executions
4. Deploy stage must implement blue-green deployment using CodeDeploy with 10-minute traffic shift
5. Security scan stage must use ECR image scanning and fail on HIGH severity findings

## Expected Output

A complete Pulumi program that creates all required AWS resources with proper configurations, IAM policies, and integrations. The program should use Pulumi's ComponentResource pattern to organize related resources and include proper error handling for external dependencies like GitHub webhooks.
