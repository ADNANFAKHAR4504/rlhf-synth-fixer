# Task: CI/CD Pipeline with AWS CodePipeline

## Platform: CloudFormation
## Language: YAML
## Difficulty: expert

## Problem Statement

Create a CloudFormation template to deploy a multi-stage CI/CD pipeline using AWS CodePipeline. The configuration must:

MANDATORY REQUIREMENTS (Must complete):
1. Create a CodePipeline with stages for source, build, test, and deploy (CORE: CodePipeline)
2. Configure CodeBuild projects for unit testing and security scanning (CORE: CodeBuild)
3. Set up cross-account IAM roles for deploying to staging and production accounts
4. Create S3 bucket for pipeline artifacts with versioning and lifecycle policies
5. Implement KMS key for artifact encryption with proper key policies
6. Configure EventBridge rules to notify on pipeline state changes
7. Add manual approval stage before production deployment
8. Use CloudFormation parameters for account IDs and resource naming

OPTIONAL ENHANCEMENTS (If time permits):
• Add CodeDeploy for blue-green deployments (OPTIONAL: CodeDeploy) - enables zero-downtime deployments
• Implement Lambda function for custom security gate (OPTIONAL: Lambda) - adds flexible validation logic
• Configure SNS topics for failure notifications (OPTIONAL: SNS) - improves incident response time

Expected output: A parameterized CloudFormation YAML template that creates a complete CI/CD pipeline with cross-account deployment capabilities, security scanning, and proper IAM permissions.

## Task Metadata

- **Task ID**: 101912490
- **Subtask**: AWS CloudFormation
- **Subject Labels**: aws, infrastructure, ci/cd-pipeline-integration
- **Region**: us-east-1

## Constraints

- Platform: CloudFormation (MANDATORY)
- Language: YAML (MANDATORY)
- Complexity: expert
- Turn Type: single

## Instructions

1. Read and understand the problem requirements
2. Design the CloudFormation template structure
3. Implement all MANDATORY requirements
4. Add OPTIONAL enhancements if time permits
5. Test the template for syntax and logical errors
6. Document any assumptions or design decisions
