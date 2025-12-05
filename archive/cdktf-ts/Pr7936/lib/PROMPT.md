# CI/CD Pipeline Integration with Pulumi

Hey, we need to modernize our CI/CD infrastructure by moving from Jenkins to AWS-native services, and we need your help building this using **Pulumi with Go**.

## Background

A software development team needs to modernize their CI/CD infrastructure by moving from Jenkins to AWS-native services. They want to use Pulumi for infrastructure management and integrate it directly into their pipeline to enable automated infrastructure updates alongside application deployments.

## Environment

AWS multi-account setup in us-east-1 region with separate Dev (123456789012) and Prod (987654321098) accounts. Requires Pulumi CLI 3.x, Go 1.19+, AWS CLI configured with cross-account assume role permissions. Pipeline runs in shared services account with CodePipeline, CodeBuild, S3 for artifacts, EventBridge for triggers. VPC endpoints required for private CodeBuild access to S3 and ECR.

## Requirements

Create a Pulumi Go program to deploy a CI/CD pipeline that automates Pulumi infrastructure deployments. The configuration must:

1. Set up an S3 bucket for Pulumi state with versioning and KMS encryption enabled
2. Create CodeBuild projects for running 'pulumi preview' in Test stage and 'pulumi up' in Deploy stages
3. Configure CodePipeline with Source stage connected to GitHub via CodeStar connection
4. Add Build stage that compiles application code and prepares deployment artifacts
5. Implement Test stage that runs Pulumi preview to validate infrastructure changes
6. Add manual approval action between Dev and Prod deployment stages
7. Configure EventBridge rule to trigger pipeline on version tags
8. Set up SNS topic and subscription for pipeline failure notifications
9. Create SSM parameters for Pulumi access token and stack configuration
10. Implement cross-account IAM roles for deploying to Dev and Prod accounts

## Mandatory Constraints

- Use SSM Parameter Store to manage Pulumi access tokens and configuration
- CodeBuild must assume a specific IAM role with least-privilege permissions
- Store Pulumi state in S3 with server-side encryption using AWS KMS

## Optional Constraints (Implement as many as possible)

- Use EventBridge to trigger pipeline on Git tag pushes matching pattern v*.*.*
- Pipeline artifacts must be stored in S3 with lifecycle policy to expire after 30 days
- Pipeline must send SNS notifications on failure to a dedicated topic
- Use AWS CodePipeline with exactly 5 stages: Source, Build, Test, Deploy-Dev, Deploy-Prod
- CodeBuild projects must use compute type BUILD_GENERAL1_MEDIUM
- Enable CloudWatch Logs for all CodeBuild projects with 7-day retention
- Deploy infrastructure changes must require manual approval between Dev and Prod stages

## Expected Output

A complete Pulumi Go program that creates a fully automated CI/CD pipeline capable of deploying both application code and infrastructure changes across multiple AWS accounts with proper security controls and approval workflows.

## Critical Implementation Notes

1. **Resource Naming**: ALL resource names MUST include the environment suffix parameter to support parallel deployments. In Pulumi Go, use string concatenation like `resourceName + "-" + environmentSuffix`.

2. **Destroyability**: Do NOT set deletion protection or retention policies that prevent cleanup. This is a synthetic task that needs to be cleanable.

3. **Platform Compliance**: This MUST be implemented using Pulumi with Go as specified in the metadata. Do not use any other platform or language.

4. **AWS Services**: Focus on CodePipeline, CodeBuild, S3, KMS, SSM Parameter Store, EventBridge, SNS, IAM, and CloudWatch Logs.

5. **Security**: Implement least-privilege IAM policies for all roles, enable encryption at rest for S3 and SSM parameters, and ensure cross-account access is properly scoped.

6. **Multi-Account**: Properly configure IAM roles and trust relationships to enable CodePipeline and CodeBuild in the shared services account to deploy to Dev and Prod accounts.

7. **Testing**: Ensure the infrastructure can be validated with unit tests and deployed successfully to AWS.
