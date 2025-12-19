# Model Failures

This document explains the issues found in the MODEL_RESPONSE and the fixes applied to create the IDEAL_RESPONSE.

## Primary Issue: Wrong Deliverable Type

**Problem**: The MODEL_RESPONSE provided a CloudFormation template that defines AWS infrastructure resources (VPCs, ECR, CodeCommit, CodePipeline, etc.) directly.

**Issue**: The requirement was for a GitHub Actions workflow (`ci-cd.yml`) that orchestrates CI/CD deployments using CDK, not a CloudFormation template that creates the infrastructure.

**Fix**: Created a GitHub Actions workflow that:
- Uses CDK to deploy infrastructure (infrastructure-as-code)
- Orchestrates the CI/CD pipeline stages
- Integrates with existing AWS resources rather than creating them

## Missing Critical Features

### 1. ECR Image Scanning
**Problem**: MODEL_RESPONSE defined ECR with scanning enabled but didn't implement scanning validation in the pipeline.

**Fix**: Added ECR image scan validation step that:
- Waits for scan completion
- Checks for critical vulnerabilities
- Fails the build if critical issues are found

### 2. Test Stage
**Problem**: MODEL_RESPONSE had test projects defined but no dedicated test stage in the pipeline flow.

**Fix**: Added dedicated `test` job that:
- Runs unit tests
- Runs integration tests
- Executes before deployment stages

### 3. Parameter Store Integration
**Problem**: MODEL_RESPONSE created Parameter Store resources but didn't show how to access them during deployment.

**Fix**: Added steps to retrieve Parameter Store values:
- `/app/dev/*` for development
- `/app/staging/*` for staging
- `/app/prod/*` for production
- Uses KMS decryption for secure parameter access

### 4. CloudWatch Monitoring
**Problem**: MODEL_RESPONSE defined CloudWatch alarms but didn't verify them after deployments.

**Fix**: Added CloudWatch alarm checks:
- Verifies alarm states after staging and production deployments
- Monitors for deployment rollback triggers
- Integrates with SNS notifications

### 5. Notification System
**Problem**: MODEL_RESPONSE used Slack webhooks instead of SNS as specified in requirements.

**Fix**: Replaced Slack webhooks with AWS SNS:
- Uses SNS topics for all deployment notifications
- Sends notifications for dev, staging, and production deployments
- Includes deployment status in notifications

### 6. Artifact Management
**Problem**: MODEL_RESPONSE defined S3 bucket for artifacts but didn't implement artifact encryption and retention in the workflow.

**Fix**: Implemented proper artifact management:
- KMS encryption for artifacts
- 30-day retention policy
- Secure artifact transfer between pipeline stages

### 7. GitHub OIDC Integration
**Problem**: MODEL_RESPONSE didn't show how to authenticate with AWS securely.

**Fix**: Implemented GitHub OIDC authentication:
- No long-lived credentials required
- Secure role assumption for each stage
- Cross-account role chaining for staging and production

### 8. CodeDeploy Blue/Green Monitoring
**Problem**: MODEL_RESPONSE configured CodeDeploy but didn't monitor deployments for rollback triggers.

**Fix**: Added deployment monitoring:
- Monitors CodeDeploy deployment status
- Checks for rollback conditions
- Verifies deployment health before completion

## Infrastructure Approach Differences

**MODEL_RESPONSE Approach**:
- CloudFormation template creates all AWS resources
- Infrastructure defined in YAML
- Resources created directly via CloudFormation

**IDEAL_RESPONSE Approach**:
- GitHub Actions workflow orchestrates deployments
- Infrastructure defined in CDK (TypeScript)
- CDK synthesizes CloudFormation and deploys it
- More flexible and maintainable for complex infrastructure

## YAML Linting Issues

**Problem**: MODEL_RESPONSE had YAML formatting issues that would fail yamllint validation.

**Fixes Applied**:
- Added document start marker (`---`)
- Fixed truthy value for `workflow_dispatch`
- Ensured all lines are under 80 characters
- Removed trailing spaces
- Added newline at end of file
- Proper line continuation for long shell commands

## Summary

The MODEL_RESPONSE created a comprehensive CloudFormation template but missed the key requirement of providing a GitHub Actions workflow. The IDEAL_RESPONSE addresses this by:

1. Providing a complete GitHub Actions workflow
2. Integrating all required features (ECR scanning, testing, monitoring)
3. Using proper AWS authentication (OIDC)
4. Implementing proper artifact and secret management
5. Following YAML best practices and linting rules
6. Using CDK for infrastructure deployment rather than raw CloudFormation
