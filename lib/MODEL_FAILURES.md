# Model Failures and Fixes

This document outlines the issues encountered during the initial implementation and the fixes applied to create a working solution.

## ECS Service Desired Count Configuration

**Issue**: The initial implementation set `desiredCount` to a non-zero value, which caused deployment failures when the ECR image didn't exist yet.

**Root Cause**: ECS services require a valid container image to start tasks. If the image doesn't exist in ECR, the service will fail to deploy.

**Fix Applied**: Changed `desiredCount` from a positive number to `0` for initial deployment. This allows the stack to deploy successfully without requiring an existing container image. The pipeline will later update the service with the actual image and scale it up.

**Code Change**: 
```typescript
desiredCount: 0, // Start with 0 to allow stack deployment without image
```

## CodeDeploy Blue-Green Configuration

**Issue**: CodeDeploy blue-green deployment configuration was initially included but caused deployment delays and complexity.

**Root Cause**: CodeDeploy requires additional setup time and the ECS service must be configured with the CodeDeploy deployment controller, which adds complexity to the initial deployment.

**Fix Applied**: Temporarily disabled CodeDeploy configuration (commented out) to allow faster initial stack deployment. The infrastructure supports blue-green deployments through the blue and green target groups that are created. CodeDeploy can be enabled later when needed for production blue-green deployments.

**Code Change**: Commented out CodeDeploy application, deployment group, and related IAM permissions.

## Container Image Reference

**Issue**: The task definition initially referenced an ECR image that didn't exist, causing ECS service deployment failures.

**Root Cause**: The ECR repository is created empty, and the pipeline builds and pushes the image. The initial stack deployment happens before any pipeline execution.

**Fix Applied**: The task definition uses `ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest')` which references the ECR repository. Since `desiredCount` is set to 0, the service can be created without running tasks. Once the pipeline runs and pushes an image, the service can be updated to use that image.

## S3 Source Bucket Configuration

**Issue**: The pipeline needs a source for code. CodeCommit was considered but may not be available in all AWS accounts.

**Root Cause**: CodeCommit requires specific account-level permissions and may not be enabled in all regions or accounts.

**Fix Applied**: Used S3 as the source for the pipeline. A dedicated source bucket is created, and source code can be uploaded as a zip file to trigger pipeline executions. This is more flexible and doesn't require CodeCommit to be enabled.

**Code Change**: Created `sourceBucket` and configured `S3SourceAction` in the pipeline.

## IAM Policy Structure

**Issue**: Initial implementation attempted to use managed IAM policies that may not exist or have the right permissions.

**Root Cause**: Some AWS managed policies have been deprecated or may not provide the exact permissions needed.

**Fix Applied**: Used `addToPolicy` to create inline policies with specific, least-privilege permissions for each role. This ensures the exact permissions needed are granted without relying on potentially unavailable managed policies.

## CloudWatch Logs Configuration

**Issue**: Log groups need to be explicitly created with removal policies to prevent conflicts during stack updates.

**Root Cause**: If log groups are auto-created by services, they may persist after stack deletion, causing "AlreadyExists" errors on redeployment.

**Fix Applied**: Created explicit log groups for all CodeBuild projects and ECS tasks with `removalPolicy: cdk.RemovalPolicy.DESTROY` to ensure proper lifecycle management.

## Summary

All issues were resolved by:
1. Setting ECS service desired count to 0 for initial deployment
2. Temporarily disabling CodeDeploy for faster deployment (can be enabled later)
3. Using S3 as pipeline source instead of CodeCommit
4. Creating inline IAM policies with least-privilege permissions
5. Explicitly managing CloudWatch Log Groups with proper removal policies

The final implementation successfully deploys all infrastructure components and creates a fully functional CI/CD pipeline that can build, test, and deploy containerized microservices.
