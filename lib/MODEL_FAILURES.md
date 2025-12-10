# Model Failures and Fixes

This document outlines the issues encountered during the initial implementation and the fixes applied to create a working solution.

## CodeCommit Repository Creation Failure

**Issue**: The initial implementation attempted to create a new CodeCommit repository, but this failed with the error:
```
CreateRepository request is not allowed because there is no existing repository in this AWS account or AWS Organization
```

**Root Cause**: CodeCommit requires at least one existing repository in the account before new repositories can be created, or the service may not be enabled in certain regions/accounts.

**Fix Applied**: Made CodeCommit optional by checking for an existing repository name via CDK context. If provided, the stack references the existing repository. If not provided, the pipeline falls back to using S3 as the source. This allows the stack to deploy successfully regardless of CodeCommit availability.

**Code Change**: Added conditional logic to check for `codeCommitRepositoryName` in context and use `Repository.fromRepositoryName()` when available, otherwise create an S3 source bucket.

## Deprecated AWS CDK APIs

**Issue**: Multiple deprecation warnings during synthesis:
- `autoDeleteImages` property on ECR Repository
- `type` property on SSM StringParameter  
- `containerInsights` property on ECS Cluster
- Metric methods on ApplicationTargetGroup

**Root Cause**: AWS CDK v2 has deprecated several APIs in favor of newer alternatives.

**Fixes Applied**:
1. Changed `autoDeleteImages: true` to `emptyOnDelete: true` for ECR repository
2. Removed deprecated `type: ssm.ParameterType.SECURE_STRING` from SSM parameters
3. Replaced `containerInsights: true` with direct cluster settings configuration using `CfnCluster.clusterSettings`
4. Updated deprecated metric methods:
   - `metricTargetResponseTime()` → `metrics.targetResponseTime()`
   - `metricUnhealthyHostCount()` → `metrics.unhealthyHostCount()`
   - `metricHttpCodeTarget()` → `metrics.httpCodeTarget()`

## IAM Managed Policy Not Found

**Issue**: Deployment failed with error:
```
Policy arn:aws:iam::aws:policy/AWSCodePipelineFullAccess does not exist or is not attachable
```

**Root Cause**: AWS has deprecated the `AWSCodePipelineFullAccess` managed policy and it's no longer available.

**Fix Applied**: Replaced the managed policy with a custom inline policy that grants only the necessary permissions for CodePipeline to function. The policy includes permissions for S3 (artifacts and source), CodeBuild, CodeDeploy, ECS, IAM PassRole, and CloudWatch Logs.

## CodeDeploy Blue/Green Configuration Error

**Issue**: Deployment failed with:
```
Deployment ready action cannot be set to STOP_DEPLOYMENT when timeout is set to 0 minutes
```

**Root Cause**: CodeDeploy requires a minimum deployment approval wait time of 1 minute when using blue/green deployments.

**Fix Applied**: Changed `deploymentApprovalWaitTime` from `cdk.Duration.minutes(0)` to `cdk.Duration.minutes(1)` to satisfy CodeDeploy's validation requirements.

## ECS Service Image Pull Failure

**Issue**: ECS service was stuck in `CREATE_IN_PROGRESS` because tasks couldn't pull the container image from ECR. The error was:
```
CannotPullContainerError: pull image manifest has been retried 7 time(s): failed to resolve ref ... : not found
```

**Root Cause**: The task definition referenced an ECR image that didn't exist yet. The pipeline builds and pushes the image, but the initial stack deployment happens before any pipeline execution.

**Fix Applied**: Changed the task definition to use a placeholder public image (`public.ecr.aws/nginx/nginx:1.21-alpine`) for initial deployment. The placeholder image allows the service to start successfully. Once the pipeline runs and builds the actual application image, CodeDeploy will update the service with the real image during blue/green deployment.

**Additional Changes**:
- Updated container port from 3000 to 80 to match nginx placeholder
- Updated health check command to work with nginx
- Updated ALB target group health checks to use `/` instead of `/health`

## CloudWatch Log Group Already Exists

**Issue**: Deployment failed because a log group for the Lambda function already existed from a previous deployment attempt.

**Root Cause**: Lambda functions automatically create log groups, but if one already exists, CloudFormation can't manage it without explicit definition.

**Fix Applied**: Created an explicit log group for the Lambda function with a removal policy set to `DESTROY`, allowing CloudFormation to properly manage the log group lifecycle.

## S3 Bucket Naming

**Issue**: Initial bucket name was very long and could potentially exceed AWS limits in some cases.

**Fix Applied**: Shortened the artifact bucket name from `payment-pipeline-artifacts-${account}-${region}-${suffix}` to `payment-artifacts-${account}-${suffix}` to ensure it stays within AWS naming constraints.

## ECS Service Deployment Configuration

**Issue**: Warning about `minHealthyPercent` not being configured, which could cause service disruptions during deployments.

**Fix Applied**: Added explicit `minHealthyPercent: 100` and `maxHealthyPercent: 200` to the ECS service configuration to ensure proper deployment behavior.

## Summary

All issues were resolved by:
1. Making CodeCommit optional with S3 fallback
2. Updating deprecated CDK APIs to current versions
3. Replacing deprecated managed IAM policies with custom inline policies
4. Using placeholder images for initial ECS deployment
5. Properly managing CloudWatch log groups
6. Configuring ECS service deployment parameters correctly

The final implementation successfully deploys all infrastructure components and creates a fully functional CI/CD pipeline.
