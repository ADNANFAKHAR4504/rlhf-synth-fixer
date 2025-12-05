# CI/CD Pipeline Integration - Infrastructure as Code

## Task Overview
Create a CDK TypeScript program to implement a multi-stage CI/CD pipeline for containerized microservices.

## Requirements

### 1. CodePipeline with Multi-Stage Deployment
Define a CodePipeline with source, build, and deploy stages for both staging and production environments. The pipeline should support automated progression through environments with proper stage separation.

### 2. Docker Image Build and ECR Integration
Configure CodeBuild projects to build Docker images from a GitHub repository and push them to Amazon ECR. The build process should handle authentication, tagging, and versioning automatically.

### 3. Automated Unit Test Execution
Set up automated unit test execution during the build phase with test report generation. Tests should be run before the Docker image is built, and results should be published to AWS CodeBuild reports.

### 4. Manual Approval Actions
Implement manual approval actions between staging and production deployments. This ensures human oversight before changes reach production, with configurable approval timeout and notification mechanisms.

### 5. Blue/Green Deployment to ECS
Deploy containerized applications to existing ECS clusters using Blue/Green deployment strategy. This enables zero-downtime deployments with automatic rollback capabilities in case of deployment failures.

### 6. S3 Artifact Storage with Security
Configure S3 buckets for pipeline artifacts with encryption at rest using AWS KMS and lifecycle policies to automatically delete old artifacts after 30 days. The bucket should have versioning enabled and public access blocked.

### 7. SNS Notifications for Pipeline Events
Create SNS topics for pipeline state change notifications to Slack webhooks. Notifications should be sent for pipeline execution start, success, failure, and manual approval requests.

### 8. IAM Roles with Least Privilege
Set up IAM roles with least privilege access for CodePipeline and CodeBuild services. Roles should only have permissions required for their specific functions, following AWS security best practices.

### 9. Resource Tagging for Tracking
Tag all resources with Environment, Team, and CostCenter tags for tracking and cost allocation. Tags should be consistently applied across all resources to enable proper governance and billing analysis.

## Assumptions
- GitHub repository exists with a valid source code structure
- ECS clusters (staging and production) already exist
- Slack webhook URL will be provided via environment variables or SSM Parameter Store
- AWS region is configured via CDK context
- Proper AWS credentials are available for deployment

## Success Criteria
- All 9 requirements are fully implemented
- Infrastructure can be synthesized without errors
- All resources are properly tagged
- IAM roles follow least privilege principle
- Pipeline supports both staging and production deployments
- Blue/Green deployment strategy is correctly configured