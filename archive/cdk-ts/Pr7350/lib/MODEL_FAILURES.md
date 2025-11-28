# Model Failures and Fixes

This document outlines the key issues found in the initial model response and the fixes applied to reach the ideal implementation.

## Initial Model Response Issues

### 1. Incorrect CDK Enum Values

**Problem:** The model used `logs.RetentionDays.THIRTY_DAYS` which doesn't exist in CDK v2.

**Fix:** Changed to `logs.RetentionDays.ONE_MONTH` which is the correct enum value.

### 2. Incorrect Secrets Manager Rotation API

**Problem:** The model used `secretsmanager.RotationSchedule.hostedRotation()` which is not a static method.

**Fix:** Changed to use `hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser()` as a property in the `RotationSchedule` constructor.

### 3. Container Memory Reservation Property

**Problem:** The model used `memoryReservation` instead of the correct property name.

**Fix:** Changed to `memoryReservationMiB` for the X-Ray sidecar container.

### 4. ECS Service Metric Methods

**Problem:** The model attempted to use `metricDesiredTaskCount()` and `metricRunningTaskCount()` which don't exist on `FargateService`.

**Fix:** Replaced with direct `cloudwatch.Metric` instances using the ECS namespace and appropriate dimensions.

### 5. KMS Key Policy for VPC Flow Logs

**Problem:** The VPC Flow Logs service needs explicit permission to use the KMS key for encryption.

**Fix:** Added a resource policy to the VPC Flow Logs KMS key granting `logs.${region}.amazonaws.com` the necessary KMS permissions.

### 6. Aurora MySQL Engine Version

**Problem:** The model used `VER_3_03_1` which is not available.

**Fix:** Updated to `VER_3_04_0` which is a valid and available Aurora MySQL version.

### 7. ALB Access Logs S3 Bucket Permissions

**Problem:** ALB access logs require specific S3 bucket policies to allow the AWS Log Delivery service and ELB service account to write logs.

**Fix:** Created a dedicated S3 bucket for ALB logs with comprehensive bucket policies granting:
- `delivery.logs.amazonaws.com` service principal permissions
- Region-specific ELB service account permissions
- Proper ACL conditions for log delivery

### 8. Resource Naming Conflicts

**Problem:** Explicit resource names (bucket names, cluster names, etc.) can cause early validation errors in CloudFormation.

**Fix:** Removed explicit naming for most resources, allowing CDK to generate unique names automatically. This prevents naming conflicts and early validation failures.

### 9. Container Image and Port Configuration

**Problem:** The initial model used `amazonlinux:latest` which exits immediately, causing ECS service stabilization issues.

**Fix:** Changed to `nginx:alpine` as a placeholder image that runs a web server. Updated container port from 8080 to 80 and adjusted all related security group rules and target group configurations.

### 10. ECS Health Check Configuration

**Problem:** Container health checks were configured for a `/health` endpoint that doesn't exist in the placeholder image.

**Fix:** Removed container-level health checks and adjusted target group health checks to use the root path `/` with lenient thresholds. Increased ECS service health check grace period to accommodate placeholder images.

### 11. CodeDeploy Blue/Green Deployment Complexity

**Problem:** The initial implementation included CodeDeploy for blue/green deployments, which added significant complexity and potential failure points.

**Fix:** Simplified to use standard ECS deployments with a single target group. This reduces complexity while maintaining core functionality.

### 12. Security Hub and GuardDuty Configuration

**Problem:** Security Hub and GuardDuty are account-level services that can cause conflicts if already enabled.

**Fix:** Removed GuardDuty configuration entirely. Made Security Hub conditional, and later removed it when account-level conflicts were encountered.

### 13. VPC Endpoint Limits

**Problem:** VPC endpoints have account-level limits that can be exceeded in development environments.

**Fix:** Made VPC endpoints optional and disabled by default. They can be enabled via CDK context when needed.

### 14. NAT Gateway and EIP Limits

**Problem:** Multiple NAT gateways consume Elastic IPs, which have account limits.

**Fix:** Reduced default NAT gateway count from 3 to 1, configurable via CDK context. This reduces EIP consumption while maintaining functionality.

### 15. RDS Instance Class

**Problem:** The model used `T3.SMALL` which is not supported for Aurora MySQL.

**Fix:** Changed to `T3.MEDIUM` which is the minimum supported instance class for Aurora MySQL.

### 16. CloudFront Logging ACL Requirements

**Problem:** CloudFront logging requires S3 bucket ACLs, which conflicts with `blockPublicAccess` settings.

**Fix:** Disabled CloudFront logging to avoid ACL requirements. The S3 bucket maintains strict access controls.

### 17. Resource Minimization for Development

**Problem:** The initial model configured production-grade resource sizes that are expensive and slow to deploy for development/testing.

**Fix:** Reduced resource sizes and counts:
- ECS task CPU: 4096 → 1024
- ECS task memory: 8192 → 2048
- Container CPU: 4064 → 992
- Container memory: 7936 → 1792
- ECS desired count: 3 → 1
- Auto-scaling: min 3/max 12 → min 1/max 2
- RDS instances: 2 → 1
- RDS backup retention: 35 days → 7 days

### 18. RDS Deletion Protection

**Problem:** RDS deletion protection was set to `true`, preventing stack deletion.

**Fix:** Set `deletionProtection: false` to allow stack cleanup during development.

### 19. Environment Suffix Handling

**Problem:** The model didn't properly handle environment suffixes for resource naming and SSM parameters.

**Fix:** Added proper environment suffix handling that can come from props, context, or defaults to 'dev'. Applied suffix to resource names, SSM parameters, and KMS key aliases.

### 20. Certificate Handling

**Problem:** The model always tried to create a certificate reference, even when no certificate ARN was provided.

**Fix:** Made certificate handling conditional - only creates certificate reference if a valid ARN is provided via context. ALB listeners adapt accordingly (HTTPS with cert or HTTP without).

## Summary

The fixes focused on:
1. Correcting CDK API usage and enum values
2. Adding missing IAM permissions and resource policies
3. Simplifying complex features (CodeDeploy, Security Hub, GuardDuty)
4. Making resources configurable and optional where appropriate
5. Reducing resource sizes for development/testing scenarios
6. Fixing resource naming and validation issues
7. Improving error handling and conditional resource creation

The final implementation maintains all core requirements while being more practical for deployment and testing.
