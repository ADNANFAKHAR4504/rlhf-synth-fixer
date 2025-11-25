# CI/CD Pipeline Infrastructure for Microservices

This CloudFormation template deploys a complete CI/CD pipeline infrastructure for microservices using AWS CodePipeline, CodeBuild, and ECS deployment.

## Architecture Overview

The solution provides:
- **CodePipeline** orchestration with 5 stages: Source, Build, Staging, Approval, Production
- **CodeBuild** project for building Docker images (BUILD_GENERAL1_SMALL for cost optimization)
- **CodeCommit** integration with automatic triggering on commits to main branch
- **ECS** deployment with blue/green deployment support
- **S3** bucket for artifacts with versioning and KMS encryption
- **Manual approval** stage between staging and production
- **CloudWatch Events** rule for automatic pipeline triggering
- **VPC-based CodeBuild** with no internet access (uses VPC endpoints)

## Prerequisites

Before deploying this template, ensure you have:

1. **VPC Configuration**:
   - VPC with private subnets
   - VPC endpoints for S3, ECR, CodeBuild, and CloudWatch Logs
   - No NAT gateways required (all access through VPC endpoints)

2. **CodeCommit Repository**:
   - Repository created with source code
   - `buildspec.yml` file in repository root
   - Main branch configured

3. **ECR Repository**:
   - Repository for storing Docker images
   - Appropriate permissions configured

4. **ECS Cluster and Service**:
   - ECS cluster created
   - ECS service configured for deployment
   - Task definition ready

5. **Buildspec File**:
   - Create `buildspec.yml` in your repository root with Docker build commands
   - Must generate `imagedefinitions.json` for ECS deployment

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| EnvironmentSuffix | Unique suffix for resource naming | `dev-001` or `prod-team-a` |
| VpcId | VPC ID where CodeBuild runs | `vpc-1234567890abcdef0` |
| PrivateSubnetIds | Private subnet IDs (comma-separated) | `subnet-abc123,subnet-def456` |
| CodeCommitRepositoryName | CodeCommit repository name | `my-microservice` |
| CodeCommitBranchName | Branch to monitor | `main` |
| EcsClusterName | ECS cluster name | `microservices-cluster` |
| EcsServiceName | ECS service name | `my-service` |
| EcrRepositoryUri | ECR repository URI | `123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app` |
| ApprovalNotificationEmail | Email for approval notifications | `team@example.com` |

## Deployment Instructions

### Step 1: Prepare VPC Endpoints

Ensure your VPC has the following endpoints:
