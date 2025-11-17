# Infrastructure Fixes Applied

This document outlines the key infrastructure issues that were identified and resolved during the implementation of the ECS Fargate blue/green deployment stack.

## Initial Deployment Blocking Issues

### 1. ECR Image Missing on Initial Deployment

**Problem:** The ECS service was configured with `desiredCount: 2` and `minHealthyPercent: 100`, but the ECR repository was empty. This caused the deployment to fail because ECS couldn't pull the container image.

**Fix:** Changed the service configuration to start with `desiredCount: 0` and `minHealthyPercent: 0`. This allows the stack to deploy successfully even when no image exists in ECR. After pushing an image, the service can be scaled up manually or via CodeDeploy.

**Impact:** Enables infrastructure deployment before container images are available, supporting a two-phase deployment workflow.

### 2. Container Insights Configuration

**Problem:** The deprecated `containerInsights: true` property was used in the cluster configuration, which generated warnings and may not work in future CDK versions.

**Fix:** Replaced with direct cluster settings configuration using `CfnCluster.clusterSettings` to enable Container Insights. This uses the current recommended approach for enabling Container Insights.

**Impact:** Eliminates deprecation warnings and ensures compatibility with future CDK versions.

### 3. CodeDeploy Auto-Rollback Configuration

**Problem:** The `deploymentInAlarm` option was included in the auto-rollback configuration, but no CloudWatch alarms were associated with the deployment group. This caused a validation error.

**Fix:** Removed `deploymentInAlarm: true` from the auto-rollback configuration, keeping only `failedDeployment: true` and `stoppedDeployment: true`.

**Impact:** Resolves validation errors and ensures auto-rollback works correctly for deployment failures and manual stops.

### 4. Circuit Breaker Incompatibility

**Problem:** The ECS service had `circuitBreaker` enabled, but this is incompatible with CodeDeploy deployment controller.

**Fix:** Removed the `circuitBreaker` configuration from the service. CodeDeploy provides its own deployment safety mechanisms.

**Impact:** Prevents deployment errors and allows CodeDeploy to manage deployments properly.

## Resource Naming and Organization

### 5. Environment Suffix in Resource Names

**Problem:** Resource names didn't consistently include the environment suffix, making it difficult to identify resources across environments.

**Fix:** Added `environmentSuffix` parameter to all resource names (VPC, cluster, ECR repository, ALB, service, target groups, IAM roles, etc.). The suffix is obtained from stack props, context, or defaults to 'dev'.

**Impact:** Enables proper multi-environment deployments and resource identification.

### 6. Removal Policies

**Problem:** Some resources that should be easily deletable (like ECR repository, log groups, SNS topics) didn't have explicit removal policies set.

**Fix:** Added `RemovalPolicy.DESTROY` to ECR repository, CloudWatch log group, and SNS topic. This allows clean stack deletion in non-production environments.

**Impact:** Simplifies cleanup and testing workflows.

## Auto-Scaling Configuration

### 7. Initial Auto-Scaling Capacity

**Problem:** Auto-scaling was configured with `minCapacity: 2`, but the service starts with `desiredCount: 0`. This created a mismatch.

**Fix:** Set auto-scaling `minCapacity: 0` to match the service's initial desired count. This allows the service to scale from zero after the initial image is pushed.

**Impact:** Aligns auto-scaling configuration with the service's initial state and prevents scaling conflicts.

## Health Check Configuration

### 8. Health Check Grace Period

**Problem:** The default health check grace period might be too short for containers that take time to start up and become healthy.

**Fix:** Set `healthCheckGracePeriod` to 300 seconds (5 minutes) to give containers adequate time to start and pass health checks.

**Impact:** Reduces false negatives during container startup and improves deployment success rates.

## Security Group Configuration

### 9. Task Security Group Isolation

**Problem:** Task security group needed explicit ingress rules to allow traffic only from the ALB.

**Fix:** Created a dedicated security group for tasks and added an ingress rule that allows traffic on port 8080 only from the ALB security group. This follows the principle of least privilege.

**Impact:** Improves security posture by restricting task network access to only necessary sources.

## Monitoring and Observability

### 10. CloudWatch Alarm Configuration

**Problem:** Alarms were created but needed proper SNS integration for notifications.

**Fix:** Created an SNS topic for alarms and configured all alarms (CPU, unhealthy tasks, deployment failures) to send notifications to this topic.

**Impact:** Enables proactive monitoring and alerting for infrastructure issues.

## Summary

These fixes ensure the infrastructure:
- Deploys successfully even without pre-existing container images
- Uses current CDK best practices and avoids deprecated features
- Properly integrates CodeDeploy for blue/green deployments
- Supports multi-environment deployments with proper naming
- Implements security best practices with least-privilege access
- Provides comprehensive monitoring and alerting

The final implementation supports a production-ready ECS Fargate deployment with zero-downtime updates via CodeDeploy blue/green deployments.
