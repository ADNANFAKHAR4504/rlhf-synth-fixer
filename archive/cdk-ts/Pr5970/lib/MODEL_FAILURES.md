# Model Failures and Fixes

This document explains the key issues encountered during implementation and how they were resolved.

## Issue 1: ECS Service Reference for CodeDeploy

**Problem:** The initial implementation attempted to reference ECS services using methods that don't exist in CDK v2, such as `BaseService.fromServiceArn()` or `BaseService.fromServiceAttributes()`.

**Fix:** Created minimal `FargateService` instances with `desiredCount: 0` and placeholder task definitions. These services serve as references for CodeDeploy without actually deploying containers. The services are only created when valid service ARNs are provided via context variables, allowing for minimal configuration when infrastructure doesn't exist yet.

## Issue 2: Conditional Deployment Stages

**Problem:** The pipeline attempted to create deployment stages and ECS resources even when the underlying infrastructure (clusters, VPCs, load balancers) didn't exist, causing deployment failures.

**Fix:** Implemented conditional logic that checks if valid service ARNs are provided via context. When service ARNs are not provided (using default placeholder values), the deployment stages (`DeployStaging`, `ApprovalStage`, `DeployProduction`) are skipped entirely. This allows the pipeline to be deployed in a minimal configuration mode.

## Issue 3: IAM Managed Policies Not Available

**Problem:** Attempted to use managed policies `AWSCodePipelineFullAccess` and `AWSCodeDeployRoleForECS` which don't exist or aren't attachable in all AWS accounts.

**Fix:** Replaced managed policies with detailed inline policies that grant only the necessary permissions for CodePipeline and CodeDeploy operations. This ensures the stack works across all AWS accounts and follows least-privilege principles.

## Issue 4: KMS Key Permissions for CloudWatch Logs

**Problem:** CloudWatch Log Groups failed to create because the KMS key didn't grant permissions to the CloudWatch Logs service principal.

**Fix:** Added explicit grant to the `logs.{region}.amazonaws.com` service principal with permissions for `kms:Encrypt`, `kms:Decrypt`, `kms:ReEncrypt*`, `kms:GenerateDataKey*`, and `kms:DescribeKey`.

## Issue 5: ECR Repository Cleanup

**Problem:** ECR repositories couldn't be deleted during stack destruction because they contained images and didn't have proper lifecycle policies.

**Fix:** Added `removalPolicy: DESTROY` and `emptyOnDelete: true` to the ECR repository definition, ensuring images are deleted when the repository is removed.

## Issue 6: KMS Key Cleanup

**Problem:** KMS keys were skipped during stack deletion because they require a waiting period.

**Fix:** Added `removalPolicy: DESTROY` and `pendingWindow: cdk.Duration.days(7)` to the KMS key, allowing it to be scheduled for deletion with a 7-day waiting period.

## Issue 7: Application Load Balancer Listener Attributes

**Problem:** When importing Application Listeners using `fromApplicationListenerAttributes`, the `securityGroup` property was missing, causing validation errors.

**Fix:** Added `securityGroup` property using `ec2.SecurityGroup.fromSecurityGroupId()` when creating listener attributes. This provides the necessary security group reference for the listener.

## Issue 8: VPC Subnet Configuration

**Problem:** When using `Vpc.fromVpcAttributes`, the VPC didn't have properly defined subnet groups, causing errors when ECS services tried to reference them.

**Fix:** Explicitly provided `publicSubnetIds` and `privateSubnetIds` arrays when creating VPC attributes, ensuring the subnet groups are properly defined even with minimal configuration.

## Issue 9: CodeBuild Cache Configuration

**Problem:** Used deprecated `Cache.s3()` method which doesn't exist in CDK v2.

**Fix:** Changed to `Cache.bucket()` method which is the correct API for S3-based caching in CodeBuild.

## Issue 10: CloudWatch Log Retention

**Problem:** Used `RetentionDays.THIRTY_DAYS` which doesn't exist in the CDK API.

**Fix:** Changed to `RetentionDays.ONE_MONTH` which is the correct constant for 30-day retention.

## Summary

The main theme of these fixes was adapting the implementation to work with minimal configuration - allowing the stack to be deployed even when the target ECS infrastructure doesn't exist yet. This was achieved through conditional resource creation based on context variables, proper use of CDK v2 APIs, and ensuring all required permissions and configurations are in place for cross-account and multi-environment deployments.
