# Model Failures

This document identifies areas where AI models commonly struggle when generating CI/CD pipeline infrastructure using AWS CDK with Python.

## 1. Incomplete Pipeline Integration

**Common Failure**: Models often create individual components (CodeCommit, CodeBuild, CodeDeploy) but fail to properly integrate them into a complete pipeline.

**Why This Happens**: The model treats each service as independent rather than understanding the dependencies and integration points required for a functioning CI/CD system.

**Impact**: Results in disconnected resources that cannot trigger automated deployments.

## 2. Missing Blue-Green Deployment Configuration

**Common Failure**: Models create ECS services but omit the proper target group configuration and CodeDeploy integration needed for blue-green deployments.

**Why This Happens**: Blue-green deployment requires coordination between ALB target groups, ECS services, and CodeDeploy deployment groups - a complex relationship that models struggle to implement correctly.

**Impact**: Deployments lack zero-downtime capability, defeating a key requirement.

## 3. Inadequate IAM Role Permissions

**Common Failure**: Models create IAM roles with either overly broad permissions (e.g., `*` resources) or insufficient permissions that cause pipeline failures.

**Why This Happens**: Models lack understanding of the specific API actions each service needs and often default to broad permissions or miss critical cross-service permissions.

**Impact**: Security risks from over-permissioned roles or deployment failures from under-permissioned roles.

## 4. Incorrect Environment Suffix Handling

**Common Failure**: Models inconsistently apply environment suffixes across resources, leading to naming collisions or deployment failures in multi-environment setups.

**Why This Happens**: Models don't maintain state about naming conventions across the entire stack generation.

**Impact**: Resource conflicts when deploying to multiple environments or inability to identify resources by environment.

## 5. Missing CloudWatch Logs Configuration

**Common Failure**: Models create services without proper logging configuration or with inadequate log retention policies.

**Why This Happens**: Logging is often treated as optional or "nice-to-have" rather than a critical observability requirement.

**Impact**: Difficulty troubleshooting pipeline failures and lack of audit trail.

## 6. Incomplete SNS Notification Setup

**Common Failure**: Models create SNS topics but forget to add subscriptions or fail to integrate them with pipeline state change events.

**Why This Happens**: The notification flow requires understanding of EventBridge rules, SNS topics, and subscriptions - multiple services that must work together.

**Impact**: Team doesn't receive alerts about pipeline failures.

## 7. Missing Parameter Store Integration

**Common Failure**: Models fail to create Parameter Store entries for secrets like Docker Hub credentials or don't properly reference them in CodeBuild.

**Why This Happens**: Secure credential management is a cross-cutting concern that models often overlook or implement incorrectly.

**Impact**: Build failures due to missing credentials or security risks from hardcoded secrets.

## 8. Incorrect Docker Image Build Specification

**Common Failure**: Models create CodeBuild projects but provide incorrect or missing buildspec files, especially for Docker image building and ECR push operations.

**Why This Happens**: Buildspec YAML syntax and Docker buildx commands require precise formatting that models struggle with.

**Impact**: Build stage failures preventing any code from reaching deployment.

## 9. Insufficient Test Coverage

**Common Failure**: Models generate infrastructure code but provide minimal or no unit tests, missing critical resource validations.

**Why This Happens**: Testing is typically an afterthought in code generation, and models don't understand what aspects of IaC require testing.

**Impact**: Undetected configuration errors that only surface during deployment.

## 10. Missing Removal Policies

**Common Failure**: Models create stateful resources (S3 buckets, ECR repositories) without RemovalPolicy configuration, causing stack deletion failures.

**Why This Happens**: Models don't consider the full lifecycle management of resources beyond initial creation.

**Impact**: Stack gets stuck during deletion, requiring manual intervention.
